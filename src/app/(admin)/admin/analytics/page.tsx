'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  Zap, FileText, Users, Clock, Activity, RefreshCw, AlertTriangle,
  BarChart3, TrendingUp, Cpu
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface OverviewData {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  publishedContent: number;
  totalCreditsUsed?: number;
  newUsersToday?: number;
  generationsToday?: number;
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

const ChartBox = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{title}</h3>
    {children}
  </div>
);

const MetricCard = ({
  title, value, sub, icon: Icon, iconBg,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string;
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
  </div>
);

const tooltipStyle = { backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff' };

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

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={load} />;

  const wordsGenerated = data.totalCreditsUsed ?? data.totalWords ?? 0;
  const generationsToday = data.generationsToday ?? data.totalGenerations ?? 0;
  const newUsersToday = data.newUsersToday ?? data.newUsers ?? 0;

  const cards = [
    { title: 'Total Users',     value: (data.totalUsers || 0).toLocaleString(),   sub: `+${newUsersToday} today`,             icon: Users,    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { title: 'Active Users',    value: (data.activeUsers || 0).toLocaleString(),  sub: 'Last 30 days',                         icon: Activity, iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { title: 'Total Content',   value: (data.totalContent || 0).toLocaleString(), sub: `${data.publishedContent || 0} published`, icon: FileText, iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { title: 'Words Generated', value: (wordsGenerated || 0).toLocaleString(),    sub: `${generationsToday} generated today`, icon: Zap,      iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((c, i) => <MetricCard key={i} {...c} />)}
    </div>
  );
};

// ─── Usage Tab (real data only) ───────────────────────────────────────────────

const UsageTab = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={load} />;

  const ov = data.overview || {} as UsageData['overview'];

  const creditUsageData = (data.contentGeneration || []).map(item => {
    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
    return { date: date.toISOString().split('T')[0], words: item.totalWords, count: item.count };
  });

  const userActivityData = (data.userActivity || []).map(item => {
    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
    return { date: date.toISOString().split('T')[0], users: item.activeUsers };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform usage and activity metrics</p>
        <div className="flex items-center gap-3">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={load} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Generations" value={(ov.totalGenerations || 0).toLocaleString()}   sub={`+${ov.generationsToday || 0} today`}                         icon={FileText}  iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <MetricCard title="Words Generated"   value={(ov.totalCreditsUsed || 0).toLocaleString()}   sub={`${(ov.creditsUsedToday || 0).toLocaleString()} today`}        icon={Zap}       iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <MetricCard title="Avg Words/Gen"     value={ov.avgWordsPerGeneration || 0}                 sub={`${Math.round(ov.avgCreditsPerUser || 0)} words/user`}         icon={BarChart3} iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <MetricCard title="Peak Usage Hour"   value={ov.peakUsageHour || '—'}                       sub={`${(ov.totalApiCalls || 0).toLocaleString()} API calls`}       icon={Clock}     iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
      </div>

      {/* Charts */}
      {creditUsageData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartBox title="Daily Words Generated">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={creditUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip labelFormatter={d => new Date(d).toLocaleDateString()} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="words" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Words" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          {userActivityData.length > 0 && (
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
          )}
        </div>
      ) : (
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No usage data for this period.</p>
        </div>
      )}

      {/* Credit stats */}
      {data.creditUsage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Credits Used',    value: (data.creditUsage.totalCreditsUsed || 0).toLocaleString(),                    sub: 'All-time word usage',   icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Avg Credits Remaining', value: Math.round(data.creditUsage.averageCreditsRemaining || 0).toLocaleString(),    sub: 'Per user average',      icon: Activity,   color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Users with Credits',    value: (data.creditUsage.usersWithCredits || 0).toLocaleString(),                     sub: 'Active users',          icon: Users,      color: 'text-green-600 dark:text-green-400' },
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
      )}
    </div>
  );
};

// ─── Performance Tab (real data only) ────────────────────────────────────────

const PerformanceTab = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
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

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={load} />;

  const p = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">System performance and health metrics</p>
        <div className="flex items-center gap-3">
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Avg Response Time" value={`${p.overview?.averageResponseTime || 0}ms`} icon={Clock}    iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <MetricCard title="System Uptime"     value={p.overview?.uptime || '0%'}                  icon={Activity} iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
        <MetricCard title="Throughput"        value={`${p.overview?.throughput || 0}/min`}         icon={Zap}      iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        <MetricCard title="CPU Utilization"   value={`${p.overview?.cpuUtilization || 0}%`}        icon={Cpu}      iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartBox title="API Performance">
          <div className="space-y-3">
            {[
              { label: 'Total Requests',   value: (p.api?.totalRequests || 0).toLocaleString() },
              { label: 'Avg Response',     value: `${p.api?.averageResponseTime || 0}ms` },
              { label: 'Error Rate',       value: `${p.api?.errorRate || 0}%`, highlight: (p.api?.errorRate || 0) < 1 ? 'green' : 'red' },
              { label: 'Active Endpoints', value: p.api?.activeEndpoints || 0 },
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

      <ChartBox title="Resource Usage">
        <div className="space-y-6">
          {[
            { label: 'CPU Usage',          current: p.system?.cpu?.usage || 0,              display: `${p.system?.cpu?.usage || 0}%`,                                          thresholds: [70, 85] },
            { label: 'Memory Usage',       current: p.system?.memory?.percentage || 0,      display: `${p.system?.memory?.used || 0}MB / ${p.system?.memory?.total || 0}MB`,  thresholds: [70, 85] },
            { label: 'Database Response',  current: Math.min(((p.database?.responseTime || 0) / 200) * 100, 100), display: `${p.database?.responseTime || 0}ms`,              thresholds: [25, 50] },
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
                />
              </div>
            </div>
          ))}
        </div>
      </ChartBox>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',    label: 'Overview' },
  { key: 'usage',       label: 'Usage' },
  { key: 'performance', label: 'Performance' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor platform health, usage, and performance</p>
        </div>

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

        {activeTab === 'overview'    && <OverviewTab />}
        {activeTab === 'usage'       && <UsageTab />}
        {activeTab === 'performance' && <PerformanceTab />}
      </div>
    </AdminLayout>
  );
}