"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  date: string;
  provider: string;
  thumbnailUrl: string;
  images: string[];
  modelImageUrl?: string;
  garmentImageUrl?: string;
  type: "try-on" | "bg-removal" | "bg-generator" | "image-tagging" | "model-generation";
  fullPrompt?: string;
}

interface GalleryImageSelectorProps {
  onSelectImage: (imageUrl: string) => void;
  buttonText?: string;
  allowedTypes?: Array<GalleryItem["type"] | "all">;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonClassName?: string;
}

export function GalleryImageSelector({
  onSelectImage,
  buttonText = "Select from Gallery",
  allowedTypes = ["all"],
  buttonVariant = "secondary",
  buttonClassName = "",
}: GalleryImageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(allowedTypes.includes("all") ? "all" : allowedTypes[0]);

  useEffect(() => {
    if (open) {
      loadGalleryItems();
    }
  }, [open]);

  const loadGalleryItems = () => {
    setLoading(true);
    try {
      const localStorageItems = localStorage.getItem("galleryItems");
      if (localStorageItems) {
        const parsedItems = JSON.parse(localStorageItems);
        if (Array.isArray(parsedItems)) {
          // Sort items by date (newest first)
          const sortedItems = parsedItems.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setGalleryItems(sortedItems);
        } else {
          setGalleryItems([]);
        }
      } else {
        setGalleryItems([]);
      }
    } catch (err) {
      console.error("Error loading gallery items:", err);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onSelectImage(imageUrl);
    setOpen(false);
  };

  // Filter gallery items based on active tab
  const filteredItems = activeTab === "all"
    ? galleryItems
    : galleryItems.filter((item) => item.type === activeTab);

  // Create tabs based on allowed types
  const tabs = [
    ...(allowedTypes.includes("all") ? [{ value: "all", label: "All" }] : []),
    ...(allowedTypes.includes("model-generation") || allowedTypes.includes("all") ? [{ value: "model-generation", label: "Models" }] : []),
    ...(allowedTypes.includes("try-on") || allowedTypes.includes("all") ? [{ value: "try-on", label: "Try-On" }] : []),
    ...(allowedTypes.includes("bg-generator") || allowedTypes.includes("all") ? [{ value: "bg-generator", label: "Backgrounds" }] : []),
    ...(allowedTypes.includes("image-tagging") || allowedTypes.includes("all") ? [{ value: "image-tagging", label: "Tagged Images" }] : []),
    ...(allowedTypes.includes("bg-removal") || allowedTypes.includes("all") ? [{ value: "bg-removal", label: "Removed BG" }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={buttonClassName}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Image from Gallery</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-center">
                <div>
                  <p className="text-muted-foreground mb-2">No images found in this category</p>
                  <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-3 gap-4 p-4">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-all group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            onClick={() => handleSelectImage(item.thumbnailUrl)}
                            variant="secondary"
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 