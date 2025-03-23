"""
API endpoints for virtual try-on functionality
"""
import os
import shutil
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, BackgroundTasks, Body
from fastapi.responses import JSONResponse
from starlette.requests import Request
import requests
from dotenv import load_dotenv
from PIL import Image
import io
import base64
import uuid

from fastapi_backend.app.schemas.virtual_tryon import (
    TryOnRequest,
    TryOnResponse,
    TryOnQueryResponse,
    UploadFileResponse,
    GalleryResponse,
    Base64ImageUploadRequest,
    ImagePreprocessRequest
)
from fastapi_backend.services.virtual_tryon import VirtualTryOnService

router = APIRouter()

# Initialize service
virtual_tryon_service = VirtualTryOnService()

# Ensure upload directories exist


def ensure_upload_dirs_exist():
    upload_base = os.path.join(os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.dirname(__file__)))), "uploads")
    model_dir = os.path.join(upload_base, "models")
    clothing_dir = os.path.join(upload_base, "clothing")

    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(clothing_dir, exist_ok=True)

    return upload_base, model_dir, clothing_dir


# Create upload directories
ensure_upload_dirs_exist()


@router.post("/upload-model", response_model=UploadFileResponse)
async def upload_model_image(file: UploadFile = File(...)):
    """
    Upload a model image for virtual try-on
    """
    try:
        _, model_dir, _ = ensure_upload_dirs_exist()
        file_location = os.path.join(model_dir, file.filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the file URL
        return {"fileUrl": f"/uploads/models/{file.filename}"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error uploading file: {str(e)}")


@router.post("/upload-clothing", response_model=UploadFileResponse)
async def upload_clothing_image(file: UploadFile = File(...)):
    """
    Upload a clothing image for virtual try-on
    """
    try:
        _, _, clothing_dir = ensure_upload_dirs_exist()
        file_location = os.path.join(clothing_dir, file.filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the file URL
        return {"fileUrl": f"/uploads/clothing/{file.filename}"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error uploading file: {str(e)}")


@router.post("/submit", response_model=TryOnResponse)
async def submit_try_on(request: TryOnRequest):
    """
    Submit a virtual try-on request
    """
    try:
        # Process the request data
        request_data = request.dict()

        # Submit the try-on request
        response = await virtual_tryon_service.submit_try_on(request_data)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error submitting try-on request: {str(e)}")


@router.get("/query/{task_id}", response_model=TryOnQueryResponse)
async def query_try_on(task_id: str, provider: str = "aidge"):
    """
    Query the status of a virtual try-on task
    """
    try:
        # Query the try-on results
        response = await virtual_tryon_service.query_try_on_results(task_id, provider)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error querying try-on status: {str(e)}")


@router.post("/execute", response_model=TryOnQueryResponse)
async def execute_try_on(request: TryOnRequest, background_tasks: BackgroundTasks):
    """
    Execute a complete virtual try-on process
    """
    try:
        # Process the request data
        request_data = request.dict()

        # Execute the try-on process
        response = await virtual_tryon_service.execute_try_on(request_data)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error executing try-on: {str(e)}")


@router.get("/gallery", response_model=GalleryResponse)
async def get_gallery():
    """
    Get all saved try-on results for the gallery
    """
    try:
        # Get all gallery results
        results = await virtual_tryon_service.get_gallery_results()
        return {"results": results}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting gallery results: {str(e)}")


@router.post("/upload-base64", response_model=UploadFileResponse)
async def upload_base64_image(request_data: Base64ImageUploadRequest = Body(...)):
    """
    Upload a base64-encoded image for virtual try-on
    """
    try:
        # Extract data from request
        base64_image = request_data.base64_image
        image_type = request_data.image_type
        filename = request_data.filename

        # Ensure the base64 string doesn't have prefix like "data:image/jpeg;base64,"
        if ";" in base64_image and "," in base64_image:
            # Extract the actual base64 content after the comma
            base64_image = base64_image.split(",", 1)[1]

        # Decode base64 to binary
        image_data = base64.b64decode(base64_image)

        # Choose the appropriate directory based on image type
        _, model_dir, clothing_dir = ensure_upload_dirs_exist()
        if image_type == "model":
            target_dir = model_dir
            url_prefix = "/uploads/models/"
        else:  # clothing
            target_dir = clothing_dir
            url_prefix = "/uploads/clothing/"

        # Generate a unique filename if none provided
        if not filename:
            filename = f"{uuid.uuid4()}.jpg"

        # Save the image to the appropriate directory
        file_location = os.path.join(target_dir, filename)
        with open(file_location, "wb") as buffer:
            buffer.write(image_data)

        # Return the file URL
        return {"fileUrl": f"{url_prefix}{filename}"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error uploading base64 image: {str(e)}")


@router.post("/preprocess-and-upload", response_model=UploadFileResponse)
async def preprocess_and_upload(request_data: ImagePreprocessRequest = Body(...)):
    """
    Preprocess an image according to FASHN AI best practices and upload to ImageKit

    1. Resize to max height of 2000px while maintaining aspect ratio
    2. Convert to JPEG with quality 95
    3. Upload to ImageKit
    4. Return the URL
    """
    try:
        # Extract data from request
        base64_image = request_data.base64_image
        image_type = request_data.image_type
        filename = request_data.filename or f"{uuid.uuid4()}.jpg"
        maintain_portrait_ratio = request_data.maintain_portrait_ratio

        # Check if the image is a URL (not base64)
        if base64_image.startswith('http'):
            # It's a URL, download the image
            print(f"Downloading image from URL: {base64_image}")
            response = requests.get(base64_image, stream=True, timeout=10)
            if response.status_code != 200:
                raise Exception(
                    f"Failed to download image from URL: {response.status_code}")

            # Open image with PIL
            img = Image.open(io.BytesIO(response.content))
        else:
            # It's a base64 image
            # Ensure the base64 string doesn't have prefix like "data:image/jpeg;base64,"
            base64_content = base64_image
            if ";" in base64_image and "," in base64_image:
                # Extract the actual base64 content after the comma
                base64_content = base64_image.split(",", 1)[1]

            # Decode base64 to binary
            try:
                image_data = base64.b64decode(base64_content)
            except Exception as e:
                print(f"Error decoding base64: {str(e)}")
                # Try to download as URL if base64 decoding fails
                if base64_image.startswith(('http://', 'https://')):
                    print(
                        f"Attempting to download as URL instead: {base64_image}")
                    response = requests.get(
                        base64_image, stream=True, timeout=10)
                    if response.status_code != 200:
                        raise Exception(
                            f"Failed to download image from URL: {response.status_code}")
                    image_data = response.content
                else:
                    raise Exception(f"Invalid base64 data: {str(e)}")

            # Open image with PIL
            img = Image.open(io.BytesIO(image_data))

        # If maintain_portrait_ratio is True, crop to 9:16 ratio
        if maintain_portrait_ratio:
            # Calculate target dimensions for 9:16 ratio
            current_ratio = img.width / img.height
            target_ratio = 9 / 16  # Portrait ratio

            if current_ratio > target_ratio:  # Image is too wide
                # Calculate new width to maintain 9:16 ratio
                new_width = int(img.height * target_ratio)
                # Crop from center
                left = (img.width - new_width) // 2
                right = left + new_width
                img = img.crop((left, 0, right, img.height))
            elif current_ratio < target_ratio:  # Image is too tall
                # Calculate new height to maintain 9:16 ratio
                new_height = int(img.width / target_ratio)
                # Crop from center
                top = (img.height - new_height) // 2
                bottom = top + new_height
                img = img.crop((0, top, img.width, bottom))

        # Resize if height > 2000px while maintaining aspect ratio
        if img.height > 2000:
            ratio = 2000 / img.height
            new_width = int(img.width * ratio)
            img = img.resize((new_width, 2000), Image.LANCZOS)

        # Convert to RGB if needed (in case of RGBA)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Save as JPEG with quality 95
        output_buffer = io.BytesIO()
        img.save(output_buffer, format='JPEG', quality=95)
        output_buffer.seek(0)

        # Upload to ImageKit
        url = "https://upload.imagekit.io/api/v1/files/upload"
        files = {"file": (filename, output_buffer, "image/jpeg")}
        payload = {
            "fileName": filename,
            "publicKey": "public_gTBjx7RWLu8I8OqyodA+EWeCzVU=",
            "useUniqueFileName": "true",
            "folder": f"/virtual-tryon/{image_type}s"
        }
        headers = {
            "Accept": "application/json",
            "Authorization": f"Basic {os.getenv('IMAGEKIT_API_KEY')}"
        }

        response = requests.post(
            url, data=payload, files=files, headers=headers)

        if "error" in response.json():
            # If ImageKit upload fails, fall back to local storage
            print(f"ImageKit upload failed: {response.json()}")

            # Choose the appropriate directory based on image type
            _, model_dir, clothing_dir = ensure_upload_dirs_exist()
            if image_type == "model":
                target_dir = model_dir
                url_prefix = "/uploads/models/"
            else:  # clothing
                target_dir = clothing_dir
                url_prefix = "/uploads/clothing/"

            # Save the processed image to the appropriate directory
            file_location = os.path.join(target_dir, filename)
            with open(file_location, "wb") as buffer:
                output_buffer.seek(0)
                buffer.write(output_buffer.read())

            # Return the file URL
            return {"fileUrl": f"{url_prefix}{filename}", "width": img.width, "height": img.height}

        # Return the ImageKit URL and image dimensions
        return {
            "fileUrl": response.json().get("url"),
            "width": img.width,
            "height": img.height
        }
    except Exception as e:
        print(f"Error preprocessing and uploading image: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error preprocessing and uploading image: {str(e)}")
