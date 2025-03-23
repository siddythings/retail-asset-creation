import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from services.image_service import ImageService
import requests
import io
from PIL import Image
import base64
import uuid
import aiohttp
import os.path

router = APIRouter()
image_service = ImageService()


class UpscaleRequest(BaseModel):
    imageUrl: str
    scale: int = 2
    enhanceQuality: bool = True
    preserveDetails: bool = True
    removeNoise: bool = False


class UpscaleResponse(BaseModel):
    upscaledImageUrl: str
    originalImageUrl: str


@router.post("/upload", response_model=Dict[str, Any])
async def upload_image(file: UploadFile = File(...), image_type: str = "general"):
    """
    Upload an image to ImageKit and return the public URL.

    Args:
        file: The image file to upload
        image_type: Type of image (model, garment, general, etc.) - used for folder organization

    Returns:
        Dict containing the ImageKit response with file URL
    """
    try:
        # Log the request
        print(f"=== Starting image upload for {image_type} ===")
        print(f"File name: {file.filename}")

        url = "https://upload.imagekit.io/api/v1/files/upload"
        file_name = file.filename
        files = {"file": (file_name, await file.read(), file.content_type)}

        # Determine the folder based on image type
        folder = f"virtual-tryon/{image_type}s"

        payload = {
            "fileName": file_name,
            "publicKey": "public_gTBjx7RWLu8I8OqyodA+EWeCzVU=",
            "folder": folder,
            "useUniqueFileName": "true"
        }

        headers = {
            "Accept": "application/json",
            "Authorization": f"Basic {os.getenv('IMAGEKIT_API_KEY')}"
        }

        print(f"Uploading to ImageKit, folder: {folder}")
        response = requests.post(
            url, data=payload, files=files, headers=headers)
        response_data = response.json()

        if "error" in response_data:
            print(f"ImageKit upload error: {response_data}")
            return JSONResponse(
                status_code=response.status_code or 500,
                content={"error": response_data.get(
                    "error", "Unknown upload error")}
            )

        print(f"Upload successful: {response_data.get('url', '')}")
        return {
            "fileUrl": response_data.get("url", ""),
            "fileName": response_data.get("name", ""),
            "fileId": response_data.get("fileId", "")
        }

    except Exception as e:
        print(f"=== Error in image upload: {str(e)} ===")
        raise HTTPException(
            status_code=500, detail=f"Image upload failed: {str(e)}")


@router.post("/upscale", response_model=UpscaleResponse)
async def upscale_image(request: UpscaleRequest, req: Request):
    """
    Upscale an image using Bria AI API
    """
    try:
        # Log the request for debugging
        print("=== Starting image upscale request ===")
        print("Request data:", request.dict())
        print("BRIA_AUTH_TOKEN present:", bool(os.getenv("BRIA_AUTH_TOKEN")))

        # Validate the image URL
        if not request.imageUrl or not (request.imageUrl.startswith('http://') or request.imageUrl.startswith('https://')):
            raise HTTPException(
                status_code=400, detail="Invalid image URL provided")

        print("Calling image_service.upscale_image...")
        result = image_service.upscale_image(
            image_url=request.imageUrl,
            scale=request.scale,
            enhance_quality=request.enhanceQuality,
            preserve_details=request.preserveDetails,
            remove_noise=request.removeNoise
        )
        print("Image service result:", result)

        # Ensure we have the expected keys in the result
        if not result or not isinstance(result, dict) or "upscaledImageUrl" not in result:
            print("Invalid result structure:", result)
            raise HTTPException(
                status_code=500,
                detail="Invalid response from image service: missing upscaledImageUrl"
            )

        response_data = UpscaleResponse(
            upscaledImageUrl=result["upscaledImageUrl"],
            originalImageUrl=result["originalImageUrl"]
        )
        print("=== Successfully completed image upscale request ===")
        print("Response data:", response_data.dict())
        return response_data

    except HTTPException as he:
        print("=== HTTP Exception in upscale_image endpoint ===")
        print(f"Status code: {he.status_code}")
        print(f"Detail: {he.detail}")
        raise he
    except Exception as e:
        print("=== Unexpected error in upscale_image endpoint ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to upscale image: {str(e)}")


@router.post("/eraser", response_model=Dict[str, Any])
async def erase_image(
    mask_file: UploadFile = File(...),
    image_file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    content_moderation: bool = Form(True)
):
    """
    Use the Bria AI eraser API to erase a portion of an image based on a mask.

    Args:
        mask_file: Binary mask image file where white indicates areas to erase
        image_file: Image file to be edited (either this or image_url must be provided)
        image_url: URL of the image to be edited (either this or image_file must be provided)
        content_moderation: Whether to apply content moderation

    Returns:
        JSON with the URL of the processed image
    """
    try:
        print("=== Starting image eraser request ===")

        # Validate that either image_file or image_url is provided
        if not image_file and not image_url:
            raise HTTPException(
                status_code=400, detail="Either image_file or image_url must be provided")

        # Read the mask file
        mask_content = await mask_file.read()

        # If image_file is provided, read it
        image_content = None
        if image_file:
            image_content = await image_file.read()

        # Call image service method
        result = await image_service.erase_image(
            mask_file_content=mask_content,
            image_file_content=image_content,
            image_url=image_url,
            content_moderation=content_moderation
        )

        print("=== Successfully completed image eraser request ===")
        return result

    except HTTPException as he:
        print(f"=== HTTP Exception in erase_image endpoint: {he.detail} ===")
        raise he
    except Exception as e:
        print(f"=== Unexpected error in erase_image endpoint: {str(e)} ===")
        raise HTTPException(
            status_code=500, detail=f"Failed to process image: {str(e)}")


@router.post("/generative-fill", response_model=Dict[str, Any])
async def generative_fill(
    mask_file: UploadFile = File(...),
    prompt: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    negative_prompt: Optional[str] = Form(None),
    content_moderation: bool = Form(True)
):
    """
    Use the Bria AI generative fill API to fill a masked area with AI-generated content.

    Args:
        mask_file: Binary mask image file where white indicates areas to fill
        prompt: Text prompt describing what to fill in the masked area
        image_file: Image file to be edited (either this or image_url must be provided)
        image_url: URL of the image to be edited (either this or image_file must be provided)
        negative_prompt: Text describing what not to generate
        content_moderation: Whether to apply content moderation

    Returns:
        JSON with the URL of the processed image
    """
    try:
        print("=== Starting generative fill request ===")

        # Validate that either image_file or image_url is provided
        if not image_file and not image_url:
            raise HTTPException(
                status_code=400, detail="Either image_file or image_url must be provided")

        # Validate prompt
        if not prompt or not prompt.strip():
            raise HTTPException(
                status_code=400, detail="A non-empty prompt must be provided")

        # Read the mask file
        mask_content = await mask_file.read()

        # If image_file is provided, read it
        image_content = None
        if image_file:
            image_content = await image_file.read()

        # Call image service method
        result = await image_service.generative_fill(
            mask_file_content=mask_content,
            prompt=prompt,
            image_file_content=image_content,
            image_url=image_url,
            negative_prompt=negative_prompt,
            content_moderation=content_moderation
        )

        print("=== Successfully completed generative fill request ===")
        return result

    except HTTPException as he:
        print(
            f"=== HTTP Exception in generative_fill endpoint: {he.detail} ===")
        raise he
    except Exception as e:
        print(
            f"=== Unexpected error in generative_fill endpoint: {str(e)} ===")
        raise HTTPException(
            status_code=500, detail=f"Failed to process image: {str(e)}")
