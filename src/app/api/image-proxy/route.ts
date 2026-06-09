export const dynamic = 'force-dynamic';
// src/app/api/image-proxy/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

// Only these path prefixes are allowed through the proxy
const ALLOWED_PATH_PREFIXES = ['uploads/'];

// Only these content types will be forwarded
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
];

// Matches any path traversal attempt: .., %2e, %2f, null bytes, etc.
const DANGEROUS_PATTERN = /(\.\.|%2e%2e|%00|%0a|%0d)/i;

export async function GET(request: NextRequest) {
  try {
    // ── 1. Require authentication ────────────────────────────────────────────
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── 2. Validate the path parameter ───────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get('path');

    if (!rawPath) {
      return NextResponse.json(
        { success: false, message: 'path parameter is required' },
        { status: 400 }
      );
    }

    // Strip leading slash
    let cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

    // Reject path traversal attempts before any further processing
    if (DANGEROUS_PATTERN.test(cleanPath)) {
      return NextResponse.json(
        { success: false, message: 'Invalid path' },
        { status: 400 }
      );
    }

    // Ensure path starts with an allowed prefix
    const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) =>
      cleanPath.startsWith(prefix)
    );
    if (!isAllowed) {
      cleanPath = `uploads/${cleanPath}`;
    }

    // Re-check after potential prefix addition
    if (DANGEROUS_PATTERN.test(cleanPath)) {
      return NextResponse.json(
        { success: false, message: 'Invalid path' },
        { status: 400 }
      );
    }

    // ── 3. Fetch from backend ─────────────────────────────────────────────────
    const imageUrl = `${BACKEND_BASE_URL}/${cleanPath}`;

    const response = await fetch(imageUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Image not found' },
        { status: response.status === 404 ? 404 : 502 }
      );
    }

    // ── 4. Validate content type before forwarding ────────────────────────────
    const contentType = response.headers.get('content-type') || '';
    const baseType = contentType.split(';')[0].trim().toLowerCase();

    if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
      return NextResponse.json(
        { success: false, message: 'Unsupported media type' },
        { status: 415 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': baseType,
        'Cache-Control': 'private, max-age=3600',
        // Removed wildcard CORS — images are only served to authenticated users
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error?.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, message: 'Image fetch timed out' },
        { status: 504 }
      );
    }
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}