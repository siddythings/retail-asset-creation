"""
Service for analyzing reference images to extract detailed descriptions for model generation
"""
import os
import base64
import io
import logging
from typing import Dict, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv
from PIL import Image

# Load environment variables
load_dotenv()

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReferenceImageAnalyzer:
    """Service for analyzing reference images to extract physical attributes using OpenAI GPT-4o"""
    
    def __init__(self):
        """Initialize the reference image analyzer with OpenAI API"""
        self.api_key = os.getenv('OPENAI_API_KEY', '')
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o')
        self.client = None
        
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            logger.warning("OpenAI API key not provided. Reference image analysis will not work.")
    
    def _encode_image(self, image_data: bytes) -> str:
        """
        Encode image data to base64 for OpenAI API
        
        Args:
            image_data: Raw image data as bytes
            
        Returns:
            base64 encoded image string
        """
        try:
            # First try to open the image to validate it
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            return base64_image
        except Exception as e:
            logger.error(f"Error encoding image: {str(e)}")
            raise ValueError(f"Invalid image data: {str(e)}")
    
    async def analyze_reference_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Analyze a reference image to extract physical attributes
        
        Args:
            image_data: Raw image data as bytes
            
        Returns:
            Dictionary of extracted attributes
        """
        if not self.client:
            logger.error("OpenAI client not initialized")
            return {
                "success": False,
                "error": "OpenAI API key not configured"
            }
        
        try:
            # Encode the image
            base64_image = self._encode_image(image_data)
            
            # Prepare the system prompt for detailed physical attribute extraction
            system_prompt = """
            You are an expert in analyzing physical attributes of models in photographs. Your task is to extract 
            detailed physical attributes from the reference image to help generate a similar looking model.
            
            Analyze ONLY the main female subject/model in the image. Focus on physical attributes that define 
            their appearance:
            
            1. Face shape, features, and structure
            2. Hair color, style, texture, and length
            3. Eye color, shape, and size
            4. Nose shape and size
            5. Lip shape and fullness
            6. Skin tone and complexion
            7. Body type and build
            8. Age range
            9. Ethnicity (if clearly identifiable)
            10. Distinctive facial features
            
            Provide your analysis in JSON format with detailed descriptions for each attribute. Include ONLY 
            physical attributes, not clothing, background, or subjective qualities.
            
            Also include a concise "prompt_description" field with a well-crafted description for model 
            generation that captures the essence of this specific person's appearance, optimized for text-to-image models.
            """
            
            # Call the GPT-4o API
            logger.info("Calling OpenAI API to analyze reference image")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": [
                        {"type": "image_url", 
                         "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]}
                ],
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            # Extract and parse the response
            if not response.choices:
                logger.error("No response from OpenAI API")
                return {
                    "success": False,
                    "error": "Failed to get response from OpenAI"
                }
            
            response_text = response.choices[0].message.content
            
            # Try to parse the JSON string to a dictionary
            try:
                import json
                analysis = json.loads(response_text)
                
                # Return the results
                return {
                    "success": True,
                    "analysis": analysis,
                    "prompt_description": analysis.get("prompt_description", "")
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {str(e)}")
                return {
                    "success": False,
                    "error": f"Failed to parse analysis: {str(e)}",
                    "raw_response": response_text
                }
                
        except Exception as e:
            logger.error(f"Error analyzing reference image: {str(e)}")
            return {
                "success": False,
                "error": f"Error analyzing reference image: {str(e)}"
            } 