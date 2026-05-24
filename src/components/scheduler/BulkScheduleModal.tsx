'use client';

import { useState, useEffect } from 'react';
import { schedulerAPI, sitesAPI, contentAPI } from '@/lib/api';
import type { WordPressSite, ContentItem } from '@/types';
import {
  X,
  Calendar,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2,
  Bell,
  Zap,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedContentIds?: string[];
}

export default function BulkScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedContentIds = []
}: BulkScheduleModalProps) {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>(preselectedContentIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'draft' as 'all' | 'draft' | 'published' | 'scheduled',
    sortBy: 'createdAt' as 'createdAt' | 'updatedAt' | 'title',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  const [formData, setFormData] = useState({
    siteId: '',
    scheduledDate: '',
    scheduledTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoPublish: true,
    notifyOnPublish: true
  });

  // FIX 2: include filters in dependency array so loadData re-runs on filter change
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, filters]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      const sitesResponse = await sitesAPI.getUserSites();
      if (sitesResponse.data.success) {
        const sitesData = sitesResponse.data.data || [];
        setSites(sitesData);
        
        if (!formData.siteId && sitesData.length > 0) {
          setFormData(prev => ({ ...prev, siteId: sitesData[0].id }));
        }
      }

      const articlesResponse = await contentAPI.getContent({
        status: filters.status !== 'all' ? filters.status : undefined,
        limit: 100
      });

      if (articlesResponse.data.success) {
        // FIX 1: normalise _id -> id so selection logic never operates on undefined
        const normalised = (articlesResponse.data.data || []).map((a: any) => ({
          ...a,
          id: a._id?.toString() || a.id,
        }));
        setArticles(normalised);
      }

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedContentIds.length === 0) {
      setError('Please select at least one article');
      return;
    }

    if (!formData.siteId) {
      setError('Please select a WordPress site');
      return;
    }

    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError('Please select date and time');
      return;
    }

    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError('Scheduled time must be in the future');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const scheduledFor = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      
      for (const contentId of selectedContentIds) {
        try {
          await schedulerAPI.schedulePost({
            contentId: contentId,
            siteId: formData.siteId,
            scheduledFor: scheduledFor,
            timezone: formData.timezone,
            autoPublish: formData.autoPublish,
            notifyOnPublish: formData.notifyOnPublish
          });
        } catch (error) {
          console.error(`Error scheduling content ID ${contentId}:`, error);
        }
      }
      
      onSuccess();

    } catch (err: any) {
      console.error('Error scheduling posts:', err);
      setError(err.response?.data?.message || 'Failed to schedule posts');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSelectAll = () => {
    if (selectedContentIds.length === filteredArticles.length) {
      setSelectedContentIds([]);
    } else {
      setSelectedContentIds(filteredArticles.map(article => article.id));
    }
  };

  const handleSelectArticle = (id: string) => {
    setSelectedContentIds(prev =>
      prev.includes(id)
        ? prev.filter(contentId => contentId !== id)
        : [...prev, id]
    );
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || article.status === filters.status;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'title':
        return filters.sortOrder === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      case 'updatedAt':
        return filters.sortOrder === 'asc' 
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'createdAt':
      default:
        return filters.sortOrder === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Bulk Schedule Posts
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side: Article selection */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Select Articles to Schedule
                </h4>

                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Drafts</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-80 overflow-y-auto">
                  {loadingData ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading articles...</p>
                    </div>
                  ) : filteredArticles.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No articles found</p>
                    </div>
                  ) : (
                    <div>
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedContentIds.length === filteredArticles.length && filteredArticles.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select All ({filteredArticles.length})
                          </span>
                        </label>
                      </div>

                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredArticles.map(article => (
                          <div key={article.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedContentIds.includes(article.id)}
                                onChange={() => handleSelectArticle(article.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{article.title}</p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    article.status === 'draft'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      : article.status === 'published'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                  }`}>
                                    {article.status}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(article.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedContentIds.length} article{selectedContentIds.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Right side: Schedule settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Schedule Settings
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WordPress Site
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => handleChange('siteId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                  {sites.length === 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      No WordPress sites connected. Please connect a site first.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => handleChange('scheduledDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => handleChange('scheduledTime', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    placeholder="e.g., America/New_York"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current timezone: {formData.timezone}
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoPublish}
                      onChange={(e) => handleChange('autoPublish', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Zap className="w-4 h-4 mr-1 text-blue-600" />
                        Auto-publish at scheduled time
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        Posts will be automatically published when the scheduled time arrives
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnPublish}
                      onChange={(e) => handleChange('notifyOnPublish', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Bell className="w-4 h-4 mr-1 text-blue-600" />
                        Notify me when published
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        Receive an email notification when posts are published
                      </span>
                    </div>
                  </label>
                </div>

                {formData.scheduledDate && formData.scheduledTime && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Scheduled for:
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: formData.timezone
                          })}
                        </p>
                        {selectedContentIds.length > 0 && (
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            {selectedContentIds.length} article{selectedContentIds.length !== 1 ? 's' : ''} will be scheduled
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingData || selectedContentIds.length === 0 || !formData.siteId || !formData.scheduledDate || !formData.scheduledTime}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule {selectedContentIds.length} Post{selectedContentIds.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}