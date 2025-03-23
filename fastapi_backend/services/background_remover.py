from rembg import remove
from PIL import Image
import requests
import time
import hmac
import hashlib
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class BackgroundRemover:
    def __init__(self):
        # Load API credentials from environment variables
        self.access_key_name = os.getenv('AIDC_ACCESS_KEY_NAME')
        self.access_key_secret = os.getenv('AIDC_ACCESS_KEY_SECRET')
        self.api_domain = os.getenv('AIDC_API_DOMAIN', 'api.aidc-ai.com')

    def remove_background(self, input_path, output_path):
        # Open the input image
        image = Image.open(input_path)
        
        # Remove the background
        output = remove(image)
        
        # Save the output image
        output.save(output_path, "PNG")
        print(f"Background removed successfully! Saved as {output_path}")
        return output

    def background_remove_using_aidc_api(self, data):
        api_name = "/ai/image/cut/out"

        # Constructor request Parameters
        request_params = {
            "imageUrl": "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-2-7?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
            "backGroundType": "TRANSPARENT",
        }

        # Convert parameters to JSON string
        request_data = json.dumps(request_params)

        timestamp = str(int(time.time() * 1000))

        # Calculate sha256 sign
        use_trial_resource = True
        sign_string = self.access_key_secret + timestamp
        sign = hmac.new(self.access_key_secret.encode('utf-8'), sign_string.encode('utf-8'),
                        hashlib.sha256).hexdigest().upper()

        url = f"https://{self.api_domain}/rest{api_name}?partner_id=aidge&sign_method=sha256&sign_ver=v2&app_key={self.access_key_name}&timestamp={timestamp}&sign={sign}"
        print(url)
        # Add "x-iop-trial": "true" for trial
        headers = {
            "Content-Type": "application/json",
            "x-iop-trial": str(use_trial_resource).lower()
        }

        # Http request
        response = requests.post(url, data=request_data, headers=headers)
        print(response.text)
        return response.text