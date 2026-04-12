import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const JWT_CONFIG = {
  algorithms: { default: 'HS256' } as const,
  expiration: {
    access: '15m',
    refresh: '7d',
    rememberMe: '30d'
  } as const
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-secret-change-in-production');
}

type TokenPayload = { userId: string };
type ExpirationType = keyof typeof JWT_CONFIG.expiration;

export async function createToken(
  payload: TokenPayload,
  expiresIn: ExpirationType = 'access'
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_CONFIG.algorithms.default })
    .setIssuedAt()
    .setExpirationTime(JWT_CONFIG.expiration[expiresIn])
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as TokenPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function setAuthCookie(token: string, rememberMe = false): void {
  cookies().set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 2,
    path: '/',
    sameSite: 'strict'
  });
}

export function clearAuthCookie(): void {
  cookies().delete('auth-token');
}

declare module 'jose' {
  interface JWTPayload extends TokenPayload {}
}