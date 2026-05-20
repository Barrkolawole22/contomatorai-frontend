'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, RefreshCw, Mail } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authAPI.get(`/auth/verify-email/${token}`);
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired verification link.');
      }
    };

    verifyEmail();
  }, [token, router]);

  // Countdown timer on success
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown === 0) {
      router.replace('/login');
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center py-12 px-4">

      {/* Loading state */}
      {status === 'loading' && (
        <>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verifying your email</h2>
            <p className="text-gray-600">Please wait a moment while we confirm your account.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What's happening:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Validating your verification link</li>
              <li>Activating your account</li>
              <li>Redirecting you to login</li>
            </ol>
          </div>
        </>
      )}

      {/* Success state */}
      {status === 'success' && (
        <>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-green-800 mb-2">You're all set:</h3>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Your account is now active</li>
              <li>You can sign in with your credentials</li>
              <li>Start using ContentAI Pro</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
            <p className="text-center text-sm text-gray-500">
              Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </>
      )}

      {/* Error state */}
      {status === 'error' && (
        <>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">What you can do:</h3>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>Request a new verification email below</li>
              <li>Check your inbox and click the new link</li>
              <li>Links expire after 24 hours</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/verify-email"
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Mail className="h-4 w-4 mr-2" />
              Resend verification email
            </Link>
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Need a new account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Register again
            </Link>
          </p>
        </>
      )}

    </div>
    </div>
  );
}