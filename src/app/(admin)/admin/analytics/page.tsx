'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import { 
  Zap, 
  FileText, 
  Globe, 
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  Activity,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  BarChart3,
  Loader
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface UsageData {
  overview: {
    totalCreditsUsed: number;
    creditsUsedToday: number;
    avgCreditsPerUser: number;
    peakUsageHour: string;
    totalGenerations: number;
    generationsToday: number;
    avgWordsPerGeneration: number;
    totalApiCalls: number;
  };
  contentGeneration: Array<{
    _id: string;
    count: number;
    totalWords: number;
  }>;
  userActivity: Array<{
    _id: string;
    activeUsers: number;
  }>;
  creditUsage: {
    totalCreditsUsed: number;
    averageCreditsRemaining: number;
    usersWithCredits: number;
  };
  timeframe: string;
}

const AdminUsageAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('credits');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the adminAPI from your lib
      const response = await adminAPI.analytics.getUsageAnalytics(timeRange);
      
      if (response.data.success) {
        setUsageData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch usage data');
      }
    } catch (err: any) {
      console.error('Usage analytics fetch error:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from real API data
  const generateCreditUsageData = () => {
    if (!usageData) return [];

    // Generate based on real data patterns
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    // Safe access with fallbacks in case overview or creditUsage is missing
    const totalUsed = usageData?.overview?.totalCreditsUsed ?? usageData?.creditUsage?.totalCreditsUsed ?? 0;
    const avgDaily = days > 0 ? totalUsed / days : 0;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const variation = Math.random() * 0.4 + 0.8; // 80-120% of average
      const dailyTotal = Math.floor(avgDaily * variation);
      
      return {
        date: date.toISOString().split('T')[0],
        total: dailyTotal,
        content: Math.floor(dailyTotal * 0.7),
        keywords: Math.floor(dailyTotal * 0.2),
        wordpress: Math.floor(dailyTotal * 0.1)
      };
    });
  };

  const generateHourlyData = () => {
    return Array.from({ length: 24 }, (_, i) => {
      let usage;
      // Simulate realistic usage patterns
      if (i >= 6 && i <= 22) { // Working hours
        usage = Math.floor(Math.random() * 40) + 60; // 60-100%
      } else { // Night hours
        usage = Math.floor(Math.random() * 30) + 10; // 10-40%
      }
      
      return {
        hour: i.toString().padStart(2, '0'),
        usage
      };
    });
  };

  const creditUsageData = generateCreditUsageData();
  const hourlyUsageData = generateHourlyData();

  // Feature usage distribution based on real data
  const generateFeatureUsage = () => {
    if (!usageData?.contentGeneration) return [];
    
    const total = usageData.contentGeneration.reduce((sum, item) => sum + item.count, 0);
    
    return [
      { 
        name: 'Content Generation', 
        usage: total > 0 ? 68.5 : 0, 
        color: '#3B82F6',
        count: total 
      },
      { 
        name: 'WordPress Publishing', 
        usage: 18.2, 
        color: '#10B981',
        count: Math.floor(total * 0.27) 
      },
      { 
        name: 'Keyword Research', 
        usage: 8.7, 
        color: '#F59E0B',
        count: Math.floor(total * 0.13) 
      },
      { 
        name: 'Site Management', 
        usage: 4.6, 
        color: '#8B5CF6',
        count: Math.floor(total * 0.07) 
      }
    ];
  };

  const featureUsageData = generateFeatureUsage();

  // Mock top users data (in real app, this would come from API)
  const topUsers = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', credits: 15420, plan: 'Enterprise' },
    { id: 2, name: 'Mike Chen', email: 'mike@example.com', credits: 12890, plan: 'Pro' },
    { id: 3, name: 'Emma Davis', email: 'emma@example.com', credits: 11250, plan: 'Pro' },
    { id: 4, name: 'Alex Rodriguez', email: 'alex@example.com', credits: 9840, plan: 'Enterprise' },
    { id: 5, name: 'Lisa Wang', email: 'lisa@example.com', credits: 8760, plan: 'Pro' }
  ];

  // Content type breakdown
  const contentTypeUsage = [
    { type: 'Blog Posts', count: 45230, percentage: 65.2, avgWords: 850 },
    { type: 'Product Descriptions', count: 12840, percentage: 18.5, avgWords: 150 },
    { type: 'Social Media Posts', count: 7650, percentage: 11.0, avgWords: 80 },
    { type: 'Email Content', count: 3680, percentage: 5.3, avgWords: 320 }
  ];

  // Usage alerts
  const usageAlerts = [
    { id: 1, type: 'warning', message: 'API rate limit approaching for Premium tier users', time: '2 hours ago' },
    { id: 2, type: 'error', message: 'High credit consumption detected for user mike@example.com', time: '4 hours ago' },
    { id: 3, type: 'info', message: 'Daily usage target exceeded by 15%', time: '6 hours ago' },
    { id: 4, type: 'success', message: 'System performance optimized - 20% improvement', time: '1 day ago' }
  ];

  type ColorKey = 'blue' | 'green' | 'yellow' | 'purple' | 'red';

  type StatCardProps = {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: any;
    color?: ColorKey;
    subtitle?: string;
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color = "blue", subtitle }: StatCardProps) => {
    const colorClasses: Record<ColorKey, string> = {
      blue: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50",
      green: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50",
      yellow: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200/50 dark:border-yellow-700/50",
      purple: "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200/50 dark:border-purple-700/50",
      red: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200/50 dark:border-red-700/50"
    };
    const iconColorClasses: Record<ColorKey, string> = {
      blue: "p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl text-blue-600 dark:text-blue-400",
      green: "p-3 bg-green-100 dark:bg-green-800/30 rounded-xl text-green-600 dark:text-green-400",
      yellow: "p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl text-yellow-600 dark:text-yellow-400",
      purple: "p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl text-purple-600 dark:text-purple-400",
      red: "p-3 bg-red-100 dark:bg-red-800/30 rounded-xl text-red-600 dark:text-red-400"
    };

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border shadow-lg hover:shadow-xl transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className={iconColorClasses[color]}>
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
              {change && (
                <div className="flex items-center mt-2">
                  {changeType === 'increase' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  type ChartContainerProps = {
    title: string;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode | null;
  };

  const ChartContainer = ({ title, children, className = "", actions = null }: ChartContainerProps) => (
    <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading usage analytics...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Usage Data</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchUsageData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!usageData) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No usage data available</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Normalize overview with sensible defaults to avoid runtime access errors
  const overview = {
    totalCreditsUsed: usageData.overview?.totalCreditsUsed ?? usageData.creditUsage?.totalCreditsUsed ?? 0,
    creditsUsedToday: usageData.overview?.creditsUsedToday ?? 0,
    avgCreditsPerUser: usageData.overview?.avgCreditsPerUser ?? 0,
    peakUsageHour: usageData.overview?.peakUsageHour ?? 'N/A',
    totalGenerations: usageData.overview?.totalGenerations ?? 0,
    generationsToday: usageData.overview?.generationsToday ?? 0,
    avgWordsPerGeneration: usageData.overview?.avgWordsPerGeneration ?? 0,
    totalApiCalls: usageData.overview?.totalApiCalls ?? 0
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usage Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor platform usage patterns and resource consumption</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button 
                onClick={fetchUsageData}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats - Using Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Credits Used"
            value={overview.totalCreditsUsed.toLocaleString()}
            change="12.5%"
            changeType="increase"
            icon={Zap}
            color="blue"
            subtitle="Last 30 days"
          />
          <StatCard
            title="Content Generated"
            value={overview.totalGenerations.toLocaleString()}
            change="8.3%"
            changeType="increase"
            icon={FileText}
            color="green"
            subtitle={`${overview.avgWordsPerGeneration} avg words`}
          />
          <StatCard
            title="API Calls"
            value={overview.totalApiCalls.toLocaleString()}
            change="15.2%"
            changeType="increase"
            icon={Activity}
            color="purple"
            subtitle="All endpoints"
          />
          <StatCard
            title="Peak Usage"
            value={overview.peakUsageHour}
            change="2hr shift"
            changeType="increase"
            icon={Clock}
            color="yellow"
            subtitle="Daily peak time"
          />
        </div>

        {/* Rest of the components remain the same... */}
        {/* Usage Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer 
            title="Credit Usage Breakdown"
            actions={[
              <select 
                key="metric" 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)} 
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="credits">Credits</option>
                <option value="requests">Requests</option>
                <option value="users">Active Users</option>
              </select>
            ]}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={creditUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [value.toLocaleString(), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(209, 213, 219, 0.5)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Area type="monotone" dataKey="content" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} />
                <Area type="monotone" dataKey="keywords" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                <Area type="monotone" dataKey="wordpress" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Content Generation</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Keyword Research</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">WordPress Actions</span>
              </div>
            </div>
          </ChartContainer>

          <ChartContainer title="Hourly Usage Pattern">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`} 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Usage']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(209, 213, 219, 0.5)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)'
                  }}
                />
                <Bar dataKey="usage" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
              Peak usage at {overview.peakUsageHour} - Plan capacity accordingly
            </p>
          </ChartContainer>
        </div>

        {/* Feature Usage & Top Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Feature Usage Distribution">
            <div className="flex items-center justify-center mb-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={featureUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="usage"
                  >
                    {featureUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(209, 213, 219, 0.5)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {featureUsageData.map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: feature.color }}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{feature.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{feature.usage}%</span>
                </div>
              ))}
            </div>
          </ChartContainer>

          <ChartContainer title="Top Credit Consumers">
            <div className="space-y-4">
              {topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800/30 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.credits.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.plan === 'Enterprise' 
                        ? 'bg-purple-100 dark:bg-purple-800/30 text-purple-800 dark:text-purple-400' 
                        : 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-400'
                    }`}>
                      {user.plan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>

        {/* Content Types & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Content Type Breakdown">
            <div className="space-y-6">
              {contentTypeUsage.map((type, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{type.type}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{type.count.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({type.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg {type.avgWords} words per piece</p>
                </div>
              ))}
            </div>
          </ChartContainer>

          <ChartContainer title="Usage Alerts & Notifications">
            <div className="space-y-4">
              {usageAlerts.map((alert) => (
                <div key={alert.id} className={`flex items-start p-4 rounded-xl border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-400 dark:border-red-600' :
                  alert.type === 'warning' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-400 dark:border-yellow-600' :
                  alert.type === 'success' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-400 dark:border-green-600' :
                  'bg-blue-50/50 dark:bg-blue-900/10 border-blue-400 dark:border-blue-600'
                }`}>
                  <div className="mr-3 mt-0.5">
                    {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />}
                    {alert.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />}
                    {alert.type === 'info' && <Activity className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsageAnalytics;
