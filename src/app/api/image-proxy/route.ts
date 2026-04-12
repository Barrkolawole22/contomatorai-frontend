export const dynamic = 'force-dynamic';
// frontend/src/app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Remove /api suffix since uploads are served at root level
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    console.log('🖼️ Image proxy request for path:', path);

    if (!path) {
      console.error('❌ No path provided to image proxy');
      return NextResponse.json(
        { success: false, message: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Clean and validate the path
    let cleanPath = path;
    
    // Remove any leading slashes and ensure it starts with uploads/
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = `uploads/${cleanPath}`;
    }

    // Construct the full URL to the backend (without /api prefix)
    const imageUrl = `${BACKEND_BASE_URL}/${cleanPath}`;
    console.log('🔗 Fetching image from:', imageUrl);

    // Fetch the image from the backend
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'public, max-age=31536000',
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
      
      return NextResponse.json(
        { success: false, message: 'Image not found' },
        { status: 404 }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Image fetched successfully:', {
      size: imageBuffer.byteLength,
      contentType,
      path: cleanPath
    });

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
