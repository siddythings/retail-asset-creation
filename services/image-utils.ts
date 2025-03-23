/**
 * Utility functions for handling images
 */

/**
 * Fetches an image from a URL and returns it as a buffer
 * @param url The URL of the image to fetch
 * @returns A promise that resolves to the image buffer
 */
export async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  try {
    // Make a fetch request to get the image
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);
    
    return buffer;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Failed to fetch the image from the provided URL');
  }
} 