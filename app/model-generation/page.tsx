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
  Loader2,
  Download,
  Share2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  User,
  Eye,
  Info,
  BookmarkPlus,
  AlertTriangle,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { GalleryImageSelector } from "@/components/gallery-image-selector";

// Define form schema
const formSchema = z.object({
  prompt: z.string().optional(),
  gender: z.enum(["female", "male"]).default("female"),
  bodySize: z.enum(["thin", "average", "plus-size"]).default("average"),
  skin_color: z
    .enum(["light", "medium", "dark", "not-specified"])
    .default("not-specified"),
  age: z
    .enum(["18-25", "25-35", "35-45", "45-60", "60+", "not-specified"])
    .default("not-specified"),
  modelType: z.enum(["Full Body", "Top"]).default("Full Body"),
  wearType: z
    .enum([
      "not-defined",
      "casual",
      "formal",
      "business",
      "long-dress",
      "short-dress",
      "t-shirt-jeans",
      "t-shirt",
      "blouse",
      "suit",
      "swimsuit",
      "sportswear",
      "streetwear",
    ])
    .default("not-defined"),
  poseType: z
    .enum(["neutral", "confident", "dynamic", "artistic"])
    .default("neutral"),
  eyes: z
    .enum(["blue", "green", "brown", "hazel", "black", "not-specified"])
    .default("not-specified"),
  numImages: z.number().int().min(1).max(8).default(4),
  contrast: z.number().min(1).max(4.5).default(3.5),
  alchemy: z.boolean().default(true),
  ultra: z.boolean().default(false),
  styleUUID: z.string().default("556c1ee5-ec38-42e8-955a-1e82dad0ffa1"),
  enhancePrompt: z.boolean().default(false),
});

// Form validation function
const validateForm = (
  data: z.infer<typeof formSchema>,
  referenceImage: File | null
) => {
  // If there's a reference image, prompt is optional
  if (referenceImage) {
    return true;
  }

  // If there's no reference image, prompt is required
  if (!data.prompt || data.prompt.trim().length < 3) {
    return false;
  }

  return true;
};

