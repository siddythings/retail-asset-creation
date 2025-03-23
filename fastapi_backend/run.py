"""
Script to run the FastAPI application using uvicorn
"""
import uvicorn
import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Run the application
if __name__ == "__main__":
    # Using 0.0.0.0 to bind to all available network interfaces (IPv4 and IPv6)
    uvicorn.run("fastapi_backend.main:app", host="0.0.0.0", port=8000, reload=True)
