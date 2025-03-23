from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(
    os.path.dirname(os.path.dirname(__file__))), 'uploads')
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(os.path.join(uploads_dir, 'models'), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, 'clothing'), exist_ok=True)

# Set the uploads directory in environment
os.environ['UPLOADS_DIR'] = uploads_dir

# Configure CORS
