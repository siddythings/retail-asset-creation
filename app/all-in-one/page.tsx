"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Wand2,
  Save,
  BookmarkPlus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Step, Stepper } from "@/components/ui/stepper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GalleryImageSelector } from "@/components/ui/gallery-image-selector";
import { Badge } from "@/components/ui/badge";

// Define types for our autonomous system
interface ModelGenerationSettings {
  prompt: string;
  gender: string;
  bodySize: string;
  skin_color: string;
  age: string;
  eyes: string;
  poseType: string;
  enhanceDetails: boolean;
  alchemy: boolean;
  ultra: boolean;
  styleUUID: string;
  enhancePrompt: boolean;
  numVariations: number; // Added this field
  advancedSettings: {
    negativePrompt: string;
    guidanceScale: number;
    seed: string;
  };
}

interface GarmentInfo {
  imageUrl: string | null;
  modelType: "Full Body" | "Top";
  wearType: string;
  name: string;
}

interface GeneratedModel {
  imageUrl: string;
  bodySize: "thin" | "average" | "plussize";
  skinColor: "light" | "medium" | "dark";
  selected: boolean;
}

interface TryOnResult {
  modelImageUrl: string;
  garmentImageUrl: string;
  resultImageUrl: string;
  bodySize: "thin" | "average" | "plussize";
  skinColor: "fair" | "dark";
  selected: boolean;
  isProcessing?: boolean;
  error?: string | null;
}

interface BackgroundResult {
  imageUrl: string;
  bodySize: "thin" | "average" | "plussize";
  skinColor: "fair" | "dark"; 
  selected: boolean;
}

// Add retail attributes interface for tagging
interface RetailAttributes {
  product_type: string;
  colors: string[];
  patterns: string[];
  materials: string[];
  style: string[];
  age_group: string;
  occasion: string;
  additional_notes?: string;
}

// Add analysis interface for tagging
interface Analysis {
  caption: string;
  retail_attributes: RetailAttributes;
  timestamp: string;
  model: string;
}

// Update tagging result interface
interface TaggingResult {
  imageUrl: string;
  tags: Record<string, any>;
  bodySize: "thin" | "average" | "plussize";
  skinColor: "fair" | "dark";
  analysis?: Analysis; // Added this field
  visualization?: string; // Added this field
  success?: boolean; // Added this field
  error?: string | null; // Added this field
}

