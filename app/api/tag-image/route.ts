import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, safeFetch } from '@/services/api-utils';
import { fetchImageAsBuffer } from '@/services/image-utils';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const backendUrl = getBackendUrl();
    
    // Check if we have an imageUrl instead of a file
    const imageUrl = formData.get('imageUrl') as string;
    
    if (imageUrl) {
      // Create a new FormData object to send to the backend
      const backendFormData = new FormData();
      
      // Fetch the image from the URL and convert to a file
      try {
        const imageBuffer = await fetchImageAsBuffer(imageUrl);
        const fileName = `example-image-${Date.now()}.jpg`;
        
        // Create a file from the buffer
        const file = new File([imageBuffer], fileName, { type: 'image/jpeg' });
        
        // Add the file to the FormData
        backendFormData.append('file', file);
        
        // Add any other parameters from the original FormData
        formData.forEach((value, key) => {
          if (key !== 'imageUrl') {
            backendFormData.append(key, value);
          }
        });
        
        // Replace the original FormData with our new one
        const response = await safeFetch(`${backendUrl}/api/tag-image`, {
          method: 'POST',
          body: backendFormData,
        });
        
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error('Error processing image URL:', error);
        throw new Error('Failed to process the image URL');
      }
    } else {
      // Regular file upload handling - forward directly to backend
      const response = await safeFetch(`${backendUrl}/api/tag-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error in tag-image route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 