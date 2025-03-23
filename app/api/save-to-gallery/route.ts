import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, provider, images, type, modelImageUrl, garmentImageUrl } = data;
    
    // In a real application, this would save to a database
    // For demonstration, we'll just return success with an ID
    
    const galleryItem = {
      id: uuidv4(),
      title,
      date: new Date().toISOString(),
      provider,
      thumbnailUrl: images[0],
      images,
      modelImageUrl,
      garmentImageUrl,
      type
    };
    
    // In a real app: await saveToDatabase(galleryItem);
    
    return NextResponse.json({
      success: true,
      message: "Item saved to gallery",
      item: galleryItem
    });
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 