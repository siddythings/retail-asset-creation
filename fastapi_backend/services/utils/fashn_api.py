"""
Utility functions for interacting with the Fashn.ai API
"""
import os
import json
import requests
import time
import math
import dateutil.parser
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class FashnApiClient:
    def __init__(self):
        # Load API credentials from environment variables
        self.api_key = os.getenv('FASHN_API_KEY')
        
        # Base API URL without trailing slash
        self.api_url = os.getenv('FASHN_API_URL', 'https://api.fashn.ai/v1').rstrip('/')
        
        # Maximum retries for transient errors
        self.max_retries = int(os.getenv('FASHN_MAX_RETRIES', '3'))
        
        # Default timeout in seconds
        self.default_timeout = int(os.getenv('FASHN_REQUEST_TIMEOUT', '30'))
        
        print(f"Initialized Fashn.ai client with API URL: {self.api_url}")

    def invoke_fashn_api(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Utility function to call the fashn.ai API
        
        Args:
            endpoint: The API endpoint to call
            data: The data to send to the API
            
        Returns:
            The API response
        """
        # Construct the URL - ensure endpoint starts with /
        if not endpoint.startswith('/'):
            endpoint = f"/{endpoint}"
            
        url = f"{self.api_url}{endpoint}"
        
        # Set headers with API key
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {self.api_key}"
        }
        
        # Clean the data by removing None values
        cleaned_data = {k: v for k, v in data.items() if v is not None}
        print(f"Fashn.ai API Request to {endpoint}:", json.dumps(cleaned_data, indent=2))
        
        # Convert to properly formatted JSON
        json_payload = json.dumps(cleaned_data, ensure_ascii=False)
        
        # Implement retry logic for transient errors
        for attempt in range(self.max_retries):
            try:
                # Make the API request with proper timeout
                response = requests.post(url, data=json_payload, headers=headers, timeout=self.default_timeout)
                
                # Check if the response status is successful
                if response.status_code == 200:
                    # Safely parse the JSON response
                    try:
                        response_data = response.json()
                        print(f"Fashn.ai API Response from {endpoint}:", json.dumps(response_data, indent=2))
                        return response_data
                    except json.JSONDecodeError as e:
                        print(f"Invalid JSON response: {response.text}")
                        raise Exception(f"Received invalid JSON response from Fashn.ai API: {str(e)}")
                elif response.status_code == 429:  # Too Many Requests
                    wait_time = min(2 ** attempt, 60)  # Exponential backoff, max 60 seconds
                    print(f"Rate limited (429). Retrying in {wait_time} seconds. Attempt {attempt+1}/{self.max_retries}")
                    time.sleep(wait_time)
                    continue
                else:
                    # Try to parse error response
                    error_msg = "Unknown error"
                    try:
                        error_data = response.json()
                        if isinstance(error_data, dict):
                            error_msg = error_data.get('detail', error_data.get('message', str(error_data)))
                    except:
                        error_msg = response.text or f"HTTP error {response.status_code}"
                    
                    print(f"Fashn.ai API Error: Status {response.status_code}")
                    print(f"Response content: {response.text}")
                    
                    if attempt < self.max_retries - 1 and 500 <= response.status_code < 600:
                        # Server errors can be retried
                        wait_time = min(2 ** attempt, 60)
                        print(f"Server error. Retrying in {wait_time} seconds. Attempt {attempt+1}/{self.max_retries}")
                        time.sleep(wait_time)
                        continue
                    
                    raise Exception(f"API returned {response.status_code}: {error_msg}")
                    
            except requests.exceptions.Timeout:
                print(f"Fashn.ai API request timed out. Attempt {attempt+1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    time.sleep(min(2 ** attempt, 60))
                    continue
                raise Exception("Request to Fashn.ai API timed out after multiple attempts")
                
            except requests.exceptions.ConnectionError:
                print(f"Fashn.ai API connection error. Attempt {attempt+1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    time.sleep(min(2 ** attempt, 60))
                    continue
                raise Exception("Connection error when calling Fashn.ai API after multiple attempts")
                
            except requests.exceptions.RequestException as e:
                print(f"Fashn.ai API Request exception: {str(e)}")
                raise Exception(f"Network error when calling Fashn.ai API: {str(e)}")
        
        # If we get here, all retries failed
        raise Exception(f"Failed to call Fashn.ai API after {self.max_retries} attempts")

    def get_fashn_api_status(self, prediction_id: str) -> Dict[str, Any]:
        """
        Utility function to get status from the fashn.ai API
        
        Args:
            prediction_id: The prediction ID to query
            
        Returns:
            The API response
        """
        # Construct the URL with the correct endpoint format
        url = f"{self.api_url}/status/{prediction_id}"
        
        # Set headers with API key
        headers = {
            'Authorization': f"Bearer {self.api_key}"
        }
        
        print(f"Fashn.ai Status Request for ID: {prediction_id}")
        
        # Implement retry logic for transient errors
        for attempt in range(self.max_retries):
            try:
                # Make the API request with timeout
                response = requests.get(url, headers=headers, timeout=self.default_timeout)
                
                # Check if the response status is successful
                if response.status_code == 200:
                    # Safely parse the JSON response
                    try:
                        response_data = response.json()
                        print(f"Fashn.ai Status Response:", json.dumps(response_data, indent=2))
                        
                        # Parse and normalize the response data
                        normalized_response = self._normalize_status_response(response_data)
                        return normalized_response
                        
                    except json.JSONDecodeError as e:
                        print(f"Invalid JSON response: {response.text}")
                        raise Exception(f"Received invalid JSON response from Fashn.ai Status API: {str(e)}")
                elif response.status_code == 429:  # Too Many Requests
                    wait_time = min(2 ** attempt, 60)  # Exponential backoff, max 60 seconds
                    print(f"Rate limited (429). Retrying in {wait_time} seconds. Attempt {attempt+1}/{self.max_retries}")
                    time.sleep(wait_time)
                    continue
                else:
                    # Try to parse error response
                    error_msg = "Unknown error"
                    try:
                        error_data = response.json()
                        if isinstance(error_data, dict):
                            error_msg = error_data.get('detail', error_data.get('message', str(error_data)))
                    except:
                        error_msg = response.text or f"HTTP error {response.status_code}"
                    
                    print(f"Fashn.ai Status API Error: Status {response.status_code}")
                    print(f"Response content: {response.text}")
                    
                    if attempt < self.max_retries - 1 and 500 <= response.status_code < 600:
                        # Server errors can be retried
                        wait_time = min(2 ** attempt, 60)
                        print(f"Server error. Retrying in {wait_time} seconds. Attempt {attempt+1}/{self.max_retries}")
                        time.sleep(wait_time)
                        continue
                    
                    raise Exception(f"Status API returned {response.status_code}: {error_msg}")
                    
            except requests.exceptions.Timeout:
                print(f"Fashn.ai Status API request timed out. Attempt {attempt+1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    time.sleep(min(2 ** attempt, 60))
                    continue
                raise Exception("Request to Fashn.ai Status API timed out after multiple attempts")
                
            except requests.exceptions.ConnectionError:
                print(f"Fashn.ai Status API connection error. Attempt {attempt+1}/{self.max_retries}")
                if attempt < self.max_retries - 1:
                    time.sleep(min(2 ** attempt, 60))
                    continue
                raise Exception("Connection error when calling Fashn.ai Status API after multiple attempts")
                
            except requests.exceptions.RequestException as e:
                print(f"Fashn.ai Status API Request exception: {str(e)}")
                raise Exception(f"Network error when calling Fashn.ai Status API: {str(e)}")
        
        # If we get here, all retries failed
        raise Exception(f"Failed to call Fashn.ai Status API after {self.max_retries} attempts")

    def _normalize_status_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize the status response to handle different response formats
        
        Args:
            response_data: The raw status response data
            
        Returns:
            Normalized status response
        """
        if not isinstance(response_data, dict):
            print(f"Warning: Unexpected response format (not a dict): {type(response_data)}")
            return {'status': 'failed', 'error': 'Invalid response format'}
        
        # Ensure the response contains a status
        if 'status' not in response_data:
            print(f"Warning: Response missing 'status' field: {response_data}")
            return {'status': 'failed', 'error': 'Response missing status field'}
        
        status = response_data['status']
        
        # Handle succeeded/completed status - normalize both to "completed" for our internal representation
        if status == 'succeeded' or status == 'completed':
            # Handle direct array of URLs in output
            if 'output' in response_data and isinstance(response_data['output'], list):
                return {
                    'status': 'completed',
                    'output': {'output_urls': response_data['output']}
                }
            
            # Handle output as an object
            output = response_data.get('output', {})
            
            # The output could be a list or a single item with output_url
            if isinstance(output, list):
                # Handle array output
                output_urls = []
                for item in output:
                    if isinstance(item, dict) and 'output_url' in item:
                        output_urls.append(item['output_url'])
                    elif isinstance(item, str):
                        output_urls.append(item)
                
                if output_urls:
                    return {
                        'status': 'completed',
                        'output': {'output_urls': output_urls}
                    }
            elif isinstance(output, dict):
                # Handle single output object
                if 'output_url' in output:
                    return {
                        'status': 'completed',
                        'output': {'output_url': output['output_url']}
                    }
                elif 'output_urls' in output:
                    return {
                        'status': 'completed',
                        'output': {'output_urls': output['output_urls']}
                    }
            
            # If we got here but still have a completed status, return a basic completed response
            return {
                'status': 'completed',
                'output': response_data.get('output', {})
            }
        
        # Handle failed status
        if status == 'failed':
            error = response_data.get('error', 'Unknown error')
            return {
                'status': 'failed', 
                'error': error
            }
        
        # Handle in-progress status
        progress = 0
        start_time = response_data.get('created_at')
        current_time = time.time()
        
        # If API provides progress, use it
        if 'progress' in response_data:
            try:
                api_progress = float(response_data['progress'])
                
                # If API reports real progress > 0, use it
                if api_progress > 0:
                    progress = api_progress
                    print(f"Using API-reported progress: {progress}")
                # Otherwise, calculate a simulated progress based on elapsed time
                elif start_time:
                    # Calculate time elapsed since request creation in seconds
                    try:
                        # Try parsing ISO timestamp if provided
                        created_time = dateutil.parser.parse(start_time).timestamp()
                        elapsed_seconds = current_time - created_time
                        
                        # Model a sigmoid progress curve with ~2-minute expected completion
                        # Gives better user feedback than just showing 0%
                        max_expected_seconds = 120  # 2 minutes as expected completion time
                        # Normalize time to 0-1 range
                        normalized_time = min(1.0, elapsed_seconds / max_expected_seconds)
                        # Apply sigmoid function to generate realistic progress curve
                        progress = 1 / (1 + math.exp(-10 * (normalized_time - 0.5)))
                        progress = max(0.01, min(0.95, progress))  # Keep between 1-95%
                        
                        print(f"Calculated simulated progress: {progress} based on {elapsed_seconds:.1f}s elapsed")
                    except (ValueError, TypeError, AttributeError):
                        # Fallback to linear progress assuming 2 min completion
                        elapsed_minutes = min(2.0, elapsed_seconds / 60)
                        progress = min(0.95, elapsed_minutes / 2.0)
                        print(f"Using linear progress estimate: {progress}")
                else:
                    # Default minimal progress when no better data available
                    print("No usable time data, defaulting to minimal progress")
                    progress = 0.05  # Show 5% as minimal progress instead of 0%
            except (ValueError, TypeError):
                print(f"Warning: Invalid progress value: {response_data['progress']}")
                progress = 0.05  # Show 5% as minimal progress instead of 0%
        
        return {
            'status': 'processing',
            'progress': progress
        }
