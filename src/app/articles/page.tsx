'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { contentAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import BulkScheduleModal from '@/components/scheduler/BulkScheduleModal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Globe,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  body?: string;
  content?: string;
  summary?: string;
  keywords?: string[];
  status: 'draft' | 'published' | 'archived';
  type: 'blog' | 'article' | 'landing' | 'product' | 'custom';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  metadata?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
  tags?: string[];
  wordCount?: number;
  readingTime?: number;
  seoScore?: number;
  aiGenerated: boolean;
}

interface FilterOptions {
  status: 'all' | 'draft' | 'published' | 'archived';
  type: 'all' | 'blog' | 'article' | 'landing' | 'product' | 'custom';
  sortBy: 'newest' | 'oldest' | 'title' | 'status';
}

export default function ArticlesPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    type: 'all',
    sortBy: 'newest'
  });
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<string | null>(null);
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  // Enhanced function to clean HTML content and extract text
  const cleanContent = (content: string): string => {
    if (!content) return '';
    
    // First, handle the case where content starts with HTML doctype
    let cleaned = content;
    
    // Remove HTML doctype and document structure
    cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');
    cleaned = cleaned.replace(/<html[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/html>/gi, '');
    cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    cleaned = cleaned.replace(/<meta[^>]*\/?>/gi, '');
    cleaned = cleaned.replace(/<link[^>]*\/?>/gi, '');
    cleaned = cleaned.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<body[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/body>/gi, '');
    
    // Convert common block elements to line breaks
    cleaned = cleaned.replace(/<\/p>/gi, '\n\n');
    cleaned = cleaned.replace(/<\/div>/gi, '\n');
    cleaned = cleaned.replace(/<\/h[1-6]>/gi, '\n\n');
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/li>/gi, '\n');
    
    // Remove all remaining HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities more thoroughly
    const htmlEntities: { [key: string]: string } = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&apos;': "'",
      '&cent;': '¢',
      '&pound;': '£',
      '&yen;': '¥',
      '&euro;': '€',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };
    
    // Replace known entities
    for (const [entity, replacement] of Object.entries(htmlEntities)) {
      cleaned = cleaned.replace(new RegExp(entity, 'gi'), replacement);
    }
    
    // Replace remaining numeric entities
    cleaned = cleaned.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(dec);
    });
    
    // Replace remaining hex entities
    cleaned = cleaned.replace(/&#x([a-f0-9]+);/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Clean up excessive whitespace and line breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' '); // Multiple spaces to single space
    cleaned = cleaned.replace(/\n /g, '\n'); // Remove spaces at start of lines
    cleaned = cleaned.replace(/ \n/g, '\n'); // Remove spaces at end of lines
    cleaned = cleaned.trim();
    
    return cleaned;
  };

  // Enhanced function to extract meaningful summary from content
  const extractSummary = (content: string, maxLength: number = 150): string => {
    if (!content) return '';
    
    // First clean the content completely
    const cleaned = cleanContent(content);
    if (!cleaned) return '';
    
    // If the cleaned content is short enough, return it
    if (cleaned.length <= maxLength) return cleaned;
    
    // Try to find a natural break point
    const truncated = cleaned.substring(0, maxLength);
    
    // Look for sentence endings
    const sentenceEndings = ['. ', '! ', '? '];
    let bestBreak = -1;
    
    for (const ending of sentenceEndings) {
      const lastIndex = truncated.lastIndexOf(ending);
      if (lastIndex > maxLength * 0.6) { // At least 60% of desired length
        bestBreak = Math.max(bestBreak, lastIndex + 1);
      }
    }
    
    // If we found a good sentence break, use it
    if (bestBreak > 0) {
      return cleaned.substring(0, bestBreak).trim();
    }
    
    // Otherwise, break at the last space
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      return cleaned.substring(0, lastSpace).trim() + '...';
    }
    
    // Fallback: just truncate and add ellipsis
    return truncated.trim() + '...';
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading articles from backend...');
      
      // Try the content API first
      let response;
      try {
        response = await contentAPI.getContent({
          limit: 100,
          page: 1
        });
        console.log('✅ Content API response:', response);
      } catch (apiError) {
        console.warn('⚠️ Content API failed, trying alternative endpoint...');
        // Fallback to direct API call if contentAPI fails
        response = await fetch('/api/content', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json());
      }

      // Handle different response formats
      let articles: any[] = [];
      if (response?.data?.success && response.data.data) {
        // Format: { success: true, data: { success: true, data: [...] } }
        articles = response.data.data;
      } else if (response?.data?.success && Array.isArray(response.data)) {
        // Format: { success: true, data: [...] }
        articles = response.data;
      } else if (response?.success && response.data) {
        // Format: { success: true, data: [...] }
        articles = response.data;
      } else if (Array.isArray(response?.data)) {
        // Format: { data: [...] }
        articles = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        articles = response;
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        articles = [];
      }

      // Clean up articles content and generate proper summaries
      const cleanedArticles = articles.map((article: any) => {
        const rawContent = article.body || article.content || '';
        const cleanedContent = cleanContent(rawContent);
        
        // Force clean summary - never use raw article.summary if it contains HTML
        let cleanSummary = '';
        if (article.summary && !article.summary.includes('<') && !article.summary.includes('&')) {
          // Only use existing summary if it doesn't contain HTML
          cleanSummary = article.summary;
        } else {
          // Always extract from cleaned content
          cleanSummary = extractSummary(rawContent);
        }
        
        return {
          ...article,
          summary: cleanSummary,
          cleanContent: cleanedContent,
          // Ensure we have proper word count
          wordCount: cleanedContent ? cleanedContent.split(/\s+/).filter((word: string) => word.length > 0).length : 0
        };
      });

      console.log('✅ Processed articles:', cleanedArticles.length);
      setArticles(cleanedArticles || []);

    } catch (err: any) {
      console.error('❌ Error loading articles:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load articles';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. Check your permissions.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Articles endpoint not found. Check API configuration.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Initialize with empty array so UI doesn't break
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingArticle(articleId);
      
      const response = await contentAPI.deleteContent(articleId);
      
      if (response.data?.success) {
        setArticles(prev => prev.filter(article => article.id !== articleId));
        setSelectedArticles(prev => prev.filter(id => id !== articleId));
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (err: any) {
      console.error('Error deleting article:', err);
      alert(err.response?.data?.message || 'Failed to delete article');
    } finally {
      setDeletingArticle(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedArticles.length} articles? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        selectedArticles.map(articleId => contentAPI.deleteContent(articleId))
      );
      
      setArticles(prev => prev.filter(article => !selectedArticles.includes(article.id)));
      setSelectedArticles([]);
    } catch (err: any) {
      console.error('Error bulk deleting articles:', err);
      alert('Failed to delete some articles. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'archived':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'draft':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'archived':
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateReadingTime = (wordCount: number) => {
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const getContentLength = (article: Article) => {
    // Use the pre-calculated word count or calculate from cleaned content
    return article.wordCount || 0;
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (article.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                         (article.metadata?.focusKeyword?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || article.status === filters.status;
    const matchesType = filters.type === 'all' || article.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id));
    }
  };

  const handleSelectArticle = (id: string) => {
    setSelectedArticles(prev =>
      prev.includes(id)
        ? prev.filter(articleId => articleId !== id)
        : [...prev, id]
    );
  };

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    archived: articles.filter(a => a.status === 'archived').length
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600 dark:text-gray-400">Loading articles...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading articles
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={loadArticles}
                className="mt-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Articles</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your generated content and publications
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Link
              href="/articles/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Link>
            {selectedArticles.length > 0 && (
              <button
                onClick={() => setShowBulkScheduleModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule {selectedArticles.length} Article{selectedArticles.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <Globe className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Edit3 className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles by title or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as FilterOptions['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="blog">Blog</option>
                    <option value="article">Article</option>
                    <option value="landing">Landing Page</option>
                    <option value="product">Product</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedArticles.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedArticles.length} article{selectedArticles.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBulkScheduleModal(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Schedule
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedArticles([])}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Articles Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No articles found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filters.status !== 'all' || filters.type !== 'all' 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'Get started by creating your first article.'}
              </p>
              <Link
                href="/articles/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredArticles.map((article) => {
                    const wordCount = getContentLength(article);
                    const readingTime = calculateReadingTime(wordCount);
                    
                    return (
                      <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedArticles.includes(article.id)}
                            onChange={() => handleSelectArticle(article.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/articles/${article.id}`}
                                className="block font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {article.title}
                              </Link>
                              {article.summary && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {article.summary}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                {article.keywords && article.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {article.keywords.slice(0, 3).map((keyword, index) => (
                                      <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                        {keyword}
                                      </span>
                                    ))}
                                    {article.keywords.length > 3 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{article.keywords.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(article.status)}`}>
                            {getStatusIcon(article.status)}
                            <span className="ml-1 capitalize">{article.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {article.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>{wordCount} words</div>
                            <div>{readingTime} min read</div>
                            {article.seoScore && (
                              <div className="flex items-center mt-1">
                                <BarChart3 className="w-3 h-3 mr-1" />
                                SEO: {article.seoScore}%
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(article.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Updated {formatDate(article.updatedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/articles/${article.id}`}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="View Article"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/articles/${article.id}/edit`}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Edit Article"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              disabled={deletingArticle === article.id}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Delete Article"
                            >
                              {deletingArticle === article.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Schedule Modal */}
      {showBulkScheduleModal && (
        <BulkScheduleModal
          isOpen={showBulkScheduleModal}
          onClose={() => setShowBulkScheduleModal(false)}
          onSuccess={() => {
            setShowBulkScheduleModal(false);
            setSelectedArticles([]);
            loadArticles();
          }}
          preselectedContentIds={selectedArticles}
        />
      )}
    </DashboardLayout>
  );
}
