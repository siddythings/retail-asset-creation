import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Create a new FormData object to send to the FastAPI backend
    const backendFormData = new FormData();
    
    // Copy all fields from the request to the new FormData
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }
    
    // Get backend URL
    const backendUrl = getBackendUrl();
    
    // Call the FastAPI backend with fallback mechanism
    const response = await safeFetch(`${backendUrl}/api/virtual-try-on/submit`, {
      method: 'POST',
      body: backendFormData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit try-on request');
    }
    
    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error submitting try-on request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit try-on request' },
      { status: 500 }
    );
  }
}
