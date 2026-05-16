'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams?.get('token');
        const refreshToken = searchParams?.get('refreshToken');
        const errorParam = searchParams?.get('error');

        if (errorParam) {
          setError(errorParam === 'google-auth-failed'
            ? 'Google authentication failed. Please try again.'
            : 'Authentication error occurred.');
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        if (!token) {
          setError('No authentication token received.');
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Fetch and store user data before redirecting so AuthProvider
        // finds both token + user in localStorage on dashboard load
        try {
          const { authAPI } = await import('@/lib/api');
          const response = await authAPI.getCurrentUser();
          if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (e) {
          // proceed anyway — AuthProvider will fetch on mount
        }

        window.location.href = '/dashboard';

      } catch (err) {
        console.error('Callback error:', err);
        setError('Failed to complete authentication.');
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}