// frontend/src/app/(admin)/admin/users/page.tsx - COMPLETE WITH WORKING NAVIGATION
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation'; // ← Navigation import
import AdminLayout from '@/components/layout/AdminLayout';
import { authAPI } from '@/lib/api';
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  Ban,
  UserCheck,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
  Activity,
  Eye, // ← For view button
  Edit,
  Trash2,
  RefreshCw
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
  const router = useRouter(); // ← Router hook
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });
  const [filters, setFilters] = useState<UserFilters>({
    status: '',
    role: '',
    search: ''
  });
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0
  });

  // 🔥 Navigation function for user details
  const navigateToUserDetail = (userId: string) => {
    console.log('🚀 Navigating to user:', userId);
    console.log('🚀 Target URL:', `/admin/users/${userId}`);
    
    // Using Next.js router for proper navigation
    try {
      router.push(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location if router fails
      window.location.href = `/admin/users/${userId}`;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role })
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
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      let endpoint = '';
      let data = {};
      
      switch (action) {
        case 'suspend':
          endpoint = `/admin/users/${userId}`;
          data = { status: 'suspended' };
          break;
        case 'activate':
          endpoint = `/admin/users/${userId}`;
          data = { status: 'active' };
          break;
        case 'delete':
          endpoint = `/admin/users/${userId}`;
          break;
      }

      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          return;
        }
        await authAPI.delete(endpoint);
      } else {
        await authAPI.put(endpoint, data);
      }
      
      fetchUsers();
      setShowUserModal(false);
    } catch (err: any) {
      console.error('User action error:', err);
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200/50 dark:border-green-700/50',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50 dark:border-red-700/50',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[status as keyof typeof styles]}`}>
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
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const stats = [
    {
      title: 'Total Users',
      value: (statistics.totalUsers || 0).toLocaleString(),
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: (statistics.activeUsers || 0).toLocaleString(),
      icon: UserCheck,
      color: 'green'
    },
    {
      title: 'Suspended Users',
      value: (statistics.suspendedUsers || 0).toLocaleString(),
      icon: Ban,
      color: 'red'
    },
    {
      title: 'Admin Users',
      value: (statistics.adminUsers || 0).toLocaleString(),
      icon: Shield,
      color: 'purple'
    }
  ];

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl inline-block mb-4">
                <Shield className="w-16 h-16 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have permission to access user management.
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Manage platform users and their permissions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                    <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{stat.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="block px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl inline-block mb-4">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-700/30 rounded-xl inline-block mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  {users.map((userItem) => (
                    <tr 
                      key={userItem._id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('🖱️ Row clicked for user:', userItem._id);
                        navigateToUserDetail(userItem._id);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                                {userItem.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {userItem.name}
                              </div>
                              {['admin', 'super_admin'].includes(userItem.role) && (
                                <div className="p-1 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(userItem.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(userItem.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {(userItem.credits || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          userItem.emailVerified 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {userItem.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* 🔥 View Details Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              console.log('👆 View button clicked for user:', userItem._id);
                              navigateToUserDetail(userItem._id);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 flex items-center space-x-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">View</span>
                          </button>
                          
                          {/* More Actions Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              setSelectedUser(userItem);
                              setShowUserModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                          >
                            <MoreVertical className="w-5 h-5" />
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
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={!pagination.hasNextPage}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page <span className="font-semibold">{pagination.currentPage}</span> of{' '}
                      <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalUsers} total users)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={!pagination.hasNextPage}
                      className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  User Details
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedUser.name}
                      </h4>
                      {['admin', 'super_admin'].includes(selectedUser.role) && (
                        <div className="p-1 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Credits
                    </label>
                    <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                      <CreditCard className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                      {(selectedUser.credits || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Status
                    </label>
                    <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                      <Mail className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                      {selectedUser.emailVerified ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                    <Calendar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {selectedUser.lastLogin && (
                  <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Login
                    </label>
                    <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                      <Activity className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                      {new Date(selectedUser.lastLogin).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* 🔥 ADD: View Full Details Button */}
                <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      navigateToUserDetail(selectedUser._id);
                    }}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    View Full Details
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => handleUserAction(selectedUser._id, 'suspend')}
                    className="flex-1 flex items-center justify-center px-6 py-3 border border-red-600 text-red-600 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  >
                    <Ban className="w-5 h-5 mr-2" />
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => handleUserAction(selectedUser._id, 'activate')}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <UserCheck className="w-5 h-5 mr-2" />
                    Activate User
                  </button>
                )}
                
                <button
                  onClick={() => handleUserAction(selectedUser._id, 'delete')}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete User
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
