import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, safeFetch } from "@/services/api-utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageUrl = formData.get("imageUrl") as string;
    const scale = (formData.get("scale") as string) || "2";
    const enhanceQuality = formData.get("enhanceQuality") === "true";
    const preserveDetails = formData.get("preserveDetails") === "true";
    const removeNoise = formData.get("removeNoise") === "true";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Log the request for debugging
    const requestData = {
      imageUrl: imageUrl.substring(0, 50) + "...", // Truncate for privacy/clarity
      scale,
      enhanceQuality,
      preserveDetails,
      removeNoise,
    };

    // Get backend URL
    const backendUrl = getBackendUrl();

    // Forward the request to the FastAPI backend
    const response = await safeFetch(`${backendUrl}/api/image/upscale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        scale: parseInt(scale),
        enhanceQuality: enhanceQuality,
        preserveDetails: preserveDetails,
        removeNoise: removeNoise,
      }),
    });

    // Get the raw response text for debugging
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response as JSON:", parseError);
      console.error("Raw response that failed to parse:", responseText);
      return NextResponse.json(
        { error: `Invalid JSON response from backend: ${responseText}` },
        { status: 500 }
      );
    }

    if (!response.ok) {
      // Extract error details from parsed data
      const errorMessage = data.detail || "Failed to upscale image";
      console.error("Backend request failed:", errorMessage);
      throw new Error(errorMessage);
    }

    // Validate the response has the expected structure
    if (!data.upscaledImageUrl) {
      console.error("Missing upscaledImageUrl in response:", data);
      throw new Error("No upscaled image URL in the response");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("=== Error in upscale request handler ===");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error("Error details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upscale image",
      },
      { status: 500 }
    );
  }
}
