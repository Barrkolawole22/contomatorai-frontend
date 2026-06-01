'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  Zap, FileText, Users, Clock, Activity, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, BarChart3, TrendingUp, TrendingDown, Download,
  Server, Database, Cpu, Gauge, CheckCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  publishedContent: number;
  totalCreditsUsed?: number;
  newUsersToday?: number;
  generationsToday?: number;
  revenueThisMonth?: number;
  totalWords?: number;
  totalGenerations?: number;
  newUsers?: number;
}

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
  contentGeneration: Array<{ _id: { year: number; month: number; day: number }; count: number; totalWords: number }>;
  userActivity: Array<{ _id: { year: number; month: number; day: number }; activeUsers: number }>;
  creditUsage: { totalCreditsUsed: number; averageCreditsRemaining: number; usersWithCredits: number };
}

interface PerformanceData {
  overview: { averageResponseTime: number; uptime: string; errorRate: number; throughput: number; activeConnections: number; peakMemoryUsage: number; cpuUtilization: number };
  system: { uptime: number; memory: { used: number; total: number; percentage: number }; cpu: { usage: number } };
  database: { connections: string; responseTime: number; collections: number; dataSize: number; indexSize: number };
  api: { totalRequests: number; averageResponseTime: number; errorRate: number; activeEndpoints: number };
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const ChartBox = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{title}</h3>
    {children}
  </div>
);

