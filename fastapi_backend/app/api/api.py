from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List
import base64
from io import BytesIO
from services.image_tagger import ImageTagger
from fastapi.responses import JSONResponse
from .backgound import router as background_router

from .endpoints import virtual_tryon
from .endpoints import model_generation
from .endpoints import image

api_router = APIRouter()

# Include the virtual try-on router
api_router.include_router(virtual_tryon.router,
                          prefix="/virtual-try-on", tags=["virtual-try-on"])

# Include the model generation router
api_router.include_router(model_generation.router,
                          prefix="/model-generation", tags=["model-generation"])

# Include the background router
api_router.include_router(
    background_router, prefix="/background", tags=["background"])

# Add the new image router
api_router.include_router(image.router, prefix="/image", tags=["image"])


@api_router.get("/")
def read_root():
    return {"message": "Welcome to Fashion AI-Assisted Asset Creation and Management API"}


@api_router.post("/tag-image")
async def tag_image(file: UploadFile = File(...), model: str = Form("gpt-4o")):
    """Tag a single image with retail attributes using the image tagger service."""
    try:
        # Read the file
        contents = await file.read()

        # Initialize the image tagger
        tagger = ImageTagger(model=model)

        # Analyze the image
        analysis = tagger.analyze_image(contents)

        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])

        # Generate visualization
        visualization = tagger.visualize_results(contents, analysis)

        # Return the results
        return {
            "success": True,
            "analysis": analysis,
            "visualization": f"data:image/png;base64,{visualization}"
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


class BatchTagRequest(BaseModel):
    files_base64: List[str]
    model: str = "gpt-4o"


@api_router.post("/tag-batch")
async def tag_batch(request: BatchTagRequest):
    """Tag a batch of images with retail attributes."""
    try:
        # Convert base64 strings to bytes
        image_bytes_list = []
        for img_base64 in request.files_base64:
            # Remove data URL prefix if present
            if "," in img_base64:
                img_base64 = img_base64.split(",", 1)[1]

            # Decode base64 to bytes
            img_bytes = base64.b64decode(img_base64)
            image_bytes_list.append(img_bytes)

        # Initialize the image tagger
        tagger = ImageTagger(model=request.model)

        # Process the batch
        batch_results = tagger.batch_process(image_bytes_list)

        # Return the results
        return {
            "success": True,
            "batch_results": batch_results
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
