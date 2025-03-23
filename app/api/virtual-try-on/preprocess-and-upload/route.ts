import { NextResponse } from "next/server";
import { getBackendUrl, safeFetch } from "@/services/api-utils";

// Get the backend URL from environment variables
const backendUrl = getBackendUrl();

export async function POST(req: Request) {
  try {
    // Parse the request body
    const requestData = await req.json();

    // Check if the base64_image is actually a URL
    const isUrl =
      requestData.base64_image &&
      (requestData.base64_image.startsWith("http://") ||
        requestData.base64_image.startsWith("https://"));

    // Log for debugging
    console.log(`Processing ${requestData.image_type} image. Is URL: ${isUrl}`);

    // If it's a URL, we need to ensure the backend knows it's a URL
    if (isUrl) {
      console.log(
        `Using remote URL for ${requestData.image_type}: ${requestData.base64_image}`
      );
    }

    // Call the FastAPI backend to preprocess and upload the image
    const response = await safeFetch(
      `${backendUrl}/api/virtual-try-on/preprocess-and-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "Failed to preprocess and upload image"
      );
    }

    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error preprocessing and uploading image:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to preprocess and upload image",
      },
      { status: 500 }
    );
  }
}
