import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Define example image types
export type ExampleImageType = "model" | "garment";

// Example image structure
interface ExampleImage {
  id: string;
  url: string;
  thumbnailUrl: string; // Could be the same as url or a smaller version
  alt: string;
}

// Image category structure
interface ImageCategory {
  category: string;
  images: ExampleImage[];
}

// Props for the component
interface ExampleImagesProps {
  type: ExampleImageType;
  onSelect: (url: string) => void;
  displayMode?: "grid" | "row";
  selectedImages?: string[];
  multiSelect?: boolean;
}

const johnnyWasModels2: ExampleImage[] = [
  {
    id: "model1",
    url: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-3-7",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-3-7",
    alt: "Model with White Outfit",
  },
  {
    id: "model2",
    url: "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/o31127-2_brightwhite_1.jpg",
    thumbnailUrl:
      "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/o31127-2_brightwhite_1.jpg",
    alt: "Model with Printed Dress",
  },
  {
    id: "model3",
    url: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
    thumbnailUrl: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
    alt: "Model with Floral Top",
  },
  {
    id: "model4",
    url: "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/r32525-2_alliumia_1.jpg",
    thumbnailUrl:
      "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/r32525-2_alliumia_1.jpg",
    alt: "Model with Purple Outfit",
  },
  {
    id: "model5",
    url: "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/w32925-2_watermelon_1.jpg",
    thumbnailUrl:
      "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/w32925-2_watermelon_1.jpg",
    alt: "Model with Embroidered Top",
  },
  {
    id: "model6",
    url: "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/r35725-2_naperronprint_1.jpg",
    thumbnailUrl:
      "https://devlnkr.s3.ap-south-1.amazonaws.com/profile_templates/r35725-2_naperronprint_1.jpg",
    alt: "Model with Colorful Dress",
  },
];

// Johnny Was model images (already existing in the codebase)
const johnnyWasModels: ExampleImage[] = [
  {
    id: "model1",
    url: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
    alt: "Model with White Outfit",
  },
  {
    id: "model2",
    url: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-1-9?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-1-9?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
    alt: "Model with Printed Dress",
  },
  {
    id: "model3",
    url: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
    thumbnailUrl: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
    alt: "Model with Floral Top",
  },
  {
    id: "model4",
    url: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
    alt: "Model with Purple Outfit",
  },
  {
    id: "model5",
    url: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-3-7?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-3-7?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
    alt: "Model with Embroidered Top",
  },
  {
    id: "model6",
    url: "https://aem.johnnywas.com/is/image/oxf/l44824-e_dressblues_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/l44824-e_dressblues_1?$sfPDP3x$",
    alt: "Model with Colorful Dress",
  },
  {
    id: "model7",
    url: "https://aem.johnnywas.com/is/image/oxf/r32900-2_ecru_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/r32900-2_ecru_1?$sfPDP3x$",
    alt: "Model with White Blouse",
  },
];

// Johnny Was garment images
const johnnyWasGarments: ExampleImage[] = [
  {
    id: "garment1",
    url: "https://aem.johnnywas.com/is/image/oxf/l10325-2_navy_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/l10325-2_navy_1?$sfPDP3x$",
    alt: "Blue Dress",
  },
  {
    id: "garment2",
    url: "https://aem.johnnywas.com/is/image/oxf/c37025-1_black_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/c37025-1_black_1?$sfPDP3x$",
    alt: "Black Floral Top",
  },
  {
    id: "garment3",
    url: "https://aem.johnnywas.com/is/image/oxf/l31625-1_westernkasumi_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/l31625-1_westernkasumi_1?$sfPDP3x$",
    alt: "Patterned Kimono",
  },
  {
    id: "garment4",
    url: "https://aem.johnnywas.com/is/image/oxf/l38525-1_auroria_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/l38525-1_auroria_1?$sfPDP3x$",
    alt: "Printed Blouse",
  },
  {
    id: "garment5",
    url: "https://aem.johnnywas.com/is/image/oxf/o31126-o_offwhite_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/o31126-o_offwhite_1?$sfPDP3x$",
    alt: "White Embroidered Top",
  },
  {
    id: "garment6",
    url: "https://aem.johnnywas.com/is/image/oxf/r38324-o_black_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/r38324-o_black_1?$sfPDP3x$",
    alt: "Black Buttoned Top",
  },
  {
    id: "garment7",
    url: "https://aem.johnnywas.com/is/image/oxf/c37125-1_maybournscarf_1?$sfPDP3x$",
    thumbnailUrl:
      "https://aem.johnnywas.com/is/image/oxf/c37125-1_maybournscarf_1?$sfPDP3x$",
    alt: "Colorful Patterned Top",
  },
];

