export interface ProductDetails {
    id: string;
    name: string;
    price: number;
    description: string;
    productDetails: string[];
    shippingReturns: string;
    colors: {
        name: string;
        colorCode: string;
    }[];
    images: {
        id: string;
        url: string;
        thumbnailUrl: string;
        alt: string;
        sizes: string[];
    }[];
    sizes: {
        standard: { label: string; available: boolean; }[];
        plus: { label: string; available: boolean; }[];
        petite: { label: string; available: boolean; }[];
    };
    recommendations: {
        id: string;
        name: string;
        price: number;
        imageUrl: string;
        colors: number;
    }[];
}

export const products: { [key: string]: ProductDetails } = {
    "eva-dress-001": {
        id: "eva-dress-001",
        name: "EVA DRESS",
        price: 328,
        description: `The Eva Dress is a stunning floral maxi dress that embodies effortless elegance. 
        Crafted from lightweight fabric, this dress features a flattering V-neckline, short flutter 
        sleeves, and a flowing silhouette that moves beautifully with you. The vibrant sage pink 
        floral print adds a romantic touch, making it perfect for both special occasions and casual 
        gatherings. The dress includes a partial button front closure and a comfortable elastic waist 
        that creates a feminine shape.`,
        productDetails: [
            "V-neckline with button front",
            "Short flutter sleeves",
            "Elastic waist",
            "Side seam pockets",
            "Maxi length",
            "100% Rayon",
            "Machine wash cold, tumble dry low",
            "Imported"
        ],
        shippingReturns: "Free standard shipping on all orders over $150. Returns accepted within 30 days of delivery.",
        colors: [
            {
                name: "Sage Pink",
                colorCode: "#F5C4C4"
            }
        ],
        images: [
            {
                id: "model1",
                url: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
                thumbnailUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
                alt: "Model with White Outfit",
                sizes: ["XS", "S", "M"]
            },
            {
                id: "model2",
                url: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-1-9?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
                thumbnailUrl: "https://aem.johnnywas.com/is/image/oxf/B_2-up%20images%20_%20CTA_1-1-9?$2UpImagesandCopyComponent_1536x2306_D$&qlt-70",
                alt: "Model with Printed Dress",
                sizes: ["L", "XL"]
            },
            {
                id: "model3",
                url: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
                thumbnailUrl: "https://i.ibb.co/MkNtTc1X/B-2-up-images-CTA-1-2-7-1.jpg",
                alt: "Model with Floral Top",
                sizes: ["S"]
            },
            {
                id: "model4",
                url: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
                thumbnailUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
                alt: "Model with Purple Outfit",
                sizes: ["XL"]
            }
        ],
        sizes: {
            standard: [
                { label: "XXS", available: false },
                { label: "XS", available: true },
                { label: "S", available: true },
                { label: "M", available: true },
                { label: "L", available: true },
                { label: "XL", available: true },
                { label: "XXL", available: true }
            ],
            plus: [
                { label: "1X", available: true },
                { label: "2X", available: true },
                { label: "3X", available: true }
            ],
            petite: [
                { label: "PXXS", available: false },
                { label: "PXS", available: true },
                { label: "PS", available: true },
                { label: "PM", available: true },
                { label: "PL", available: true },
                { label: "PXL", available: true }
            ]
        },
        recommendations: [
            {
                id: "1",
                name: "MAYA DRESS",
                price: 298,
                imageUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
                colors: 3
            },
            {
                id: "2",
                name: "BELLA BLOUSE",
                price: 248,
                imageUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
                colors: 2
            },
            {
                id: "3",
                name: "SOPHIA MAXI DRESS",
                price: 368,
                imageUrl: "https://aem.johnnywas.com/is/image/oxf/l44824-e_dressblues_1?$sfPDP3x$",
                colors: 4
            },
            {
                id: "4",
                name: "LUNA TOP",
                price: 198,
                imageUrl: "https://aem.johnnywas.com/is/image/oxf/r32900-2_ecru_1?$sfPDP3x$",
                colors: 2
            }
        ]
    },
    "maya-dress-002": {
        id: "maya-dress-002",
        name: "MAYA DRESS",
        price: 298,
        description: `The Maya Dress is a bohemian masterpiece that captures the essence of free-spirited style. 
        This stunning maxi dress features intricate embroidery, a relaxed silhouette, and beautiful bell sleeves. 
        The deep blue base is adorned with colorful floral patterns that make this piece truly unique. Perfect for 
        both special occasions and casual outings, this dress combines comfort with sophisticated style.`,
        productDetails: [
            "Round neckline with tassel ties",
            "Bell sleeves",
            "Embroidered details",
            "Side slits",
            "Maxi length",
            "100% Rayon",
            "Machine wash cold, tumble dry low",
            "Imported"
        ],
        shippingReturns: "Free standard shipping on all orders over $150. Returns accepted within 30 days of delivery.",
        colors: [
            {
                name: "Deep Blue",
                colorCode: "#1B365D"
            },
            {
                name: "Desert Rose",
                colorCode: "#D7A4A4"
            }
        ],
        images: [
            {
                id: "maya1",
                url: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
                thumbnailUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
                alt: "Maya Dress in Deep Blue",
                sizes: ["M"]
            },
            {
                id: "maya2",
                url: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
                thumbnailUrl: "https://aem.johnnywas.com/is/image/oxf/l38025-1_kasumi_1?$sfPDP3x$",
                alt: "Maya Dress Detail View",
                sizes: ["M"]
            }
        ],
        sizes: {
            standard: [
                { label: "XXS", available: true },
                { label: "XS", available: true },
                { label: "S", available: true },
                { label: "M", available: false },
                { label: "L", available: true },
                { label: "XL", available: true }
            ],
            plus: [
                { label: "1X", available: true },
                { label: "2X", available: true },
                { label: "3X", available: false }
            ],
            petite: [
                { label: "PXS", available: true },
                { label: "PS", available: true },
                { label: "PM", available: true },
                { label: "PL", available: true }
            ]
        },
        recommendations: [
            {
                id: "1",
                name: "EVA DRESS",
                price: 328,
                imageUrl: "https://aem.johnnywas.com/is/image/oxf/l44824-e_dressblues_1?$sfPDP3x$",
                colors: 2
            },
            // ... add more recommendations
        ]
    },
    "bella-blouse-003": {
        id: "bella-blouse-003",
        name: "BELLA BLOUSE",
        price: 248,
        description: `The Bella Blouse is a versatile piece that embodies elegant simplicity. 
        With its flowing silhouette and delicate details, this blouse transitions seamlessly from 
        day to night. The lightweight fabric and subtle embroidery make it a perfect addition to 
        any wardrobe, while the relaxed fit ensures all-day comfort.`,
        productDetails: [
            "V-neckline",
            "3/4 length sleeves",
            "Subtle embroidery",
            "Relaxed fit",
            "100% Silk",
            "Dry clean only",
            "Imported"
        ],
        shippingReturns: "Free standard shipping on all orders over $150. Returns accepted within 30 days of delivery.",
        colors: [
            {
                name: "Ivory",
                colorCode: "#FFFFF0"
            },
            {
                name: "Sage",
                colorCode: "#9CA88C"
            }
        ],
        images: [
            {
                id: "bella1",
                url: "https://aem.johnnywas.com/is/image/oxf/r32900-2_ecru_1?$sfPDP3x$",
                thumbnailUrl: "https://aem.johnnywas.com/is/image/oxf/r32900-2_ecru_1?$sfPDP3x$",
                alt: "Bella Blouse in Ivory",
                sizes: ["M"]
            }
        ],
        sizes: {
            standard: [
                { label: "XXS", available: true },
                { label: "XS", available: true },
                { label: "S", available: true },
                { label: "M", available: true },
                { label: "L", available: true },
                { label: "XL", available: true }
            ],
            plus: [
                { label: "1X", available: true },
                { label: "2X", available: true },
                { label: "3X", available: true }
            ],
            petite: [
                { label: "PXS", available: true },
                { label: "PS", available: true },
                { label: "PM", available: true },
                { label: "PL", available: true }
            ]
        },
        recommendations: [
            {
                id: "1",
                name: "EVA DRESS",
                price: 328,
                imageUrl: "https://aem.johnnywas.com/is/image/oxf/l14724-1_denimprint_1?$sfPDP3x$",
                colors: 1
            }
            // ... add more recommendations
        ]
    }
}; 