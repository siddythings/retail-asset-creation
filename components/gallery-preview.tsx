'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function GalleryPreview() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('galleryItems');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        setItems(parsedItems.slice(0, 4)); // Show max 4 items in preview
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading gallery preview:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No items in gallery yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Use our tools to create and save images to your gallery.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, index) => (
        <div key={index} className="aspect-square relative rounded overflow-hidden">
          <img 
            src={item.thumbnailUrl || item.images[0]} 
            alt={item.title || 'Gallery item'} 
            className="object-cover w-full h-full"
          />
        </div>
      ))}
      {items.length < 4 && Array(4 - items.length).fill(0).map((_, i) => (
        <div key={`empty-${i}`} className="aspect-square bg-muted rounded-md flex items-center justify-center">
          <Plus className="h-8 w-8 text-muted-foreground opacity-20" />
        </div>
      ))}
    </div>
  );
} 