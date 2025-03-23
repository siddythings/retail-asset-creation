import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

export async function POST(request: Request) {
  try {
    console.log("Received reference image analysis request");
    
    // Parse the request data
    const body = await request.json();
    
    // Check if reference image data is provided
    if (!body.referenceImageData) {
      console.error("No reference image data provided");
      return NextResponse.json(
        { error: 'No reference image data provided' },
        { status: 400 }
      );
    }
    
    // Get backend URL and build the endpoint
    const backendUrl = getBackendUrl();
    const endpoint = `${backendUrl}/api/model-generation/analyze-reference`;
    
    console.log(`Sending request to ${endpoint}`);
    
    // Call the backend API with fallback mechanism
    const response = await safeFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Get the response data
    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
      console.log("Parsed response data successfully");
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
    
    console.log("Reference image analysis successful");
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in reference image analysis API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 