export default function ModelGenerationPage() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<
    Array<{ url: string; id: string; nsfw: boolean }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savingImageId, setSavingImageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const { toast } = useToast();
  const [savedImageIds, setSavedImageIds] = useState<Set<string>>(new Set());
  const [savedToGalleryId, setSavedToGalleryId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(
    null
  );
  const [referenceAnalysisResult, setReferenceAnalysisResult] =
    useState<any>(null);
  const [analyzingReference, setAnalyzingReference] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      gender: "female",
      bodySize: "average",
      skin_color: "not-specified",
      age: "not-specified",
      modelType: "Full Body",
      wearType: "not-defined",
      poseType: "neutral",
      numImages: 4,
      contrast: 3.5,
      alchemy: true,
      ultra: false,
      enhancePrompt: false,
      styleUUID: "556c1ee5-ec38-42e8-955a-1e82dad0ffa1", // None style by default
    },
  });

  // Style presets data
  const stylePresets = [
    { name: "None", uuid: "556c1ee5-ec38-42e8-955a-1e82dad0ffa1" },
    { name: "3D Render", uuid: "debdf72a-91a4-467b-bf61-cc02bdeb69c6" },
    { name: "Bokeh", uuid: "9fdc5e8c-4d13-49b4-9ce6-5a74cbb19177" },
    { name: "Cinematic", uuid: "a5632c7c-ddbb-4e2f-ba34-8456ab3ac436" },
    { name: "Creative", uuid: "6fedbf1f-4a17-45ec-84fb-92fe524a29ef" },
    { name: "Dynamic", uuid: "111dc692-d470-4eec-b791-3475abac4c46" },
    { name: "Fashion", uuid: "594c4a08-a522-4e0e-b7ff-e4dac4b6b622" },
    { name: "HDR", uuid: "97c20e5c-1af6-4d42-b227-54d03d8f0727" },
    { name: "Portrait", uuid: "8e2bc543-6ee2-45f9-bcd9-594b6ce84dcd" },
    {
      name: "Pro Color Photography",
      uuid: "7c3f932b-a572-47cb-9b9b-f20211e63b5b",
    },
    { name: "Portrait Fashion", uuid: "0d34f8e1-46d4-428f-8ddd-4b11811fa7c9" },
    { name: "Vibrant", uuid: "dee282d3-891f-4f73-ba02-7f8131e5541b" },
  ];

  // Handle reference image upload
  const handleReferenceImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setReferenceImageUrl(URL.createObjectURL(file));
      setReferenceAnalysisResult(null);
    } else {
      setReferenceImage(null);
      setReferenceImageUrl(null);
      setReferenceAnalysisResult(null);
    }
  };

  const handleGalleryImageSelect = async (imageUrl: string) => {
    try {
      setAnalyzingReference(true);

      // Set the reference image URL directly from the gallery
      setReferenceImageUrl(imageUrl);

      // Convert the image URL to a File object for API submission
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "reference-from-gallery.jpg", {
        type: blob.type,
      });
      setReferenceImage(file);

      // Analyze the reference image if needed
      if (file) {
        await analyzeReferenceImage(file);
      }
    } catch (error) {
      console.error("Error selecting image from gallery:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load image from gallery",
      });
    } finally {
      setAnalyzingReference(false);
    }
  };

  // Clear reference image
  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageUrl(null);
    setReferenceAnalysisResult(null);
  };

  // Function to poll for generation status with retry limit
  const checkGenerationStatus = async (
    generationId: string,
    retryCount = 0
  ) => {
    if (!generationId) return;

    // Maximum number of retries (5 minutes at 5 second intervals)
    const MAX_RETRIES = 60;

    // If we've exceeded the maximum retries, offer to stop waiting
    if (retryCount >= MAX_RETRIES) {
      toast({
        title: "Generation Taking Longer Than Expected",
        description:
          "The images are still being generated. You can continue waiting or check the gallery later.",
        variant: "default",
        action: (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkGenerationStatus(generationId, 0)}
            >
              Keep Waiting
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setProcessing(false)}
            >
              Stop
            </Button>
          </div>
        ),
        duration: 10000,
      });
      return;
    }

    try {
      console.log(
        `Checking status for generation: ${generationId} (attempt ${
          retryCount + 1
        }/${MAX_RETRIES})`
      );

      // Update progress percentage based on retry count to show movement
      const progressPercentage = Math.min(
        95,
        50 + Math.floor((retryCount / MAX_RETRIES) * 45)
      );
      setProgress(progressPercentage);

      // Call the API to check the status
      const response = await fetch(
        `/api/model-generation/status/${generationId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Status check failed (${response.status}):`, errorText);
        throw new Error(`Status check failed with status ${response.status}`);
      }

      // Parse the JSON response safely
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse status response:", parseError);
        throw new Error("Failed to parse status response");
      }

      console.log(`Status response for ${generationId}:`, data);

      if (data.status === "finished" && data.images && data.images.length > 0) {
        // If generation is complete, update the UI
        setResultImages(data.images);
        setProgress(100);
        setProcessing(false);
        toast({
          title: "Success!",
          description: `${data.images.length} model images generated successfully.`,
        });
      } else if (data.status === "processing" || data.status === "pending") {
        // If still processing, update status message and wait
        if (retryCount % 5 === 0) {
          // Show message every 5 retries to avoid spam
          toast({
            title: "Still Processing",
            description: `Your images are being generated (${Math.round(
              (retryCount / MAX_RETRIES) * 100
            )}% waited). Please wait...`,
            duration: 3000,
          });
        }

        // Wait and check again
        setTimeout(
          () => checkGenerationStatus(generationId, retryCount + 1),
          5000
        );
      } else if (data.status === "failed" || data.status === "error") {
        // If failed, show error
        setError(data.error || "Generation failed");
        setProgress(0);
        setProcessing(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Generation failed",
        });
      } else {
        // Unknown status, wait and check again
        console.log(
          `Unknown status: ${data.status}, checking again in 5 seconds`
        );
        setTimeout(
          () => checkGenerationStatus(generationId, retryCount + 1),
          5000
        );
      }
    } catch (err) {
      console.error("Error checking generation status:", err);

      // On error, we might want to retry a few times before giving up
      if (retryCount < 3) {
        setTimeout(
          () => checkGenerationStatus(generationId, retryCount + 1),
          5000
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to check generation status"
        );
        setProcessing(false);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            err instanceof Error
              ? err.message
              : "Failed to check generation status",
        });
      }
    }
  };

  // Submit based on whether reference image is provided
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if reference image is provided
    if (referenceImage) {
      return submitWithReference(values);
    }

    // Start the progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 1000);

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultImages([]);

    try {
      // Prepare request data as JSON
      const requestData = {
        prompt: values.prompt || "",
        attributes: {
          gender: values.gender,
          bodySize: values.bodySize,
          skin_color:
            values.skin_color === "not-specified"
              ? undefined
              : values.skin_color,
          age: values.age === "not-specified" ? undefined : values.age,
          modelType: values.modelType || "Full Body",
          poseType: values.poseType || "neutral",
          wearType: values.wearType || "not-defined",
        },
        numImages: values.numImages || 4,
        width: 1024,
        height: 1024,
        alchemy: values.alchemy !== undefined ? values.alchemy : true,
        ultra: values.ultra !== undefined ? values.ultra : false,
        styleUUID: values.styleUUID || "556c1ee5-ec38-42e8-955a-1e82dad0ffa1",
        contrast: values.contrast || 3.5,
        enhancePrompt:
          values.enhancePrompt !== undefined ? values.enhancePrompt : false,
      };

      // Submit the request to the API
      const response = await fetch("/api/model-generation/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error generating model images");
      }

      clearInterval(progressInterval);

      if (data.status === "finished" && data.images && data.images.length > 0) {
        setResultImages(data.images);
        setProgress(100);
      } else if (data.status === "processing") {
        startStatusPolling(data.generationId);
      } else {
        throw new Error(
          data.error || "Error or timeout while generating images"
        );
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error in model generation:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Analyze reference image and convert to base64
  const analyzeAndGetBase64 = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const base64Data = event.target?.result?.toString().split(",")[1];
          if (!base64Data) {
            reject(new Error("Failed to read image data"));
            return;
          }
          resolve(base64Data);
        } catch (error) {
          console.error("Error in FileReader onload:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error("Failed to read image file"));
      };

      reader.readAsDataURL(file);
    });
  };

  // Submit with reference image
  const submitWithReference = async (values: z.infer<typeof formSchema>) => {
    if (!referenceImage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a reference image",
      });
      return;
    }

    try {
      // Reset state
      setProcessing(true);
      setProgress(10); // Start at 10% to show immediate feedback
      setError(null);
      setResultImages([]);
      setAnalyzingReference(true);

      // Show toast for analysis
      toast({
        title: "Analyzing Reference Image",
        description:
          "We're analyzing your reference image to extract features...",
        duration: 3000,
      });

      // Start the progress simulation more gradually
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          // More realistic progress simulation
          if (prev < 30) return prev + 2; // Fast at first
          if (prev < 50) return prev + 1; // Then slow down
          if (prev >= 50) {
            // Then very slow once we're waiting for the API
            clearInterval(progressInterval);
            return 50;
          }
          return prev;
        });
      }, 500);

      // Create form data
      const formData = new FormData();
      // Use empty string if prompt is undefined/null
      formData.append("prompt", values.prompt || "");
      formData.append("reference_image", referenceImage);
      formData.append("numImages", values.numImages?.toString() || "4");
      formData.append("gender", values.gender || "female");
      formData.append("bodySize", values.bodySize || "average");
      formData.append("modelType", values.modelType || "Full Body");
      formData.append("poseType", values.poseType || "neutral");
      formData.append("wearType", values.wearType || "not-defined");
      // Handle optional values carefully
      if (values.skin_color && values.skin_color !== "not-specified") {
        formData.append("skin_color", values.skin_color);
      }
      if (values.age && values.age !== "not-specified") {
        formData.append("age", values.age);
      }
      formData.append(
        "alchemy",
        (values.alchemy !== undefined ? values.alchemy : true).toString()
      );
      formData.append(
        "ultra",
        (values.ultra !== undefined ? values.ultra : false).toString()
      );
      formData.append(
        "styleUUID",
        values.styleUUID || "556c1ee5-ec38-42e8-955a-1e82dad0ffa1"
      );
      formData.append("contrast", values.contrast?.toString() || "3.5");
      formData.append(
        "enhancePrompt",
        (values.enhancePrompt !== undefined
          ? values.enhancePrompt
          : false
        ).toString()
      );

      console.log(
        "Submitting with reference image, form data contains these keys:"
      );
      for (const key of formData.keys()) {
        console.log(`- ${key}`);
      }

      // Submit the request to the API
      const response = await fetch(
        "/api/model-generation/generate-with-reference",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Error generating model images"
        );
      }

      // Analysis is complete
      setAnalyzingReference(false);

      // Update toast after successful analysis
      toast({
        title: "Analysis Complete",
        description: "Features extracted! Now generating model images...",
        duration: 3000,
      });

      // Update progress to show we're moving to the next phase
      setProgress(50);
      clearInterval(progressInterval);

      if (data.status === "finished" && data.images && data.images.length > 0) {
        setResultImages(data.images);
        setProgress(100);
        setProcessing(false);
        toast({
          title: "Success!",
          description: `${data.images.length} model images generated successfully using your reference image.`,
        });
      } else if (data.status === "processing" || data.generationId) {
        // Get the generationId for status checking
        const genId = data.generationId;
        if (!genId) {
          throw new Error("No generation ID returned from the API");
        }

        setGenerationId(genId);
        toast({
          title: "Processing Started",
          description:
            "Your model images are now being generated. This may take a few minutes...",
          duration: 5000,
        });

        // Start checking status
        setTimeout(() => checkGenerationStatus(genId, 0), 5000);
      } else {
        throw new Error(data.error || "Unexpected response from the server");
      }
    } catch (err) {
      console.error("Error in submitWithReference:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate model images"
      );
      setProgress(0);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to generate model images",
      });
    } finally {
      setAnalyzingReference(false);
    }
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      setDownloading(true);

      // Show started toast
      toast({
        title: "Download Starting",
        description: `Preparing image ${index} for download...`,
        variant: "default",
      });

      // Fetch the image from the external URL
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
      link.download = `model-image-${index}.jpg`;

      // Append to body, click programmatically, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);

      // Show success toast
      toast({
        title: "Download Complete",
        description: `Image ${index} has been downloaded.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const saveImageToGallery = async (image: { url: string; id: string }) => {
    if (!image.url) return;

    // Check if this image has already been saved
    if (savedImageIds.has(image.id)) {
      toast({
        title: "Already saved",
        description: "This image is already in your gallery.",
        variant: "default",
      });
      return;
    }

    try {
      setSavingImageId(image.id);

      // Create a short display title but store full prompt in metadata
      const displayTitle =
        form.getValues("prompt").substring(0, 30) +
        (form.getValues("prompt").length > 30 ? "..." : "");
      const fullPrompt = form.getValues("prompt");

      // Create the gallery item
      const galleryItem = {
        id: crypto.randomUUID(),
        title: displayTitle,
        fullPrompt: fullPrompt, // Store the full prompt as additional metadata
        date: new Date().toISOString(),
        provider: "leonardo",
        thumbnailUrl: image.url,
        images: [image.url],
        type: "model-generation" as const,
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

      // Track this image as saved
      setSavedImageIds((prev) => {
        const updated = new Set(prev);
        updated.add(image.id);
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
        description:
          err instanceof Error ? err.message : "Failed to save to gallery",
      });
    } finally {
      setSavingImageId(null);
    }
  };

  const viewFullImage = (image: { url: string; id: string }) => {
    setSelectedImage(image);
  };

  const saveToGallery = async () => {
    if (!resultImages.length) return;

    // Check if these images have already been saved as a collection
    if (savedToGalleryId) {
      toast({
        title: "Already saved",
        description: "These images are already saved to your gallery.",
        variant: "default",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Create a unique ID for this save operation
      const batchId = crypto.randomUUID();

      // Create a short display title but store full prompt in metadata
      const displayTitle =
        form.getValues("prompt").substring(0, 30) +
        (form.getValues("prompt").length > 30 ? "..." : "");
      const fullPrompt = form.getValues("prompt");

      // Ensure we have all the image URLs properly collected
      const imageUrls = resultImages.map((img) => img.url);

      // Create the gallery item
      const galleryItem = {
        id: batchId,
        title: displayTitle,
        fullPrompt: fullPrompt, // Store the full prompt as additional metadata
        date: new Date().toISOString(),
        provider: "leonardo",
        thumbnailUrl: resultImages[0].url,
        images: imageUrls, // This stores ALL image URLs
        type: "model-generation" as const,
      };

      console.log(
        "Saving gallery item with images:",
        imageUrls.length,
        galleryItem
      );

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

      // Mark as saved and track individual image IDs too
      setSavedToGalleryId(batchId);
      setSavedImageIds((prev) => {
        const updated = new Set(prev);
        resultImages.forEach((img) => updated.add(img.id));
        return updated;
      });

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
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    // Keep form values but reset state for new generation
    setResultImages([]);
    setProgress(0);
    setError(null);
    setProcessing(false);

    // Reset saved state
    setSavedToGalleryId(null);

    // Automatically submit the form with the same values
    form.handleSubmit(handleSubmit)();
  };

  return (
    <div className="flex-1 px-4 py-4">
      <div className="flex items-center mb-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-2">Model Generation</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] gap-8 h-full">
        <div className="md:h-[calc(100vh-10rem)]">
          <div className="border rounded-lg p-4 bg-card flex flex-col h-full">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col h-full"
              >
                <div className="flex-1 px-3 overflow-y-auto">
                  <div className="space-y-6 pb-6">
                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Prompt{" "}
                            {!referenceImage && (
                              <span className="text-red-500">*</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the model you want to generate..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {referenceImage
                              ? "Optional when using a reference image. Add specific details if needed."
                              : "Required. Describe appearance, clothing, pose, etc."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Model Attributes Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Model Attributes</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        These settings will be applied if not specified in your
                        prompt {referenceImage ? "or reference image" : ""}.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="male">Male</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bodySize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Size</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select body size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="thin">Thin</SelectItem>
                                  <SelectItem value="average">
                                    Average
                                  </SelectItem>
                                  <SelectItem value="plus-size">
                                    Plus Size
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="modelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select model type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Full Body">
                                    Full Body
                                  </SelectItem>
                                  <SelectItem value="Top">Top</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="wearType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Wear Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select wear type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="not-defined">
                                    Not Defined
                                  </SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                  <SelectItem value="formal">Formal</SelectItem>
                                  <SelectItem value="business">
                                    Business
                                  </SelectItem>
                                  <SelectItem value="long-dress">
                                    Long Dress
                                  </SelectItem>
                                  <SelectItem value="short-dress">
                                    Short Dress
                                  </SelectItem>
                                  <SelectItem value="t-shirt-jeans">
                                    T-Shirt and Jeans
                                  </SelectItem>
                                  <SelectItem value="t-shirt">
                                    T-Shirt
                                  </SelectItem>
                                  <SelectItem value="blouse">Blouse</SelectItem>
                                  <SelectItem value="suit">Suit</SelectItem>
                                  <SelectItem value="swimsuit">
                                    Swimsuit
                                  </SelectItem>
                                  <SelectItem value="sportswear">
                                    Sportswear
                                  </SelectItem>
                                  <SelectItem value="streetwear">
                                    Streetwear
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="poseType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pose Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select pose type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="neutral">
                                    Neutral
                                  </SelectItem>
                                  <SelectItem value="confident">
                                    Confident
                                  </SelectItem>
                                  <SelectItem value="dynamic">
                                    Dynamic
                                  </SelectItem>
                                  <SelectItem value="artistic">
                                    Artistic
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="skin_color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skin Color (Optional)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select skin color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="not-specified">
                                    Not Specified
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age Range (Optional)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select age range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="18-25">18-25</SelectItem>
                                  <SelectItem value="25-35">25-35</SelectItem>
                                  <SelectItem value="35-45">35-45</SelectItem>
                                  <SelectItem value="45-60">45-60</SelectItem>
                                  <SelectItem value="60+">60+</SelectItem>
                                  <SelectItem value="not-specified">
                                    Not specified
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="eyes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Eye Color (Optional)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select eye color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="blue">Blue</SelectItem>
                                  <SelectItem value="green">Green</SelectItem>
                                  <SelectItem value="brown">Brown</SelectItem>
                                  <SelectItem value="hazel">Hazel</SelectItem>
                                  <SelectItem value="black">Black</SelectItem>
                                  <SelectItem value="not-specified">
                                    Not specified
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Reference Image Section */}
                    <div className="space-y-4 border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-md font-medium">
                          Reference Image (Optional)
                        </h3>
                        {referenceImage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearReferenceImage}
                          >
                            <X className="h-4 w-4 mr-1" /> Clear
                          </Button>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Upload a reference image to generate a similar-looking
                        model. The features will be automatically analyzed and
                        used for generation.
                      </p>

                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Input
                            id="reference-image"
                            type="file"
                            accept="image/*"
                            onChange={handleReferenceImageChange}
                            className="flex-1"
                            disabled={analyzingReference || processing}
                          />
                          <GalleryImageSelector
                            onSelectImage={handleGalleryImageSelect}
                            buttonText="From Gallery"
                            allowedTypes={["model-generation"]}
                            buttonVariant="outline"
                            buttonClassName="whitespace-nowrap"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select from your computer or choose a model from your
                          gallery
                        </p>
                      </div>

                      {referenceImageUrl && (
                        <div className="mt-2">
                          <div className="relative aspect-square w-full overflow-hidden rounded-md border bg-muted">
                            <Image
                              src={referenceImageUrl}
                              alt="Reference Image"
                              layout="fill"
                              objectFit="contain"
                              className="object-contain"
                            />
                            {analyzingReference && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white">
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                  <p>Analyzing image...</p>
                                </div>
                              </div>
                            )}
                          </div>
                          {referenceAnalysisResult && (
                            <div className="mt-2 rounded-md bg-muted p-2 text-xs">
                              <div className="flex items-center text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                <span>Features analyzed</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Advanced Settings Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Advanced Settings</h3>

                      <FormField
                        control={form.control}
                        name="styleUUID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Style Preset</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stylePresets.map((style) => (
                                  <SelectItem
                                    key={style.uuid}
                                    value={style.uuid}
                                  >
                                    {style.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Different styles affect the look and feel of the
                              generated images
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numImages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Number of Images: {field.value}
                            </FormLabel>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                min={1}
                                max={8}
                                step={1}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Generate between 1 and 8 images
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contrast"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contrast: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                min={1}
                                max={4.5}
                                step={0.5}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Higher contrast can create more dramatic images
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="alchemy"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Quality Mode</FormLabel>
                                <FormDescription>
                                  Use higher quality generation (takes longer)
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked && form.getValues("ultra")) {
                                      form.setValue("ultra", false);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ultra"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Ultra Mode</FormLabel>
                                <FormDescription>
                                  Use ultra high quality (takes longest,
                                  disables Quality Mode). Only supported with
                                  Phoenix models.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked && form.getValues("alchemy")) {
                                      form.setValue("alchemy", false);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enhancePrompt"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Enhance Prompt</FormLabel>
                                <FormDescription>
                                  Use AI to enhance your prompt for better
                                  results
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>Generate Models</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>

        <div className="flex-1 h-[calc(100vh-10rem)] overflow-y-auto space-y-4">
          <Card className="min-h-full">
            <CardContent className="pt-6">
              {processing && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      {analyzingReference
                        ? "Analyzing Reference Image..."
                        : "Generating Model Images..."}
                    </h3>
                  </div>
                  <Progress value={progress} className="h-2 w-full" />
                  {progress > 50 && progress < 100 && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>
                        This may take a few minutes. Creating your model
                        images...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 mt-4 bg-destructive/10 text-destructive rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Error Generating Images</p>
                      <p className="text-sm mt-1">{error}</p>
                      {error.includes("check generation status") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            generationId &&
                            checkGenerationStatus(generationId, 0)
                          }
                          className="mt-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!processing && !error && resultImages.length === 0 && (
                <div className="py-8 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">
                    No Images Generated Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    Fill out the form on the left to generate realistic model
                    images based on your specifications.
                  </p>
                </div>
              )}

              {!processing && resultImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      Generated Model Images
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = "/gallery")}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        View Gallery
                      </Button>
                      <Button
                        variant={savedToGalleryId ? "outline" : "secondary"}
                        size="sm"
                        onClick={saveToGallery}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : savedToGalleryId ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Saved to Gallery
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-4 w-4 mr-2" />
                            Save All to Gallery
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetForm}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        New Generation
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {resultImages.map((image, index) => (
                      <div key={image.id || index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                          <Image
                            src={image.url}
                            alt={`Generated model ${index + 1}`}
                            className="h-full w-full object-cover transition-all group-hover:scale-105"
                            width={512}
                            height={512}
                          />
                        </div>

                        {/* Image action buttons */}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    downloadImage(image.url, index + 1)
                                  }
                                  disabled={downloading}
                                >
                                  {downloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[80vw] flex flex-col items-center">
                                    <DialogHeader>
                                      <DialogTitle>Model Preview</DialogTitle>
                                      <DialogDescription>
                                        View the full-size generated image
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="relative max-h-[80vh] overflow-auto mt-4">
                                      <Image
                                        src={image.url}
                                        alt={`Generated model ${index + 1}`}
                                        className="object-contain"
                                        width={1024}
                                        height={1024}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Larger</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Image Details</DialogTitle>
                                      <DialogDescription>
                                        Information about this generated image
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div>
                                        <h4 className="font-medium mb-1">
                                          Prompt
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {form.getValues("prompt")}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <h4 className="font-medium mb-1">
                                            Model
                                          </h4>
                                          <p className="text-sm text-muted-foreground">
                                            Flux Precision
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-1">
                                            Resolution
                                          </h4>
                                          <p className="text-sm text-muted-foreground">
                                            {form.getValues("width")} x{" "}
                                            {form.getValues("height")}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-1">
                                            Contrast
                                          </h4>
                                          <p className="text-sm text-muted-foreground">
                                            {form.getValues("contrast")}
                                          </p>
                                        </div>
                                        <div>
                                          <h4 className="font-medium mb-1">
                                            Generated On
                                          </h4>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date().toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={
                                    savedImageIds.has(image.id)
                                      ? "outline"
                                      : "secondary"
                                  }
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => saveImageToGallery(image)}
                                  disabled={savingImageId === image.id}
                                >
                                  {savingImageId === image.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : savedImageIds.has(image.id) ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <BookmarkPlus className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {savedImageIds.has(image.id)
                                    ? "Saved to Gallery"
                                    : "Save to Gallery"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
