import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get backend URL
    const backendUrl = getBackendUrl();
    
    // Call the FastAPI backend with fallback mechanism
    const response = await safeFetch(`${backendUrl}/api/virtual-try-on/gallery`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve gallery items');
    }
    
    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error retrieving gallery items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve gallery items' },
      { status: 500 }
    );
  }
}
