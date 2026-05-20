'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { sitemapAPI, sitesAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Link2,
  ExternalLink,
  Upload
} from 'lucide-react';

interface IndexedUrl {
  id: string;
  siteId: string;
  url: string;
  title: string;
  description?: string;
  keywords: string[];
  status: 'active' | 'inactive' | 'error';
  lastCrawled: string;
  wordCount?: number;
  siteName?: string;
  responseTime?: number;
  statusCode?: number;
}

interface Site {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

interface FilterOptions {
  siteId: string;
  status: 'all' | 'active' | 'inactive' | 'error';
  sortBy: 'url' | 'title' | 'lastCrawled' | 'status';
  sortOrder: 'asc' | 'desc';
}

export default function SitemapPage() {
  const { user } = useAuth();
  const [indexedUrls, setIndexedUrls] = useState<IndexedUrl[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    siteId: 'all',
    status: 'all',
    sortBy: 'lastCrawled',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [crawlingInProgress, setCrawlingInProgress] = useState(false);
  const [crawlSiteId, setCrawlSiteId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [addUrlLoading, setAddUrlLoading] = useState(false);

  const [newUrlData, setNewUrlData] = useState({
    url: '',
    title: '',
    description: '',
    keywords: '',
    siteId: ''
  });

  useEffect(() => {
    loadData();
  }, [filters.siteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const sitesResponse = await sitesAPI.getUserSites();
      if (sitesResponse.data.success) {
        setSites(sitesResponse.data.data || []);
        if (filters.siteId === 'all' && sitesResponse.data.data.length > 0) {
          setFilters(prev => ({ ...prev, siteId: sitesResponse.data.data[0].id }));
          setNewUrlData(prev => ({ ...prev, siteId: sitesResponse.data.data[0].id }));
        }
      }

      if (filters.siteId !== 'all') {
        const urlsResponse = await sitemapAPI.getIndexedUrls({
          siteId: filters.siteId,
          status: filters.status !== 'all' ? filters.status : undefined
        });
        if (urlsResponse.data.success) {
          setIndexedUrls(urlsResponse.data.data || []);
        }

        const statsResponse = await sitemapAPI.getStats(filters.siteId);
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }
      } else {
        setIndexedUrls([]);
        setStats(null);
      }
    } catch (err) {
      console.error('Error loading sitemap data:', err);
      setError('Failed to load sitemap data');
    } finally {
      setLoading(false);
    }
  };

  const handleCrawlSitemap = async (siteId: string) => {
    if (!confirm('Start crawling the sitemap? This might take a few minutes for large sites.')) return;
    try {
      setCrawlingInProgress(true);
      setCrawlSiteId(siteId);
      const response = await sitemapAPI.crawlSitemap(siteId);
      if (response.data.success) {
        alert(`Successfully crawled sitemap. ${response.data.data?.urlCount ?? ''} URLs indexed.`);
        loadData();
      }
    } catch (err) {
      console.error('Error crawling sitemap:', err);
      alert('Failed to crawl sitemap');
    } finally {
      setCrawlingInProgress(false);
      setCrawlSiteId(null);
    }
  };

  const handleDeleteUrl = async (urlId: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    try {
      const response = await sitemapAPI.deleteUrl(urlId);
      if (response.data.success) {
        setIndexedUrls(prev => prev.filter(url => url.id !== urlId));
        setSelectedUrls(prev => prev.filter(id => id !== urlId));
      } else {
        throw new Error(response.data.message || 'Failed to delete URL');
      }
    } catch (err) {
      console.error('Error deleting URL:', err);
      alert('Failed to delete URL');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedUrls.length} URLs? This cannot be undone.`)) return;
    try {
      const response = await sitemapAPI.bulkUpdate({ urlIds: selectedUrls, action: 'delete' });
      if (response.data.success) {
        setIndexedUrls(prev => prev.filter(url => !selectedUrls.includes(url.id)));
        setSelectedUrls([]);
      }
    } catch (err) {
      console.error('Error bulk deleting URLs:', err);
      alert('Failed to delete some URLs.');
    }
  };

  const handleBulkToggleStatus = async (action: 'activate' | 'deactivate') => {
    if (!confirm(`${action === 'activate' ? 'Activate' : 'Deactivate'} ${selectedUrls.length} URLs?`)) return;
    try {
      const response = await sitemapAPI.bulkUpdate({ urlIds: selectedUrls, action });
      if (response.data.success) {
        await loadData();
        setSelectedUrls([]);
      }
    } catch (err) {
      console.error(`Error bulk ${action}:`, err);
      alert(`Failed to ${action} URLs.`);
    }
  };

  // FIX: use sitemapAPI.addUrl instead of raw fetch
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlData.url) { alert('URL is required'); return; }
    if (!newUrlData.siteId) { alert('Please select a site'); return; }

    try {
      setAddUrlLoading(true);
      const response = await sitemapAPI.addUrl({
        siteId: newUrlData.siteId,
        url: newUrlData.url,
        title: newUrlData.title || undefined,
        description: newUrlData.description || undefined,
        keywords: newUrlData.keywords
          ? newUrlData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : undefined
      });

      if (response.data.success) {
        await loadData();
        setShowAddUrlModal(false);
        setNewUrlData({
          url: '',
          title: '',
          description: '',
          keywords: '',
          siteId: filters.siteId !== 'all' ? filters.siteId : ''
        });
      } else {
        throw new Error(response.data.message || 'Failed to add URL');
      }
    } catch (err: any) {
      console.error('Error adding URL:', err);
      alert(err.response?.data?.message || err.message || 'Failed to add URL');
    } finally {
      setAddUrlLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':   return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-600" />;
      default:         return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':   return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'inactive': return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
      default:         return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const filteredUrls = indexedUrls.filter(url => {
    const matchesSearch =
      url.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filters.status === 'all' || url.status === filters.status;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'url':     return filters.sortOrder === 'asc' ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url);
      case 'title':   return filters.sortOrder === 'asc' ? (a.title||'').localeCompare(b.title||'') : (b.title||'').localeCompare(a.title||'');
      case 'status':  return filters.sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      default:        return filters.sortOrder === 'asc'
        ? new Date(a.lastCrawled).getTime() - new Date(b.lastCrawled).getTime()
        : new Date(b.lastCrawled).getTime() - new Date(a.lastCrawled).getTime();
    }
  });

  const handleSelectAll = () =>
    setSelectedUrls(selectedUrls.length === filteredUrls.length ? [] : filteredUrls.map(u => u.id));

  const handleSelectUrl = (id: string) =>
    setSelectedUrls(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600 dark:text-gray-400">Loading sitemap data...</span>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sitemap Manager</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your indexed URLs for internal linking</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddUrlModal(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom URL
            </button>
            {filters.siteId !== 'all' && (
              <button
                onClick={() => handleCrawlSitemap(filters.siteId)}
                disabled={crawlingInProgress}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {crawlingInProgress && crawlSiteId === filters.siteId ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Crawling...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Crawl Sitemap</>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total URLs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUrls}</p>
                </div>
                <Link2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active URLs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeUrls}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive URLs</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactiveUrls || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Broken URLs</p>
                  <p className="text-2xl font-bold text-red-600">{stats.brokenUrls || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search URLs, titles, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filters.siteId}
                onChange={(e) => setFilters(prev => ({ ...prev, siteId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterOptions['status'] }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Sort
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lastCrawled">Last Crawled</option>
                  <option value="url">URL</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as FilterOptions['sortOrder'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUrls.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedUrls.length} URL{selectedUrls.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleBulkToggleStatus('activate')} className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle className="w-4 h-4 mr-1" />Activate
                </button>
                <button onClick={() => handleBulkToggleStatus('deactivate')} className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <XCircle className="w-4 h-4 mr-1" />Deactivate
                </button>
                <button onClick={handleBulkDelete} className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Trash2 className="w-4 h-4 mr-1" />Delete
                </button>
                <button onClick={() => setSelectedUrls([])} className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <X className="w-4 h-4 mr-1" />Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* URLs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredUrls.length === 0 ? (
            <div className="p-12 text-center">
              <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No URLs found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filters.status !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : sites.length > 0
                    ? 'Start by crawling your sitemap or adding custom URLs.'
                    : 'Connect a WordPress site to start managing your sitemap.'}
              </p>
              {filters.siteId !== 'all' && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => handleCrawlSitemap(filters.siteId)}
                    disabled={crawlingInProgress}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {crawlingInProgress ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Crawling...</> : <><Upload className="w-4 h-4 mr-2" />Crawl Sitemap</>}
                  </button>
                  <button onClick={() => setShowAddUrlModal(true)} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />Add Custom URL
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUrls.length === filteredUrls.length && filteredUrls.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Crawled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUrls.map((url) => (
                    <tr key={url.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUrls.includes(url.id)}
                          onChange={() => handleSelectUrl(url.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <a href={url.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <span className="truncate max-w-sm">{url.url}</span>
                          <ExternalLink className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {url.title ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{url.title}</div>
                            {url.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">{url.description}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 italic">No title</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(url.status)}`}>
                          {getStatusIcon(url.status)}
                          <span className="ml-1 capitalize">{url.status}</span>
                        </span>
                        {url.statusCode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {url.statusCode}{url.responseTime && ` (${url.responseTime}ms)`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{formatDate(url.lastCrawled)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setNewUrlData({
                                url: url.url,
                                title: url.title,
                                description: url.description || '',
                                keywords: url.keywords.join(', '),
                                siteId: url.siteId
                              });
                              setShowAddUrlModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Edit URL"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUrl(url.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Delete URL"
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
          )}
        </div>
      </div>

      {/* Add/Edit URL Modal */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={() => setShowAddUrlModal(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {newUrlData.url ? 'Edit URL' : 'Add Custom URL'}
                </h3>
                <button onClick={() => setShowAddUrlModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddUrl}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site</label>
                    <select
                      value={newUrlData.siteId}
                      onChange={(e) => setNewUrlData(prev => ({ ...prev, siteId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a site</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                    <input
                      type="url"
                      value={newUrlData.url}
                      onChange={(e) => setNewUrlData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/page"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={newUrlData.title}
                      onChange={(e) => setNewUrlData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Page Title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={newUrlData.description}
                      onChange={(e) => setNewUrlData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Short description of the page"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      value={newUrlData.keywords}
                      onChange={(e) => setNewUrlData(prev => ({ ...prev, keywords: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUrlModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addUrlLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {addUrlLoading ? 'Saving...' : newUrlData.url ? 'Update URL' : 'Add URL'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}