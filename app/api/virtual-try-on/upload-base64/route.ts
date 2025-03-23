import { NextResponse } from "next/server";
import { getBackendUrl, safeFetch } from '@/services/api-utils';

// Add this export to prevent static generation
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Parse the request JSON
    const body = await req.json();
    const { base64_image, image_type, filename } = body;

    if (!base64_image) {
      return NextResponse.json(
        { error: "No base64 image provided" },
        { status: 400 }
      );
    }

    if (!image_type || (image_type !== "model" && image_type !== "clothing")) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "model" or "clothing"' },
        { status: 400 }
      );
    }

    // Get backend URL
    const backendUrl = getBackendUrl();

    // Call the FastAPI backend to handle the base64 image
    const response = await safeFetch(
      `${backendUrl}/api/virtual-try-on/upload-base64`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64_image: base64_image,
          image_type: image_type,
          filename: filename || undefined,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload base64 image");
    }

    // Return the response from the backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload base64 image",
      },
      { status: 500 }
    );
  }
}
