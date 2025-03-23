import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API route to proxy image requests to bypass CORS restrictions
 * This endpoint fetches an image from a remote URL and returns it,
 * effectively acting as a proxy to avoid CORS issues.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL parameter
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 }
      );
    }

    console.log(`Proxying image request for: ${url}`);

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        // Set a common user agent to help avoid blocks
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        // Some sites require a referer
        Referer: "https://www.google.com/",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image content
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
        "Access-Control-Allow-Origin": "*", // Allow cross-origin requests
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
