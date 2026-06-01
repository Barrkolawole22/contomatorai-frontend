'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { authAPI } from '@/lib/api';
import {
  Users, Search, MoreVertical, Ban, UserCheck, Mail, Calendar,
  CreditCard, Shield, AlertTriangle, ChevronLeft, ChevronRight,
  UserPlus, Activity, Eye, Trash2, RefreshCw, X
} from 'lucide-react';

interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'suspended' | 'inactive';
  role: string;
  credits?: number;
  emailVerified: boolean;
}

interface UserFilters {
  status: string;
  role: string;
  search: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1, totalPages: 1, totalUsers: 0,
    hasNextPage: false, hasPrevPage: false, limit: 20,
  });
  const [filters, setFilters] = useState<UserFilters>({ status: '', role: '', search: '' });
  const [statistics, setStatistics] = useState({
    totalUsers: 0, activeUsers: 0, suspendedUsers: 0, adminUsers: 0,
  });

  const navigateToUserDetail = (userId: string) => {
    try { router.push(`/admin/users/${userId}`); }
    catch { window.location.href = `/admin/users/${userId}`; }
  };

  useEffect(() => { fetchUsers(); }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.role   && { role: filters.role }),
      });
      const response = await authAPI.get(`/admin/users?${params}`);
      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination(response.data.data.pagination);
        setStatistics(response.data.data.statistics);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchUsers(); setRefreshing(false); };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Delete this user? This cannot be undone.')) return;
        await authAPI.delete(`/admin/users/${userId}`);
      } else {
        await authAPI.put(`/admin/users/${userId}`, {
          status: action === 'suspend' ? 'suspended' : 'active',
        });
      }
      fetchUsers();
      setShowUserModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200/50 dark:border-green-700/50',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-700/50',
      inactive:  'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[status] || styles.inactive}`}>
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
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[role] || styles.user}`}>
        {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const stats = [
    { title: 'Total Users',     value: statistics.totalUsers.toLocaleString(),     icon: Users,     color: 'bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400' },
    { title: 'Active Users',    value: statistics.activeUsers.toLocaleString(),    icon: UserCheck, color: 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400' },
    { title: 'Suspended Users', value: statistics.suspendedUsers.toLocaleString(), icon: Ban,       color: 'bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400' },
    { title: 'Admin Users',     value: statistics.adminUsers.toLocaleString(),     icon: Shield,    color: 'bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-400' },
  ];

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl inline-block mb-4">
              <Shield className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">You don't have permission to access user management.</p>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage platform users and their permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl">
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-5">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.role}
              onChange={e => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all">
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                  <tr>
                    {['User', 'Status', 'Role', 'Credits', 'Verified', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  {users.map(u => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => navigateToUserDetail(u._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{u.name}</span>
                              {['admin', 'super_admin'].includes(u.role) && (
                                <Shield className="w-3.5 h-3.5 text-purple-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(u.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {(u.credits || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          u.emailVerified
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {u.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); navigateToUserDetail(u._id); }}
                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs font-medium">View</span>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedUser(u); setShowUserModal(true); }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50/50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-semibold">{pagination.currentPage}</span> of{' '}
                  <span className="font-semibold">{pagination.totalPages}</span>{' '}
                  <span className="text-gray-500">({pagination.totalUsers} users)</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={!pagination.hasNextPage}
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* More Actions Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl max-w-md w-full">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Actions</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User summary */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50 flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{selectedUser.name}</h4>
                    {['admin', 'super_admin'].includes(selectedUser.role) && (
                      <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />{selectedUser.email}
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Role</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Credits</p>
                  <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-semibold text-sm">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    {(selectedUser.credits || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Joined</p>
                  <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-semibold text-sm">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* View full details */}
              <button
                onClick={() => { setShowUserModal(false); navigateToUserDetail(selectedUser._id); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl mb-4"
              >
                <Eye className="w-4 h-4" />
                View Full Details
              </button>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => handleUserAction(selectedUser._id, 'suspend')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-600 text-red-600 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Ban className="w-4 h-4" />
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction(selectedUser._id, 'activate')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-lg"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleUserAction(selectedUser._id, 'delete')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;