'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status !== 'success') return;
    if (countdown === 0) {
      router.replace('/login');
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await authAPI.post('/auth/reset-password', {
        token,
        password: formData.password,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. The link may have expired.'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center py-12 px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-600">Your password has been changed successfully.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-green-800 mb-2">You're all set:</h3>
            <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
              <li>Your new password is now active</li>
              <li>Sign in with your new credentials</li>
              <li>Keep your password safe</li>
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
        </div>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center py-12 px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600">{error}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">What you can do:</h3>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>Request a new password reset link below</li>
              <li>Check your email and click the new link</li>
              <li>Links expire after 1 hour</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Request new reset link
            </Link>
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center py-12 px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose a new password</h2>
          <p className="text-gray-600">
            Must be at least 8 characters with uppercase, lowercase, number and special character.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 pl-10 pr-10"
                placeholder="Enter new password"
                disabled={status === 'loading'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                }
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 pl-10 pr-10"
                placeholder="Confirm new password"
                disabled={status === 'loading'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword
                  ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Resetting password...
              </>
            ) : (
              'Reset password'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}