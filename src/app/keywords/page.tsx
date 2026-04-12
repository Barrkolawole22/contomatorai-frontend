'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { keywordsAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Search,
  Plus,
  Target,
  Filter,
  RefreshCw,
  Bookmark,
  AlertCircle,
  Zap,
  Trash2
} from 'lucide-react';

interface Keyword {
  id: string;
  term: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | 'mixed';
  createdAt: string;
  updatedAt: string;
  userId: string;
  notes?: string;
  tags?: string[];
}

export default function KeywordsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<Keyword[]>([]);
  const [activeTab, setActiveTab] = useState<'research' | 'saved'>('research');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState(user?.wordCredits || 0);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true); // Add loading state for saved keywords

  useEffect(() => {
    loadSavedKeywords();
    setCreditsRemaining(user?.wordCredits || 0);
  }, [user]);

  const loadSavedKeywords = async () => {
    try {
      setIsLoadingSaved(true);
      const response = await keywordsAPI.getHistory({ limit: 100 });
      console.log('Keywords API response:', response.data); // Debug log
      
      if (response.data.success) {
        // Handle different possible response structures
        const keywordsData = response.data.data || response.data.keywords || [];
        setSavedKeywords(Array.isArray(keywordsData) ? keywordsData : []);
      } else {
        console.warn('Keywords API returned unsuccessful response:', response.data);
        setSavedKeywords([]);
      }
    } catch (err: any) {
      console.error('Error loading saved keywords:', err);
      setSavedKeywords([]); // Ensure it's always an array
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a keyword to research');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await keywordsAPI.research({
        keyword: searchTerm.trim(),
        country: 'US',
        language: 'en'
      });
      
      console.log('Research API response:', response.data); // Debug log
      
      if (response.data.success) {
        const keywordsData = response.data.data || response.data.keywords || [];
        setKeywords(Array.isArray(keywordsData) ? keywordsData : []);
        await loadSavedKeywords();
      } else {
        throw new Error(response.data.message || 'Failed to research keywords');
      }
    } catch (err: any) {
      console.error('Error researching keywords:', err);
      setError(err.response?.data?.message || err.message || 'Failed to research keywords');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm('Are you sure you want to delete this keyword research?')) {
      return;
    }

    try {
      const response = await keywordsAPI.delete(keywordId);
      if (response.data.success) {
        setSavedKeywords(prev => prev.filter(k => k.id !== keywordId));
        setKeywords(prev => prev.filter(k => k.id !== keywordId));
      } else {
        throw new Error(response.data.message || 'Failed to delete keyword');
      }
    } catch (err: any) {
      console.error('Error deleting keyword:', err);
      alert(err.response?.data?.message || 'Failed to delete keyword');
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
    if (difficulty <= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 30) return 'Easy';
    if (difficulty <= 60) return 'Medium';
    return 'Hard';
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'commercial':
      case 'transactional':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20';
      case 'informational':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20';
      case 'navigational':
        return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  // FIXED: Add null checks and ensure arrays exist before filtering
  const filteredKeywords = Array.isArray(keywords) ? keywords.filter(keyword => {
    if (!keyword) return false; // Add null check
    if (filterDifficulty === 'all') return true;
    if (filterDifficulty === 'easy') return keyword.difficulty <= 30;
    if (filterDifficulty === 'medium') return keyword.difficulty > 30 && keyword.difficulty <= 60;
    if (filterDifficulty === 'hard') return keyword.difficulty > 60;
    return true;
  }) : [];

  const filteredSavedKeywords = Array.isArray(savedKeywords) ? savedKeywords.filter(keyword => {
    if (!keyword) return false; // Add null check
    if (filterDifficulty === 'all') return true;
    if (filterDifficulty === 'easy') return keyword.difficulty <= 30;
    if (filterDifficulty === 'medium') return keyword.difficulty > 30 && keyword.difficulty <= 60;
    if (filterDifficulty === 'hard') return keyword.difficulty > 60;
    return true;
  }) : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Keyword Research
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Discover high-performing keywords for your content strategy
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {creditsRemaining.toLocaleString()} words
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('research')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'research'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Research
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'saved'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4 inline mr-2" />
                History ({savedKeywords.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        {activeTab === 'research' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter a keyword or topic..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Researching...' : 'Research Keywords'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Bar */}
        {((activeTab === 'research' && keywords.length > 0) || (activeTab === 'saved' && savedKeywords.length > 0)) && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by difficulty:</span>
            </div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy (1-30)</option>
              <option value="medium">Medium (31-60)</option>
              <option value="hard">Hard (61-100)</option>
            </select>
          </div>
        )}

        {/* Keywords Results */}
        {activeTab === 'research' && (
          <>
            {filteredKeywords.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Keyword Research Results
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Keyword
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Search Volume
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Difficulty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          CPC
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredKeywords.map((keyword) => (
                        <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {keyword.term}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {keyword.volume?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(keyword.difficulty)}`}>
                              {getDifficultyLabel(keyword.difficulty)} ({keyword.difficulty})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            ${keyword.cpc?.toFixed(2) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <a
                                href={`/articles/create?keyword=${encodeURIComponent(keyword.term)}`}
                                className="p-2 text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Create article with this keyword"
                              >
                                <Plus className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteKeyword(keyword.id)}
                                className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Delete keyword"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ready to discover keywords?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a topic or keyword above to get AI-powered keyword suggestions and search data.
                </p>
              </div>
            )}
          </>
        )}

        {/* Saved Keywords */}
        {activeTab === 'saved' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Keyword Research History
              </h3>
            </div>
            {isLoadingSaved ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading keyword history...</p>
              </div>
            ) : filteredSavedKeywords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Search Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Research Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSavedKeywords.map((keyword) => (
                      <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {keyword.term}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {keyword.volume?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(keyword.difficulty)}`}>
                            {getDifficultyLabel(keyword.difficulty)} ({keyword.difficulty})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {new Date(keyword.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/articles/create?keyword=${encodeURIComponent(keyword.term)}`}
                              className="p-2 text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Create article with this keyword"
                            >
                              <Plus className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteKeyword(keyword.id)}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Delete keyword"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No keyword research history yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start researching keywords to build your keyword database.
                </p>
                <button
                  onClick={() => setActiveTab('research')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Researching
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
