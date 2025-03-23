import { NextResponse } from 'next/server';
import { getBackendUrl, safeFetch } from '@/services/api-utils';

export async function POST(request: Request) {
  try {
    console.log("Received model generation with reference request");
    
    // Get the form data
    const formData = await request.formData();
    
    // Get backend URL and build the endpoint
    const backendUrl = getBackendUrl();
    const endpoint = `${backendUrl}/api/model-generation/generate-with-reference`;
    
    console.log(`Sending request to ${endpoint}`);
    
    // Call the backend API with the same FormData
    const response = await safeFetch(endpoint, {
      method: 'POST',
      body: formData,
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
    
    console.log(`Model generation with reference executed with ID: ${data.generationId}`);
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in model generation with reference API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 