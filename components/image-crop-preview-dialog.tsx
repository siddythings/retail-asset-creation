import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ImageCropPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageType: "model" | "garment";
  onConfirm: () => void;
  isProcessing: boolean;
}

export function ImageCropPreviewDialog({
  isOpen,
  onClose,
  imageUrl,
  imageType,
  onConfirm,
  isProcessing,
}: ImageCropPreviewDialogProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [croppedDimensions, setCroppedDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Simulate the crop preview
  useEffect(() => {
    if (imageUrl && isOpen) {
      // Load the image to get its dimensions
      const img = new window.Image();
      img.onload = () => {
        setOriginalDimensions({
          width: img.width,
          height: img.height,
        });

        // Calculate 9:16 crop dimensions
        const currentRatio = img.width / img.height;
        const targetRatio = 9 / 16; // Portrait ratio

        let croppedWidth = img.width;
        let croppedHeight = img.height;

        if (currentRatio > targetRatio) {
          // Image is too wide
          croppedWidth = Math.round(img.height * targetRatio);
        } else if (currentRatio < targetRatio) {
          // Image is too tall
          croppedHeight = Math.round(img.width / targetRatio);
        }

        setCroppedDimensions({
          width: croppedWidth,
          height: croppedHeight,
        });

        // For preview purposes, we're just using the original image
        setPreviewImage(imageUrl);
      };
      img.src = imageUrl;
    } else {
      setPreviewImage(null);
      setOriginalDimensions(null);
      setCroppedDimensions(null);
    }
  }, [imageUrl, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Optimize Image for Try-On</DialogTitle>
          <DialogDescription>
            For best results, your {imageType} image will be cropped to a 9:16
            portrait ratio and optimized to get the best try-on results.
          </DialogDescription>
        </DialogHeader>

        {previewImage && (
          <div className="flex flex-col items-center space-y-4">
            <div
              className="relative w-full border rounded-md overflow-hidden flex justify-center items-center"
              style={{ maxHeight: "400px" }}
            >
              <div
                className="relative"
                style={{ maxWidth: "100%", maxHeight: "400px" }}
              >
                <img
                  src={previewImage}
                  alt={`${imageType} preview`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
                {/* Overlay to show crop area */}
                {originalDimensions && croppedDimensions && (
                  <div
                    className="absolute border-2 border-primary pointer-events-none"
                    style={{
                      top: "50%",
                      left: "50%",
                      width:
                        originalDimensions.width > 0
                          ? `${
                              (croppedDimensions.width /
                                originalDimensions.width) *
                              100
                            }%`
                          : "100%",
                      height:
                        originalDimensions.height > 0
                          ? `${
                              (croppedDimensions.height /
                                originalDimensions.height) *
                              100
                            }%`
                          : "100%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </div>
            </div>

            {originalDimensions && croppedDimensions && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Original: {originalDimensions.width} ×{" "}
                  {originalDimensions.height}
                </p>
                <p>
                  Cropped: {croppedDimensions.width} ×{" "}
                  {croppedDimensions.height}
                </p>
                <p className="mt-1 text-xs">
                  The highlighted area shows the portion that will be kept after
                  cropping to 9:16 ratio.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
