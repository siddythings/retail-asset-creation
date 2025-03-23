'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Heart, MapPin, ChevronDown } from 'lucide-react';
import { products } from '../../data/products';
import { notFound } from 'next/navigation';

interface Props {
    params: {
        productId: string;
    };
}

interface ImageType {
    id: string;
    url: string;
    thumbnailUrl: string;
    alt: string;
    sizes: string[]; // Add sizes array to track which sizes are shown in each image
}

export default function ProductDescription({ params }: Props) {
    const product = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('products') || '[]').find((p: any) => p.id === params.productId)
        : products[params.productId];
    const product_temp = products["eva-dress-001"];

    // If product doesn't exist, show 404
    if (!product) {
        notFound();
    }

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedFit, setSelectedFit] = useState('STANDARD');
    const [openSection, setOpenSection] = useState<string | null>(null);

    const getCurrentSizes = () => {
        switch (selectedFit) {
            case 'PLUS':
                return product.sizes.plus;
            case 'PETITE':
                return product.sizes.petite;
            default:
                return product.sizes.standard;
        }
    };

    const accordionSections = {
        'Description': product.description,
        'Product Details': product.productDetails.join('\n'),
        'Shipping & Returns': product.shippingReturns
    };

    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);
    };

    const handleFitSelect = (fit: string) => {
        setSelectedFit(fit);
        setSelectedSize('');
    };

    const handleSectionClick = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    // Add this function to filter images based on selected size
    const getFilteredImages = () => {
        if (!selectedSize) {
            return product.images;
        }
        return product.images.filter((image: ImageType) => 
            image.size == selectedSize
        );
    };

    // Add this to track the filtered images
    const filteredImages = getFilteredImages();
    
    // Add this to ensure currentImageIndex stays within bounds when filtering
    useEffect(() => {
        if (currentImageIndex >= filteredImages.length) {
            setCurrentImageIndex(0);
        }
    }, [selectedSize, filteredImages.length, currentImageIndex]);

    return (
        <div className="bg-white">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 pt-8 md:pt-12">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                        {/* Left side - Image Gallery */}
                        <div className="relative flex gap-2 w-full">
                            {/* Thumbnail Column */}
                            <div className="hidden md:flex flex-col gap-2 w-20">
                                {filteredImages.map((image: ImageType, index: number) => (
                                    <div
                                        key={image.id}
                                        className={`relative aspect-[3/4] cursor-pointer overflow-hidden rounded-sm ${
                                            currentImageIndex === index
                                                ? 'ring-2 ring-black'
                                                : 'hover:ring-2 hover:ring-gray-300'
                                        }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    >
                                        <Image
                                            src={image.thumbnailUrl}
                                            alt={image.alt}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 0px, 80px"
                                            quality={90}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Main Image */}
                            <div className="flex-1 min-h-0">
                                <div className="relative aspect-[3/4] md:aspect-[2/3] w-full rounded-lg overflow-hidden">
                                    {filteredImages.length > 0 && (
                                        <Image
                                            src={filteredImages[currentImageIndex].url}
                                            alt={filteredImages[currentImageIndex].alt}
                                            fill
                                            className="object-contain"
                                            priority={true}
                                            sizes="(max-width: 640px) 92vw, 
                                                   (max-width: 1024px) 45vw,
                                                   35vw"
                                            quality={100}
                                        />
                                    )}
                                    <button className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-2.5 text-sm font-medium hover:bg-white transition-colors rounded-full">
                                        Style Guide
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Product Details */}
                        <div className="space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-light tracking-wide text-[#211E1E]">{product.name}</h1>
                                    <div className="mt-4 space-y-2">
                                        <p className="text-2xl font-medium">${product.price}</p>
                                        <p className="text-sm text-gray-600">
                                            4 interest-free payments of ${(product.price / 4).toFixed(2)} with <span className="font-medium">Afterpay</span>
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                    <Heart className="w-6 h-6" strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Color Selection */}
                            {product.colors && product.colors.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-[#211E1E]">COLOR: {product.colors[0].name}</p>
                                    <div className="flex gap-3">
                                        {product.colors.map(color => (
                                            <button key={color.name} className="w-12 h-12 rounded-full p-0.5 ring-2 ring-black">
                                                <div className="w-full h-full rounded-full" style={{ backgroundColor: color.colorCode }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            <div className="space-y-6">
                                <div className="flex border-b border-[#211E1E]">
                                    {['STANDARD', 'PLUS', 'PETITE'].map((fit) => (
                                        <button
                                            key={fit}
                                            className={`px-6 py-2.5 text-sm ${
                                                fit === selectedFit
                                                    ? 'border-b-2 border-[#211E1E] font-medium'
                                                    : 'text-gray-500 hover:text-[#211E1E]'
                                            }`}
                                            onClick={() => handleFitSelect(fit)}
                                        >
                                            {fit}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                    {getCurrentSizes().map(({ label, available }) => (
                                        <button
                                            key={label}
                                            disabled={!available}
                                            className={`py-3 rounded ${
                                                selectedSize === label
                                                    ? 'bg-[#211E1E] text-white'
                                                    : available
                                                        ? 'border hover:border-[#211E1E]'
                                                        : 'border border-gray-200 text-gray-300 cursor-not-allowed'
                                            }`}
                                            onClick={() => handleSizeSelect(label)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Guide and Predictor */}
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <button className="flex items-center gap-2 hover:text-gray-600">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">?</span>
                                    <span className="underline">Fit Predictor</span>
                                </button>
                                <button className="underline hover:text-gray-600">Size Guide</button>
                            </div>

                            {/* Add to Bag and Actions */}
                            <div className="space-y-4">
                                <button className="w-full bg-[#211E1E] text-white py-4 text-sm font-medium hover:bg-black">
                                    Add to Bag
                                </button>

                                <button className="w-full flex items-center justify-center gap-2 py-4 border hover:bg-gray-50 transition-colors">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">Find in Store</span>
                                </button>
                            </div>

                            {/* Accordion Sections */}
                            <div className="space-y-4 pt-6">
                                {Object.entries(accordionSections).map(([section, content]) => (
                                    <div key={section} className="border-t border-[#211E1E]/10">
                                        <button
                                            className="w-full flex justify-between items-center py-4 hover:text-[#211E1E]/70"
                                            onClick={() => handleSectionClick(section)}
                                        >
                                            <span className="font-medium text-[#211E1E]">{section}</span>
                                            <ChevronDown
                                                className={`w-5 h-5 transition-transform duration-200 ${
                                                    openSection === section ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>
                                        {openSection === section && (
                                            <div className="pb-6 text-sm text-gray-600 whitespace-pre-line">
                                                {content}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Our Favorites Section */}
                    <div className="mt-20 mb-16">
                        <h2 className="text-2xl font-light mb-8 text-center text-[#211E1E]">
                            OUR FAVORITES FOR YOU
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {product_temp.recommendations.map((recommendation) => (
                                <div key={recommendation.id} className="space-y-3">
                                    <div className="relative aspect-[3/4] group cursor-pointer">
                                        <Image
                                            src={recommendation.imageUrl}
                                            alt={recommendation.name}
                                            fill
                                            className="object-cover rounded-lg"
                                            sizes="(max-width: 640px) 45vw, 
                                                   (max-width: 1024px) 25vw,
                                                   20vw"
                                        />
                                        <button className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm 
                                            px-4 py-2 text-sm font-medium hover:bg-white transition-colors rounded-full">
                                            Quick View
                                        </button>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="font-medium">{recommendation.name}</h3>
                                        <p className="text-gray-600">${recommendation.price}</p>
                                        <p className="text-sm text-gray-500">{recommendation.colors} colors</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 