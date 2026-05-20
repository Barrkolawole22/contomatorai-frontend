'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthProvider';
import { authAPI } from '@/lib/api';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional()
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isAdmin, getDefaultRoute, loading: authLoading } = useAuth();
  
  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<null | number>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Smart redirect logic with admin detection
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasRedirected) {
      console.log('🔄 User authenticated, determining redirect...', {
        isAdmin,
        redirect: searchParams?.get('redirect')
      });
      
      setHasRedirected(true);
      
      const redirectParam = searchParams?.get('redirect');
      let redirectPath: string;
      
      if (redirectParam) {
        redirectPath = redirectParam;
        console.log('📍 Using redirect parameter:', redirectPath);
      } else {
        redirectPath = getDefaultRoute();
        console.log('🎯 Using role-based route:', redirectPath);
      }
      
      console.log('🚀 Redirecting to:', redirectPath);
      router.replace(redirectPath);
    }
  }, [isAuthenticated, authLoading, hasRedirected, isAdmin, getDefaultRoute, router, searchParams]);

  /**
   * Handles form submission using AuthProvider
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthenticated || hasRedirected || isLoading) {
      console.log('⚠️ Login already in progress or user authenticated');
      return;
    }

    setIsLoading(true);
    setError('');
    setNotVerified(false);

    try {
      console.log('🔑 Attempting login with:', formData.email);
      
      loginSchema.parse(formData);
      await login(formData.email, formData.password, formData.rememberMe);
      
      console.log('✅ Login successful, authentication state will trigger redirect');
      
    } catch (err: any) {
      console.error('❌ Login failed:', err);

      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error') || err.message?.includes('connect ECONNREFUSED')) {
        setError('Unable to connect to server. Please check your internet connection or contact support if the issue persists.');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Our team has been notified. Please try again later.');
      } else if (
        (err.response?.status === 401 && err.response?.data?.message?.toLowerCase().includes('not verified')) ||
        err.message?.toLowerCase().includes('not verified')
      ) {
        setNotVerified(true);
        setError(err.response?.data?.message || err.message);
      } else if (err.response?.status === 401) {
        setNotVerified(false);
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setNotVerified(false);
        setError(err.message || 'Login failed. Please check your credentials.');
      }

      setIsLoading(false);
    }
  };

  /**
   * Handles input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      setPasswordStrength(Math.min(Math.floor(value.length / 2), 5));
    }
    
    if (error) setError('');
    if (notVerified) setNotVerified(false);
  };

  /**
   * Handles resending the verification email
   */
  const handleResendVerification = async () => {
    try {
      await authAPI.post('/auth/resend-verification', { email: formData.email });
      setError('');
      setNotVerified(false);
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to resend verification email. Please try again.');
    }
  };

  /**
   * Handles social login
   */
  const handleSocialLogin = async (provider: 'twitter') => {
    try {
      setIsLoading(true);
      setError('');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setError(`${provider} login is not implemented yet`);
    } catch (err: any) {
      setError(err.message || `${provider} login is currently unavailable`);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormLoading = isLoading || authLoading || hasRedirected;

  if (isAuthenticated && (authLoading || hasRedirected)) {
    const redirectType = isAdmin ? 'admin panel' : 'dashboard';
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to {redirectType}...</p>
        {isAdmin && (
          <p className="mt-2 text-sm text-blue-600">Welcome, Administrator!</p>
        )}
      </div>
    );
  }

  if (isAuthenticated && !authLoading) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Already logged in, redirecting...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-600">Sign in to your ContentAI Pro account</p>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
          <strong>Test Credentials:</strong><br />
          <div className="mt-2 space-y-1">
            <div>📧 Admin: superadmin@test.com</div>
            <div>🔑 Password: Admin123!</div>
            <div className="text-xs text-blue-600 mt-1">
              (Will redirect to admin panel)
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-red-300 rounded-md bg-red-50 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-1 text-sm text-red-700">{error}</div>
            {notVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-3 inline-flex items-center text-sm font-medium text-red-800 underline hover:text-red-600"
              >
                Resend verification email
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 pl-10"
              placeholder="Enter your email"
              disabled={isFormLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Field with strength meter */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
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
              placeholder="Enter your password"
              disabled={isFormLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isFormLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {formData.password && (
            <div className="mt-1 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 flex-1 rounded-sm ${
                    (passwordStrength || 0) > i 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isFormLoading}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <Link 
            href="/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-500"
            onClick={(e) => isFormLoading && e.preventDefault()}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isFormLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFormLoading ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Social Login Section */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {/* Google OAuth button */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${isFormLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            if (isFormLoading) e.preventDefault();
            setIsLoading(true);
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="ml-2">Google</span>
        </a>

        {/* Twitter OAuth button */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/twitter`}
          className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${isFormLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            if (isFormLoading) e.preventDefault();
            setIsLoading(true);
          }}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="ml-2">Twitter</span>
        </a>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link 
          href="/register" 
          className="font-medium text-blue-600 hover:text-blue-500"
          onClick={(e) => isFormLoading && e.preventDefault()}
        >
          Sign up for free
        </Link>
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs space-y-1">
          <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
          <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
          <div>Form Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>Has Redirected: {hasRedirected ? 'Yes' : 'No'}</div>
          <div>Not Verified: {notVerified ? 'Yes' : 'No'}</div>
          <div>Default Route: {isAuthenticated ? getDefaultRoute() : 'N/A'}</div>
        </div>
      )}
    </div>
  );
}