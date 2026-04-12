'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import { 
  User,
  Mail,
  Calendar,
  CreditCard,
  Shield,
  Activity,
  FileText,
  Globe,
  Edit,
  Ban,
  UserCheck,
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Send,
  Settings,
  Loader
} from 'lucide-react';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'inactive';
  credits: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profile?: {
    bio?: string;
    website?: string;
    company?: string;
    location?: string;
    avatar?: string;
  };
  preferences?: {
    theme: string;
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
  statistics?: {
    totalContent: number;
    publishedContent: number;
    connectedSites: number;
    totalCreditsUsed: number;
    lastActive: string;
  };
  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export default function AdminUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    credits: 0
  });

  useEffect(() => {
    if (userId) {
      console.log('🔍 Loading user detail for ID:', userId);
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching user detail for ID:', userId);
      
      const response = await adminAPI.users.getUserDetails(userId);
      console.log('✅ API response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data;
        
        // Process the user data with proper fallbacks
        const processedUser: UserDetail = {
          _id: userData._id,
          name: userData.name || 'Unknown User',
          email: userData.email || 'No email',
          role: userData.role || 'user',
          status: userData.status || 'active',
          credits: userData.credits || 0,
          emailVerified: userData.emailVerified || false,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          lastLogin: userData.lastLogin || null,
          
          profile: {
            bio: userData.profile?.bio || '',
            website: userData.profile?.website || '',
            company: userData.profile?.company || '',
            location: userData.profile?.location || '',
            avatar: userData.profile?.avatar || null
          },
          
          preferences: {
            theme: userData.preferences?.theme || 'system',
            language: userData.preferences?.language || 'en',
            timezone: userData.preferences?.timezone || 'UTC',
            notifications: {
              email: userData.preferences?.notifications?.email || false,
              push: userData.preferences?.notifications?.push || false,
              marketing: userData.preferences?.notifications?.marketing || false
            }
          },
          
          statistics: {
            totalContent: userData.statistics?.totalContent || 0,
            publishedContent: userData.statistics?.publishedContent || 0,
            connectedSites: userData.statistics?.connectedSites || 0,
            totalCreditsUsed: userData.statistics?.totalCreditsUsed || 0,
            lastActive: userData.statistics?.lastActive || new Date().toISOString()
          },
          
          recentActivity: userData.recentActivity || [
            {
              id: '1',
              type: 'account_created',
              description: 'Account created',
              timestamp: userData.createdAt || new Date().toISOString()
            }
          ]
        };
        
        console.log('✅ Processed user data:', processedUser);
        setUser(processedUser);
        
        setEditForm({
          name: processedUser.name,
          email: processedUser.email,
          role: processedUser.role,
          status: processedUser.status,
          credits: processedUser.credits
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch user details');
      }
    } catch (err: any) {
      console.error('❌ Fetch user detail error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: 'suspend' | 'activate' | 'delete' | 'update') => {
    try {
      let response;
      
      console.log(`🔄 Performing action: ${action} for user: ${userId}`);
      
      switch (action) {
        case 'suspend':
          response = await adminAPI.users.updateUser(userId, { status: 'suspended' });
          break;
        case 'activate':
          response = await adminAPI.users.updateUser(userId, { status: 'active' });
          break;
        case 'delete':
          if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
          }
          response = await adminAPI.users.deleteUser(userId);
          if (response.data.success) {
            router.push('/admin/users');
            return;
          }
          break;
        case 'update':
          response = await adminAPI.users.updateUser(userId, editForm);
          setShowEditModal(false);
          break;
      }
      
      if (response?.data.success) {
        console.log('✅ Action completed successfully');
        await fetchUserDetail();
      } else {
        throw new Error(response?.data.message || 'Action failed');
      }
    } catch (err: any) {
      console.error('❌ User action error:', err);
      alert(err.response?.data?.message || err.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200/50 dark:border-green-700/50',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-700/50',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      user: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50',
      super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200/50 dark:border-purple-700/50',
      moderator: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-700/50'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium border ${styles[role as keyof typeof styles] || styles.user}`}>
        {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">User ID: {userId}</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading User</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{error || 'User not found'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">User ID: {userId}</p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Back to Users
                </button>
                <button
                  onClick={fetchUserDetail}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">User ID: {user._id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchUserDetail}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit User</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-6">
            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-3xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                {getStatusBadge(user.status)}
                {getRoleBadge(user.role)}
                {['admin', 'super_admin'].includes(user.role) && (
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-5 h-5 mr-2" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <CreditCard className="w-5 h-5 mr-2" />
                  <span className="text-sm">{user.credits?.toLocaleString() || 0} credits</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  {user.emailVerified ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2 text-red-500" />
                  )}
                  <span className="text-sm">{user.emailVerified ? 'Verified' : 'Unverified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                🎉 User Detail Page Working!
              </h3>
              <p className="text-green-700 dark:text-green-400 mt-1">
                Successfully loaded user: <strong>{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {user.status === 'active' ? (
              <button
                onClick={() => handleUserAction('suspend')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                <Ban className="w-4 h-4" />
                <span>Suspend User</span>
              </button>
            ) : (
              <button
                onClick={() => handleUserAction('activate')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                <UserCheck className="w-4 h-4" />
                <span>Activate User</span>
              </button>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
              <span>Edit User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update user information and permissions</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction('update')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}