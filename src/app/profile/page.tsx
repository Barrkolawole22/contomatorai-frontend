'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Shield,
  Bell,
  Palette,
  Key,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Upload,
  Camera,
  Check,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Globe,
  CreditCard,
  Settings,
  Lock,
  Smartphone,
  Download,
  Trash2,
  Edit3,
  RefreshCw,
  Monitor
} from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  company?: string;
  bio?: string;
  avatar?: string;
  role: string;
  isAdmin: boolean;
  credits?: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
    contentUpdates: boolean;
    website?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    loginHistory: Array<{
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
  subscriptionStatus?: string;
  createdAt: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage = () => {
  const { user, logout, updateUser, setUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fixed: Function to properly process avatar URLs
  const processAvatarUrl = useCallback((url: string): string => {
    if (!url) return '';
    
    console.log('Processing avatar URL:', url);
    
    // If it's already a proxied URL, return as-is
    if (url.includes('/api/image-proxy')) {
      console.log('Already proxied URL, returning as-is');
      return url;
    }
    
    // Fix: Handle old proxy-image URLs (convert to correct endpoint)
    if (url.includes('/api/proxy-image/')) {
      console.log('Converting old proxy-image URL to image-proxy');
      const path = url.replace(/^.*\/api\/proxy-image/, '');
      const newUrl = `/api/image-proxy?path=${encodeURIComponent(path)}`;
      console.log('Converted to:', newUrl);
      return newUrl;
    }
    
    // If it contains localhost:5000, proxy it
    if (url.includes('localhost:5000')) {
      const path = url.replace(/^.*localhost:5000/, '');
      const newUrl = `/api/image-proxy?path=${encodeURIComponent(path)}`;
      console.log('Proxied localhost URL to:', newUrl);
      return newUrl;
    }
    
    // If it starts with /uploads/, proxy it
    if (url.startsWith('/uploads/')) {
      const newUrl = `/api/image-proxy?path=${encodeURIComponent(url)}`;
      console.log('Proxied relative URL to:', newUrl);
      return newUrl;
    }
    
    console.log('URL needs no processing, returning as-is');
    return url;
  }, []);

  const [profile, setProfile] = useState<UserProfile>(() => {
    // Process avatar URL on initial load
    const avatarUrl = processAvatarUrl(user?.avatar || '');
    
    return {
      _id: user?.id || '',
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      company: user?.company || '',
      bio: user?.bio || '',
      avatar: avatarUrl,
      role: user?.role || 'user',
      isAdmin: user?.isAdmin || false,
      credits: user?.credits,
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        securityAlerts: true,
        weeklyReports: true,
        contentUpdates: true,
        website: user?.preferences?.website || '',
        ...user?.preferences
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: new Date().toISOString(),
        loginHistory: [],
        ...user?.security
      },
      subscription: user?.subscription,
      subscriptionStatus: user?.subscriptionStatus,
      createdAt: user?.createdAt || new Date().toISOString()
    };
  });

  // Fixed: Update profile when user changes
  useEffect(() => {
    if (user && !saving) {
      setProfile(prev => {
        const avatarUrl = processAvatarUrl(user.avatar || prev.avatar);
        
        return {
          ...prev,
          _id: user.id || prev._id,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
          location: user.location || prev.location,
          company: user.company || prev.company,
          bio: user.bio || prev.bio,
          avatar: avatarUrl,
          role: user.role || prev.role,
          isAdmin: user.isAdmin || prev.isAdmin,
          credits: user.credits ?? prev.credits,
          preferences: {
            ...prev.preferences,
            ...user.preferences,
            website: user.preferences?.website || prev.preferences.website
          },
          security: {
            ...prev.security,
            ...user.security
          },
          subscription: user.subscription || prev.subscription,
          subscriptionStatus: user.subscriptionStatus || prev.subscriptionStatus,
          createdAt: user.createdAt || prev.createdAt
        };
      });
      setImageError(false);
    }
  }, [user, saving, processAvatarUrl]);

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || profile.preferences.theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark);
    
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, [profile.preferences.theme]);

  // Debug avatar URL
  useEffect(() => {
    console.log('=== AVATAR DEBUG ===');
    console.log('User object:', user);
    console.log('Profile avatar:', profile.avatar);
    console.log('User avatar:', user?.avatar);
    console.log('Image error state:', imageError);
    console.log('Saving state:', saving);
    console.log('===================');
  }, [user, profile.avatar, imageError, saving]);

  // Check authentication
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, router]);

  const handleProfileUpdate = async (section: 'general' | 'preferences' | 'security') => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        ...(section === 'general' && {
          name: profile.name,
          phone: profile.phone,
          location: profile.location,
          company: profile.company,
          bio: profile.bio
        }),
        ...(section === 'preferences' && {
          preferences: profile.preferences
        }),
        ...(section === 'security' && {
          security: profile.security
        })
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      await updateUser(updatedUser.data);
      setSuccess('Profile updated successfully!');
      
      // Apply theme changes immediately
      if (section === 'preferences') {
        const newTheme = profile.preferences.theme;
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'system') {
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(systemPrefersDark);
          document.documentElement.classList.toggle('dark', systemPrefersDark);
        } else {
          const shouldUseDark = newTheme === 'dark';
          setDarkMode(shouldUseDark);
          document.documentElement.classList.toggle('dark', shouldUseDark);
        }
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Avatar upload handler with proper error handling
  const handleAvatarUpload = async (file: File) => {
    console.log('=== STARTING AVATAR UPLOAD ===');
    console.log('File:', file);

    // Declare previousAvatar with let to use in catch block
    let previousAvatar = profile.avatar || '';

    try {
      setSaving(true);
      setError(null);

      // Create a local URL for immediate preview
      const localUrl = URL.createObjectURL(file);
      console.log('Local preview URL:', localUrl);
      console.log('Previous avatar:', previousAvatar);

      setProfile(prev => ({ ...prev, avatar: localUrl }));
      setImageError(false);

      const formData = new FormData();
      formData.append('avatar', file);

      // Use absolute path to ensure correct routing
      console.log('Sending request to /api/profile/avatar...');
      
      // FIXED: Use window.location.origin to ensure we're using the correct origin
      // and avoid any path duplication issues
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/profile/avatar`;
      
      console.log('Full request URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload failed:', errorData);
        throw new Error(errorData.message || `Failed to upload avatar: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('=== UPLOAD RESPONSE ===');
      console.log('Full response:', result);
      
      // Clean up the local URL
      URL.revokeObjectURL(localUrl);
      
      // Get the new avatar URL from server response
      const newAvatarUrl = result.data?.avatar || result.avatar || result.url;
      console.log('Extracted avatar URL:', newAvatarUrl);
      
      if (!newAvatarUrl) {
        console.error('No avatar URL found in response!');
        throw new Error('Server did not return avatar URL');
      }
      
      // Process the URL correctly using the right proxy endpoint
      const processedUrl = processAvatarUrl(newAvatarUrl);
      console.log('Processed avatar URL:', processedUrl);
      
      // Update profile with the processed URL
      setProfile(prev => ({ ...prev, avatar: processedUrl }));
      setImageError(false);
      
      // Update user context properly
      if (setUser && user) {
        console.log('Updating user context with avatar:', newAvatarUrl);
        try {
          // Update just the local user context with the original avatar URL
          const updatedUser = { ...user, avatar: newAvatarUrl };
          setUser(updatedUser); // Direct context update
          localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist to localStorage
          console.log('User context updated successfully');
        } catch (err) {
          console.error('Failed to update user context:', err);
        }
      }
      
      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      console.log('=== UPLOAD COMPLETE ===');
    } catch (err: any) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error details:', err);
      setError(err.message || 'Failed to upload avatar');

      // FIXED: Revert to previous avatar with proper null handling
      setProfile(prev => ({ 
        ...prev, 
        avatar: previousAvatar ? processAvatarUrl(previousAvatar) : '' 
      }));

      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
      console.log('=== UPLOAD FINISHED ===');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <User className="w-5 h-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-5 h-5" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loading Profile...
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to access your profile.
          </p>
          <button
            onClick={() => router.push('/login?redirect=/profile')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Profile Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user.isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    {profile.avatar && !imageError ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', profile.avatar);
                          console.error('Current profile state:', profile);
                          setImageError(true);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', profile.avatar);
                          setImageError(false);
                        }}
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 z-10">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg cursor-pointer shadow-lg transition-all duration-200 block">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Starting new upload, resetting image error state');
                            setImageError(false);
                            handleAvatarUpload(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {profile.email}
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    profile.isAdmin 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {profile.isAdmin ? 'Administrator' : 'User'}
                  </span>
                  {profile.credits !== undefined && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {profile.credits} Credits
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Member since {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        General Information
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Update your basic profile information
                      </p>
                    </div>
                    <button
                      onClick={() => handleProfileUpdate('general')}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      {saving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Email cannot be changed for security reasons
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter your location"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Company
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={profile.company}
                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter your company name"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={profile.preferences?.website || ''}
                          onChange={(e) => setProfile({ 
                            ...profile, 
                            preferences: { 
                              ...profile.preferences, 
                              website: e.target.value 
                            } 
                          })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Preferences
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Customize your experience and notification settings
                      </p>
                    </div>
                    <button
                      onClick={() => handleProfileUpdate('preferences')}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                      {saving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* Appearance */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Palette className="w-5 h-5" />
                        <span>Appearance</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Theme
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
                              { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                              { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> }
                            ].map((theme) => (
                              <button
                                key={theme.value}
                                onClick={() => setProfile({
                                  ...profile,
                                  preferences: { ...profile.preferences, theme: theme.value as any }
                                })}
                                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                                  profile.preferences.theme === theme.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                              >
                                {theme.icon}
                                <span className="text-sm font-medium">{theme.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Language
                            </label>
                            <select
                              value={profile.preferences.language}
                              onChange={(e) => setProfile({
                                ...profile,
                                preferences: { ...profile.preferences, language: e.target.value }
                              })}
                              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="it">Italian</option>
                              <option value="pt">Portuguese</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Timezone
                            </label>
                            <select
                              value={profile.preferences.timezone}
                              onChange={(e) => setProfile({
                                ...profile,
                                preferences: { ...profile.preferences, timezone: e.target.value }
                              })}
                              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            >
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">Eastern Time</option>
                              <option value="America/Chicago">Central Time</option>
                              <option value="America/Denver">Mountain Time</option>
                              <option value="America/Los_Angeles">Pacific Time</option>
                              <option value="Europe/London">London</option>
                              <option value="Europe/Paris">Paris</option>
                              <option value="Asia/Tokyo">Tokyo</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Bell className="w-5 h-5" />
                        <span>Notifications</span>
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                          { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                          { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional emails and updates' },
                          { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security notifications' },
                          { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly summary of your activity' },
                          { key: 'contentUpdates', label: 'Content Updates', description: 'Notifications about content changes' }
                        ].map((setting) => (
                          <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {setting.label}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {setting.description}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profile.preferences[setting.key as keyof typeof profile.preferences] as boolean}
                                onChange={(e) => setProfile({
                                  ...profile,
                                  preferences: {
                                    ...profile.preferences,
                                    [setting.key]: e.target.checked
                                  }
                                })}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 rounded-full transition-all duration-200 ${
                                profile.preferences[setting.key as keyof typeof profile.preferences]
                                  ? 'bg-blue-600'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-200 ${
                                  profile.preferences[setting.key as keyof typeof profile.preferences]
                                    ? 'translate-x-5'
                                    : 'translate-x-0.5'
                                } mt-0.5`}></div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Security Settings
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your account security and authentication
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Password */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Key className="w-5 h-5" />
                        <span>Password</span>
                      </h3>
                      <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Password
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last changed: {formatDate(profile.security.lastPasswordChange)}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                          >
                            <Lock className="w-4 h-4" />
                            <span>Change Password</span>
                          </button>
                        </div>

                        {showPasswordForm && (
                          <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showCurrentPassword ? 'text' : 'password'}
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  className="w-full pl-4 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                  placeholder="Enter current password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showNewPassword ? 'text' : 'password'}
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  className="w-full pl-4 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                placeholder="Confirm new password"
                              />
                            </div>

                            <div className="flex items-center space-x-3 pt-4">
                              <button
                                onClick={handlePasswordChange}
                                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                              >
                                {saving ? (
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Save className="w-5 h-5" />
                                )}
                                <span>{saving ? 'Updating...' : 'Update Password'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setShowPasswordForm(false);
                                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Smartphone className="w-5 h-5" />
                        <span>Two-Factor Authentication</span>
                      </h3>
                      <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Two-Factor Authentication
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {profile.security.twoFactorEnabled 
                                ? 'Your account is protected with 2FA' 
                                : 'Add an extra layer of security to your account'
                              }
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm px-3 py-1 rounded-full ${
                              profile.security.twoFactorEnabled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {profile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <button
                              onClick={() => setProfile({
                                ...profile,
                                security: {
                                  ...profile.security,
                                  twoFactorEnabled: !profile.security.twoFactorEnabled
                                }
                              })}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                profile.security.twoFactorEnabled
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {profile.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Login History */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
                        <span>Recent Login Activity</span>
                      </h3>
                      <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-6">
                        <div className="space-y-4">
                          {profile.security.loginHistory.length > 0 ? (
                            profile.security.loginHistory.map((login, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {login.location}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {login.device} • {login.ip}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(login.timestamp)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 dark:text-gray-400">No recent login activity</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription */}
              {activeTab === 'subscription' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Subscription & Billing
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your subscription and billing information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Current Plan */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Current Plan</span>
                      </h3>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-6">
                        {profile.subscription ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                {profile.subscription.plan} Plan
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400">
                                Status: <span className={`font-medium ${
                                  profile.subscription.status === 'active' 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {profile.subscription.status}
                                </span>
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Next billing: {formatDate(profile.subscription.expiresAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl mb-2">
                                Manage Subscription
                              </button>
                              <br />
                              <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                <Download className="w-4 h-4 inline mr-1" />
                                Download Invoice
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              No Active Subscription
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                              Upgrade to unlock premium features and advanced functionality
                            </p>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                              Choose a Plan
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>Account Actions</span>
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Export Account Data
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Download a copy of all your account data
                              </p>
                            </div>
                            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
                              <Download className="w-4 h-4" />
                              <span>Export</span>
                            </button>
                          </div>
                        </div>

                        <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-red-900 dark:text-red-300">
                                Delete Account
                              </h4>
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Permanently delete your account and all associated data
                              </p>
                            </div>
                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
