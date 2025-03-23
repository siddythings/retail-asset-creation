import requests
from fastapi import UploadFile
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import re

load_dotenv()

BRIA_UPLOAD_URL = "https://platform.prod.bria-api.com/upload-image/s3/temp_file"
BRIA_AUTH_TOKEN = os.getenv('TEMP_FILE_TOKEN')


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to remove special characters and spaces
    """
    # Replace spaces and special characters with underscores
    sanitized = re.sub(r'[^\w\-_.]', '_', filename)
    return sanitized


async def upload_image_to_bria(file: UploadFile):
    """
    Helper function to upload an image to Bria API
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:135.0) Gecko/20100101 Firefox/135.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Referer': 'https://platform.bria.ai/',
            'Origin': 'https://platform.bria.ai',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Authorization': BRIA_AUTH_TOKEN
        }

        # Read file content in binary mode
        file_content = await file.read()

        # Ensure we're working with bytes
        if isinstance(file_content, str):
            file_content = file_content.encode('utf-8')

        # Reset file position for potential future reads
        await file.seek(0)

        # Sanitize filename
        safe_filename = sanitize_filename(file.filename)

        # Create files dictionary with sanitized filename
        files = {
            # Changed 'name' to 'file'
            'file': (safe_filename, file_content, file.content_type)
        }

        response = requests.post(
            BRIA_UPLOAD_URL,
            headers=headers,
            files=files
        )

        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"Failed to upload image: {response.text}",
                "status_code": response.status_code
            }

    except Exception as e:
        return {
            "error": f"Internal server error: {str(e)}",
            "status_code": 500
        }
