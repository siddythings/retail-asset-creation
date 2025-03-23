#!/usr/bin/env python
"""
Test script for the Leonardo.ai API integration.
"""

import asyncio
import logging
import json
import os
import sys

# Add the parent directory to the path to allow imports from fastapi_backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from fastapi_backend.services.model_generation import ModelGenerationService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def test_leonardo_api_integration():
    """Test the Leonardo.ai API integration with the actual API."""
    print("\n--- Testing Leonardo.ai API Integration ---")
    
    # Initialize the ModelGenerationService
    service = ModelGenerationService()
    
    # Simple test prompt
    prompt = "a man in a black suit"
    attributes = {"gender": "male", "bodySize": "average", "modelType": "Full Body"}
    
    # Test _build_prompt_from_attributes
    print("\n1. Testing prompt building...")
    final_prompt = service._build_prompt_from_attributes(attributes, prompt)
    print(f"Input prompt: '{prompt}'")
    print(f"Input attributes: {attributes}")
    print(f"Final prompt: '{final_prompt[:200]}...'")
    
    # Test create_generation
    print("\n2. Testing create_generation API call...")
    request_data = {
        "prompt": prompt,
        "attributes": attributes,
        "numImages": 1,  # Limit to 1 for testing
        "width": 512,    # Smaller size for faster generation
        "height": 512    # Smaller size for faster generation
    }
    
    try:
        response = await service.create_generation(request_data)
        print(f"API Response: {json.dumps(response, indent=2)}")
        
        if response.get("success", False):
            generation_id = response.get("generationId")
            print(f"Generation submitted successfully with ID: {generation_id}")
            
            # Test check_generation_status
            print("\n3. Testing check_generation_status API call...")
            print("(Note: This will wait for a while until the generation is ready)")
            print("Polling for status updates (max 5 attempts)...")
            
            # Poll for up to 5 attempts to not make the test too long
            for i in range(5):
                print(f"Status check attempt {i+1}...")
                status_response = await service.check_generation_status(generation_id)
                status = status_response.get("status", "")
                print(f"Current status: {status}")
                
                # If the generation is finished, print the results
                if status == "finished":
                    images = status_response.get("images", [])
                    print(f"Generation finished with {len(images)} images")
                    for img in images:
                        print(f"Image URL: {img.get('url')[:50]}...")
                    break
                    
                # If the generation failed, print the error
                elif status in ["failed", "error"]:
                    print(f"Generation failed: {status_response.get('error', 'Unknown error')}")
                    break
                    
                # Wait for a few seconds before checking again
                await asyncio.sleep(10)
            
            print("\nAPI integration test completed")
        else:
            print(f"Generation submission failed: {response.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"Error testing API integration: {str(e)}")

async def test_flux_model_response_parsing():
    """Test parsing of Flux model response."""
    print("\n--- Testing Flux Model Response Parsing ---")
    
    # Initialize the ModelGenerationService
    service = ModelGenerationService()
    
    # Mock a response from the Flux model
    mock_response = {
        "generation": {
            "id": "test_generation_id",
            "status": "COMPLETE",
            "generated_images": [
                {
                    "id": "test_image_id_1",
                    "url": "https://example.com/image1.jpg",
                    "nsfw": False
                },
                {
                    "id": "test_image_id_2",
                    "url": "https://example.com/image2.jpg",
                    "nsfw": False
                }
            ]
        }
    }
    
    # Mock the _make_api_request method to return the mock response
    original_method = service._make_api_request
    
    async def mock_make_api_request(method, endpoint, data=None):
        print(f"Mock API request: {method} {endpoint}")
        return mock_response
    
    # Replace the method with our mock
    service._make_api_request = mock_make_api_request
    
    try:
        # Test check_generation_status with our mock response
        response = await service.check_generation_status("test_generation_id")
        print(f"Parsed response: {json.dumps(response, indent=2)}")
        
        # Check if the response was parsed correctly
        if response.get("success", False) and response.get("status") == "finished":
            print("Successfully parsed Flux model response")
        else:
            print("Failed to parse Flux model response correctly")
    finally:
        # Restore the original method
        service._make_api_request = original_method

if __name__ == "__main__":
    print("Running Leonardo.ai API tests...")
    
    # Run our tests
    asyncio.run(test_leonardo_api_integration())
    asyncio.run(test_flux_model_response_parsing()) 