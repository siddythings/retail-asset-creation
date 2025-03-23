"""
API endpoints for model generation functionality
"""
import json
import base64
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import Optional, Any

from fastapi_backend.app.schemas.model_generation import (
    ModelGenerationRequest,
    ModelGenerationResponse,
    ModelGenerationStatusResponse,
    ReferenceImageAnalysisRequest,
    ReferenceImageAnalysisResponse,
    GalleryResponse
)
from fastapi_backend.services.model_generation import ModelGenerationService

# Set up logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the model generation service
model_generation_service = ModelGenerationService()

@router.post("/analyze-reference", response_model=ReferenceImageAnalysisResponse)
async def analyze_reference_image(request: ReferenceImageAnalysisRequest):
    """
    Analyze a reference image to extract features for model generation
    """
    try:
        logger.info("Received reference image analysis request")
        
        # Decode the base64 image data
        try:
            image_data = base64.b64decode(request.referenceImageData)
        except Exception as e:
            logger.error(f"Error decoding reference image: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
        
        # Analyze the reference image
        analysis_result = await model_generation_service.analyze_reference_image(image_data)
        
        if not analysis_result.get("success", False):
            error_message = analysis_result.get("error", "Unknown error")
            logger.error(f"Error analyzing reference image: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)
            
        logger.info("Reference image analysis successful")
        return analysis_result
    except Exception as e:
        logger.error(f"Error analyzing reference image: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error analyzing reference image: {str(e)}")

@router.post("/generate-with-reference", response_model=ModelGenerationResponse)
async def generate_with_reference(
    prompt: Optional[str] = Form(""),
    reference_image: UploadFile = File(...),
    numImages: Any = Form(1),
    gender: str = Form("female"),
    bodySize: str = Form("average"),
    skin_color: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    modelType: str = Form("Full Body"),
    poseType: str = Form("neutral"),
    alchemy: Any = Form(True),
    ultra: Any = Form(False),
    styleUUID: str = Form("556c1ee5-ec38-42e8-955a-1e82dad0ffa1"),
    contrast: Any = Form(3.5),
    enhancePrompt: Any = Form(False)
):
    """
    Submit a model generation request with a reference image
    
    The prompt parameter is optional when a reference image is provided.
    """
    try:
        # Log with obfuscated prompt to avoid sensitive data in logs
        safe_prompt = prompt[:30] + "..." if prompt and len(prompt) > 30 else prompt
        logger.info(f"Received generate with reference request with prompt: {safe_prompt}")
        
        # Log all form fields for debugging
        logger.debug(f"Form data - numImages: {numImages}, gender: {gender}, bodySize: {bodySize}, " +
                    f"skin_color: {skin_color}, age: {age}, modelType: {modelType}, poseType: {poseType}, " +
                    f"alchemy: {alchemy}, ultra: {ultra}, styleUUID: {styleUUID}, " +
                    f"contrast: {contrast}, enhancePrompt: {enhancePrompt}")
        
        # Read the reference image
        reference_image_data = await reference_image.read()
        
        # Create attributes dictionary
        attributes = {
            "gender": gender,
            "bodySize": bodySize,
            "modelType": modelType,
            "poseType": poseType,
        }
        
        # Add optional attributes if provided
        if skin_color and skin_color != "not-specified":
            attributes["skin_color"] = skin_color
        if age and age != "not-specified":
            attributes["age"] = age
            
        # Convert string boolean values if needed (FormData can send strings)
        alchemy_val = alchemy
        if isinstance(alchemy, str):
            alchemy_val = alchemy.lower() == 'true'
            
        ultra_val = ultra
        if isinstance(ultra, str):
            ultra_val = ultra.lower() == 'true'
            
        enhance_prompt_val = enhancePrompt
        if isinstance(enhancePrompt, str):
            enhance_prompt_val = enhancePrompt.lower() == 'true'
            
        # Convert numImages to int
        num_images_val = 1  # Default to 1 image if not specified
        try:
            if numImages is not None:
                num_images_val = int(numImages)
        except (ValueError, TypeError):
            logger.warning(f"Invalid numImages value: {numImages}, using default: 1")
            
        # Convert contrast to float
        contrast_val = 3.5
        try:
            contrast_val = float(contrast)
        except (ValueError, TypeError):
            logger.warning(f"Invalid contrast value: {contrast}, using default: 3.5")
        
        # Build the model generation request
        request_data = {
            "prompt": prompt,
            "attributes": attributes,
            "numImages": num_images_val,
            "alchemy": alchemy_val,
            "ultra": ultra_val,
            "styleUUID": styleUUID,
            "contrast": contrast_val,
            "enhancePrompt": enhance_prompt_val,
            "referenceImageData": reference_image_data
        }
        
        # Call the model generation service
        response = await model_generation_service.create_generation(request_data)
        
        if not response.get("success", False):
            error_message = response.get("error", "Unknown error")
            logger.error(f"Error generating model: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)
            
        logger.info(f"Generation submitted successfully with ID: {response.get('generationId')}")
        return response
    except Exception as e:
        logger.error(f"Error generating model with reference: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating model with reference: {str(e)}")

@router.post("/generate", response_model=ModelGenerationResponse)
async def generate_model(request: ModelGenerationRequest):
    """
    Submit a model generation request
    """
    try:
        logger.info(f"Received generate request with prompt: {request.prompt[:50]}...")
        
        # Convert request to dict
        request_dict = request.dict()
        
        # Ensure modelType is set with a default value if not provided
        if "attributes" in request_dict and request_dict["attributes"]:
            if "modelType" not in request_dict["attributes"] or not request_dict["attributes"]["modelType"]:
                request_dict["attributes"]["modelType"] = "Full Body"
        
        response = await model_generation_service.create_generation(request_dict)
        
        if not response.get("success", False):
            error_message = response.get("error", "Unknown error")
            logger.error(f"Error generating model: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)
            
        logger.info(f"Generation submitted successfully with ID: {response.get('generationId')}")
        return response
    except Exception as e:
        logger.error(f"Error generating model: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating model: {str(e)}")

@router.get("/status/{generation_id}", response_model=ModelGenerationStatusResponse)
async def get_generation_status(generation_id: str):
    """
    Check the status of a model generation request
    """
    try:
        logger.info(f"Checking status for generation ID: {generation_id}")
        response = await model_generation_service.check_generation_status(generation_id)
        
        if not response.get("success", False) and response.get("status") != "processing":
            error_message = response.get("error", "Unknown error")
            logger.error(f"Error checking generation status: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)
            
        logger.info(f"Status checked successfully: {response.get('status')}")
        return response
    except Exception as e:
        logger.error(f"Error checking generation status: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error checking generation status: {str(e)}")

@router.post("/execute", response_model=ModelGenerationStatusResponse)
async def execute_generation(
    request: ModelGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Execute a model generation request and poll for results
    
    This endpoint submits a generation request and waits for it to complete.
    """
    try:
        # Log with obfuscated prompt to avoid sensitive data in logs
        safe_prompt = request.prompt[:30] + "..." if request.prompt and len(request.prompt) > 30 else request.prompt
        logger.info(f"Executing model generation with prompt: {safe_prompt}")
        
        # Log request data for debugging
        request_data_log = {
            "prompt": safe_prompt,
            "attributes": request.attributes.dict() if request.attributes else None,
            "numImages": request.numImages,
            "width": request.width,
            "height": request.height,
            "modelId": request.modelId,
            "alchemy": request.alchemy,
            "ultra": request.ultra,
            "styleUUID": request.styleUUID,
            "contrast": request.contrast,
            "enhancePrompt": request.enhancePrompt
        }
        logger.info(f"Request data: {json.dumps(request_data_log)}")
        
        # Convert the request to a dictionary for the service
        request_data = request.dict()
        
        # Submit the generation request
        response = await model_generation_service.create_generation(request_data)
        
        if not response.get("success", False):
            error_message = response.get("error", "Unknown error")
            logger.error(f"Error creating generation: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)
            
        # Get the generation ID
        generation_id = response.get("generationId")
        
        # Execute the generation and poll for results
        try:
            result = await model_generation_service.execute_generation(request_data)
            logger.info(f"Execute response: {json.dumps(result)}")
            
            if result.get("success", False):
                logger.info(f"Generation executed successfully with status: {result.get('status')}")
                return result
            else:
                error_message = result.get("error", "Unknown error")
                logger.error(f"Error executing generation: {error_message}")
                raise HTTPException(status_code=500, detail=error_message)
        except Exception as e:
            logger.error(f"Error executing generation: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing generation request: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing generation request: {str(e)}")

@router.get("/gallery", response_model=GalleryResponse)
async def get_gallery(limit: int = 50):
    """
    Get all saved model generation results for the gallery
    """
    try:
        logger.info(f"Getting gallery results with limit: {limit}")
        results = await model_generation_service.get_gallery_results(limit)
        logger.info(f"Got {len(results)} gallery results")
        return {"results": results}
    except Exception as e:
        logger.error(f"Error getting gallery results: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error getting gallery results: {str(e)}") 