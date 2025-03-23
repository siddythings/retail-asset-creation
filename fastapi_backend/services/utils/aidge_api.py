"""
Utility functions for interacting with the Aidge API
"""
import os
import time
import hmac
import hashlib
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AidgeApiClient:
    def __init__(self):
        # Load API credentials from environment variables
        self.access_key_name = os.getenv('AIDGE_ACCESS_KEY_NAME')
        self.access_key_secret = os.getenv('AIDGE_ACCESS_KEY_SECRET')
        self.api_domain = os.getenv('AIDGE_API_DOMAIN', 'api.aidge.ai')
        self.use_trial_resource = os.getenv('AIDGE_USE_TRIAL_RESOURCE', 'false').lower() == 'true'

    def invoke_aidge_api(self, api_name, data):
        """
        Utility function to call the Aidge AI API
        
        Args:
            api_name: The API endpoint to call
            data: The data to send to the API
            
        Returns:
            The API response
        """
        timestamp = str(int(time.time() * 1000))
        
        # Calculate sha256 sign
        sign_string = self.access_key_secret + timestamp
        sign = hmac.new(
            self.access_key_secret.encode('utf-8'), 
            sign_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest().upper()
        
        # Construct the URL
        url = f"https://{self.api_domain}/rest{api_name}?partner_id=aidge&sign_method=sha256&sign_ver=v2&app_key={self.access_key_name}&timestamp={timestamp}&sign={sign}"
        
        # Set headers
        headers = {
            'Content-Type': 'application/json',
            'x-iop-trial': str(self.use_trial_resource).lower()
        }
        
        try:
            print(f"Aidge API Request to {api_name}:", json.loads(data))
            
            # Make the API request
            response = requests.post(url, data=data, headers=headers)
            response_data = response.json()
            print(f"Aidge API Response from {api_name}:", json.dumps(response_data, indent=2))
            return response_data
        except Exception as error:
            print(f"Aidge API Error: {str(error)}")
            print("Aidge API Request details:", {
                "url": url,
                "headers": headers,
                "data": json.loads(data)
            })
            raise error
