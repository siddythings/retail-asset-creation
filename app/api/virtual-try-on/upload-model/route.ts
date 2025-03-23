import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Add this export to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'models');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Return file URL
    return NextResponse.json({ 
      fileUrl: `/uploads/models/${filename}` 
    });
  } catch (error) {
    console.error('Error uploading model image:', error);
    return NextResponse.json(
      { error: 'Failed to upload model image' },
      { status: 500 }
    );
  }
}
