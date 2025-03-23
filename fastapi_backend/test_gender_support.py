#!/usr/bin/env python
"""
Test script for gender detection and male model generation.
"""

import logging
import sys
import os

# Add the fastapi_backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi_backend.services.model_generation import ModelGenerationService
from fastapi_backend.services.nlp_attribute_detector import attribute_detector

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_gender_detection():
    """Test detection of gender in prompts."""
    print("\n--- Testing Gender Detection ---")
    
    test_cases = [
        "a male model with blue eyes",
        "a man with a slim build",
        "a muscular guy with brown eyes",
        "male, athletic build, caucasian",
        "a woman with green eyes",
        "female model, curvy, blonde hair"
    ]
    
    for prompt in test_cases:
        result = attribute_detector.detect_attributes(prompt)
        print(f"Prompt: '{prompt}'")
        print(f"Gender detected: {result['gender']}")
        print(f"Body size detected: {result['body_size']}")
        print(f"Eye color detected: {result['eye_color']}")
        print("---")

def test_model_generation_prompt_building():
    """Test model generation prompt building with gender detection."""
    print("\n--- Testing Model Generation Prompt Building ---")
    
    service = ModelGenerationService()
    
    test_cases = [
        {
            "prompt": "a male model with blue eyes",
            "attributes": {"gender": "female", "bodySize": "average", "modelType": "Full Body"}
        },
        {
            "prompt": "a woman with green eyes",
            "attributes": {"gender": "male", "bodySize": "average", "modelType": "Full Body"}
        },
        {
            "prompt": "a fat person with red hair",
            "attributes": {"gender": "female", "bodySize": "thin", "modelType": "Full Body"}
        },
        {
            "prompt": "athletic build with casual clothes",
            "attributes": {"gender": "male", "bodySize": "average", "modelType": "Full Body"}
        }
    ]
    
    for case in test_cases:
        prompt = case["prompt"]
        attributes = case["attributes"]
        
        print(f"Input prompt: '{prompt}'")
        print(f"Input attributes: {attributes}")
        
        final_prompt = service._build_prompt_from_attributes(attributes, prompt)
        
        print(f"Final prompt: '{final_prompt[:100]}...'")
        print("---")

if __name__ == "__main__":
    print("Running gender support tests")
    test_gender_detection()
    test_model_generation_prompt_building() 