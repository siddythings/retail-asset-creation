"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Download,
  Save,
  CheckCircle2,
  Eraser,
  Wand2,
  PenLine,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { ExampleImages } from "@/components/example-images";
import { GalleryImageSelector } from "@/components/gallery-image-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// Utility function to fetch an image and convert it to a local blob URL
const fetchImageAsBlob = async (url: string): Promise<string> => {
  try {
    console.log(`Fetching image from URL: ${url}`);
    // Use proxy API endpoint to bypass CORS
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();
    const localUrl = URL.createObjectURL(blob);
    console.log(`Created local blob URL: ${localUrl}`);
    return localUrl;
  } catch (error) {
    console.error("Error fetching image:", error);
    // Fall back to original URL if fetch fails
    return url;
  }
};

export default function EditImagePage() {
  const [image, setImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTool, setCurrentTool] = useState<"eraser" | "gen-fill">(
    "eraser"
  );
  const [brushSize, setBrushSize] = useState(20);
  const [fillPrompt, setFillPrompt] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [canvasContext, setCanvasContext] =
    useState<CanvasRenderingContext2D | null>(null);
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [savedImageIds, setSavedImageIds] = useState<Set<string>>(new Set());
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [contentModeration, setContentModeration] = useState(true);
  const [scaledCursorSize, setScaledCursorSize] = useState(brushSize);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleExampleImageSelect = async (url: string) => {
    console.log("Selected example image URL:", url);
    if (!url) {
      console.error("Example image URL is empty");
      toast({
        title: "Invalid image",
        description: "Selected example image URL is invalid.",
        variant: "destructive",
      });
      return;
    }

    setIsImageUploading(true);

    try {
      // Validate URL format
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        throw new Error("URL is not a valid HTTP/HTTPS URL: " + url);
      }

      // Fetch and create a local blob URL to avoid CORS issues
      const localUrl = await fetchImageAsBlob(url);

      setImage(localUrl);
      setOriginalImage(localUrl);
      setEditedImage(null); // Clear any previous edited image

      prepareCanvas(localUrl);

      toast({
        title: "Image selected",
        description: "Your image has been loaded successfully.",
      });
    } catch (error) {
      console.error("Error selecting example image:", error);
      toast({
        title: "Image loading failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load the selected image.",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleGalleryImageSelect = async (imageUrl: string) => {
    console.log("Selected gallery image URL:", imageUrl);
    try {
      if (!imageUrl) {
        throw new Error("Gallery image URL is empty");
      }

      // Validate URL format
      if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
        throw new Error(
          "Gallery image URL is not a valid HTTP/HTTPS URL: " + imageUrl
        );
      }

      setIsImageUploading(true);

      // Fetch and create a local blob URL to avoid CORS issues
      const localUrl = await fetchImageAsBlob(imageUrl);

      setImage(localUrl);
      setOriginalImage(localUrl);
      setEditedImage(null); // Clear any previous edited image

      // For canvas preparation
      prepareCanvas(localUrl);

      toast({
        title: "Image selected",
        description: "Your image has been loaded successfully.",
      });
    } catch (error) {
      console.error("Gallery selection error:", error);
      toast({
        title: "Selection failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error selecting the image from gallery.",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log(
        "Uploading image file:",
        file.name,
        "Size:",
        (file.size / 1024).toFixed(2),
        "KB",
        "Type:",
        file.type
      );

      // Validate file type
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!validImageTypes.includes(file.type)) {
        console.error("Invalid image file type:", file.type);
        toast({
          title: "Invalid file type",
          description:
            "Please upload a valid image file (JPEG, PNG, WEBP, GIF).",
          variant: "destructive",
        });
        return;
      }

      // Check file size (limit to 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        console.error(
          "File too large:",
          (file.size / (1024 * 1024)).toFixed(2),
          "MB"
        );
        toast({
          title: "File too large",
          description:
            "The image file is too large. Please upload an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setIsImageUploading(true);
      setEditedImage(null); // Clear any previous edited image

      // Show preview immediately using FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const imageDataUrl = event.target.result as string;
          console.log("File loaded as data URL successfully");
          setImage(imageDataUrl);
          setOriginalImage(imageDataUrl);
          prepareCanvas(imageDataUrl);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({
          title: "File reading error",
          description:
            "There was an error reading the image file. Please try again or use another image.",
          variant: "destructive",
        });
        setIsImageUploading(false);
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error reading file as data URL:", error);
        toast({
          title: "File error",
          description: "Failed to process the image file. Please try again.",
          variant: "destructive",
        });
        setIsImageUploading(false);
        return;
      }

      // Upload to server
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("image_type", "edit");

        console.log("Uploading image to server...");
        const response = await fetch("/api/image/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Server upload failed:", response.status, errorData);
          throw new Error(
            errorData.error ||
              `Server responded with status: ${response.status}`
          );
        }

        const data = await response.json();
        console.log(
          "Image uploaded to server successfully, received URL:",
          data.fileUrl
        );

        // We already set the image above from FileReader, so no need to update it
        toast({
          title: "Image uploaded successfully",
          description: "Your image has been uploaded and processed.",
        });
      } catch (error) {
        console.error("Upload error:", error);
        // Still continue with the local image since we have it from FileReader
        toast({
          title: "Server upload notice",
          description:
            "Using local image preview as server upload encountered an issue.",
          variant: "default",
        });
      } finally {
        setIsImageUploading(false);
      }
    } else {
      console.warn("No file selected for upload");
    }
  };

  const prepareCanvas = (imageUrl: string) => {
    console.log(`Preparing canvas for image URL: ${imageUrl}`);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx &&
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext("2d");
      maskCtx &&
        maskCtx.clearRect(
          0,
          0,
          maskCanvasRef.current.width,
          maskCanvasRef.current.height
        );
    }

    // Add timeout to detect long-loading images
    const timeout = setTimeout(() => {
      if (!img.complete) {
        console.warn("Image loading is taking longer than expected:", imageUrl);
      }
    }, 5000); // 5 seconds timeout

    img.onload = () => {
      clearTimeout(timeout);
      console.log(
        `Image loaded successfully: width=${img.width}, height=${img.height}`
      );

      if (!canvasRef.current) {
        console.error("Canvas reference is not available");
        return;
      }

      if (!maskCanvasRef.current) {
        console.error("Mask canvas reference is not available");
        return;
      }

      // Set canvas dimensions to match image
      console.log(`Setting canvas dimensions to: ${img.width}x${img.height}`);
      canvasRef.current.width = img.width;
      canvasRef.current.height = img.height;
      maskCanvasRef.current.width = img.width;
      maskCanvasRef.current.height = img.height;

      // Initialize canvas contexts
      const ctx = canvasRef.current.getContext("2d");
      const maskCtx = maskCanvasRef.current.getContext("2d");

      if (!ctx) {
        console.error("Failed to get 2D context from main canvas");
        return;
      }

      if (!maskCtx) {
        console.error("Failed to get 2D context from mask canvas");
        return;
      }

      // Draw image on main canvas
      console.log("Drawing image on main canvas");
      try {
        ctx.drawImage(img, 0, 0);
        setCanvasContext(ctx);
      } catch (error) {
        console.error("Error drawing image on canvas:", error);
        toast({
          title: "Canvas error",
          description:
            "Failed to draw the image on canvas. Please try another image.",
          variant: "destructive",
        });
        return;
      }

      // Clear mask canvas (black background)
      console.log("Initializing mask canvas");
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(
        0,
        0,
        maskCanvasRef.current.width,
        maskCanvasRef.current.height
      );

      // Store mask image
      setMaskImage(maskCanvasRef.current.toDataURL());

      // Set cursor size to match brush size exactly
      setTimeout(() => {
        setScaledCursorSize(Math.max(5, Math.round(brushSize)));
      }, 100);

      console.log("Canvas preparation completed successfully");
    };

    // Handle image loading errors
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error("Error loading image:", imageUrl, error);
      toast({
        title: "Image loading failed",
        description:
          "There was an error loading the selected image. Please try another image or check the image URL format.",
        variant: "destructive",
      });
      setIsImageUploading(false);
    };

    // Set image source after setting up event handlers
    console.log("Setting image source:", imageUrl);
    try {
      img.src = imageUrl;
    } catch (error) {
      clearTimeout(timeout);
      console.error("Error setting image source:", error);
      toast({
        title: "Image loading error",
        description:
          "Failed to load the image. Please check if the URL is valid.",
        variant: "destructive",
      });
    }
  };

  const startPainting = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (!canvasRef.current || !maskCanvasRef.current) return;

    // Save current state for undo
    const maskCanvas = maskCanvasRef.current;
    const maskDataURL = maskCanvas.toDataURL();
    setUndoStack([...undoStack, maskDataURL]);
    setRedoStack([]);

    setIsPainting(true);
    const rect = maskCanvas.getBoundingClientRect();

    // Calculate scale factor between actual canvas dimensions and displayed dimensions
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const scaleFactor = Math.max(scaleX, scaleY);

    // Calculate the scaled coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setLastPos({ x, y });

    // Draw a single dot if only clicked, using scaled brush size
    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      maskCtx.fillStyle = "white";
      maskCtx.beginPath();
      // Use scaled brush size
      const scaledBrushSize = brushSize * scaleFactor;
      maskCtx.arc(x, y, scaledBrushSize / 2, 0, Math.PI * 2);
      maskCtx.fill();

      // Update mask image
      setMaskImage(maskCanvas.toDataURL());
    }
  };

  const paint = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isPainting || !lastPos || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const rect = maskCanvas.getBoundingClientRect();

    // Calculate scale factor between actual canvas dimensions and displayed dimensions
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const scaleFactor = Math.max(scaleX, scaleY);

    // Calculate the scaled coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const maskCtx = maskCanvas.getContext("2d");
    if (maskCtx) {
      // Use scaled brush size
      const scaledBrushSize = brushSize * scaleFactor;
      maskCtx.lineWidth = scaledBrushSize;
      maskCtx.lineCap = "round";
      maskCtx.strokeStyle = "white";

      maskCtx.beginPath();
      maskCtx.moveTo(lastPos.x, lastPos.y);
      maskCtx.lineTo(x, y);
      maskCtx.stroke();

      setLastPos({ x, y });

      // Update mask image
      setMaskImage(maskCanvas.toDataURL());
    }
  };

  const endPainting = () => {
    setIsPainting(false);
    setLastPos(null);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    if (maskCanvasRef.current) {
      // Save current state to redo stack
      const currentMaskDataURL = maskCanvasRef.current.toDataURL();
      setRedoStack([...redoStack, currentMaskDataURL]);

      // Pop the last state from undo stack
      const undoStackCopy = [...undoStack];
      const lastState = undoStackCopy.pop();
      setUndoStack(undoStackCopy);

      if (lastState) {
        // Apply the previous state
        const img = new window.Image();
        img.onload = () => {
          if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext("2d");
            if (maskCtx) {
              maskCtx.clearRect(
                0,
                0,
                maskCanvasRef.current.width,
                maskCanvasRef.current.height
              );
              maskCtx.drawImage(img, 0, 0);
              setMaskImage(lastState);
            }
          }
        };
        img.src = lastState;
      }
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    if (maskCanvasRef.current) {
      // Save current state to undo stack
      const currentMaskDataURL = maskCanvasRef.current.toDataURL();
      setUndoStack([...undoStack, currentMaskDataURL]);

      // Pop the last state from redo stack
      const redoStackCopy = [...redoStack];
      const nextState = redoStackCopy.pop();
      setRedoStack(redoStackCopy);

      if (nextState) {
        // Apply the next state
        const img = new window.Image();
        img.onload = () => {
          if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext("2d");
            if (maskCtx) {
              maskCtx.clearRect(
                0,
                0,
                maskCanvasRef.current.width,
                maskCanvasRef.current.height
              );
              maskCtx.drawImage(img, 0, 0);
              setMaskImage(nextState);
            }
          }
        };
        img.src = nextState;
      }
    }
  };

  const clearMask = () => {
    if (maskCanvasRef.current) {
      // Save current state for undo
      const currentMaskDataURL = maskCanvasRef.current.toDataURL();
      setUndoStack([...undoStack, currentMaskDataURL]);
      setRedoStack([]);

      const maskCtx = maskCanvasRef.current.getContext("2d");
      if (maskCtx) {
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(
          0,
          0,
          maskCanvasRef.current.width,
          maskCanvasRef.current.height
        );
        setMaskImage(null);
      }
    }
  };

  const handleClearAll = () => {
    setImage(originalImage);
    setEditedImage(null);
    clearMask();
    if (originalImage) {
      prepareCanvas(originalImage);
    }
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleProcess = async () => {
    if (!image || !maskImage) {
      toast({
        title: "Missing data",
        description:
          currentTool === "eraser"
            ? "Please upload an image and draw an area to erase."
            : "Please upload an image, draw an area, and enter a fill prompt.",
        variant: "destructive",
      });
      return;
    }

    if (currentTool === "gen-fill" && !fillPrompt.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please enter a fill prompt for the selected area.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();

      // Convert mask data URL to blob
      const maskBlob = await (await fetch(maskImage)).blob();
      formData.append(
        "mask_file",
        new File([maskBlob], "mask.png", { type: "image/png" })
      );

      if (image.startsWith("data:")) {
        // If image is a data URL, convert to blob
        const imageBlob = await (await fetch(image)).blob();
        formData.append(
          "image_file",
          new File([imageBlob], "image.png", { type: "image/png" })
        );
      } else if (image.startsWith("blob:")) {
        // If image is a blob URL, fetch the blob and send as file
        console.log("Handling blob URL...");
        const imageBlob = await (await fetch(image)).blob();
        formData.append(
          "image_file",
          new File([imageBlob], "image.png", { type: "image/png" })
        );
      } else {
        // If image is a regular URL, pass it as is
        formData.append("image_url", image);
      }

      // Add content moderation flag
      formData.append("content_moderation", contentModeration.toString());

      // For gen-fill only, add the prompt
      if (currentTool === "gen-fill") {
        formData.append("prompt", fillPrompt);
      }

      const endpoint =
        currentTool === "eraser"
          ? "/api/edit-image/eraser"
          : "/api/edit-image/generative-fill";

      console.log(`Sending request to ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process image");
      }

      const data = await response.json();

      if (!data.result_url) {
        throw new Error("No result URL returned from the API");
      }

      setEditedImage(data.result_url);

      toast({
        title:
          currentTool === "eraser"
            ? "Eraser applied"
            : "Generative fill applied",
        description: "Your image has been successfully processed.",
      });

      // Reset the mask after processing
      clearMask();
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewImage = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `bria-edited-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description:
          "There was an error downloading the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveToGallery = async (imageUrl: string) => {
    try {
      setIsSavingToGallery(true);

      // Create a unique ID for this save operation
      const batchId = crypto.randomUUID();

      // Create a short display title based on the operation
      const displayTitle =
        currentTool === "eraser"
          ? "Eraser Edit"
          : `Gen Fill: ${fillPrompt.substring(0, 20)}...`;

      // Create the gallery item
      const galleryItem = {
        id: batchId,
        title: displayTitle,
        fullPrompt: currentTool === "gen-fill" ? fillPrompt : "Eraser tool",
        date: new Date().toISOString(),
        provider: "bria",
        thumbnailUrl: imageUrl,
        images: [imageUrl], // This stores the image URL
        originalImage: originalImage || undefined,
        type: "image-editing" as const,
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
        description:
          err instanceof Error ? err.message : "Failed to save to gallery",
      });
    } finally {
      setIsSavingToGallery(false);
    }
  };

  // Update the brush size effect for the cursor
  useEffect(() => {
    setScaledCursorSize(Math.max(5, Math.round(brushSize)));
  }, [brushSize]);

  return (
    <div className="flex-1 px-4 py-4">
      <div className="flex items-center mb-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Image</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] gap-8 h-full">
        <div className="md:h-[calc(100vh-10rem)]">
          <div className="border rounded-lg p-4 bg-card h-full flex flex-col">
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleClearAll}
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
                  <Label className="text-sm">Example Images</Label>
                  <div className="border rounded-lg p-1.5 bg-muted/50">
                    <ExampleImages
                      type="model"
                      onSelect={handleExampleImageSelect}
                      displayMode="row"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Editing Tool</Label>
                  <Tabs
                    defaultValue="eraser"
                    value={currentTool}
                    onValueChange={(value) =>
                      setCurrentTool(value as "eraser" | "gen-fill")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="eraser"
                        className="flex items-center gap-1"
                      >
                        <Eraser className="h-4 w-4" />
                        <span>Eraser</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="gen-fill"
                        className="flex items-center gap-1"
                      >
                        <Wand2 className="h-4 w-4" />
                        <span>Gen Fill</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Brush Size</Label>
                    <span className="text-sm text-muted-foreground">
                      {brushSize}
                    </span>
                  </div>
                  <Slider
                    min={2}
                    max={100}
                    step={1}
                    value={[brushSize]}
                    onValueChange={(values) => setBrushSize(values[0])}
                    className="w-full"
                  />
                </div>

                {currentTool === "gen-fill" && (
                  <div className="space-y-1">
                    <Label className="text-sm">Fill Prompt</Label>
                    <textarea
                      className="w-full min-h-[80px] p-2 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="Describe what should fill the selected area..."
                      value={fillPrompt}
                      onChange={(e) => setFillPrompt(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                  >
                    <Undo className="h-4 w-4 mr-1" />
                    Undo
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                  >
                    <Redo className="h-4 w-4 mr-1" />
                    Redo
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8"
                    onClick={clearMask}
                  >
                    Clear Mask
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-moderation"
                      checked={contentModeration}
                      onChange={(e) => setContentModeration(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="content-moderation" className="text-sm">
                      Content Moderation
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t">
              <Button
                className="w-full h-9"
                onClick={handleProcess}
                disabled={
                  isProcessing ||
                  !image ||
                  !maskImage ||
                  (currentTool === "gen-fill" && !fillPrompt.trim())
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentTool === "eraser" ? (
                  <>
                    <Eraser className="h-4 w-4 mr-2" />
                    Apply Eraser
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Apply Gen Fill
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 md:h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="h-full flex flex-col">
            {/* Canvas editor section - only show when no edited image */}
            {!editedImage ? (
              <div className="flex-1 relative border-2 border-dashed rounded-lg overflow-hidden mb-4">
                {isImageUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        Uploading image...
                      </p>
                    </div>
                  </div>
                ) : image ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Hidden reference image */}
                    <img
                      ref={imageRef}
                      src={image}
                      alt="Hidden reference"
                      className="hidden"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error(
                          "Hidden reference image failed to load:",
                          e
                        );
                      }}
                    />

                    {/* Main visible canvas with better sizing and responsive behavior */}
                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                      <div className="relative max-h-[70vh] max-w-full">
                        <canvas
                          ref={canvasRef}
                          className="max-h-[70vh] object-contain border border-border shadow-sm"
                          style={{ background: "#f8f9fa" }}
                        />

                        {/* Mask drawing canvas - positioned absolutely over the main canvas */}
                        <canvas
                          ref={maskCanvasRef}
                          className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                          style={{
                            mixBlendMode: "difference",
                            opacity: 0.7,
                            pointerEvents: "auto",
                            cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${scaledCursorSize}" height="${scaledCursorSize}" viewBox="0 0 ${scaledCursorSize} ${scaledCursorSize}"><circle cx="${
                              scaledCursorSize / 2
                            }" cy="${scaledCursorSize / 2}" r="${
                              scaledCursorSize / 2 - 1
                            }" fill="rgba(255,255,255,0.5)" stroke="white" /></svg>') ${
                              scaledCursorSize / 2
                            } ${scaledCursorSize / 2}, auto`,
                          }}
                          onMouseDown={startPainting}
                          onMouseMove={paint}
                          onMouseUp={endPainting}
                          onMouseLeave={endPainting}
                        />
                      </div>
                    </div>

                    {/* Canvas dimensions display for debugging */}
                    <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
                      {canvasRef.current &&
                        `Canvas: ${canvasRef.current.width}x${canvasRef.current.height}`}
                    </div>

                    {/* Overlay with instructions */}
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 text-sm flex items-center">
                      <PenLine className="h-4 w-4 mr-2" />
                      {currentTool === "eraser" ? (
                        <span>Draw over areas you want to erase</span>
                      ) : (
                        <span>
                          Draw over areas you want to fill with AI-generated
                          content
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 h-full flex flex-col items-center justify-center">
                    <input
                      type="file"
                      id="main-upload"
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                    <Label
                      htmlFor="main-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-12 w-12 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Begin by uploading an image
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supported files: PNG, JPG, JPEG, WEBP
                      </p>
                      <div className="flex flex-col space-y-2 w-full max-w-[200px]">
                        <Button variant="secondary">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                        <GalleryImageSelector
                          onSelectImage={handleGalleryImageSelect}
                          buttonText="From Gallery"
                          allowedTypes={[
                            "model-generation",
                            "try-on",
                            "image-tagging",
                            "bg-generator",
                          ]}
                          buttonVariant="outline"
                          buttonClassName="w-full"
                        />
                      </div>
                      <input
                        id="main-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                )}
              </div>
            ) : (
              /* Results section - full height when shown */
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Result</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditedImage(null)}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to editing
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                  <div className="relative border rounded-lg overflow-hidden bg-card flex items-center justify-center h-full">
                    <div className="absolute top-2 left-2 bg-background/70 text-xs font-medium px-2 py-1 rounded">
                      Original
                    </div>
                    <Image
                      src={originalImage || ""}
                      alt="Original Image"
                      fill
                      className="object-contain"
                      onClick={() =>
                        originalImage && handlePreviewImage(originalImage)
                      }
                    />
                  </div>
                  <div className="relative border rounded-lg overflow-hidden bg-card flex items-center justify-center h-full">
                    <div className="absolute top-2 left-2 bg-background/70 text-xs font-medium px-2 py-1 rounded">
                      Edited
                    </div>
                    <Image
                      src={editedImage}
                      alt="Edited Image"
                      fill
                      className="object-contain"
                      onClick={() => handlePreviewImage(editedImage)}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(editedImage);
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
                          saveToGallery(editedImage);
                        }}
                        disabled={
                          isSavingToGallery || savedImageIds.has(editedImage)
                        }
                      >
                        {isSavingToGallery ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : savedImageIds.has(editedImage) ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        {savedImageIds.has(editedImage) ? "Saved" : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full p-1 h-auto max-h-[90vh]">
          <div className="relative h-[calc(90vh-2rem)] w-full flex items-center justify-center overflow-auto">
            {previewImage && (
              <>
                <div className="relative w-auto h-auto">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-[85vh] max-w-full object-contain"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => setPreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
