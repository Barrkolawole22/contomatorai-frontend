// frontend/src/app/(admin)/admin/analytics/performance/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  Activity,
  Server,
  Database,
  Cpu,
  MemoryStick,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Monitor,
  Gauge
} from 'lucide-react';

interface PerformanceData {
  overview: {
    averageResponseTime: number;
    uptime: string;
    errorRate: number;
    throughput: number;
    activeConnections: number;
    peakMemoryUsage: number;
    cpuUtilization: number;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  database: {
    connections: string;
    responseTime: number;
    collections: number;
    dataSize: number;
    indexSize: number;
  };
  api: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    activeEndpoints: number;
  };
}

const AdminPerformancePage = () => {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPerformanceData();
  }, [timeframe]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.analytics.getPerformanceAnalytics(timeframe);
      
      if (response.data.success) {
        setPerformance(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch performance data');
      }
    } catch (err: any) {
      console.error('Performance fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceData();
    setRefreshing(false);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-6">
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
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Error Loading Performance Data
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchPerformanceData}
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

  if (!performance) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No performance data available</h2>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">System performance and health metrics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Response Time */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {performance.overview?.averageResponseTime || 0}ms
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
          </div>

          {/* Uptime */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {performance.overview?.uptime || '0%'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">System Uptime</p>
          </div>

          {/* Throughput */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {performance.overview?.throughput || 0}/min
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Request Throughput</p>
          </div>

          {/* CPU Usage */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Cpu className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {performance.overview?.cpuUtilization || 0}%
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">CPU Utilization</p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API Stats */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">API Performance</h4>
              <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.api?.totalRequests || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.api?.averageResponseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                <span className={`font-semibold ${(performance.api?.errorRate || 0) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {performance.api?.errorRate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Endpoints</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.api?.activeEndpoints || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Database Stats */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Database Health</h4>
              <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Connection</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {performance.database?.connections || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.database?.responseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Collections</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.database?.collections || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Data Size</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.database?.dataSize || 0}MB
                </span>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">System Resources</h4>
              <Gauge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Connections</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.overview?.activeConnections || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Throughput</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.overview?.throughput || 0}/min
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Peak Memory</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {performance.overview?.peakMemoryUsage || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                <span className={`font-semibold ${(performance.overview?.errorRate || 0) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {performance.overview?.errorRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU and Memory Usage */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Resource Usage</h3>
            
            <div className="space-y-6">
              {/* CPU Usage Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU Usage</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {performance.system?.cpu?.usage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      (performance.system?.cpu?.usage || 0) < 70 ? 'bg-green-500' : 
                      (performance.system?.cpu?.usage || 0) < 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${performance.system?.cpu?.usage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory Usage Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory Usage</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {performance.system?.memory?.used || 0}MB / {performance.system?.memory?.total || 0}MB
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      (performance.system?.memory?.percentage || 0) < 70 ? 'bg-blue-500' : 
                      (performance.system?.memory?.percentage || 0) < 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${performance.system?.memory?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Database Response Time */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database Response</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {performance.database?.responseTime || 0}ms
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      (performance.database?.responseTime || 0) < 50 ? 'bg-green-500' : 
                      (performance.database?.responseTime || 0) < 100 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(((performance.database?.responseTime || 0) / 200) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status Summary */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">API Server</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">All endpoints operational</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Healthy</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Database</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connected and responsive</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Healthy</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center space-x-3">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Authentication</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">All services running</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Operational</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Content Generation</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI services active</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPerformancePage;
