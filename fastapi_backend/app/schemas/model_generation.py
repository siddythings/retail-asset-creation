"""
Schemas for the model generation API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

class ModelAttributes(BaseModel):
    """Schema for model attributes"""
    gender: Optional[str] = Field("female", description="Gender of the model")
    bodySize: Optional[str] = Field("average", description="Body size of the model")
    skin_color: Optional[str] = Field(None, description="Skin color of the model")
    age: Optional[str] = Field(None, description="Age range of the model")
    eyes: Optional[str] = Field(None, description="Eye color of the model")
    modelType: Optional[str] = Field("Full Body", description="Type of model shot (Full Body or Top)")
    poseType: Optional[str] = Field("neutral", description="Type of pose (neutral, confident, dynamic, artistic)")
    wearType: Optional[str] = Field("not-defined", description="Type of clothing worn by the model")
    preventNsfw: Optional[bool] = Field(True, description="Enable stronger NSFW prevention measures")

    @validator("gender")
    def validate_gender(cls, v):
        """Validate gender field"""
        if v is not None and v not in ["female", "male"]:
            raise ValueError("Gender must be 'female' or 'male'")
        return v
    
    @validator("bodySize")
    def validate_body_size(cls, v):
        """Validate body size field"""
        valid_sizes = ["thin", "average", "plus-size"]
        if v is not None and v not in valid_sizes:
            raise ValueError(f"Body size must be one of: {', '.join(valid_sizes)}")
        return v
    
    @validator("skin_color")
    def validate_skin_color(cls, v):
        """Validate skin color field"""
        valid_skin_colors = ["fair", "light", "medium", "tan", "dark", "deep", "not-specified"]
        if v is not None and v not in valid_skin_colors:
            raise ValueError(f"Skin color must be one of: {', '.join(valid_skin_colors)}")
        return v
    
    @validator("age")
    def validate_age(cls, v):
        """Validate age field"""
        valid_ages = ["18-25", "25-35", "35-45", "45-60", "60+", "not-specified"]
        if v is not None and v not in valid_ages:
            raise ValueError(f"Age must be one of: {', '.join(valid_ages)}")
        return v
    
    @validator("eyes")
    def validate_eyes(cls, v):
        """Validate eye color field"""
        valid_eye_colors = ["blue", "green", "brown", "hazel", "black", "not-specified"]
        if v is not None and v not in valid_eye_colors:
            raise ValueError(f"Eye color must be one of: {', '.join(valid_eye_colors)}")
        return v
    
    @validator("modelType")
    def validate_model_type(cls, v):
        """Validate model type field"""
        valid_types = ["Full Body", "Top"]
        if v is not None and v not in valid_types:
            raise ValueError(f"Model type must be one of: {', '.join(valid_types)}")
        return v
        
    @validator("poseType")
    def validate_pose_type(cls, v):
        """Validate pose type field"""
        valid_pose_types = ["neutral", "confident", "dynamic", "artistic"]
        if v is not None and v not in valid_pose_types:
            raise ValueError(f"Pose type must be one of: {', '.join(valid_pose_types)}")
        return v

    @validator("wearType")
    def validate_wear_type(cls, v):
        """Validate wear type field"""
        valid_wear_types = ["not-defined", "casual", "formal", "business", "long-dress", "short-dress", "t-shirt-jeans", "t-shirt", "blouse", "suit", "swimsuit", "sportswear", "streetwear"]
        if v is not None and v not in valid_wear_types:
            raise ValueError(f"Wear type must be one of: {', '.join(valid_wear_types)}")
        return v

class GenerationImage(BaseModel):
    """Schema for a generated image"""
    url: str = Field(..., description="URL of the generated image")
    id: str = Field(..., description="ID of the generated image")
    nsfw: bool = Field(False, description="Whether the image is NSFW")

class ModelGenerationRequest(BaseModel):
    """Schema for a model generation request"""
    prompt: str = Field(..., description="Prompt for the model generation")
    attributes: Optional[ModelAttributes] = Field(None, description="Attributes for the model generation")
    numImages: Optional[int] = Field(1, description="Number of images to generate")
    width: Optional[int] = Field(1024, description="Width of the generated image")
    height: Optional[int] = Field(1024, description="Height of the generated image")
    modelId: Optional[str] = Field(None, description="ID of the model to use")
    alchemy: Optional[bool] = Field(True, description="Whether to use alchemy (higher quality)")
    ultra: Optional[bool] = Field(False, description="Whether to use ultra enhancement (Phoenix models only)")
    styleUUID: Optional[str] = Field(None, description="Style UUID to apply")
    contrast: Optional[float] = Field(3.5, description="Contrast level (1.0-4.5)")
    enhancePrompt: Optional[bool] = Field(False, description="Whether to enhance the prompt")

class ModelGenerationResponse(BaseModel):
    """Schema for a model generation response"""
    success: bool = Field(..., description="Whether the request was successful")
    generationId: Optional[str] = Field(None, description="Generation ID for the request")
    message: Optional[str] = Field(None, description="Message about the request")
    error: Optional[str] = Field(None, description="Error message if the request failed")

class ModelGenerationStatusResponse(BaseModel):
    """Schema for a model generation status response"""
    success: bool = Field(..., description="Whether the request was successful")
    status: str = Field(..., description="Status of the generation (processing, finished, failed, error, timeout)")
    generationId: Optional[str] = Field(None, description="Generation ID for the request")
    images: Optional[List[GenerationImage]] = Field(None, description="Generated images if available")
    error: Optional[str] = Field(None, description="Error message if the request failed")

class ReferenceImageAnalysisRequest(BaseModel):
    """Schema for a reference image analysis request"""
    referenceImageData: str = Field(..., description="Base64-encoded reference image data")

class ReferenceImageAnalysisResponse(BaseModel):
    """Schema for a reference image analysis response"""
    success: bool = Field(..., description="Whether the analysis was successful")
    analysis: Optional[Dict[str, Any]] = Field(None, description="Analysis results with extracted attributes")
    prompt_description: Optional[str] = Field(None, description="Prompt description for model generation")
    error: Optional[str] = Field(None, description="Error message if the analysis failed")

class GalleryResponse(BaseModel):
    """Schema for a gallery response"""
    results: List[Dict[str, Any]] = Field(..., description="Gallery results") 