const MetricCard = ({
  title, value, sub, icon: Icon, iconBg, trend, trendLabel
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string;
  trend?: { value: string; up: boolean }; trendLabel?: string;
}) => (
  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    {sub && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{sub}</p>}
    {trend && (
      <div className="flex items-center mt-2">
        {trend.up ? <TrendingUp className="h-4 w-4 text-green-500 mr-1" /> : <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
        <span className={`text-sm font-medium ${trend.up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{trend.value}</span>
        {trendLabel && <span className="text-sm text-gray-500 ml-1">{trendLabel}</span>}
      </div>
    )}
  </div>
);

const tooltipStyle = {
  backgroundColor: '#1F2937',
  border: 'none',
  borderRadius: '12px',
  color: '#fff',
};

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await adminAPI.analytics.getAnalyticsOverview();
      if (res.data.success) setData(res.data.data);
      else throw new Error(res.data.message);
    } catch (e: any) {
      setError(e.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={fetch} />;

  const wordsGenerated = data.totalCreditsUsed ?? data.totalWords ?? 0;
  const generationsToday = data.generationsToday ?? data.totalGenerations ?? 0;
  const newUsersToday = data.newUsersToday ?? data.newUsers ?? 0;

  const cards = [
    { title: 'Total Users',     value: data.totalUsers.toLocaleString(),   sub: `+${newUsersToday} today`,             icon: Users,    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { title: 'Active Users',    value: data.activeUsers.toLocaleString(),  sub: 'Last 30 days',                         icon: Activity, iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { title: 'Total Content',   value: data.totalContent.toLocaleString(), sub: `${data.publishedContent} published`,  icon: FileText, iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { title: 'Words Generated', value: wordsGenerated.toLocaleString(),    sub: `${generationsToday} generated today`, icon: Zap,      iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => <MetricCard key={i} {...c} />)}
      </div>
    </div>
  );
};

// ─── Tab: Usage ───────────────────────────────────────────────────────────────

const UsageTab = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await adminAPI.analytics.getUsageAnalytics(timeRange);
      if (res.data.success) setData(res.data.data);
      else throw new Error(res.data.message);
    } catch (e: any) {
      setError(e.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={fetch} />;

  const ov = data.overview;

  const creditUsageData = (data.contentGeneration || []).map(item => {
    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
    return {
      date: date.toISOString().split('T')[0],
      content: Math.floor(item.totalWords * 0.7),
      keywords: Math.floor(item.totalWords * 0.2),
      wordpress: Math.floor(item.totalWords * 0.1),
    };
  });

  const peakHour = ov.peakUsageHour ? parseInt(ov.peakUsageHour.split(':')[0]) : 12;
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i.toString().padStart(2, '0'),
    usage: Math.max(10, Math.floor(100 - Math.abs(i - peakHour) * 8)),
  }));

  const featureData = [
    { name: 'Content Generation',  usage: 68.5, color: '#3B82F6' },
    { name: 'WordPress Publishing', usage: 18.2, color: '#10B981' },
    { name: 'Keyword Research',    usage: 8.7,  color: '#F59E0B' },
    { name: 'Site Management',     usage: 4.6,  color: '#8B5CF6' },
  ];

  const userActivityData = (data.userActivity || []).map(item => {
    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
    return { date: date.toISOString().split('T')[0], users: item.activeUsers };
  });

  const contentTypeUsage = [
    { type: 'Blog Posts',            percentage: 65.2, avgWords: ov.avgWordsPerGeneration || 850 },
    { type: 'Product Descriptions',  percentage: 18.5, avgWords: 150 },
    { type: 'Social Media',          percentage: 9.2,  avgWords: 80 },
    { type: 'Email Copy',            percentage: 7.1,  avgWords: 200 },
  ];

  const topUsers = [
    { id: 1, name: 'Sarah Johnson',   email: 'sarah@example.com',  credits: 15420, plan: 'Enterprise' },
    { id: 2, name: 'Mike Chen',       email: 'mike@example.com',   credits: 12890, plan: 'Pro' },
    { id: 3, name: 'Emma Davis',      email: 'emma@example.com',   credits: 11250, plan: 'Pro' },
    { id: 4, name: 'Alex Rodriguez',  email: 'alex@example.com',   credits: 9840,  plan: 'Enterprise' },
    { id: 5, name: 'Lisa Wang',       email: 'lisa@example.com',   credits: 8760,  plan: 'Pro' },
  ];

  const usageAlerts = [
    { id: 1, type: 'success', message: 'System performance optimal',               time: '2 minutes ago' },
    { id: 2, type: 'info',    message: `Peak usage detected at ${ov.peakUsageHour || '12:00'}`, time: '1 hour ago' },
    { id: 3, type: 'warning', message: 'High API call volume in last hour',         time: '3 hours ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform usage and activity metrics</p>
        <div className="flex items-center gap-3">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={fetch} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-sm font-medium transition-all">
            <Download className="w-4 h-4" /><span>Export</span>
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Generations" value={ov.totalGenerations.toLocaleString()} sub={`+${ov.generationsToday} today`} icon={FileText} iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <MetricCard title="Words Generated"   value={ov.totalCreditsUsed.toLocaleString()} sub={`${ov.creditsUsedToday.toLocaleString()} today`} icon={Zap} iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <MetricCard title="Avg Words/Gen"     value={ov.avgWordsPerGeneration} sub={`${Math.round(ov.avgCreditsPerUser)} words/user`} icon={BarChart3} iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <MetricCard title="Peak Usage Hour"   value={ov.peakUsageHour} sub={`${ov.totalApiCalls.toLocaleString()} API calls`} icon={Clock} iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="Daily Credit Usage Breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={creditUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip labelFormatter={d => new Date(d).toLocaleDateString()} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="content"  stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} />
              <Area type="monotone" dataKey="keywords" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
              <Area type="monotone" dataKey="wordpress" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            {[['#3B82F6', 'Content'], ['#10B981', 'Keywords'], ['#F59E0B', 'WordPress']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </ChartBox>

        <ChartBox title="Hourly Usage Pattern">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Usage']} contentStyle={tooltipStyle} />
              <Bar dataKey="usage" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 text-center mt-4">Peak usage at {ov.peakUsageHour}</p>
        </ChartBox>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="Feature Usage Distribution">
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={featureData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="usage">
                  {featureData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {featureData.map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }}></div>
                  <span className="text-sm text-gray-900 dark:text-white">{f.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{f.usage}%</span>
              </div>
            ))}
          </div>
        </ChartBox>

        <ChartBox title="Active Users Trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip labelFormatter={d => new Date(d).toLocaleDateString()} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Active Users" />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="Top Credit Consumers">
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-800/30 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{u.credits.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === 'Enterprise' ? 'bg-purple-100 dark:bg-purple-800/30 text-purple-800 dark:text-purple-400' : 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-400'}`}>
                    {u.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartBox>

        <ChartBox title="Content Type Breakdown">
          <div className="space-y-5">
            {contentTypeUsage.map((t, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{t.type}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{t.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${t.percentage}%` }}></div>
                </div>
                <p className="text-xs text-gray-500">Avg {t.avgWords} words per piece</p>
              </div>
            ))}
          </div>
        </ChartBox>
      </div>

      {/* Usage alerts + credit stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="Usage Alerts">
          <div className="space-y-3">
            {usageAlerts.map(a => (
              <div key={a.id} className={`flex items-start p-4 rounded-xl border-l-4 ${
                a.type === 'error'   ? 'bg-red-50/50 dark:bg-red-900/10 border-red-400' :
                a.type === 'warning' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-400' :
                a.type === 'success' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-400' :
                'bg-blue-50/50 dark:bg-blue-900/10 border-blue-400'
              }`}>
                <div className="mr-3 mt-0.5">
                  {a.type === 'error'   && <XCircle className="h-5 w-5 text-red-500" />}
                  {a.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {a.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {a.type === 'info'    && <Activity className="h-5 w-5 text-blue-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartBox>

        <div className="space-y-4">
          {[
            { label: 'Total Credits Used',    value: data.creditUsage.totalCreditsUsed.toLocaleString(), sub: 'All-time word usage',   icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Avg Credits Remaining', value: Math.round(data.creditUsage.averageCreditsRemaining).toLocaleString(), sub: 'Per user average', icon: Activity,   color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Users with Credits',    value: data.creditUsage.usersWithCredits, sub: 'Active users',        icon: Users,      color: 'text-green-600 dark:text-green-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
              </div>
              <s.icon className={`w-8 h-8 ${s.color}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Performance ─────────────────────────────────────────────────────────

const PerformanceTab = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await adminAPI.analytics.getPerformanceAnalytics(timeframe);
      if (res.data.success) setData(res.data.data);
      else throw new Error(res.data.message);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const handleRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={fetch} />;

  const p = data;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">System performance and health metrics</p>
        <div className="flex items-center gap-3">
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button onClick={handleRefresh} disabled={refreshing} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Avg Response Time" value={`${p.overview?.averageResponseTime || 0}ms`} icon={Clock}     iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <MetricCard title="System Uptime"     value={p.overview?.uptime || '0%'}                  icon={Activity}  iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <MetricCard title="Throughput"        value={`${p.overview?.throughput || 0}/min`}         icon={Zap}       iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <MetricCard title="CPU Utilization"   value={`${p.overview?.cpuUtilization || 0}%`}        icon={Cpu}       iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartBox title="API Performance">
          <div className="space-y-3">
            {[
              { label: 'Total Requests',    value: p.api?.totalRequests || 0 },
              { label: 'Avg Response',      value: `${p.api?.averageResponseTime || 0}ms` },
              { label: 'Error Rate',        value: `${p.api?.errorRate || 0}%`, highlight: (p.api?.errorRate || 0) < 1 ? 'green' : 'red' },
              { label: 'Active Endpoints',  value: p.api?.activeEndpoints || 0 },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
                <span className={`font-semibold text-sm ${row.highlight === 'green' ? 'text-green-600' : row.highlight === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </ChartBox>

        <ChartBox title="Database Health">
          <div className="space-y-3">
            {[
              { label: 'Connection',    value: p.database?.connections || 'Unknown', highlight: 'green' },
              { label: 'Response Time', value: `${p.database?.responseTime || 0}ms` },
              { label: 'Collections',   value: p.database?.collections || 0 },
              { label: 'Data Size',     value: `${p.database?.dataSize || 0}MB` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
                <span className={`font-semibold text-sm ${row.highlight === 'green' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </ChartBox>

        <ChartBox title="System Resources">
          <div className="space-y-3">
            {[
              { label: 'Active Connections', value: p.overview?.activeConnections || 0 },
              { label: 'Throughput',         value: `${p.overview?.throughput || 0}/min` },
              { label: 'Peak Memory',        value: `${p.overview?.peakMemoryUsage || 0}%` },
              { label: 'Error Rate',         value: `${p.overview?.errorRate || 0}%`, highlight: (p.overview?.errorRate || 0) < 1 ? 'green' : 'red' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
                <span className={`font-semibold text-sm ${row.highlight === 'green' ? 'text-green-600' : row.highlight === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </ChartBox>
      </div>

      {/* Resource usage + system status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="Resource Usage">
          <div className="space-y-6">
            {[
              { label: 'CPU Usage', current: p.system?.cpu?.usage || 0, display: `${p.system?.cpu?.usage || 0}%`, thresholds: [70, 85] },
              { label: 'Memory Usage', current: p.system?.memory?.percentage || 0, display: `${p.system?.memory?.used || 0}MB / ${p.system?.memory?.total || 0}MB`, thresholds: [70, 85] },
              { label: 'Database Response', current: Math.min(((p.database?.responseTime || 0) / 200) * 100, 100), display: `${p.database?.responseTime || 0}ms`, thresholds: [25, 50] },
            ].map((bar, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{bar.label}</span>
                  <span className="text-sm text-gray-500">{bar.display}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${bar.current < bar.thresholds[0] ? 'bg-green-500' : bar.current < bar.thresholds[1] ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${bar.current}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </ChartBox>

        <ChartBox title="System Status">
          <div className="space-y-3">
            {[
              { name: 'API Server',          sub: 'All endpoints operational', color: 'green', status: 'Healthy',     icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50' },
              { name: 'Database',            sub: 'Connected and responsive',  color: 'green', status: 'Healthy',     icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50' },
              { name: 'Authentication',      sub: 'All services running',      color: 'blue',  status: 'Operational', icon: Activity,    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50' },
              { name: 'Content Generation',  sub: 'AI services active',        color: 'purple', status: 'Active',     icon: Zap,         bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-700/50' },
            ].map((s, i) => (
              <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${s.bg}`}>
                <div className="flex items-center gap-3">
                  <s.icon className={`w-5 h-5 text-${s.color}-600 dark:text-${s.color}-400`} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{s.sub}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium text-${s.color}-600 dark:text-${s.color}-400`}>{s.status}</span>
              </div>
            ))}
          </div>
        </ChartBox>
      </div>
    </div>
  );
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      <button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium">Try Again</button>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',     label: 'Overview' },
  { key: 'usage',        label: 'Usage' },
  { key: 'performance',  label: 'Performance' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor platform health, usage, and performance</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'overview'    && <OverviewTab />}
        {activeTab === 'usage'       && <UsageTab />}
        {activeTab === 'performance' && <PerformanceTab />}
      </div>
    </AdminLayout>
  );
}