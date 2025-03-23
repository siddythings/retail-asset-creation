'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GalleryImageSelector } from '@/components/gallery-image-selector';

const AVAILABLE_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL"
];

const AVAILABLE_COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Purple",
  "Pink",
  "Gray",
  "Brown",
  "Navy",
  "Beige"
];

interface SizeImages {
  size: string;
  images: string[];
}

interface Color {
  name: string;
  colorCode: string;
}

interface SizeAvailability {
  label: string;
  available: boolean;
}

interface SizeCategories {
  standard: SizeAvailability[];
  plus: SizeAvailability[];
  petite: SizeAvailability[];
}

interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  size: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  productDetails: string[];
  shippingReturns: string;
  colors: Color[];
  images: ProductImage[];
  sizes: SizeCategories;
}

const steps = [
  { id: 'basic', title: 'Basic Info' },
  { id: 'details', title: 'Product Details' },
  { id: 'sizes', title: 'Sizes & Colors' },
  { id: 'images', title: 'Images' },
  { id: 'review', title: 'Review' }
];

export default function ProductGenerator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    productDetails: '',
    shippingReturns: '',
    sizes: [] as string[],
    colors: [] as Color[],
    colorName: '',
    colorCode: '#000000',
  });
  const [sizeImages, setSizeImages] = useState<SizeImages[]>([]);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSizeSelect = (size: string) => {
    setProductData(prev => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      
      // Update sizeImages accordingly
      if (!prev.sizes.includes(size)) {
        setSizeImages(prev => [...prev, { size, images: [] }]);
      } else {
        setSizeImages(prev => prev.filter(si => si.size !== size));
      }
      
      return {
        ...prev,
        sizes: newSizes
      };
    });
  };

  const handleColorSelect = (color: string) => {
    setProductData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleRemoveSize = (size: string) => {
    setProductData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size)
    }));
  };

  const handleRemoveColor = (colorName: string) => {
    setProductData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c.name !== colorName)
    }));
  };

  const handleAddColor = () => {
    if (!productData.colorName || !productData.colorCode) return;
    
    setProductData(prev => ({
      ...prev,
      colors: [...prev.colors, { 
        name: prev.colorName, 
        colorCode: prev.colorCode 
      }],
      colorName: '',
      colorCode: '#000000'
    }));
  };

  const handleGalleryImageSelect = (size: string) => (imageUrl: string) => {
    setSizeImages(prev => {
      const sizeIndex = prev.findIndex(si => si.size === size);
      if (sizeIndex === -1) {
        return [...prev, { size, images: [imageUrl] }];
      }

      const newImages = [...prev];
      if (!newImages[sizeIndex].images.includes(imageUrl)) {
        newImages[sizeIndex] = {
          ...newImages[sizeIndex],
          images: [...newImages[sizeIndex].images, imageUrl]
        };
      }
      return newImages;
    });
  };

  const handleRemoveImage = (size: string, imageIndex: number) => {
    setSizeImages(prev => {
      const sizeIndex = prev.findIndex(si => si.size === size);
      if (sizeIndex === -1) return prev;

      const newImages = [...prev];
      newImages[sizeIndex] = {
        ...newImages[sizeIndex],
        images: newImages[sizeIndex].images.filter((_, idx) => idx !== imageIndex)
      };
      return newImages;
    });
  };

  const saveToLocalStorage = () => {
    // Generate a unique product ID using timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const productId = `product-${timestamp}-${randomStr}`;

    // Transform sizeImages into the required format
    const formattedImages: ProductImage[] = sizeImages.flatMap(sizeImage => 
      sizeImage.images.map((url, index) => ({
        id: `model${index + 1}_${sizeImage.size}`,
        url: url,
        thumbnailUrl: url,
        alt: `Model with ${productData.title} - Size ${sizeImage.size}`,
        size: sizeImage.size
      }))
    );

    // Transform sizes into categories
    const sizesCategories: SizeCategories = {
      standard: AVAILABLE_SIZES.map(size => ({
        label: size,
        available: productData.sizes.includes(size)
      })),
      plus: ["1X", "2X", "3X"].map(size => ({
        label: size,
        available: productData.sizes.includes(size)
      })),
      petite: ["PXXS", "PXS", "PS", "PM", "PL", "PXL"].map(size => ({
        label: size,
        available: productData.sizes.includes(size)
      }))
    };

    // Create the formatted product
    const formattedProduct: Product = {
      id: productId,
      name: productData.title.toUpperCase(),
      price: parseFloat(productData.price) || 0,
      description: productData.description,
      productDetails: productData.productDetails.split('\n').filter(detail => detail.trim()),
      shippingReturns: productData.shippingReturns,
      colors: productData.colors,
      images: formattedImages,
      sizes: sizesCategories
    };

    // Get existing data from localStorage
    const existingData: Product[] = JSON.parse(localStorage.getItem('products') || '[]');

    // Add new product to existing data
    existingData.push(formattedProduct);

    // Save back to localStorage
    localStorage.setItem('products', JSON.stringify(existingData));

    // Reload the page after saving
    window.location.reload();
  };

  const handleGenerate = async () => {
    if (!productData.title || !productData.description || 
        productData.sizes.length === 0 || productData.colors.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();
      setGeneratedDescription(data.description);

      // Save to localStorage after successful generation
      const productId = saveToLocalStorage();
      
      // Show success message
      alert(`Product saved successfully! Product ID: ${productId}`);
    } catch (error) {
      console.error('Error generating description:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Product Title</label>
        <Input
          value={productData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter product title"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Basic Description</label>
        <Textarea
          value={productData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter basic product description"
          className="w-full min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Price</label>
        <Input
          type="number"
          value={productData.price}
          onChange={(e) => handleInputChange('price', e.target.value)}
          placeholder="Enter product price"
          className="w-full"
        />
      </div>
    </div>
  );

  const renderProductDetails = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Product Details</label>
        <Textarea
          value={productData.productDetails}
          onChange={(e) => handleInputChange('productDetails', e.target.value)}
          placeholder="Enter product details (one per line)"
          className="w-full min-h-[150px]"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Shipping & Returns</label>
        <Textarea
          value={productData.shippingReturns}
          onChange={(e) => handleInputChange('shippingReturns', e.target.value)}
          placeholder="Enter shipping and returns information"
          className="w-full"
        />
      </div>
    </div>
  );

  const renderSizesColors = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Available Sizes</label>
        <Select onValueChange={handleSizeSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sizes" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 mt-2">
          {productData.sizes.map((size) => (
            <Badge key={size} variant="secondary">
              {size}
              <button
                onClick={() => handleRemoveSize(size)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Color</label>
        <div className="flex gap-2">
          <Input
            value={productData.colorName}
            onChange={(e) => handleInputChange('colorName', e.target.value)}
            placeholder="Color name"
            className="w-full"
          />
          <Input
            type="color"
            value={productData.colorCode}
            onChange={(e) => handleInputChange('colorCode', e.target.value)}
            className="w-20"
          />
          <Button onClick={handleAddColor} size="sm">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {productData.colors.map((color) => (
            <Badge 
              key={color.name} 
              variant="secondary"
              style={{ backgroundColor: color.colorCode }}
            >
              {color.name}
              <button
                onClick={() => handleRemoveColor(color.name)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderImages = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {productData.sizes.map((size) => (
        <div key={size} className="border rounded-lg p-2">
          <h3 className="text-sm font-semibold mb-1">Size: {size}</h3>
          
          <div className="space-y-2">
            <GalleryImageSelector
              onSelectImage={handleGalleryImageSelect(size)}
              buttonText="From Gallery"
              allowedTypes={[
                "all",
                "model-generation",
                "try-on",
                "image-tagging",
                "bg-generator",
                "bg-removal",
              ]}
              buttonVariant="outline"
              buttonClassName="w-full"
            />

            <div className="grid grid-cols-3 gap-1">
              {sizeImages
                .find(si => si.size === size)
                ?.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Size ${size} - Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      onClick={() => handleRemoveImage(size, index)}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review Product Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Basic Information</h4>
          <p>Title: {productData.title}</p>
          <p>Price: ${productData.price}</p>
        </div>
        <div>
          <h4 className="font-medium">Sizes & Colors</h4>
          <p>Sizes: {productData.sizes.join(', ')}</p>
          <p>Colors: {productData.colors.map(c => c.name).join(', ')}</p>
        </div>
      </div>
      {/* Add more review sections */}
    </div>
  );

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return renderBasicInfo();
      case 'details':
        return renderProductDetails();
      case 'sizes':
        return renderSizesColors();
      case 'images':
        return renderImages();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Product Description Generator</h1>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index <= currentStep ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  index <= currentStep ? 'bg-primary text-white' : 'bg-gray-200'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-1 bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {renderStepContent()}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={handlePrevious}
          variant="outline"
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        {currentStep === steps.length - 1 ? (
          <Button onClick={saveToLocalStorage}>
            Generate & Save
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
