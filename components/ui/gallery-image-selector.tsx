import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface GalleryImageSelectorProps {
  onSelectImage: (imageUrl: string) => void;
  buttonText?: string;
  allowedTypes?: string[];
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonClassName?: string;
}

export function GalleryImageSelector({
  onSelectImage,
  buttonText = "Select from Gallery",
  allowedTypes = ["model-generation", "bg-generator"],
  buttonVariant = "outline",
  buttonClassName = "",
}: GalleryImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(allowedTypes[0]);

  // Mock data for demonstration
  const mockImages = {
    "model-generation": [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1511497584788-876760111969?w=500&q=80",
        title: "Model 1",
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80",
        title: "Model 2",
      },
      // Add more mock images as needed
    ],
    "bg-generator": [
      {
        id: 3,
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
        title: "Background 1",
      },
      {
        id: 4,
        url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=500&q=80",
        title: "Background 2",
      },
      // Add more mock images as needed
    ],
  };

  const filteredImages = mockImages[selectedType as keyof typeof mockImages].filter(
    (image) =>
      image.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageSelect = (imageUrl: string) => {
    onSelectImage(imageUrl);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
      >
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Image from Gallery</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                {allowedTypes.map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </TabsTrigger>
                ))}
              </TabsList>

              {allowedTypes.map((type) => (
                <TabsContent key={type} value={type}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                      <div className="col-span-full flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      filteredImages.map((image) => (
                        <div
                          key={image.id}
                          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                          onClick={() => handleImageSelect(image.url)}
                        >
                          <Image
                            src={image.url}
                            alt={image.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm">{image.title}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 