/**
 * API utilities for cross-platform compatibility
 */

/**
 * Get the backend URL with fallback
 * This ensures we use the environment variable if available, or default to localhost
 */
export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

/**
 * Execute a fetch request with IPv4 fallback for Windows compatibility
 * This helps resolve issues where Windows tries to use IPv6 (::1) but the server only listens on IPv4
 */
export async function safeFetch(
  endpoint: string, 
  options: RequestInit
): Promise<Response> {
  try {
    // First attempt with the provided endpoint
    return await fetch(endpoint, options);
  } catch (fetchError) {
    // If connection fails and we used localhost, try with explicit IPv4
    if (endpoint.includes('localhost') && !endpoint.includes('127.0.0.1')) {
      console.log(`Connection to ${endpoint} failed, trying with explicit IPv4 address...`);
      
      // Try with explicit IPv4
      const ipv4Endpoint = endpoint.replace('localhost', '127.0.0.1');
      try {
        return await fetch(ipv4Endpoint, options);
      } catch (ipv4Error) {
        console.error('IPv4 fallback also failed:', ipv4Error);
        throw ipv4Error;
      }
    } else {
      // If not using localhost or already tried IPv4, just throw the original error
      throw fetchError;
    }
  }
}

/**
 * Helper function to handle the entire fetch flow with JSON response parsing
 * Includes error handling and IPv4 fallback
 */
export async function fetchJson<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await safeFetch(endpoint, options);
    
    // Get the response text
    const responseText = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      console.error("Raw response:", responseText);
      throw new Error('Failed to parse server response');
    }
    
    // Check if the response was successful
    if (!response.ok) {
      const errorMessage = data.detail || data.error || 'Request failed';
      console.error("Error from backend:", data);
      throw new Error(errorMessage);
    }
    
    return data as T;
  } catch (error) {
    console.error('Error in fetch request:', error);
    throw error;
  }
} 