import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Prepare the form data to send to the backend
    const backendFormData = new FormData();

    // Get mask file
    const maskFile = formData.get("mask_file") as File;
    if (!maskFile) {
      return NextResponse.json(
        { error: "No mask file provided" },
        { status: 400 }
      );
    }
    backendFormData.append("mask_file", maskFile);

    // Get either image file or URL
    const imageFile = formData.get("image_file") as File;
    const imageUrl = formData.get("image_url");

    if (imageFile) {
      backendFormData.append("image_file", imageFile);
    } else if (imageUrl) {
      backendFormData.append("image_url", imageUrl as string);
    } else {
      return NextResponse.json(
        { error: "No image file or URL provided" },
        { status: 400 }
      );
    }

    // Handle optional parameters
    const contentModeration = formData.get("content_moderation");
    if (contentModeration !== null) {
      backendFormData.append("content_moderation", contentModeration as string);
    }

    console.log("Sending eraser request to backend");

    // Send the request to the backend server
    const backendResponse = await fetch(
      "http://127.0.0.1:8000/api/image/eraser",
      {
        method: "POST",
        body: backendFormData,
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "Failed to process image";

      try {
        // Try to parse as JSON to get detailed error
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If not JSON, use the raw text
        errorMessage = errorText || errorMessage;
      }

      console.error("Backend error:", errorMessage);

      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    // Get the response from the backend
    const data = await backendResponse.json();
    console.log("Received successful response from backend:", data);

    // Return the processed image URL from the backend
    return NextResponse.json({
      result_url: data.result_url,
      message: "Image processed successfully",
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Internal server error during processing" },
      { status: 500 }
    );
  }
}
