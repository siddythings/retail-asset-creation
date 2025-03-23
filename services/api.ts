/**
 * API service for interacting with the backend
 */

interface VirtualTryOnRequest {
  clothingImageUrl?: string;
  clothingType?: string;
  gender?: string;
  modelStyle?: string;
  modelBody?: string;
  viewType?: string;
  generateCount?: number;
  inputQualityDetect?: number;

  // Fashn.ai API specific parameters
  mode?: "performance" | "balanced" | "quality";
  garmentPhotoType?: "auto" | "model" | "flat-lay";
  numSamples?: number;
  restoreBackground?: boolean;
  coverFeet?: boolean;
  adjustHands?: boolean;
  restoreClothes?: boolean;
  nsfw_filter?: boolean;
  longTop?: boolean;
  seed?: number;
}

interface TryOnResult {
  taskId: string;
  provider?: string;
}

interface TryOnStatus {
  taskStatus: string;
  results: any[];
  taskId: string;
  provider?: string;
  images?: Array<{ url: string; id: string; nsfw?: boolean } | string>;
  output?: string[] | { output_urls: string[] };
  error?: string;
}

// Updated to point to the Next.js API routes
const API_BASE_URL = "/api";

/**
 * Submit a virtual try-on request
 */
export async function submitVirtualTryOn(
  formData: FormData
): Promise<TryOnResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/virtual-try-on/submit`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit try-on request");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting try-on request:", error);
    throw error;
  }
}

/**
 * Query the status of a virtual try-on task
 */
export async function queryVirtualTryOnStatus(
  taskId: string,
  provider?: string
): Promise<TryOnStatus> {
  try {
    const providerQuery = provider ? `?provider=${provider}` : "";
    const response = await fetch(
      `${API_BASE_URL}/virtual-try-on/query/${taskId}${providerQuery}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to query try-on status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error querying try-on status:", error);
    throw error;
  }
}

/**
 * Execute a complete virtual try-on process
 */
export async function executeVirtualTryOn(
  formData: FormData
): Promise<TryOnStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/virtual-try-on/execute`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to execute try-on process");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error executing try-on process:", error);
    throw error;
  }
}

/**
 * Get gallery items
 */
export async function getGalleryItems(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/virtual-try-on/gallery`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get gallery items");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error getting gallery items:", error);
    throw error;
  }
}

/**
 * Upscale an image using Bria AI's increase-resolution API
 */
export async function upscaleImage(
  imageUrl: string,
  options: {
    scale?: number;
    enhanceQuality?: boolean;
    preserveDetails?: boolean;
    removeNoise?: boolean;
  } = {}
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("imageUrl", imageUrl);
    formData.append("scale", String(options.scale || 2));
    formData.append("enhanceQuality", String(options.enhanceQuality ?? true));
    formData.append("preserveDetails", String(options.preserveDetails ?? true));
    formData.append("removeNoise", String(options.removeNoise ?? false));

    const response = await fetch(`${API_BASE_URL}/image/upscale`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upscale image");
    }

    const result = await response.json();
    return result.upscaledImageUrl;
  } catch (error) {
    console.error("Error upscaling image:", error);
    throw error;
  }
}
