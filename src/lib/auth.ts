// Server-side authentication utilities for middleware

interface DecodedToken {
  userId: string;
  email: string;
  exp: number; // Expiry time in seconds
}

/**
 * Verifies a mock JWT token on the server side
 * This matches the client-side token format from AuthProvider
 */
export function verifyJwt(token: string): DecodedToken | null {
  try {
    // Check if it's our mock JWT format
    if (!token.startsWith('mock-jwt-token.')) {
      return null;
    }
    
    // Extract the payload part (everything after the first dot)
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    
    // Decode the base64 payload
    const decoded = JSON.parse(atob(payload)) as DecodedToken;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      return null;
    }
    
    // Validate required fields
    if (!decoded.userId || !decoded.email) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Checks if a token is expired without full verification
 */
export function isTokenExpired(token: string): boolean {
  try {
    if (!token.startsWith('mock-jwt-token.')) return true;
    
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    const decoded = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000);
    
    return decoded.exp <= now;
  } catch {
    return true;
  }
}