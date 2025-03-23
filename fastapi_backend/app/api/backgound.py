from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi_backend.services.utils.temp_file_upload import upload_image_to_bria
from fastapi_backend.services.background_applier_bria import BackgroundApplier
import requests
import os
from dotenv import load_dotenv
import openai

load_dotenv()
router = APIRouter()

async def generate_fashion_prompts(attributes, num_variants=4):
    """
    Generate a list of fashion-related background prompts using OpenAI.

    :param attributes: A dictionary containing attributes like Product Type, Colors, Patterns, etc.
    :param num_variants: Number of prompts to generate.
    :return: List of generated prompts.
    """
    client = openai.OpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )

    system_prompt = """
    You are an expert prompt generator for AI image generation.
    Given fashion attributes such as Product Type, Colors, Patterns, Materials, Style, Age Group, and Occasion,
    generate visually descriptive and creative background prompts that match the essence of the given fashion style.
    """

    user_prompt = f"""
    Create {num_variants} unique background prompts for a faction model based on these attributes:

    Product Type: {attributes.get('productType', 'N/A')}
    Colors: {', '.join(attributes.get('colors', []))}
    Patterns: {', '.join(attributes.get('patterns', []))}
    Materials: {', '.join(attributes.get('materials', []))}
    Style: {', '.join(attributes.get('style', []))}
    Age Group: {attributes.get('ageGroup', 'N/A')}
    Occasion: {', '.join(attributes.get('occasion', []))}

    Each prompt should describe a visually appealing setting that complements the fashion theme.
    """

    response = client.chat.completions.create(
        model="gpt-4",  # Changed from gpt-4o-mini to gpt-4
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=300
    )

    # Extracting the generated prompts from the response
    prompts = response.choices[0].message.content.split("\n\n")
    prompts = [prompt.split(". ", 1)[1] for i, prompt in enumerate(prompts, 1)]
    return prompts

@router.post("/upload-to-bria")
async def upload_to_bria(file: UploadFile = File(...)):

    url = "https://upload.imagekit.io/api/v1/files/upload"
    file_name = file.filename
    files = {"file": file.file}
    payload = {
        "fileName": file_name,
        "publicKey": "public_gTBjx7RWLu8I8OqyodA+EWeCzVU=",
        "signature": "",
        "expire": "",
        "token": "",
        "useUniqueFileName": "",
        "tags": "",
        "folder": "",
        "isPrivateFile": "",
        "isPublished": "",
        "customCoordinates": "",
        "responseFields": "",
        "extensions": "",
        "webhookUrl": "",
        "overwriteFile": "",
        "overwriteAITags": "",
        "overwriteTags": "",
        "overwriteCustomMetadata": "",
        # "customMetadata": "sdf",
        "transformation": "",
        "checks": ""
    }
    headers = {
        "Accept": "application/json",
        "Authorization": f"Basic {os.getenv('IMAGEKIT_API_KEY')}"
    }

    response = requests.post(url, data=payload, files=files, headers=headers)

    print(response.json())

    if "error" in response.json():
        return JSONResponse(
            status_code=response.json().get("status_code", 500),
            content={"error": response.json()["error"]}
        )

    return response.json()


@router.post("/background-replace")
async def background_replace(request: Request, request_body: dict):

    # Extract values with defaults
    fast = request_body.get("fast", True)
    bg_prompt = request_body.get("bg_prompt", "")
    refine_prompt = request_body.get("refine_prompt", True)
    original_quality = request_body.get("original_quality", False)
    num_results = request_body.get("num_results", 4)
    image_url = request_body.get("image_url")

    if not image_url:
        return JSONResponse(
            status_code=400,
            content={"error": "image_url is required"}
        )

    print("Received request with:", {
        "fast": fast,
        "bg_prompt": bg_prompt,
        "refine_prompt": refine_prompt,
        "original_quality": original_quality,
        "num_results": num_results,
        "image_url": image_url
    })

    background_applier = BackgroundApplier()
    result = background_applier.background_replace_using_bria_api(
        fast=fast,
        bg_prompt=bg_prompt,
        refine_prompt=refine_prompt,
        original_quality=original_quality,
        num_results=num_results,
        image_url=image_url
    )

    return result

@router.post("/prompt-generator")
async def prompt_generator(request: Request, request_body: dict):
    print(request_body,"request_body")
    attributes = request_body.get("attributes", {})
    num_variants = request_body.get("num_variants", 4)

    prompts = await generate_fashion_prompts(request_body, num_variants)
    print(prompts,"prompts")
    return prompts
