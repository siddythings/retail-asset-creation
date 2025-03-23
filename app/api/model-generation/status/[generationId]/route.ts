import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { generationId: string } }
) {
  try {
    const generationId = params.generationId;
    
    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Checking status for generation ID: ${generationId}`);
    
    // Get backend URL and build the endpoint
    const backendUrl = getBackendUrl();
    const endpoint = `${backendUrl}/api/model-generation/status/${generationId}`;
    
    console.log(`Sending request to ${endpoint}`);
    
    // Call the backend API
    const response = await safeFetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // Get the response data
    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
      console.log("Parsed response data successfully:", data.status);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      console.error("Raw response:", responseText);
      return NextResponse.json(
        { error: 'Failed to parse server response' },
        { status: 500 }
      );
    }
    
    // If the response is not successful, throw an error
    if (!response.ok) {
      console.error("Error from backend:", data);
      return NextResponse.json(
        { error: data.detail || 'Failed to process request' },
        { status: response.status }
      );
    }
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in model generation status API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 