"""
Service for handling AI model generation functionality using Leonardo.ai API
"""
import os
import json
import time
import asyncio
import logging
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv
from .utils.storage import StorageManager
from .reference_image_analyzer import ReferenceImageAnalyzer
import base64
import re
import random
import uuid

# Import our new NLP attribute detector
from fastapi_backend.services.nlp_attribute_detector import attribute_detector

# Load environment variables
load_dotenv()

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelGenerationService:
    """Service for generating realistic model images using Leonardo.ai API"""
    
    def __init__(self):
        """Initialize the model generation service with configuration from environment variables"""
        self.api_key = os.getenv('LEONARDO_API_KEY', '')
        self.api_url = os.getenv('LEONARDO_API_URL', 'https://cloud.leonardo.ai/api/rest/v1')
        self.enabled = os.getenv('LEONARDO_ENABLED', 'true').lower() == 'true'
        self.max_retries = int(os.getenv('LEONARDO_MAX_RETRIES', '3'))
        self.request_timeout = int(os.getenv('LEONARDO_REQUEST_TIMEOUT', '30'))
        # Use Flux Precision as default
        self.default_model_id = os.getenv('LEONARDO_MODEL_ID', 'b2614463-296c-462a-9586-aafdb8f00e36')  # Flux Precision (Flux Dev)
        self.storage_manager = StorageManager()
        self.reference_analyzer = ReferenceImageAnalyzer()
        
        # Storage directory for generated images
        self.storage_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "model_generation")
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Organize poses into categories for female full body
        self.female_full_body_poses_by_category = {
            "neutral": [
                "standing pose with a relaxed stance, modest clothing, appropriate attire",
                "natural standing pose with weight on one leg, modest clothing, appropriate attire",
                "relaxed posture with arms at sides, modest clothing, appropriate attire",
                "casual stance with feet shoulder-width apart, modest clothing, appropriate attire",
                "poised stance with one foot slightly forward, modest clothing, appropriate attire",
                "relaxed pose with slightly crossed legs, modest clothing, appropriate attire",
                "hands at sides, fingers slightly splayed, relaxed pose, modest clothing, appropriate attire",
                "hands loosely at sides, fingers gently curved, relaxed stance, modest clothing, appropriate attire",
                "hands positioned slightly away from body, open posture, modest clothing, appropriate attire",
                "hands positioned near pockets but not in them, casual stance, modest clothing, appropriate attire"
            ],
            "confident": [
                "confident pose with hands on hips, modest clothing, appropriate attire",
                "arms folded in front, slight smile, relaxed shoulders, modest clothing, appropriate attire",
                "arms crossed at chest, confident expression, weight on one leg, modest clothing, appropriate attire",
                "one arm extended forward as if presenting something, engaged pose, modest clothing, appropriate attire",
                "both hands gesturing outward, expressive stance, modest clothing, appropriate attire",
                "one hand on hip, other arm hanging naturally, casual stance, modest clothing, appropriate attire",
                "one hand extended as if shaking hands, professional pose, modest clothing, appropriate attire",
                "hands clasped in front, professional stance with feet slightly apart, modest clothing, appropriate attire",
                "elegant pose with slight hip tilt, modest clothing, appropriate attire",
                "fingers lightly intertwined in front, formal stance, modest clothing, appropriate attire"
            ],
            "dynamic": [
                "natural walking pose mid-stride, modest clothing, appropriate attire",
                "one arm reaching upward as if pointing, dynamic stance, modest clothing, appropriate attire",
                "arms outstretched to sides, joyful expression, dynamic pose, modest clothing, appropriate attire",
                "walking pose with one foot crossing in front of the other, modest clothing, appropriate attire",
                "action pose as if just starting to walk, full body visible, modest clothing, appropriate attire",
                "twisting pose with upper body turned slightly, dynamic stance, modest clothing, appropriate attire",
                "athletic stance with feet wider than shoulder-width apart, modest clothing, appropriate attire",
                "stepping pose with one foot on slightly higher invisible platform, modest clothing, appropriate attire",
                "hands positioned as if adjusting clothing, natural movement, modest clothing, appropriate attire",
                "graceful pose with one arm raised, ballet-inspired stance, modest clothing, appropriate attire"
            ],
            "artistic": [
                "turning slightly to the side, looking over shoulder, three-quarter view, modest clothing, appropriate attire",
                "side-facing pose with body turned partially toward camera, modest clothing, appropriate attire",
                "contrapposto pose with weight shifted to one leg, artistic stance, modest clothing, appropriate attire",
                "profile view, standing straight, elegant silhouette, modest clothing, appropriate attire",
                "hands behind back, poised posture, slight forward lean, modest clothing, appropriate attire",
                "seated pose on invisible chair, full body still visible, modest clothing, appropriate attire",
                "one hand touching hair, other hand at side, gentle pose, modest clothing, appropriate attire",
                "both hands resting lightly on lower abdomen, gentle pose, modest clothing, appropriate attire",
                "one hand gesturing as if explaining something, engaged pose, modest clothing, appropriate attire",
                "casual pose with one hand in pocket, modest clothing, appropriate attire"
            ]
        }
        
        # Organize poses into categories for male full body
        self.male_full_body_poses_by_category = {
            "neutral": [
                "standing pose with a relaxed stance",
                "natural standing pose with weight on one leg",
                "confident pose with hands at sides",
                "professional stance with feet shoulder-width apart",
                "poised stance with one foot slightly forward",
                "hands positioned naturally at sides, fingers slightly curved",
                "arms relaxed, hands with palms facing forward, open pose",
                "arms slightly bent at elbows, relaxed but alert stance",
                "hands at sides with thumbs in pockets, relaxed business pose",
                "slight lean forward, engaged posture, hands naturally positioned"
            ],
            "confident": [
                "relaxed posture with arms crossed",
                "arms folded across chest, confident expression, strong stance",
                "one hand in pocket, other hand gesturing outward, casual pose",
                "both hands on invisible lapels, power stance, confident pose",
                "hands on invisible belt, authoritative pose, feet set apart",
                "one arm extended as if presenting, engaged business stance",
                "hands positioned as if straightening tie, formal pose",
                "hand gesturing while explaining, professional engagement",
                "hands clasped in front, formal stance with feet slightly apart",
                "one hand adjusting cuff or watch, professional demeanor"
            ],
            "dynamic": [
                "natural walking pose mid-stride",
                "casual stance with weight shifted to one side",
                "walking forward mid-stride, purposeful movement",
                "action pose as if just stopped walking, alert stance",
                "athletic stance with feet wider than shoulders, active pose",
                "stepping forward with purpose, dynamic movement captured",
                "arms positioned in ready stance, athletic pose",
                "hands in motion as if emphasizing a point, dynamic posture",
                "hands positioned as if about to clap, enthusiastic stance",
                "one hand holding invisible object, demonstrative pose"
            ],
            "artistic": [
                "turning to side, profile emphasizing strong silhouette",
                "three-quarter angle view, showing dimension of figure",
                "contrapposto pose with weight on one leg, artistic composition",
                "side view with face turned toward camera, full body visible",
                "slight twist in torso, adding dimension to the pose",
                "casual pose with one hand in pocket",
                "relaxed pose with hands in pockets",
                "seated position on invisible stool, full body still visible",
                "arms slightly out to sides, open posture, welcoming stance",
                "one hand running through hair, casual confident stance"
            ]
        }
        
        # For top-only (upper body) poses, we'll have fewer variations
        self.female_top_poses_by_category = {
            "neutral": [
                "neutral pose, front-facing camera angle, professional studio lighting, modest clothing, appropriate attire",
                "relaxed shoulders, natural expression, straight posture, modest clothing, appropriate attire",
                "slight smile, relaxed arms at sides, professional appearance, modest clothing, appropriate attire",
                "comfortable stance, natural lighting, neutral expression, modest clothing, appropriate attire"
            ],
            "confident": [
                "confident pose with hands on hips, upper body focus, modest clothing, appropriate attire",
                "arms crossed with confident expression, shoulders back, modest clothing, appropriate attire",
                "one hand gesturing, engaged expression, professional demeanor, modest clothing, appropriate attire",
                "hands clasped in front, poised expression, slight head tilt, modest clothing, appropriate attire"
            ],
            "dynamic": [
                "animated expression, one hand gesturing, engaged pose, modest clothing, appropriate attire",
                "slight turn of shoulders, dynamic angle, expressive hands, modest clothing, appropriate attire",
                "mid-motion pose, natural movement, energetic expression, modest clothing, appropriate attire",
                "arms in motion, animated posture, dynamic composition, modest clothing, appropriate attire"
            ],
            "artistic": [
                "artistic lighting, three-quarter angle, elegant composition, modest clothing, appropriate attire",
                "creative pose, unique angle, artistic expression, modest clothing, appropriate attire",
                "stylized portrait, artistic lighting, expressive pose, modest clothing, appropriate attire",
                "profile with face turned toward camera, artistic composition, modest clothing, appropriate attire"
            ]
        }
        
        self.male_top_poses_by_category = {
            "neutral": [
                "neutral pose, front-facing camera angle, professional studio lighting",
                "relaxed shoulders, natural expression, straight posture",
                "professional stance, natural lighting, composed expression",
                "standard portrait position, natural posture, relaxed shoulders"
            ],
            "confident": [
                "confident pose with arms crossed, upper body focus",
                "authoritative stance, shoulders back, direct gaze",
                "one hand adjusting tie or collar, professional expression",
                "business-ready pose, confident expression, poised demeanor"
            ],
            "dynamic": [
                "animated expression, one hand gesturing, engaged pose",
                "mid-explanation pose, hands gesturing, dynamic angle",
                "active upper body pose, energy in expression and posture",
                "dynamic hand motion, engaged stance, expressive look"
            ],
            "artistic": [
                "artistic lighting, three-quarter angle, strong composition",
                "creative pose, unique angle, distinctive expression",
                "stylized portrait, artistic lighting, characterized pose",
                "profile with thoughtful expression, artistic framing"
            ]
        }
        
        # Flatten lists for backward compatibility
        self.female_full_body_poses = []
        for poses in self.female_full_body_poses_by_category.values():
            self.female_full_body_poses.extend(poses)
            
        self.male_full_body_poses = []
        for poses in self.male_full_body_poses_by_category.values():
            self.male_full_body_poses.extend(poses)
            
    def _save_json_file(self, filepath: str, data: Dict[str, Any]) -> None:
        """Save data to a JSON file
        
        Args:
            filepath: Path to the JSON file
            data: Data to save
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving JSON file {filepath}: {e}")
    
    def _load_json_file(self, filepath: str) -> Optional[Dict[str, Any]]:
        """Load data from a JSON file
        
        Args:
            filepath: Path to the JSON file
            
        Returns:
            Loaded data or None if the file doesn't exist or can't be loaded
        """
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading JSON file {filepath}: {e}")
        return None
    
    def _file_exists(self, filepath: str) -> bool:
        """Check if a file exists
        
        Args:
            filepath: Path to the file
            
        Returns:
            True if the file exists, False otherwise
        """
        return os.path.exists(filepath)
    
    def _list_json_files(self, directory: str) -> List[str]:
        """List all JSON files in a directory
        
        Args:
            directory: Directory to search in
            
        Returns:
            List of paths to JSON files
        """
        try:
            if not os.path.exists(directory):
                return []
            return [os.path.join(directory, f) for f in os.listdir(directory) if f.endswith('.json')]
        except Exception as e:
            logger.error(f"Error listing JSON files in {directory}: {e}")
            return []

    async def _make_api_request(self, method: str, endpoint: str, data: Dict = None) -> Dict[str, Any]:
        """Make an API request to the Leonardo.ai API
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            data: Request data (for POST requests)
            
        Returns:
            API response as a dictionary
        """
        # Check if API key is empty
        if not self.api_key or self.api_key.strip() == "":
            raise Exception("Leonardo API key is not set. Please add your API key to the .env file.")
        
        url = f"{self.api_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.request_timeout) as client:
                    if method == "GET":
                        logger.info(f"Making GET request to {endpoint}")
                        response = await client.get(url, headers=headers)
                    elif method == "POST":
                        logger.info(f"Making POST request to {endpoint}")
                        response = await client.post(url, headers=headers, json=data)
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")
                    
                    # Log response status code
                    logger.info(f"API response status code: {response.status_code}")
                    
                    # Handle non-200 responses
                    if response.status_code != 200:
                        error_message = f"API request failed with status code {response.status_code}"
                        try:
                            error_data = response.json()
                            error_message += f": {error_data}"
                        except:
                            error_message += f": {response.text}"
                        
                        logger.error(error_message)
                        
                        # If this is the last retry, raise an exception
                        if attempt == self.max_retries - 1:
                            raise Exception(error_message)
                            
                        # Otherwise, retry after a delay
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    
                    # Parse response
                    try:
                        response_data = response.json()
                        # Log a truncated version of the response for debugging
                        response_excerpt = str(response_data)[:200] + "..." if len(str(response_data)) > 200 else str(response_data)
                        logger.debug(f"API response data: {response_excerpt}")
                        return response_data
                    except Exception as e:
                        error_message = f"Failed to parse API response: {str(e)}"
                        logger.error(error_message)
                        logger.error(f"Response content: {response.text[:1000]}...")
                        
                        # If this is the last retry, raise an exception
                        if attempt == self.max_retries - 1:
                            raise Exception(error_message)
                            
                        # Otherwise, retry after a delay
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
            except Exception as e:
                error_message = f"API request failed: {str(e)}"
                logger.error(error_message)
                
                # If this is the last retry, raise an exception
                if attempt == self.max_retries - 1:
                    raise Exception(error_message)
                    
                # Otherwise, retry after a delay
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
    
    def _build_prompt_from_attributes(self, attributes: Dict[str, Any], prompt: str, reference_description: Optional[str] = None) -> str:
        """Build a comprehensive prompt combining user's text prompt, reference image description, and selected attributes
        
        Args:
            attributes: Selected model attributes
            prompt: User's text prompt
            reference_description: Description from reference image analysis
            
        Returns:
            A comprehensive prompt for the Leonardo.ai API
        """
        # Initialize prompt components
        prompt_parts = []
        
        # Create a combined prompt for NLP analysis (user prompt + reference description)
        combined_user_input = prompt if prompt else ""
        if reference_description:
            combined_user_input += " " + reference_description
        
        # Use NLP to detect attributes mentioned in the combined prompt
        detected_attributes = {}
        if combined_user_input.strip():
            logger.info(f"Analyzing prompt and reference with NLP: {combined_user_input[:100]}...")
            detected_attributes = attribute_detector.detect_attributes(combined_user_input)
            logger.info(f"Detected attributes: {detected_attributes}")
        
        # Check if male is detected in the prompt using the advanced detection
        detected_male = detected_attributes.get("is_male", False)
        
        # Handle gender from attributes or prompt
        gender = attributes.get("gender", "female")
        if gender is None:
            gender = "female"
        
        # Override gender if male is detected in prompt
        if detected_male:
            gender = "male"
            logger.info("Detected male gender in prompt, overriding gender attribute")
        # Or if female is detected in a prompt (when attributes have male)
        elif detected_attributes.get("gender", False) and not detected_male and gender == "male":
            gender = "female"
            logger.info("Detected female gender in prompt, overriding male attribute")
        else:
            logger.info(f"Using gender from attributes: {gender}")
        
        gender = gender.lower()
        
        # Handle model type (Full Body or Top) based on gender
        model_type = attributes.get("modelType", "Full Body")
        
        # Handle pose type selection
        pose_type = attributes.get("poseType", "neutral")
        if pose_type not in ["neutral", "confident", "dynamic", "artistic"]:
            pose_type = "neutral"  # Default to neutral if invalid
        
        logger.info(f"Using pose type: {pose_type}")
        
        # Add STRONG gender indicator at the beginning for Leonardo.ai
        if gender == "male":
            # For male models, add stronger gender indicators to override any bias
            prompt_parts.append("male person, man, masculine")
            
            if model_type == "Full Body":
                # Select a random pose from the chosen category
                pose_options = self.male_full_body_poses_by_category.get(pose_type, self.male_full_body_poses_by_category["neutral"])
                random_pose = random.choice(pose_options)
                prompt_parts.append(f"a realistic photograph of a man, showing entire body from head to toe, full-length portrait with all limbs visible, ensure entire body is in frame, complete figure shot, {random_pose}, including feet, no cropping of body parts, full body composition")
                logger.info(f"Using random male full body pose from '{pose_type}' category: {random_pose}")
            else:  # Top
                # Select a random pose from the top poses category
                pose_options = self.male_top_poses_by_category.get(pose_type, self.male_top_poses_by_category["neutral"])
                random_pose = random.choice(pose_options)
                prompt_parts.append(f"a realistic photograph of a man, three-quarter body portrait from upper thighs to head, with complete visibility of torso, shoulders, chest and upper arms, slightly zoomed out to show entire upper body, front-facing camera angle, {random_pose}")
                logger.info(f"Using random male top pose from '{pose_type}' category: {random_pose}")
                
            # Add clothing type if specified
            wear_type = attributes.get("wearType", "not-defined")
            if wear_type != "not-defined":
                clothing_description = self._get_clothing_description(wear_type, gender)
                prompt_parts.append(clothing_description)
                logger.info(f"Adding clothing description for wear type '{wear_type}'")
        else:
            # For female models
            prompt_parts.append("female person, woman, feminine")
            
            # Get wear type
            wear_type = attributes.get("wearType", "not-defined")
            
            # If wear type is defined, use it instead of generic "modest clothing"
            if wear_type != "not-defined":
                clothing_description = self._get_clothing_description(wear_type, gender)
                prompt_parts.append(clothing_description)
                logger.info(f"Adding clothing description for wear type '{wear_type}'")
            else:
                # Only add safety directives if no specific clothing is defined
                # But still ensure it's not inappropriate
                prompt_parts.append("wearing appropriate, non-revealing outfit")
            
            if model_type == "Full Body":
                # Select a random pose from the chosen category
                pose_options = self.female_full_body_poses_by_category.get(pose_type, self.female_full_body_poses_by_category["neutral"])
                random_pose = random.choice(pose_options)
                prompt_parts.append(f"a realistic photograph of a woman, showing entire body from head to toe, full-length portrait with all limbs visible, ensure entire body is in frame, complete figure shot, {random_pose}, including feet, no cropping of body parts, full body composition")
                logger.info(f"Using random female full body pose from '{pose_type}' category: {random_pose}")
            else:  # Top
                # Select a random pose from the top poses category
                pose_options = self.female_top_poses_by_category.get(pose_type, self.female_top_poses_by_category["neutral"])
                random_pose = random.choice(pose_options)
                prompt_parts.append(f"a realistic photograph of a woman, three-quarter body portrait from upper thighs to head, with complete visibility of torso, shoulders, chest and upper arms, slightly zoomed out to show entire upper body, front-facing camera angle, {random_pose}, perfect for trying on tops and clothing")
                logger.info(f"Using random female top pose from '{pose_type}' category: {random_pose}")
        
        # Priority 1: User's prompt (most important)
        if prompt and prompt.strip():
            prompt_parts.append(prompt)
        
        # Priority 2: Reference image description (if available and not overridden by prompt)
        if reference_description:
            logger.info(f"Using reference image description: {reference_description[:100]}...")
            prompt_parts.append(reference_description)
        
        # Priority 3: Static attributes (if not covered by prompt or reference image)
        # Only add these if not already mentioned in the user prompt or reference description using NLP detection
        
        # Handle body size if not already mentioned in prompt or reference
        body_size = attributes.get("bodySize", "average")
        if body_size is None:
            body_size = "average"
        body_size = body_size.lower()
        
        # Also check for fat/plus-size mentions in the prompt
        fat_terms = ["fat", "plus-size", "plus size", "heavy", "overweight", "large", "big"]
        detected_fat = any(term in combined_user_input.lower() for term in fat_terms)
        if detected_fat:
            body_size = "plus-size"
            logger.info("Detected plus-size/fat in prompt, overriding body size attribute")
        
        # Only add if not already detected by NLP
        if not detected_attributes.get("body_size", False) and not detected_fat:
            # Gender-specific body size descriptions
            if gender == "male":
                body_size_map = {
                    "thin": "a slender, lean man with a slim athletic build, defined features, and a slim waistline",
                    "average": "a man with a balanced, medium build, natural proportions, and healthy physique",
                    "plus-size": "a plus-size man with a larger frame, broad shoulders, and fuller build"
                }
            else:
                body_size_map = {
                    "thin": "an extremely slender woman with a very slim build, prominent bone structure, sharp features, minimal body fat, delicate frame, and a very narrow waistline, reminiscent of high fashion runway models",
                    "average": "a woman with a balanced, medium build, natural curves, and healthy proportions",
                    "plus-size": "a plus-size woman with a fuller figure, curvy silhouette, and larger frame"
                }
            
            if body_size in body_size_map:
                prompt_parts.append(body_size_map[body_size])
                logger.info(f"Adding body size '{body_size}' from attributes (not detected in prompt)")
        else:
            logger.info(f"Body size detected in prompt, not adding from attributes")
        
        # Handle skin color if not already mentioned in prompt or reference
        skin_color = attributes.get("skin_color")
        if skin_color is not None and skin_color != "not-specified":
            # Only add if not already detected by NLP
            if not detected_attributes.get("skin_color", False):
                skin_color = skin_color.lower()
                prompt_parts.append(f"with {skin_color} skin")
                logger.info(f"Adding skin color '{skin_color}' from attributes (not detected in prompt)")
            else:
                logger.info(f"Skin color detected in prompt, not adding from attributes")
        
        # Handle age if not already mentioned in prompt or reference
        age = attributes.get("age")
        if age is not None and age != "not-specified":
            # Only add if not already detected by NLP
            if not detected_attributes.get("age", False):
                age = age.lower()
                
                # Gender-specific age descriptions
                if gender == "male":
                    age_map = {
                        "18-25": "a young man in his early twenties",
                        "25-35": "a man in his late twenties",
                        "35-45": "a middle-aged man",
                        "45-60": "a mature man",
                        "60+": "an elderly man"
                    }
                else:
                    age_map = {
                        "18-25": "a young woman in her early twenties",
                        "25-35": "a woman in her late twenties",
                        "35-45": "a middle-aged woman",
                        "45-60": "a mature woman",
                        "60+": "an elderly woman"
                    }
                
                if age in age_map:
                    prompt_parts.append(age_map[age])
                    logger.info(f"Adding age '{age}' from attributes (not detected in prompt)")
            else:
                logger.info(f"Age detected in prompt, not adding from attributes")
        
        # Handle eye color if not already mentioned in prompt or reference
        eye_color = attributes.get("eyes")
        if eye_color is not None and eye_color != "not-specified":
            # Only add if not already detected by NLP
            if not detected_attributes.get("eye_color", False):
                eye_color = eye_color.lower()
                prompt_parts.append(f"with {eye_color} eyes")
                logger.info(f"Adding eye color '{eye_color}' from attributes (not detected in prompt)")
            else:
                logger.info(f"Eye color detected in prompt, not adding from attributes")
        
        # Add quality directives for realism
        prompt_parts.append("photorealistic, highly detailed, professional photography, 8k")
        
        # Add explicit negative prompt parameters for gender accuracy
        if gender == "male":
            negative_prompt = "woman, female, girl, feminine features, breasts, female model, dress, skirt, female clothes"
        else:
            # Get wear type for NSFW filtering adjustments
            wear_type = attributes.get("wearType", "not-defined")
            
            # Base negative prompt for female models to prevent NSFW content
            negative_prompt = "man, male, masculine features, beard, mustache, male model, suit, tie, male clothes, nude, nudity, naked, topless, explicit content, suggestive poses, inappropriate content, adult content, nsfw, sexual, sexualized, pornographic"
            
            # Check if enhanced NSFW prevention is requested
            prevent_nsfw = attributes.get("preventNsfw", True)
            if prevent_nsfw:
                # For swimwear, we need to relax some restrictions but still maintain appropriate content
                if wear_type == "swimsuit":
                    # Modified negative prompt for swimwear that allows appropriate swimsuits
                    negative_prompt += ", exposed skin, lingerie, underwear, see-through clothing, transparent, sheer fabric, suggestive, revealing, inappropriate"
                    
                    # Add positive prompt guidance for appropriate swimwear
                    prompt_parts.append("appropriate modest swimwear, one-piece swimsuit, tasteful beach attire, family-friendly swimsuit")
                    logger.info("Added swimwear-appropriate content guidance")
                else:
                    # Standard stronger NSFW prevention for non-swimwear
                    negative_prompt += ", exposed skin, short skirt, short shorts, crop top, transparent, sheer fabric, low cut, low neckline, tight-fitting, form-fitting, body-hugging, open back, slit, cutout, bare midriff, bare shoulders, strapless, tube top, tank top, camisole, bralette, bodysuit, leotard, stockings, garter, high heels, miniskirt, hot pants, leggings, yoga pants, lingerie, underwear, bikini, swimwear"
                    
                    # Only add conservative clothing prompts for non-defined wear types
                    # For specific wear types, we already have clothing descriptions from _get_clothing_description
                    if wear_type == "not-defined":
                        prompt_parts.append("business casual attire, conservative clothing, workplace appropriate, family-friendly, fully clothed, fully covered, department store catalog style")
                    
                    logger.info("Added enhanced NSFW prevention terms to the prompt")
        
        # Combine all parts
        final_prompt = ", ".join(prompt_parts)
        
        # Set the negative prompt in the context for later use
        self.gender_negative_prompt = negative_prompt
        
        return final_prompt
    
    async def analyze_reference_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Analyze a reference image using the OpenAI GPT-4o model
        
        Args:
            image_data: Raw image data as bytes
            
        Returns:
            Analysis results with extracted attributes
        """
        try:
            logger.info("Analyzing reference image...")
            analysis_result = await self.reference_analyzer.analyze_reference_image(image_data)
            
            if not analysis_result.get("success", False):
                logger.error(f"Reference image analysis failed: {analysis_result.get('error')}")
                return {
                    "success": False,
                    "error": analysis_result.get("error", "Unknown error analyzing reference image")
                }
                
            logger.info("Reference image analysis successful")
            return analysis_result
        except Exception as e:
            logger.error(f"Error in reference image analysis: {str(e)}")
            return {
                "success": False,
                "error": f"Error in reference image analysis: {str(e)}"
            }
    
    async def create_generation(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a model generation request to Leonardo.ai API
        
        Args:
            request_data: The generation request data
            
        Returns:
            Response with generation task ID
        """
        try:
            # Extract request data
            prompt = request_data.get("prompt", "")
            attributes = request_data.get("attributes", {})
            reference_image_data = request_data.get("referenceImageData")
            
            # Ensure attributes is a dictionary
            if attributes is None:
                attributes = {}
                
            # Check for both parameter names to ensure backward compatibility
            # Frontend should be sending num_images, but check both to be safe
            num_images = request_data.get("num_images", request_data.get("numImages", 1))
            width = request_data.get("width", 1024)
            height = request_data.get("height", 1024)
            model_id = request_data.get("modelId", self.default_model_id)
            
            # Make sure modelId is not None
            if model_id is None:
                model_id = self.default_model_id
                
            alchemy = request_data.get("alchemy", True)  # Quality mode by default
            ultra = request_data.get("ultra", False)
            style_uuid = request_data.get("styleUUID", "556c1ee5-ec38-42e8-955a-1e82dad0ffa1")  # None style by default
            contrast = request_data.get("contrast", 3.5)  # Medium contrast by default
            enhance_prompt = request_data.get("enhancePrompt", False)
            
            # Process reference image if provided
            reference_description = None
            has_reference_image = False
            if reference_image_data:
                has_reference_image = True
                logger.info("Reference image provided, analyzing...")
                analysis_result = await self.analyze_reference_image(reference_image_data)
                
                if analysis_result.get("success", False):
                    reference_description = analysis_result.get("prompt_description", "")
                    logger.info(f"Successfully extracted reference description: {reference_description[:100]}...")
                else:
                    logger.warning(f"Failed to analyze reference image: {analysis_result.get('error')}")
            
            # Build comprehensive prompt from attributes, prompt, and reference image
            final_prompt = self._build_prompt_from_attributes(attributes, prompt, reference_description)
            
            # Get the gender-specific negative prompt
            gender_negative_prompt = getattr(self, 'gender_negative_prompt', "")
            
            # Standard negative prompt elements - modified to be less restrictive on poses
            standard_negative_prompt = "deformed, distorted, disfigured, poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, amputation, cartoon, anime, painted, abstract, additional fingers, mutated hands, poorly drawn hands, missing feet, headshot, face only"
            
            # Combine with gender-specific negative prompt if available
            negative_prompt = f"{standard_negative_prompt}, {gender_negative_prompt}" if gender_negative_prompt else standard_negative_prompt
            
            # Check if there was an error in prompt building
            if final_prompt.startswith("Error:"):
                return {"success": False, "error": final_prompt}
            
            # Define model groups for compatibility
            phoenix_models = [
                "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",  # Phoenix 1.0
                "6b645e3a-d64f-4341-a6d8-7a3690fbf042"   # Phoenix 0.9 
            ]
            
            flux_models = [
                "b2614463-296c-462a-9586-aafdb8f00e36",  # Flux Precision (Flux Dev)
                "1dd50843-d653-4516-a8e3-f0238ee453ff"   # Flux Speed (Flux Schnell)
            ]
            
            # Check which model family we're using
            is_phoenix_model = model_id in phoenix_models
            is_flux_model = model_id in flux_models
            
            # Disable ultra mode if not using a Phoenix model
            if ultra and not is_phoenix_model:
                logger.warning(f"Ultra mode is only supported for Phoenix models. Disabling ultra mode.")
                ultra = False
            
            # Disable alchemy mode if using a Flux model
            if alchemy and is_flux_model:
                logger.warning(f"Alchemy mode is not supported for Flux models. Disabling alchemy mode.")
                alchemy = False
            
            # Log model choice and parameters for debugging
            logger.info(f"Using model: {model_id} with parameters: ultra={ultra}, alchemy={alchemy}")

            # Truncate prompt for logging to avoid extremely long logs
            log_prompt = final_prompt[:50] + "..." if len(final_prompt) > 50 else final_prompt
            
            # Prepare the generation request payload for the Leonardo.ai API
            generation_data = {
                "modelId": model_id,
                "prompt": final_prompt,
                "negative_prompt": negative_prompt,
                "num_images": num_images,
                "width": width,
                "height": height,
                "contrast": contrast,
                "styleUUID": style_uuid,
                "enhancePrompt": enhance_prompt
            }
            
            # Add Phoenix model parameters if applicable
            if is_phoenix_model:
                if ultra:
                    generation_data["ultra"] = True
                if alchemy:
                    generation_data["alchemy"] = True
                
            # Log the data we're sending (with truncated prompt)
            log_data = generation_data.copy()
            log_data["prompt"] = log_prompt
            logger.info(f"Making POST request to /generations with data: {log_data}")

            # Submit the generation request to the Leonardo.ai API
            response = await self._make_api_request("POST", "/generations", data=generation_data)
            
            # Log the full response for debugging (truncated for sensitive data)
            logger.debug(f"Leonardo.ai API response: {str(response)[:1000]}")
            logger.info(f"API response keys: {list(response.keys())}")

            # Add complete dump of the response structure to help with debugging
            if "sdGenerationJob" in response:
                logger.info("Found sdGenerationJob in response")
                sd_job = response.get("sdGenerationJob", {})
                if isinstance(sd_job, dict):
                    logger.info(f"sdGenerationJob keys: {list(sd_job.keys())}")
                    if "id" in sd_job:
                        logger.info(f"sdGenerationJob has ID: {sd_job['id']}")
                    if "generationId" in sd_job:
                        logger.info(f"sdGenerationJob has generationId: {sd_job['generationId']}")
                else:
                    logger.info(f"sdGenerationJob is not a dictionary: {type(sd_job)}")
            
            # Extract the generation ID based on the model type
            generation_id = None
            
            # Phoenix and Flux models return data in different formats
            if is_phoenix_model or "sdGenerationJob" in response:
                if "sdGenerationJob" in response:
                    generation_job = response.get("sdGenerationJob", {})
                    
                    # Check if generation_job is a dictionary
                    if isinstance(generation_job, dict):
                        # Try to extract the ID from different possible field names
                        if "generationId" in generation_job:
                            generation_id = generation_job.get("generationId")
                            logger.info(f"Successfully extracted generationId from sdGenerationJob: {generation_id}")
                        elif "id" in generation_job:
                            generation_id = generation_job.get("id")
                            logger.info(f"Successfully extracted id from sdGenerationJob: {generation_id}")
                        elif "generation_id" in generation_job:
                            generation_id = generation_job.get("generation_id")
                            logger.info(f"Successfully extracted generation_id from sdGenerationJob: {generation_id}")
                        else:
                            # If we can't find an ID field, log the structure and return an error
                            logger.error(f"Could not find ID in sdGenerationJob structure. Available keys: {list(generation_job.keys())}")
                            logger.error(f"sdGenerationJob content (truncated): {str(generation_job)[:300]}...")
                    else:
                        # If generation_job is not a dictionary
                        logger.warning(f"sdGenerationJob is not a dictionary: {type(generation_job)}")
                        if isinstance(generation_job, str) and len(generation_job) > 5:
                            # If it's a string and looks like it could be an ID
                            if not generation_id:
                                generation_id = generation_job
                                logger.info(f"Using sdGenerationJob string as ID: {generation_id}")
                else:
                    generation_id = response.get("sdGenerationJob", {}).get("generationId")
                
                # Final check for Phoenix model
                if not generation_id and "sdGenerationJob" in response and isinstance(response["sdGenerationJob"], dict) and "generationId" in response["sdGenerationJob"]:
                    generation_id = response["sdGenerationJob"]["generationId"]
                    logger.info(f"Direct access to sdGenerationJob.generationId: {generation_id}")
            else:  # Flux model
                # For Flux models, try different response formats
                if "generationId" in response:
                    generation_id = response.get("generationId")
                elif "id" in response:
                    generation_id = response.get("id")
                elif "generation_id" in response:
                    generation_id = response.get("generation_id")
                # If we still don't have an ID, check for nested structures
                elif "generations_by_pk" in response:
                    generation_id = response.get("generations_by_pk", {}).get("id")
                elif "generation" in response:
                    generation_id = response.get("generation", {}).get("id")
            
            # If still no generation ID, try a different approach based on the API's response
            if not generation_id and "sdGenerationJob" in response:
                # Try parsing the sdGenerationJob directly if it's not a dict
                sd_job = response.get("sdGenerationJob")
                if isinstance(sd_job, str):
                    logger.info("sdGenerationJob is a string, using it directly as generation ID")
                    generation_id = sd_job
                
            # If we still don't have an ID, as a last resort try to find any field containing 'id'
            if not generation_id:
                logger.error(f"Could not find generation ID in response. Response keys: {list(response.keys())}")
                # Try to find any field that might contain 'id' or 'generationId'
                potential_id_keys = [k for k in response.keys() if 'id' in k.lower()]
                if potential_id_keys:
                    logger.info(f"Found potential ID keys: {potential_id_keys}")
                    for key in potential_id_keys:
                        logger.info(f"Value for {key}: {response.get(key)}")
                    # Try the first potential key
                    if potential_id_keys:
                        generation_id = response.get(potential_id_keys[0])
                        logger.info(f"Using {potential_id_keys[0]} as generation ID: {generation_id}")
                    
                # Try to salvage something from the response as ID if all else fails
                if not generation_id and response:
                    for key, value in response.items():
                        if isinstance(value, (str, int)) and key != "success" and key != "error":
                            logger.warning(f"Desperate measure: using {key}: {value} as generation ID")
                            generation_id = str(value)
                            break
                
                # If we still don't have an ID, return an error
                if not generation_id:
                    return {
                        "success": False,
                        "error": "Failed to get generation ID from response"
                    }
            
            logger.info(f"Generation submitted successfully with ID: {generation_id}")
            
            return {
                "success": True,
                "generationId": generation_id,
                "message": "Generation submitted successfully"
            }
        except Exception as e:
            logger.error(f"Error submitting generation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "status": "error",
                "error": f"Error submitting generation: {str(e)}"
            }
    
    async def check_generation_status(self, generation_id: str) -> Dict[str, Any]:
        """Check the status of a generation
        
        Args:
            generation_id: ID of the generation to check
            
        Returns:
            Status response with images if available
        """
        try:
            # Make a GET request to check the status
            endpoint = f"/generations/{generation_id}"
            logger.info(f"Making GET request to {endpoint}")
            
            response = await self._make_api_request("GET", endpoint)
            
            # Log response for debugging (truncated for large responses)
            response_excerpt = str(response)[:500] + "..." if len(str(response)) > 500 else str(response)
            logger.info(f"Generation status response keys: {list(response.keys())}")
            logger.debug(f"Generation status response: {response_excerpt}")
            
            # Add an attempt to extract generationId from the response if missing
            # Sometimes the API returns a different ID in the status response
            if "generationId" in response and response.get("generationId") != generation_id:
                logger.info(f"API returned a different generationId: {response.get('generationId')}")
                generation_id = response.get("generationId")
            
            # Try all known response formats in sequence
            
            # Check if the response uses the Flux API format (has generations_by_pk)
            if "generations_by_pk" in response:
                logger.info("Using Flux API response format (generations_by_pk)")
                generation = response.get("generations_by_pk", {})
                status = generation.get("status", "PENDING")
                
                # Log available fields
                logger.info(f"generations_by_pk keys: {list(generation.keys())}")
                
                # Check for images in the generated_images field
                generated_images = generation.get("generated_images", [])
                logger.info(f"Found images in generated_images field (Flux format): {len(generated_images)}")
                
                # Map status values
                if status == "COMPLETE":
                    status = "finished"
                elif status == "FAILED":
                    status = "failed"
                elif status == "PENDING":
                    status = "processing"
                else:
                    status = "processing"  # Default to processing for unknown status
                    
                # Extract the images
                images = []
                for img in generated_images:
                    image_url = img.get("url", "")
                    image_id = img.get("id", "")
                    nsfw = img.get("nsfw", False)
                    
                    if image_url:
                        logger.info(f"Added image with URL: {image_url[:50]}...")
                        images.append({
                            "url": image_url,
                            "id": image_id,
                            "nsfw": nsfw
                        })
                        
                # Return the status with images if available
                response_data = {
                    "success": True,
                    "status": status,
                    "images": images if images else None,
                    "error": None
                }
                
                # Save results if finished
                if status == "finished" and images:
                    result_data = {
                        "generationId": generation_id,
                        "images": images,
                        "timestamp": time.time()
                    }
                    json_path = os.path.join(self.storage_dir, f"{generation_id}.json")
                    self._save_json_file(json_path, result_data)
                    logger.info(f"Saved results to {json_path}")
                    
                logger.info(f"Returning status response with {len(images)} images")
                logger.info(f"Current status: {status}")
                return response_data
                
            # Legacy Phoenix API response format
            elif "sdGenerationJob" in response:
                logger.info("Using Phoenix API response format (sdGenerationJob)")
                generation_job = response.get("sdGenerationJob", {})
                
                # Log available fields
                if isinstance(generation_job, dict):
                    logger.info(f"sdGenerationJob keys: {list(generation_job.keys())}")
                    
                    # Try to extract status directly
                    status = generation_job.get("status", "")
                    if not status and "status" in generation_job:
                        status = generation_job["status"]  # Direct access
                        
                    # Also check common nested structures
                    if "generation" in generation_job and isinstance(generation_job["generation"], dict):
                        generation = generation_job["generation"]
                        logger.info(f"Found nested generation with keys: {list(generation.keys())}")
                        if not status and "status" in generation:
                            status = generation["status"]
                else:
                    logger.info(f"sdGenerationJob is not a dictionary: {type(generation_job)}")
                    # Try to convert to dict if it's a string
                    if isinstance(generation_job, str):
                        try:
                            import json
                            generation_job = json.loads(generation_job)
                            logger.info(f"Converted sdGenerationJob to dict with keys: {list(generation_job.keys())}")
                            status = generation_job.get("status", "")
                        except:
                            logger.warning("Failed to convert sdGenerationJob string to dict")
                            status = ""
                    else:
                        status = ""
                
                # Extract status from the top level if not found in sdGenerationJob
                if not status:
                    status = response.get("status", "PENDING")
                
                # Map status values
                if status in ["COMPLETE", "complete", "FINISHED", "finished"]:
                    status = "finished"
                elif status in ["FAILED", "failed", "ERROR", "error"]:
                    status = "failed"
                elif status in ["PENDING", "pending", "PROCESSING", "processing", "IN_PROGRESS", "in_progress"]:
                    status = "processing"
                else:
                    status = "processing"  # Default to processing for unknown status
                    
                # Extract the generated images if available
                generated_images = []
                if "generatedImages" in generation_job:
                    generated_images = generation_job.get("generatedImages", [])
                elif "generated_images" in generation_job:
                    generated_images = generation_job.get("generated_images", [])
                
                logger.info(f"Found {len(generated_images)} images in generatedImages field (Phoenix format)")
                
                # Format the images
                images = []
                for img in generated_images:
                    image_url = img.get("url", "")
                    image_id = img.get("id", "")
                    nsfw = img.get("nsfw", False)
                    
                    if image_url:
                        logger.info(f"Added image with URL: {image_url[:50]}...")
                        images.append({
                            "url": image_url,
                            "id": image_id,
                            "nsfw": nsfw
                        })
                
                # Return the status with images if available
                response_data = {
                    "success": True,
                    "status": status,
                    "images": images if images else None,
                    "error": None
                }
                
                # Save results if finished
                if status == "finished" and images:
                    result_data = {
                        "generationId": generation_id,
                        "images": images,
                        "timestamp": time.time()
                    }
                    json_path = os.path.join(self.storage_dir, f"{generation_id}.json")
                    self._save_json_file(json_path, result_data)
                    logger.info(f"Saved results to {json_path}")
                    
                logger.info(f"Returning status response with {len(images)} images")
                logger.info(f"Current status: {status}")
                return response_data
                
            # Direct Generation Object
            elif "generation" in response:
                logger.info("Using direct Generation object format")
                generation = response.get("generation", {})
                
                # Log available fields
                logger.info(f"generation keys: {list(generation.keys())}")
                
                status = generation.get("status", "PENDING")
                
                # Map status values
                if status in ["COMPLETE", "complete", "FINISHED", "finished"]:
                    status = "finished"
                elif status in ["FAILED", "failed", "ERROR", "error"]:
                    status = "failed"
                else:
                    status = "processing"
                    
                # Check for images in various fields
                generated_images = []
                if "generated_images" in generation:
                    generated_images = generation.get("generated_images", [])
                elif "generatedImages" in generation:
                    generated_images = generation.get("generatedImages", [])
                elif "images" in generation:
                    generated_images = generation.get("images", [])
                
                logger.info(f"Found {len(generated_images)} images in generation object")
                
                # Format the images
                images = []
                for img in generated_images:
                    image_url = img.get("url", "")
                    image_id = img.get("id", "")
                    nsfw = img.get("nsfw", False)
                    
                    if image_url:
                        logger.info(f"Added image with URL: {image_url[:50]}...")
                        images.append({
                            "url": image_url,
                            "id": image_id,
                            "nsfw": nsfw
                        })
                
                # Return the status with images if available
                response_data = {
                    "success": True,
                    "status": status,
                    "images": images if images else None,
                    "error": None
                }
                
                # Save results if finished
                if status == "finished" and images:
                    result_data = {
                        "generationId": generation_id,
                        "images": images,
                        "timestamp": time.time()
                    }
                    json_path = os.path.join(self.storage_dir, f"{generation_id}.json")
                    self._save_json_file(json_path, result_data)
                    logger.info(f"Saved results to {json_path}")
                    
                logger.info(f"Returning status response with {len(images)} images")
                logger.info(f"Current status: {status}")
                return response_data
                
            # Generic top-level format (images directly in response)
            elif "images" in response or "generatedImages" in response or "generated_images" in response:
                logger.info("Using generic top-level image format")
                
                # Try to find status in response
                status = response.get("status", "processing")
                
                # Map status values
                if status in ["COMPLETE", "complete", "FINISHED", "finished"]:
                    status = "finished"
                elif status in ["FAILED", "failed", "ERROR", "error"]:
                    status = "failed"
                else:
                    status = "processing"
                    
                # Find images in whatever field they might be in
                generated_images = []
                if "images" in response:
                    generated_images = response.get("images", [])
                elif "generatedImages" in response:
                    generated_images = response.get("generatedImages", [])
                elif "generated_images" in response:
                    generated_images = response.get("generated_images", [])
                
                logger.info(f"Found {len(generated_images)} images in top-level response")
                
                # Format the images
                images = []
                for img in generated_images:
                    if not isinstance(img, dict):
                        continue
                        
                    image_url = img.get("url", "")
                    image_id = img.get("id", "")
                    nsfw = img.get("nsfw", False)
                    
                    if image_url:
                        logger.info(f"Added image with URL: {image_url[:50]}...")
                        images.append({
                            "url": image_url,
                            "id": image_id,
                            "nsfw": nsfw
                        })
                
                # If we found images but status isn't finished, update it
                if images and status != "finished":
                    logger.info(f"Found {len(images)} images but status is {status}, updating to finished")
                    status = "finished"
                
                # Return the status with images if available
                response_data = {
                    "success": True,
                    "status": status,
                    "images": images if images else None,
                    "error": None
                }
                
                # Save results if finished
                if status == "finished" and images:
                    result_data = {
                        "generationId": generation_id,
                        "images": images,
                        "timestamp": time.time()
                    }
                    json_path = os.path.join(self.storage_dir, f"{generation_id}.json")
                    self._save_json_file(json_path, result_data)
                    logger.info(f"Saved results to {json_path}")
                    
                logger.info(f"Returning status response with {len(images)} images")
                logger.info(f"Current status: {status}")
                return response_data
                
            # Handle other potential response formats
            else:
                logger.warning(f"Unknown response format. Keys: {list(response.keys())}")
                
                # Try to find status and images in the top-level response
                status = response.get("status", "processing")
                
                # Map status values from various possible formats
                if status in ["COMPLETE", "complete", "FINISHED", "finished"]:
                    status = "finished"
                elif status in ["FAILED", "failed", "ERROR", "error"]:
                    status = "failed"
                else:
                    status = "processing"
                    
                # Look for images in various possible fields
                images = []
                
                # Check for images in common fields
                potential_image_fields = ["images", "generatedImages", "generated_images", "results"]
                
                for field in potential_image_fields:
                    if field in response and isinstance(response[field], list):
                        img_list = response[field]
                        logger.info(f"Found {len(img_list)} images in field: {field}")
                        
                        for img in img_list:
                            if isinstance(img, dict):
                                image_url = img.get("url", "")
                                image_id = img.get("id", str(uuid.uuid4()))  # Generate ID if not present
                                nsfw = img.get("nsfw", False)
                                
                                if image_url:
                                    logger.info(f"Added image with URL: {image_url[:50]}...")
                                    images.append({
                                        "url": image_url,
                                        "id": image_id,
                                        "nsfw": nsfw
                                    })
                
                # Return the status with images if available
                response_data = {
                    "success": True,
                    "status": status,
                    "images": images if images else None,
                    "error": None
                }
                
                # Save results if finished
                if status == "finished" and images:
                    result_data = {
                        "generationId": generation_id,
                        "images": images,
                        "timestamp": time.time()
                    }
                    json_path = os.path.join(self.storage_dir, f"{generation_id}.json")
                    self._save_json_file(json_path, result_data)
                    logger.info(f"Saved results to {json_path}")
                    
                logger.info(f"Returning status response with {len(images)} images")
                logger.info(f"Current status: {status}")
                return response_data
                
        except Exception as e:
            logger.error(f"Error checking generation status: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "status": "error",
                "error": f"Error checking generation status: {str(e)}"
            }
    
    async def execute_generation(self, request_data: Dict[str, Any], max_attempts: int = 60, sleep_time: int = 3) -> Dict[str, Any]:
        """Execute a model generation request and poll for results
        
        Args:
            request_data: The generation request data
            max_attempts: Maximum number of polling attempts
            sleep_time: Sleep time between polling attempts in seconds
            
        Returns:
            Response with status and results if finished
        """
        try:
            # First, create the generation
            response = await self.create_generation(request_data)
            
            if not response.get("success", False):
                return response
            
            generation_id = response.get("generationId")
            
            # Poll for results
            for attempt in range(max_attempts):
                logger.info(f"Checking generation status (attempt {attempt + 1}/{max_attempts})")
                
                # Check the generation status
                status_response = await self.check_generation_status(generation_id)
                
                # If the status is finished or failed, return the results
                if status_response.get("status") in ["finished", "failed", "error"]:
                    return status_response
                
                # Return success:false if the status_response indicates an error
                if not status_response.get("success", False):
                    return status_response
                
                # Sleep before the next poll
                await asyncio.sleep(sleep_time)
            
            # If we reach here, we've exceeded the maximum number of attempts
            # Return a timeout response instead of an error
            logger.warning(f"Generation timed out after {max_attempts} attempts")
            return {
                "success": True,
                "status": "processing",
                "generationId": generation_id,
                "error": None,
                "message": f"Generation still processing after {max_attempts * sleep_time} seconds. Check status endpoint for updates."
            }
        except Exception as e:
            logger.error(f"Error executing generation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "status": "error",
                "error": f"Error executing generation: {str(e)}"
            }
    
    async def get_gallery_results(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all saved model generation results for the gallery
        
        Args:
            limit: Maximum number of results to return
            
        Returns:
            List of generation results
        """
        results = []
        
        try:
            # Get all JSON files in the storage directory
            json_files = self._list_json_files(self.storage_dir)
            
            # Sort by creation time, newest first
            json_files.sort(key=lambda x: os.path.getctime(x), reverse=True)
            
            # Limit the number of files
            json_files = json_files[:limit]
            
            # Load each file and add to results if it has completed results
            for file_path in json_files:
                try:
                    data = self._load_json_file(file_path)
                    if data and data.get("completed", False) and data.get("results"):
                        results.append({
                            "generationId": data.get("generationId", ""),
                            "prompt": data.get("prompt", ""),
                            "timestamp": data.get("timestamp", 0),
                            "completedTimestamp": data.get("completedTimestamp", 0),
                            "results": data.get("results", [])
                        })
                except Exception as e:
                    logger.error(f"Error loading file {file_path}: {str(e)}")
                    continue
            
            return results
        except Exception as e:
            logger.error(f"Error getting gallery results: {str(e)}")
            return []
    
    def _get_clothing_description(self, wear_type: str, gender: str) -> str:
        """Get a clothing description based on wear type and gender
        
        Args:
            wear_type: Type of clothing to describe
            gender: Gender of the model (male or female)
            
        Returns:
            A descriptive string for the requested clothing type
        """
        if gender == "male":
            # Male clothing descriptions
            descriptions = {
                "casual": "wearing casual everyday clothes, t-shirt and jeans, relaxed fit, comfortable casual style",
                "formal": "wearing formal attire, dress shirt, slacks, tie, formal shoes, elegant outfit",
                "business": "wearing business attire, well-fitted suit, dress shirt, tie, professional business style",
                "long-dress": "wearing a long formal gown, elegant male formal attire, long stylish outfit",
                "short-dress": "wearing semi-formal attire, stylish short outfit, fashionable male semi-formal wear",
                "t-shirt-jeans": "wearing a casual t-shirt and blue jeans, relaxed everyday wear, comfortable casual outfit",
                "t-shirt": "wearing a simple t-shirt, casual style, relaxed everyday top",
                "blouse": "wearing a smart button-up shirt, fashionable top, stylish male blouse alternative",
                "suit": "wearing a well-tailored suit, professional business attire, formal jacket and pants",
                "swimsuit": "wearing appropriate male swimwear, swimming trunks, beach-appropriate attire",
                "sportswear": "wearing athletic clothes, sports outfit, performance workout gear, activewear",
                "streetwear": "wearing trendy streetwear, urban style, fashionable casual clothes"
            }
        else:
            # Female clothing descriptions
            descriptions = {
                "casual": "wearing casual everyday clothes, comfortable style, relaxed casual outfit, appropriate daywear",
                "formal": "wearing a formal outfit, elegant attire, sophisticated formal wear, tasteful dress",
                "business": "wearing business attire, professional outfit, well-fitted business clothes, office-appropriate style",
                "long-dress": "wearing a long elegant dress, full-length gown, floor-length dress, formal long dress",
                "short-dress": "wearing a knee-length dress, midi dress, appropriate-length fashionable dress",
                "t-shirt-jeans": "wearing a casual t-shirt and blue jeans, relaxed outfit, comfortable everyday wear",
                "t-shirt": "wearing a simple t-shirt, casual style, comfortable everyday top",
                "blouse": "wearing a stylish blouse, fashionable top, elegant shirt",
                "suit": "wearing a professional business suit, tailored jacket and skirt/pants, formal work attire",
                "swimsuit": "wearing a modest one-piece swimsuit, appropriate swim attire, tasteful beachwear",
                "sportswear": "wearing athletic clothes, sports outfit, workout gear, fitness attire, activewear",
                "streetwear": "wearing trendy streetwear, urban style, fashionable casual clothes"
            }
            
        # Return the description for the requested wear type, or a default if not found
        return descriptions.get(wear_type, "wearing appropriate, stylish clothing") 