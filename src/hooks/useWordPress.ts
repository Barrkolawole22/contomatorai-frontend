import { useState, useEffect, useCallback } from 'react';
import { sitesAPI } from '@/lib/api';

// ✅ UNIFIED Interface - matches your backend response
interface WordPressSite {
  id: string;
  name: string;
  url: string;
  apiUrl: string;
  username: string;
  status: 'connected' | 'error' | 'pending';
  lastSync?: string;
  postsCount?: number;
  categoriesCount?: number;
  tagsCount?: number;
  version?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface SiteFormData {
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
}

interface ConnectionTestResult {
  success: boolean;
  user?: {
    id: number;
    name: string;
    roles: string[];
  };
  error?: string;
}

export const useWordPress = () => {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIXED: Load sites using correct endpoint
  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading WordPress sites from backend...');
      const response = await sitesAPI.getSites();
      
      if (response.data.success) {
        console.log('✅ Sites loaded successfully:', response.data.data);
        setSites(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to load sites');
      }
    } catch (err: any) {
      console.error('❌ Error loading sites:', err);
      setError(err.response?.data?.message || 'Failed to load WordPress sites');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIXED: Connect site using proper API
  const connectSite = async (formData: SiteFormData): Promise<WordPressSite> => {
    try {
      setError(null);
      
      // Basic validation
      if (!formData.name.trim() || !formData.url.trim() || !formData.username.trim() || !formData.applicationPassword.trim()) {
        throw new Error('All fields are required');
      }

      // URL validation
      if (!formData.url.match(/^https?:\/\/.+/)) {
        throw new Error('Please enter a valid URL (including http:// or https://)');
      }

      const siteUrl = formData.url.replace(/\/$/, ''); // Remove trailing slash
      const apiUrl = `${siteUrl}/wp-json/wp/v2`;
      
      console.log('🔗 Adding WordPress site:', { 
        name: formData.name, 
        url: siteUrl,
        username: formData.username 
      });
      
      const response = await sitesAPI.addSite({
        name: formData.name,
        url: siteUrl,
        apiUrl,
        username: formData.username,
        applicationPassword: formData.applicationPassword
      });
      
      if (response.data.success) {
        console.log('✅ Site added successfully:', response.data.data);
        
        // Add new site to state
        setSites(prev => [response.data.data, ...prev]);
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to add site');
      }
    } catch (err: any) {
      console.error('❌ Error adding site:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to connect WordPress site';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ✅ FIXED: Disconnect site
  const disconnectSite = async (siteId: string): Promise<void> => {
    try {
      setError(null);
      
      console.log('🗑️ Deleting WordPress site:', siteId);
      const response = await sitesAPI.deleteSite(siteId);
      
      if (response.data.success) {
        console.log('✅ Site deleted successfully');
        setSites(prev => prev.filter(site => site.id !== siteId));
      } else {
        throw new Error(response.data.message || 'Failed to delete site');
      }
    } catch (err: any) {
      console.error('❌ Error deleting site:', err);
      const errorMessage = err.response?.data?.message || 'Failed to disconnect WordPress site';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ✅ FIXED: Test connection with better error handling
  const testConnection = async (siteId: string): Promise<ConnectionTestResult> => {
    try {
      setError(null);
      
      console.log('🔗 Testing WordPress connection:', siteId);
      const response = await sitesAPI.testConnection(siteId);
      
      if (response.data.success) {
        console.log('✅ Connection test successful');
        
        // Update site status in state
        setSites(prev => prev.map(site => 
          site.id === siteId 
            ? { ...site, status: 'connected' as const }
            : site
        ));
        
        return {
          success: true,
          user: response.data.data?.user
        };
      } else {
        throw new Error(response.data.message || 'Connection test failed');
      }
    } catch (err: any) {
      console.error('❌ Error testing connection:', err);
      
      // Update site status to error
      setSites(prev => prev.map(site => 
        site.id === siteId 
          ? { ...site, status: 'error' as const }
          : site
      ));
      
      const errorMessage = err.response?.data?.message || 'Failed to test WordPress connection';
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // ✅ FIXED: Sync taxonomies
  const syncTaxonomies = async (siteId: string): Promise<void> => {
    try {
      setError(null);
      
      console.log('🔄 Syncing WordPress site:', siteId);
      const response = await sitesAPI.syncTaxonomies(siteId);
      
      if (response.data.success) {
        console.log('✅ Site synced successfully');
        
        // Update site in state
        setSites(prev => prev.map(site => 
          site.id === siteId 
            ? { 
                ...site, 
                lastSync: new Date().toISOString(), 
                status: 'connected' as const,
                categories: response.data.data?.categories || site.categories,
                tags: response.data.data?.tags || site.tags
              }
            : site
        ));
      } else {
        throw new Error(response.data.message || 'Failed to sync site');
      }
    } catch (err: any) {
      console.error('❌ Error syncing site:', err);
      const errorMessage = err.response?.data?.message || 'Failed to sync WordPress site';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ✅ NEW: Update site
  const updateSite = async (siteId: string, formData: Partial<SiteFormData>): Promise<WordPressSite> => {
    try {
      setError(null);
      
      console.log('✏️ Updating WordPress site:', siteId);
      
      const updateData: any = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.url) {
        const siteUrl = formData.url.replace(/\/$/, '');
        updateData.url = siteUrl;
        updateData.apiUrl = `${siteUrl}/wp-json/wp/v2`;
      }
      if (formData.username) updateData.username = formData.username;
      if (formData.applicationPassword) updateData.applicationPassword = formData.applicationPassword;
      
      const response = await sitesAPI.updateSite(siteId, updateData);
      
      if (response.data.success) {
        console.log('✅ Site updated successfully:', response.data.data);
        
        // Update site in state
        setSites(prev => prev.map(site => 
          site.id === siteId 
            ? { 
                ...site, 
                ...updateData,
                status: 'connected' as const
              }
            : site
        ));
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update site');
      }
    } catch (err: any) {
      console.error('❌ Error updating site:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update WordPress site';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ✅ NEW: Get site categories
  const getSiteCategories = async (siteId: string) => {
    try {
      const site = sites.find(s => s.id === siteId);
      if (!site) {
        throw new Error('Site not found');
      }
      
      // Return cached categories if available
      if (site.categories && site.categories.length > 0) {
        return site.categories;
      }
      
      // Otherwise sync and return
      await syncTaxonomies(siteId);
      const updatedSite = sites.find(s => s.id === siteId);
      return updatedSite?.categories || [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch WordPress categories');
      throw err;
    }
  };

  // ✅ NEW: Get recent posts
  const getRecentPosts = async (siteId: string, limit = 10) => {
    try {
      const response = await sitesAPI.getRecentPosts(siteId, limit);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch recent posts');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch recent posts');
      throw err;
    }
  };

  // ✅ NEW: Bulk operations
  const bulkUpdateSites = async (siteIds: string[], action: 'sync' | 'test' | 'activate' | 'deactivate') => {
    const results = [];
    
    for (const siteId of siteIds) {
      try {
        switch (action) {
          case 'sync':
            await syncTaxonomies(siteId);
            break;
          case 'test':
            await testConnection(siteId);
            break;
          case 'activate':
          case 'deactivate':
            // Could implement activate/deactivate if needed
            break;
        }
        results.push({ siteId, success: true });
      } catch (error: any) {
        results.push({ siteId, success: false, error: error.message });
      }
    }
    
    return results;
  };

  // Initialize on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return {
    sites,
    loading,
    error,
    
    // Core operations
    connectSite,
    disconnectSite,
    updateSite,
    testConnection,
    syncTaxonomies,
    
    // Data fetching
    getSiteCategories,
    getRecentPosts,
    refreshSites: fetchSites,
    
    // Bulk operations
    bulkUpdateSites,
    
    // Utility methods
    clearError: () => setError(null),
    getSiteById: (id: string) => sites.find(site => site.id === id),
    getConnectedSites: () => sites.filter(site => site.status === 'connected'),
    getActiveSites: () => sites.filter(site => site.isActive)
  };
};