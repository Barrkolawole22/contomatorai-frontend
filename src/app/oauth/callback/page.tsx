// frontend/src/app/oauth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for Google OAuth token (from auth.controller.ts googleCallback)
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      
      // Check for WordPress OAuth parameters
      const wpError = searchParams.get('oauth_error');
      const wpSuccess = searchParams.get('oauth_success');
      const siteName = searchParams.get('site_name');

      // Handle Google Authentication
      if (token) {
        try {
          // Store tokens
          localStorage.setItem('token', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }

          setStatus('success');
          setMessage('Successfully signed in with Google!');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
          return;
        } catch (err) {
          console.error('Token storage error:', err);
          setStatus('error');
          setMessage('Failed to complete authentication. Please try again.');
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }
      }

      // Handle WordPress OAuth
      if (wpError) {
        setStatus('error');
        setMessage(decodeURIComponent(wpError));
        return;
      }

      if (wpSuccess) {
        setStatus('success');
        setMessage(`Successfully connected to ${siteName || 'WordPress site'}!`);
        
        // Redirect to WordPress page after a short delay
        setTimeout(() => {
          router.push('/wordpress');
        }, 2000);
        return;
      }

      // If no valid parameters, show error
      setStatus('error');
      setMessage('Invalid callback parameters');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    };

    handleCallback();
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="w-12 h-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className={`rounded-xl border p-8 text-center ${getStatusColor()}`}>
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {status === 'loading' && 'Connecting...'}
            {status === 'success' && 'Connected Successfully!'}
            {status === 'error' && 'Connection Failed'}
          </h1>
          
          <p className="text-lg mb-6">
            {message || 'Processing your authentication...'}
          </p>

          {status === 'loading' && (
            <p className="text-sm opacity-75">
              Please wait while we complete the authentication...
            </p>
          )}

          {status === 'error' && (
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Login
            </button>
          )}

          {status === 'success' && (
            <p className="text-sm opacity-75">
              Redirecting you...
            </p>
          )}
        </div>

        {/* Help section for errors */}
        {status === 'error' && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Troubleshooting Tips
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Make sure you're using the correct Google account</li>
              <li>• Check that cookies are enabled in your browser</li>
              <li>• Try clearing your browser cache and cookies</li>
              <li>• If the issue persists, try regular email/password login</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
