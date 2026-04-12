import { useState, useEffect } from 'react';
import { sitesAPI } from '@/lib/api';

interface Site {
  id: string;
  _id: string;
  name: string;
  url: string;
  apiUrl: string;
  username: string;
  isActive: boolean;
  categories: any[];
  tags: any[];
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sitesAPI.getSites();
      
      if (response.data.success) {
        setSites(response.data.sites);
      } else {
        throw new Error(response.data.message || 'Failed to fetch sites');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sites');
      console.error('Fetch sites error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSite = async (siteData: {
    name: string;
    url: string;
    apiUrl: string;
    username: string;
    applicationPassword: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sitesAPI.addSite(siteData);
      
      if (response.data.success) {
        // Refresh sites list
        await fetchSites();
        return response.data.site;
      } else {
        throw new Error(response.data.message || 'Failed to add site');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add site');
      console.error('Add site error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSite = async (id: string) => {
    try {
      const response = await sitesAPI.deleteSite(id);
      
      if (response.data.success) {
        // Remove from local state
        setSites(prev => prev.filter(s => s.id !== id && s._id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete site');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete site');
      console.error('Delete site error:', err);
      throw err;
    }
  };

  const syncTaxonomies = async (id: string) => {
    try {
      const response = await sitesAPI.syncTaxonomies(id);
      
      if (response.data.success) {
        // Refresh sites to get updated sync data
        await fetchSites();
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to sync taxonomies');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync taxonomies');
      console.error('Sync taxonomies error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return {
    sites,
    loading,
    error,
    fetchSites,
    addSite,
    deleteSite,
    syncTaxonomies,
  };
};