"""
Schemas for the virtual try-on API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl


class ClothingItem(BaseModel):
    """Schema for a clothing item"""
    imageUrl: str = Field(..., description="URL of the clothing image")
    type: str = Field(
        "tops", description="Type of clothing (tops, bottoms, dresses)")


class TryOnRequest(BaseModel):
    """Schema for a virtual try-on request"""
    clothesList: List[ClothingItem] = Field(...,
                                            description="List of clothing items")
    modelImage: List[str] = Field(..., description="List of model image URLs")
    gender: str = Field("female", description="Gender (male, female)")
    style: Optional[str] = Field(
        "universal_1", description="Style of the model")
    body: Optional[str] = Field("slim", description="Body type of the model")
    viewType: Optional[str] = Field(
        "mixed", description="View type (mixed, front, back, etc.)")
    generateCount: Optional[int] = Field(
        4, description="Number of images to generate")
    inputQualityDetect: Optional[int] = Field(
        0, description="Input quality detection level")
    apiProvider: Optional[str] = Field(
        None, description="API provider to use (aidge, fashn)")


class TryOnResponse(BaseModel):
    """Schema for a virtual try-on response"""
    taskId: str = Field(..., description="Task ID for the try-on request")
    provider: str = Field(...,
                          description="Provider used for the try-on request")


class TryOnImage(BaseModel):
    """Schema for a try-on result image"""
    modelImageUrl: Optional[str] = Field(
        None, description="URL of the model image")
    clothingImageUrl: Optional[str] = Field(
        None, description="URL of the clothing image")
    outputImageUrl: str = Field(..., description="URL of the output image")


class TryOnTaskResult(BaseModel):
    """Schema for the result of a try-on task"""
    taskStatus: str = Field(...,
                            description="Status of the individual result (finished, failed)")
    taskResult: Optional[Dict[str, Any]] = Field(
        None, description="Task result data")
    savedResults: Optional[List[Dict[str, Any]]] = Field(
        None, description="Saved results data")
    outputImageUrls: Optional[List[str]] = Field(
        None, description="Output image URLs (for fashn.ai)")


class TryOnQueryResponse(BaseModel):
    """Schema for a virtual try-on query response"""
    taskStatus: str = Field(
        ..., description="Status of the try-on request (processing, finished, failed, timeout)")
    progress: Optional[float] = Field(
        None, description="Progress of the try-on request (0-100)")
    error: Optional[str] = Field(
        None, description="Error message if the request failed")
    results: Optional[List[TryOnTaskResult]] = Field(
        None, description="List of try-on results")
    taskId: Optional[str] = Field(
        None, description="Task ID for the try-on request")
    provider: Optional[str] = Field(
        None, description="Provider used for the try-on request")

    # Keep backwards compatibility with older code by accepting images and savedResults directly
    images: Optional[List[TryOnImage]] = Field(
        None, description="List of try-on result images (deprecated)")
    savedResults: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of saved results (deprecated)")


class UploadFileResponse(BaseModel):
    """Schema for a file upload response"""
    fileUrl: str = Field(..., description="URL of the uploaded file")
    width: Optional[int] = Field(
        None, description="Width of the image in pixels")
    height: Optional[int] = Field(
        None, description="Height of the image in pixels")


class GalleryResponse(BaseModel):
    """Schema for a gallery response"""
    results: List[Dict[str, Any]
                  ] = Field(..., description="List of try-on results")


class Base64ImageUploadRequest(BaseModel):
    """Schema for a base64 image upload request"""
    base64_image: str = Field(..., description="Base64 encoded image data")
    image_type: str = Field(...,
                            description="Type of image (model or clothing)")
    filename: Optional[str] = Field(
        None, description="Optional filename to use")


class ImagePreprocessRequest(BaseModel):
    """Schema for image preprocessing and upload request"""
    base64_image: str = Field(..., description="Base64 encoded image data")
    image_type: str = Field(...,
                            description="Type of image (model or clothing)")
    filename: Optional[str] = Field(
        None, description="Optional filename to use")
    maintain_portrait_ratio: bool = Field(
        True, description="Whether to maintain 9:16 portrait ratio")
