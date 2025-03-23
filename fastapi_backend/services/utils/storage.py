"""
Storage utility for managing virtual try-on results
"""
import os
import json
import uuid
import requests
from pathlib import Path
import shutil
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up OpenAI client if key is available
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai_client = None
if OPENAI_API_KEY:
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

class StorageManager:
    def __init__(self):
        # Define storage paths
        base_dir = Path(__file__).parent.parent.parent
        self.storage_dir = base_dir / "storage"
        self.images_dir = self.storage_dir / "images"
        self.results_file = self.storage_dir / "results.json"
        
        # Ensure storage directories exist
        self._ensure_directories_exist()

    def _ensure_directories_exist(self):
        """Create storage directories if they don't exist"""
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)

    def _load_results(self) -> List[Dict[str, Any]]:
        """Load existing results or create empty array"""
        self._ensure_directories_exist()

        if self.results_file.exists():
            try:
                return json.loads(self.results_file.read_text())
            except Exception as e:
                print(f"Error loading results: {e}")
                return []
        return []

    def _save_results(self, results: List[Dict[str, Any]]):
        """Save results to file"""
        self._ensure_directories_exist()
        
        try:
            self.results_file.write_text(json.dumps(results, indent=2))
        except Exception as e:
            print(f"Error saving results: {e}")

    async def download_image(self, url: str) -> Optional[str]:
        """
        Download an image and save it locally
        
        Args:
            url: URL of the image to download
            
        Returns:
            Local path to the downloaded image, or None if download failed
        """
        if not url:
            return None
            
        try:
            # Create a hash of the URL to use as the filename
            url_hash = hashlib.md5(url.encode()).hexdigest()
            extension = url.split('.')[-1]
            if '?' in extension:
                extension = extension.split('?')[0]
            if not extension or len(extension) > 5:
                extension = 'jpg'
                
            filename = f"{url_hash}.{extension}"
            filepath = self.images_dir / filename
            
            # If the file already exists, return its path
            if filepath.exists():
                return str(filepath)
                
            # Download the image
            response = requests.get(url, stream=True)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    response.raw.decode_content = True
                    shutil.copyfileobj(response.raw, f)
                return str(filepath)
            else:
                print(f"Failed to download image from {url}, status code: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error downloading image from {url}: {e}")
            return None

    async def generate_title(self, output_image_url: str) -> str:
        """
        Generate a title for try-on result using GPT-4 with vision
        
        Args:
            output_image_url: URL of the output image
            
        Returns:
            Generated title for the try-on result
        """
        if not OPENAI_API_KEY or not openai_client:
            return "Virtual Try-On Result"
            
        try:
            # Call OpenAI API for image description
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a fashion expert. Describe this clothing try-on image in a concise, appealing title (max 10 words) that would work well for a fashion catalog."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": output_image_url
                                }
                            }
                        ]
                    }
                ],
                max_tokens=50
            )
            
            # Extract the generated title from the response
            if response.choices and response.choices[0].message.content:
                title = response.choices[0].message.content.strip()
                # Remove quotes if present
                if title.startswith('"') and title.endswith('"'):
                    title = title[1:-1]
                return title
                
        except Exception as e:
            print(f"Error generating title: {e}")
            
        return "Virtual Try-On Result"

    async def save_result(self, result_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save a try-on result
        
        Args:
            result_data: The result data to save
            
        Returns:
            The saved result data with additional metadata
        """
        try:
            # Load existing results
            results = self._load_results()
            
            # Generate a unique ID for this result
            result_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            # Download and save images locally
            model_image_path = None
            clothing_image_path = None
            output_image_path = None
            
            if 'modelImageUrl' in result_data:
                model_image_path = await self.download_image(result_data['modelImageUrl'])
                
            if 'clothingImageUrl' in result_data:
                clothing_image_path = await self.download_image(result_data['clothingImageUrl'])
                
            if 'outputImageUrl' in result_data:
                output_image_path = await self.download_image(result_data['outputImageUrl'])
                
            # Generate a title for this result
            title = await self.generate_title(result_data.get('outputImageUrl', ''))
            
            # Create the result entry
            saved_result = {
                'id': result_id,
                'title': title,
                'timestamp': timestamp,
                'modelImagePath': model_image_path,
                'clothingImagePath': clothing_image_path,
                'outputImagePath': output_image_path,
                'modelImageUrl': result_data.get('modelImageUrl', ''),
                'clothingImageUrl': result_data.get('clothingImageUrl', ''),
                'outputImageUrl': result_data.get('outputImageUrl', ''),
                'metadata': {
                    'clothingType': result_data.get('clothingType', 'tops'),
                    'gender': result_data.get('gender', 'female'),
                    'provider': result_data.get('provider', 'aidge')
                }
            }
            
            # Add this result to the list
            results.append(saved_result)
            
            # Save the updated results
            self._save_results(results)
            
            return saved_result
            
        except Exception as e:
            print(f"Error saving result: {e}")
            raise e

    def get_all_results(self) -> List[Dict[str, Any]]:
        """
        Get all saved results
        
        Returns:
            List of all saved results
        """
        return self._load_results()
