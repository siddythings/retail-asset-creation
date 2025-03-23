import os
import requests
import json
from typing import Dict, Any, Optional
import tempfile
from pathlib import Path
import aiohttp
import ssl
import base64
import shutil


class ImageService:
    """
    Service class for handling image-related operations
    """

    def __init__(self):
        self.bria_api_token = os.getenv("BRIA_AUTH_TOKEN", "")
        self.bria_api_base_url = "https://engine.prod.bria-api.com/v1"

    def _download_image(self, image_url: str) -> str:
        """Download image from URL and save to temp file"""
        try:
            # Disable SSL verification for the download request as well
            response = requests.get(image_url, stream=True, verify=False)
            response.raise_for_status()

            # Get file extension from URL, but strip query parameters first
            url_path = image_url.split('?')[0]  # Remove query parameters
            ext = Path(url_path).suffix or '.png'

            # Ensure the extension is not too long (some URLs might have weird paths)
            if len(ext) > 10:  # Reasonable limit for file extensions
                ext = '.png'  # Default to .png if extension seems invalid

            # Create temp file with correct extension
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    temp_file.write(chunk)
                return temp_file.name
        except Exception as e:
            raise Exception(f"Failed to download image: {str(e)}")

    async def _download_and_upload_bria_image(self, bria_url: str) -> str:
        """
        Downloads an image from Bria API (which returns download-only URLs) and 
        uploads it to ImageKit to make it viewable in browsers.

        Args:
            bria_url: URL from Bria API response

        Returns:
            ImageKit URL that can be viewed in browsers
        """
        print(f"Downloading image from Bria API URL: {bria_url}")
        try:
            # Download the image from Bria
            temp_file_path = self._download_image(bria_url)

            try:
                # Read the file content
                with open(temp_file_path, 'rb') as f:
                    file_content = f.read()

                # Upload to ImageKit
                imagekit_url = self.upload_file_to_imagekit(
                    file_content,
                    "result.png",
                    "virtual-tryon/results"
                )

                print(f"Bria result uploaded to ImageKit: {imagekit_url}")
                return imagekit_url
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    print(f"Warning: Failed to clean up temp file: {str(e)}")
        except Exception as e:
            print(f"Error processing Bria result: {str(e)}")
            # Return the original URL as fallback
            return bria_url

    def upload_file_to_imagekit(self, file_content: bytes, file_name: str, folder: str = "virtual-tryon/images") -> str:
        """
        Uploads a file to ImageKit and returns its public URL.

        Args:
            file_content: Binary content of the file
            file_name: Name to use for the uploaded file
            folder: ImageKit folder to upload to

        Returns:
            URL of the uploaded file on ImageKit
        """
        try:
            print(f"Uploading file to ImageKit in folder {folder}...")
            url = "https://upload.imagekit.io/api/v1/files/upload"

            # Create a temporary file to send to ImageKit
            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name

            try:
                # Prepare the multipart form data
                files = {
                    'file': (file_name, open(temp_file_path, 'rb'), 'image/png')
                }

                # Set the payload parameters
                payload = {
                    "fileName": file_name,
                    "publicKey": "public_gTBjx7RWLu8I8OqyodA+EWeCzVU=",
                    "folder": folder,
                    "useUniqueFileName": "true"
                }

                # Set the headers
                headers = {
                    "Accept": "application/json",
                    "Authorization": f"Basic {os.getenv('IMAGEKIT_API_KEY')}"
                }

                # Make the API request
                response = requests.post(
                    url, data=payload, files=files, headers=headers, verify=False)

                if not response.ok:
                    error_data = response.json() if response.text else {
                        "error": "Unknown error"}
                    print(f"ImageKit upload error: {error_data}")
                    raise Exception(
                        f"ImageKit upload failed with status {response.status_code}: {error_data.get('error', 'Unknown error')}")

                # Parse the response
                response_data = response.json()

                if "url" not in response_data:
                    print(f"ImageKit response missing URL: {response_data}")
                    raise Exception("ImageKit response missing URL field")

                print(
                    f"File uploaded successfully to: {response_data['url']}")
                return response_data["url"]

            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    print(
                        f"Warning: Failed to clean up temporary file {temp_file_path}: {str(e)}")

        except Exception as e:
            print(f"Error uploading file to ImageKit: {str(e)}")
            raise Exception(f"Failed to upload file to ImageKit: {str(e)}")

    def upload_mask_to_imagekit(self, file_content: bytes, file_name: str = "mask.png") -> str:
        """
        Uploads the mask image to ImageKit and returns its public URL.

        Args:
            file_content: Binary content of the mask image
            file_name: Name to use for the uploaded file

        Returns:
            URL of the uploaded image on ImageKit
        """
        return self.upload_file_to_imagekit(file_content, file_name, folder="virtual-tryon/masks")

    async def erase_image(self,
                          mask_file_content: bytes,
                          image_file_content: Optional[bytes] = None,
                          image_url: Optional[str] = None,
                          content_moderation: bool = True) -> Dict[str, Any]:
        """
        Use Bria AI to erase content from an image based on a mask.

        Args:
            mask_file_content: Binary mask image file content where white areas will be erased
            image_file_content: Image file content to be edited (either this or image_url must be provided)
            image_url: URL of the image to be edited (either this or image_file_content must be provided)
            content_moderation: Whether to apply content moderation

        Returns:
            Dictionary containing the URL of the processed image
        """
        try:
            print("=== Starting image service erase_image ===")

            # Validate that either image_file_content or image_url is provided
            if not image_file_content and not image_url:
                raise Exception(
                    "Either image_file_content or image_url must be provided")

            # Prepare API request with correct endpoint
            url = f"{self.bria_api_base_url}/eraser"
            print(f"Using API endpoint: {url}")

            # Set headers with the Bria API token
            headers = {
                "api_token": self.bria_api_token,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }

            print(f"API token present: {bool(self.bria_api_token)}")

            # Prepare JSON payload based on API documentation
            payload = {}

            # Handle image - either upload to ImageKit or use provided URL
            if image_url:
                # Check if image URL is a blob URL (local file)
                if image_url.startswith("blob:"):
                    if not image_file_content:
                        raise Exception(
                            "image_file_content must be provided when image_url is a blob URL")

                    # Upload image to ImageKit
                    print(
                        "Detected blob URL for image, uploading file content to ImageKit...")
                    image_url = self.upload_file_to_imagekit(
                        image_file_content, "image.png", "virtual-tryon/edits")
                    print(f"Image uploaded to ImageKit: {image_url}")

                payload["image_url"] = image_url
            elif image_file_content:
                try:
                    # Upload image to ImageKit
                    print("Uploading image file content to ImageKit...")
                    image_url = self.upload_file_to_imagekit(
                        image_file_content, "image.png", "virtual-tryon/edits")
                    print(f"Image uploaded to ImageKit: {image_url}")
                    payload["image_url"] = image_url
                except Exception as upload_err:
                    print(f"Failed to upload image to ImageKit: {upload_err}")
                    print("Falling back to base64 encoding for image")
                    # Fall back to base64 encoding if upload fails
                    image_base64 = base64.b64encode(
                        image_file_content).decode('utf-8')
                    payload["file"] = image_base64

            # Add mask parameters - try to upload to ImageKit first
            mask_url = None
            try:
                # Upload mask to ImageKit to get a URL
                mask_url = self.upload_mask_to_imagekit(mask_file_content)
                payload["mask_url"] = mask_url
                print(f"Using mask_url: {mask_url}")
            except Exception as upload_err:
                print(f"Failed to upload mask to ImageKit: {upload_err}")
                print("Falling back to base64 mask_file")
                # Fall back to base64 encoding if upload fails
                mask_base64 = base64.b64encode(
                    mask_file_content).decode('utf-8')
                payload["mask_file"] = mask_base64

            # Add additional parameters
            payload["content_moderation"] = content_moderation

            # Use sync mode for simplicity
            payload["sync"] = True

            print(
                f"Request payload: {json.dumps({k: '...' if k in ['file', 'mask_file'] else v for k, v in payload.items()})}")

            # Create form data with SSL verification disabled for consistency
            # Create a client session with SSL verification disabled to fix certificate issues
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                # Make API request with JSON payload
                async with session.post(url, headers=headers, json=payload) as response:
                    status_code = response.status
                    error_text = await response.text()
                    print(f"Response status code: {status_code}")
                    print(f"Response text: {error_text}")

                    if status_code != 200:
                        print(f"Bria API error: {error_text}")
                        print(f"Response headers: {response.headers}")
                        raise Exception(
                            f"Bria API error (status {status_code}): {error_text}")

                    # Parse the response
                    try:
                        response_data = await response.json()
                        print(f"Response data: {response_data}")
                    except json.JSONDecodeError:
                        print("Response is not valid JSON")
                        if error_text.startswith("http"):
                            # Handle case where response might directly be a URL
                            return {
                                "result_url": error_text,
                                "message": "Image processed successfully"
                            }
                        raise Exception(f"Invalid JSON response: {error_text}")

                    # Extract the result URL
                    if not isinstance(response_data, dict):
                        raise Exception(
                            f"Unexpected response format: {type(response_data)}")

                    result_url = None
                    # Check for different possible response formats
                    if "urls" in response_data and isinstance(response_data["urls"], list) and response_data["urls"]:
                        # New format with urls array
                        result_url = response_data["urls"][0]
                    elif "result_url" in response_data:
                        result_url = response_data["result_url"]
                    elif "imageUrl" in response_data:
                        result_url = response_data["imageUrl"]
                    elif "result" in response_data and isinstance(response_data["result"], dict) and "imageUrl" in response_data["result"]:
                        result_url = response_data["result"]["imageUrl"]

                    if not result_url:
                        print("Unable to find result URL in response:",
                              json.dumps(response_data, indent=2))
                        raise Exception(
                            "No result URL in the Bria API response")

                    # Download the image from Bria API and upload to ImageKit for browser viewing
                    browser_viewable_url = await self._download_and_upload_bria_image(result_url)

                    # Return the result URL
                    return {
                        "result_url": browser_viewable_url,
                        "message": "Image processed successfully"
                    }

        except Exception as e:
            print(f"Error in erase_image: {str(e)}")
            raise e

    async def generative_fill(self,
                              mask_file_content: bytes,
                              prompt: str,
                              image_file_content: Optional[bytes] = None,
                              image_url: Optional[str] = None,
                              negative_prompt: Optional[str] = None,
                              content_moderation: bool = True) -> Dict[str, Any]:
        """
        Use Bria AI to fill masked areas in an image with AI-generated content.

        Args:
            mask_file_content: Binary mask image file content where white areas will be filled
            prompt: Text prompt describing what to generate in the masked area
            image_file_content: Image file content to be edited (either this or image_url must be provided)
            image_url: URL of the image to be edited (either this or image_file_content must be provided)
            negative_prompt: Text describing what not to generate
            content_moderation: Whether to apply content moderation

        Returns:
            Dictionary containing the URL of the processed image
        """
        try:
            print("=== Starting image service generative_fill ===")

            # Validate that either image_file_content or image_url is provided
            if not image_file_content and not image_url:
                raise Exception(
                    "Either image_file_content or image_url must be provided")

            # Validate prompt
            if not prompt or not prompt.strip():
                raise Exception("A non-empty prompt must be provided")

            # Use the correct endpoint according to Bria API documentation
            url = f"{self.bria_api_base_url}/gen_fill"
            print(f"Using API endpoint: {url}")

            # Set headers with the Bria API token and content type
            headers = {
                "api_token": self.bria_api_token,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }

            print(f"API token present: {bool(self.bria_api_token)}")
            print(f"Using headers: {headers}")

            # Create SSL context with verification disabled
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            # Prepare JSON payload instead of form data based on API documentation
            payload = {}

            # Handle image - either upload to ImageKit or use provided URL
            if image_url:
                # Check if image URL is a blob URL (local file)
                if image_url.startswith("blob:"):
                    if not image_file_content:
                        raise Exception(
                            "image_file_content must be provided when image_url is a blob URL")

                    # Upload image to ImageKit
                    print(
                        "Detected blob URL for image, uploading file content to ImageKit...")
                    image_url = self.upload_file_to_imagekit(
                        image_file_content, "image.png", "virtual-tryon/edits")
                    print(f"Image uploaded to ImageKit: {image_url}")

                payload["image_url"] = image_url
            elif image_file_content:
                try:
                    # Upload image to ImageKit
                    print("Uploading image file content to ImageKit...")
                    image_url = self.upload_file_to_imagekit(
                        image_file_content, "image.png", "virtual-tryon/edits")
                    print(f"Image uploaded to ImageKit: {image_url}")
                    payload["image_url"] = image_url
                except Exception as upload_err:
                    print(f"Failed to upload image to ImageKit: {upload_err}")
                    print("Falling back to base64 encoding for image")
                    # Fall back to base64 encoding if upload fails
                    image_base64 = base64.b64encode(
                        image_file_content).decode('utf-8')
                    payload["file"] = image_base64

            # Add mask parameters - try to upload to ImageKit first
            mask_url = None
            try:
                # Upload mask to ImageKit to get a URL
                mask_url = self.upload_mask_to_imagekit(mask_file_content)
                payload["mask_url"] = mask_url
                print(f"Using mask_url: {mask_url}")
            except Exception as upload_err:
                print(f"Failed to upload mask to ImageKit: {upload_err}")
                print("Falling back to base64 mask_file")
                # Fall back to base64 encoding if upload fails
                mask_base64 = base64.b64encode(
                    mask_file_content).decode('utf-8')
                payload["mask_file"] = mask_base64

            # Add additional parameters
            payload["prompt"] = prompt
            payload["mask_type"] = "manual"

            if negative_prompt:
                payload["negative_prompt"] = negative_prompt

            payload["content_moderation"] = content_moderation

            # Use sync mode for simplicity
            payload["sync"] = True

            print(
                f"Request payload: {json.dumps({k: '...' if k in ['file', 'mask_file'] else v for k, v in payload.items()})}")

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                # Make API request with JSON payload
                async with session.post(url, headers=headers, json=payload) as response:
                    status_code = response.status
                    error_text = await response.text()
                    print(f"Response status code: {status_code}")
                    print(f"Response text: {error_text}")

                    if status_code != 200:
                        print(f"Bria API error: {error_text}")
                        print(f"Response headers: {response.headers}")
                        raise Exception(
                            f"Bria API error (status {status_code}): {error_text}")

                    # Parse the response
                    try:
                        response_data = await response.json()
                        print(f"Response data: {response_data}")
                    except json.JSONDecodeError:
                        print("Response is not valid JSON")
                        if error_text.startswith("http"):
                            # Handle case where response might directly be a URL
                            return {
                                "result_url": error_text,
                                "message": "Image processed successfully"
                            }
                        raise Exception(f"Invalid JSON response: {error_text}")

                    # Extract the result URL based on API documentation
                    if not isinstance(response_data, dict):
                        raise Exception(
                            f"Unexpected response format: {type(response_data)}")

                    result_url = None
                    # Check for different possible response formats
                    if "urls" in response_data and isinstance(response_data["urls"], list) and response_data["urls"]:
                        # New format with urls array
                        result_url = response_data["urls"][0]
                    elif "result_url" in response_data:
                        result_url = response_data["result_url"]
                    elif "imageUrl" in response_data:
                        result_url = response_data["imageUrl"]
                    elif "result" in response_data and isinstance(response_data["result"], dict) and "imageUrl" in response_data["result"]:
                        result_url = response_data["result"]["imageUrl"]

                    if not result_url:
                        print("Unable to find result URL in response:",
                              json.dumps(response_data, indent=2))
                        raise Exception(
                            "No result URL in the Bria API response")

                    # Download the image from Bria API and upload to ImageKit for browser viewing
                    browser_viewable_url = await self._download_and_upload_bria_image(result_url)

                    # Return the result URL
                    return {
                        "result_url": browser_viewable_url,
                        "message": "Image processed successfully"
                    }

        except Exception as e:
            print(f"Error in generative_fill: {str(e)}")
            raise e

    def upscale_image(self,
                      image_url: str,
                      scale: int = 2,
                      enhance_quality: bool = True,
                      preserve_details: bool = True,
                      remove_noise: bool = False) -> Dict[str, Any]:
        """
        Upscale an image using Bria AI's increase-resolution API

        Args:
            image_url: URL of the image to upscale
            scale: Scale factor for upscaling (2, 3, or 4)
            enhance_quality: Whether to enhance image quality
            preserve_details: Whether to preserve image details
            remove_noise: Whether to remove noise from the image

        Returns:
            Dictionary containing the upscaled image URL and original image URL
        """
        try:
            # Download the image first
            print(f"Downloading image from {image_url}...")
            temp_file_path = self._download_image(image_url)
            print(f"Image downloaded to {temp_file_path}")

            try:
                # Call the Bria AI API to upscale the image
                url = f"{self.bria_api_base_url}/image/increase_resolution"

                # Prepare the multipart form data
                files = {
                    'file': ('image' + Path(temp_file_path).suffix, open(temp_file_path, 'rb'), 'image/jpeg')
                }

                data = {
                    'scale': str(scale),
                    'enhance_quality': str(enhance_quality).lower(),
                    'preserve_details': str(preserve_details).lower(),
                    'remove_noise': str(remove_noise).lower()
                }

                # Set the headers
                headers = {
                    "api_token": self.bria_api_token
                }

                print("Making request to Bria API...")
                print("Form data:", data)
                print("Using headers:", {
                      k: v if k != "api_token" else "[REDACTED]" for k, v in headers.items()})

                # Make the API request with SSL verification disabled
                # Disable SSL verification for requests to avoid certificate issues
                response = requests.post(
                    url, files=files, data=data, headers=headers, verify=False
                )

                print(f"Bria API response status code: {response.status_code}")
                print("Bria API response headers:", dict(response.headers))
                print("Bria API raw response text:", response.text)

                # Check if the request was successful
                if response.status_code != 200:
                    error_message = "Unknown error"
                    try:
                        error_data = response.json()
                        if isinstance(error_data, dict):
                            error_message = error_data.get(
                                "message", "Unknown error")
                    except:
                        error_message = response.text or "Unknown error"
                    raise Exception(
                        f"Bria API error (status {response.status_code}): {error_message}")

                # Parse the response
                try:
                    # Try to parse as JSON
                    data = response.json()
                    print("Bria API parsed JSON response:",
                          json.dumps(data, indent=2))

                    # Check if data is a dictionary
                    if not isinstance(data, dict):
                        print("Response is not a dictionary:", data)
                        # If it's a string, it might be a direct URL
                        if isinstance(data, str) and (data.startswith('http://') or data.startswith('https://')):
                            return {
                                "upscaledImageUrl": data,
                                "originalImageUrl": image_url
                            }
                        raise Exception(
                            f"Unexpected response format: {type(data)}")

                    # Extract the upscaled image URL checking for different response formats
                    upscaled_image_url = None
                    if "urls" in data and isinstance(data["urls"], list) and data["urls"]:
                        # New format with urls array
                        upscaled_image_url = data["urls"][0]
                    elif "result_url" in data:
                        upscaled_image_url = data["result_url"]
                    elif "result" in data and isinstance(data["result"], dict) and "imageUrl" in data["result"]:
                        upscaled_image_url = data["result"]["imageUrl"]

                    if not upscaled_image_url:
                        # Log the full response for debugging
                        print("Unable to find upscaled image URL in response:",
                              json.dumps(data, indent=2))
                        raise Exception(
                            "No upscaled image URL in the Bria API response")

                    # Download the Bria image and upload to ImageKit
                    print("Downloading result from Bria and uploading to ImageKit...")
                    bria_image_path = self._download_image(upscaled_image_url)

                    try:
                        with open(bria_image_path, 'rb') as f:
                            file_content = f.read()

                        browser_viewable_url = self.upload_file_to_imagekit(
                            file_content,
                            "upscaled.png",
                            "virtual-tryon/upscaled"
                        )

                        print(
                            f"Upscaled image uploaded to ImageKit: {browser_viewable_url}")

                        # Return the upscaled image URL and original image URL
                        return {
                            "upscaledImageUrl": browser_viewable_url,
                            "originalImageUrl": image_url
                        }
                    finally:
                        # Clean up downloaded file
                        try:
                            os.unlink(bria_image_path)
                        except Exception as e:
                            print(
                                f"Warning: Failed to clean up downloaded file: {str(e)}")

                except json.JSONDecodeError:
                    # If it's not JSON, it might be a direct response with the URL
                    if response.text and (response.text.startswith('http://') or response.text.startswith('https://')):
                        # Download and reupload
                        bria_image_path = self._download_image(response.text)

                        try:
                            with open(bria_image_path, 'rb') as f:
                                file_content = f.read()

                            browser_viewable_url = self.upload_file_to_imagekit(
                                file_content,
                                "upscaled.png",
                                "virtual-tryon/upscaled"
                            )

                            return {
                                "upscaledImageUrl": browser_viewable_url,
                                "originalImageUrl": image_url
                            }
                        finally:
                            # Clean up downloaded file
                            try:
                                os.unlink(bria_image_path)
                            except Exception as e:
                                print(
                                    f"Warning: Failed to clean up downloaded file: {str(e)}")

                    raise Exception(f"Invalid JSON response: {response.text}")

            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_file_path)
                    print(f"Cleaned up temporary file {temp_file_path}")
                except Exception as e:
                    print(
                        f"Warning: Failed to clean up temporary file {temp_file_path}: {str(e)}")

        except Exception as e:
            print(f"Error upscaling image: {str(e)}")
            raise e
