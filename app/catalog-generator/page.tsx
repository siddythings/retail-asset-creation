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
import { ArrowLeft, Upload, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { ExampleImages } from "@/components/example-images";
import { Switch } from "@/components/ui/switch";

interface GenerationResult {
  category: string;
  combinations: Array<{
    model: string;
    size: string;
    region: string;
    template?: string;
    imageUrl: string;
  }>;
}

export default function BackgroundGeneratorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [numOutputs, setNumOutputs] = useState<number>(1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGroupIndex, setLoadingGroupIndex] = useState<number | null>(
    null
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["M"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Asian"]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [generateWithBackground, setGenerateWithBackground] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const handleExampleImageSelect = (url: string) => {
    setIsImageUploading(true);
    setImage(url);
    setIsImageUploading(false);
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
        setImage(data[0]); // API returns an array with one URL

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

  const handleClearAll = () => {
    setImage(null);
    setSelectedModels([]);
    setSelectedTemplates([]);
  };

  const generatePermutations = () => {
    if (!image || selectedModels.length === 0) {
      toast({
        title: "Missing selections",
        description: "Please select an image and at least one model.",
        variant: "destructive",
      });
      return [];
    }

    const permutations: GenerationResult[] = selectedModels.map((modelUrl) => {
      const modelResults: GenerationResult = {
        category: `Model ${
          modelUrl.split("/").pop()?.split(".")[0] || "Unknown"
        }`,
        combinations: [],
      };

      // Create combinations for each size and region
      selectedSizes.forEach((size) => {
        selectedRegions.forEach((region) => {
          // Add numOutputs copies of each combination
          for (let i = 0; i < numOutputs; i++) {
            modelResults.combinations.push({
              model: modelUrl,
              size,
              region,
              imageUrl: modelUrl,
            });
          }
        });
      });

      return modelResults;
    });

    return permutations;
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

    setLoadingGroupIndex(0);
    setShowResults(true);

    try {
      // For demo, use the local permutation generator
      const generatedResults = generatePermutations();
      setResults(generatedResults);

      toast({
        title: "Generation complete",
        description: `Generated ${generatedResults.reduce(
          (acc, curr) => acc + curr.combinations.length,
          0
        )} combinations.`,
      });
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

  return (
    <div className="flex-1 px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[450px,1fr] gap-8 h-full">
        <div className="md:h-[calc(100vh-8rem)]">
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Select Models</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedModels.length} selected
                    </span>
                  </div>
                  <div className="border rounded-lg p-1.5 bg-muted/50">
                    <ExampleImages
                      type="model"
                      onSelect={(url) => {
                        setSelectedModels((prev) =>
                          prev.includes(url)
                            ? prev.filter((model) => model !== url)
                            : [...prev, url]
                        );
                      }}
                      displayMode="row"
                      selectedImages={selectedModels}
                      multiSelect={true}
                    />
                  </div>
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
                  <Label className="text-sm">Sizes</Label>
                  <div className="flex flex-wrap gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSizes((prev) =>
                            prev.includes(size)
                              ? prev.filter((s) => s !== size)
                              : [...prev, size]
                          );
                        }}
                        className={cn(
                          "h-8 px-3 rounded-full text-sm transition-colors",
                          "border border-input hover:bg-accent hover:text-accent-foreground",
                          selectedSizes.includes(size)
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-background"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">Model Region</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Asian",
                      "American",
                      "European",
                      "African",
                      "Latin American",
                      "Middle Eastern",
                      "South Asian",
                    ].map((region) => (
                      <button
                        key={region}
                        onClick={() => {
                          setSelectedRegions((prev) =>
                            prev.includes(region)
                              ? prev.filter((r) => r !== region)
                              : [...prev, region]
                          );
                        }}
                        className={cn(
                          "h-8 px-3 rounded-full text-sm transition-colors",
                          "border border-input hover:bg-accent hover:text-accent-foreground",
                          selectedRegions.includes(region)
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-background"
                        )}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Generate with background</Label>
                    <Switch
                      id="generate-with-background"
                      checked={generateWithBackground}
                      onCheckedChange={setGenerateWithBackground}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Background Templates</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedTemplates.length} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Template 1",
                      "Template 2",
                      "Template 3",
                      "Template 4",
                      "Template 5",
                      "Template 6",
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => {
                          setSelectedTemplates((prev) =>
                            prev.includes(template)
                              ? prev.filter((t) => t !== template)
                              : [...prev, template]
                          );
                        }}
                        className={cn(
                          "h-8 px-3 rounded-full text-sm transition-colors",
                          "border border-input hover:bg-accent hover:text-accent-foreground",
                          selectedTemplates.includes(template)
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-background"
                        )}
                      >
                        {template}
                      </button>
                    ))}
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

        <div className="flex-1 h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="min-h-full relative">
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-500 ease-in-out py-8",
                showResults ? "h-[50vh]" : "h-[calc(100vh-8rem)]"
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
                      <p className="text-sm text-muted-foreground">
                        Supported files: PNG, JPG, JPEG, WEBP
                      </p>
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
                  {selectedModels.map((modelUrl, modelIndex) => (
                    <div key={modelIndex} className="space-y-4">
                      <h3 className="text-sm font-medium">
                        Model {modelIndex + 1}
                      </h3>
                      {selectedSizes.map((size) =>
                        selectedRegions.map((region) => (
                          <div
                            key={`${modelIndex}-${size}-${region}`}
                            className="space-y-2"
                          >
                            <div className="text-sm text-muted-foreground">
                              Size: {size} - Region: {region}
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                              {Array.from({ length: numOutputs }).map(
                                (_, index) => (
                                  <div
                                    key={`${modelIndex}-${size}-${region}-${index}`}
                                    className="relative w-[200px] aspect-[3/4] flex-shrink-0 border rounded-lg overflow-hidden bg-muted"
                                    onClick={() => handlePreviewImage(modelUrl)}
                                  >
                                    <Image
                                      src={modelUrl}
                                      alt={`Model ${
                                        modelIndex + 1
                                      } - ${size} - ${region}`}
                                      fill
                                      className="object-cover transition-opacity duration-300 hover:scale-105 transition-transform cursor-pointer"
                                      unoptimized
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
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
    </div>
  );
}
