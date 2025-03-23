'use client'

import { useState, useCallback } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Loader2, AlertCircle, Save, CheckCircle, Eye } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Download } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExampleImages } from '@/components/example-images'
import { GalleryImageSelector } from '@/components/gallery-image-selector'

// Define interfaces for our data structures
interface RetailAttributes {
  product_type: string
  colors: string[]
  patterns: string[]
  materials: string[]
  style: string[]
  age_group: string
  occasion: string
  additional_notes?: string
}

interface Analysis {
  caption: string
  retail_attributes: RetailAttributes
  timestamp: string
  model: string
}

interface TaggingResult {
  success: boolean
  analysis: Analysis
  visualization: string
  error?: string
}

interface BatchResult {
  success: boolean
  batch_results: {
    results: Analysis[]
    errors: { index: number, error: string }[]
    timestamp: string
    model: string
  }
  visualizations: {
    index: number
    visualization: string
  }[]
  error?: string
}

export default function ImageTagging() {
  // State for image uploading
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [imageUrl, setImageUrl] = useState<string | null>(null) // Add this state for example images
  
  // State for processing
  const [isTagging, setIsTagging] = useState(false)
  const [isBatchTagging, setIsBatchTagging] = useState(false)
  const [taggingResult, setTaggingResult] = useState<TaggingResult | null>(null)
  const [batchResult, setBatchResult] = useState<any | null>(null)
  
  // UI state
  const [uploadMode, setUploadMode] = useState<string>("single")
  const [singleActiveTab, setSingleActiveTab] = useState<string>("upload")
  const [batchActiveTab, setBatchActiveTab] = useState<string>("upload")
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  
  // Gallery saving states
  const [isSaving, setIsSaving] = useState(false)
  const [savedToGalleryId, setSavedToGalleryId] = useState<string | null>(null)
  
  // Add a state to track saved batch items
  const [savedBatchItems, setSavedBatchItems] = useState<Record<number, boolean>>({})
  
  // Add states for viewing details modal
  const [viewingDetailsIndex, setViewingDetailsIndex] = useState<number | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  
  // Handle single image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setImageUrl(null) // Reset example image if user uploads a new image
      
      // Reset states
      setTaggingResult(null)
      setError(null)
    }
  }
  
  // Handle example image selection
  const handleExampleImageSelect = (url: string) => {
    // Set the image URL
    setImageUrl(url)
    
    // Clear any previously selected file
    setSelectedImage(null)
    
    // Reset any previous results
    setTaggingResult(null)
    setSavedToGalleryId(null)
    
    // Reset error state
    setError(null)
    
    // Auto-tag the example image
    setTimeout(() => {
      tagImage()
    }, 100)
  }
  
  // Handle batch image upload
  const handleBatchImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedImages(Array.from(files))
      
      // Reset states
      setBatchResult(null)
      setError(null)
    }
  }
  
  // Tag single image
  const tagImage = async () => {
    if (!selectedImage && !imageUrl) {
      toast({
        title: "Error",
        description: 'Please select or upload an image first',
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsTagging(true)
      setSingleActiveTab("processing")
      setProgress(10)
      setError(null) // Clear any previous errors
      
      const formData = new FormData()
      
      // If we have a file, attach it, otherwise use the image URL
      if (selectedImage) {
        formData.append('file', selectedImage)
      } else if (imageUrl) {
        formData.append('imageUrl', imageUrl)
      }
      
      formData.append('model', selectedModel)
      
      const response = await fetch('/api/tag-image', {
        method: 'POST',
        body: formData
      })
      
      setProgress(50)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }
      
      const result = await response.json()
      setTaggingResult(result)
      setProgress(100)
      setSingleActiveTab("result")
    } catch (error) {
      console.error('Error:', error)
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for connection refused errors
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          errorMessage = 'Cannot connect to the tagging service. Please make sure the backend server is running.';
        } else if (error.message.includes('Backend error: 500')) {
          errorMessage = 'The tagging service encountered an internal error. Please try again later.';
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: 'Failed to tag image: ' + errorMessage,
        variant: "destructive"
      });
      setSingleActiveTab("upload");
    } finally {
      setIsTagging(false)
      if (error) {
        setProgress(0) // Reset progress on error
      }
    }
  }
  
  // Process batch images
  const processBatchImages = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "Error",
        description: 'Please select images first',
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsBatchTagging(true);
      setBatchActiveTab("processing");
      setProgress(10);
      setError(null); // Clear previous errors
      
      // Prepare batch data
      const formData = new FormData();
      for (let i = 0; i < selectedImages.length; i++) {
        formData.append('files', selectedImages[i]);
      }
      formData.append('model', selectedModel);
      
      setProgress(30);
      
      // Send to backend
      const response = await fetch('/api/tag-batch', {
        method: 'POST',
        body: formData,
      });
      
      setProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Batch result:", result);
      
      // Handle the result
      if (result.success) {
        setBatchResult(result);
        setProgress(100);
        setBatchActiveTab("result");
      } else {
        throw new Error(result.error || 'Unknown error in batch processing');
      }
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for connection refused errors
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          errorMessage = 'Cannot connect to the tagging service. Please make sure the backend server is running.';
        } else if (error.message.includes('Backend error: 500')) {
          errorMessage = 'The tagging service encountered an internal error. Please try again later.';
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: 'Failed to process batch: ' + errorMessage,
        variant: "destructive"
      });
      setBatchActiveTab("upload");
    } finally {
      setIsBatchTagging(false);
      if (error) {
        setProgress(0); // Reset progress on error
      }
    }
  }
  
  // Reset single tag states
  const resetSingle = () => {
    setSelectedImage(null)
    setImageUrl(null)
    setTaggingResult(null)
    setSingleActiveTab('upload')
    setProgress(0)
    setError(null)
    setSavedToGalleryId(null) // Reset the saved gallery ID
  }
  
  const resetBatch = () => {
    setSelectedImages([])
    setBatchResult(null)
    setError(null)
    setProgress(0)
    setBatchActiveTab("upload")
    setSavedBatchItems({}) // Reset saved batch items
    // Don't reset the model selection
  }

  // Render retail attributes
  const renderRetailAttributes = (attributes: RetailAttributes) => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Product Type</h4>
          <Badge variant="outline" className="text-sm">{attributes.product_type}</Badge>
        </div>
        
        {attributes.colors && attributes.colors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Colors</h4>
            <div className="flex flex-wrap gap-2">
              {attributes.colors.map((color, index) => (
                <Badge key={index} variant="outline" className="text-sm">{color}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {attributes.patterns && attributes.patterns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Patterns</h4>
            <div className="flex flex-wrap gap-2">
              {attributes.patterns.map((pattern, index) => (
                <Badge key={index} variant="outline" className="text-sm">{pattern}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {attributes.materials && attributes.materials.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Materials</h4>
            <div className="flex flex-wrap gap-2">
              {attributes.materials.map((material, index) => (
                <Badge key={index} variant="outline" className="text-sm">{material}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {attributes.style && attributes.style.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Style</h4>
            <div className="flex flex-wrap gap-2">
              {attributes.style.map((style, index) => (
                <Badge key={index} variant="outline" className="text-sm">{style}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {attributes.age_group && (
          <div>
            <h4 className="text-sm font-medium mb-2">Age Group</h4>
            <Badge variant="outline" className="text-sm">{attributes.age_group}</Badge>
          </div>
        )}
        
        {attributes.occasion && (
          <div>
            <h4 className="text-sm font-medium mb-2">Occasion</h4>
            <Badge variant="outline" className="text-sm">{attributes.occasion}</Badge>
          </div>
        )}
        
        {attributes.additional_notes && (
          <div>
            <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
            <p className="text-sm text-muted-foreground">{attributes.additional_notes}</p>
          </div>
        )}
      </div>
    )
  }
  
  // Save to gallery
  const saveToGallery = async () => {
    if (!taggingResult) return
    
    // Check if already saved
    if (savedToGalleryId) {
      toast({
        title: "Already saved",
        description: "This image is already saved to your gallery.",
        variant: "default",
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      // Create a unique ID for this save operation
      const galleryId = crypto.randomUUID()
      
      // Create the gallery item
      const galleryItem = {
        id: galleryId,
        title: taggingResult.analysis.retail_attributes.product_type || "Tagged Product",
        date: new Date().toISOString(),
        provider: "image-tagging",
        thumbnailUrl: taggingResult.visualization,
        images: [taggingResult.visualization],
        type: "image-tagging" as const
      }
      
      // Save directly to localStorage
      const existingItems = localStorage.getItem('galleryItems')
      let items = []
      
      if (existingItems) {
        try {
          items = JSON.parse(existingItems)
        } catch (e) {
          console.error("Error parsing existing gallery items:", e)
          items = []
        }
      }
      
      // Add new item
      items.push(galleryItem)
      
      // Save back to localStorage
      localStorage.setItem('galleryItems', JSON.stringify(items))
      
      // Dispatch custom event to update gallery in real-time
      const event = new CustomEvent('galleryUpdate', { 
        detail: { item: galleryItem } 
      })
      window.dispatchEvent(event)
      
      // Mark as saved
      setSavedToGalleryId(galleryId)
      
      toast({
        title: "Success!",
        description: "Image saved to your gallery.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error saving to gallery:', error)
      toast({
        title: "Error",
        description: "Failed to save image to gallery",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Add this new function to save batch items to gallery
  const saveBatchItemToGallery = async (item: string, index: number) => {
    if (savedBatchItems[index]) {
      toast({
        title: "Already saved",
        description: `Item #${index + 1} is already saved to your gallery.`,
        variant: "default",
      })
      return
    }
    
    try {
      // Set this index as saved (for UI feedback)
      setSavedBatchItems(prev => ({...prev, [index]: true}))
      
      // Create a unique ID
      const galleryId = crypto.randomUUID()
      
      // Create the gallery item
      const galleryItem = {
        id: galleryId,
        title: `Tagged Image (Batch ${index + 1})`,
        date: new Date().toISOString(),
        provider: "image-tagging",
        thumbnailUrl: `data:image/jpeg;base64,${item}`,
        images: [`data:image/jpeg;base64,${item}`],
        type: "image-tagging" as const,
      }
      
      // Save directly to localStorage
      const existingItems = localStorage.getItem('galleryItems')
      let items = []
      
      if (existingItems) {
        try {
          items = JSON.parse(existingItems)
        } catch (e) {
          console.error("Error parsing existing gallery items:", e)
          items = []
        }
      }
      
      // Add new item
      items.push(galleryItem)
      
      // Save back to localStorage
      localStorage.setItem('galleryItems', JSON.stringify(items))
      
      // Dispatch custom event to update gallery in real-time
      const event = new CustomEvent('galleryUpdate', { 
        detail: { item: galleryItem } 
      })
      window.dispatchEvent(event)
      
      // Show success message
      toast({
        title: "Success!",
        description: `Batch item #${index + 1} has been added to your gallery`,
        variant: "default",
      })
      
    } catch (error) {
      console.error('Error saving batch item to gallery:', error)
      toast({
        title: "Error",
        description: "Failed to save to gallery. Please try again.",
        variant: "destructive",
      })
      
      // Reset the saved state immediately on error
      setSavedBatchItems(prev => {
        const updated = {...prev}
        delete updated[index]
        return updated
      })
    }
  }
  
  // Function to view image details
  const viewImageDetails = (index: number) => {
    setViewingDetailsIndex(index);
    setIsDetailsModalOpen(true);
  };

  const handleGalleryImageSelect = async (imageUrl: string) => {
    try {
      // Fetch the image from the URL
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create a File object from the blob
      const file = new File([blob], 'image-from-gallery.jpg', { type: blob.type })
      
      // Set the selected image
      setSelectedImage(file)
      
      // Set the image URL for example images
      setImageUrl(imageUrl)
      
      // Reset any previous results and saved state
      setTaggingResult(null)
      setSavedToGalleryId(null)
      setError(null)
      
      // Auto-tag the gallery image
      setTimeout(() => {
        tagImage()
      }, 100)
      
      toast({
        title: 'Image selected',
        description: 'Image has been selected from gallery.',
      })
    } catch (error) {
      console.error('Error selecting image from gallery:', error)
      toast({
        title: 'Error',
        description: 'Failed to load image from gallery',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Retail Image Tagging</h1>
      <p className="text-muted-foreground mb-6">
        Upload retail product images to get AI-powered tagging for ecommerce attributes.
      </p>

      <Tabs value={uploadMode} onValueChange={setUploadMode} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="single">Single Image</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="space-y-4">
          <Tabs value={singleActiveTab} onValueChange={setSingleActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="processing" disabled={!isTagging}>Processing</TabsTrigger>
              <TabsTrigger value="result" disabled={!taggingResult}>Result</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Image</CardTitle>
                  <CardDescription>
                    Upload a single retail product image for tagging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="model">Processing Mode</Label>
                    <Select
                      defaultValue={selectedModel}
                      onValueChange={(value) => setSelectedModel(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select processing mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4.5-preview-2025-02-27">Quality</SelectItem>
                        <SelectItem value="gpt-4o">Balanced (Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="image">Upload Image</Label>
                    <div className="flex flex-col space-y-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <GalleryImageSelector
                        onSelectImage={handleGalleryImageSelect}
                        buttonText="Select from Gallery"
                        allowedTypes={["all"]}
                        buttonVariant="outline"
                        buttonClassName="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Display the image from file upload */}
                  {selectedImage && !imageUrl && (
                    <div className="flex justify-center mt-4">
                      <div className="relative w-64 h-64 border rounded-md overflow-hidden">
                        <Image
                          src={URL.createObjectURL(selectedImage)}
                          alt="Selected product"
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Display image from gallery or example selection */}
                  {imageUrl && (
                    <div className="flex justify-center mt-4">
                      <div className="relative w-64 h-64 border rounded-md overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt="Selected image"
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Or select from example images</h3>
                    <div className="border rounded-md p-4">
                      <ExampleImages
                        type="model"
                        onSelect={handleExampleImageSelect}
                        displayMode="row"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={tagImage} 
                    disabled={!selectedImage && !imageUrl}
                  >
                    Generate Tags
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Processing Tab Content */}
            <TabsContent value="processing">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Processing Image</h3>
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground">
                    {progress < 30 && "Preparing image..."}
                    {progress >= 30 && progress < 70 && "Analyzing image..."}
                    {progress >= 70 && progress < 100 && "Generating results..."}
                    {progress === 100 && "Analysis completed!"}
                  </p>
                </div>
                
                {/* Show error if any */}
                {error && (
                  <div className="bg-destructive/15 p-4 rounded-md flex items-start gap-3 text-destructive">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Result Tab Content */}
            <TabsContent value="result">
              {taggingResult && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Analysis Results</h3>
                    <Button variant="outline" size="sm" onClick={resetSingle}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      New Analysis
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image and visualization */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Image</h4>
                      {taggingResult.visualization ? (
                        <div className="relative w-full aspect-square border rounded-md overflow-hidden">
                          <Image
                            src={taggingResult.visualization}
                            alt="Analyzed Image"
                            layout="fill"
                            objectFit="contain"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full aspect-square border rounded-md overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            No visualization available
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      {taggingResult.visualization && (
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline"
                            size="sm" 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = taggingResult.visualization;
                              link.download = `tagged-image.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          
                          <Button 
                            variant={savedToGalleryId ? "default" : "outline"}
                            size="sm" 
                            onClick={saveToGallery}
                            disabled={isSaving || savedToGalleryId}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : savedToGalleryId ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Saved to Gallery
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save to Gallery
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Attributes */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Product Details</h4>
                      <p className="text-sm text-muted-foreground">
                        {taggingResult.analysis.caption}
                      </p>
                      
                      <Separator className="my-4" />
                      
                      {renderRetailAttributes(taggingResult.analysis.retail_attributes)}
                      
                      <Separator className="my-4" />
                      
                      <div className="text-xs text-muted-foreground">
                        Generated on: {new Date(taggingResult.analysis.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Batch Processing Tab */}
        <TabsContent value="batch">
          <Tabs value={batchActiveTab} onValueChange={setBatchActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
          
            {/* Upload Tab Content */}
            <TabsContent value="upload">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batch-model">Processing Mode</Label>
                  <Select
                    defaultValue={selectedModel}
                    onValueChange={(value) => setSelectedModel(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select processing mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4.5-preview-2025-02-27">Quality</SelectItem>
                      <SelectItem value="gpt-4o">Balanced (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o-mini">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid w-full max-w-md items-center gap-1.5">
                  <Label htmlFor="batch-images">Upload Multiple Images</Label>
                  <Input 
                    id="batch-images" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleBatchImageChange}
                  />
                </div>
                
                {selectedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Selected {selectedImages.length} images
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {Array.from(selectedImages).slice(0, 6).map((file, index) => (
                        <div key={index} className="relative aspect-square border rounded-md overflow-hidden">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Image ${index + 1}`}
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                      ))}
                      {selectedImages.length > 6 && (
                        <div className="relative aspect-square border rounded-md flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">
                            +{selectedImages.length - 6} more
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={processBatchImages} 
                        disabled={isBatchTagging}
                      >
                        {isBatchTagging ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Batch...
                          </>
                        ) : (
                          <>
                            Process Batch
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Processing Tab Content */}
            <TabsContent value="processing">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Processing Batch</h3>
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground">
                    {progress < 30 && "Preparing images..."}
                    {progress >= 30 && progress < 70 && "Analyzing images..."}
                    {progress >= 70 && progress < 100 && "Generating results..."}
                    {progress === 100 && "Analysis completed!"}
                  </p>
                </div>
                
                {/* Show error if any */}
                {error && (
                  <div className="bg-destructive/15 p-4 rounded-md flex items-start gap-3 text-destructive">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Result Tab Content */}
            <TabsContent value="result">
              {batchResult && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Batch Results</h3>
                    <Button variant="outline" size="sm" onClick={resetBatch}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Process New Batch
                    </Button>
                  </div>
                  
                  {/* Batch results grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {batchResult.batch_results.visualizations && 
                     batchResult.batch_results.visualizations.map((item: { visualization: string, index: number }, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="relative aspect-square border rounded-md overflow-hidden">
                          <Image
                            src={`data:image/jpeg;base64,${item.visualization}`}
                            alt={`Batch Result ${index + 1}`}
                            layout="fill"
                            objectFit="contain"
                          />
                        </div>
                        <div className="flex space-x-1 justify-end">
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `data:image/jpeg;base64,${item.visualization}`;
                              link.download = `tagged-image-${index + 1}.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => viewImageDetails(index)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant={savedBatchItems[index] ? "default" : "ghost"}
                            size="sm"
                            onClick={() => {
                              if (!savedBatchItems[index]) {
                                saveBatchItemToGallery(item.visualization, index);
                              }
                            }}
                          >
                            {savedBatchItems[index] ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Saved
                              </>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show errors if any */}
                  {batchResult.batch_results.errors && 
                   batchResult.batch_results.errors.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Errors</h4>
                      <div className="bg-destructive/15 p-4 rounded-md">
                        <ul className="text-sm space-y-1 text-destructive">
                          {batchResult.batch_results.errors.map((err: { index: number, error: string }, idx: number) => (
                            <li key={idx}>
                              Image {err.index + 1}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      
      {/* Details Modal for Batch Results */}
      {isDetailsModalOpen && viewingDetailsIndex !== null && batchResult && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Image Details</DialogTitle>
              <DialogDescription>
                Batch Item #{viewingDetailsIndex + 1} • Generated on {new Date().toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image visualization */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Image</h4>
                {batchResult.batch_results.visualizations && 
                 batchResult.batch_results.visualizations[viewingDetailsIndex] && (
                  <div className="relative w-full aspect-square border rounded-md overflow-hidden">
                    <Image
                      src={`data:image/jpeg;base64,${batchResult.batch_results.visualizations[viewingDetailsIndex].visualization}`}
                      alt={`Analyzed Image ${viewingDetailsIndex + 1}`}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                )}
                
                {/* Download button for the details view */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={() => {
                      if (viewingDetailsIndex !== null && batchResult.batch_results.visualizations &&
                        batchResult.batch_results.visualizations[viewingDetailsIndex]) {
                        const link = document.createElement('a');
                        link.href = `data:image/jpeg;base64,${batchResult.batch_results.visualizations[viewingDetailsIndex].visualization}`;
                        link.download = `tagged-image-${viewingDetailsIndex + 1}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              
              {/* Attributes */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Product Details</h4>
                {batchResult.batch_results.results && 
                 batchResult.batch_results.results[viewingDetailsIndex] && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {batchResult.batch_results.results[viewingDetailsIndex].caption}
                    </p>
                    
                    <Separator className="my-4" />
                    
                    {renderRetailAttributes(batchResult.batch_results.results[viewingDetailsIndex].retail_attributes)}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
              {viewingDetailsIndex !== null && (
                savedBatchItems[viewingDetailsIndex] ? (
                  <Button variant="outline" disabled>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Saved to Gallery
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      if (viewingDetailsIndex !== null && batchResult.batch_results.visualizations && 
                          batchResult.batch_results.visualizations[viewingDetailsIndex]) {
                        saveBatchItemToGallery(
                          batchResult.batch_results.visualizations[viewingDetailsIndex].visualization, 
                          viewingDetailsIndex
                        );
                      }
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save to Gallery
                  </Button>
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 