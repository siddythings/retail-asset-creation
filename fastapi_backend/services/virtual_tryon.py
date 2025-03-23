"""
Service for handling virtual try-on functionality
"""
import os
import json
import time
import asyncio
import base64
import requests
from copy import deepcopy
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from .utils.aidge_api import AidgeApiClient
from .utils.fashn_api import FashnApiClient
from .utils.storage import StorageManager
import random

# Load environment variables
load_dotenv()


class VirtualTryOnService:
    def __init__(self):
        self.aidge_client = AidgeApiClient()
        self.fashn_client = FashnApiClient()
        self.storage_manager = StorageManager()
        self.fashn_enabled = os.getenv(
            'FASHN_ENABLED', 'false').lower() == 'true'

        # Define test images for replacing localhost URLs
        self.test_clothing_images = {
            'tops': 'https://ae-pic-a1.aliexpress-media.com/kf/H7588ee37b7674fea814b55f2f516fda1z.jpg',
            'bottoms': 'https://ae-pic-a1.aliexpress-media.com/kf/H5fb1feecb00740919d96f8f65a5d6d8bE.jpg',
            'dresses': 'https://ae-pic-a1.aliexpress-media.com/kf/H7a9b9ce9f9fc445fb9d49df39e7d1bb4M.jpg'
        }
        self.test_model_image = 'https://img.freepik.com/free-photo/beautiful-woman-casual-plaid-shirt-standing-white-backdrop-studio_23-2148261169.jpg'

    def _is_url(self, path: str) -> bool:
        """
        Check if a path is a URL.

        Args:
            path: The path to check

        Returns:
            bool: True if the path is a URL, False otherwise
        """
        return path.startswith(('http://', 'https://'))

    def _download_image_to_base64(self, url: str) -> str:
        """
        Download an image from a URL and convert it to base64.

        Args:
            url: The URL of the image

        Returns:
            str: The base64-encoded image data with MIME type prefix

        Raises:
            Exception: If the download fails
        """
        try:
            print(f"Downloading image from URL: {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image_data = response.content
            base64_data = base64.b64encode(image_data).decode('utf-8')
            # Determine MIME type from response headers or default to jpeg
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            return f"data:{content_type};base64,{base64_data}"
        except Exception as e:
            print(f"Error downloading image from URL: {str(e)}")
            raise Exception(f"Failed to download image from URL: {str(e)}")

    def _replace_localhost_urls(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Replace localhost URLs with publicly accessible test images

        Args:
            request_data: The original request data

        Returns:
            Modified request data with public image URLs
        """
        # Deep clone the request data
        modified_data = deepcopy(request_data)

        # Check and replace clothesList URLs
        if 'clothesList' in modified_data and isinstance(modified_data['clothesList'], list):
            for item in modified_data['clothesList']:
                if 'imageUrl' in item and 'localhost' in item['imageUrl']:
                    print(
                        f"Replacing localhost clothing URL with public test image for type: {item.get('type', 'tops')}")
                    item['imageUrl'] = self.test_clothing_images.get(
                        item.get('type', 'tops'), self.test_clothing_images['tops'])

        # Check and replace modelImage URLs
        if 'modelImage' in modified_data and isinstance(modified_data['modelImage'], list):
            modified_data['modelImage'] = [
                self.test_model_image if url and 'localhost' in url else url
                for url in modified_data['modelImage']
            ]

        return modified_data

    def _is_fashn_enabled(self) -> bool:
        """
        Check if fashn.ai API is enabled

        Returns:
            Whether fashn.ai is enabled
        """
        return self.fashn_enabled and os.getenv('FASHN_API_KEY')

    async def submit_try_on(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit a virtual try-on request using the appropriate API

        Args:
            request_data: The request data

        Returns:
            The task ID
        """
        try:
            print(
                f"Submitting try-on request with data: {json.dumps(request_data, indent=2)}")

            # Replace localhost URLs with public test images
            processed_request_data = self._replace_localhost_urls(request_data)
            print(
                f"Processed request data: {json.dumps(processed_request_data, indent=2)}")

            # Determine which API to use
            if self._is_fashn_enabled():
                return await self._submit_try_on_fashn(processed_request_data)
            else:
                return await self._submit_try_on_aidge(processed_request_data)
        except Exception as error:
            print(f"Error submitting try-on request: {str(error)}")
            raise error

    async def _submit_try_on_aidge(self, processed_request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit a try-on request using the Aidge API

        Args:
            processed_request_data: The processed request data

        Returns:
            The task ID
        """
        # Prepare the request parameters
        request_params = [{
            'clothesList': processed_request_data.get('clothesList', []),
            'model': processed_request_data.get('model', {
                'base': 'General',
                'gender': processed_request_data.get('gender', 'female'),
                'style': processed_request_data.get('style', 'universal_1'),
                'body': processed_request_data.get('body', 'slim')
            }),
            'viewType': processed_request_data.get('viewType', 'mixed'),
            'inputQualityDetect': processed_request_data.get('inputQualityDetect', 0),
            'generateCount': processed_request_data.get('generateCount', 4)
        }]

        # Important: Only add modelImage if provided, otherwise use base model
        if 'modelImage' in processed_request_data and processed_request_data['modelImage']:
            # The Aidge API expects modelImage as an array
            request_params[0]['modelImage'] = processed_request_data['modelImage']
            print(
                f"Using custom model image: {processed_request_data['modelImage']}")
        else:
            print("No model image provided, using base model only")

        # Prepare the submit request
        submit_request = {
            'requestParams': json.dumps(request_params)
        }

        # Call the Aidge AI API
        submit_response = self.aidge_client.invoke_aidge_api(
            '/ai/virtual/tryon',
            json.dumps(submit_request)
        )

        # Extract and return the task ID
        if (submit_response.get('success') and
            submit_response.get('data') and
                submit_response['data'].get('result')):

            task_id = submit_response['data']['result'].get('taskId')
            print(f"Try-on request submitted successfully, task ID: {task_id}")
            return {
                'taskId': task_id,
                'provider': 'aidge'
            }
        else:
            print(f"Try-on request failed: {submit_response}")
            raise Exception(submit_response.get(
                'resMessage', 'Failed to submit try-on request'))

    async def _submit_try_on_fashn(self, processed_request_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Submit a try-on request to the fashn.ai API

        Args:
            processed_request_data: The processed request data

        Returns:
            A dictionary with the task ID
        """
        # Initialize fashn client if needed
        if not hasattr(self, 'fashn_client'):
            from fastapi_backend.services.utils.fashn_api import FashnApiClient
            self.fashn_client = FashnApiClient()

        # Get the first clothing item (we only support one at a time for fashn.ai)
        clothing_list = processed_request_data.get('clothesList', [])
        if not clothing_list or len(clothing_list) == 0:
            raise Exception('No clothing items provided for try-on')

        clothing_item = clothing_list[0]

        # Get the model image URL
        model_image_urls = processed_request_data.get('modelImage', [])
        if not model_image_urls or len(model_image_urls) == 0:
            raise Exception('No model image provided for try-on')

        model_image_url = model_image_urls[0]

        if not model_image_url:
            raise Exception('No model image provided for try-on')

        # Get parameters with fallbacks
        gender = processed_request_data.get('gender', 'female')
        body_type = processed_request_data.get('body', 'slim')
        style = processed_request_data.get('style', 'universal_1')
        generate_count = int(processed_request_data.get('generateCount', 4))
        clothing_type = clothing_item.get('type', 'one-pieces')

        # Map our clothing types to fashn.ai categories
        category_mapping = {
            'top': 'tops',
            'tops': 'tops',
            'bottom': 'bottoms',
            'bottoms': 'bottoms',
            'dress': 'one-pieces',
            'dresses': 'one-pieces',
            'one-piece': 'one-pieces',
            'one-pieces': 'one-pieces'
        }

        category = category_mapping.get(clothing_type, 'one-pieces')

        # Process model image
        model_image = model_image_url
        garment_image = clothing_item.get('imageUrl')

        print(f"Processing model image: {model_image}")
        print(f"Processing garment image: {garment_image}")

        # Handle model image - check if it's a URL, local path, or base64
        if self._is_url(model_image):
            # It's a remote URL; assume it's preprocessed and use it as-is
            print(f"Using remote model image URL: {model_image}")
        elif model_image.startswith('/uploads/'):
            try:
                uploads_dir = os.getenv('UPLOADS_DIR', os.path.join(
                    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads'))
                # Split the path and remove the leading 'uploads' from the image path
                path_parts = model_image.lstrip('/').split('/')
                if path_parts[0] == 'uploads':
                    # Remove the first 'uploads' segment
                    path_parts = path_parts[1:]
                model_file_path = os.path.join(uploads_dir, *path_parts)
                print(f"Corrected model image path: {model_file_path}")

                if not os.path.exists(model_file_path):
                    raise Exception(f"Model file not found: {model_file_path}")

                with open(model_file_path, 'rb') as f:
                    model_bytes = f.read()
                    model_base64 = base64.b64encode(
                        model_bytes).decode('utf-8')
                    model_image = f"data:image/jpeg;base64,{model_base64}"
            except Exception as e:
                print(f"Error converting model image to base64: {str(e)}")
                raise Exception(
                    f'Failed to convert model image to base64: {str(e)}')
        elif model_image.startswith('data:'):
            # Validate base64 format
            if not model_image.startswith('data:image/'):
                print(
                    f"Invalid base64 format for model image: {model_image[:50]}...")
                raise ValueError(
                    'Invalid base64 format for model image. Must start with "data:image/"')
            print("Using base64 model image")
        else:
            print(f"Unrecognized model image format: {model_image[:50]}...")
            raise ValueError(
                f"Unrecognized model image format. Must be a URL, local path, or base64 data")

        # Handle garment image - check if it's a URL, local path, or base64
        if self._is_url(garment_image):
            # It's a remote URL; assume it's preprocessed and use it as-is
            print(f"Using remote garment image URL: {garment_image}")
        elif garment_image.startswith('/uploads/'):
            try:
                uploads_dir = os.getenv('UPLOADS_DIR', os.path.join(
                    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads'))
                path_parts = garment_image.lstrip('/').split('/')
                if path_parts[0] == 'uploads':
                    path_parts = path_parts[1:]
                garment_file_path = os.path.join(uploads_dir, *path_parts)
                print(f"Corrected garment image path: {garment_file_path}")

                if not os.path.exists(garment_file_path):
                    raise Exception(
                        f"Garment file not found: {garment_file_path}")

                with open(garment_file_path, 'rb') as f:
                    garment_bytes = f.read()
                    garment_base64 = base64.b64encode(
                        garment_bytes).decode('utf-8')
                    garment_image = f"data:image/jpeg;base64,{garment_base64}"
            except Exception as e:
                print(f"Error converting garment image to base64: {str(e)}")
                raise Exception(
                    f'Failed to convert garment image to base64: {str(e)}')
        elif garment_image.startswith('data:'):
            if not garment_image.startswith('data:image/'):
                print(
                    f"Invalid base64 format for garment image: {garment_image[:50]}...")
                raise ValueError(
                    'Invalid base64 format for garment image. Must start with "data:image/"')
            print("Using base64 garment image")
        else:
            print(
                f"Unrecognized garment image format: {garment_image[:50]}...")
            raise ValueError(
                f"Unrecognized garment image format. Must be a URL, local path, or base64 data")

        # Prepare the request data according to Fashn.ai API documentation
        fashn_request = {
            'model_image': model_image,
            'garment_image': garment_image,
            'category': category,
            'mode': processed_request_data.get('mode', 'quality'),
            'num_samples': generate_count,
            'nsfw_filter': processed_request_data.get('nsfw_filter', True),
            'restore_background': processed_request_data.get('restoreBackground', False),
            'cover_feet': processed_request_data.get('coverFeet', False),
            'adjust_hands': processed_request_data.get('adjustHands', False),
            'restore_clothes': processed_request_data.get('restoreClothes', False),
            'garment_photo_type': processed_request_data.get('garmentPhotoType', 'auto'),
            'long_top': processed_request_data.get('longTop', False),
            'seed': processed_request_data.get('seed') if processed_request_data.get('seed') is not None else random.randint(0, 10000000)
        }

        # Log the structured request (without base64 data for brevity)
        log_request = {**fashn_request}
        if 'model_image' in log_request and isinstance(log_request['model_image'], str) and log_request['model_image'].startswith('data:'):
            log_request['model_image'] = '[BASE64_IMAGE]'
        if 'garment_image' in log_request and isinstance(log_request['garment_image'], str) and log_request['garment_image'].startswith('data:'):
            log_request['garment_image'] = '[BASE64_IMAGE]'
        print(
            f"Submitting request to Fashn.ai API: {json.dumps(log_request, indent=2)}")

        # Call the fashn.ai API with the correct endpoint
        fashn_response = self.fashn_client.invoke_fashn_api(
            '/run', fashn_request)

        # Extract and return the prediction ID
        if 'id' in fashn_response:
            print(
                f"Try-on request submitted successfully to fashn.ai, prediction ID: {fashn_response['id']}")
            return {
                'taskId': fashn_response['id'],
                'provider': 'fashn'
            }
        else:
            print(
                f"Try-on request failed. Response: {json.dumps(fashn_response, indent=2)}")
            print(f"Original request: {json.dumps(fashn_request, indent=2)}")

            error_detail = fashn_response.get('detail', 'No detail provided')
            error_message = fashn_response.get(
                'message', 'Failed to submit try-on request to fashn.ai')

            raise Exception(
                f"Fashn.ai API error: {error_message}. Details: {error_detail}")

    async def query_try_on_results(self, task_id: str, provider: str = 'aidge') -> Dict[str, Any]:
        """
        Query the status of a virtual try-on task

        Args:
            task_id: The task ID to query
            provider: The provider to use (aidge or fashn)

        Returns:
            The status of the try-on task
        """
        try:
            # Use the appropriate API based on the provider
            if provider == 'fashn':
                return await self._query_try_on_results_fashn(task_id)
            else:
                return await self._query_try_on_results_aidge(task_id)
        except Exception as error:
            print(f"Error querying try-on results: {str(error)}")
            raise error

    async def _query_try_on_results_aidge(self, task_id: str) -> Dict[str, Any]:
        """
        Query the status of a virtual try-on task using the Aidge API

        Args:
            task_id: The task ID to query

        Returns:
            The status of the try-on task
        """
        # Prepare the query request
        query_request = {
            'taskId': task_id
        }

        # Call the Aidge AI API
        query_response = self.aidge_client.invoke_aidge_api(
            '/ai/virtual/tryon/query',
            json.dumps(query_request)
        )

        # Process the response
        if (query_response.get('success') and
            query_response.get('data') and
                query_response['data'].get('result')):

            result = query_response['data']['result']
            status = result.get('status', '')

            # Format the response based on the status
            if status == 'done':
                done_results = result.get('doneResults', [])
                images = []

                if done_results:
                    for done_result in done_results:
                        model_url = done_result.get('modelImageUrl', '')
                        clothings = done_result.get('clothings', [])
                        for clothing in clothings:
                            clothing_url = clothing.get('imageUrl', '')
                            model_url_with_clothes = clothing.get(
                                'modelUrlWithClothes', '')

                            if model_url_with_clothes:
                                images.append({
                                    'modelImageUrl': model_url,
                                    'clothingImageUrl': clothing_url,
                                    'outputImageUrl': model_url_with_clothes
                                })

                return {
                    'taskStatus': 'completed',
                    'images': images
                }
            elif status == 'fail':
                return {
                    'taskStatus': 'failed',
                    'error': result.get('message', 'Unknown error')
                }
            else:
                # Return status as processing for "processing", "starting", etc.
                progress = 0
                if 'progress' in result:
                    try:
                        # Convert progress to percentage (0-100)
                        progress = float(result['progress']) * 100
                    except (ValueError, TypeError):
                        print(
                            f"Warning: Invalid progress value: {result['progress']}")

                return {
                    'taskStatus': 'processing',
                    'progress': progress
                }
        else:
            print(f"Query try-on results failed: {query_response}")
            raise Exception(query_response.get(
                'resMessage', 'Failed to query try-on results'))

    async def _query_try_on_results_fashn(self, prediction_id: str) -> Dict[str, Any]:
        """
        Query the status of a virtual try-on task using the fashn.ai API

        Args:
            prediction_id: The prediction ID to query

        Returns:
            The status of the try-on task
        """
        # Call the fashn.ai API to get status
        try:
            status_response = self.fashn_client.get_fashn_api_status(
                prediction_id)

            # Log the response for debugging
            print(
                f"Fashn.ai raw status response for {prediction_id}: {json.dumps(status_response, indent=2)}")

            # Process the response based on the status
            if 'status' in status_response:
                status = status_response['status']

                # Handle both "succeeded" and "completed" status values
                if status == 'succeeded' or status == 'completed':
                    print(
                        f"Fashn.ai job {prediction_id} completed successfully")

                    # Get the output URLs - could be a single URL or an array
                    output_urls = []

                    # Handle different output formats
                    if 'output' in status_response:
                        output = status_response['output']

                        # Handle direct array of URLs in output
                        if isinstance(output, list):
                            output_urls.extend(output)
                        # Handle object with output_url
                        elif isinstance(output, dict):
                            if 'output_url' in output:
                                output_urls.append(output['output_url'])
                            elif 'output_urls' in output and isinstance(output['output_urls'], list):
                                output_urls.extend(output['output_urls'])

                    if output_urls:
                        print(f"Found {len(output_urls)} output URLs: {output_urls}")
                        # Create an image entry for each output URL
                        images = []
                        for url in output_urls:
                            images.append({
                                'outputImageUrl': url
                            })

                        # Make sure to include both the 'images' array and direct 'output' array for compatibility
                        return {
                            'taskStatus': 'completed',
                            'images': images,
                            'output': output_urls,
                            'provider': 'fashn'
                        }
                    else:
                        print(
                            f"Warning: No output URLs found in response: {json.dumps(status_response, indent=2)}")
                        return {
                            'taskStatus': 'failed',
                            'error': 'No output URLs in response'
                        }
                elif status == 'failed':
                    print(
                        f"Fashn.ai job {prediction_id} failed: {status_response.get('error', 'Unknown error')}")
                    return {
                        'taskStatus': 'failed',
                        'error': status_response.get('error', 'Unknown error')
                    }
                else:
                    # Return status as processing for "processing", "starting", etc.
                    progress = 0
                    if 'progress' in status_response:
                        try:
                            # Convert progress to percentage (0-100)
                            progress = float(status_response['progress']) * 100
                        except (ValueError, TypeError):
                            print(
                                f"Warning: Invalid progress value: {status_response['progress']}")

                    print(
                        f"Fashn.ai job {prediction_id} still processing, progress: {progress}%")
                    return {
                        'taskStatus': 'processing',
                        'progress': progress
                    }
            else:
                # Handle case where status is missing
                print(
                    f"Warning: No status in response: {json.dumps(status_response, indent=2)}")
                return {
                    'taskStatus': 'failed',
                    'error': 'No status in response from fashn.ai'
                }
        except Exception as error:
            print(
                f"Error querying Fashn.ai status for {prediction_id}: {str(error)}")
            return {
                'taskStatus': 'failed',
                'error': str(error)
            }

    async def execute_try_on(self, request_data: Dict[str, Any], max_attempts: int = 30, sleep_time: int = 2) -> Dict[str, Any]:
        """
        Execute a complete virtual try-on process

        Args:
            request_data: The request data
            max_attempts: Maximum number of attempts to query the results
            sleep_time: Time to sleep between attempts

        Returns:
            A dictionary with the try-on results
        """
        try:
            # Process the request data
            print(
                f"Processed request data: {json.dumps(request_data, indent=2)}")

            # Submit the try-on request
            submit_response = await self.submit_try_on(request_data)

            # Get the task ID and provider
            task_id = submit_response.get('taskId')
            provider = submit_response.get('provider')

            if not task_id:
                raise Exception('No task ID returned from try-on submission')

            # Start time for tracking elapsed time
            start_time = time.time()

            # Poll for results
            for attempt in range(max_attempts):
                # Sleep between attempts
                await asyncio.sleep(sleep_time)

                # Query the results
                query_response = await self.query_try_on_results(task_id, provider)

                # Get the status
                status = query_response.get('taskStatus')

                # Calculate elapsed time
                elapsed_time = time.time() - start_time

                # Check if the task is finished or failed
                if status in ('finished', 'completed'):
                    print(f"Try-on finished after {elapsed_time:.1f} seconds")

                    # For backwards compatibility, handle both new and old response formats
                    if 'images' in query_response and query_response['images']:
                        return query_response
                    elif 'results' in query_response and query_response['results']:
                        results = []
                        for result in query_response['results']:
                            result_obj = {
                                'taskStatus': result.get('taskStatus', status),
                                'taskResult': result.get('taskResult'),
                                'savedResults': result.get('savedResults')
                            }
                            if provider == 'fashn':
                                output_urls = [
                                    img['outputImageUrl'] for img in query_response['images'] if 'outputImageUrl' in img]
                                result_obj['outputImageUrls'] = output_urls
                            results.append(result_obj)
                        return {
                            'taskStatus': status,
                            'results': results,
                            'taskId': task_id,
                            'provider': provider
                        }
                    elif status == 'failed':
                        error_message = query_response.get(
                            'error', 'Unknown error')
                        print(
                            f"Try-on failed after {elapsed_time:.1f} seconds: {error_message}")
                        return {
                            'taskStatus': 'failed',
                            'error': error_message,
                            'taskId': task_id,
                            'provider': provider
                        }

            # If we get here, the task timed out
            print(f"Try-on timed out after {elapsed_time:.1f} seconds")
            return {
                'taskStatus': 'timeout',
                'error': 'Try-on timed out',
                'taskId': task_id,
                'provider': provider
            }
        except Exception as e:
            print(f"Error executing try-on: {str(e)}")
            raise Exception(f"Error executing try-on: {str(e)}")

    async def get_gallery_results(self) -> List[Dict[str, Any]]:
        """
        Get all saved try-on results for the gallery

        Returns:
            List of saved try-on results
        """
        try:
            return self.storage_manager.get_all_results()
        except Exception as error:
            print(f"Error getting gallery results: {str(error)}")
            raise error
