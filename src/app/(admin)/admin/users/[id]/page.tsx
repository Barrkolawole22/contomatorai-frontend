'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  Mail, Calendar, CreditCard, Shield, Activity, Edit, Ban,
  UserCheck, Trash2, ArrowLeft, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Loader, X
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
    notifications: { email: boolean; push: boolean; marketing: boolean };
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', status: '', credits: 0 });

  useEffect(() => { if (userId) fetchUserDetail(); }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.users.getUserDetails(userId);
      if (response.data.success) {
        const d = response.data.data;
        const processed: UserDetail = {
          _id: d._id,
          name: d.name || 'Unknown User',
          email: d.email || 'No email',
          role: d.role || 'user',
          status: d.status || 'active',
          credits: d.credits || 0,
          emailVerified: d.emailVerified || false,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          lastLogin: d.lastLogin || null,
          profile: {
            bio: d.profile?.bio || '',
            website: d.profile?.website || '',
            company: d.profile?.company || '',
            location: d.profile?.location || '',
          },
          preferences: {
            theme: d.preferences?.theme || 'system',
            language: d.preferences?.language || 'en',
            timezone: d.preferences?.timezone || 'UTC',
            notifications: {
              email: d.preferences?.notifications?.email || false,
              push: d.preferences?.notifications?.push || false,
              marketing: d.preferences?.notifications?.marketing || false,
            },
          },
          statistics: {
            totalContent: d.statistics?.totalContent || 0,
            publishedContent: d.statistics?.publishedContent || 0,
            connectedSites: d.statistics?.connectedSites || 0,
            totalCreditsUsed: d.statistics?.totalCreditsUsed || 0,
            lastActive: d.statistics?.lastActive || new Date().toISOString(),
          },
          recentActivity: d.recentActivity || [{ id: '1', type: 'account_created', description: 'Account created', timestamp: d.createdAt }],
        };
        setUser(processed);
        setEditForm({ name: processed.name, email: processed.email, role: processed.role, status: processed.status, credits: processed.credits });
      } else {
        throw new Error(response.data.message || 'Failed to fetch user details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: 'suspend' | 'activate' | 'delete' | 'update') => {
    try {
      let response;
      switch (action) {
        case 'suspend':  response = await adminAPI.users.updateUser(userId, { status: 'suspended' }); break;
        case 'activate': response = await adminAPI.users.updateUser(userId, { status: 'active' }); break;
        case 'delete':
          if (!confirm('Delete this user? This cannot be undone.')) return;
          response = await adminAPI.users.deleteUser(userId);
          if (response.data.success) { router.push('/admin/users'); return; }
          break;
        case 'update':
          response = await adminAPI.users.updateUser(userId, editForm);
          setShowEditModal(false);
          break;
      }
      if (response?.data.success) await fetchUserDetail();
      else throw new Error(response?.data.message || 'Action failed');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200/50 dark:border-green-700/50',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-700/50',
      inactive:  'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium ${styles[status] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      user:        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50',
      admin:       'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50',
      super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200/50 dark:border-purple-700/50',
      moderator:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-700/50',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium border ${styles[role] || styles.user}`}>
        {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading User</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'User not found'}</p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => router.push('/admin/users')} className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all">
                Back to Users
              </button>
              <button onClick={fetchUserDetail} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">ID: {user._id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUserDetail}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg"
            >
              <Edit className="w-4 h-4" />
              Edit User
            </button>
          </div>
        </div>

        {/* User info card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-3xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                {getStatusBadge(user.status)}
                {getRoleBadge(user.role)}
                {['admin', 'super_admin'].includes(user.role) && (
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{user.email}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" /><span>Joined {new Date(user.createdAt).toLocaleDateString()}</span></div>
                <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 flex-shrink-0" /><span>{user.credits?.toLocaleString() || 0} credits</span></div>
                <div className="flex items-center gap-2">
                  {user.emailVerified
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span>{user.emailVerified ? 'Email verified' : 'Email unverified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {user.statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Content',    value: user.statistics.totalContent,    color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Published',        value: user.statistics.publishedContent, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Connected Sites',  value: user.statistics.connectedSites,  color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Credits Used',     value: user.statistics.totalCreditsUsed.toLocaleString(), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50`}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {user.status === 'active' ? (
              <button
                onClick={() => handleUserAction('suspend')}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-sm"
              >
                <Ban className="w-4 h-4" />
                Suspend User
              </button>
            ) : (
              <button
                onClick={() => handleUserAction('activate')}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                Activate User
              </button>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm"
            >
              <Edit className="w-4 h-4" />
              Edit User
            </button>
            <button
              onClick={() => handleUserAction('delete')}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </button>
          </div>
        </div>

        {/* Profile details */}
        {user.profile && (user.profile.bio || user.profile.company || user.profile.website || user.profile.location) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {user.profile.company  && <div><p className="text-gray-500 mb-0.5">Company</p><p className="text-gray-900 dark:text-white font-medium">{user.profile.company}</p></div>}
              {user.profile.location && <div><p className="text-gray-500 mb-0.5">Location</p><p className="text-gray-900 dark:text-white font-medium">{user.profile.location}</p></div>}
              {user.profile.website  && <div><p className="text-gray-500 mb-0.5">Website</p><a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{user.profile.website}</a></div>}
              {user.profile.bio      && <div className="sm:col-span-2"><p className="text-gray-500 mb-0.5">Bio</p><p className="text-gray-900 dark:text-white">{user.profile.bio}</p></div>}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {user.recentActivity && user.recentActivity.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {user.recentActivity.slice(0, 5).map((a, i) => (
                <div key={a.id || i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{a.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
                <p className="text-sm text-gray-500 mt-0.5">Update user information and permissions</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credits</label>
                  <input
                    type="number"
                    value={editForm.credits}
                    onChange={e => setEditForm({ ...editForm, credits: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => handleUserAction('update')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium text-sm shadow-lg">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}