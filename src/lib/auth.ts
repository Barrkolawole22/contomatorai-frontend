// src/lib/auth.ts

import { jwtVerify } from 'jose';

interface DecodedToken {
  userId: string;
  id?: string;         // some backends use id instead of userId
  email: string;
  role?: string;
  exp: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Cryptographically verifies a JWT token using the shared backend secret.
 * Used only in Next.js middleware (server-side). Returns null on any failure.
 */
export async function verifyJwt(token: string): Promise<DecodedToken | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Client-side-only: reads the JWT expiry WITHOUT verifying the signature.
 * Safe to use only for UI decisions (e.g. show a "session expiring" warning).
 * Never use this for access control.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Base64URL → Base64 → decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const now = Math.floor(Date.now() / 1000);

    return !payload.exp || payload.exp <= now;
  } catch {
    return true;
  }
}

/**
 * Client-side-only: extracts the user role from a JWT payload without
 * signature verification. For display purposes only.
 */
export function /**
 * @deprecated Always returns null — tokens no longer embed role after auth refactor.
 * Use user.role from AuthProvider context instead: const { user } = useAuth()
 */
getTokenRole(_token: string): string | null {
  // Tokens only contain { userId } — role not embedded. Use AuthProvider.user.role
  return null;
}