export default function AllInOnePage() {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Garment upload state
  const [garment, setGarment] = useState<GarmentInfo>({
    imageUrl: null,
    modelType: "Full Body",
    wearType: "not-defined",
    name: ""
  });
  
  // Model generation state
  const [modelSettings, setModelSettings] = useState<ModelGenerationSettings>({
    prompt: "",
    gender: "female",
    bodySize: "average",
    skin_color: "not-specified",
    age: "not-specified",
    eyes: "not-specified",
    poseType: "neutral",
    enhanceDetails: true,
    alchemy: true,
    ultra: false,
    styleUUID: "556c1ee5-ec38-42e8-955a-1e82dad0ffa1",
    enhancePrompt: false,
    numVariations: 4,
    advancedSettings: {
      negativePrompt: "distorted, blurry, disfigured, bad anatomy, ugly",
      guidanceScale: 3.5,
      seed: ""
    }
  });
  
  // Generated models combinations (6 combinations, 4 variations each)
  const [modelVariations, setModelVariations] = useState<Record<string, GeneratedModel[]>>({});
  
  // Selected model after user chooses best one for each combination
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  
  // Try-on results (4 variations for each of the 6 selected models)
  const [tryOnVariations, setTryOnVariations] = useState<Record<string, TryOnResult[]>>({});
  
  // Selected try-on results after user chooses best one for each model
  const [selectedTryOnResults, setSelectedTryOnResults] = useState<Record<string, string>>({});
  
  // Background prompt
  const [backgroundPrompt, setBackgroundPrompt] = useState<string>("");
  
  // Background results (4 variations for each of the 6 selected try-on results)
  const [backgroundVariations, setBackgroundVariations] = useState<Record<string, BackgroundResult[]>>({});
  
  // Selected background results after user chooses best one for each try-on result
  const [selectedBackgroundResults, setSelectedBackgroundResults] = useState<Record<string, string>>({});
  
  // Final tagged images
  const [taggedResults, setTaggedResults] = useState<TaggingResult[]>([]);
  
  // Add new state for the detail view dialog
  const [detailView, setDetailView] = useState<{
    isOpen: boolean;
    imageUrl: string;
    label: string;
    index: number;
  }>({
    isOpen: false,
    imageUrl: "",
    label: "",
    index: 0
  });
  
  // Add new state for zoom functionality
  const [zoom, setZoom] = useState<{
    scale: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
    startX: number;
    startY: number;
  }>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  });

  // Add containerRef near the top of the component with other state declarations
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when dialog opens/closes
  useEffect(() => {
    if (!detailView.isOpen) {
      setZoom({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        startX: 0,
        startY: 0
      });
    }
  }, [detailView.isOpen]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.5, 4)
    }));
  };

  const handleZoomOut = () => {
    setZoom(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.5, 1)
    }));
  };

  const handleResetZoom = () => {
    setZoom({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      startX: 0,
      startY: 0
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom.scale > 1) {
      setZoom(prev => ({
        ...prev,
        isDragging: true,
        startX: e.clientX - prev.offsetX,
        startY: e.clientY - prev.offsetY
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (zoom.isDragging && zoom.scale > 1) {
      setZoom(prev => ({
        ...prev,
        offsetX: e.clientX - prev.startX,
        offsetY: e.clientY - prev.startY
      }));
    }
  };

  const handleMouseUp = () => {
    setZoom(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent) => {
    // Only handle keyboard shortcuts when detail view is open
    if (!detailView.isOpen) return;
    
    // Zoom In: Ctrl/Cmd + Plus or Equals
    if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
      e.preventDefault();
      handleZoomIn();
    }
    // Zoom Out: Ctrl/Cmd + Minus
    else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
      e.preventDefault();
      handleZoomOut();
    }
    // Reset Zoom: Ctrl/Cmd + 0
    else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      e.preventDefault();
      handleResetZoom();
    }
    // Close on Escape
    else if (e.key === "Escape") {
      setDetailView(prev => ({
        ...prev,
        isOpen: false
      }));
    }
  };

  // Update the handleWheel function
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.ctrlKey || e.metaKey) && containerRef.current) {
      e.preventDefault();
      const delta = -e.deltaY;
      
      setZoom(prev => {
        const newScale = delta > 0 
          ? Math.min(prev.scale + 0.25, 4)
          : Math.max(prev.scale - 0.25, 1);

        // If scale hasn't changed, don't update state
        if (newScale === prev.scale) return prev;

        // Calculate zoom center based on mouse position using the ref
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate new offsets to zoom towards mouse position
        const scaleChange = newScale / prev.scale;
        const newOffsetX = mouseX - (mouseX - prev.offsetX) * scaleChange;
        const newOffsetY = mouseY - (mouseY - prev.offsetY) * scaleChange;

        return {
          ...prev,
          scale: newScale,
          offsetX: newOffsetX,
          offsetY: newOffsetY
        };
      });
    }
  };

  // Add effect for keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [detailView.isOpen]); // Only re-add listener when dialog open state changes

  // Add this effect to preload images when they're available
  useEffect(() => {
    // Preload all model images 
    if (Object.keys(modelVariations).length > 0) {
      console.log("Preloading model images...");
      
      // Create a set of all image URLs
      const imageUrls = new Set<string>();
      
      Object.values(modelVariations).forEach(models => {
        models.forEach(model => {
          if (model.imageUrl) {
            imageUrls.add(model.imageUrl);
          }
        });
      });
      
      // Preload each image using HTMLImageElement directly, not the Next.js Image
      imageUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        console.log(`Preloading: ${url}`);
        img.onload = () => console.log(`Preloaded: ${url}`);
        img.onerror = () => {
          console.error(`Failed to preload: ${url}`);
          setFailedImages(prev => ({
            ...prev,
            [url]: true
          }));
        };
        // Don't need to append to DOM for preloading
      });
    }
  }, [modelVariations]);

  // Step definitions
  const steps = [
    { title: "Upload Garment", description: "Upload the product and set its type" },
    { title: "Generate Models", description: "Configure and generate AI models" },
    { title: "Select Models", description: "Select the best model from each combination" },
    { title: "Try-On", description: "Apply garment to selected models" },
    { title: "Select Try-On", description: "Select the best try-on result for each model" },
    { title: "Background", description: "Generate and select backgrounds" },
    { title: "Select Background", description: "Select the best background for each image" },
    { title: "Tagging", description: "Add metadata tags to final images" },
    { title: "Review & Save", description: "Review and save to gallery" }
  ];

  // Step rendering functions
  const renderCurrentStep = () => {
    switch(currentStep) {
      case 0:
        return renderGarmentUploadStep();
      case 1:
        return renderModelGenerationStep();
      case 2:
        return renderModelSelectionStep();
      case 3:
        return renderTryOnStep();
      case 4:
        return renderTryOnSelectionStep();
      case 5:
        return renderBackgroundStep();
      case 6:
        return renderBackgroundSelectionStep();
      case 7:
        return renderTaggingStep();
      case 8:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Placeholder render functions
  const renderGarmentUploadStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Upload Garment</h2>
        <p className="text-muted-foreground">Upload the product and specify its type for the autonomous workflow.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Image Upload */}
        <div className="space-y-6">
          <div className="border rounded-md p-6 space-y-4">
            <h3 className="text-lg font-medium">Product Image</h3>
            
            {garment.imageUrl ? (
              <div className="relative aspect-square rounded-md overflow-hidden border">
                <Image 
                  src={garment.imageUrl} 
                  alt="Uploaded garment" 
                  fill 
                  className="object-contain"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2"
                  onClick={() => setGarment({...garment, imageUrl: null})}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-md aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById('garment-upload')?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload product image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: High-quality image with transparent background
                </p>
              </div>
            )}
            
            <input 
              type="file" 
              id="garment-upload" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setGarment({
                      ...garment, 
                      imageUrl: e.target?.result as string
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('garment-upload')?.click()}
                disabled={!!garment.imageUrl}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right column - Product Details */}
        <div className="space-y-6">
          <div className="border rounded-md p-6 space-y-4">
            <h3 className="text-lg font-medium">Product Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input 
                  id="product-name" 
                  placeholder="Enter product name" 
                  value={garment.name}
                  onChange={(e) => setGarment({...garment, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model-type">Model Type</Label>
                <Select 
                  value={garment.modelType} 
                  onValueChange={(value: "Full Body" | "Top") => 
                    setGarment({...garment, modelType: value})
                  }
                >
                  <SelectTrigger id="model-type">
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Body">Full Body</SelectItem>
                    <SelectItem value="Top">Top</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose whether you want full body or top-only model shots
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wear-type">Wear Type</Label>
                <Select 
                  value={garment.wearType} 
                  onValueChange={(value) => 
                    setGarment({...garment, wearType: value})
                  }
                >
                  <SelectTrigger id="wear-type">
                    <SelectValue placeholder="Select wear type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-defined">Not Defined</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="long-dress">Long Dress</SelectItem>
                    <SelectItem value="short-dress">Short Dress</SelectItem>
                    <SelectItem value="t-shirt-jeans">T-Shirt & Jeans</SelectItem>
                    <SelectItem value="t-shirt">T-Shirt</SelectItem>
                    <SelectItem value="blouse">Blouse</SelectItem>
                    <SelectItem value="suit">Suit</SelectItem>
                    <SelectItem value="swimsuit">Swimsuit</SelectItem>
                    <SelectItem value="sportswear">Sportswear</SelectItem>
                    <SelectItem value="streetwear">Streetwear</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Specify the type of clothing for better model generation
                </p>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-6">
            <h3 className="text-lg font-medium mb-4">What happens next?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>We'll generate AI models in 6 different combinations (3 body sizes × 3 skin tones)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You'll select the best model for each combination</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>We'll automatically apply your product to each selected model</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>The process will continue through background generation and tagging</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle model generation process
  const handleModelGeneration = async () => {
    if (!modelSettings.prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt before generating models",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Combinations to generate
      const bodySizes = ["thin", "average", "plus-size"];
      const skinTones = ["light", "medium", "dark"];
      const totalCombinations = bodySizes.length * skinTones.length;
      const variationsPerCombination = modelSettings.numVariations;

      // Create a new variations object
      const newVariations: Record<string, GeneratedModel[]> = {};

      // Progress tracking
      let completedCombinations = 0;

      // Process each combination
      for (const bodySize of bodySizes) {
        for (const skinTone of skinTones) {
          const key = `${bodySize}-${skinTone}`;
          
          // Update progress for starting this combination
          setProgress((completedCombinations / totalCombinations) * 100);
          
          try {
            // Prepare the request data for model generation
            const requestData = {
              prompt: `${modelSettings.prompt}, ${modelSettings.gender}, ${modelSettings.poseType}, ${bodySize} body, ${skinTone} skin tone, ${modelSettings.age} years old, ${modelSettings.styleUUID} style`,
              negativePrompt: modelSettings.advancedSettings.negativePrompt,
              guidance_scale: modelSettings.advancedSettings.guidanceScale,
              num_images: 1, // Request 1 image at a time
              seed: modelSettings.advancedSettings.seed ? parseInt(modelSettings.advancedSettings.seed) : undefined,
              enhance_detail: modelSettings.enhanceDetails,
              attributes: {
                gender: modelSettings.gender,
                bodySize: bodySize,
                skin_color: skinTone,
                age: modelSettings.age,
                eyes: modelSettings.eyes,
                poseType: modelSettings.poseType,
                modelType: garment.modelType,
                wearType: garment.wearType,
                styleUUID: modelSettings.styleUUID,
                enhancePrompt: modelSettings.enhancePrompt
              }
            };

            console.log(`Generating models for ${key} with ${variationsPerCombination} variations:`, requestData);
            
            // Create an array to store the generated images for this combination
            const combinationImages: string[] = [];
            
            // Make multiple API requests based on numVariations
            for (let i = 0; i < variationsPerCombination; i++) {
              // Make the API request to generate models
              const response = await fetch('/api/model-generation/execute', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
              });

              if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
              }

              const responseData = await response.json();
              console.log(`API response for ${key} (variation ${i+1}):`, responseData);

              // Check if we need to poll for completion
              if (responseData.status === 'pending' && responseData.id) {
                // Poll for status until complete
                const images = await pollGenerationStatus(responseData.id);
                
                // Check if the number of returned images matches the requested number
                console.log(`Received ${images.length} images for variation ${i+1}`);
                
                // Extract URLs from response objects if they contain URL objects
                const processedImages = images.map((img: any) => {
                  // Handle cases where the image is an object with a url property
                  if (typeof img === 'object' && img !== null && img.url) {
                    return img.url;
                  }
                  // Handle string URLs
                  return img;
                });
                
                console.log(`Processed images for ${key} (variation ${i+1}):`, processedImages);
                
                // Add the generated image to our collection
                if (processedImages.length > 0) {
                  combinationImages.push(processedImages[0]);
                }
              } else if (responseData.images && responseData.images.length > 0) {
                // Extract URLs from response objects if they contain URL objects
                const processedImages = responseData.images.map((img: any) => {
                  // Handle cases where the image is an object with a url property
                  if (typeof img === 'object' && img !== null && img.url) {
                    return img.url;
                  }
                  // Handle string URLs
                  return img;
                });
                
                console.log(`Processed images for ${key} (variation ${i+1}):`, processedImages);
                
                // Add the generated image to our collection
                if (processedImages.length > 0) {
                  combinationImages.push(processedImages[0]);
                }
              } else {
                console.warn(`No images returned from API for ${key} (variation ${i+1})`);
              }
            }
            
            // Convert the collected images to our model format
            newVariations[key] = combinationImages.map((img: string) => ({
              imageUrl: img,
              bodySize: bodySize === "plus-size" ? "plussize" : bodySize as any,
              skinColor: skinTone as any,
              selected: false
            }));
          } catch (err) {
            console.error(`Error generating ${key}:`, err);
            newVariations[key] = [];
            setError(`Failed to generate ${bodySize}, ${skinTone} models: ${err}`);
          }

          // Update progress after completing this combination
          completedCombinations++;
          setProgress((completedCombinations / totalCombinations) * 100);
        }
      }

      // Set all variations at once
      setModelVariations(newVariations);
      
      // Enhanced debugging for model URLs
      console.log("All model variations:", newVariations);
      
      // Check image URL structure for debugging
      const firstKey = Object.keys(newVariations)[0];
      if (firstKey && newVariations[firstKey]?.length > 0) {
        const sampleImage = newVariations[firstKey][0];
        console.log("Sample image details:", {
          url: sampleImage.imageUrl,
          type: typeof sampleImage.imageUrl,
          isString: typeof sampleImage.imageUrl === 'string',
          urlStructure: sampleImage.imageUrl?.toString().substring(0, 50) + '...',
        });
      }
      
      // Move to the next step
      toast({
        title: "Success",
        description: "Model generation complete! You can now select your preferred models.",
      });

      // Proceed to model selection step
      setCurrentStep(2);
    } catch (err) {
      console.error('Model generation error:', err);
      setError(`Model generation failed: ${err}`);
      toast({
        title: "Error",
        description: `Model generation failed: ${err}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to poll for generation status
  const pollGenerationStatus = async (id: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/model-generation/status?id=${id}`);
          if (!response.ok) {
            throw new Error(`Status check failed with status ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Status check response:', data);
          
          if (data.status === 'finished' && data.images && data.images.length > 0) {
            resolve(data.images);
          } else if (data.status === 'failed') {
            reject(new Error(data.error || 'Generation failed'));
          } else {
            // Still processing, check again in 2 seconds
            setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          reject(err);
        }
      };
      
      // Start polling
      checkStatus();
    });
  };

  // Add this after the handleModelGeneration function
  const handleExampleModels = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Example model URLs from the Try-On page
      const exampleModels = [
        "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
        "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-1-9?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
        "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
        "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$"
      ];

      // Combinations to generate
      const bodySizes = ["thin", "average", "plus-size"];
      const skinTones = ["light", "medium", "dark"];
      const totalCombinations = bodySizes.length * skinTones.length;
      let completedCombinations = 0;

      // Create a new variations object
      const newVariations: Record<string, GeneratedModel[]> = {};

      // Process each combination
      for (const bodySize of bodySizes) {
        for (const skinTone of skinTones) {
          const key = `${bodySize}-${skinTone}`;
          
          // Update progress for starting this combination
          setProgress((completedCombinations / totalCombinations) * 100);
          
          // Use the same 4 example models for each combination
          newVariations[key] = exampleModels.map((imgUrl, index) => ({
            imageUrl: imgUrl,
            bodySize: bodySize === "plus-size" ? "plussize" : bodySize as any,
            skinColor: skinTone as any,
            selected: false
          }));

          // Update progress after completing this combination
          completedCombinations++;
          setProgress((completedCombinations / totalCombinations) * 100);
        }
      }

      // Set all variations at once
      setModelVariations(newVariations);
      console.log("All model variations:", newVariations);
      
      // Move to the next step
      toast({
        title: "Success",
        description: "Example models loaded! You can now select your preferred models.",
      });

      // Proceed to model selection step
      setCurrentStep(2);
    } catch (err) {
      console.error('Example models error:', err);
      setError(`Failed to load example models: ${err}`);
      toast({
        title: "Error",
        description: `Failed to load example models: ${err}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderModelGenerationStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Generate Models</h2>
        <p className="text-muted-foreground">
          Configure the model generation settings. We'll automatically create models with all combinations of 
          body sizes (thin, average, plus size) and skin tones (light, medium, dark).
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Basic Settings */}
        <div className="space-y-6">
          <div className="border rounded-md p-6 space-y-4">
            <h3 className="text-lg font-medium">Model Attributes</h3>
            
            <div className="space-y-4">
              {/* Gender Selection */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={modelSettings.gender} 
                  onValueChange={(value) => setModelSettings({
                    ...modelSettings,
                    gender: value
                  })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Body Size - Disabled */}
              <div className="space-y-2 opacity-70">
                <Label htmlFor="body-size">Body Size (Auto-generated)</Label>
                <Select disabled value="all">
                  <SelectTrigger id="body-size">
                    <SelectValue placeholder="All sizes will be generated" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes (Auto-generated)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The system will automatically generate models in thin, average, and plus size
                </p>
              </div>
              
              {/* Skin Color - Disabled */}
              <div className="space-y-2 opacity-70">
                <Label htmlFor="skin-color">Skin Tone (Auto-generated)</Label>
                <Select disabled value="all">
                  <SelectTrigger id="skin-color">
                    <SelectValue placeholder="All skin tones will be generated" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tones (Auto-generated)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The system will automatically generate models with light, medium, and dark skin tones
                </p>
              </div>

              {/* Eye Color */}
              <div className="space-y-2">
                <Label htmlFor="eyes">Eye Color</Label>
                <Select 
                  value={modelSettings.eyes} 
                  onValueChange={(value) => setModelSettings({
                    ...modelSettings,
                    eyes: value
                  })}
                >
                  <SelectTrigger id="eyes">
                    <SelectValue placeholder="Select eye color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="brown">Brown</SelectItem>
                    <SelectItem value="hazel">Hazel</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="not-specified">Not Specified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Pose Type */}
              <div className="space-y-2">
                <Label htmlFor="pose-type">Pose Type</Label>
                <Select 
                  value={modelSettings.poseType} 
                  onValueChange={(value) => setModelSettings({
                    ...modelSettings,
                    poseType: value
                  })}
                >
                  <SelectTrigger id="pose-type">
                    <SelectValue placeholder="Select pose type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The pose determines how the model will stand in the generated images
                </p>
              </div>
              
              {/* Age Range */}
              <div className="space-y-2">
                <Label htmlFor="age">Age Range</Label>
                <Select 
                  value={modelSettings.age} 
                  onValueChange={(value) => setModelSettings({
                    ...modelSettings,
                    age: value
                  })}
                >
                  <SelectTrigger id="age">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="25-35">25-35</SelectItem>
                    <SelectItem value="35-45">35-45</SelectItem>
                    <SelectItem value="45-60">45-60</SelectItem>
                    <SelectItem value="60+">60+</SelectItem>
                    <SelectItem value="not-specified">Not Specified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Style Preset */}
              <div className="space-y-2">
                <Label htmlFor="style">Style Preset</Label>
                <Select 
                  value={modelSettings.styleUUID} 
                  onValueChange={(value) => setModelSettings({
                    ...modelSettings,
                    styleUUID: value
                  })}
                >
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="556c1ee5-ec38-42e8-955a-1e82dad0ffa1">None</SelectItem>
                    <SelectItem value="debdf72a-91a4-467b-bf61-cc02bdeb69c6">3D Render</SelectItem>
                    <SelectItem value="9fdc5e8c-4d13-49b4-9ce6-5a74cbb19177">Bokeh</SelectItem>
                    <SelectItem value="a5632c7c-ddbb-4e2f-ba34-8456ab3ac436">Cinematic</SelectItem>
                    <SelectItem value="6fedbf1f-4a17-45ec-84fb-92fe524a29ef">Creative</SelectItem>
                    <SelectItem value="111dc692-d470-4eec-b791-3475abac4c46">Dynamic</SelectItem>
                    <SelectItem value="594c4a08-a522-4e0e-b7ff-e4dac4b6b622">Fashion</SelectItem>
                    <SelectItem value="97c20e5c-1af6-4d42-b227-54d03d8f0727">HDR</SelectItem>
                    <SelectItem value="8e2bc543-6ee2-45f9-bcd9-594b6ce84dcd">Portrait</SelectItem>
                    <SelectItem value="7c3f932b-a572-47cb-9b9b-f20211e63b5b">Pro Color Photography</SelectItem>
                    <SelectItem value="0d34f8e1-46d4-428f-8ddd-4b11811fa7c9">Portrait Fashion</SelectItem>
                    <SelectItem value="dee282d3-891f-4f73-ba02-7f8131e5541b">Vibrant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Prompt and Advanced Settings */}
        <div className="space-y-6">
          <div className="border rounded-md p-6 space-y-4">
            <h3 className="text-lg font-medium">Prompt and Settings</h3>
            
            <div className="space-y-4">
              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea 
                  id="prompt" 
                  placeholder="Enter a detailed description of the model and setting (e.g., professional fashion model on a plain background)"
                  value={modelSettings.prompt}
                  onChange={(e) => setModelSettings({
                    ...modelSettings,
                    prompt: e.target.value
                  })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the look, style, and background you want
                </p>
              </div>
              
              {/* Feature Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="enhance-details" className="flex-1">
                    Enhance Details
                  </Label>
                  <Switch 
                    id="enhance-details" 
                    checked={modelSettings.enhanceDetails}
                    onCheckedChange={(checked) => 
                      setModelSettings({
                        ...modelSettings,
                        enhanceDetails: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="alchemy" className="flex-1">
                    Use Alchemy (Higher Quality)
                  </Label>
                  <Switch 
                    id="alchemy" 
                    checked={modelSettings.alchemy}
                    onCheckedChange={(checked) => 
                      setModelSettings({
                        ...modelSettings,
                        alchemy: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="ultra" className="flex-1">
                    Ultra Enhancement
                  </Label>
                  <Switch 
                    id="ultra" 
                    checked={modelSettings.ultra}
                    onCheckedChange={(checked) => 
                      setModelSettings({
                        ...modelSettings,
                        ultra: checked
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="enhance-prompt" className="flex-1">
                    Enhance Prompt
                  </Label>
                  <Switch 
                    id="enhance-prompt" 
                    checked={modelSettings.enhancePrompt}
                    onCheckedChange={(checked) => 
                      setModelSettings({
                        ...modelSettings,
                        enhancePrompt: checked
                      })
                    }
                  />
                </div>

                {/* Number of Variations */}
                <div className="space-y-2">
                  <Label htmlFor="num-variations">Number of Variations per Combination</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      id="num-variations"
                      value={modelSettings.numVariations}
                      min={1}
                      max={8}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 8) {
                          setModelSettings({
                            ...modelSettings,
                            numVariations: value
                          });
                        }
                      }}
                      className="w-20"
                    />
                    <p className="text-sm text-muted-foreground">
                      Generate {modelSettings.numVariations} images for each body type/skin tone (1-8)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Advanced Settings */}
              <div className="border rounded-md p-4 space-y-4">
                <h4 className="text-sm font-medium">Advanced Settings</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="negative-prompt">Negative Prompt</Label>
                  <Input 
                    id="negative-prompt" 
                    placeholder="What to avoid in generation..."
                    value={modelSettings.advancedSettings.negativePrompt}
                    onChange={(e) => setModelSettings({
                      ...modelSettings,
                      advancedSettings: {
                        ...modelSettings.advancedSettings,
                        negativePrompt: e.target.value
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="guidance-scale">Guidance Scale: {modelSettings.advancedSettings.guidanceScale}</Label>
                  </div>
                  <Slider 
                    id="guidance-scale" 
                    min={1} 
                    max={4.5} 
                    step={0.5}
                    value={[modelSettings.advancedSettings.guidanceScale]}
                    onValueChange={([value]) => 
                      setModelSettings({
                        ...modelSettings,
                        advancedSettings: {
                          ...modelSettings.advancedSettings,
                          guidanceScale: value
                        }
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values make images follow the prompt more closely (1-4.5)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seed">Seed (Optional)</Label>
                  <Input 
                    id="seed" 
                    placeholder="Leave empty for random seed"
                    value={modelSettings.advancedSettings.seed}
                    onChange={(e) => setModelSettings({
                      ...modelSettings,
                      advancedSettings: {
                        ...modelSettings.advancedSettings,
                        seed: e.target.value
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the same seed for consistent results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Generate button at the bottom */}
      <div className="flex justify-center gap-4">
        <Button 
          size="lg" 
          onClick={handleModelGeneration}
          disabled={isProcessing || !modelSettings.prompt}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Models...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Models
            </>
          )}
        </Button>
        
        <Button 
          size="lg" 
          variant="outline"
          onClick={handleExampleModels}
          disabled={isProcessing}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Test with Example Models
        </Button>
      </div>
    </div>
  );

  const renderModelSelectionStep = () => {
    // Create an array of model combinations to render
    const modelCombinations = [
      { bodySize: "thin", skinTone: "light", label: "Thin, Light Skin" },
      { bodySize: "average", skinTone: "light", label: "Average, Light Skin" },
      { bodySize: "plus-size", skinTone: "light", label: "Plus Size, Light Skin" },
      { bodySize: "thin", skinTone: "medium", label: "Thin, Medium Skin" },
      { bodySize: "average", skinTone: "medium", label: "Average, Medium Skin" },
      { bodySize: "plus-size", skinTone: "medium", label: "Plus Size, Medium Skin" },
      { bodySize: "thin", skinTone: "dark", label: "Thin, Dark Skin" },
      { bodySize: "average", skinTone: "dark", label: "Average, Dark Skin" },
      { bodySize: "plus-size", skinTone: "dark", label: "Plus Size, Dark Skin" },
    ];

    // Debug logging in console only (not in UI)
    console.log("Model variations in selection step:", modelVariations);
    
    // Check if we have any images and if so, log the first one's URL
    const firstKey = Object.keys(modelVariations)[0];
    if (firstKey && modelVariations[firstKey] && modelVariations[firstKey].length > 0) {
      console.log("Sample image URL:", modelVariations[firstKey][0].imageUrl);
      // Log all image URLs for this combination
      modelVariations[firstKey].forEach((model, index) => {
        console.log(`Image ${index + 1} URL:`, model.imageUrl);
      });
    }

    // Log all combinations and their status
    modelCombinations.forEach(combo => {
      const key = `${combo.bodySize}-${combo.skinTone}`;
      const hasModels = modelVariations[key] && modelVariations[key].length > 0;
      console.log(`Combination ${key}:`, hasModels ? 'Has models' : 'No models');
    });

    // Check if we have any models generated at all
    const hasAnyModels = Object.values(modelVariations).some(
      models => models && models.length > 0
    );

    // Check if we have all the model variations
    const allModelsGenerated = modelCombinations.every(
      combo => {
        const key = `${combo.bodySize}-${combo.skinTone}`;
        return modelVariations[key] && modelVariations[key].length > 0;
      }
    );

    // Handle selecting a model
    const handleSelectModel = (combinationKey: string, imageUrl: string) => {
      setSelectedModels(prev => ({
        ...prev,
        [combinationKey]: imageUrl
      }));
    };

    // Check if all models have been selected
    const allModelsSelected = modelCombinations.every(
      combo => {
        const key = `${combo.bodySize}-${combo.skinTone}`;
        return selectedModels[key];
      }
    );

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Select Models</h2>
          <p className="text-muted-foreground">
            For each body size and skin tone combination, select the best model to use in the next steps.
            Click on any image to view it in detail.
          </p>
        </div>

        {!allModelsGenerated ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
              <h3 className="text-xl font-medium">No Models Generated</h3>
              <p className="text-muted-foreground max-w-md">
                Please go back to the previous step and generate models first.
              </p>
              <Button onClick={() => setCurrentStep(1)} variant="outline">
                Go to Model Generation
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {modelCombinations.map((combo) => {
                const key = `${combo.bodySize}-${combo.skinTone}`;
                const models = modelVariations[key] || [];
                const isSelected = !!selectedModels[key];

                return (
                  <div key={key} className="border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{combo.label}</h3>
                      {isSelected && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Selected
                        </div>
                      )}
                    </div>

                    {models.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No models generated for this combination
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {models.map((model, index) => (
                          <div 
                            key={`${key}-${index}`} 
                            className={`
                              relative border rounded-md overflow-hidden aspect-[3/4] cursor-pointer
                              ${selectedModels[key] === model.imageUrl ? 'ring-2 ring-primary' : 'hover:border-primary'}
                              group
                            `}
                          >
                            {/* Use Next.js Image component with error fallback */}
                            <div className="relative w-full h-full">
                              {failedImages[model.imageUrl] ? (
                                <div className="flex flex-col items-center justify-center h-full bg-muted p-2 text-center">
                                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                  <p className="text-xs text-muted-foreground">Image failed to load</p>
                                </div>
                              ) : (
                                <Image 
                                  src={model.imageUrl}
                                  alt={`${combo.label} variation ${index + 1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  className="object-cover"
                                  unoptimized={true}
                                  onClick={() => setDetailView({
                                    isOpen: true,
                                    imageUrl: model.imageUrl,
                                    label: `${combo.label} - Variation ${index + 1}`,
                                    index: index + 1
                                  })}
                                  onError={() => {
                                    console.error(`Error loading image: ${model.imageUrl}`);
                                    setFailedImages(prev => ({
                                      ...prev,
                                      [model.imageUrl]: true
                                    }));
                                  }}
                                />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-[80%]"
                                onClick={() => setDetailView({
                                  isOpen: true,
                                  imageUrl: model.imageUrl,
                                  label: `${combo.label} - Variation ${index + 1}`,
                                  index: index + 1
                                })}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-[80%]"
                                onClick={() => handleSelectModel(key, model.imageUrl)}
                              >
                                {selectedModels[key] === model.imageUrl ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                            {selectedModels[key] === model.imageUrl && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail View Dialog */}
            <Dialog open={detailView.isOpen} onOpenChange={(open) => setDetailView(prev => ({ ...prev, isOpen: open }))}>
              <DialogContent className="max-w-4xl h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{detailView.label}</span>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center text-sm text-muted-foreground">
                        <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl/⌘ +</span>
                        <span className="mx-1">or</span>
                        <span className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Mouse Wheel</span>
                        <span className="mx-1">to zoom</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleZoomOut}
                          disabled={zoom.scale <= 1}
                          title="Zoom Out (Ctrl/⌘ -)"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleZoomIn}
                          disabled={zoom.scale >= 4}
                          title="Zoom In (Ctrl/⌘ +)"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleResetZoom}
                          disabled={zoom.scale === 1 && zoom.offsetX === 0 && zoom.offsetY === 0}
                          title="Reset Zoom (Ctrl/⌘ 0)"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center h-full overflow-hidden">
                  <div 
                    ref={containerRef}
                    className="relative w-full h-[calc(90vh-8rem)] rounded-lg overflow-hidden cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                  >
                    <div
                      className="w-full h-full transition-transform duration-100"
                      style={{
                        transform: `scale(${zoom.scale}) translate(${zoom.offsetX / zoom.scale}px, ${zoom.offsetY / zoom.scale}px)`,
                        transformOrigin: 'center',
                      }}
                    >
                      {failedImages[detailView.imageUrl] ? (
                        <div className="flex flex-col items-center justify-center h-full bg-muted/20 p-4 text-center">
                          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Image failed to load</p>
                          <p className="text-xs text-muted-foreground mt-2">The image might be unavailable or there might be a connection issue.</p>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <Image
                            src={detailView.imageUrl}
                            alt={detailView.label}
                            fill
                            className="object-contain"
                            unoptimized={true}
                            draggable={false}
                            crossOrigin="anonymous"
                            onError={() => {
                              console.error(`Error loading detail image: ${detailView.imageUrl}`);
                              setFailedImages(prev => ({
                                ...prev,
                                [detailView.imageUrl]: true
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleResetZoom();
                        setDetailView(prev => ({
                          ...prev,
                          isOpen: false
                        }));
                      }}
                    >
                      Close
                    </Button>
                    {process.env.NODE_ENV === 'development' && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          console.log('Image URL:', detailView.imageUrl);
                          navigator.clipboard.writeText(detailView.imageUrl)
                            .then(() => toast({ title: "URL copied to clipboard" }))
                            .catch(err => console.error('Failed to copy URL:', err));
                        }}
                      >
                        Debug URL
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="border rounded-md p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Selection Progress</h3>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {Object.keys(selectedModels).length} of {modelCombinations.length} selected
                  </span>
                </div>
                <div>
                  <Button 
                    onClick={() => setCurrentStep(3)}
                    disabled={!allModelsSelected}
                  >
                    Continue to Try-On
                  </Button>
                </div>
              </div>
              {!allModelsSelected && (
                <p className="text-sm text-amber-600 mt-2">
                  Please select one model for each combination before proceeding.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Add new state for try-on process
  const [tryOnApiParameters, setTryOnApiParameters] = useState({
    mode: "quality",
    garmentPhotoType: "auto",
    numSamples: 4,
    restoreBackground: false,
    coverFeet: false,
    adjustHands: false,
    restoreClothes: false,
    nsfw_filter: true,
    longTop: false,
    seed: Math.floor(Math.random() * 10000000),
  });

  // Update the pollTryOnStatus function with better progress handling
  const pollTryOnStatus = async (id: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes total
      let timeout: NodeJS.Timeout;
      
      // Set a global timeout of 2 minutes
      const globalTimeout = setTimeout(() => {
        clearTimeout(timeout);
        reject(new Error('Try-on process timed out after 2 minutes'));
      }, 120000);
      
      // Start with 10% progress to show something is happening
      setProgress(10);
      
      const checkStatus = async () => {
        attempts++;
        
        // Calculate a simulated progress when API doesn't provide useful progress
        // This gives users feedback even when the API progress is stuck
        const simulatedProgress = Math.min(85, 10 + (attempts / maxAttempts) * 75);
        console.log(`Try-on polling attempt ${attempts}/${maxAttempts} - Simulated progress: ${simulatedProgress.toFixed(1)}%`);
        setProgress(simulatedProgress);
        
        try {
          const response = await fetch(`/api/virtual-try-on/query/${id}`);
          
          if (!response.ok) {
            clearTimeout(globalTimeout);
            reject(new Error(`Failed to check try-on status: ${response.statusText}`));
            return;
          }
          
          const data = await response.json();
          console.log(`Try-on status response (Attempt ${attempts}):`, data);
          
          // Handle different status responses
          if (data.status === 'finished' || data.status === 'completed') {
            clearTimeout(globalTimeout);
            console.log('Try-on completed successfully:', data);
            // Update the progress to 100% on completion
            setProgress(100);
            
            // Extract images from different possible response formats
            let images: string[] = [];
            
            // Handle Fashn.ai format
            if (data.images && Array.isArray(data.images)) {
              images = data.images;
              console.log(`Found ${images.length} images in 'images' array`);
            } 
            // Handle direct output array format
            else if (data.output && Array.isArray(data.output)) {
              images = data.output;
              console.log(`Found ${images.length} images in 'output' array`);
            } 
            // Handle nested output_urls format
            else if (data.output && data.output.output_urls && Array.isArray(data.output.output_urls)) {
              images = data.output.output_urls;
              console.log(`Found ${images.length} images in 'output.output_urls' array`);
            }
            // Handle images as objects with urls
            else if (data.results && Array.isArray(data.results) && data.results.length > 0) {
              // Try to extract from results[0].outputImageUrls (Aidge format)
              if (data.results[0].outputImageUrls && Array.isArray(data.results[0].outputImageUrls)) {
                images = data.results[0].outputImageUrls;
                console.log(`Found ${images.length} images in 'results[0].outputImageUrls' array`);
              }
              // Try to extract from results[0].taskResult.result.imageList (another Aidge format)
              else if (
                data.results[0].taskResult && 
                data.results[0].taskResult.result && 
                data.results[0].taskResult.result.imageList && 
                Array.isArray(data.results[0].taskResult.result.imageList)
              ) {
                images = data.results[0].taskResult.result.imageList.map(
                  (img: any) => img.imageUrl || img.url || img
                );
                console.log(`Found ${images.length} images in complex 'results' structure`);
              }
            }
            // Other formats we might have missed
            else if (data.output) {
              console.log('Unexpected output format, trying to extract images:', data.output);
              
              // Try to extract any URLs we can find
              if (typeof data.output === 'object') {
                const extractedUrls = Object.values(data.output)
                  .filter(val => typeof val === 'string' && (val.startsWith('http') || val.startsWith('/')))
                  .map(url => url as string);
                  
                if (extractedUrls.length > 0) {
                  images = extractedUrls;
                  console.log(`Extracted ${images.length} URLs from output object`);
                }
              }
            }
            
            console.log(`Extracted ${images.length} images from try-on response:`, images.slice(0, 3));
            
            resolve(images);
            return;
          } else if (data.status === 'failed') {
            clearTimeout(globalTimeout);
            reject(new Error(data.error || 'Try-on process failed'));
            return;
          } else if (data.status === 'processing' || data.status === 'starting') {
            // Check if we've exceeded the maximum attempts
            if (attempts >= maxAttempts) {
              clearTimeout(globalTimeout);
              reject(new Error('Try-on process timed out after maximum attempts'));
              return;
            }
            
            // Update progress if available and greater than our simulated progress
            if (data.progress !== undefined) {
              const progressValue = typeof data.progress === 'number' 
                ? data.progress 
                : parseFloat(data.progress || '0');
              
              // Ensure progress is between 0 and 100, and greater than simulated
              const apiProgress = Math.min(99, Math.max(0, progressValue * 100));
              console.log(`API reported progress: ${apiProgress.toFixed(1)}%`);
              
              // Only use API progress if it's meaningful (greater than our simulation)
              if (apiProgress > simulatedProgress) {
                console.log(`Using API progress: ${apiProgress.toFixed(1)}%`);
                setProgress(apiProgress);
              } else {
                console.log(`API progress too low (${apiProgress.toFixed(1)}%), using simulated: ${simulatedProgress.toFixed(1)}%`);
              }
            }
            
            // Use exponential backoff for polling
            const delay = Math.min(2000 + (attempts * 300), 5000);
            console.log(`Waiting ${delay}ms before next try-on status check`);
            timeout = setTimeout(checkStatus, delay);
          } else {
            // Handle unknown status by continuing to poll
            console.log(`Unknown try-on status: ${data.status}, continuing to poll`);
            timeout = setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          console.error('Error checking try-on status:', error);
          
          // Check if we've exceeded the maximum attempts
          if (attempts >= maxAttempts) {
            clearTimeout(globalTimeout);
            reject(new Error('Try-on process timed out after maximum attempts'));
            return;
          }
          
          // Continue polling despite the error
          timeout = setTimeout(checkStatus, 2000);
        }
      };
      
      // Start checking
      checkStatus();
    });
  };

  // Function to handle try-on generation
  const handleTryOn = async () => {
    if (!garment.imageUrl) {
      toast({
        title: "Error",
        description: "Please upload a garment image first",
        variant: "destructive"
      });
      return;
    }

    if (Object.keys(selectedModels).length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one model to continue",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    // Start with a loading toast
    toast({
      title: "Starting Try-On Process",
      description: "Preparing to apply your garment to selected models...",
      duration: 3000,
    });

    try {
      console.log('Selected models for try-on:', selectedModels);
      console.log('Try-on API parameters:', tryOnApiParameters);
      
      // Reset try-on variations
      const newTryOnVariations: Record<string, TryOnResult[]> = {};
      const totalModels = Object.keys(selectedModels).length;
      let processedModels = 0;
      
      // Update progress based on number of models processed
      const updateOverallProgress = (current: number, total: number) => {
        const progressPercentage = Math.round((current / total) * 100);
        console.log(`Overall try-on progress: ${progressPercentage}% (${current}/${total} models)`);
        setProgress(progressPercentage);
      };

      // Initialize progress
      updateOverallProgress(0, totalModels);

      for (const [modelKey, modelUrl] of Object.entries(selectedModels)) {
        console.log('Processing model combination:', modelKey);
        toast({
          title: "Processing Model",
          description: `Applying garment to ${modelKey.split('-').join(', ')} model...`,
          duration: 2000,
        });

        try {
          // Create FormData for the request
          const formData = new FormData();
          formData.append('modelImageUrl', modelUrl);
          formData.append('clothingImageUrl', garment.imageUrl!);
          formData.append('clothingType', garment.wearType);
          formData.append('gender', 'female');
          
          // Important: Change provider to fashn which better supports multiple images
          formData.append('apiProvider', 'fashn');
          
          // Ensure numSamples is passed correctly and duplicate it as generateCount
          const numSamples = tryOnApiParameters.numSamples.toString();
          formData.append('numSamples', numSamples);
          formData.append('generateCount', numSamples);
          
          // Add other important parameters
          formData.append('mode', tryOnApiParameters.mode);
          formData.append('restoreBackground', 'true');
          formData.append('nsfw_filter', 'true');
          formData.append('adjustHands', tryOnApiParameters.adjustHands.toString());
          formData.append('restoreClothes', tryOnApiParameters.restoreClothes.toString());
          formData.append('seed', tryOnApiParameters.seed.toString());
          formData.append('garmentPhotoType', tryOnApiParameters.garmentPhotoType);

          console.log('Sending try-on request for model:', modelKey, 'with numSamples:', numSamples);
          const response = await fetch('/api/virtual-try-on/execute', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Try-on request failed with status ${response.status}`);
          }
          
          const responseData = await response.json();
          console.log('Try-on response for', modelKey, ':', responseData);

          let tryOnImages: any[] = [];

          if (responseData.status === 'pending' || responseData.status === 'processing') {
            console.log('Starting polling for model:', modelKey);
            // Poll for completion with timeout
            tryOnImages = await pollTryOnStatus(responseData.id);
          } else {
            console.log('Try-on completed immediately for model:', modelKey);
            // Handle all the possible response formats from the API
            
            // First, try to extract images from the response
            if (responseData.images && Array.isArray(responseData.images)) {
              console.log('Found images array in response with length:', responseData.images.length);
              tryOnImages = responseData.images;
            }
            // Next, check for output array directly
            else if (responseData.output && Array.isArray(responseData.output)) {
              console.log('Found output array in response with length:', responseData.output.length);
              tryOnImages = responseData.output.map((url: string) => ({ outputImageUrl: url }));
            }
            // Check for output.output_urls (common Fashn.ai format)
            else if (responseData.output && responseData.output.output_urls && Array.isArray(responseData.output.output_urls)) {
              console.log('Found output.output_urls in response with length:', responseData.output.output_urls.length);
              tryOnImages = responseData.output.output_urls.map((url: string) => ({ outputImageUrl: url }));
            }
            // Try to use Fashn.ai-specific fields
            else if (responseData.provider === 'fashn') {
              // Direct console.log of the complete responseData for debugging
              console.log('Fashn.ai response structure:', JSON.stringify(responseData, null, 2));
              
              // Check if output exists but isn't an array (might be object)
              if (responseData.output && typeof responseData.output === 'object') {
                console.log('Found object-type output in Fashn response');
                
                // Get all properties and object values that might be arrays or strings
                for (const key in responseData.output) {
                  const value = responseData.output[key];
                  if (Array.isArray(value)) {
                    console.log(`Found array in output.${key} with length:`, value.length);
                    tryOnImages = value.map((url: string) => ({ outputImageUrl: url }));
                    break;
                  } else if (typeof value === 'string' && value.startsWith('http')) {
                    console.log(`Found URL string in output.${key}`);
                    tryOnImages = [{ outputImageUrl: value }];
                    break;
                  }
                }
              }
            }
          }
          
          // Log the try-on images for debugging
          console.log('Try-on images for', modelKey, ':', tryOnImages);

          // Process and normalize image URLs
          const normalizedImages = tryOnImages.map((img: any) => {
            let imageUrl;
            
            // For debugging
            console.log('Processing try-on image item:', typeof img, img);
            
            // Handle different response formats
            if (typeof img === 'object' && img !== null) {
              // Extract URL from object using a prioritized list of property names
              const possibleUrlProperties = ['outputImageUrl', 'url', 'imageUrl', 'output_url', 'imageUrl', 'image_url'];
              
              for (const prop of possibleUrlProperties) {
                if (img[prop] && typeof img[prop] === 'string') {
                  imageUrl = img[prop];
                  console.log(`Found URL in ${prop} property:`, imageUrl);
                  break;
                }
              }
              
              // If no URL was found but there are string properties, try to find one that looks like a URL
              if (!imageUrl) {
                for (const prop in img) {
                  if (typeof img[prop] === 'string' && img[prop].startsWith('http')) {
                    imageUrl = img[prop];
                    console.log(`Found URL-like string in ${prop} property:`, imageUrl);
                    break;
                  }
                }
              }
            }
            // If it's already a string URL
            else if (typeof img === 'string') {
              imageUrl = img;
              console.log('Image is already a string URL:', imageUrl);
            }
            
            // Make sure the URL is absolute and uses https
            if (typeof imageUrl === 'string' && imageUrl.length > 0) {
              // If the URL is relative, add the API base URL
              if (imageUrl.startsWith('/')) {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
                imageUrl = `${apiBase}${imageUrl}`;
                console.log('Converted relative URL to absolute:', imageUrl);
              }
              
              // Add proxy prefix for CORS issues
              if (imageUrl.startsWith('http') && !imageUrl.includes('/api/proxy?url=')) {
                imageUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
                console.log('Added proxy prefix to URL:', imageUrl);
              }
            } else {
              console.log('Could not extract a valid URL from:', img);
            }
            
            return imageUrl;
          }).filter(url => typeof url === 'string' && url.length > 0);

          console.log(`Normalized ${normalizedImages.length} image URLs for ${modelKey}:`, normalizedImages);

          if (normalizedImages.length > 0) {
            // Create a TryOnResult object for each image
            newTryOnVariations[modelKey] = normalizedImages.map(imageUrl => ({
              modelImageUrl: modelUrl,
              garmentImageUrl: garment.imageUrl!,
              resultImageUrl: imageUrl as string, // Explicitly cast to string since we've filtered undefined values
              bodySize: modelKey.split('-')[0] as "thin" | "average" | "plussize",
              skinColor: modelKey.split('-')[1] as "fair" | "dark",
              selected: false
            }));
          } else {
            // If no images were found, create a TryOnResult with a fallback image
            console.warn(`No valid try-on images found for ${modelKey}, using fallback`);
            
            // Use a fallback option instead of throwing an error
            newTryOnVariations[modelKey] = [{
              modelImageUrl: modelUrl,
              garmentImageUrl: garment.imageUrl!,
              resultImageUrl: modelUrl, // Use the model image as a fallback
              bodySize: modelKey.split('-')[0] as "thin" | "average" | "plussize",
              skinColor: modelKey.split('-')[1] as "fair" | "dark",
              selected: false,
              error: 'No try-on images received'
            }];
          }

          processedModels++;
          updateOverallProgress(processedModels, totalModels);
        } catch (err) {
          console.error('Error processing model', modelKey, ':', err);
          // Store a placeholder image for failed try-ons
          newTryOnVariations[modelKey] = [{
            modelImageUrl: modelUrl,
            garmentImageUrl: garment.imageUrl!,
            resultImageUrl: '/api/proxy?url=' + encodeURIComponent(modelUrl), // Use model image as fallback instead of placeholder
            bodySize: modelKey.split('-')[0] as "thin" | "average" | "plussize",
            skinColor: modelKey.split('-')[1] as "fair" | "dark",
            selected: false,
            error: err instanceof Error ? err.message : 'Failed to process try-on'
          }];
          
          // Still count this as processed for progress calculation
          processedModels++;
          updateOverallProgress(processedModels, totalModels);
        }
      }

      setTryOnVariations(newTryOnVariations);
      console.log('Final try-on variations:', newTryOnVariations);
      
      // Move to the next step after successful completion
      toast({
        title: "Success",
        description: "Try-on generation completed",
      });
      
      // Advance to the next step (Try-On Selection)
      setCurrentStep(prev => prev + 1);
    } catch (err) {
      console.error('Try-on generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate try-on results');
      toast({
        title: "Error",
        description: "Failed to generate try-on results",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const renderTryOnStep = () => {
    // Create an array of model combinations to render
    const modelCombinations = Object.entries(selectedModels).map(([key, modelUrl]) => {
      const [bodySize, skinColor] = key.split('-');
      return {
        key,
        modelUrl,
        bodySize: bodySize === "plus-size" ? "plussize" : bodySize,
        skinColor,
        label: `${bodySize.charAt(0).toUpperCase() + bodySize.slice(1)}, ${skinColor.charAt(0).toUpperCase() + skinColor.slice(1)} Skin`
      };
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Try-On Process</h2>
          <p className="text-muted-foreground">
            Apply the garment to each selected model. We'll generate multiple variations for each model.
          </p>
        </div>

        {/* Display selected models */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modelCombinations.map((combo) => (
            <div key={combo.key} className="border rounded-md p-4 space-y-3">
              <h3 className="text-lg font-medium">{combo.label}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-[3/4] relative">
                  <Image
                    src={combo.modelUrl}
                    alt={`Original ${combo.label} model`}
                    fill
                    className="object-cover rounded-md"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                    Original Model
                  </div>
                </div>
                <div className="aspect-[3/4] relative">
                  <Image
                    src={garment.imageUrl!}
                    alt="Original garment"
                    fill
                    className="object-contain rounded-md"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                    Garment
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Try-on parameters */}
        <div className="border rounded-md p-6 space-y-4">
          <h3 className="text-lg font-medium">Try-On Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select 
                value={tryOnApiParameters.mode} 
                onValueChange={(value) => setTryOnApiParameters(prev => ({ ...prev, mode: value }))}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="speed">Speed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-samples">Number of Samples</Label>
              <Select 
                value={tryOnApiParameters.numSamples.toString()} 
                onValueChange={(value) => setTryOnApiParameters(prev => ({ ...prev, numSamples: parseInt(value) }))}
              >
                <SelectTrigger id="num-samples">
                  <SelectValue placeholder="Select number of samples" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 variations</SelectItem>
                  <SelectItem value="4">4 variations</SelectItem>
                  <SelectItem value="6">6 variations</SelectItem>
                  <SelectItem value="8">8 variations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garment-photo-type">Garment Photo Type</Label>
              <Select 
                value={tryOnApiParameters.garmentPhotoType} 
                onValueChange={(value) => setTryOnApiParameters(prev => ({ ...prev, garmentPhotoType: value }))}
              >
                <SelectTrigger id="garment-photo-type">
                  <SelectValue placeholder="Select garment photo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="front">Front view</SelectItem>
                  <SelectItem value="back">Back view</SelectItem>
                  <SelectItem value="side">Side view</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seed">Seed (Optional)</Label>
              <Input 
                id="seed" 
                placeholder="Leave empty for random seed"
                value={tryOnApiParameters.seed.toString()}
                onChange={(e) => setTryOnApiParameters(prev => ({ ...prev, seed: parseInt(e.target.value) || Math.floor(Math.random() * 10000000) }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="restore-background" className="flex-1">
                Restore Background
              </Label>
              <Switch 
                id="restore-background" 
                checked={tryOnApiParameters.restoreBackground}
                onCheckedChange={(checked) => 
                  setTryOnApiParameters(prev => ({
                    ...prev,
                    restoreBackground: checked
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="adjust-hands" className="flex-1">
                Adjust Hands
              </Label>
              <Switch 
                id="adjust-hands" 
                checked={tryOnApiParameters.adjustHands}
                onCheckedChange={(checked) => 
                  setTryOnApiParameters(prev => ({
                    ...prev,
                    adjustHands: checked
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="restore-clothes" className="flex-1">
                Restore Clothes
              </Label>
              <Switch 
                id="restore-clothes" 
                checked={tryOnApiParameters.restoreClothes}
                onCheckedChange={(checked) => 
                  setTryOnApiParameters(prev => ({
                    ...prev,
                    restoreClothes: checked
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={handleTryOn}
            disabled={isProcessing || !garment.imageUrl}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Try-On...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Start Try-On Process
              </>
            )}
          </Button>

          <Button 
            size="lg" 
            variant="outline"
            onClick={handleExampleTryOn}
            disabled={isProcessing}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Test with Example Results
          </Button>
        </div>
      </div>
    );
  };

  // Add this new function for handling example try-on results
  const handleExampleTryOn = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Example try-on result URLs from AI-generated woman models
      const exampleResults = [
        "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80"
      ];

      const newTryOnVariations: Record<string, TryOnResult[]> = {};
      const totalModels = Object.keys(selectedModels).length;
      let processedModels = 0;

      for (const [modelKey, modelUrl] of Object.entries(selectedModels)) {
        // Use the same example results for each model
        newTryOnVariations[modelKey] = exampleResults.map(imgUrl => ({
          modelImageUrl: modelUrl,
          garmentImageUrl: garment.imageUrl!,
          resultImageUrl: imgUrl,
          bodySize: modelKey.split('-')[0] as "thin" | "average" | "plussize",
          skinColor: modelKey.split('-')[1] as "fair" | "dark",
          selected: false
        }));

        processedModels++;
        const progressPercentage = Math.round((processedModels / totalModels) * 100);
        setProgress(progressPercentage);
      }

      setTryOnVariations(newTryOnVariations);
      console.log('Example try-on variations:', newTryOnVariations);
      
      toast({
        title: "Success",
        description: "Example try-on results generated! You can now select your preferred results.",
      });

      // Move to the next step
      setCurrentStep(4);
    } catch (err) {
      console.error('Example try-on error:', err);
      setError(`Failed to generate example try-on results: ${err}`);
      toast({
        title: "Error",
        description: "Failed to generate example try-on results",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const renderTryOnSelectionStep = () => {
    // Create an array of model combinations to render
    const modelCombinations = Object.entries(selectedModels).map(([key, modelUrl]) => {
      const [bodySize, skinColor] = key.split('-');
      return {
        key,
        modelUrl,
        bodySize: bodySize === "plus-size" ? "plussize" : bodySize,
        skinColor,
        label: `${bodySize.charAt(0).toUpperCase() + bodySize.slice(1)}, ${skinColor.charAt(0).toUpperCase() + skinColor.slice(1)} Skin`
      };
    });

    // Debug logging
    console.log("Try-on variations in selection step:", tryOnVariations);
    
    // Check if we have any try-on results
    const hasAnyResults = Object.values(tryOnVariations).some(
      results => results && results.length > 0
    );
    
    // Additional debugging for each result
    Object.entries(tryOnVariations).forEach(([key, results]) => {
      console.log(`Combination ${key} has ${results?.length || 0} try-on results`);
      if (results && results.length > 0) {
        console.log(`First result URL: ${results[0].resultImageUrl}`);
        // Check if images were proxied
        const isProxied = results[0].resultImageUrl.includes('/api/proxy');
        console.log(`Images are ${isProxied ? 'proxied' : 'not proxied'}`);
      }
    });

    // Handle selecting a try-on result
    const handleSelectTryOn = (combinationKey: string, resultImageUrl: string) => {
      setSelectedTryOnResults(prev => ({
        ...prev,
        [combinationKey]: resultImageUrl
      }));
    };

    // Check if all try-on results have been selected
    const allResultsSelected = modelCombinations.every(
      combo => selectedTryOnResults[combo.key]
    );

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Select Try-On Results</h2>
          <p className="text-muted-foreground">
            For each model, select the best try-on result to use in the next steps.
            Click on any image to view it in detail.
          </p>
        </div>

        {!hasAnyResults ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
              <h3 className="text-xl font-medium">No Try-On Results</h3>
              <p className="text-muted-foreground max-w-md">
                Please go back to the previous step and generate try-on results first.
              </p>
              <Button onClick={() => setCurrentStep(3)} variant="outline">
                Go to Try-On Process
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {modelCombinations.map((combo) => {
                const results = tryOnVariations[combo.key] || [];
                const isSelected = !!selectedTryOnResults[combo.key];

                return (
                  <div key={combo.key} className="border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{combo.label}</h3>
                      {isSelected && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Selected
                        </div>
                      )}
                    </div>

                    {/* Original Model and Garment */}
                    <div className="grid grid-cols-2 gap-2 border-b pb-3">
                      <div className="aspect-[3/4] relative">
                        <Image
                          src={combo.modelUrl}
                          alt={`Original ${combo.label} model`}
                          fill
                          className="object-cover rounded-md"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                          Original Model
                        </div>
                      </div>
                      <div className="aspect-[3/4] relative">
                        <Image
                          src={garment.imageUrl!}
                          alt="Original garment"
                          fill
                          className="object-contain rounded-md"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                          Garment
                        </div>
                      </div>
                    </div>

                    {/* Try-on Results */}
                    {results.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No try-on results generated for this combination
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {results.map((result, index) => (
                          <div 
                            key={`${combo.key}-${index}`} 
                            className={`
                              relative border rounded-md overflow-hidden aspect-[3/4] cursor-pointer
                              ${selectedTryOnResults[combo.key] === result.resultImageUrl ? 'ring-2 ring-primary' : 'hover:border-primary'}
                              group
                            `}
                          >
                            {/* Use a direct img tag instead of Next.js Image for maximum reliability */}
                            <div className="relative w-full h-full flex items-center justify-center bg-muted/20">
                              {/* Simple loader while image is loading */}
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                              </div>
                              <img 
                                src={result.resultImageUrl}
                                alt={`${combo.label} try-on variation ${index + 1}`}
                                className="w-full h-full object-cover z-20"
                                onLoad={(e) => {
                                  // Hide the loader once image is loaded
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const loader = parent.querySelector("div.animate-spin")?.parentElement;
                                    if (loader) loader.style.display = "none";
                                  }
                                  console.log(`Successfully loaded try-on image: ${result.resultImageUrl}`);
                                }}
                                onError={(e) => {
                                  console.error(`Error loading image: ${result.resultImageUrl}`);
                                  
                                  // On error, try to load the image via proxy if not already using proxy
                                  const target = e.target as HTMLImageElement;
                                  
                                  if (!result.resultImageUrl.includes('/api/proxy')) {
                                    console.log("Retrying with proxy...");
                                    target.src = `/api/proxy?url=${encodeURIComponent(result.resultImageUrl)}`;
                                    return; // Exit early to give the proxy a chance
                                  }
                                  
                                  // If proxy also fails or we're already using proxy, show fallback
                                  target.style.display = "none"; // Hide the broken image
                                  
                                  const parent = target.parentElement;
                                  if (parent) {
                                    // Remove the loader
                                    const loader = parent.querySelector("div.animate-spin")?.parentElement;
                                    if (loader) loader.style.display = "none";
                                    
                                    // Create and append error element if not already there
                                    if (!parent.querySelector(".image-error-fallback")) {
                                      const errorDiv = document.createElement("div");
                                      errorDiv.className = "image-error-fallback flex flex-col items-center justify-center h-full p-2 text-center";
                                      errorDiv.innerHTML = `
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-muted-foreground mb-2">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <line x1="12" y1="8" x2="12" y2="12"></line>
                                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        <p class="text-xs text-muted-foreground">Image failed to load</p>
                                        <button class="text-xs text-primary mt-1 underline">Use Model Image</button>
                                      `;
                                      
                                      // Add event listener to the button to use model image as fallback
                                      parent.appendChild(errorDiv);
                                      const fallbackBtn = errorDiv.querySelector('button');
                                      if (fallbackBtn) {
                                        fallbackBtn.addEventListener('click', () => {
                                          // Use the model image as fallback
                                          target.src = result.modelImageUrl;
                                          target.style.display = "block";
                                          errorDiv.style.display = "none";
                                        });
                                      }
                                    }
                                  }
                                  // Show error toast
                                  toast({
                                    title: "Image Load Error",
                                    description: `Failed to load try-on result for ${combo.label}`,
                                    variant: "destructive"
                                  });
                                }}
                                onClick={() => {
                                  // Check if image loaded successfully before showing detail view
                                  const img = document.querySelector(`img[src="${result.resultImageUrl}"]`) as HTMLImageElement;
                                  if (img && img.complete && img.naturalWidth > 0) {
                                    setDetailView({
                                      isOpen: true,
                                      imageUrl: result.resultImageUrl,
                                      label: `${combo.label} - Try-on Variation ${index + 1}`,
                                      index: index + 1
                                    });
                                  }
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-30">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-[80%]"
                                onClick={(e) => {
                                  // Stop event propagation to prevent the image click handler from firing
                                  e.stopPropagation();
                                  setDetailView({
                                    isOpen: true,
                                    imageUrl: result.resultImageUrl,
                                    label: `${combo.label} - Try-on Variation ${index + 1}`,
                                    index: index + 1
                                  });
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-[80%]"
                                onClick={(e) => {
                                  // Stop event propagation
                                  e.stopPropagation();
                                  handleSelectTryOn(combo.key, result.resultImageUrl);
                                }}
                              >
                                {selectedTryOnResults[combo.key] === result.resultImageUrl ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                            {selectedTryOnResults[combo.key] === result.resultImageUrl && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-30">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border rounded-md p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Selection Progress</h3>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {Object.keys(selectedTryOnResults).length} of {modelCombinations.length} selected
                  </span>
                </div>
                <div>
                  <Button 
                    onClick={() => setCurrentStep(5)}
                    disabled={!allResultsSelected}
                  >
                    Continue to Background Generation
                  </Button>
                </div>
              </div>
              {!allResultsSelected && (
                <p className="text-sm text-amber-600 mt-2">
                  Please select one try-on result for each model before proceeding.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Add these state variables after the existing state declarations
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState("fast");
  const [refinePrompt, setRefinePrompt] = useState("true");
  const [originalQuality, setOriginalQuality] = useState(false);
  const [numOutputs, setNumOutputs] = useState<number>(1);
  const [backgroundResults, setBackgroundResults] = useState<Record<string, Array<[string, number, string]>>>({});
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<Record<string, string>>({});
  const [showBackgroundTemplates, setShowBackgroundTemplates] = useState(false);
  const [savedImageIds, setSavedImageIds] = useState<Set<string>>(new Set());
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  // Add this state to track failed image loads
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Add state for image tagging
  const [isTagging, setIsTagging] = useState(false);
  const [taggingModel, setTaggingModel] = useState('gpt-4o');
  const [taggingResults, setTaggingResults] = useState<Record<string, TaggingResult>>({});
  const [savedTaggedImages, setSavedTaggedImages] = useState<Set<string>>(new Set());

  // Add this constant after the existing constants
  const BACKGROUND_TEMPLATES = [
    {
      category: "Nature",
      prompts: [
        {
          text: "A serene forest with sunlight filtering through the trees",
          sampleImage: "https://images.unsplash.com/photo-1511497584788-876760111969?w=500&q=80"
        },
        {
          text: "Misty mountains at sunrise",
          sampleImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80"
        },
        {
          text: "Tropical beach with crystal clear water",
          sampleImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80"
        },
        {
          text: "Desert landscape with rolling sand dunes",
          sampleImage: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=500&q=80"
        },
      ],
    },
    {
      category: "Urban",
      prompts: [
        {
          text: "Modern city skyline at night",
          sampleImage: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&q=80"
        },
        {
          text: "Vintage brick wall with graffiti art",
          sampleImage: "https://images.unsplash.com/photo-1533736405784-798e2e103a3f?w=500&q=80"
        },
        {
          text: "Cozy coffee shop interior",
          sampleImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80"
        },
        {
          text: "Bustling city street with neon signs",
          sampleImage: "https://images.unsplash.com/photo-1555708982-8645ec9ce3cc?w=500&q=80"
        },
      ],
    },
    {
      category: "Abstract",
      prompts: [
        {
          text: "Colorful gradient with soft bokeh effects",
          sampleImage: "https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=500&q=80"
        },
        {
          text: "Geometric patterns in pastel colors",
          sampleImage: "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=500&q=80"
        },
        {
          text: "Abstract watercolor texture",
          sampleImage: "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=500&q=80"
        },
        {
          text: "Minimalist white background with subtle shadows",
          sampleImage: "https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=500&q=80"
        },
      ],
    },
  ];

  // Add these handler functions after the existing handlers
  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);

      // Show preview immediately using FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setBackgroundImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      try {
        // Upload to backend which will use ImageKit
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadResponse = await fetch("http://localhost:8000/background/upload-to-bria", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload background image");
        }
        
        const uploadData = await uploadResponse.json();
        
        // Update with the public URL from ImageKit
        setBackgroundImage(uploadData.url);
        
        toast({
          title: "Success",
          description: "Background image uploaded successfully",
        });
      } catch (error) {
        console.error("Error uploading background image:", error);
        toast({
          title: "Error",
          description: "Failed to upload background image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBackgroundGallerySelect = async (imageUrl: string) => {
    try {
      setIsProcessing(true);
      
      // Gallery images are already on ImageKit, so we can use directly
      setBackgroundImage(imageUrl);
      
      console.log("Selected background from gallery:", imageUrl);
      
      toast({
        title: "Success",
        description: "Background image selected from gallery",
      });
    } catch (error) {
      console.error("Error selecting background from gallery:", error);
      toast({
        title: "Error",
        description: "There was an error selecting the background image from gallery.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to check if an image URL is publicly accessible
  const isImageAccessible = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // This will allow us to check cross-origin URLs
      });
      return true; // If we got here, the image is likely accessible
    } catch (error) {
      console.error('Error checking image accessibility:', error);
      return false;
    }
  };

  // Helper function to download an image from a URL and upload it to ImageKit
  const uploadImageToImageKit = async (imageUrl: string, modelId: string): Promise<string> => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `model_${modelId}.png`, { type: 'image/png' });
      
      // Create form data for uploading
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload to backend which will use ImageKit
      const uploadResponse = await fetch("http://localhost:8000/background/upload-to-bria", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to ImageKit");
      }
      
      const uploadData = await uploadResponse.json();
      return uploadData.url;
    } catch (error) {
      console.error('Error uploading image to ImageKit:', error);
      throw error;
    }
  };

  const handleGenerateBackground = async () => {
    if (!backgroundPrompt) {
      toast({
        title: "Error",
        description: "Please enter a background prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBackground(true);
    setProgress(0);

    try {
      const newResults: Record<string, Array<[string, number, string]>> = {};
      const modelCombinations = Object.entries(selectedTryOnResults).map(([modelId, imageUrl]) => ({
        modelId,
        imageUrl,
      }));

      let completedCount = 0;
      const totalCount = modelCombinations.length;

      for (const { modelId, imageUrl } of modelCombinations) {
        try {
          console.log(`Processing image for model ${modelId}:`, imageUrl);
          
          // Ensure we have a publicly accessible URL for Bria API
          let processedImageUrl = imageUrl;
          
          // Handle proxy URLs - always download and reupload these to ensure access
          if (imageUrl.startsWith('/api/proxy')) {
            console.log(`Image ${modelId} is a proxy URL, downloading and reuploading...`);
            
            // Fetch the image from our proxy endpoint
            const proxyResponse = await fetch(imageUrl);
            if (!proxyResponse.ok) {
              throw new Error(`Failed to fetch image from proxy: ${proxyResponse.statusText}`);
            }
            
            // Get the image blob
            const blob = await proxyResponse.blob();
            
            // Create a file from the blob
            const file = new File([blob], `model_${modelId}.png`, { type: blob.type || 'image/png' });
            
            // Upload to ImageKit via our backend
            const formData = new FormData();
            formData.append("file", file);
            
            const uploadResponse = await fetch("http://localhost:8000/background/upload-to-bria", {
              method: "POST",
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              throw new Error("Failed to upload image to get public URL");
            }
            
            const uploadData = await uploadResponse.json();
            processedImageUrl = uploadData.url;
            console.log(`Reuploaded image ${modelId} to ImageKit:`, processedImageUrl);
          }
          // Handle data URLs
          else if (imageUrl.startsWith('data:image')) {
            console.log(`Image ${modelId} is a data URL, uploading to ImageKit...`);
            processedImageUrl = await uploadImageToImageKit(imageUrl, modelId);
            console.log(`Uploaded image ${modelId} to ImageKit:`, processedImageUrl);
          }
          // For CDN URLs, we might also need to reupload to ensure cross-domain access
          else if (imageUrl.includes('cdn.fashn.ai') || !imageUrl.startsWith('http')) {
            console.log(`Image ${modelId} is a CDN URL or relative URL, reuploading to ImageKit...`);
            // For CDN URLs, we'll fetch and reupload to ensure the Bria API can access it
            processedImageUrl = await uploadImageToImageKit(imageUrl, modelId);
            console.log(`Reuploaded image ${modelId} to ImageKit:`, processedImageUrl);
          }

          console.log(`Final processed URL for model ${modelId}:`, processedImageUrl);

          const payload = {
            image_url: processedImageUrl,
            bg_prompt: backgroundPrompt,
            fast: generationMode === "fast",
            refine_prompt: refinePrompt === "true",
            original_quality: originalQuality,
            num_results: numOutputs
          };

          console.log(`Generating background for model ${modelId}:`, payload);

          const response = await fetch("/api/background-generator", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to generate background");
          }

          const data = await response.json();
          console.log(`Background generation response for model ${modelId}:`, data);
          
          if (data.result && data.result.length > 0) {
            newResults[modelId] = data.result;
          } else {
            console.error(`No results for model ${modelId}:`, data);
            toast({
              title: "Warning",
              description: `No background variations generated for model ${modelId}. The image URL might not be compatible with the API.`,
              variant: "destructive",
            });
          }

          completedCount++;
          const progressPercentage = Math.round((completedCount / totalCount) * 100);
          setProgress(progressPercentage);
        } catch (error) {
          console.error(`Error generating background for model ${modelId}:`, error);
          toast({
            title: "Error",
            description: `Failed to generate background for model ${modelId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }

      if (Object.keys(newResults).length > 0) {
        setBackgroundResults(newResults);
        setCurrentStep(6); // Move to background selection step
      } else {
        toast({
          title: "Error",
          description: "No backgrounds were generated successfully. Please try again with different images or prompts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in background generation:", error);
      toast({
        title: "Error",
        description: `Failed to generate backgrounds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBackground(false);
      setProgress(0);
    }
  };

  // Add these render functions after the existing render functions
  const renderBackgroundStep = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Background Generation</h2>
          <p className="text-muted-foreground">
            Generate background variations for each selected try-on result.
          </p>
        </div>

        {/* Display selected try-on results */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(selectedTryOnResults).map(([key, imageUrl]) => {
            const [bodySize, skinColor] = key.split('-');
            return (
              <div key={key} className="border rounded-md p-4 space-y-3">
                <h3 className="text-lg font-medium">
                  {`${bodySize.charAt(0).toUpperCase() + bodySize.slice(1)}, ${skinColor.charAt(0).toUpperCase() + skinColor.slice(1)} Skin`}
                </h3>
                <div className="aspect-[3/4] relative">
                  <Image
                    src={imageUrl}
                    alt={`Selected try-on result for ${key}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Background generation parameters */}
        <div className="border rounded-md p-6 space-y-4">
          <h3 className="text-lg font-medium">Background Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select 
                value={generationMode} 
                onValueChange={setGenerationMode}
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-samples">Number of Samples</Label>
              <Select 
                value={numOutputs.toString()} 
                onValueChange={(value) => setNumOutputs(parseInt(value))}
              >
                <SelectTrigger id="num-samples">
                  <SelectValue placeholder="Select number of samples" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 variations</SelectItem>
                  <SelectItem value="4">4 variations</SelectItem>
                  <SelectItem value="6">6 variations</SelectItem>
                  <SelectItem value="8">8 variations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-prompt">Background Prompt</Label>
              <div className="relative">
                <textarea
                  id="background-prompt"
                  className="w-full min-h-[60px] p-2 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
                  placeholder="Enter background prompt"
                  value={backgroundPrompt}
                  onChange={(e) => setBackgroundPrompt(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => setShowBackgroundTemplates(true)}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refine-prompt">Refine Prompt</Label>
              <Select value={refinePrompt} onValueChange={setRefinePrompt}>
                <SelectTrigger id="refine-prompt">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="original-quality"
                checked={originalQuality}
                onCheckedChange={(checked) => setOriginalQuality(checked as boolean)}
                className="h-4 w-4"
              />
              <Label htmlFor="original-quality">Original Quality</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Background Image Reference (Optional)</h3>
              {backgroundImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBackgroundImage(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Upload a reference image to influence the background style
            </p>
            <div className="flex space-x-2">
              <Input
                id="background-upload"
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
                className="flex-1"
              />
              <GalleryImageSelector
                onSelectImage={handleBackgroundGallerySelect}
                buttonText="From Gallery"
                allowedTypes={["model-generation", "bg-generator"]}
                buttonVariant="outline"
                buttonClassName="whitespace-nowrap"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleGenerateBackground}
            disabled={isGeneratingBackground}
            className="gap-2"
          >
            {isGeneratingBackground ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Backgrounds...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Backgrounds
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderBackgroundSelectionStep = () => {
    // Check if we have any background results
    const hasAnyResults = Object.keys(backgroundResults).length > 0;

    // Handle selecting a background
    const handleSelectBackground = (modelKey: string, backgroundUrl: string) => {
      setSelectedBackgrounds(prev => ({
        ...prev,
        [modelKey]: backgroundUrl
      }));
    };

    // Handle downloading an image
    const handleDownload = async (imageUrl: string, modelKey: string) => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `background-${modelKey}-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Error",
          description: "Failed to download the image",
          variant: "destructive"
        });
      }
    };

    // Handle saving to gallery
    const handleSaveToGallery = async (imageUrl: string, modelKey: string) => {
      // Check if this image has already been saved
      if (savedImageIds.has(imageUrl)) {
        toast({
          title: "Already saved",
          description: "This image is already in your gallery.",
          variant: "default",
        });
        return;
      }

      try {
        setIsSavingToGallery(true);

        // Create a unique ID for this save operation
        const batchId = crypto.randomUUID();

        // Create the gallery item
        const galleryItem = {
          id: batchId,
          title: `Background for ${modelKey}`,
          date: new Date().toISOString(),
          provider: "bria",
          thumbnailUrl: imageUrl,
          images: [imageUrl],
          type: "bg-generator" as const,
        };

        // Save directly to localStorage
        const existingItems = localStorage.getItem("galleryItems");
        let items = [];

        if (existingItems) {
          try {
            items = JSON.parse(existingItems);
          } catch (e) {
            console.error("Error parsing existing gallery items:", e);
            items = [];
          }
        }

        // Add new item
        items.push(galleryItem);

        // Save back to localStorage
        localStorage.setItem("galleryItems", JSON.stringify(items));

        // Dispatch custom event to update gallery in real-time
        const event = new CustomEvent("galleryUpdate", {
          detail: { item: galleryItem },
        });
        window.dispatchEvent(event);

        // Mark this image as saved
        setSavedImageIds((prev) => {
          const updated = new Set(prev);
          updated.add(imageUrl);
          return updated;
        });

        toast({
          title: "Success!",
          description: "Image saved to your gallery.",
        });
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to save to gallery",
        });
      } finally {
        setIsSavingToGallery(false);
      }
    };

    // Check if all backgrounds have been selected
    const allBackgroundsSelected = Object.keys(selectedTryOnResults).every(
      key => selectedBackgrounds[key]
    );

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Select Backgrounds</h2>
          <p className="text-muted-foreground">
            For each model, select the best background variation to use in the final result.
          </p>
        </div>

        {!hasAnyResults ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
              <h3 className="text-xl font-medium">No Background Results</h3>
              <p className="text-muted-foreground max-w-md">
                Please go back to the previous step and generate background variations first.
              </p>
              <Button onClick={() => setCurrentStep(5)} variant="outline">
                Go to Background Generation
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(selectedTryOnResults).map(([modelKey, tryOnUrl]) => {
                const [bodySize, skinColor] = modelKey.split('-');
                const modelResults = backgroundResults[modelKey] || [];
                const isSelected = !!selectedBackgrounds[modelKey];

                return (
                  <div key={modelKey} className="border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {`${bodySize.charAt(0).toUpperCase() + bodySize.slice(1)}, ${skinColor.charAt(0).toUpperCase() + skinColor.slice(1)} Skin`}
                      </h3>
                      {isSelected && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Selected
                        </div>
                      )}
                    </div>

                    {/* Original try-on result */}
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={tryOnUrl}
                        alt={`Original try-on result for ${modelKey}`}
                        fill
                        className="object-cover rounded-md"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                        Original Try-On
                      </div>
                    </div>

                    {/* Background variations */}
                    {modelResults.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No background variations generated for this model
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {modelResults.map(([imageUrl, seed, filename], index) => (
                          <div 
                            key={`${modelKey}-${index}`} 
                            className={`
                              relative border rounded-md overflow-hidden aspect-[3/4] cursor-pointer
                              ${selectedBackgrounds[modelKey] === imageUrl ? 'ring-2 ring-primary' : 'hover:border-primary'}
                              group
                            `}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`Background variation ${index + 1}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('View Details clicked for image:', imageUrl);
                                console.log('Current detailView state:', detailView);
                                setDetailView({
                                  isOpen: true,
                                  imageUrl: imageUrl,
                                  label: `Background Variation ${index + 1}`,
                                  index: index + 1
                                });
                                console.log('New detailView state:', {
                                  isOpen: true,
                                  imageUrl: imageUrl,
                                  label: `Background Variation ${index + 1}`,
                                  index: index + 1
                                });
                              }}
                              onError={(e) => {
                                console.error(`Error loading image: ${imageUrl}`);
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('placeholder-model.jpg')) {
                                  // Create a data URL for a simple placeholder image
                                  const canvas = document.createElement('canvas');
                                  canvas.width = 400;
                                  canvas.height = 600;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.fillStyle = '#f3f4f6';
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    ctx.fillStyle = '#6b7280';
                                    ctx.font = '16px sans-serif';
                                    ctx.textAlign = 'center';
                                    ctx.fillText('Image failed to load', canvas.width / 2, canvas.height / 2);
                                  }
                                  target.src = canvas.toDataURL();
                                  target.alt = 'Image failed to load';
                                  
                                  // Show error toast
                                  toast({
                                    title: "Image Load Error",
                                    description: `Failed to load background variation for ${modelKey}`,
                                    variant: "destructive"
                                  });
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-[80%]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('View Details clicked for image:', imageUrl);
                                  console.log('Current detailView state:', detailView);
                                  setDetailView({
                                    isOpen: true,
                                    imageUrl: imageUrl,
                                    label: `Background Variation ${index + 1}`,
                                    index: index + 1
                                  });
                                  console.log('New detailView state:', {
                                    isOpen: true,
                                    imageUrl: imageUrl,
                                    label: `Background Variation ${index + 1}`,
                                    index: index + 1
                                  });
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-[80%]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectBackground(modelKey, imageUrl);
                                }}
                              >
                                {selectedBackgrounds[modelKey] === imageUrl ? 'Selected' : 'Select'}
                              </Button>
                              <div className="flex space-x-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(imageUrl, modelKey);
                                  }}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveToGallery(imageUrl, modelKey);
                                  }}
                                  disabled={isSavingToGallery || savedImageIds.has(imageUrl)}
                                >
                                  {isSavingToGallery ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : savedImageIds.has(imageUrl) ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Saved
                                    </>
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                              </div>
                            </div>
                            {selectedBackgrounds[modelKey] === imageUrl && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border rounded-md p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Selection Progress</h3>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {Object.keys(selectedBackgrounds).length} of {Object.keys(selectedTryOnResults).length} selected
                  </span>
                </div>
                <div>
                  <Button 
                    onClick={() => setCurrentStep(7)}
                    disabled={!allBackgroundsSelected}
                  >
                    Continue to Image Tagging
                  </Button>
                </div>
              </div>
              {!allBackgroundsSelected && (
                <p className="text-sm text-amber-600 mt-2">
                  Please select one background variation for each model before proceeding.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Add the background templates dialog
  const renderBackgroundTemplatesDialog = () => (
    <Dialog open={showBackgroundTemplates} onOpenChange={setShowBackgroundTemplates}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-6">
        <div className="space-y-4 h-full">
          <h2 className="text-lg font-semibold">Background Templates</h2>
          <Tabs defaultValue={BACKGROUND_TEMPLATES[0].category.toLowerCase()} className="h-[calc(100%-2rem)]">
            <TabsList className="w-full justify-start">
              {BACKGROUND_TEMPLATES.map((category) => (
                <TabsTrigger 
                  key={category.category} 
                  value={category.category.toLowerCase()}
                  className="px-4"
                >
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {BACKGROUND_TEMPLATES.map((category) => (
              <TabsContent 
                key={category.category} 
                value={category.category.toLowerCase()}
                className="mt-4 h-[calc(80vh-180px)] overflow-y-auto border rounded-md p-4"
              >
                <div className="grid grid-cols-3 gap-4">
                  {category.prompts.map((prompt) => (
                    <div
                      key={prompt.text}
                      className="group border rounded-lg overflow-hidden hover:border-primary transition-colors bg-card"
                    >
                      <div className="p-3 space-y-3">
                        <div className="relative w-16 h-16 mx-auto rounded-md overflow-hidden">
                          <Image
                            src={prompt.sampleImage}
                            alt={prompt.text}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm line-clamp-2 text-muted-foreground group-hover:text-foreground">
                            {prompt.text}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs h-8 mt-2"
                          onClick={() => {
                            setBackgroundPrompt(prompt.text);
                            setShowBackgroundTemplates(false);
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
  
  const renderTaggingStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Image Tagging</h2>
        <p className="text-muted-foreground">
          Add metadata tags to your final images with AI-powered tagging for ecommerce attributes.
        </p>
      </div>
      
      {/* Tagging model selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tagging Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tagging-model">Processing Mode</Label>
              <Select
                value={taggingModel}
                onValueChange={(value) => setTaggingModel(value)}
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
              <p className="mt-1 text-xs text-muted-foreground">
                Choose the processing mode based on your needs. "Balanced" offers a good combination of speed and quality.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Overview</h3>
          <div className="rounded-md border bg-muted/40 p-4">
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Selected Models:</span>
                <span className="text-sm font-medium">{Object.keys(selectedBackgrounds).length}</span>
              </div>
              <Separator className="my-2" />
              <div className="text-sm text-muted-foreground">
                AI-powered tagging will analyze your images and provide detailed product attributes like color, pattern, material, and style.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview of images to be tagged */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Selected Images for Tagging</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(selectedBackgrounds).map(([modelKey, imageUrl]) => (
            <div key={modelKey} className="border rounded-md p-2 space-y-2">
              <div className="aspect-[3/4] relative overflow-hidden rounded-md">
                <Image 
                  src={imageUrl} 
                  alt={`Model ${modelKey}`} 
                  fill 
                  className="object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {modelKey.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={handleImageTagging}
          disabled={isTagging || Object.keys(selectedBackgrounds).length === 0}
          className="gap-2"
        >
          {isTagging ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Tagging Images...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Tag Selected Images
            </>
          )}
        </Button>
      </div>
      
      {/* Progress bar when processing */}
      {isTagging && (
        <div className="flex flex-col items-center space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Processing {progress}%
          </p>
        </div>
      )}
      
      {/* Display tagging results if available */}
      {Object.keys(taggingResults).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tagging Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(taggingResults).map(([modelKey, result]) => (
              <Card key={modelKey} className={`overflow-hidden ${!result.success ? 'border-red-300' : ''}`}>
                <div className="grid md:grid-cols-5 gap-0">
                  {/* Image column */}
                  <div className="md:col-span-2 border-r">
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src={result.visualization || result.imageUrl}
                        alt={`Tagged image for ${modelKey}`}
                        fill
                        className="object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                  
                  {/* Attributes column */}
                  <div className="md:col-span-3 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">
                        {modelKey.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(', ')}
                      </h3>
                      
                      {result.success ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => saveTaggedImageToGallery(modelKey, result)}
                            disabled={savedTaggedImages.has(modelKey)}
                          >
                            {savedTaggedImages.has(modelKey) ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    
                    {result.success && result.analysis ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground">{result.analysis.caption}</p>
                        </div>
                        <Separator />
                        {renderRetailAttributes(result.analysis.retail_attributes)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <div className="text-center space-y-2">
                          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                          <p className="text-sm text-muted-foreground">
                            {result.error || "Failed to analyze image"}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Remove the failed result and try again for this image
                              const {[modelKey]: _, ...rest} = taggingResults;
                              setTaggingResults(rest);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="border rounded-md p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">Tagging Summary</h3>
                <span className="ml-2 text-sm text-muted-foreground">
                  {Object.values(taggingResults).filter(r => r.success).length} of {Object.keys(taggingResults).length} successful
                </span>
              </div>
              <div>
                <Button 
                  onClick={() => setCurrentStep(8)}
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderReviewStep = () => {
    // Use a safe default for garment name
    const garmentName = "Product";
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Review & Save</h2>
          <p className="text-muted-foreground">
            Review your complete asset creation journey and save the final results.
          </p>
        </div>
        
        {/* Overview card */}
        <Card className="border-primary/20">
          <CardHeader className="bg-muted/30">
            <CardTitle>Process Summary</CardTitle>
            <CardDescription>
              Your retail asset creation journey from start to finish
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 text-center">
                <div className="font-medium text-xl">1</div>
                <div className="font-medium">Garment</div>
                <div className="text-sm text-muted-foreground">
                  {garmentName}
                </div>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-medium text-xl">{Object.keys(selectedModels).length}</div>
                <div className="font-medium">Models</div>
                <div className="text-sm text-muted-foreground">Selected models</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-medium text-xl">{Object.keys(selectedTryOnResults).length}</div>
                <div className="font-medium">Try-Ons</div>
                <div className="text-sm text-muted-foreground">Selected try-on results</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-medium text-xl">{Object.keys(selectedBackgrounds).length}</div>
                <div className="font-medium">Backgrounds</div>
                <div className="text-sm text-muted-foreground">Selected backgrounds</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Final Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Final Results</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Create a zip file with all the final images
                toast({
                  title: "Downloading...",
                  description: "This feature is coming soon."
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(selectedBackgrounds).map(([modelKey, backgroundUrl]) => {
              // Find the corresponding try-on result
              const tryOnUrl = selectedTryOnResults[modelKey];
              // Get the model attributes
              const [bodySize, skinColor] = modelKey.split('-') as ["thin" | "average" | "plussize", "fair" | "dark"];
              // Check if we have tagging results for this model
              const taggingResult = taggingResults[modelKey];
              
              return (
                <Card key={modelKey} className="overflow-hidden">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={backgroundUrl}
                      alt={`Final result for ${modelKey}`}
                      fill
                      className="object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {`${bodySize.charAt(0).toUpperCase() + bodySize.slice(1)} Model, ${skinColor.charAt(0).toUpperCase() + skinColor.slice(1)} Skin`}
                      </h4>
                      {taggingResult?.success && (
                        <Badge variant="outline" className="ml-2">
                          Tagged
                        </Badge>
                      )}
                    </div>
                    
                    {/* Product attributes if available */}
                    {taggingResult?.success && taggingResult.analysis && (
                      <div className="text-sm">
                        <div className="font-medium">Product Type</div>
                        <div className="text-muted-foreground mb-2">{taggingResult.analysis.retail_attributes.product_type}</div>
                        
                        {taggingResult.analysis.retail_attributes.colors.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {taggingResult.analysis.retail_attributes.colors.map((color, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{color}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Download the image
                            const link = document.createElement('a');
                            link.href = backgroundUrl;
                            link.download = `${garmentName}-${modelKey}.jpg`;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          // Save to gallery
                          const galleryId = crypto.randomUUID();
                          const galleryItem = {
                            id: galleryId,
                            title: taggingResult?.analysis?.retail_attributes.product_type || `${garmentName} - ${modelKey}`,
                            date: new Date().toISOString(),
                            provider: "all-in-one",
                            thumbnailUrl: backgroundUrl,
                            images: [backgroundUrl],
                            type: "all-in-one" as const,
                            metadata: {
                              tryOn: tryOnUrl,
                              modelKey: modelKey,
                              ...(taggingResult?.analysis ? { analysis: taggingResult.analysis } : {})
                            }
                          };
                          
                          // Save to localStorage
                          const existingItems = localStorage.getItem("galleryItems");
                          let items = [];
                          
                          if (existingItems) {
                            try {
                              items = JSON.parse(existingItems);
                            } catch (e) {
                              console.error("Error parsing gallery items:", e);
                              items = [];
                            }
                          }
                          
                          items.push(galleryItem);
                          localStorage.setItem("galleryItems", JSON.stringify(items));
                          
                          // Dispatch custom event for gallery update
                          const event = new CustomEvent("galleryUpdate", {
                            detail: { item: galleryItem }
                          });
                          window.dispatchEvent(event);
                          
                          toast({
                            title: "Success!",
                            description: "Item saved to gallery"
                          });
                        }}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save to Gallery
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Process Journey Visualization */}
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-medium">Creation Journey</h3>
          <p className="text-sm text-muted-foreground">
            See how your assets evolved through each step of the process
          </p>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-max">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center space-y-2">
                  <div className="font-medium">Original</div>
                  <div className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                    <div className="text-sm text-muted-foreground">Original Garment</div>
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="font-medium">Model Generation</div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Fixed element to avoid type errors */}
                    <div className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                      <div className="text-sm text-muted-foreground">Model</div>
                    </div>
                    {Object.keys(selectedModels).length > 1 && (
                      <div className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                        <div className="text-sm text-muted-foreground">+{Object.keys(selectedModels).length - 1} more</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="font-medium">Try-On</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedTryOnResults).slice(0, 3).map(([key, imageUrl]) => (
                      <div key={key} className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={`Try-on ${key}`}
                          fill
                          className="object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ))}
                    {Object.keys(selectedTryOnResults).length > 3 && (
                      <div className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                        <div className="text-sm text-muted-foreground">+{Object.keys(selectedTryOnResults).length - 3} more</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="font-medium">Background</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedBackgrounds).slice(0, 3).map(([key, imageUrl]) => (
                      <div key={key} className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={`Background ${key}`}
                          fill
                          className="object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ))}
                    {Object.keys(selectedBackgrounds).length > 3 && (
                      <div className="relative h-48 w-36 mx-auto border rounded-md overflow-hidden flex items-center justify-center bg-muted">
                        <div className="text-sm text-muted-foreground">+{Object.keys(selectedBackgrounds).length - 3} more</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tagging Information */}
        {Object.keys(taggingResults).length > 0 && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center">
              <h3 className="text-lg font-medium">Tagging Information</h3>
              <div className="ml-2 text-sm text-muted-foreground">
                {Object.values(taggingResults).filter(r => r.success).length} items tagged
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <Tabs defaultValue="summary">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <div className="space-y-4">
                    {/* Extract common attributes */}
                    {(() => {
                      const successfulResults = Object.values(taggingResults).filter(r => r.success && r.analysis);
                      if (successfulResults.length === 0) return null;
                      
                      // Collect all unique values for each attribute
                      const commonAttrs = {
                        product_type: new Set<string>(),
                        colors: new Set<string>(),
                        materials: new Set<string>(),
                        patterns: new Set<string>(),
                        style: new Set<string>(),
                        occasion: new Set<string>()
                      };
                      
                      // Populate the sets
                      successfulResults.forEach(result => {
                        if (!result.analysis) return;
                        
                        commonAttrs.product_type.add(result.analysis.retail_attributes.product_type);
                        
                        result.analysis.retail_attributes.colors.forEach(c => commonAttrs.colors.add(c));
                        result.analysis.retail_attributes.materials.forEach(m => commonAttrs.materials.add(m));
                        result.analysis.retail_attributes.patterns.forEach(p => commonAttrs.patterns.add(p));
                        result.analysis.retail_attributes.style.forEach(s => commonAttrs.style.add(s));
                        
                        if (result.analysis.retail_attributes.occasion) {
                          commonAttrs.occasion.add(result.analysis.retail_attributes.occasion);
                        }
                      });
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="font-medium">Product Type</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(commonAttrs.product_type).map((type, i) => (
                                <Badge key={i} variant="outline">{type}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Colors</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(commonAttrs.colors).map((color, i) => (
                                <Badge key={i} variant="outline">{color}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Materials</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(commonAttrs.materials).map((material, i) => (
                                <Badge key={i} variant="outline">{material}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Patterns</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(commonAttrs.patterns).map((pattern, i) => (
                                <Badge key={i} variant="outline">{pattern}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Style</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(commonAttrs.style).map((style, i) => (
                                <Badge key={i} variant="outline">{style}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="font-medium">Occasion</div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(commonAttrs.occasion).map((occasion, i) => (
                                <Badge key={i} variant="outline">{occasion}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </TabsContent>
                
                <TabsContent value="details">
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Detailed tagging information for each model
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(taggingResults)
                        .filter(([_, result]) => result.success && result.analysis)
                        .map(([modelKey, result]) => (
                          <div key={modelKey} className="border rounded-md p-4">
                            <div className="flex items-center mb-4">
                              <div className="relative h-16 w-16 rounded-md overflow-hidden mr-4">
                                <Image
                                  src={result.visualization || result.imageUrl}
                                  alt={`Tagged ${modelKey}`}
                                  fill
                                  className="object-cover"
                                  crossOrigin="anonymous"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {modelKey.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(', ')}
                                </h4>
                                {result.analysis && (
                                  <p className="text-sm text-muted-foreground">{result.analysis.caption}</p>
                                )}
                              </div>
                            </div>
                            
                            {result.analysis && (
                              <div className="pl-4 border-l-2 border-muted">
                                {renderRetailAttributes(result.analysis.retail_attributes)}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
        
        {/* Final action buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button 
            variant="outline"
            onClick={() => setCurrentStep(7)}
          >
            Back to Tagging
          </Button>
          
          <Button
            onClick={() => {
              // Final completion action - perhaps redirect to gallery or reset the flow
              toast({
                title: "Success!",
                description: "Your retail asset creation is complete!"
              });
              
              // Reset or redirect as needed
              // window.location.href = "/gallery";
            }}
          >
            Complete & Save All
          </Button>
        </div>
      </div>
    );
  };
  
  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add detail view dialog component for background images
  const renderBackgroundDetailDialog = () => {
    // Reference the download and save functions from the selection step
    const handleDownloadImage = async (imageUrl: string) => {
      if (!imageUrl) return;
      
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `background-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Error",
          description: "Failed to download the image",
          variant: "destructive"
        });
      }
    };

    const handleSaveImageToGallery = async (imageUrl: string) => {
      if (!imageUrl) return;
      
      // Check if this image has already been saved
      if (savedImageIds.has(imageUrl)) {
        toast({
          title: "Already saved",
          description: "This image is already in your gallery.",
          variant: "default",
        });
        return;
      }

      try {
        setIsSavingToGallery(true);

        // Create a unique ID for this save operation
        const batchId = crypto.randomUUID();

        // Create the gallery item
        const galleryItem = {
          id: batchId,
          title: `Background Image`,
          date: new Date().toISOString(),
          provider: "bria",
          thumbnailUrl: imageUrl,
          images: [imageUrl],
          type: "bg-generator" as const,
        };

        // Save directly to localStorage
        const existingItems = localStorage.getItem("galleryItems");
        let items = [];

        if (existingItems) {
          try {
            items = JSON.parse(existingItems);
          } catch (e) {
            console.error("Error parsing existing gallery items:", e);
            items = [];
          }
        }

        // Add new item
        items.push(galleryItem);

        // Save back to localStorage
        localStorage.setItem("galleryItems", JSON.stringify(items));

        // Dispatch custom event to update gallery in real-time
        const event = new CustomEvent("galleryUpdate", {
          detail: { item: galleryItem },
        });
        window.dispatchEvent(event);

        // Mark this image as saved
        setSavedImageIds((prev) => {
          const updated = new Set(prev);
          updated.add(imageUrl);
          return updated;
        });

        toast({
          title: "Success!",
          description: "Image saved to your gallery.",
        });
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to save to gallery",
        });
      } finally {
        setIsSavingToGallery(false);
      }
    };
    
    return (
      <Dialog open={detailView.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDetailView(prev => ({ ...prev, isOpen: false }));
        }
      }}>
        <DialogContent className="max-w-4xl">
          <div className="flex flex-col space-y-4">
            <div className="text-lg font-semibold">{detailView.label}</div>
            
            <div className="relative w-full aspect-[3/4]">
              {detailView.imageUrl && (
                <img
                  src={detailView.imageUrl}
                  alt={detailView.label || "Image detail"}
                  className="w-full h-full object-contain rounded-md"
                  crossOrigin="anonymous"
                />
              )}
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDetailView(prev => ({ ...prev, isOpen: false }));
                }}
              >
                Close
              </Button>
              
              {detailView.imageUrl && (
                <div className="flex space-x-2">
                  <Button 
                    variant="secondary"
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (detailView.imageUrl) {
                        handleDownloadImage(detailView.imageUrl);
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  
                  <Button 
                    variant="default"
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (detailView.imageUrl) {
                        handleSaveImageToGallery(detailView.imageUrl);
                      }
                    }}
                    disabled={detailView.imageUrl ? savedImageIds.has(detailView.imageUrl) : false}
                  >
                    {detailView.imageUrl && savedImageIds.has(detailView.imageUrl) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save to Gallery
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Add the handler for image tagging
  const handleImageTagging = async () => {
    // Ensure we have selected backgrounds to tag
    if (Object.keys(selectedBackgrounds).length === 0) {
      toast({
        title: "Error",
        description: "Please select background images first",
        variant: "destructive",
      });
      return;
    }

    setIsTagging(true);
    setProgress(0);

    try {
      const newResults: Record<string, TaggingResult> = {};
      const modelCombinations = Object.entries(selectedBackgrounds);
      
      let completedCount = 0;
      const totalCount = modelCombinations.length;

      for (const [modelKey, imageUrl] of modelCombinations) {
        try {
          // Update progress
          setProgress(Math.round((completedCount / totalCount) * 100));
          
          // Get body size and skin color from the model key
          const [bodySize, skinColor] = modelKey.split('-') as ["thin" | "average" | "plussize", "fair" | "dark"];
          
          // Ensure the image URL is accessible
          let processedImageUrl = imageUrl;
          
          // If the image URL is a relative URL or from CDN, we need to ensure it's publicly accessible
          if (imageUrl.startsWith('/api/proxy') || imageUrl.includes('cdn.fashn.ai') || !imageUrl.startsWith('http')) {
            // For this example, we can use the existing image, but in production,
            // you might need to ensure it's accessible by the tagging API
            
            // Update progress to indicate processing
            setProgress(Math.round(((completedCount + 0.3) / totalCount) * 100));
          }

          // Prepare form data for the tagging API
          const formData = new FormData();
          formData.append('imageUrl', processedImageUrl);
          formData.append('model', taggingModel);

          // Call the image tagging API
          const response = await fetch('/api/tag-image', {
            method: 'POST',
            body: formData,
          });

          // Update progress to indicate API response received
          setProgress(Math.round(((completedCount + 0.7) / totalCount) * 100));

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to tag image");
          }

          const data = await response.json();
          
          if (data.success) {
            // Store the result with the model key
            newResults[modelKey] = {
              imageUrl: processedImageUrl,
              bodySize: bodySize,
              skinColor: skinColor,
              tags: {},
              analysis: data.analysis,
              visualization: data.visualization,
              success: true
            };
          } else {
            throw new Error(data.error || "Unknown error during tagging");
          }

          // Update completed count and progress
          completedCount++;
          setProgress(Math.round((completedCount / totalCount) * 100));
        } catch (error) {
          console.error(`Error tagging image for model ${modelKey}:`, error);
          
          // Add a failed result so we can show the error in the UI
          newResults[modelKey] = {
            imageUrl: imageUrl,
            bodySize: modelKey.split('-')[0] as "thin" | "average" | "plussize",
            skinColor: modelKey.split('-')[1] as "fair" | "dark",
            tags: {},
            error: error instanceof Error ? error.message : "Unknown error",
            success: false
          };
          
          toast({
            title: "Warning",
            description: `Failed to tag image for model ${modelKey}. ${error instanceof Error ? error.message : ""}`,
            variant: "destructive",
          });
          
          // Still increment the counter to keep progress moving
          completedCount++;
        }
      }

      if (Object.keys(newResults).length > 0) {
        setTaggingResults(newResults);
        // Move to review step
        setCurrentStep(8);
      } else {
        toast({
          title: "Error",
          description: "No images were tagged successfully. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in image tagging:", error);
      toast({
        title: "Error",
        description: `Failed to tag images: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsTagging(false);
      setProgress(0);
    }
  };

  // Helper function to render retail attributes
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
    );
  };
  
  // Helper function to save a tagged image to the gallery
  const saveTaggedImageToGallery = async (modelKey: string, result: TaggingResult) => {
    // Check if already saved
    if (savedTaggedImages.has(modelKey)) {
      toast({
        title: "Already saved",
        description: "This tagged image is already in your gallery.",
        variant: "default",
      });
      return;
    }

    try {
      setIsSavingToGallery(true);
      
      // Create a unique ID for this save operation
      const batchId = crypto.randomUUID();
      
      // Create the gallery item
      const galleryItem = {
        id: batchId,
        title: result.analysis?.retail_attributes.product_type || "Tagged Product",
        date: new Date().toISOString(),
        provider: "image-tagging",
        thumbnailUrl: result.visualization || result.imageUrl,
        images: [result.visualization || result.imageUrl],
        type: "image-tagging" as const,
        metadata: {
          analysis: result.analysis
        }
      };
      
      // Save directly to localStorage
      const existingItems = localStorage.getItem("galleryItems");
      let items = [];
      
      if (existingItems) {
        try {
          items = JSON.parse(existingItems);
        } catch (e) {
          console.error("Error parsing existing gallery items:", e);
          items = [];
        }
      }
      
      // Add new item
      items.push(galleryItem);
      
      // Save back to localStorage
      localStorage.setItem("galleryItems", JSON.stringify(items));
      
      // Dispatch custom event to update gallery in real-time
      const event = new CustomEvent("galleryUpdate", {
        detail: { item: galleryItem },
      });
      window.dispatchEvent(event);
      
      // Mark this image as saved
      setSavedTaggedImages((prev) => {
        const updated = new Set(prev);
        updated.add(modelKey);
        return updated;
      });
      
      toast({
        title: "Success!",
        description: "Tagged image saved to your gallery.",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save to gallery",
      });
    } finally {
      setIsSavingToGallery(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">All In One Autonomous System</h1>
        </div>
      </div>

      <Separator />

      {/* Stepper */}
      <Stepper currentStep={currentStep} className="my-8">
        {steps.map((step, index) => (
          <Step 
            key={index}
            title={step.title}
            description={step.description}
            completed={index < currentStep}
            current={index === currentStep}
          />
        ))}
      </Stepper>

      {/* Main content area */}
      <Card className="p-6">
        <CardContent className="p-0">
          {isProcessing && currentStep !== 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h3 className="text-xl font-medium">Processing...</h3>
              <Progress value={progress} className="w-full max-w-md" />
            </div>
          ) : (
            renderCurrentStep()
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isProcessing}
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1 || isProcessing}
        >
          Next
        </Button>
      </div>

      {/* Add these dialogs */}
      {renderBackgroundDetailDialog()}
      {renderBackgroundTemplatesDialog()}
    </div>
  );
} 