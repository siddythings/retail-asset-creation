import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Get the request data
    const requestData = await request.json();
    
    // Forward the request to the FastAPI backend
    const backendUrl = getBackendUrl();
    
    // Use our cross-platform fetch with fallback
    const response = await safeFetch(`${backendUrl}/background/background-replace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in background-generator route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 