// Initialize categories
const modelCategories: ImageCategory[] = [
  { category: "From Johnny Was", images: johnnyWasModels },
  { category: "General Models", images: [] }, // Will be populated from JSON
];

const garmentCategories: ImageCategory[] = [
  { category: "From Johnny Was", images: johnnyWasGarments },
  { category: "General Garments", images: [] }, // Will be populated from JSON
];

export function ExampleImages({
  type,
  onSelect,
  displayMode = "grid",
  selectedImages = [],
  multiSelect = false,
}: ExampleImagesProps) {
  const [selectedCategory, setSelectedCategory] = useState("From Johnny Was");
  const [categories, setCategories] = useState<ImageCategory[]>(
    type === "model" ? modelCategories : garmentCategories
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedImages, setDisplayedImages] = useState<ExampleImage[]>([]);
  const imagesPerPage = 5;

  // Fetch images from JSON files on component mount
  useEffect(() => {
    async function fetchImages() {
      try {
        if (type === "model") {
          // Fetch model images
          const response = await fetch("/data/hulu-models.json");
          const data = await response.json();

          // Update the General Models category
          const updatedCategories = [...categories];
          const generalModelIndex = updatedCategories.findIndex(
            (cat) => cat.category === "General Models"
          );

          if (generalModelIndex !== -1) {
            updatedCategories[generalModelIndex].images = data.images;
            setCategories(updatedCategories);
          }
        } else {
          // Fetch garment images
          const response = await fetch("/data/hulu-garments.json");
          const data = await response.json();

          // Update the General Garments category
          const updatedCategories = [...categories];
          const generalGarmentIndex = updatedCategories.findIndex(
            (cat) => cat.category === "General Garments"
          );

          if (generalGarmentIndex !== -1) {
            updatedCategories[generalGarmentIndex].images = data.images;
            setCategories(updatedCategories);
          }
        }
      } catch (error) {
        console.error(`Error loading ${type} images:`, error);
      }
    }

    fetchImages();
  }, [type]);

  // Update displayed images when category or page changes
  useEffect(() => {
    const selectedCategoryObj = categories.find(
      (cat) => cat.category === selectedCategory
    );
    if (selectedCategoryObj) {
      const images = selectedCategoryObj.images;
      setTotalPages(Math.ceil(images.length / imagesPerPage));

      // Calculate start and end indices for current page
      const startIndex = (currentPage - 1) * imagesPerPage;
      const endIndex = Math.min(startIndex + imagesPerPage, images.length);

      // Get the slice of images for current page
      setDisplayedImages(images.slice(startIndex, endIndex));
    }
  }, [categories, selectedCategory, currentPage]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle prev/next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="w-full">
      {/* Only show category selector if displayMode is grid */}
      {displayMode !== "row" && (
        <div className="w-full max-w-lg mb-4 mx-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select image source" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.category} value={category.category}>
                  {category.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="w-full">
        {displayMode === "row" ? (
          // Single row scrollable display
          <div className="flex overflow-x-auto gap-2 no-scrollbar">
            {johnnyWasModels2.slice(0, 7).map((example) => (
              <div
                key={example.id}
                className="flex-none relative group"
                onClick={() => onSelect(example.url)}
              >
                <div
                  className={cn(
                    "relative h-16 w-14 overflow-hidden rounded-md border cursor-pointer transition-all hover:opacity-90",
                    selectedImages?.includes(example.url)
                      ? "border-primary ring-2 ring-primary"
                      : "hover:border-primary"
                  )}
                >
                  <Image
                    src={example.thumbnailUrl}
                    alt={example.alt}
                    fill
                    className="object-cover"
                  />
                  {selectedImages?.includes(example.url) && (
                    <div className="absolute inset-0 bg-primary/20" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Original grid display
          <div
            className={cn(
              "grid gap-1",
              displayMode === "grid" ? "grid-cols-3" : ""
            )}
          >
            {displayedImages.map((example, index) => (
              <div
                key={index}
                className={cn(
                  "relative aspect-[3/4] cursor-pointer group overflow-hidden rounded-md",
                  selectedImages.includes(example.url) && "ring-2 ring-primary"
                )}
                onClick={() => onSelect(example.url)}
              >
                <Image
                  src={example.thumbnailUrl}
                  alt={example.alt}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                />
                {selectedImages.includes(example.url) && (
                  <div className="absolute inset-0 bg-primary/20" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show pagination only in grid mode */}
      {displayMode !== "row" && totalPages > 1 && (
        <Pagination className="mt-2">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              // Show limited page numbers for better UI
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (pageNumber === currentPage - 2 && currentPage > 3) ||
                (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}

            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
