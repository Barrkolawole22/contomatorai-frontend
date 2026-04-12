// frontend/src/app/(admin)/admin/settings/page.tsx - CONSOLIDATED VERSION
'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import { 
  Save, 
  Settings, 
  Shield, 
  Globe, 
  Database, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Users,
  FileText,
  Bell,
  Mail,
  Lock,
  Zap
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    timezone: string;
    language: string;
    registeredUsers: number;
    totalContent: number;
  };
  features: {
    registration: boolean;
    emailVerification: boolean;
    adminPanel: boolean;
  };
  limits: {
    maxFileSize: number;
    rateLimitRequests: number;
    rateLimitWindow: number;
    defaultUserCredits: number;
    maxUserCredits: number;
  };
  integrations: {
    openaiEnabled: boolean;
    geminiEnabled: boolean;
    redisEnabled: boolean;
  };
}

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'features', label: 'Features', icon: Shield },
    { id: 'limits', label: 'Limits & Quotas', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.settings.getSettings();
      
      if (response.data.success) {
        setSettings(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch settings');
      }
    } catch (err: any) {
      console.error('Fetch settings error:', err);
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const response = await adminAPI.settings.updateSettings(settings);
      
      if (response.data.success) {
        setSaveStatus('success');
        // Refresh to get updated statistics
        setTimeout(() => {
          fetchSettings();
          setSaveStatus('idle');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Save settings error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const renderTabContent = () => {
    if (!settings) return null;

    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter site name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => updateSettings('general', 'adminEmail', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Site Description
              </label>
              <textarea
                value={settings.general.siteDescription}
                onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                placeholder="Brief description of your platform"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.general.language}
                  onChange={(e) => updateSettings('general', 'language', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>

            {/* Platform Statistics */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                Platform Statistics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {settings.general.registeredUsers.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Registered Users</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                      <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {settings.general.totalContent.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Content</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Control which features are available to users on your platform
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">User Registration</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow new users to create accounts</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings('features', 'registration', !settings.features.registration)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.features.registration ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      settings.features.registration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email Verification</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Require email verification for new accounts</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings('features', 'emailVerification', !settings.features.emailVerification)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.features.emailVerification ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      settings.features.emailVerification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Admin Panel Access</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enable admin panel functionality</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings('features', 'adminPanel', !settings.features.adminPanel)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.features.adminPanel ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      settings.features.adminPanel ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Warning</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Disabling critical features may affect user experience and platform functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'limits':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure system limits and quotas for resource management
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max File Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={Math.round(settings.limits.maxFileSize / (1024 * 1024))}
                  onChange={(e) => updateSettings('limits', 'maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Maximum file size users can upload (1-100 MB)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rate Limit (Requests per Window)
                </label>
                <input
                  type="number"
                  value={settings.limits.rateLimitRequests}
                  onChange={(e) => updateSettings('limits', 'rateLimitRequests', parseInt(e.target.value))}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Maximum API requests per time window
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limit Window (Minutes)
              </label>
              <input
                type="number"
                value={Math.round(settings.limits.rateLimitWindow / 60000)}
                onChange={(e) => updateSettings('limits', 'rateLimitWindow', parseInt(e.target.value) * 60000)}
                min="1"
                max="60"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Time window for rate limiting (1-60 minutes)
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default User Credits
                </label>
                <input
                  type="number"
                  value={settings.limits.defaultUserCredits}
                  onChange={(e) => updateSettings('limits', 'defaultUserCredits', parseInt(e.target.value))}
                  min="0"
                  max="10000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Initial credits for new users
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum User Credits
                </label>
                <input
                  type="number"
                  value={settings.limits.maxUserCredits}
                  onChange={(e) => updateSettings('limits', 'maxUserCredits', parseInt(e.target.value))}
                  min="100"
                  max="100000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Maximum credits a user can accumulate
                </p>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              View status of third-party service integrations
            </p>
            
            <div className="space-y-4">
              <div className={`p-6 rounded-xl border-2 ${
                settings.integrations.openaiEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      settings.integrations.openaiEnabled
                        ? 'bg-green-100 dark:bg-green-800/30'
                        : 'bg-red-100 dark:bg-red-800/30'
                    }`}>
                      <Key className={`w-8 h-8 ${
                        settings.integrations.openaiEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">OpenAI API</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">GPT-4 content generation service</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium ${
                    settings.integrations.openaiEnabled 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      settings.integrations.openaiEnabled ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">{settings.integrations.openaiEnabled ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-xl border-2 ${
                settings.integrations.geminiEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      settings.integrations.geminiEnabled
                        ? 'bg-green-100 dark:bg-green-800/30'
                        : 'bg-red-100 dark:bg-red-800/30'
                    }`}>
                      <Globe className={`w-8 h-8 ${
                        settings.integrations.geminiEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Gemini</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Alternative AI content service</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium ${
                    settings.integrations.geminiEnabled 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      settings.integrations.geminiEnabled ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">{settings.integrations.geminiEnabled ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-xl border-2 ${
                settings.integrations.redisEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      settings.integrations.redisEnabled
                        ? 'bg-green-100 dark:bg-green-800/30'
                        : 'bg-red-100 dark:bg-red-800/30'
                    }`}>
                      <Database className={`w-8 h-8 ${
                        settings.integrations.redisEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Redis Cache</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Caching and session management</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium ${
                    settings.integrations.redisEnabled 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      settings.integrations.redisEnabled ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">{settings.integrations.redisEnabled ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl">
              <div className="flex">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Note</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Integration status is determined by environment variables. Configure API keys in your .env file to enable services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Settings</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchSettings}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 inline-flex items-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                System Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure and manage your platform settings
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 inline-flex items-center ${
                saveStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Failed
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 lg:p-8">
            {renderTabContent()}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All changes are saved immediately and will affect the entire platform. Some settings may require users to refresh their browsers to take effect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
