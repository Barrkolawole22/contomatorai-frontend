'use client';

import { useAuth } from '@/context/AuthProvider'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This component is mostly a wrapper for protected routes
// The actual redirect logic is centralized in useAuth hook's useEffect
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth(); // Get isAuthenticated and loading state
  const router = useRouter();

  // The primary redirect logic for unauthorized access
  // is now within the main `useAuth` hook's `useEffect`.
  // This component will just ensure the children are only rendered
  // when the user is authenticated and loading is complete.
  useEffect(() => {
    // If we're done loading auth state and the user is NOT authenticated,
    // the useAuth hook should have already redirected.
    // This part ensures no flash of content if `useAuth` was too slow
    // or if the component is used independently of the main route protection.
    if (!loading && !isAuthenticated) {
        // This log might indicate a race condition or misconfiguration
        // if user is already null and useAuth's useEffect hasn't fired yet for some reason.
        // Usually, the useAuth useEffect handles the push.
        console.warn('AuthGuard: User not authenticated after loading, redirecting to login. (This should be handled by useAuth useEffect)');
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [loading, isAuthenticated, router]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        Loading authentication...
      </div>
    );
  }

  // If not loading and not authenticated, return null or a simple message
  // as the redirect should be happening via `useAuth`'s useEffect
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}