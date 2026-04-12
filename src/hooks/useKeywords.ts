import { useState, useEffect } from 'react';
import { keywordsAPI } from '@/lib/api';

interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  searchIntent: string;
  status: string;
  createdAt: string;
}

interface KeywordStats {
  totalResearches: number;
  creditsUsed: number;
  recentResearches: Keyword[];
}

export const useKeywords = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await keywordsAPI.getHistory({ page, limit });
      
      if (response.data.success) {
        setKeywords(response.data.data.keywords);
      } else {
        throw new Error(response.data.message || 'Failed to fetch keywords');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch keywords');
      console.error('Fetch keywords error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await keywordsAPI.getStats();
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Fetch keyword stats error:', err);
    }
  };

  const researchKeyword = async (keyword: string, country = 'US', language = 'en') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await keywordsAPI.research({ keyword, country, language });
      
      if (response.data.success) {
        // Refresh keywords list
        await fetchKeywords();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Keyword research failed');
      }
    } catch (err: any) {
      setError(err.message || 'Keyword research failed');
      console.error('Research keyword error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      const response = await keywordsAPI.delete(id);
      
      if (response.data.success) {
        // Remove from local state
        setKeywords(prev => prev.filter(k => k.id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete keyword');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete keyword');
      console.error('Delete keyword error:', err);
      throw err;
    }
  };

  const saveKeyword = async (data: any) => {
    // Stub for saving a keyword if needed by the UI
    console.log('Saving keyword:', data);
  };

  useEffect(() => {
    fetchKeywords();
    fetchStats();
  }, []);

  return {
    keywords,
    userKeywords: keywords, // ✅ Alias for SavedKeywords component
    stats,
    loading,
    error,
    fetchKeywords,
    getUserKeywords: fetchKeywords, // ✅ Alias for SavedKeywords component
    fetchStats,
    researchKeyword,
    researchKeywords: researchKeyword, // ✅ Alias for KeywordResearcher and RelatedTermsTable components
    deleteKeyword,
    saveKeyword, // ✅ Provided for KeywordTable
  };
};