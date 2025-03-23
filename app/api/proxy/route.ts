import { NextResponse } from 'next/server';

// Force dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Get the URL from the request
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  // If no URL provided, return an error
  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    // Fetch the image from the original URL
    const response = await fetch(url, {
      headers: {
        // Pass referer to help with sites that check referer
        'Referer': new URL(url).origin,
        // Identify as a browser
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      },
    });

    // If fetch failed, return an error
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` }, 
        { status: response.status }
      );
    }

    // Get the content type and buffer
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
} 