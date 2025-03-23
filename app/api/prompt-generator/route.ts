import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Make the actual API call to your backend service
    const response = await fetch("http://localhost:8000/prompt-generator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Backend API call failed");
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Prompt generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
} 