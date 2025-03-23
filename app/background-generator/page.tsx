"use client";

import { useState, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Download,
  Save,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { ExampleImages } from "@/components/example-images";
import { GalleryImageSelector } from "@/components/gallery-image-selector";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface PromptParameters {
  productType: string[];
  colors: string[];
  patterns: string[];
  materials: string[];
  style: string[];
  ageGroup: string[];
  occasion: string[];
}

type PromptParameterKey = keyof PromptParameters;

const PROMPT_PARAMETERS: PromptParameters = {
  productType: [
    "tunic dress",
    "maxi dress",
    "midi skirt",
    "blouse",
    "palazzo pants",
    "jumpsuit",
    "crop top",
    "kaftan",
    "ethnic wear",
    "western dress",
    "formal suit",
    "casual shirt",
    "evening gown",
    "cocktail dress",
    "summer dress"
  ],
  colors: [
    "red",
    "blue",
    "yellow",
    "green",
    "black",
    "white",
    "navy",
    "burgundy",
    "coral",
    "mint",
    "lavender",
    "peach",
    "turquoise",
    "rose gold",
    "champagne",
    "ivory",
    "sage",
    "maroon",
    "teal",
    "mustard"
  ],
  patterns: [
    "floral",
    "embroidery",
    "geometric",
    "stripes",
    "polka dots",
    "paisley",
    "abstract",
    "tribal",
    "checkered",
    "tie-dye",
    "batik",
    "animal print",
    "block print",
    "ikat",
    "damask",
    "chevron",
    "botanical",
    "mandala"
  ],
  materials: [
    "cotton",
    "linen",
    "silk",
    "chiffon",
    "crepe",
    "georgette",
    "velvet",
    "satin",
    "wool",
    "denim",
    "jersey",
    "organza",
    "brocade",
    "tweed",
    "chambray",
    "muslin",
    "modal",
    "rayon"
  ],
  style: [
    "bohemian",
    "casual",
    "elegant",
    "formal",
    "vintage",
    "contemporary",
    "minimalist",
    "romantic",
    "classic",
    "avant-garde",
    "preppy",
    "streetwear",
    "resort wear",
    "traditional",
    "glamorous",
    "rustic",
    "sophisticated",
    "eclectic"
  ],
  ageGroup: [
    "adult",
    "teen",
    "young adult",
    "middle-aged",
    "senior",
    "all ages",
    "20s-30s",
    "30s-40s",
    "40s-50s"
  ],
  occasion: [
    "casual outings",
    "vacations",
    "beach party",
    "wedding",
    "formal dinner",
    "office wear",
    "cocktail party",
    "brunch",
    "evening party",
    "festival",
    "date night",
    "garden party",
    "business meeting",
    "weekend getaway",
    "special occasion",
    "outdoor event",
    "religious ceremony",
    "graduation"
  ]
};

const BACKGROUND_TEMPLATES = [
  {
    category: "Nature",
    prompts: [
      {
        text: `You are an AI image editor specializing in fashion e-commerce photography. Your task is to replace the background of a given image with an evocative Indian scene that blends tradition and modernity, creating a chic and fashion-forward e-commerce presentation.

1. Envision a vibrant Indian setting that combines traditional and modern elements:
   - Include a bustling street scene with colorful markets
   - Incorporate intricate architectural details reminiscent of historic palaces or temples
   - Use a palette of warm, rich hues typical of Indian aesthetics

2. Ensure the new background is photorealistic and complements the model and apparel:
   - Match the lighting and perspective of the original image
   - Create depth and dimension to make the scene feel immersive
   - Balance the vibrancy of the background with the focus on the model and apparel

3. Highlight India's dynamic cultural heritage:
   - Include recognizable Indian motifs or symbols without overwhelming the main subject
   - Blend traditional elements with modern urban features
   - Ensure the overall atmosphere enhances the fashion-forward nature of the e-commerce presentation

4. Seamlessly integrate the model and apparel into the new background:
   - Adjust shadows and reflections to match the new environment
   - Ensure the model appears naturally placed within the scene
   - Maintain the original image's professional, high-quality appearance`,
        sampleImage: "https://images.unsplash.com/photo-1511497584788-876760111969?w=500&q=80"
      },
      {
        text: `You are an AI image editor tasked with replacing the background of an image with an iconic New York City scene. Your goal is to create a photorealistic, sophisticated urban environment that complements the model and apparel in the original image.

Please follow these instructions to complete the task:

1. Analyze the original image, paying attention to the model's pose, lighting, and the style of the apparel.

2. Remove the existing background while preserving the model and the apparel they are wearing.

3. Create a new background featuring a bustling urban street in New York City. This should include:
   - Sleek skyscrapers lining the street
   - Either the Empire State Building or Brooklyn Bridge visible in the distance (choose one based on what best complements the composition)
   - Yellow taxi cabs on the street
   - Street art or graffiti to add an authentic NYC touch

4. Ensure the new background is photorealistic and captures the dynamic, stylish essence of New York City.

5. Adjust the lighting and shadows of the new background to match the lighting on the model, creating a seamless integration.

6. Position the model within the new scene in a way that looks natural and enhances the overall composition. The model should appear as if they were originally photographed in this New York City setting.

7. Add subtle reflections or interactions between the model/apparel and the new environment to increase realism (e.g., reflections in windows or on shiny surfaces).

8. Enhance the color grading of the entire image to create a cohesive look that emphasizes the sophisticated urban flair of New York City.

9. Ensure that the focus remains on the model and the apparel, with the new background complementing rather than overpowering the subject.

10. Double-check that all elements of the original image that should be preserved (model, apparel, accessories) are intact and have not been accidentally altered or removed.

Once you have completed these steps, provide a detailed description of the final image, including how the new New York City background interacts with and enhances the model and apparel. Explain how the changes have created a sophisticated urban flair that complements the original subject.

Present your final description within <final_image_description> tags.`,
        sampleImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80"
      },
      {
        text: `You are an AI image editor tasked with replacing the background of a product image with a vibrant Miami scene for an e-commerce website. Your goal is to create a photorealistic, stylish image that complements the model and highlights the apparel in a modern, chic presentation.

Follow these steps to replace the background:

1. Analyze the original image, paying attention to the lighting, shadows, and edges around the model and apparel.

2. Create a new background featuring a sunlit, turquoise beach with sparkling water and white sands. Include lush palm trees and iconic pastel-colored Art Deco buildings to capture the Miami vibe.

3. Ensure the new background complements the model's pose and the apparel's style. The background should enhance the product without overshadowing it.

4. Adjust the lighting and shadows on the model to match the new beach setting. Pay particular attention to the direction and intensity of the sunlight, and how it would naturally interact with the model and clothing.

5. Blend the edges between the model and the new background seamlessly to maintain photorealism. Avoid any harsh lines or obvious cut-out effects.

6. Add subtle reflections or color casts from the background onto the model and apparel where appropriate, to further integrate them into the scene.

7. Ensure the color balance of the entire image is cohesive, with the vibrant Miami colors complementing but not overpowering the apparel.

To maintain photorealism and create an effective e-commerce presentation:

- Keep the focus on the model and apparel. The background should be detailed but not distracting.
- Ensure the scale and perspective of the background elements (beach, buildings, palm trees) are consistent with the model's size and position.
- Maintain the original image's resolution and quality throughout the editing process.
- Preserve all details of the apparel, ensuring no part of the product is obscured or altered by the background replacement.
`,
        sampleImage: "https://images.unsplash.com/photo-1511497584788-876760111969?w=500&q=80"
      },
      {
        text: `You are an AI image editor tasked with replacing the background of an image with an iconic New York City scene. Your goal is to create a photorealistic, high-quality image that enhances the original subject with a sophisticated urban flair.


Replace the background of the original image with a bustling urban street scene that captures the essence of New York City. The new background should include the following elements:

1. Sleek skyscrapers forming an impressive cityscape
2. Hints of iconic landmarks such as the Empire State Building or Brooklyn Bridge in the distance
3. Yellow taxi cabs to represent the city's energy and movement
4. Street art or graffiti to add an urban, artistic touch
5. Busy sidewalks with pedestrians to convey the city's vibrant atmosphere

When generating the new image, follow these guidelines:

1. Maintain the original subject (person, product, etc.) as the focal point of the image
2. Ensure the lighting and perspective of the new background match the original subject
3. Blend the edges between the subject and the new background seamlessly
4. Adjust the color grading to create a cohesive look between the subject and the new NYC background
5. Generate the image in 4K resolution (3840x2160 pixels) for high quality and detail

Provide the final edited image as a high-resolution, photorealistic representation that captures the dynamic, stylish essence of New York City while enhancing the original subject with a sophisticated urban flair.
`,
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

const MultiSelect = ({ 
  options, 
  selected, 
  onChange, 
  placeholder 
}: { 
  options: string[], 
  selected: string[], 
  onChange: (value: string[]) => void, 
  placeholder: string 
}) => {
  return (
    <div className="relative">
      <SelectTrigger className="w-full h-8">
        <div className="truncate">
          {selected.length > 0 ? selected.join(", ") : placeholder}
        </div>
      </SelectTrigger>
      <SelectContent>
        <div className="max-h-[200px] overflow-auto p-1">
          <div 
            className="px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50 rounded-sm"
            onClick={() => onChange([])}
          >
            Clear selection
          </div>
          <div className="grid grid-cols-1 gap-1">
            {options.map((option) => (
              <div 
                key={option} 
                className={cn(
                  "px-2 py-1.5 text-sm cursor-pointer rounded-sm",
                  selected.includes(option) 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  const newSelected = selected.includes(option)
                    ? selected.filter(item => item !== option)
                    : [...selected, option];
                  onChange(newSelected);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      </SelectContent>
    </div>
  );
};

export default function BackgroundGeneratorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState("fast");
  const [refinePrompt, setRefinePrompt] = useState("true");
  const [originalQuality, setOriginalQuality] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [seed, setSeed] = useState<number>(42);
  const [numOutputs, setNumOutputs] = useState<number>(1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<
    Array<Array<[string, number, string]>>
  >([]);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGroupIndex, setLoadingGroupIndex] = useState<number | null>(
    null
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [savedImageIds, setSavedImageIds] = useState<Set<string>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Partial<Record<keyof PromptParameters, string[]>>>({
    productType: [],
    colors: [],
    patterns: [],
    materials: [],
    style: [],
    ageGroup: [],
    occasion: [],
  });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);

  const handleExampleImageSelect = (url: string) => {
    setIsImageUploading(true);
    setImage(url);
    setIsImageUploading(false);
  };

  const handleGalleryImageSelect = async (imageUrl: string) => {
    try {
      setIsImageUploading(true);
      setImage(imageUrl);

      // Prepare form data for API call
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "image-from-gallery.jpg", {
        type: blob.type,
      });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          "http://localhost:8000/background/upload-to-bria",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();

        // Update image with the URL from the API response
        setImage(data.url);

        toast({
          title: "Image uploaded successfully",
          description: "Your image has been uploaded and processed.",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description:
            "There was an error uploading your image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsImageUploading(false);
      }
    } catch (error) {
      console.error("Gallery selection error:", error);
      toast({
        title: "Selection failed",
        description: "There was an error selecting the image from gallery.",
        variant: "destructive",
      });
      setIsImageUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsImageUploading(true);

      // Show preview immediately using FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Prepare form data for API call
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          "http://localhost:8000/background/upload-to-bria",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();

        // Update image with the URL from the API response
        setImage(data.url); // API returns an array with one URL

        toast({
          title: "Image uploaded successfully",
          description: "Your image has been uploaded and processed.",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description:
            "There was an error uploading your image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsImageUploading(false);
      }
    }
  };

  const handleBackgroundImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setBackgroundImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundGallerySelect = async (imageUrl: string) => {
    try {
      setBackgroundImage(imageUrl);
      toast({
        title: "Background image selected",
        description: "Background image has been selected from gallery.",
      });
    } catch (error) {
      console.error("Gallery selection error:", error);
      toast({
        title: "Selection failed",
        description:
          "There was an error selecting the background image from gallery.",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    setImage(null);
    setBackgroundImage(null);
    setBackgroundPrompt("");
  };

  const handleGenerate = async () => {
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    // Check if backgroundPrompt is empty and set a default value if backgroundImage is provided
    let finalPrompt = backgroundPrompt;
    if (!finalPrompt.trim() && backgroundImage) {
      finalPrompt = "Use the reference image style for the background";
      toast({
        title: "Using reference image",
        description:
          "A default prompt is being used with your reference image.",
      });
    } else if (!finalPrompt.trim() && !backgroundImage) {
      toast({
        title: "Missing prompt",
        description:
          "Please enter a background prompt or select a reference image.",
        variant: "destructive",
      });
      return;
    }

    setLoadingGroupIndex(results.length);
    setShowResults(true);

    try {
      // Create payload for the API request with a proper type to allow additional properties
      const payload: {
        fast: boolean;
        bg_prompt: string;
        refine_prompt: boolean;
        original_quality: boolean;
        num_results: number;
        image_url: string;
        seed: number;
        reference_image_url?: string; // Optional property for reference image
      } = {
        fast: generationMode === "fast",
        bg_prompt: finalPrompt,
        refine_prompt: refinePrompt === "true",
        original_quality: originalQuality,
        num_results: numOutputs,
        image_url: image,
        seed: seed,
      };

      // Add background reference image if available
      if (backgroundImage) {
        payload.reference_image_url = backgroundImage;
      }

      console.log("Sending payload:", payload);

      // Use our Next.js API route instead of calling the backend directly
      const response = await fetch("/api/background-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate background");
      }

      const data = await response.json();

      // Validate data structure before updating state
      if (data && data.result && Array.isArray(data.result)) {
        // Add the new results as a new group
        setResults((prev) => [...prev, data.result]);

        // Scroll to the new results after they're added
        setTimeout(() => {
          resultsContainerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 100);

        toast({
          title: "Generation complete",
          description: "Your images have been generated successfully.",
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description:
          "There was an error generating the images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingGroupIndex(null);
    }
  };

  const handlePreviewImage = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = filename || "generated-background.png"; // Use provided filename or default
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

  const saveToGallery = async (imageUrl: string, promptText: string) => {
    try {
      setIsSavingToGallery(true);

      // Create a unique ID for this save operation
      const batchId = crypto.randomUUID();

      // Create a short display title from the prompt
      const displayTitle =
        promptText.substring(0, 30) + (promptText.length > 30 ? "..." : "");

      // Create the gallery item
      const galleryItem = {
        id: batchId,
        title: displayTitle,
        fullPrompt: promptText, // Store the full prompt as additional metadata
        date: new Date().toISOString(),
        provider: "bria",
        thumbnailUrl: imageUrl,
        images: [imageUrl], // This stores the image URL
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
        description:
          err instanceof Error ? err.message : "Failed to save to gallery",
      });
    } finally {
      setIsSavingToGallery(false);
    }
  };

  const generatePromptFromAPI = async () => {
    try {
      if (!selectedOptions.productType?.length) {
        toast({
          title: "Missing information",
          description: "Please select a product type.",
          variant: "destructive",
        });
        return;
      }

      setIsGeneratingPrompt(true);
      
      const payload = {
        productType: selectedOptions.productType?.[0] || "",
        colors: selectedOptions.colors || [],
        patterns: selectedOptions.patterns?.[0] || "",
        materials: selectedOptions.materials?.[0] || "",
        style: selectedOptions.style?.[0] || "",
        ageGroup: selectedOptions.ageGroup?.[0] || "",
        occasion: selectedOptions.occasion?.[0] || "",
      };

      const response = await fetch("http://localhost:8000/background/prompt-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const data = await response.json();
      // Store all prompts including the explanation
      setGeneratedPrompts(data);
      
      toast({
        title: "Prompts Generated",
        description: "Please select a prompt to use.",
      });
    } catch (error) {
      console.error("Prompt generation error:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleUsePrompt = () => {
    if (backgroundPrompt) {
      setShowTemplates(false);
      setGeneratedPrompts([]);
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
        <h1 className="text-2xl font-bold">Background Generator</h1>
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
                  <Label className="text-sm">Select API</Label>
                  <Select defaultValue="image-editing">
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select API" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image-editing">
                        Image editing
                      </SelectItem>
                      <SelectItem value="generate-background">
                        Generate background
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Generation mode</Label>
                  <Select
                    value={generationMode}
                    onValueChange={setGenerationMode}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Background prompt</Label>
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[60px] p-2 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
                      placeholder="Enter background prompt"
                      value={backgroundPrompt}
                      onChange={(e) => setBackgroundPrompt(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => setShowTemplates(true)}
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Refine prompt</Label>
                  <Select value={refinePrompt} onValueChange={setRefinePrompt}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 h-8">
                  <Checkbox
                    id="original-quality"
                    checked={originalQuality}
                    onCheckedChange={(checked) =>
                      setOriginalQuality(checked as boolean)
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="original-quality" className="text-sm">
                    Original quality
                  </Label>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Seed number</Label>
                  <Input
                    type="number"
                    placeholder="Enter seed number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    min={0}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Number of images</Label>
                    <span className="text-sm text-muted-foreground">
                      {numOutputs}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[1]}
                    max={4}
                    min={1}
                    step={1}
                    value={[numOutputs]}
                    onValueChange={(value) => setNumOutputs(value[0])}
                    className="py-2"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">
                      Background Image Reference (Optional)
                    </h3>
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
            </div>

            <div className="pt-4 mt-4 border-t">
              <Button
                className="w-full h-8 text-sm"
                size="default"
                onClick={handleGenerate}
              >
                Generate
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="min-h-full relative">
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-500 ease-in-out py-8",
                showResults ? "h-[50vh]" : "h-[calc(100vh-10rem)]"
              )}
            >
              <div className="max-w-[600px] w-full aspect-[4/3] border-2 border-dashed rounded-lg flex items-center justify-center">
                {isImageUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent shimmer" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Uploading image...
                    </p>
                  </div>
                ) : image ? (
                  <div className="relative w-full h-full p-4">
                    <Image
                      src={image}
                      alt="Uploaded image"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
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
            </div>

            <div
              className={cn(
                "transition-all duration-500 ease-in-out",
                showResults
                  ? "opacity-100 h-auto"
                  : "opacity-0 h-0 overflow-hidden"
              )}
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Results:</h2>
                <div className="space-y-8">
                  {results.length > 0 &&
                    results.map((resultGroup, groupIndex) => (
                      <div key={groupIndex} className="space-y-2">
                        <h3 className="text-sm text-muted-foreground">
                          Generation {groupIndex + 1}
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                          {resultGroup.map(
                            ([imageUrl, seed, filename], index) => (
                              <div
                                key={`${groupIndex}-${index}`}
                                className="relative border rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[200px]"
                                ref={
                                  index === resultGroup.length - 1 &&
                                    groupIndex === results.length - 1
                                    ? resultsContainerRef
                                    : undefined
                                }
                              >
                                <div
                                  className="relative w-full h-full p-2 cursor-pointer"
                                  onClick={() => handlePreviewImage(imageUrl)}
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={`Result ${groupIndex + 1}-${index + 1
                                      }`}
                                    fill
                                    className={cn(
                                      "object-contain transition-opacity duration-300",
                                      loadedImages[imageUrl]
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                    onLoad={() => {
                                      setLoadedImages((prev) => ({
                                        ...prev,
                                        [imageUrl]: true,
                                      }));
                                    }}
                                    onError={(e) => {
                                      console.error(
                                        "Error loading image:",
                                        imageUrl
                                      );
                                      // Optionally retry loading the image
                                      const img = e.target as HTMLImageElement;
                                      img.src = imageUrl;
                                    }}
                                    unoptimized
                                  />
                                  {!loadedImages[imageUrl] && (
                                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent shimmer" />
                                  )}
                                </div>
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(imageUrl, filename);
                                    }}
                                  >
                                    Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveToGallery(imageUrl, backgroundPrompt);
                                    }}
                                    disabled={
                                      isSavingToGallery ||
                                      savedImageIds.has(imageUrl)
                                    }
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
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewImage(imageUrl);
                                    }}
                                  >
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}

                  {loadingGroupIndex !== null && (
                    <div className="space-y-2">
                      <h3 className="text-sm text-muted-foreground">
                        Generation {loadingGroupIndex + 1}
                      </h3>
                      <div
                        className="grid grid-cols-4 gap-4"
                        ref={resultsContainerRef}
                      >
                        {Array(numOutputs)
                          .fill(0)
                          .map((_, index) => (
                            <div
                              key={`loader-${index}`}
                              className="relative border rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[200px]"
                            >
                              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent shimmer" />
                              <div className="absolute bottom-2 right-2 flex gap-1">
                                <div className="h-7 w-16 rounded bg-muted-foreground/10" />
                                <div className="h-7 w-14 rounded bg-muted-foreground/10" />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative aspect-[16/9] w-full">
            {previewImage && (
              <>
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
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

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Product Background Generator</h2>
            <div className="h-[calc(80vh-180px)] overflow-y-auto">
              {generatedPrompts.length > 0 ? (
                <div className="space-y-4">
                  {/* Display the explanation (first element) */}
                  {/* <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">{generatedPrompts[0]}</p>
                  </div> */}
                  
                  {/* Display the generated prompts */}
                  <div className="space-y-3">
                    {generatedPrompts.map((prompt, index) => {
                      // Extract the prompt text without the number and quotes
                      const matches = prompt.match(/^\d+\.\s*"([^"]+)"$/);
                      const cleanPrompt = matches ? matches[1] : prompt;
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-colors",
                            backgroundPrompt === cleanPrompt
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => {
                            setBackgroundPrompt(cleanPrompt);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-medium text-muted-foreground min-w-[24px]">
                              {index + 1}.
                            </span>
                            <p className="text-sm">{cleanPrompt}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <form className="grid gap-3 p-3 bg-muted/50 rounded-lg">
                  {/* Product Type */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label htmlFor="productType" className="text-sm font-medium">
                      Product Type
                    </Label>
                    <Select
                      value={selectedOptions.productType?.[0] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          productType: [value]
                        }));
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PARAMETERS.productType.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Colors */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label className="text-sm font-medium">Colors</Label>
                    <Select>
                      <MultiSelect
                        options={PROMPT_PARAMETERS.colors}
                        selected={selectedOptions.colors || []}
                        onChange={(colors) => {
                          setSelectedOptions(prev => ({
                            ...prev,
                            colors
                          }));
                        }}
                        placeholder="Select colors"
                      />
                    </Select>
                  </div>

                  {/* Patterns */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label htmlFor="patterns" className="text-sm font-medium">
                      Patterns
                    </Label>
                    <Select
                      value={selectedOptions.patterns?.[0] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          patterns: [value]
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PARAMETERS.patterns.map((pattern) => (
                          <SelectItem key={pattern} value={pattern}>
                            {pattern}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Materials */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label htmlFor="materials" className="text-sm font-medium">
                      Materials
                    </Label>
                    <Select
                      value={selectedOptions.materials?.[0] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          materials: [value]
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PARAMETERS.materials.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Style */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label htmlFor="style" className="text-sm font-medium">
                      Style
                    </Label>
                    <Select
                      value={selectedOptions.style?.[0] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          style: [value]
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PARAMETERS.style.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Group */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label htmlFor="ageGroup" className="text-sm font-medium">
                      Age Group
                    </Label>
                    <Select
                      value={selectedOptions.ageGroup?.[0] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          ageGroup: [value]
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PARAMETERS.ageGroup.map((age) => (
                          <SelectItem key={age} value={age}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Occasion */}
                  <div className="space-y-2 bg-background p-3 rounded-md">
                    <Label htmlFor="occasion" className="text-sm font-medium">
                      Occasion
                    </Label>
                    <Select
                      value={selectedOptions.occasion?.[0] || ""}
                      onValueChange={(value) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          occasion: [value]
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PARAMETERS.occasion.map((occasion) => (
                          <SelectItem key={occasion} value={occasion}>
                            {occasion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              )}
            </div>
            
            <div className="pt-3 border-t flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (generatedPrompts.length > 0) {
                    setGeneratedPrompts([]);
                    setBackgroundPrompt("");
                  } else {
                    setSelectedOptions({});
                  }
                }}
              >
                {generatedPrompts.length > 0 ? "Back to Form" : "Reset"}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTemplates(false);
                    setGeneratedPrompts([]);
                    if (!backgroundPrompt) {
                      setBackgroundPrompt("");
                    }
                  }}
                >
                  Cancel
                </Button>
                {backgroundPrompt ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleUsePrompt}
                  >
                    Use Selected Prompt
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={generatePromptFromAPI}
                    disabled={isGeneratingPrompt}
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Prompts"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
