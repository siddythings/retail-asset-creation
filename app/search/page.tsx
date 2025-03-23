'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Product {
    id: number
    name: string
    description: string
    price: number
    sizes: string[]
    colors: string[]
    imageUrl: string
}

// Sample product data - replace with your actual data source
const sampleProducts: Product[] = [
    {
        id: 1,
        name: "Denim Print Tunic",
        description: "Elegant tunic with unique denim print pattern and flowing silhouette",
        price: 248.00,
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Denim Print", "White"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$"
    },
    {
        id: 2,
        name: "Floral Maxi Dress",
        description: "Stunning floral print maxi dress with bohemian details",
        price: 328.00,
        sizes: ["XS", "S", "M", "L"],
        colors: ["Multi", "Black"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-1-9?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70"
    },
    {
        id: 3,
        name: "Embroidered Floral Top",
        description: "Luxurious embroidered top with intricate floral details",
        price: 198.00,
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Blue"],
        imageUrl: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg"
    },
    {
        id: 4,
        name: "Kasumi Print Kimono",
        description: "Elegant kimono-style jacket with traditional Kasumi print",
        price: 278.00,
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Purple", "Blue"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$"
    },
    {
        id: 5,
        name: "Boho Embroidered Blouse",
        description: "Light and airy blouse with detailed embroidery work",
        price: 188.00,
        sizes: ["XS", "S", "M", "L"],
        colors: ["Natural", "Black"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-3-7?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70"
    },
    {
        id: 6,
        name: "Dress Blues Tunic",
        description: "Sophisticated tunic in deep blue with intricate pattern work",
        price: 268.00,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Dress Blues", "White"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l44824-e_dressblues_1?$sfPDP3x$"
    },
    {
        id: 7,
        name: "Ecru Lace Blouse",
        description: "Delicate lace blouse in classic ecru shade",
        price: 228.00,
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Ecru", "Black"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/r32900-2_ecru_1?$sfPDP3x$"
    },
    {
        id: 8,
        name: "Red Evening Dress",
        description: "Elegant red evening dress with a flowing silhouette",
        price: 298.00,
        sizes: ["S", "M", "L"],
        colors: ["Red", "Black"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_red_1?$sfPDP3x$"
    },
    {
        id: 9,
        name: "Blue Silk Top",
        description: "Classic silk top in vibrant blue shade",
        price: 168.00,
        sizes: ["XS", "S", "M"],
        colors: ["Blue", "White"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_blue_1?$sfPDP3x$"
    },
    {
        id: 10,
        name: "Black Embroidered Tunic",
        description: "Sophisticated black tunic with detailed embroidery",
        price: 228.00,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Navy"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l44824-e_black_1?$sfPDP3x$"
    },
    {
        id: 11,
        name: "White Lace Blouse XL",
        description: "Romantic white lace blouse in extended sizes",
        price: 188.00,
        sizes: ["L", "XL", "XXL"],
        colors: ["White", "Ecru"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/r32900-2_white_1?$sfPDP3x$"
    },
    {
        id: 12,
        name: "Purple Silk Kimono",
        description: "Luxurious purple silk kimono with floral pattern",
        price: 328.00,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Purple", "Multi"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_purple_1?$sfPDP3x$"
    },
    {
        id: 13,
        name: "Red Cocktail Dress",
        description: "Stunning red cocktail dress with fitted silhouette",
        price: 278.00,
        sizes: ["XS", "S", "M", "L"],
        colors: ["Red", "Purple"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_red_2?$sfPDP3x$"
    },
    {
        id: 14,
        name: "Blue Casual Top",
        description: "Comfortable blue top for everyday wear",
        price: 148.00,
        sizes: ["XS", "S", "M"],
        colors: ["Blue", "Black"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_blue_2?$sfPDP3x$"
    },
    {
        id: 15,
        name: "Black Velvet Tunic",
        description: "Luxurious black velvet tunic with side slits",
        price: 248.00,
        sizes: ["S", "M", "L"],
        colors: ["Black", "Blue"],
        imageUrl: "https://aem.johnnywas.com/is/image/oxf/l44824-e_black_2?$sfPDP3x$"
    }
]

// Add this color mapping object after the product data
const colorMap: { [key: string]: string } = {
    // Basic colors
    'White': '#FFFFFF',
    'Black': '#000000',
    'Blue': '#2563EB',
    'Purple': '#7C3AED',
    'Red': '#DC2626',
    'Green': '#059669',
    'Yellow': '#F59E0B',
    'Pink': '#EC4899',
    'Gray': '#6B7280',
    'Brown': '#92400E',

    // Special colors
    'Denim Print': '#34548c',
    'Multi': 'linear-gradient(90deg, #F59E0B, #EC4899, #2563EB)',
    'Natural': '#E5E0D8',
    'Ecru': '#D3CBC1',
    'Dress Blues': '#1E3A8A',
}

// Add this helper function to get text color based on background
const getTextColor = (bgColor: string): string => {
    // For light background colors, return dark text
    const lightColors = ['#FFFFFF', '#E5E0D8', '#D3CBC1'];
    return lightColors.includes(bgColor) ? '#1F2937' : '#FFFFFF';
}

// Add these helper functions at the top of the file
const extractColors = (query: string): string[] => {
    const commonColors = [
        'red', 'blue', 'black', 'white', 'navy', 'purple',
        'green', 'yellow', 'pink', 'gray', 'brown', 'multi',
        'natural', 'ecru', 'denim'
    ]
    return commonColors.filter(color =>
        query.toLowerCase().includes(color.toLowerCase())
    )
}

const extractSizes = (query: string): string[] => {
    const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    return commonSizes.filter(size =>
        query.toUpperCase().includes(` ${size} `) ||
        query.toUpperCase().includes(`SIZE ${size}`) ||
        query.toUpperCase().includes(`${size} SIZE`)
    )
}

const extractProductTypes = (query: string): string[] => {
    const productTypes = [
        'dress', 'top', 'blouse', 'tunic', 'kimono',
        'shirt', 'jacket', 'pants', 'skirt'
    ]
    return productTypes.filter(type =>
        query.toLowerCase().includes(type.toLowerCase())
    )
}

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const filterProducts = (products: Product[], query: string) => {
        if (!query.trim()) return products

        const colors = extractColors(query)
        const sizes = extractSizes(query)
        const types = extractProductTypes(query)

        return products.filter(product => {
            const matchesColor = colors.length === 0 ||
                colors.some(color =>
                    product.colors.some(productColor =>
                        productColor.toLowerCase().includes(color.toLowerCase())
                    )
                )

            const matchesSize = sizes.length === 0 ||
                sizes.some(size => product.sizes.includes(size))

            const matchesType = types.length === 0 ||
                types.some(type =>
                    product.name.toLowerCase().includes(type.toLowerCase()) ||
                    product.description.toLowerCase().includes(type.toLowerCase())
                )

            return matchesColor && matchesSize && matchesType
        })
    }

    const filteredProducts = filterProducts(sampleProducts, searchQuery)

    // Example search suggestions based on available filters
    const getSearchPlaceholder = () => {
        const suggestions = [
            "blue dress in size M",
            "white top size S",
            "black tunic XL",
            "floral kimono L size",
        ]
        return suggestions[Math.floor(Math.random() * suggestions.length)]
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Updated search input with better placeholder */}
            <div className="mb-12">
                <div className="relative max-w-md mx-auto">
                    <input
                        type="text"
                        placeholder={`Try: "${getSearchPlaceholder()}"`}
                        className="w-full px-6 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 transition-colors pl-12"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {/* Search tips */}
                <div className="text-center mt-2 text-sm text-gray-500">
                    Try searching by color, size, or type of clothing (e.g., "blue dress size M")
                </div>
            </div>

            {/* Redesigned compact product grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                    >
                        {/* Image container */}
                        <div className="relative aspect-[4/5] w-full overflow-hidden">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                priority={product.id <= 4}
                                className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                                quality={85}
                            />
                            {/* Quick view button */}
                            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button className="w-full bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-xs font-medium">
                                    Quick View
                                </button>
                            </div>
                        </div>

                        {/* Compact product info */}
                        <div className="p-3">
                            {/* Name and price */}
                            <div className="mb-2">
                                <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate">
                                    {product.name}
                                </h3>
                                <p className="text-blue-600 font-bold text-sm mt-0.5">
                                    ${product.price.toFixed(2)}
                                </p>
                            </div>

                            {/* Sizes and Colors in one row */}
                            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">Sizes:</span>
                                    <span className="truncate">{product.sizes.join(", ")}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium">Colors:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {product.colors.map((color) => {
                                            const bgColor = colorMap[color] || '#F3F4F6';
                                            const isGradient = bgColor.includes('linear-gradient');

                                            return (
                                                <span
                                                    key={`${product.id}-${color}`}
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px]"
                                                    style={{
                                                        background: bgColor,
                                                        color: isGradient ? '#FFFFFF' : getTextColor(bgColor),
                                                        border: bgColor === '#FFFFFF' ? '1px solid #E5E7EB' : 'none',
                                                    }}
                                                >
                                                    {color}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Add to cart button */}
                            <button className="w-full mt-3 bg-gray-900 text-white py-2 rounded text-xs font-medium hover:bg-gray-800 transition-colors duration-300">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
