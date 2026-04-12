// components/shared/Avatar.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { User, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUpload?: boolean;
  className?: string;
  onUploadSuccess?: (avatarUrl: string) => void;
  userId?: string; // For displaying other users' avatars
  userAvatar?: string; // For displaying other users' avatars
  userName?: string; // For alt text
}

const Avatar = ({ 
  size = 'md', 
  showUpload = false, 
  className = '',
  onUploadSuccess,
  userId,
  userAvatar,
  userName
}: AvatarProps) => {
  const { user, updateUser } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use provided user data or current user data
  const displayUser = userId ? { avatar: userAvatar, name: userName } : user;
  const isCurrentUser = !userId || userId === user?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔧 FIXED: Enhanced avatar URL processing with persistence
  const processAvatarUrl = useCallback((url: string): string => {
    if (!url) return '';
    
    console.log('🔄 Processing avatar URL:', url);
    
    // If it's already a proxied URL, return as-is
    if (url.includes('/api/image-proxy')) {
      console.log('✅ Already proxied URL');
      return url;
    }
    
    // If it's a blob URL (upload preview), return as-is
    if (url.startsWith('blob:')) {
      console.log('✅ Blob URL for preview');
      return url;
    }
    
    // Handle full URLs - extract path and proxy
    if (url.includes('localhost:5000') || url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const newUrl = `/api/image-proxy?path=${encodeURIComponent(path)}`;
        console.log('✅ Converted full URL to proxied:', newUrl);
        return newUrl;
      } catch (e) {
        console.warn('⚠️ Failed to parse URL, treating as relative');
      }
    }
    
    // Handle relative paths - ensure they're proxied
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      const newUrl = `/api/image-proxy?path=${encodeURIComponent(cleanPath)}`;
      console.log('✅ Proxied relative URL:', newUrl);
      return newUrl;
    }
    
    // For any other format, treat as relative path and proxy
    if (url && !url.startsWith('http') && !url.startsWith('/api/')) {
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      const newUrl = `/api/image-proxy?path=${encodeURIComponent(cleanPath)}`;
      console.log('✅ Treated unknown format as relative and proxied:', newUrl);
      return newUrl;
    }
    
    console.log('✅ URL needs no processing');
    return url;
  }, []);

  // 🔧 FIXED: Get avatar URL with proper processing
  const avatarUrl = processAvatarUrl(displayUser?.avatar || '');

  // 🔧 FIXED: Reset image error when avatar URL changes
  useEffect(() => {
    if (avatarUrl) {
      setImageError(false);
    }
  }, [avatarUrl]);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', upload: 'w-3 h-3' },
    md: { container: 'w-12 h-12', icon: 'w-6 h-6', upload: 'w-4 h-4' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8', upload: 'w-4 h-4' },
    xl: { container: 'w-24 h-24', icon: 'w-12 h-12', upload: 'w-4 h-4' }
  };

  const config = sizeConfig[size];

  // 🔧 FIXED: Enhanced avatar upload with proper URL handling
  const handleAvatarUpload = async (file: File) => {
    if (!file || !isCurrentUser) return;

    try {
      setUploading(true);
      console.log('📸 Starting avatar upload...');
      
      // Create local preview URL
      const localUrl = URL.createObjectURL(file);
      console.log('👁️ Created local preview URL:', localUrl);
      
      // Show preview immediately (optional - remove if you don't want preview)
      // setImageError(false);

      const formData = new FormData();
      formData.append('avatar', file);

      console.log('⬆️ Uploading to /api/profile/avatar...');
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const result = await response.json();
      console.log('✅ Upload response:', result);
      
      // Clean up preview URL
      URL.revokeObjectURL(localUrl);
      
      // 🔧 FIXED: Extract and process avatar URL properly
      const newAvatarUrl = result.data?.avatar || result.avatar || result.url;
      console.log('💾 New avatar URL from server:', newAvatarUrl);
      
      if (!newAvatarUrl) {
        throw new Error('No avatar URL returned from server');
      }
      
      // 🔧 FIXED: Update user context with the original URL
      // Let the processing happen in the context/component
      if (updateUser && user) {
        console.log('🔄 Updating user context with new avatar');
        await updateUser({ avatar: newAvatarUrl });
        console.log('✅ User context updated successfully');
      }
      
      // Reset image error state
      setImageError(false);
      
      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(newAvatarUrl);
      }
      
      console.log('🎉 Avatar upload completed successfully');
    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error);
      setImageError(true);
      
      // You might want to show a toast notification here
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to upload avatar: ' + error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  // 🔧 FIXED: Enhanced image error handling
  const handleImageError = useCallback(() => {
    console.error('❌ Avatar image failed to load:', avatarUrl);
    console.log('🔍 Image error details:', {
      avatarUrl,
      displayUser: displayUser?.name,
      mounted,
      uploading
    });
    setImageError(true);
  }, [avatarUrl, displayUser?.name, mounted, uploading]);

  const handleImageLoad = useCallback(() => {
    console.log('✅ Avatar image loaded successfully:', avatarUrl);
    setImageError(false);
  }, [avatarUrl]);

  if (!mounted) {
    // Server-side rendering fallback
    return (
      <div className={`${config.container} bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ${className}`}>
        <User className={`${config.icon} text-white`} />
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${config.container} bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden relative`}>
        {avatarUrl && !imageError ? (
          <>
            <img 
              src={avatarUrl} 
              alt={displayUser?.name || userName || 'User avatar'}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              // 🔧 FIXED: Add loading attribute for better performance
              loading="lazy"
              // 🔧 FIXED: Add crossOrigin for CORS handling
              crossOrigin="anonymous"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <User className={`${config.icon} text-white`} />
            )}
          </div>
        )}
      </div>
      
      {/* 🔧 FIXED: Only show upload button for current user */}
      {showUpload && isCurrentUser && (
        <div className="absolute -bottom-1 -right-1 z-10">
          <label className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg cursor-pointer shadow-lg transition-all duration-200 block">
            <Camera className={config.upload} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  console.log('📁 File selected for upload:', file.name);
                  handleAvatarUpload(file);
                }
              }}
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default Avatar;