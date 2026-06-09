'use client';

import { useAuth as useAuthContext } from '@/context/AuthProvider';
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

/**
 * Thin wrapper around AuthProvider's useAuth context.
 * Prefer importing useAuth directly from '@/context/AuthProvider' for new code.
 */
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

  return {
    user,
    loading,
    error: null,
    login: (email, password, rememberMe) => contextLogin(email, password, rememberMe),
    register: (email, password, name) => contextRegister(email, password, name),
    logout: contextLogout,
    refreshToken: refreshUser,
    isAuthenticated,
  };
};

export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  return { user, loading };
};