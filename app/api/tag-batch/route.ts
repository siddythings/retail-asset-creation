import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, safeFetch } from '@/services/api-utils';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Forward the request to the FastAPI backend
    const backendUrl = getBackendUrl();
    
    // Use safeFetch for cross-platform compatibility
    const response = await safeFetch(`${backendUrl}/api/tag-batch`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in tag-batch route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 