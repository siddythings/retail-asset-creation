import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

export async function POST(request: Request) {
  try {
    console.log("Received model generation execute request");
    const body = await request.json();
    
    // Log the number of images requested
    console.log(`Requested ${body.num_images || 'default'} images per combination`);
    
    // Get backend URL and build the endpoint
    const backendUrl = getBackendUrl();
    const endpoint = `${backendUrl}/api/model-generation/execute`;
    
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
    
    console.log(`Model generation executed with status: ${data.status}`);
    if (data.images) {
      console.log(`Received ${data.images.length} images`);
    }
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in model generation API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 