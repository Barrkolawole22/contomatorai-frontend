'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { settingsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthProvider';
import {
  Bell,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Check,
  Settings as SettingsIcon,
  Key,
  Smartphone,
  User,
  Lock,
  Shield,
  Download,
  Trash2,
  Loader2
} from 'lucide-react';

const SettingsPage = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Initialize activeTab from URL parameter or default to 'profile'
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, refreshUser } = useAuth();

  // Form states - Initialize with empty values
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    company: '',
    location: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    creditAlerts: true,
    articleUpdates: false,
    marketingEmails: false
  });

  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'America/Los_Angeles',
    defaultContentType: 'blog',
    autoSave: true,
    wordCountDisplay: true
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    rateLimit: 100,
    webhookUrl: '',
    enableWebhooks: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    analyticsTracking: true,
    dataSharing: false,
    cookiePreferences: true
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    showModal: false,
    password: ''
  });

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getSettings();
        
        if (response.data.success) {
          const settings = response.data.data;
          
          // Update form states with backend data
          setProfileData({
            name: settings.profile.name || '',
            email: settings.profile.email || '',
            bio: settings.profile.bio || '',
            website: settings.profile.website || '',
            company: settings.profile.company || '',
            location: settings.profile.location || ''
          });

          setNotificationSettings({
            emailNotifications: settings.notifications.emailNotifications ?? true,
            pushNotifications: settings.notifications.pushNotifications ?? false,
            weeklyReports: settings.notifications.weeklyReports ?? true,
            creditAlerts: settings.notifications.creditAlerts ?? true,
            articleUpdates: settings.notifications.articleUpdates ?? false,
            marketingEmails: settings.notifications.marketingEmails ?? false
          });

          setPreferences({
            theme: settings.preferences.theme || 'system',
            language: settings.preferences.language || 'en',
            timezone: settings.preferences.timezone || 'America/Los_Angeles',
            defaultContentType: settings.preferences.defaultContentType || 'blog',
            autoSave: settings.preferences.autoSave ?? true,
            wordCountDisplay: settings.preferences.wordCountDisplay ?? true
          });

          setApiSettings({
            apiKey: settings.api.apiKey || '',
            rateLimit: settings.api.rateLimit || 100,
            webhookUrl: settings.api.webhookUrl || '',
            enableWebhooks: settings.api.enableWebhooks ?? false
          });
        }
      } catch (error: any) {
        console.error('Failed to load settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon },
    { id: 'api', name: 'API & Integrations', icon: Key },
    { id: 'data', name: 'Data & Privacy', icon: Shield }
  ];

  const handleSave = async (section: string) => {
    setSaveStatus('saving');
    setError('');
    
    try {
      let response;
      
      switch (section) {
        case 'profile':
          response = await settingsAPI.updateProfile(profileData);
          // Update user context with new profile data
          if (response.data.success) {
            await refreshUser();
          }
          break;
        case 'notifications':
          response = await settingsAPI.updateNotifications(notificationSettings);
          break;
        case 'preferences':
          response = await settingsAPI.updatePreferences(preferences as any);
          break;
        case 'api':
          response = await settingsAPI.updateApiSettings(apiSettings);
          if (response.data.success && response.data.data.apiKey) {
            setApiSettings(prev => ({
              ...prev,
              apiKey: response.data.data.apiKey
            }));
          }
          break;
        case 'security':
          if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            throw new Error('All password fields are required');
          }
          if (passwordData.newPassword !== passwordData.confirmPassword) {
            throw new Error('New passwords do not match');
          }
          response = await settingsAPI.changePassword(passwordData);
          // Clear password fields on success
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          break;
        default:
          throw new Error('Unknown section');
      }

      if (response.data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save changes');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await settingsAPI.exportData(format);
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], 
          { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user-data.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Handle CSV blob response
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user-data.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      setError('Failed to export data');
    }
  };

  const handleRegenerateApiKey = async () => {
    try {
      setSaveStatus('saving');
      const response = await settingsAPI.updateApiSettings({ regenerateApiKey: true });
      
      if (response.data.success) {
        setApiSettings(prev => ({
          ...prev,
          apiKey: response.data.data.apiKey
        }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error: any) {
      console.error('API key regeneration error:', error);
      setError('Failed to regenerate API key');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmation.password) {
      setError('Password is required to delete account');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone and will permanently delete all your data.')) {
      return;
    }

    try {
      setSaveStatus('saving');
      const response = await settingsAPI.deleteAccount({ 
        confirmPassword: deleteConfirmation.password 
      });
      
      if (response.data.success) {
        // Logout and redirect
        window.location.href = '/login?deleted=true';
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setDeleteConfirmation({ showModal: false, password: '' });
    }
  };

  const SaveButton = ({ onClick, section }: { onClick: (section: string) => void; section: string }) => (
    <button
      onClick={() => onClick(section)}
      disabled={saveStatus === 'saving'}
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {saveStatus === 'saving' ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : saveStatus === 'saved' ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Saved!
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </>
      )}
    </button>
  );

  const renderProfileTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your personal information and profile details.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={profileData.company}
            onChange={(e) => setProfileData({...profileData, company: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={profileData.location}
            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={profileData.website}
            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            value={profileData.bio}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <SaveButton onClick={handleSave} section="profile" />
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your password to keep your account secure.</p>
        </div>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SaveButton onClick={handleSave} section="security" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add an extra layer of security to your account.</p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Two-Factor Authentication Disabled
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Add an extra layer of security to your account by enabling 2FA.
              </p>
              <button className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose how you want to be notified about important updates.</p>
      </div>
      
      <div className="space-y-6">
        {Object.entries(notificationSettings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getNotificationDescription(key)}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setNotificationSettings({...notificationSettings, [key]: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <SaveButton onClick={handleSave} section="notifications" />
      </div>
    </div>
  );

  const getNotificationDescription = (key: string) => {
    const descriptions = {
      emailNotifications: 'Receive email notifications for important updates',
      pushNotifications: 'Get push notifications in your browser',
      weeklyReports: 'Weekly summary of your content performance',
      creditAlerts: 'Alerts when your credits are running low',
      articleUpdates: 'Notifications when articles are published',
      marketingEmails: 'Product updates and marketing communications'
    };
    return descriptions[key as keyof typeof descriptions] || '';
  };

  const renderPreferencesTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Application Preferences</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customize your application experience and settings.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={preferences.theme}
            onChange={(e) => setPreferences({...preferences, theme: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences({...preferences, language: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
            <option value="America/Denver">Mountain Time (MST/MDT)</option>
            <option value="America/Chicago">Central Time (CST/CDT)</option>
            <option value="America/New_York">Eastern Time (EST/EDT)</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="Europe/Paris">Paris (CET/CEST)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Content Type
          </label>
          <select
            value={preferences.defaultContentType}
            onChange={(e) => setPreferences({...preferences, defaultContentType: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="blog">Blog Post</option>
            <option value="article">Article</option>
            <option value="social">Social Media</option>
            <option value="email">Email</option>
            <option value="product">Product Description</option>
            <option value="landing">Landing Page</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Auto Save</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatically save your work as you type</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.autoSave}
              onChange={(e) => setPreferences({...preferences, autoSave: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Word Count Display</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Show word count while writing content</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.wordCountDisplay}
              onChange={(e) => setPreferences({...preferences, wordCountDisplay: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <SaveButton onClick={handleSave} section="preferences" />
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Access</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your API keys and integration settings.</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={apiSettings.apiKey}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button 
                onClick={handleRegenerateApiKey}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regenerate'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Keep your API key secure. Don't share it publicly.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rate Limit (requests per minute)
            </label>
            <input
              type="number"
              value={apiSettings.rateLimit}
              onChange={(e) => setApiSettings({...apiSettings, rateLimit: parseInt(e.target.value) || 100})}
              min="1"
              max="1000"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhooks</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure webhook notifications for your applications.</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enable Webhooks</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive HTTP notifications for events</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.enableWebhooks}
                onChange={(e) => setApiSettings({...apiSettings, enableWebhooks: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.enableWebhooks && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={apiSettings.webhookUrl}
                onChange={(e) => setApiSettings({...apiSettings, webhookUrl: e.target.value})}
                placeholder="https://your-app.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SaveButton onClick={handleSave} section="api" />
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Export</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Download your data and content in various formats.</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Export All Data</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download all your profile data and settings</p>
            </div>
            <button 
              onClick={() => handleExport('json')}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border border-gray-200 dark:border-gray-700 rounded-lg px-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Export Profile Data</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download your profile information in CSV format</p>
            </div>
            <button 
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Control how your data is used and shared.</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Analytics Tracking</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Allow us to collect usage data to improve the service</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.analyticsTracking}
                onChange={(e) => setPrivacySettings(prev => ({ 
                  ...prev, 
                  analyticsTracking: e.target.checked 
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Data Sharing</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Share anonymized data with partners for research purposes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.dataSharing}
                onChange={(e) => setPrivacySettings(prev => ({ 
                  ...prev, 
                  dataSharing: e.target.checked 
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Cookie Preferences</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Allow non-essential cookies for enhanced experience</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.cookiePreferences}
                onChange={(e) => setPrivacySettings(prev => ({ 
                  ...prev, 
                  cookiePreferences: e.target.checked 
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">These actions cannot be undone. Please proceed with caution.</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border border-red-200 dark:border-red-800 rounded-lg px-4 bg-white dark:bg-red-900/10">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all associated data</p>
            </div>
            <button 
              onClick={() => setDeleteConfirmation({ showModal: true, password: '' })}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteConfirmation.showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Confirm Account Deletion
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                This action cannot be undone. All your data, including articles, settings, and credits will be permanently deleted.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deleteConfirmation.password}
                onChange={(e) => setDeleteConfirmation(prev => ({ 
                  ...prev, 
                  password: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation({ showModal: false, password: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmation.password || saveStatus === 'saving'}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'api':
        return renderApiTab();
      case 'data':
        return renderDataTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <nav className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
