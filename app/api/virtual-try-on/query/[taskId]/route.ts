import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request, 
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    
    // Get provider from the query string
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    
    // Build the query string
    const queryParams = provider ? `?provider=${provider}` : '';
    
    // Get backend URL
    const backendUrl = getBackendUrl();
    
    // Call the FastAPI backend with fallback mechanism
    const response = await safeFetch(
      `${backendUrl}/api/virtual-try-on/query/${taskId}${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to query try-on status');
    }
    
    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error querying try-on status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query try-on status' },
      { status: 500 }
    );
  }
}
