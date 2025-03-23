"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Loader2, Trash2, Eye, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

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

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);

  // Load gallery items from localStorage
  useEffect(() => {
    const fetchGalleryItems = async () => {
      setLoading(true);

      try {
        // Check localStorage for existing items
        const localStorageItems = localStorage.getItem("galleryItems");

        if (localStorageItems) {
          try {
            const parsedItems = JSON.parse(localStorageItems);
            if (Array.isArray(parsedItems)) {
              console.log(
                "Loaded gallery items from localStorage:",
                parsedItems.length
              );
              
              // Sort items by date (newest first)
              const sortedItems = parsedItems.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              
              // Limit to 30 items
              const limitedItems = sortedItems.slice(0, 30);
              
              // If we had to limit items, update localStorage
              if (limitedItems.length < parsedItems.length) {
                localStorage.setItem("galleryItems", JSON.stringify(limitedItems));
              }
              
              setGalleryItems(limitedItems);
            } else {
              console.log("Invalid gallery items format in localStorage");
              setGalleryItems([]);
            }
          } catch (err) {
            console.error("Error parsing localStorage gallery items:", err);
            setGalleryItems([]);
          }
        } else {
          console.log("No gallery items found in localStorage");
          setGalleryItems([]);
        }
      } catch (err) {
        console.error("Error fetching gallery items:", err);
        setError("Failed to load gallery items");
        setGalleryItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  // Subscribe to gallery updates
  useEffect(() => {
    // Define handler function
    const handleGalleryUpdate = (event: any) => {
      console.log("Gallery update event received:", event.detail);
      if (event.detail && event.detail.item) {
        setGalleryItems((prevItems) => {
          // Add new item
          const newItems = [...prevItems, event.detail.item];
          
          // Sort items by date (newest first)
          const sortedItems = newItems.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          // Limit to 30 items by removing oldest
          const limitedItems = sortedItems.slice(0, 30);
          
          // Save to localStorage for persistence
          localStorage.setItem("galleryItems", JSON.stringify(limitedItems));
          return limitedItems;
        });
      }
    };

    // Add event listener
    window.addEventListener("galleryUpdate", handleGalleryUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("galleryUpdate", handleGalleryUpdate);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return dateString;
    }
  };

  // Remove item from gallery
  const removeItem = (id: string) => {
    setGalleryItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== id);
      // Update localStorage
      localStorage.setItem("galleryItems", JSON.stringify(newItems));
      toast({
        title: "Item removed",
        description: "The item has been removed from your gallery.",
      });
      return newItems;
    });
  };

  // Open item details in dialog
  const viewItem = (item: GalleryItem) => {
    setSelectedItem(item);
  };

  // Filter gallery items based on active tab
  const filteredItems =
    activeTab === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.type === activeTab);

  // Get action button based on item type
  const getActionButton = (type: string) => {
    switch (type) {
      case "model-generation":
        return (
          <Link href="/model-generation">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Generate New Models
            </Button>
          </Link>
        );
      case "try-on":
        return (
          <Link href="/try-on">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Try-On
            </Button>
          </Link>
        );
      case "bg-removal":
        return (
          <Link href="/background-removal">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Remove Background
            </Button>
          </Link>
        );
      case "bg-generator":
        return (
          <Link href="/background-generator">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Generate Background
            </Button>
          </Link>
        );
      case "image-tagging":
        return (
          <Link href="/image-tagging">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Tag Images
            </Button>
          </Link>
        );
      default:
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/model-generation">
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-3 w-3" />
                Models
              </Button>
            </Link>
            <Link href="/try-on">
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-3 w-3" />
                Try-On
              </Button>
            </Link>
            <Link href="/background-generator">
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-3 w-3" />
                BG
              </Button>
            </Link>
          </div>
        );
    }
  };

  // Updated download function to handle cross-origin images
  const downloadImage = async (url: string, title: string, index?: number) => {
    try {
      // Track which image is being downloaded
      setDownloadingImage(url);
      
      // Create a clean filename based on title and index
      const cleanTitle = title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');
      const filename = index !== undefined 
        ? `${cleanTitle}-${index + 1}.jpg`
        : `${cleanTitle}.jpg`;
      
      // Show starting toast
      toast({
        title: "Download Starting",
        description: `Preparing image for download...`,
      });
      
      // Fetch the image from the external URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      // Get the image as a blob
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const link = document.createElement('a');
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
      console.error('Error downloading image:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingImage(null);
    }
  };

  return (
    <div className="container max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Gallery</h1>
          <Button variant="link" asChild>
            <Link href="/image-tagging">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          View and manage your saved images. Your gallery can store up to 30 items.
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Results Gallery</h1>
        </div>
        {activeTab === "all" ? (
          <Link href="/try-on">
            <Button size="sm" className="sm:size-md">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Item</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        ) : (
          getActionButton(activeTab)
        )}
      </div>

      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="model-generation">Models</TabsTrigger>
            <TabsTrigger value="try-on">Try-On</TabsTrigger>
            <TabsTrigger value="bg-removal">BG Removal</TabsTrigger>
            <TabsTrigger value="bg-generator">BG Generator</TabsTrigger>
            <TabsTrigger value="image-tagging">Tagging</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading gallery...</span>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-destructive/10 rounded-lg">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-muted-foreground mt-2">Please try again later</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">
            No items found in this category
          </p>
          <p className="text-muted-foreground mt-2">
            Create some items to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted flex justify-center items-center">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.date)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.type === "try-on" && "via Try-On"}
                      {item.type === "bg-removal" && "via Background Removal"}
                      {item.type === "bg-generator" &&
                        "via Background Generator"}
                      {item.type === "image-tagging" && "via Image Tagging"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => viewItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewer Dialog */}
      {selectedItem && (
        <Dialog
          open={selectedItem !== null}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedItem.title}</DialogTitle>
              <DialogDescription>
                {formatDate(selectedItem.date)} •
                {selectedItem.type === "try-on" && " Created via Try-On"}
                {selectedItem.type === "bg-removal" &&
                  " Created via Background Removal"}
                {selectedItem.type === "bg-generator" &&
                  " Created via Background Generator"}
                {selectedItem.type === "image-tagging" && 
                  " Created via Image Tagging"}
                {selectedItem.type === "model-generation" && 
                  " Created via Model Generation"}
              </DialogDescription>
            </DialogHeader>
            
            {/* Display full prompt for model-generation items */}
            {selectedItem.type === "model-generation" && selectedItem.fullPrompt && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <h4 className="text-sm font-medium mb-1">Prompt</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.fullPrompt}</p>
              </div>
            )}
            
            {/* Display multiple images if available */}
            {selectedItem.images && selectedItem.images.length > 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                {selectedItem.images.map((image, index) => (
                  <div key={index} className="relative group aspect-square bg-muted overflow-hidden rounded-md">
                    <Image
                      src={image}
                      alt={`${selectedItem.title} - Image ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                    {/* Download button for each image */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => downloadImage(image, selectedItem.title, index)}
                        disabled={downloadingImage === image}
                      >
                        {downloadingImage === image ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group aspect-video bg-muted flex justify-center items-center overflow-hidden my-4">
                {selectedItem.images && selectedItem.images.length > 0 ? (
                  <>
                    <Image
                      src={selectedItem.images[0]}
                      alt={selectedItem.title}
                      fill
                      className="object-contain"
                    />
                    {/* Download button for single image */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => downloadImage(selectedItem.images[0], selectedItem.title)}
                        disabled={downloadingImage === selectedItem.images[0]}
                      >
                        {downloadingImage === selectedItem.images[0] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No image available</div>
                )}
              </div>
            )}
            
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
              <div className="flex gap-2">
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => downloadImage(
                      selectedItem.images[0], 
                      selectedItem.title, 
                      selectedItem.images.length > 1 ? undefined : 0
                    )}
                    disabled={downloadingImage !== null}
                  >
                    {downloadingImage === selectedItem.images[0] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {selectedItem.images.length > 1 ? "Download First Image" : "Download Image"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    removeItem(selectedItem.id);
                    setSelectedItem(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Gallery
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
