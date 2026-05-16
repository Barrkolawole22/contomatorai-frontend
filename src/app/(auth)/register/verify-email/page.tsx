'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) {
      setError('Email address not found. Please register again.');
      return;
    }

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await authAPI.post('/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-600">
          We sent a verification link to
        </p>
        {email && (
          <p className="font-medium text-gray-900 mt-1">{email}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {resendSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-green-700">Verification email resent successfully. Please check your inbox.</div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Next steps:</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Check your email inbox</li>
          <li>Click the verification link in the email</li>
          <li>Return here to sign in</li>
        </ol>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={isResending}
          className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <>
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              Resending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend verification email
            </>
          )}
        </button>

        <Link
          href="/login"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go to login
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Wrong email?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Register again
        </Link>
      </p>
    </div>
  );
}
