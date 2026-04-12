'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import axios from 'axios';
import {
  Plus,
  Globe,
  Settings,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Activity,
  FileText,
  Zap,
  TrendingUp,
  Users,
  AlertTriangle,
  Monitor,
  HelpCircle,
  Key,
  Link,
  X
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Site {
  id: string;
  name: string;
  url: string;
  username: string;
  status: 'connected' | 'error' | 'disconnected';
  isActive: boolean;
  categories: any[];
  categoriesCount: number;
  tags: any[];
  tagsCount: number;
  postsCount: number;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalSites: number;
  connectedSites: number;
  totalPosts: number;
  autoPublishEnabled: number;
}

const AdminWordPressPage = () => {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [deletingSite, setDeletingSite] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    applicationPassword: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE}/wordpress`, getAuthHeaders());
      
      if (response.data.success) {
        setSites(response.data.data || []);
        
        const connectedSites = response.data.data.filter((s: Site) => s.status === 'connected').length;
        setStats({
          totalSites: response.data.data.length,
          connectedSites,
          totalPosts: response.data.data.reduce((sum: number, s: Site) => sum + s.postsCount, 0),
          autoPublishEnabled: 0
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSites();
    setRefreshing(false);
  };

  const handleTestConnection = async (siteId: string) => {
    try {
      setTestingConnection(siteId);
      await axios.post(`${API_BASE}/wordpress/${siteId}/test`, {}, getAuthHeaders());
      await fetchSites();
    } catch (err) {
      console.error('Test failed:', err);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Delete this site?')) return;

    try {
      setDeletingSite(siteId);
      await axios.delete(`${API_BASE}/wordpress/${siteId}`, getAuthHeaders());
      await fetchSites();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingSite(null);
    }
  };

  const handleSyncSite = async (siteId: string) => {
    try {
      setSyncing(siteId);
      await axios.post(`${API_BASE}/wordpress/${siteId}/sync`, {}, getAuthHeaders());
      await fetchSites();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(null);
    }
  };

  const handleSubmitSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedSite) {
        await axios.put(`${API_BASE}/wordpress/${selectedSite.id}`, formData, getAuthHeaders());
      } else {
        await axios.post(`${API_BASE}/wordpress`, formData, getAuthHeaders());
      }
      
      await fetchSites();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedSite(null);
      setFormData({ name: '', url: '', username: '', applicationPassword: '' });
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  const handleAddSite = () => {
    setFormData({ name: '', url: '', username: '', applicationPassword: '' });
    setSelectedSite(null);
    setShowAddModal(true);
  };

  const handleEditSite = (site: Site) => {
    setSelectedSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      username: site.username,
      applicationPassword: ''
    });
    setShowEditModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-32"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={fetchSites} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WordPress Sites</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage user WordPress connections</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowSetupGuide(true)}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl flex items-center space-x-2"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Guide</span>
            </button>
            <button
              onClick={handleAddSite}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Site</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                  <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSites}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Total Sites</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connectedSites}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Connected</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPosts}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Total Posts</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
                  <Activity className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connectedSites}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Healthy</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sites List */}
        {sites.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
            <Globe className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Sites Connected</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Add WordPress sites to get started</p>
            <button onClick={handleAddSite} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center space-x-2 mx-auto">
              <Plus className="w-5 h-5" />
              <span>Add First Site</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Connected Sites</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Site</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Content</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Sync</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{site.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {site.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {testingConnection === site.id ? (
                            <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
                          ) : (
                            getStatusIcon(site.status)
                          )}
                          <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">{site.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {site.categoriesCount} categories, {site.tagsCount} tags
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {site.lastSync ? new Date(site.lastSync).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleTestConnection(site.id)}
                            disabled={testingConnection === site.id}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Test"
                          >
                            <RefreshCw className={`w-4 h-4 ${testingConnection === site.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleSyncSite(site.id)}
                            disabled={syncing === site.id}
                            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                            title="Sync"
                          >
                            <RefreshCw className={`w-4 h-4 ${syncing === site.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleEditSite(site)}
                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSite(site.id)}
                            disabled={deletingSite === site.id}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete"
                          >
                            {deletingSite === site.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
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

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }}></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedSite ? 'Edit Site' : 'Add Site'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmitSite} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="My Site"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL *</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://site.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="admin"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password * {selectedSite && '(leave blank to keep)'}
                      </label>
                      <input
                        type="password"
                        value={formData.applicationPassword}
                        onChange={(e) => setFormData({ ...formData, applicationPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="xxxx xxxx xxxx xxxx"
                        required={!selectedSite}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                    >
                      {selectedSite ? 'Update' : 'Add'} Site
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Setup Guide Modal */}
        {showSetupGuide && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowSetupGuide(false)}></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Setup Guide</h3>
                  <button onClick={() => setShowSetupGuide(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Key className="w-5 h-5 mr-2 text-blue-600" />
                      Step 1: Create Application Password
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>Log in to WordPress admin</li>
                      <li>Go to Users → Profile</li>
                      <li>Scroll to "Application Passwords"</li>
                      <li>Enter name "ContentAI"</li>
                      <li>Click "Add New Application Password"</li>
                      <li>Copy the password</li>
                    </ol>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Link className="w-5 h-5 mr-2 text-green-600" />
                      Step 2: Connect Site
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>Click "Add Site"</li>
                      <li>Enter site details</li>
                      <li>Paste application password</li>
                      <li>Test connection</li>
                    </ol>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={() => setShowSetupGuide(false)}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowSetupGuide(false);
                      handleAddSite();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                  >
                    Add Site Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWordPressPage;
