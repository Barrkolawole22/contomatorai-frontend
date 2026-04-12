'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth as useAuthContext } from '@/context/AuthProvider'; // Renamed to avoid confusion
import type { User } from '@/context/AuthProvider';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const {
    user,
    loading,
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    isAuthenticated,
    refreshUser
  } = useAuthContext();

  const router = useRouter();
  const pathname = usePathname();

  const error = null; // Error state is managed in AuthProvider

  const refreshToken = async () => {
    console.log('🔄 Refreshing user data...');
    await refreshUser();
  };

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<void> => {
    console.log('🎯 useAuth: Starting login process');
    await contextLogin(email, password, rememberMe);
    console.log('✅ useAuth: Login successful');
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    console.log('📝 useAuth: Starting registration process', { email, name });
    await contextRegister(email, password, name);
    console.log('✅ useAuth: Registration successful');
  };

  const logout = (): void => {
    console.log('👋 useAuth: Logging out');
    contextLogout();
  };

  // 🔧 FIXED: Simplified route protection - NO automatic redirects here
  // Let individual pages/layouts handle their own authentication logic
  useEffect(() => {
    // Only log the current state, don't redirect
    console.log('🛡️ useAuth: Current state', {
      pathname,
      isAuthenticated,
      loading,
      userEmail: user?.email
    });
  }, [user, loading, pathname, isAuthenticated]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated,
  };
};

// 🔧 FIXED: Simplified hook for components that require auth
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  return { user, loading };
};