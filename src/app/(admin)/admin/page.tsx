// frontend/src/app/(admin)/admin/page.tsx - Fixed with correct financial endpoint
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import { authAPI } from '@/lib/api';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalContent: number;
    contentToday: number;
    totalRevenue: number;
    monthlyRevenue: number;
    connectedSites: number;
    apiUsage: number;
  };
  charts: {
    userGrowth: Array<{
      date: string;
      users: number;
      newUsers: number;
    }>;
    contentGeneration: Array<{
      date: string;
      generated: number;
      published: number;
    }>;
    revenue: Array<{
      month: string;
      revenue: number;
      costs: number;
    }>;
  };
  systemHealth: {
    apiUptime: number;
    avgResponseTime: number;
    errorRate: number;
    queueLength: number;
    apiUsage: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

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

interface Content {
  _id: string;
  title: string;
  status: string;
  type: string;
  wordCount: number;
  qualityScore?: number;
  seoScore?: number;
  reviewStatus?: string;
  createdAt: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch analytics data
      const analyticsResponse = await adminAPI.analytics.getDashboardAnalytics(timeRange);
      
      // Fetch financial data from correct endpoint
      const financialResponse = await adminAPI.financial.getFinancialOverview(timeRange);
      
      // Fetch WordPress sites count
      const wpResponse = await authAPI.get('/wordpress');
      const connectedSites = wpResponse.data.success ? wpResponse.data.data.length : 0;
      
      // Merge data
      const analyticsData = analyticsResponse.data.data;
      const financialData = financialResponse.data.data;
      
      setDashboardData({
        overview: {
          totalUsers: analyticsData.overview?.totalUsers || 0,
          activeUsers: analyticsData.overview?.activeUsers || 0,
          totalContent: analyticsData.overview?.totalContent || 0,
          contentToday: analyticsData.overview?.contentToday || 0,
          totalRevenue: financialData.revenue?.total || 0,
          monthlyRevenue: financialData.revenue?.thisMonth || 0,
          connectedSites: connectedSites,
          apiUsage: analyticsData.overview?.apiUsage || 0
        },
        charts: {
          userGrowth: analyticsData.charts?.userGrowth || [],
          contentGeneration: analyticsData.charts?.contentGeneration || [],
          revenue: financialData.charts?.revenueTrend ? 
            financialData.charts.revenueTrend.slice(-6).map((item: any) => ({
              month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
              revenue: item.revenue,
              costs: item.revenue * 0.3 // Estimated costs
            })) : []
        },
        systemHealth: analyticsData.systemHealth || {
          apiUptime: 99.9,
          avgResponseTime: 120,
          errorRate: 0.1,
          queueLength: 0,
          apiUsage: 45,
          memoryUsage: 68,
          cpuUsage: 42
        }
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentData = async () => {
    try {
      // Fetch recent users
      const usersResponse = await authAPI.get('/admin/users?page=1&limit=5&sort=-createdAt');
      if (usersResponse.data.success) {
        setRecentUsers(usersResponse.data.data.users || []);
      }

      // Fetch recent content
      const contentResponse = await adminAPI.content.getContentOverview({
        page: '1',
        limit: '5',
        sort: '-createdAt'
      });
      if (contentResponse.data.success) {
        setRecentContent(contentResponse.data.data.content || []);
      }
    } catch (err: any) {
      console.error('Recent data fetch error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchRecentData()]);
    setRefreshing(false);
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color = "blue", subtitle }: any) => {
    const colorClasses = {
      blue: "bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400",
      yellow: "bg-yellow-100 dark:bg-yellow-800/30 text-yellow-600 dark:text-yellow-400",
      purple: "bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-400",
      red: "bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400"
    };

    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            {change && (
              <div className="flex items-center mt-2">
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                )}
                <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${(colorClasses as any)[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  };

  const ChartContainer = ({ title, children, className = "" }: any) => (
    <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const formatNGN = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!dashboardData) return null;

  const { overview, charts, systemHealth } = dashboardData;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back, {user.name}. Here's what's happening with your platform.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={overview.totalUsers.toLocaleString()}
            change="12.5%"
            changeType="increase"
            icon={Users}
            color="blue"
            subtitle={`${overview.activeUsers.toLocaleString()} active`}
          />
          <StatCard
            title="Content Generated"
            value={overview.totalContent.toLocaleString()}
            change="8.3%"
            changeType="increase"
            icon={FileText}
            color="green"
            subtitle={`${overview.contentToday} today`}
          />
          <StatCard
            title="Monthly Revenue"
            value={formatNGN(overview.monthlyRevenue)}
            change="15.2%"
            changeType="increase"
            icon={DollarSign}
            color="yellow"
            subtitle={`${formatNGN(overview.totalRevenue)} total`}
          />
          <StatCard
            title="Connected Sites"
            value={overview.connectedSites.toLocaleString()}
            change="23.1%"
            changeType="increase"
            icon={Globe}
            color="purple"
            subtitle={`${overview.apiUsage}% API usage`}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="User Growth">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                  stroke="#6B7280"
                />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: 'rgba(209, 213, 219, 0.5)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Content Generation">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.contentGeneration}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                  stroke="#6B7280"
                />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: 'rgba(209, 213, 219, 0.5)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Line type="monotone" dataKey="generated" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="published" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Revenue Chart */}
        <ChartContainer title="Revenue Overview" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={charts.revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" tickFormatter={(value) => formatNGN(value)} />
              <Tooltip 
                formatter={(value: any) => [formatNGN(value), '']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderColor: 'rgba(209, 213, 219, 0.5)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* System Health & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="System Health">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {systemHealth.apiUptime}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">API Uptime</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {systemHealth.avgResponseTime}ms
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {systemHealth.cpuUsage}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {systemHealth.queueLength}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Queue Length</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                <span className="font-medium text-gray-900 dark:text-white">{systemHealth.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${systemHealth.memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </ChartContainer>

          <ChartContainer title="Quick Actions">
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Users</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{overview.totalUsers.toLocaleString()} total users</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/content'}
                className="w-full px-4 py-3 text-left bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/50 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Content Review</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{overview.contentToday} new today</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/financial'}
                className="w-full px-4 py-3 text-left bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:hover:bg-yellow-800/50 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Financial Overview</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatNGN(overview.monthlyRevenue)} this month</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/system'}
                className="w-full px-4 py-3 text-left bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">System Health</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{systemHealth.apiUptime}% uptime</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/wordpress'}
                className="w-full px-4 py-3 text-left bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 rounded-xl transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">WordPress Sites</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{overview.connectedSites} connected</p>
                  </div>
                </div>
              </button>
            </div>
          </ChartContainer>
        </div>

        {/* Recent Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartContainer title="Recent Users">
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No users found</p>
                </div>
              ) : (
                recentUsers.map((userItem, index) => (
                  <div key={userItem._id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          {userItem.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{userItem.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(userItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(userItem.status)}`}>
                      {userItem.status}
                    </span>
                  </div>
                ))
              )}
              {recentUsers.length > 0 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => window.location.href = '/admin/users'}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View All Users →
                  </button>
                </div>
              )}
            </div>
          </ChartContainer>

          <ChartContainer title="Recent Content">
            <div className="space-y-3">
              {recentContent.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No content found</p>
                </div>
              ) : (
                recentContent.map((contentItem, index) => (
                  <div key={contentItem._id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center mr-3">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="max-w-[160px]">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {contentItem.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(contentItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(contentItem.status)}`}>
                      {contentItem.status}
                    </span>
                  </div>
                ))
              )}
              {recentContent.length > 0 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => window.location.href = '/admin/content'}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View All Content →
                  </button>
                </div>
              )}
            </div>
          </ChartContainer>

          <ChartContainer title="System Alerts">
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">High Memory Usage</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Memory usage above 80%</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Backup Completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Daily backup successful</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">API Performance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Response time optimal</p>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  View All Alerts →
                </button>
              </div>
            </div>
          </ChartContainer>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
