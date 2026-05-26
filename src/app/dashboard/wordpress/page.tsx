'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWordPress } from '@/hooks/useWordPress';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  Activity,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  X,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface SiteFormData {
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
}

export default function WordPressSitesPage() {
  const router = useRouter();
  const {
    sites,
    loading,
    error,
    connectSite,
    disconnectSite,
    updateSite,
    testConnection,
    syncTaxonomies,
    refreshSites,
    clearError
  } = useWordPress();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Operation states
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [deletingSite, setDeletingSite] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    url: '',
    username: '',
    applicationPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<SiteFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [operationMessages, setOperationMessages] = useState<{[key: string]: string}>({});

  // Clear operation message after timeout
  const setOperationMessage = (siteId: string, message: string) => {
    setOperationMessages(prev => ({ ...prev, [siteId]: message }));
    setTimeout(() => {
      setOperationMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[siteId];
        return newMessages;
      });
    }, 3000);
  };

  // Form validation
  const validateForm = (data: SiteFormData): Partial<SiteFormData> => {
    const errors: Partial<SiteFormData> = {};
    
    if (!data.name.trim()) errors.name = 'Site name is required';
    if (!data.url.trim()) errors.url = 'Site URL is required';
    if (!data.username.trim()) errors.username = 'Username is required';
    if (!data.applicationPassword.trim()) errors.applicationPassword = 'Application password is required';
    
    // URL validation
    if (data.url && !data.url.match(/^https?:\/\/.+/)) {
      errors.url = 'Please enter a valid URL (including http:// or https://)';
    }
    
    return errors;
  };

  // Add new site
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);
      await connectSite(formData);
      
      // Reset form and close modal
      setFormData({ name: '', url: '', username: '', applicationPassword: '' });
      setFormErrors({});
      setShowAddModal(false);
      
      setOperationMessage('new', 'WordPress site connected successfully!');
    } catch (err: any) {
      console.error('Error adding site:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete site
  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to remove this WordPress site? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingSite(siteId);
      await disconnectSite(siteId);
      setOperationMessage('deleted', 'WordPress site removed successfully');
    } catch (err: any) {
      console.error('Error deleting site:', err);
    } finally {
      setDeletingSite(null);
    }
  };

  // Sync site taxonomies
  const handleSyncSite = async (siteId: string) => {
    try {
      setSyncing(siteId);
      await syncTaxonomies(siteId);
      setOperationMessage(siteId, 'Site synchronized successfully');
    } catch (err: any) {
      console.error('Error syncing site:', err);
    } finally {
      setSyncing(null);
    }
  };

  // Test site connection
  const handleTestConnection = async (siteId: string) => {
    try {
      setTestingConnection(siteId);
      const result = await testConnection(siteId);
      
      if (result.success) {
        setOperationMessage(siteId, 'Connection test successful!');
      } else {
        setOperationMessage(siteId, `Connection failed: ${result.error}`);
      }
    } catch (err: any) {
      console.error('Error testing connection:', err);
    } finally {
      setTestingConnection(null);
    }
  };

  // Edit site
  const handleEditSite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSiteId) return;

    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);
      await updateSite(selectedSiteId, formData);
      
      // Reset form and close modal
      setFormData({ name: '', url: '', username: '', applicationPassword: '' });
      setFormErrors({});
      setShowEditModal(false);
      setSelectedSiteId(null);
      
      setOperationMessage(selectedSiteId, 'WordPress site updated successfully!');
    } catch (err: any) {
      console.error('Error updating site:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (site: any) => {
    setSelectedSiteId(site.id);
    setFormData({
      name: site.name,
      url: site.url,
      username: site.username,
      applicationPassword: ''
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedSiteId(null);
    setFormData({ name: '', url: '', username: '', applicationPassword: '' });
    setFormErrors({});
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WordPress Sites</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your WordPress sites and publishing settings
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={() => setShowSetupGuide(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Setup Guide
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </button>
            <button
              onClick={refreshSites}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading WordPress sites
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success Messages */}
        {Object.entries(operationMessages).map(([key, message]) => (
          <div key={key} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && sites.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading WordPress sites...</p>
            </div>
          </div>
        )}

        {/* Sites List or Empty State */}
        {!loading && (
          <>
            {sites.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No WordPress Sites Connected</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Connect your first WordPress site to start publishing content automatically with AI-powered articles.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Connect Your First Site
                  </button>
                  <button
                    onClick={() => setShowSetupGuide(true)}
                    className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Setup Guide
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sites.map((site) => (
                  <div
                    key={site.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    {/* Site Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {site.name}
                            </h3>
                            <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(site.status)}`}>
                              {getStatusIcon(site.status)}
                              <span className="ml-1 capitalize">{site.status}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                            title={site.url}
                          >
                            {site.url}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Last Sync Info */}
                    {site.lastSync && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <Clock className="w-3 h-3 mr-1" />
                        Last synced: {formatDate(site.lastSync)}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTestConnection(site.id)}
                          disabled={testingConnection === site.id}
                          className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Test Connection"
                        >
                          {testingConnection === site.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wifi className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleSyncSite(site.id)}
                          disabled={syncing === site.id}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Sync Site"
                        >
                          <RefreshCw className={`w-4 h-4 ${syncing === site.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => openEditModal(site)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit Site"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site.id)}
                          disabled={deletingSite === site.id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Remove Site"
                        >
                          {deletingSite === site.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Added {formatDate(site.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Site Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add WordPress Site
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My WordPress Site"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.url && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.url}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="WordPress username"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Application Password
                  </label>
                  <input
                    type="password"
                    value={formData.applicationPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicationPassword: e.target.value }))}
                    placeholder="WordPress application password"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.applicationPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.applicationPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.applicationPassword}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Generate this in your WordPress admin under Users → Profile → Application Passwords
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Site
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Setup Guide Modal */}
        {showSetupGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  WordPress Setup Guide
                </h3>
                <button
                  onClick={() => setShowSetupGuide(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Before You Start
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• WordPress 5.6 or higher is required</li>
                    <li>• You need admin access to your WordPress site</li>
                    <li>• Application passwords must be enabled</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Step 1: Generate Application Password
                  </h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Log in to your WordPress admin dashboard</li>
                    <li>Go to Users → Profile (or Users → All Users → Edit your user)</li>
                    <li>Scroll down to the "Application Passwords" section</li>
                    <li>Enter a name like "ContentAI" and click "Add New Application Password"</li>
                    <li>Copy the generated password (it will only be shown once)</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Step 2: Add Your Site
                  </h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Click the "Add Site" button above</li>
                    <li>Fill in your site name and URL</li>
                    <li>Enter your WordPress username</li>
                    <li>Paste the application password you generated</li>
                    <li>Click "Add Site" to connect</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                    Troubleshooting
                  </h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Make sure your site URL includes http:// or https://</li>
                    <li>• Application passwords must be enabled in WordPress settings</li>
                    <li>• Your WordPress user must have publishing permissions</li>
                    <li>• Check that your site is publicly accessible</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowSetupGuide(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Site Modal */}
        {showEditModal && selectedSiteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit WordPress Site
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My WordPress Site"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.url ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.url && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.url}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="WordPress username"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Application Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={formData.applicationPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicationPassword: e.target.value }))}
                    placeholder="New application password (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update Site
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}