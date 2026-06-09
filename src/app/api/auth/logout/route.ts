export const dynamic = 'force-dynamic';
// src/app/api/auth/logout/route.ts
// The previous version only cleared a cookie. The actual auth system stores
// tokens in localStorage, so client-side cleanup is handled in AuthProvider.logout().
// This route clears the cookie (for any SSR/middleware usage) and also calls
// the backend logout endpoint to invalidate the token server-side.

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');

  // Best-effort: tell the backend to invalidate the token
  if (authorization) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: authorization },
      });
    } catch {
      // Non-fatal — we still clear client state
    }
  }

  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear any cookie-based token (used by middleware)
  response.cookies.delete('token');
  response.cookies.delete('auth-token');

  return response;
}