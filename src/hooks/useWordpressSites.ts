import { useState, useEffect } from 'react';
import { sitesAPI } from '@/lib/api';

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
}

interface SiteFormData {
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
}

export const useWordPressSites = () => {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sitesAPI.getSites();
      
      if (response.data.success) {
        setSites(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to load sites');
      }
    } catch (err: any) {
      console.error('Error loading sites:', err);
      setError(err.response?.data?.message || 'Failed to load WordPress sites');
    } finally {
      setLoading(false);
    }
  };

  const addSite = async (formData: SiteFormData) => {
    const siteUrl = formData.url.replace(/\/$/, '');
    const apiUrl = `${siteUrl}/wp-json/wp/v2`;
    
    const response = await sitesAPI.addSite({
      name: formData.name,
      url: siteUrl,
      apiUrl,
      username: formData.username,
      applicationPassword: formData.applicationPassword
    });
    
    if (response.data.success) {
      setSites(prev => [response.data.data, ...prev]);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to add site');
    }
  };

  const deleteSite = async (siteId: string) => {
    const response = await sitesAPI.deleteSite(siteId);
    
    if (response.data.success) {
      setSites(prev => prev.filter(site => site.id !== siteId));
    } else {
      throw new Error(response.data.message || 'Failed to delete site');
    }
  };

  const syncSite = async (siteId: string) => {
    const response = await sitesAPI.syncTaxonomies(siteId);
    
    if (response.data.success) {
      setSites(prev => prev.map(site => 
        site.id === siteId 
          ? { ...site, lastSync: new Date().toISOString(), status: 'connected' as const }
          : site
      ));
    } else {
      throw new Error(response.data.message || 'Failed to sync site');
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  return {
    sites,
    loading,
    error,
    loadSites,
    addSite,
    deleteSite,
    syncSite
  };
};