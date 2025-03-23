from PIL import Image
import requests
import os
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()


class BackgroundApplier:
    def __init__(self):
        self.bria_api_token = os.getenv(
            'BRIA_AUTH_TOKEN', '49033049b7044d3c81d9dea5fe36a125')
        self.bria_api_url = "https://engine.prod.bria-api.com/v1/background/replace"

    def add_background(self, foreground, background_path, output_path):
        """Adds a new background to the image with a transparent background."""
        background = Image.open(background_path).convert("RGBA")

        # Resize background to match foreground
        background = background.resize(foreground.size)

        # Paste the foreground (with transparency) onto the background
        background.paste(foreground, (0, 0), foreground)

        # Save the final image
        background.save(output_path)
        print(f"New background added successfully! Saved as {output_path}")

    def remove_base64_header(self, input_string):
        """Removes the base64 header from a string.

        Args:
            input_string: The string containing the base64 data and possibly a header.

        Returns:
            The base64 data without the header, or the original string if no header is found.
        """
        match = re.search(r"data:image\/.*;base64,(.*)", input_string)
        if match:
            return match.group(1)
        else:
            return input_string
        # import urllib.parse

        # # url = "https://bria-temp.s3.amazonaws.com/images/ac7f95be-63f7-4dd9-b82f-0e3b5d3f1089_seed_1116977602.png?AWSAccessKeyId=ASIAUL5JH7ABDBN2VZS3&Signature=W1sXZ3yJ8esSr5uKZQ49CQ8ofaM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIDkE%2F%2B6rxdHNHKUh0kzEJYKTgxUnKH25EMiBGvzTUvP9AiB%2F9Ur7N%2B%2FS3fhICghlSlbKzWd3aFsXyJhDuTeKEaO98SqGBQgVEAMaDDMwMDQ2NTc4MDczOCIMqjKnlYnmW6dnulLgKuMERKEqnkdPKrAkXOO%2BIFZYpTZBYKrn5AQqzK9yjHFF0HHPNVcvX%2BNDshdPZL4Q8c%2BR%2FIoLv%2FTkb2kpw%2BIGtzM5pqLiAVoXTQQOIvpFpXtCHr0I9dxy8C3Qd1bgVa1wcMQykFu80huDXlH%2Bc8%2BrGnYFxmqI0fP1%2BAX7JIvLh9v0HFDm7M0H9m8kfoL8EaXQV%2FDySuxcQfMxichaq3NfeYWyp0De2gWQ5e5hoID4W0vklk6jQlp8SwXaankt5U0TEejMV6cx4XJ5vm1lxm1T5we4xoZrwLi7tUHgDFwChs9lwikjwd7hco1DmFZP%2BKC1Ekcnl6lkNFRKWKPXTDfaqIB0r9j4EtIuQaPJlQdboW%2FV285Idfq%2Bf0r713A9WScWI8QArRCal6URiVOpUA6VQxo3H5rwNJOA4r%2Fuhwaiw9ZQWwscUfAKU3mx34ae3CAavF5tYcjMiP2UyngxGoHXYdedMSsJ5BsSBMY1F9cG2nHc9MhCiuWTAKXEyaMakoY25QJSzn2hyAJttVmFHuYQWHs3NS2O3QfRaA%2Bb2FThi3x2kNbExpWJEiACI4M4F4BYhO3P2c0PviFUAdAacXjpyBUj39%2FxZ2eHZwHVpCWKJZtQGvuekYSj0iTAl%2F7nrwNRBO39TJUq%2FEHDD97pfx9M5BIdPUPCoc96nWC5635huz4oxdJ%2FOoD%2ByfiG4NxOj9E8KcWudc0o1asqkEMu0SjOdfBvivsntRxc%2F1OICLwYWsHnWNFgvpcGooyIc5C%2FUoVqUKjrWwwFs%2Fj9BtvNTE0yUxJLnGsfSzN2Ih6vw1QSYWawQcFKL9wwtvqgvgY6mwGHMBdKpL1FPRS8V3Fdsgo0U8wHEG2wt3RW2TzCmYse9uLSfKgQABiFLsILei%2FzXt124IgmqvV2mm41x6L2fsJfUW%2Fqyw6MmCj0G%2B6Q8vkEQ%2FNHaZnH3lhC6WCszz4MrzKmuHQrtnYgaoyBWQe%2F9XKoR%2FPCj0pP%2BNvotQ5SCqbsj9ufLaV5JW0SsoQdhG5IGxhytH6c03H6xDqYCg%3D%3D&Expires=1741783223"

        # fixed_url = urllib.parse.quote(input_string, safe=":/?=&")
        # print(fixed_url)
        # return fixed_url

    def background_replace_using_bria_api(self, fast, bg_prompt, refine_prompt, original_quality, num_results, image_url):
        """
        Replace background using Bria API
        """
        print("--------------------------------2")
        
        # Only try to remove base64 header if the URL starts with data:image
        processed_url = image_url
        if image_url.startswith('data:image'):
            processed_url = self.remove_base64_header(image_url)
            
        payload = {
            'fast': fast,
            'bg_prompt': bg_prompt,
            'refine_prompt': refine_prompt,
            'original_quality': original_quality,
            'num_results': num_results,
            'image_url': processed_url
        }

        # Important: The token should be sent in the api_token header
        headers = {
            'Content-Type': 'application/json',
            'api_token': self.bria_api_token
        }

        print("Making request with:", {
            "url": self.bria_api_url,
            "headers": headers,
            "payload": payload
        })

        response = requests.post(
            self.bria_api_url,
            json=payload,
            headers=headers
        )

        print("Response status:", response.status_code)
        print("Response body:", response.text)

        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"Failed to replace background: {response.text}",
                "status_code": response.status_code
            }
