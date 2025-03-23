"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Loader2,
  Download,
  Share2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ZoomIn,
  SlidersHorizontal,
  Save,
} from "lucide-react";
import { executeVirtualTryOn, upscaleImage } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { ExampleImages } from "@/components/example-images";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { GalleryImageSelector } from "@/components/gallery-image-selector";
import { ImageCropPreviewDialog } from "@/components/image-crop-preview-dialog";

// Interface definition for API parameters
interface ApiParametersType {
  category: string;
  mode: string;
  garmentPhotoType: string;
  numSamples: number;
  restoreBackground: boolean;
  coverFeet: boolean;
  adjustHands: boolean;
  restoreClothes: boolean;
  nsfw_filter: boolean;
  longTop: boolean;
  seed: number;
}

export default function TryOnPage() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [apiProvider, setApiProvider] = useState<string>("fashn");
  const [imageResolution, setImageResolution] = useState<string>("Unknown");
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [loadedUpscaled, setLoadedUpscaled] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [upscaleScale, setUpscaleScale] = useState<number>(2);
  const [upscaleEnhanceQuality, setUpscaleEnhanceQuality] =
    useState<boolean>(true);
  const [upscalePreserveDetails, setUpscalePreserveDetails] =
    useState<boolean>(true);
  const [upscaleRemoveNoise, setUpscaleRemoveNoise] = useState<boolean>(false);
  const [showUpscaleOptions, setShowUpscaleOptions] = useState(false);
  const [apiParameters, setApiParameters] = useState<ApiParametersType>({
    category: "one-pieces",
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
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [showModelCropDialog, setShowModelCropDialog] = useState(false);
  const [showGarmentCropDialog, setShowGarmentCropDialog] = useState(false);
  const [tempModelImage, setTempModelImage] = useState<string | null>(null);
  const [tempGarmentImage, setTempGarmentImage] = useState<string | null>(null);
  const [isPreprocessingModel, setIsPreprocessingModel] = useState(false);
  const [isPreprocessingGarment, setIsPreprocessingGarment] = useState(false);
  const { toast } = useToast();

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setModelFile(file);

      // Read file as base64 for preview and API
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && event.target.result) {
          // Use readAsDataURL instead to get proper base64 format with MIME type
          const base64String = event.target.result as string;
          setTempModelImage(base64String);
          setShowModelCropDialog(true);
        }
      };
      reader.readAsDataURL(file); // This automatically creates the data:image/xxx;base64, prefix
    }
  };

  const handleGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGarmentFile(file);

      // Read file as base64 for preview and API
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && event.target.result) {
          // Use readAsDataURL instead to get proper base64 format with MIME type
          const base64String = event.target.result as string;
          setTempGarmentImage(base64String);
          setShowGarmentCropDialog(true);
        }
      };
      reader.readAsDataURL(file); // This automatically creates the data:image/xxx;base64, prefix
    }
  };

  const handleModelExampleSelect = async (url: string) => {
    try {
      setTempModelImage(url);
      setShowModelCropDialog(true);

      // For examples, we don't have a file object, just a URL
      // We'll set the modelFile to null but keep the URL for display and API call
      setModelFile(null);

      toast({
        title: "Example Selected",
        description: "Model example image selected successfully",
      });
    } catch (error) {
      console.error("Error selecting example model:", error);
      toast({
        title: "Error",
        description: "Failed to select example model image",
        variant: "destructive",
      });
    }
  };

  const handleGarmentExampleSelect = async (url: string) => {
    try {
      setTempGarmentImage(url);
      setShowGarmentCropDialog(true);

      // For examples, we don't have a file object, just a URL
      // We'll set the garmentFile to null but keep the URL for display and API call
      setGarmentFile(null);

      toast({
        title: "Example Selected",
        description: "Garment example image selected successfully",
      });
    } catch (error) {
      console.error("Error selecting example garment:", error);
      toast({
        title: "Error",
        description: "Failed to select example garment image",
        variant: "destructive",
      });
    }
  };

  const handleModelGallerySelect = async (imageUrl: string) => {
    try {
      // Set the temp model image URL for preview
      setTempModelImage(imageUrl);
      setShowModelCropDialog(true);

      // Instead of downloading and creating a File object, just set the URL
      // The backend API should handle URLs properly
      setModelFile(null); // Clear any previous file

      toast({
        title: "Model selected",
        description: "Model image has been selected from gallery.",
      });
    } catch (error) {
      console.error("Error selecting model from gallery:", error);
      toast({
        title: "Error",
        description: "Failed to load model image from gallery",
        variant: "destructive",
      });
    }
  };

  const handleGarmentGallerySelect = async (imageUrl: string) => {
    try {
      setTempGarmentImage(imageUrl);
      setShowGarmentCropDialog(true);

      // Instead of downloading and creating a File object, just set the URL
      // The backend API should handle URLs properly
      setGarmentFile(null); // Clear any previous file

      toast({
        title: "Garment selected",
        description: "Garment image has been selected from gallery.",
      });
    } catch (error) {
      console.error("Error selecting garment from gallery:", error);
      toast({
        title: "Error",
        description: "Failed to load garment image from gallery",
        variant: "destructive",
      });
    }
  };

  const preprocessAndUploadModel = async () => {
    if (!tempModelImage) return;

    try {
      setIsPreprocessingModel(true);

      // Call the preprocess-and-upload API
      const response = await fetch(
        "/api/virtual-try-on/preprocess-and-upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64_image: tempModelImage,
            image_type: "model",
            filename: modelFile ? modelFile.name : `model-${Date.now()}.jpg`,
            maintain_portrait_ratio: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to preprocess model image");
      }

      const data = await response.json();
      // Check if the returned fileUrl is a valid remote URL
      if (data.fileUrl && data.fileUrl.startsWith("http")) {
        setModelImage(data.fileUrl);
      } else {
        // Fallback to using the original tempModelImage
        setModelImage(tempModelImage);
        toast({
          title: "Processed URL Invalid",
          description:
            "Processed model image URL is invalid; using original image. This may affect try-on quality.",
          variant: "destructive",
        });
      }
      setModelFile(null); // clear file to avoid local path usage
      setShowModelCropDialog(false);

      toast({
        title: "Image Optimized",
        description: "Model image has been optimized for try-on.",
      });
    } catch (error) {
      console.error("Error preprocessing model image:", error);

      // If the image is already a remote URL, use it directly
      if (
        tempModelImage.startsWith("http") &&
        !tempModelImage.startsWith("data:")
      ) {
        setModelImage(tempModelImage);
        setShowModelCropDialog(false);

        toast({
          title: "Using Original URL",
          description:
            "Using original remote URL. This may affect try-on quality.",
          variant: "destructive",
        });
      } else {
        // For local files or base64, we need to ensure we're not using local paths
        // Convert to base64 if it's not already
        if (!tempModelImage.startsWith("data:")) {
          toast({
            title: "Error",
            description:
              "Cannot process this image format. Please try another image.",
            variant: "destructive",
          });
          // Don't set the model image to avoid using local paths
          setModelImage(null);
        } else {
          // It's already base64, we can use it
          setModelImage(tempModelImage);
          toast({
            title: "Using Base64 Image",
            description:
              "Using original image as base64. This may affect try-on quality.",
            variant: "destructive",
          });
        }
        setShowModelCropDialog(false);
      }
    } finally {
      setIsPreprocessingModel(false);
    }
  };

  const preprocessAndUploadGarment = async () => {
    if (!tempGarmentImage) return;

    try {
      setIsPreprocessingGarment(true);

      // Call the preprocess-and-upload API
      const response = await fetch(
        "/api/virtual-try-on/preprocess-and-upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64_image: tempGarmentImage,
            image_type: "garment",
            filename: garmentFile
              ? garmentFile.name
              : `garment-${Date.now()}.jpg`,
            maintain_portrait_ratio: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to preprocess garment image"
        );
      }

      const data = await response.json();
      // Check if the returned fileUrl is a valid remote URL
      if (data.fileUrl && data.fileUrl.startsWith("http")) {
        setGarmentImage(data.fileUrl);
      } else {
        // Fallback to using the original tempGarmentImage
        setGarmentImage(tempGarmentImage);
        toast({
          title: "Processed URL Invalid",
          description:
            "Processed garment image URL is invalid; using original image. This may affect try-on quality.",
          variant: "destructive",
        });
      }
      setGarmentFile(null); // clear file to avoid local path usage
      setShowGarmentCropDialog(false);

      toast({
        title: "Image Optimized",
        description: "Garment image has been optimized for try-on.",
      });
    } catch (error) {
      console.error("Error preprocessing garment image:", error);

      // If the image is already a remote URL, use it directly
      if (
        tempGarmentImage.startsWith("http") &&
        !tempGarmentImage.startsWith("data:")
      ) {
        setGarmentImage(tempGarmentImage);
        setShowGarmentCropDialog(false);

        toast({
          title: "Using Original URL",
          description:
            "Using original remote URL. This may affect try-on quality.",
          variant: "destructive",
        });
      } else {
        // For local files or base64, we need to ensure we're not using local paths
        // Convert to base64 if it's not already
        if (!tempGarmentImage.startsWith("data:")) {
          toast({
            title: "Error",
            description:
              "Cannot process this image format. Please try another image.",
            variant: "destructive",
          });
          // Don't set the garment image to avoid using local paths
          setGarmentImage(null);
        } else {
          // It's already base64, we can use it
          setGarmentImage(tempGarmentImage);
          toast({
            title: "Using Base64 Image",
            description:
              "Using original image as base64. This may affect try-on quality.",
            variant: "destructive",
          });
        }
        setShowGarmentCropDialog(false);
      }
    } finally {
      setIsPreprocessingGarment(false);
    }
  };

  const resetAll = () => {
    setModelImage(null);
    setGarmentImage(null);
    setResultImage(null);
    setResultImages([]);
    setProcessing(false);
    setProgress(0);
    setActiveTab("upload");
    setModelFile(null);
    setGarmentFile(null);
    setError(null);
    setUpscaledImage(null);
    setShowBeforeAfter(false);
    setShowUpscaleOptions(false);
    setIsUpscaling(false);
    setTempModelImage(null);
    setTempGarmentImage(null);
    setShowModelCropDialog(false);
    setShowGarmentCropDialog(false);
    setIsPreprocessingModel(false);
    setIsPreprocessingGarment(false);
  };

  const processImages = async () => {
    // Validate inputs
    if (!modelImage && !modelFile) {
      toast({
        title: "Missing model image",
        description: "Please upload or select a model image.",
        variant: "destructive",
      });
      return;
    }

    if (!garmentImage && !garmentFile) {
      toast({
        title: "Missing garment image",
        description: "Please upload or select a garment image.",
        variant: "destructive",
      });
      return;
    }

    setActiveTab("processing");
    setProcessing(true);
    setProgress(10);
    setError(null);

    try {
      const startTime = Date.now();

      // Create form data to send to the backend
      const formData = new FormData();

      // If we have a base64 image, use it directly
      if (modelImage && modelImage.startsWith("data:")) {
        formData.append("modelImageBase64", modelImage);
      } else if (modelFile) {
        formData.append("modelImage", modelFile);
      } else if (modelImage) {
        // Gallery URL case - validate URL is accessible
        formData.append("modelImageUrl", modelImage);
      }

      if (garmentImage && garmentImage.startsWith("data:")) {
        formData.append("garmentImageBase64", garmentImage);
      } else if (garmentFile) {
        formData.append("clothingImage", garmentFile);
      } else if (garmentImage) {
        // Gallery URL case - validate URL is accessible
        formData.append("clothingImageUrl", garmentImage);
      }

      // Add API parameters
      formData.append("clothingType", apiParameters.category);
      formData.append("apiProvider", apiProvider);
      formData.append("mode", apiParameters.mode);
      formData.append("garmentPhotoType", apiParameters.garmentPhotoType);
      formData.append("numSamples", apiParameters.numSamples.toString());
      formData.append(
        "restoreBackground",
        apiParameters.restoreBackground.toString()
      );
      formData.append("coverFeet", apiParameters.coverFeet.toString());
      formData.append("adjustHands", apiParameters.adjustHands.toString());
      formData.append(
        "restoreClothes",
        apiParameters.restoreClothes.toString()
      );
      formData.append("nsfw_filter", apiParameters.nsfw_filter.toString());
      formData.append("longTop", apiParameters.longTop.toString());
      formData.append("seed", apiParameters.seed.toString());

      // Start the polling simulation for progress
      const progressInterval = setInterval(() => {
        setProgress((prev: number) => {
          // Don't go past 90% until we have a result
          return prev < 90 ? prev + 5 : prev;
        });
      }, 1000);

      // Call the backend API
      const result = await executeVirtualTryOn(formData);

      clearInterval(progressInterval);
      setProgress(100);

      // Calculate processing time
      const endTime = Date.now();
      setProcessingTime(Math.round((endTime - startTime) / 1000));

      // Set the API provider from the response
      if (result.provider) {
        setApiProvider(result.provider);
      }

      // Check if we have results
      if (
        result.taskStatus === "finished" ||
        result.taskStatus === "completed"
      ) {
        let imageUrls: string[] = [];
        // Extract image URLs based on provider format
        if (result.images && result.images.length > 0) {
          imageUrls = result.images
            .map((img: any) => {
              if (typeof img === "object" && img !== null) {
                if (
                  "url" in img &&
                  typeof img.url === "string" &&
                  img.url !== ""
                ) {
                  return img.url;
                }
                if (
                  "outputImageUrl" in img &&
                  typeof img.outputImageUrl === "string" &&
                  img.outputImageUrl !== ""
                ) {
                  return img.outputImageUrl;
                }
              }
              return typeof img === "string" ? img : "";
            })
            .filter((url: string) => url !== "");
        }
        // Check if we have output array directly in the response (Fashn.ai format)
        else if (result.output && Array.isArray(result.output)) {
          imageUrls = result.output;
        }
        // Check if output is an object with output_urls (another Fashn.ai format)
        else if (
          result.output &&
          typeof result.output === "object" &&
          "output_urls" in result.output
        ) {
          imageUrls = result.output.output_urls;
        }
        // Check the traditional results format
        else if (result.results && result.results.length > 0) {
          const firstResult = result.results[0];

          if (result.provider === "fashn") {
            // Fashn.ai provides direct image URLs in outputImageUrls
            if (
              firstResult.outputImageUrls &&
              firstResult.outputImageUrls.length > 0
            ) {
              imageUrls = firstResult.outputImageUrls;
            }
          } else {
            // Aidge API has a nested structure with imageList
            if (
              firstResult.taskStatus === "finished" &&
              firstResult.taskResult &&
              firstResult.taskResult.result &&
              firstResult.taskResult.result.imageList
            ) {
              const imageList = firstResult.taskResult.result.imageList;
              imageUrls = imageList.map(
                (img: { imageUrl: string; width?: number; height?: number }) =>
                  img.imageUrl
              );

              // Set resolution if available
              if (imageList[0] && imageList[0].width && imageList[0].height) {
                setImageResolution(
                  `${imageList[0].width}×${imageList[0].height}`
                );
              }
            } else if (
              firstResult.outputImageUrls &&
              firstResult.outputImageUrls.length > 0
            ) {
              // Alternative structure we've defined in our service
              imageUrls = firstResult.outputImageUrls;
            }
          }

          // Fallback: if imageUrls is still empty and firstResult contains a singular 'outputImageUrl', use it
          if (
            imageUrls.length === 0 &&
            firstResult.outputImageUrl &&
            typeof firstResult.outputImageUrl === "string"
          ) {
            imageUrls = [firstResult.outputImageUrl];
          }
        }

        if (imageUrls.length > 0) {
          // Normalize image URLs in case they are objects
          const normalizeImageUrl = (img: any) => {
            if (typeof img === "string") return img;
            if (img && typeof img === "object") {
              if ("url" in img && typeof img.url === "string") return img.url;
              if (
                "outputImageUrl" in img &&
                typeof img.outputImageUrl === "string"
              )
                return img.outputImageUrl;
            }
            return "";
          };
          const normalizedImageUrls = imageUrls
            .map(normalizeImageUrl)
            .filter((url: string) => url !== "");
          setResultImages(normalizedImageUrls);
          setResultImage(normalizedImageUrls[0]); // Set the first image as the main result
          setActiveTab("result");

          // Try to extract resolution from first image URL
          try {
            const img = new window.Image();
            img.onload = () => {
              setImageResolution(`${img.width}×${img.height}`);
            };
            img.src = normalizedImageUrls[0];
          } catch (err) {
            setImageResolution("Unknown");
          }
        } else {
          throw new Error("No try-on images found in the response");
        }
      } else if (result.error) {
        throw new Error(`Try-on failed: ${result.error}`);
      } else {
        throw new Error("Try-on task did not complete successfully");
      }
    } catch (err) {
      console.error("Error processing images:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      toast({
        title: "Processing Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Download image function to handle cross-origin images
  const downloadImage = async (url: string) => {
    if (!url) return;

    try {
      // Track which image is being downloaded
      setDownloadingImage(url);

      // Create a filename for the download
      const filename = `virtual-tryon-${new Date().getTime()}.jpg`;

      // Show starting toast
      toast({
        title: "Download Starting",
        description: "Preparing image for download...",
      });

      // Fetch the image from the URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      // Get the image as a blob
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;

      // Append to body, click programmatically, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);

      // Show success toast
      toast({
        title: "Download Complete",
        description: `Image has been downloaded as ${filename}`,
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleUpscaleImage = async () => {
    if (!resultImage) return;

    try {
      setIsUpscaling(true);
      setError(null);

      // Show toast notification
      toast({
        title: "Upscaling Image",
        description: "This may take a few moments...",
      });

      // Call the upscale API
      const upscaledUrl = await upscaleImage(resultImage, {
        scale: upscaleScale,
        enhanceQuality: upscaleEnhanceQuality,
        preserveDetails: upscalePreserveDetails,
        removeNoise: upscaleRemoveNoise,
      });

      setUpscaledImage(upscaledUrl);
      setShowBeforeAfter(true);

      toast({
        title: "Upscaling Complete",
        description: "Image has been successfully upscaled!",
      });
    } catch (error) {
      console.error("Error upscaling image:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upscale image"
      );
      toast({
        title: "Upscaling Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during upscaling",
        variant: "destructive",
      });
    } finally {
      setIsUpscaling(false);
    }
  };

  const toggleUpscaleOptions = () => {
    setShowUpscaleOptions(!showUpscaleOptions);
  };

  const saveToGallery = async () => {
    if (!resultImage && resultImages.length === 0) return;

    try {
      setIsSavingToGallery(true);

      // Create a unique ID for this save operation
      const batchId = crypto.randomUUID();

      // Determine which images to save - either resultImage or resultImages array
      const imageUrls =
        resultImages.length > 0
          ? resultImages
          : resultImage
          ? [resultImage]
          : [];

      if (imageUrls.length === 0) {
        throw new Error("No images to save");
      }

      // Create the gallery item
      const galleryItem = {
        id: batchId,
        title: "Virtual Try-On",
        date: new Date().toISOString(),
        provider: apiProvider,
        thumbnailUrl: imageUrls[0],
        images: imageUrls,
        modelImageUrl: modelImage || undefined,
        garmentImageUrl: garmentImage || undefined,
        type: "try-on" as const,
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

      setSavedToGallery(true);

      toast({
        title: "Success!",
        description: `${imageUrls.length} images saved to your gallery.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save to gallery",
      });
    } finally {
      setIsSavingToGallery(false);
    }
  };

  return (
    <div className="flex-1 px-4 py-4">
      <div className="flex items-center mb-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Virtual Try-On</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] gap-8">
        {/* Sidebar with settings */}
        <div className="md:h-[calc(100vh-10rem)]">
          <div className="border rounded-lg p-4 bg-card flex flex-col h-full">
            <div className="flex-1 px-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={resetAll}
                    className="flex-1 h-8 text-sm"
                  >
                    Clear All
                  </Button>
                  <Button variant="outline" className="flex-1 h-8">
                    <Link href="/docs" className="text-sm w-full">
                      API Docs
                    </Link>
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Example Models</Label>
                  <div className="border rounded-lg p-1.5 bg-muted/50">
                    <ExampleImages
                      type="model"
                      onSelect={handleModelExampleSelect}
                      displayMode="row"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Example Garments</Label>
                  <div className="border rounded-lg p-1.5 bg-muted/50">
                    <ExampleImages
                      type="garment"
                      onSelect={handleGarmentExampleSelect}
                      displayMode="row"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label className="text-sm">Garment Category</Label>
                  <Select
                    value={apiParameters.category}
                    onValueChange={(value) =>
                      setApiParameters({ ...apiParameters, category: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tops">Tops</SelectItem>
                      <SelectItem value="bottoms">Bottoms</SelectItem>
                      <SelectItem value="one-pieces">
                        Dresses & One-Pieces
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Quality Mode</Label>
                  <Select
                    value={apiParameters.mode}
                    onValueChange={(value) =>
                      setApiParameters({ ...apiParameters, mode: value })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Fast</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="quality">
                        High Quality (Slower)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Garment Photo Type</Label>
                  <Select
                    value={apiParameters.garmentPhotoType}
                    onValueChange={(value) =>
                      setApiParameters({
                        ...apiParameters,
                        garmentPhotoType: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="model">On Model</SelectItem>
                      <SelectItem value="flat-lay">Flat-lay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Number of images</Label>
                    <span className="text-sm text-muted-foreground">
                      {apiParameters.numSamples}
                    </span>
                  </div>
                  <Slider
                    value={[apiParameters.numSamples]}
                    min={1}
                    max={4}
                    step={1}
                    onValueChange={(value) =>
                      setApiParameters({
                        ...apiParameters,
                        numSamples: value[0],
                      })
                    }
                    className="py-2"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Seed</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={apiParameters.seed}
                      onChange={(e) =>
                        setApiParameters({
                          ...apiParameters,
                          seed: parseInt(e.target.value),
                        })
                      }
                      className="h-8"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setApiParameters({
                          ...apiParameters,
                          seed: Math.floor(Math.random() * 10000000),
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground flex-shrink-0"
                      aria-label="Generate new random seed"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm">Enhancement Options</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="restore-bg"
                        className="text-xs cursor-pointer"
                      >
                        Restore Background
                      </Label>
                      <Switch
                        id="restore-bg"
                        checked={apiParameters.restoreBackground}
                        onCheckedChange={(checked) =>
                          setApiParameters({
                            ...apiParameters,
                            restoreBackground: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="cover-feet"
                        className="text-xs cursor-pointer"
                      >
                        Cover Feet
                      </Label>
                      <Switch
                        id="cover-feet"
                        checked={apiParameters.coverFeet}
                        onCheckedChange={(checked) =>
                          setApiParameters({
                            ...apiParameters,
                            coverFeet: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="adjust-hands"
                        className="text-xs cursor-pointer"
                      >
                        Adjust Hands
                      </Label>
                      <Switch
                        id="adjust-hands"
                        checked={apiParameters.adjustHands}
                        onCheckedChange={(checked) =>
                          setApiParameters({
                            ...apiParameters,
                            adjustHands: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="restore-clothes"
                        className="text-xs cursor-pointer"
                      >
                        Restore Other Clothes
                      </Label>
                      <Switch
                        id="restore-clothes"
                        checked={apiParameters.restoreClothes}
                        onCheckedChange={(checked) =>
                          setApiParameters({
                            ...apiParameters,
                            restoreClothes: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="nsfw-filter"
                        className="text-xs cursor-pointer"
                      >
                        NSFW Filter
                      </Label>
                      <Switch
                        id="nsfw-filter"
                        checked={apiParameters.nsfw_filter}
                        onCheckedChange={(checked) =>
                          setApiParameters({
                            ...apiParameters,
                            nsfw_filter: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t">
              <Button
                className="w-full"
                onClick={processImages}
                disabled={
                  (!modelImage && !modelFile) ||
                  (!garmentImage && !garmentFile) ||
                  processing
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Generate Try-On"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main workspace area */}
        <div className="flex-1 h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="min-h-full">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full h-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upload" disabled={processing}>
                  Upload
                </TabsTrigger>
                <TabsTrigger
                  value="processing"
                  disabled={!processing && activeTab !== "processing"}
                >
                  Processing
                </TabsTrigger>
                <TabsTrigger
                  value="result"
                  disabled={!resultImage && activeTab !== "result"}
                >
                  Result
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative aspect-[3/4] border-2 border-dashed rounded-lg overflow-hidden">
                    {modelImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={modelImage}
                          alt="Model"
                          fill
                          className="object-contain"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setModelImage(null);
                            setModelFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
                          <span className="text-xs font-medium">
                            Model Image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted/30">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                          Upload or select a model image to try clothes on
                        </p>
                        <div className="flex flex-col space-y-2 w-full max-w-[200px]">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              document.getElementById("model-upload")?.click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Model
                          </Button>
                          <GalleryImageSelector
                            onSelectImage={handleModelGallerySelect}
                            buttonText="From Gallery"
                            allowedTypes={["model-generation", "try-on"]}
                            buttonVariant="outline"
                            buttonClassName="w-full"
                          />
                          <input
                            id="model-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleModelUpload}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative aspect-[3/4] border-2 border-dashed rounded-lg overflow-hidden">
                    {garmentImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={garmentImage}
                          alt="Garment"
                          fill
                          className="object-contain"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setGarmentImage(null);
                            setGarmentFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
                          <span className="text-xs font-medium">
                            Garment Image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted/30">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                          Upload or select a garment image to try on
                        </p>
                        <div className="flex flex-col space-y-2 w-full max-w-[200px]">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              document.getElementById("garment-upload")?.click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Garment
                          </Button>
                          <GalleryImageSelector
                            onSelectImage={handleGarmentGallerySelect}
                            buttonText="From Gallery"
                            allowedTypes={["all"]}
                            buttonVariant="outline"
                            buttonClassName="w-full"
                          />
                          <input
                            id="garment-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleGarmentUpload}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-4 border border-destructive/50 bg-destructive/10 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-destructive">
                        Error
                      </h3>
                      <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="processing" className="mt-0 h-full">
                <Card>
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <h2 className="text-2xl font-semibold text-center">
                        Processing Your Images
                      </h2>
                      <p className="text-center text-muted-foreground">
                        Creating your virtual try-on. This usually takes 60-120
                        seconds.
                      </p>

                      <div className="w-full space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-right text-muted-foreground">
                          {progress}%
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2
                            className={`h-5 w-5 ${
                              progress >= 30
                                ? "text-primary"
                                : "text-muted-foreground/40"
                            }`}
                          />
                          <span
                            className={
                              progress >= 30 ? "" : "text-muted-foreground/60"
                            }
                          >
                            Analyzing images
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2
                            className={`h-5 w-5 ${
                              progress >= 50
                                ? "text-primary"
                                : "text-muted-foreground/40"
                            }`}
                          />
                          <span
                            className={
                              progress >= 50 ? "" : "text-muted-foreground/60"
                            }
                          >
                            Extracting garment
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2
                            className={`h-5 w-5 ${
                              progress >= 70
                                ? "text-primary"
                                : "text-muted-foreground/40"
                            }`}
                          />
                          <span
                            className={
                              progress >= 70 ? "" : "text-muted-foreground/60"
                            }
                          >
                            Fitting garment
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2
                            className={`h-5 w-5 ${
                              progress >= 90
                                ? "text-primary"
                                : "text-muted-foreground/40"
                            }`}
                          />
                          <span
                            className={
                              progress >= 90 ? "" : "text-muted-foreground/60"
                            }
                          >
                            Finalizing result
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="result" className="mt-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6 h-full">
                  {/* Main result display */}
                  <div className="flex flex-col space-y-4 h-full">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border flex-1">
                      {upscaledImage && !showBeforeAfter ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={upscaledImage}
                            alt="Upscaled Image"
                            fill
                            className={`object-contain transition-opacity duration-300 ${
                              loadedUpscaled ? "opacity-100" : "opacity-0"
                            }`}
                            onLoad={() => setLoadedUpscaled(true)}
                            onError={(e) => {
                              console.error(
                                "Error loading upscaled image:",
                                upscaledImage
                              );
                              const img = e.target as HTMLImageElement;
                              img.src = upscaledImage;
                            }}
                          />
                          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                            Upscaled
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-4 right-4"
                            onClick={() => setShowBeforeAfter(true)}
                          >
                            View Original
                          </Button>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          {resultImage ? (
                            <Image
                              src={resultImage}
                              alt="Virtual Try-On Result"
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-muted-foreground">
                                No result image available
                              </p>
                            </div>
                          )}
                          {upscaledImage && (
                            <>
                              <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                                Original
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute top-4 right-4"
                                onClick={() => setShowBeforeAfter(false)}
                              >
                                View Upscaled
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() =>
                          (upscaledImage || resultImage) &&
                          downloadImage(upscaledImage || resultImage || "")
                        }
                        disabled={
                          (!upscaledImage && !resultImage) ||
                          downloadingImage === (upscaledImage || resultImage)
                        }
                      >
                        {downloadingImage === (upscaledImage || resultImage) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloadingImage === (upscaledImage || resultImage)
                          ? "Downloading..."
                          : "Download"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={saveToGallery}
                        disabled={
                          !resultImage || isSavingToGallery || savedToGallery
                        }
                      >
                        {isSavingToGallery ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : savedToGallery ? (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {savedToGallery
                          ? "Saved to Gallery"
                          : "Save to Gallery"}
                      </Button>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        onClick={toggleUpscaleOptions}
                        disabled={!resultImage || isUpscaling}
                      >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Upscale Settings
                      </Button>
                      <Button variant="outline" onClick={resetAll}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Another
                      </Button>
                    </div>
                  </div>

                  {/* Sidebar with original images and other results */}
                  <div className="space-y-6 h-full">
                    {/* Upscale controls */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">Upscale Image</h3>
                          {showUpscaleOptions ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={toggleUpscaleOptions}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={toggleUpscaleOptions}
                              disabled={!resultImage || isUpscaling}
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {!showUpscaleOptions ? (
                          <Button
                            onClick={toggleUpscaleOptions}
                            className="w-full mt-2"
                            disabled={!resultImage || isUpscaling}
                          >
                            {isUpscaling ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upscaling...
                              </>
                            ) : (
                              <>
                                <ZoomIn className="mr-2 h-4 w-4" />
                                Configure Upscaling
                              </>
                            )}
                          </Button>
                        ) : (
                          <>
                            <Separator className="my-2" />

                            <div className="space-y-3 mt-3">
                              <div>
                                <Label className="text-xs">Scale Factor</Label>
                                <Select
                                  value={String(upscaleScale)}
                                  onValueChange={(value) =>
                                    setUpscaleScale(Number(value))
                                  }
                                >
                                  <SelectTrigger className="h-8 mt-1">
                                    <SelectValue placeholder="Scale factor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="2">2x</SelectItem>
                                    <SelectItem value="3">3x</SelectItem>
                                    <SelectItem value="4">4x</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor="enhance-quality"
                                  className="text-xs cursor-pointer"
                                >
                                  Enhance Quality
                                </Label>
                                <Switch
                                  id="enhance-quality"
                                  checked={upscaleEnhanceQuality}
                                  onCheckedChange={setUpscaleEnhanceQuality}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor="preserve-details"
                                  className="text-xs cursor-pointer"
                                >
                                  Preserve Details
                                </Label>
                                <Switch
                                  id="preserve-details"
                                  checked={upscalePreserveDetails}
                                  onCheckedChange={setUpscalePreserveDetails}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor="remove-noise"
                                  className="text-xs cursor-pointer"
                                >
                                  Remove Noise
                                </Label>
                                <Switch
                                  id="remove-noise"
                                  checked={upscaleRemoveNoise}
                                  onCheckedChange={setUpscaleRemoveNoise}
                                />
                              </div>

                              <Button
                                onClick={handleUpscaleImage}
                                className="w-full mt-2"
                                disabled={isUpscaling || !resultImage}
                              >
                                {isUpscaling ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Upscaling...
                                  </>
                                ) : (
                                  <>
                                    <ZoomIn className="mr-2 h-4 w-4" />
                                    Upscale Image
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {upscaledImage && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-sm font-medium mb-3">
                            Upscaled Result
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Original
                              </span>
                              <span>{imageResolution}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Upscaled
                              </span>
                              <span>{upscaleScale}x</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() =>
                                setShowBeforeAfter(!showBeforeAfter)
                              }
                            >
                              {showBeforeAfter
                                ? "View Upscaled"
                                : "View Original"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">
                          Original Images
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {modelImage && (
                            <div className="relative aspect-square rounded-md overflow-hidden border">
                              <Image
                                src={modelImage}
                                alt="Original Model"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          {garmentImage && (
                            <div className="relative aspect-square rounded-md overflow-hidden border">
                              <Image
                                src={garmentImage}
                                alt="Original Garment"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-2">Details</h3>
                        <Separator className="my-2" />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Processing Time
                            </span>
                            <span>{processingTime} seconds</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Resolution
                            </span>
                            <span>{imageResolution}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Created
                            </span>
                            <span>{new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {resultImages.length > 1 && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="text-sm font-medium mb-3">
                            All Generated Images
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {resultImages.map((img: string, index) => (
                              <div
                                key={index}
                                className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity ${
                                  img === resultImage
                                    ? "ring-2 ring-primary"
                                    : ""
                                }`}
                                onClick={() => {
                                  setResultImage(img);
                                }}
                              >
                                {img ? (
                                  <Image
                                    src={img}
                                    alt={`Result ${index + 1}`}
                                    fill
                                    className="object-contain"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-xs text-muted-foreground">
                                      Image {index + 1} unavailable
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add the crop preview dialogs */}
      <ImageCropPreviewDialog
        isOpen={showModelCropDialog}
        onClose={() => setShowModelCropDialog(false)}
        imageUrl={tempModelImage}
        imageType="model"
        onConfirm={preprocessAndUploadModel}
        isProcessing={isPreprocessingModel}
      />

      <ImageCropPreviewDialog
        isOpen={showGarmentCropDialog}
        onClose={() => setShowGarmentCropDialog(false)}
        imageUrl={tempGarmentImage}
        imageType="garment"
        onConfirm={preprocessAndUploadGarment}
        isProcessing={isPreprocessingGarment}
      />
    </div>
  );
}
