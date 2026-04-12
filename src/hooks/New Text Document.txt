// frontend/src/hooks/useWordPressOAuth.ts
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OAuthConnection {
  id: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
  wpUserEmail: string;
  wpUserRoles: string[];
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
}

interface UseWordPressOAuthReturn {
  // OAuth functions
  initiateOAuth: (siteUrl: string, siteName?: string) => Promise<void>;
  disconnectOAuth: (connectionId: string) => Promise<void>;
  testOAuthConnection: (siteUrl: string) => Promise<any>;
  getOAuthConnections: () => Promise<OAuthConnection[]>;
  
  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useWordPressOAuth = (): UseWordPressOAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  const initiateOAuth = async (siteUrl: string, siteName?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/oauth/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: siteUrl.trim(),
          siteName: siteName?.trim() || 'My WordPress Site'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to initiate OAuth');
      }

      // Redirect to WordPress OAuth authorization page
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate OAuth connection');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnectOAuth = async (connectionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/oauth/connections/${connectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to disconnect');
      }

      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const testOAuthConnection = async (siteUrl: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/oauth/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Connection test failed');
      }

      return data;
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOAuthConnections = async (): Promise<OAuthConnection[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/oauth/connections');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get connections');
      }

      return data.data || [];
    } catch (err: any) {
      setError(err.message || 'Failed to get connections');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateOAuth,
    disconnectOAuth,
    testOAuthConnection,
    getOAuthConnections,
    loading,
    error,
    clearError,
  };
};