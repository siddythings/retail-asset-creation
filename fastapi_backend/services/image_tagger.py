import os
import base64
import json
import time
from pathlib import Path
import matplotlib.pyplot as plt
from PIL import Image
import numpy as np
from io import BytesIO
import tempfile
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ImageTagger:
    """
    A service for tagging retail product images with attributes using GPT Vision models.
    
    This service analyzes retail product images and extracts structured metadata including:
    - Product type
    - Colors
    - Patterns
    - Materials
    - Style
    - Age group
    - Occasion
    """
    
    def __init__(self, model="gpt-4o", max_tokens=500, output_dir=None):
        """
        Initialize the ImageTagger with configuration parameters.
        
        Args:
            model (str): GPT model to use (gpt-4o, gpt-4o-mini, etc.)
            max_tokens (int): Maximum tokens in the response
            output_dir (str): Directory to save results
        """
        # Configure attributes
        self.model = model
        self.max_tokens = max_tokens
        
        # Set output directory
        if output_dir:
            self.output_dir = Path(output_dir)
        else:
            self.output_dir = Path("image_tagging_results")
            
        # Create output directory if it doesn't exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize the OpenAI client
        self._init_client()
    
    def _encode_image_to_base64(self, image_path_or_bytes):
        """
        Encode an image to base64 string.
        
        Args:
            image_path_or_bytes: Either a string path to an image or bytes of an image
            
        Returns:
            base64_image: Base64 encoded image string
        """
        try:
            if isinstance(image_path_or_bytes, bytes):
                # If image is provided as bytes
                image = Image.open(BytesIO(image_path_or_bytes))
                buffered = BytesIO()
                image.save(buffered, format=image.format or "JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
                return img_str
            else:
                # If image is provided as a path
                with open(image_path_or_bytes, "rb") as image_file:
                    return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None
    
    def _init_client(self):
        """Initialize the OpenAI client with API key from environment variables."""
        try:
            # Get API key from environment variable
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                print("WARNING: OPENAI_API_KEY environment variable not found")
                
            # Initialize the client with the API key
            self.client = OpenAI(api_key=api_key)
        except Exception as e:
            print(f"Error initializing OpenAI client: {e}")
            self.client = None
    
    def analyze_image(self, image_path_or_bytes):
        """
        Analyze a single retail product image.
        
        Args:
            image_path_or_bytes: Path to image file or image bytes
            
        Returns:
            analysis: Dictionary containing the analysis results
        """
        if not self.client:
            return {"error": "OpenAI client not initialized"}
        
        # Encode the image to base64
        base64_image = self._encode_image_to_base64(image_path_or_bytes)
        if not base64_image:
            return {"error": "Failed to encode image"}
        
        # Prepare the prompt for the vision model
        prompt = """
        Analyze this retail product image. 
        
        Provide a JSON object with the following structure:
        {
            "caption": "Brief description of the main product",
            "retail_attributes": {
                "product_type": "specific main product category (e.g. dress, t-shirt, jeans)",
                "colors": ["list", "of", "colors"],
                "patterns": ["list", "of", "patterns"],
                "materials": ["list", "of", "materials"],
                "style": ["list", "of", "style", "descriptors"],
                "age_group": "target age group",
                "occasion": "occasions this would be appropriate for",
                "additional_notes": "anything else notable"
            }
        }
        
        Make sure to be as specific and accurate as possible, especially for the product type.
        Respond ONLY with the JSON object.
        """
        
        # Call the vision model
        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a retail image analysis assistant."},
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]}
                ],
                max_tokens=self.max_tokens
            )
            
            # Parse the response
            response_time = time.time() - start_time
            try:
                content = response.choices[0].message.content
                # Extract JSON from the response
                try:
                    # Try to parse the entire content as JSON
                    analysis = json.loads(content)
                except:
                    # If that fails, try to extract JSON from the text
                    import re
                    json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(1)
                        analysis = json.loads(json_str)
                    else:
                        # If no code blocks, try to find JSON-like structure
                        json_match = re.search(r'({.*})', content, re.DOTALL)
                        if json_match:
                            json_str = json_match.group(1)
                            analysis = json.loads(json_str)
                        else:
                            raise ValueError("Could not extract JSON from response")
                
                # Add metadata
                analysis["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
                analysis["model"] = self.model
                analysis["response_time"] = response_time
                
                return analysis
            
            except Exception as e:
                print(f"Error parsing response: {e}")
                return {"error": "Failed to parse response", "raw_response": content}
                
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return {"error": f"API error: {str(e)}"}
    
    def visualize_results(self, image_path_or_bytes, analysis, output_path=None):
        """
        Create a visualization of the analysis results.
        
        Args:
            image_path_or_bytes: Path to image file or image bytes
            analysis: Analysis results from analyze_image
            output_path: Path to save the visualization
            
        Returns:
            visualization_path: Path to the saved visualization or base64 string
        """
        try:
            # Load the image
            if isinstance(image_path_or_bytes, bytes):
                image = Image.open(BytesIO(image_path_or_bytes))
            else:
                image = Image.open(image_path_or_bytes)
            
            # Create a figure for visualization
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), gridspec_kw={'width_ratios': [1, 1]})
            
            # Left side: Display the image
            ax1.imshow(np.array(image))
            ax1.axis('off')
            ax1.set_title("Original Image", fontsize=16)
            
            # Right side: Display the analysis results
            ax2.axis('off')
            ax2.text(0.05, 0.95, "Retail Product Analysis", fontsize=18, fontweight='bold', va='top')
            
            # Extract retail attributes
            if 'error' in analysis:
                ax2.text(0.05, 0.85, f"Error: {analysis['error']}", fontsize=12, color='red', va='top')
                attributes = {}
            else:
                attributes = analysis.get('retail_attributes', {})
                caption = analysis.get('caption', 'No caption available')
                ax2.text(0.05, 0.85, f"Caption: {caption}", fontsize=12, va='top', wrap=True)
            
            # Format and display attributes
            y_pos = 0.75
            for key, value in attributes.items():
                if isinstance(value, list):
                    value_str = ", ".join(value)
                else:
                    value_str = str(value)
                
                ax2.text(0.05, y_pos, f"{key.replace('_', ' ').title()}: {value_str}", fontsize=12, va='top')
                y_pos -= 0.05
            
            # Add model and timestamp
            model = analysis.get('model', 'Unknown model')
            timestamp = analysis.get('timestamp', 'Unknown time')
            # Don't display model information per client request
            # ax2.text(0.05, 0.05, f"Model: {model}", fontsize=10, va='bottom', color='gray')
            ax2.text(0.05, 0.02, f"Timestamp: {timestamp}", fontsize=10, va='bottom', color='gray')
            
            # Save or return the visualization
            if output_path:
                plt.savefig(output_path, bbox_inches='tight')
                plt.close(fig)
                return output_path
            else:
                # Save to a temporary buffer and return as base64
                buf = BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight')
                plt.close(fig)
                buf.seek(0)
                img_str = base64.b64encode(buf.getvalue()).decode('utf-8')
                return img_str
                
        except Exception as e:
            print(f"Error creating visualization: {e}")
            return None
    
    def batch_process(self, images_list, visualize=True):
        """
        Process a batch of images.
        
        Args:
            images_list: List of image paths or bytes
            visualize: Whether to create visualizations
            
        Returns:
            batch_results: Dictionary with analysis results and visualizations
        """
        results = []
        visualizations = []
        errors = []
        
        total_images = len(images_list)
        
        for idx, image in enumerate(images_list):
            try:
                print(f"Processing image {idx+1}/{total_images}")
                
                # Analyze the image
                analysis = self.analyze_image(image)
                
                if 'error' in analysis:
                    errors.append({"index": idx, "error": analysis['error']})
                else:
                    results.append(analysis)
                    
                    # Create visualization if requested
                    if visualize:
                        viz = self.visualize_results(image, analysis)
                        if viz:
                            visualizations.append({"index": idx, "visualization": viz})
                
            except Exception as e:
                print(f"Error processing image {idx}: {e}")
                errors.append({"index": idx, "error": str(e)})
        
        # Prepare batch results
        batch_results = {
            "results": results,
            "errors": errors,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "model": self.model
        }
        
        if visualize:
            batch_results["visualizations"] = visualizations
            
        return batch_results 