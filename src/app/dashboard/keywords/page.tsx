'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import {
  Search,
  Plus,
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
  Download,
  Filter,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Eye,
  Clock,
  TrendingDown,
  Minus
} from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  savedAt?: string;
  status: 'researched' | 'saved' | 'used';
}

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  relevance: number;
}

export default function KeywordsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<Keyword[]>([]);
  const [activeTab, setActiveTab] = useState<'research' | 'saved'>('research');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    loadSavedKeywords();
  }, []);

  const loadSavedKeywords = async () => {
    const mockSavedKeywords: Keyword[] = [
      {
        id: '1',
        keyword: 'AI content writing',
        searchVolume: 8100,
        difficulty: 65,
        cpc: 3.24,
        trend: 'up',
        savedAt: '2024-01-15',
        status: 'saved'
      },
      {
        id: '2',
        keyword: 'SEO optimization tools',
        searchVolume: 5400,
        difficulty: 58,
        cpc: 4.17,
        trend: 'stable',
        savedAt: '2024-01-14',
        status: 'used'
      },
      {
        id: '3',
        keyword: 'WordPress automation',
        searchVolume: 2900,
        difficulty: 42,
        cpc: 2.85,
        trend: 'up',
        savedAt: '2024-01-13',
        status: 'saved'
      }
    ];
    setSavedKeywords(mockSavedKeywords);
  };

  const generateMockKeywords = (baseTerm: string): Keyword[] => {
    const variations = [
      `${baseTerm} tools`,
      `best ${baseTerm}`,
      `${baseTerm} software`,
      `${baseTerm} guide`,
      `${baseTerm} tips`,
      `${baseTerm} 2024`,
      `free ${baseTerm}`,
      `${baseTerm} tutorial`,
      `${baseTerm} examples`,
      `${baseTerm} comparison`
    ];

    return variations.map((variation, index) => ({
      id: `search-${Date.now()}-${index}`,
      keyword: variation,
      searchVolume: Math.floor(Math.random() * 50000) + 1000,
      difficulty: Math.floor(Math.random() * 100) + 1,
      cpc: Math.round((Math.random() * 10 + 0.5) * 100) / 100,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      status: 'researched' as const
    }));
  };

  const generateMockSuggestions = (baseTerm: string): KeywordSuggestion[] => {
    const suggestions = [
      `${baseTerm} automation`,
      `${baseTerm} optimization`,
      `${baseTerm} analytics`,
      `${baseTerm} strategy`,
      `${baseTerm} benefits`
    ];

    return suggestions.map(suggestion => ({
      keyword: suggestion,
      searchVolume: Math.floor(Math.random() * 20000) + 500,
      difficulty: Math.floor(Math.random() * 80) + 20,
      relevance: Math.floor(Math.random() * 30) + 70
    }));
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockKeywords = generateMockKeywords(searchTerm);
      const mockSuggestions = generateMockSuggestions(searchTerm);
      
      setKeywords(mockKeywords);
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeyword = async (keyword: Keyword) => {
    const savedKeyword = {
      ...keyword,
      savedAt: new Date().toISOString().split('T')[0],
      status: 'saved' as const
    };
    
    setSavedKeywords(prev => [savedKeyword, ...prev]);
    setKeywords(prev => 
      prev.map(k => 
        k.id === keyword.id 
          ? { ...k, status: 'saved' }
          : k
      )
    );
  };

  const handleRemoveSaved = (keywordId: string) => {
    setSavedKeywords(prev => prev.filter(k => k.id !== keywordId));
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600 bg-green-50';
    if (difficulty <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 30) return 'Easy';
    if (difficulty <= 60) return 'Medium';
    return 'Hard';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredKeywords = keywords.filter(keyword => {
    if (filterDifficulty === 'all') return true;
    if (filterDifficulty === 'easy') return keyword.difficulty <= 30;
    if (filterDifficulty === 'medium') return keyword.difficulty > 30 && keyword.difficulty <= 60;
    if (filterDifficulty === 'hard') return keyword.difficulty > 60;
    return true;
  });

  const filteredSavedKeywords = savedKeywords.filter(keyword => {
    if (filterDifficulty === 'all') return true;
    if (filterDifficulty === 'easy') return keyword.difficulty <= 30;
    if (filterDifficulty === 'medium') return keyword.difficulty > 30 && keyword.difficulty <= 60;
    if (filterDifficulty === 'hard') return keyword.difficulty > 60;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Keyword Research
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover high-performing keywords for your content strategy
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('research')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'research'
                  ? 'bg-primary-600 text-white'
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
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4 inline mr-2" />
              Saved ({savedKeywords.length})
            </button>
          </div>
        </div>

        {/* Search Section */}
        {activeTab === 'research' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter a keyword or topic..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Researching...' : 'Research'}
              </button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        {(keywords.length > 0 || savedKeywords.length > 0) && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by difficulty:</span>
            </div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy (1-30)</option>
              <option value="medium">Medium (31-60)</option>
              <option value="hard">Hard (61-100)</option>
            </select>
          </div>
        )}

        {/* Research Results */}
        {activeTab === 'research' && (
          <>
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Keyword Suggestions
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">{suggestion.keyword}</div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Vol: {suggestion.searchVolume.toLocaleString()}</span>
                        <span>Rel: {suggestion.relevance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords Table */}
            {filteredKeywords.length > 0 && (
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
                          Trend
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredKeywords.map((keyword) => (
                        <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {keyword.keyword}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            {keyword.searchVolume.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(keyword.difficulty)}`}>
                              {getDifficultyLabel(keyword.difficulty)} ({keyword.difficulty})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                            ${keyword.cpc}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTrendIcon(keyword.trend)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveKeyword(keyword)}
                                disabled={keyword.status === 'saved'}
                                className="p-2 text-gray-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={keyword.status === 'saved' ? 'Already saved' : 'Save keyword'}
                              >
                                {keyword.status === 'saved' ? (
                                  <BookmarkCheck className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Bookmark className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Saved Keywords */}
        {activeTab === 'saved' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Saved Keywords
              </h3>
            </div>
            {filteredSavedKeywords.length > 0 ? (
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
                        Saved Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSavedKeywords.map((keyword) => (
                      <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {keyword.keyword}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {keyword.searchVolume.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(keyword.difficulty)}`}>
                            {getDifficultyLabel(keyword.difficulty)} ({keyword.difficulty})
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {keyword.savedAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            keyword.status === 'used' 
                              ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
                              : 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                            }`}>
                            {keyword.status === 'used' ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {/* Navigate to create article */}}
                              className="p-2 text-gray-600 hover:text-primary-600"
                              title="Create article"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveSaved(keyword.id)}
                              className="p-2 text-gray-600 hover:text-red-600"
                              title="Remove from saved"
                            >
                              <BookmarkCheck className="w-4 h-4" />
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
                  No saved keywords yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start researching keywords and save the ones you want to use for content creation.
                </p>
                <button
                  onClick={() => setActiveTab('research')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Start Researching
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty States */}
        {activeTab === 'research' && keywords.length === 0 && !loading && (
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
      </div>
    </DashboardLayout>
  );
}
