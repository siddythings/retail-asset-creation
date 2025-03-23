'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Color {
  name: string;
  colorCode: string;
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
  sizes: {
    standard: { label: string; available: boolean; }[];
    plus: { label: string; available: boolean; }[];
    petite: { label: string; available: boolean; }[];
  };
}

export default function ProductCollection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(savedProducts);
  }, []);

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No products in collection yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <Link 
          href={`/johnnywas/product-description/${product.id}`} 
          key={product.id}
          className="group"
        >
          <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={product.images[0]?.url || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-medium text-[#211E1E]">{product.name}</h3>
              <p className="text-gray-600">${product.price}</p>
              <p className="text-sm text-gray-500">{product.colors.length} colors available</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 