from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from fastapi_backend.app.api.api import api_router
from fastapi_backend.app.api.backgound import router as background_router

# Create upload and storage directories
upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
storage_dir = os.path.join(os.path.dirname(__file__), "storage")
os.makedirs(upload_dir, exist_ok=True)
os.makedirs(storage_dir, exist_ok=True)

# Create the FastAPI app
app = FastAPI(title="Retail Asset API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix="/api")
app.include_router(background_router, prefix="/background")

# Mount static directories
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
app.mount("/storage", StaticFiles(directory=storage_dir), name="storage")


async def root():
    return {"message": "Welcome to the Retail Asset API"}

if __name__ == "__main__":
    # Use 0.0.0.0 to bind to all available interfaces (IPv4 and IPv6)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
