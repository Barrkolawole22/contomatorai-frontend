'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  
  wordCredits: number;
  totalWordsUsed: number;
  currentMonthUsage: number;
  
  usageCredits: number;
  credits: number;
  creditUsage?: number;
  
  remainingCredits?: number;
  usedCredits?: number;
  subscriptionPlan?: string;
  
  plan: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  maxCredits?: number;
  subscriptionStatus?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  company?: string;
  bio?: string;
  preferences?: {
    theme?: 'system' | 'light' | 'dark';
    defaultContentType?: 'blog' | 'article' | 'social' | 'email' | 'product' | 'landing';
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
    securityAlerts?: boolean;
    weeklyReports?: boolean;
    contentUpdates?: boolean;
    website?: string;
  };
  security?: {
    twoFactorEnabled?: boolean;
    lastPasswordChange?: string;
    loginHistory?: Array<{
      ip: string;
      location: string;
      timestamp: string;
      device: string;
    }>;
  };
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
  getDefaultRoute: () => string;
  setUser: (user: User | null) => void;
  deductWordCredits: (wordCount: number) => Promise<boolean>;
  hasWordCredits: (wordCount: number) => boolean;
  getWordCreditStatus: () => {
    available: number;
    used: number;
    percentage: number;
    canAfford: (words: number) => boolean;
  };
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const processAvatarUrl = useCallback((url: string): string => {
    if (!url) return '';
    if (url.includes('/api/image-proxy')) return url;
    if (url.startsWith('blob:')) return url;
    
    if (url.includes('localhost:5000') || url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        return `/api/image-proxy?path=${encodeURIComponent(path)}`;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `/api/image-proxy?path=${encodeURIComponent(cleanPath)}`;
    }
    
    if (url && !url.startsWith('http') && !url.startsWith('/api/')) {
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `/api/image-proxy?path=${encodeURIComponent(cleanPath)}`;
    }
    
    return url;
  }, []);

  const getDefaultRoute = useCallback(() => {
    if (!user) return '/login';
    const isUserAdmin = user.isAdmin || user.role === 'admin' || user.role === 'super_admin';
    return isUserAdmin ? '/admin' : '/dashboard';
  }, [user]);

  const formatUserData = useCallback((userData: any): User => {
    const isUserAdmin = userData.role === 'admin' || userData.role === 'super_admin';
    const processedAvatar = processAvatarUrl(userData.avatar || '');
    
    let userPlan = 'free';
    if (userData.subscription?.plan) {
      userPlan = userData.subscription.plan;
    } else if (userData.subscriptionStatus) {
      userPlan = userData.subscriptionStatus;
    } else if (userData.plan) {
      userPlan = userData.plan;
    }
    
    return {
      id: userData.id || userData._id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'user',
      isAdmin: isUserAdmin,
      
      wordCredits: userData.wordCredits || 0,
      totalWordsUsed: userData.totalWordsUsed || 0,
      currentMonthUsage: userData.currentMonthUsage || 0,
      
      usageCredits: userData.credits || userData.usageCredits || userData.wordCredits || 0,
      credits: userData.credits || userData.wordCredits || 0,
      creditUsage: userData.creditUsage || userData.currentMonthUsage || 0,
      
      remainingCredits: userData.credits || userData.usageCredits || userData.wordCredits || 0,
      usedCredits: userData.creditUsage || userData.currentMonthUsage || userData.usedCredits || 0,
      subscriptionPlan: userPlan,
      
      plan: userPlan,
      status: userData.status || 'active',
      emailVerified: userData.emailVerified || false,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin,
      maxCredits: userData.maxCredits,
      subscriptionStatus: userData.subscriptionStatus,
      avatar: processedAvatar,
      phone: userData.phone,
      location: userData.location,
      company: userData.company,
      bio: userData.bio,
      preferences: {
        ...userData.preferences,
        theme: userData.preferences?.theme as 'system' | 'light' | 'dark' || 'system',
      },
      security: userData.security,
      subscription: userData.subscription
    };
  }, [processAvatarUrl]);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return false;
      }

      const response = await authAPI.getCurrentUser();

      if (response.data.success) {
        const userData = formatUserData(response.data.user);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      return false;
    }
  }, [formatUserData]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (initialized) return;
      
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken && isMounted) {
        try {
          const userData = JSON.parse(savedUser);
          const formattedUser = formatUserData(userData);
          setUser(formattedUser);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      
      if (isMounted) {
        await fetchUser();
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUser, initialized, formatUserData]);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    try {
      console.log('🔑 Attempting login to:', process.env.NEXT_PUBLIC_API_URL);

      const response = await authAPI.login({ email, password });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        const formattedUser = formatUserData(userData);

        try {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(formattedUser));
        } catch (storageError) {
          console.error('❌ Failed to store auth data in localStorage:', storageError);
          throw new Error('Failed to save login session. Please check your browser settings.');
        }

        setUser(formattedUser);
        console.log('✅ Login successful');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);

      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }

      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(error.response?.data?.message || error.message || 'Login failed. Please check your credentials.');
    }
  }, [formatUserData]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await authAPI.register({
        email,
        password,
        name,
        confirmPassword: password
      });

      if (response.data.success) {
        if (response.data.requiresVerification) {
          throw new Error('VERIFICATION_REQUIRED');
        }
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No user logged in to update.');

    try {
      const optimisticUpdate = { ...user, ...userData };
      if (optimisticUpdate.avatar) {
        optimisticUpdate.avatar = processAvatarUrl(optimisticUpdate.avatar);
      }
      
      setUser(optimisticUpdate);
      localStorage.setItem('user', JSON.stringify(optimisticUpdate));
      
      if (Object.keys(userData).length === 1 && userData.avatar) {
        return formatUserData(optimisticUpdate);
      }
      
      const response = await authAPI.updateProfile(userData);

      if (response.data.success) {
        const updatedUser = formatUserData(response.data.user);
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error: any) {
      if (!(Object.keys(userData).length === 1 && userData.avatar)) {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      }
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  }, [user, processAvatarUrl, formatUserData]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const deductWordCredits = useCallback(async (wordCount: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      if (user.wordCredits < wordCount) {
        return false;
      }
      
      const response = await authAPI.post('/auth/deduct-credits', { amount: wordCount });
      
      if (response.data.success) {
        const updatedUser = {
          ...user,
          wordCredits: response.data.wordCredits,
          totalWordsUsed: response.data.totalWordsUsed,
          currentMonthUsage: response.data.currentMonthUsage,
          remainingCredits: response.data.wordCredits,
          usedCredits: response.data.totalWordsUsed
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      }
      
      return false;
    } catch (error: any) {
      return false;
    }
  }, [user]);

  const hasWordCredits = useCallback((wordCount: number): boolean => {
    if (!user) return false;
    return user.wordCredits >= wordCount;
  }, [user]);

  const getWordCreditStatus = useCallback(() => {
    if (!user) {
      return {
        available: 0,
        used: 0,
        percentage: 0,
        canAfford: () => false
      };
    }

    const total = user.wordCredits + user.totalWordsUsed;
    const usedPercentage = total > 0 ? (user.totalWordsUsed / total) * 100 : 0;

    return {
      available: user.wordCredits,
      used: user.totalWordsUsed,
      percentage: usedPercentage,
      canAfford: (words: number) => user.wordCredits >= words
    };
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await authAPI.post('/auth/reset-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }, []);

  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin' || false;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    getDefaultRoute,
    setUser: (newUser: User | null) => {
      if (newUser && newUser.avatar) {
        newUser.avatar = processAvatarUrl(newUser.avatar);
      }
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user');
      }
    },
    deductWordCredits,
    hasWordCredits,
    getWordCreditStatus,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};