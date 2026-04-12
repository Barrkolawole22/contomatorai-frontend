'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import axios from 'axios';
import {
  Activity,
  Server,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  HardDrive,
  Monitor,
  Clock,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader,
  Info,
  BarChart3
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type TabType = 'health' | 'monitoring' | 'logs';

interface SystemHealth {
  overallStatus: string;
  systemMetrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: string;
    };
    cpu: {
      percentage: string;
    };
    disk?: {
      total: number;
      used: number;
      percentage: number;
    };
  };
  databaseMetrics: {
    connectionStatus: string;
    collections: {
      users: number;
      content: number;
      sites: number;
    };
  };
  serviceStatus: Array<{
    name: string;
    status: string;
    uptime: string;
    responseTime: string;
  }>;
  performanceMetrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: string;
    concurrentUsers: number;
  };
  timestamp: string;
}

interface MonitoringData {
  cpuUsageHistory: Array<{ timestamp: string; usage: number }>;
  memoryUsageHistory: Array<{ timestamp: string; usage: number }>;
  requestMetrics: {
    totalRequests: number;
    successfulRequests: number;
    errorRequests: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: string;
  };
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
  }>;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  module: string;
}

const AdminSystemPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('health');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Health data
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  
  // Monitoring data
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  
  // Logs data
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logLevel, setLogLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab, timeRange, logLevel]);

  const fetchData = async () => {
    try {
      setError(null);
      
      switch (activeTab) {
        case 'health':
          const healthRes = await axios.get(`${API_BASE}/admin/system/health`, getAuthHeaders());
          if (healthRes.data.success) setHealthData(healthRes.data.data);
          break;
          
        case 'monitoring':
          const monitoringRes = await axios.get(`${API_BASE}/admin/system/monitoring?timeRange=${timeRange}`, getAuthHeaders());
          if (monitoringRes.data.success) setMonitoringData(monitoringRes.data.data);
          break;
          
        case 'logs':
          const logsRes = await axios.get(`${API_BASE}/admin/system/logs?level=${logLevel}&limit=100`, getAuthHeaders());
          if (logsRes.data.success) setLogs(logsRes.data.data.logs || []);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleExportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Message', 'Module'],
      ...logs.map(log => [log.timestamp, log.level, log.message, log.module])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return variants[status as keyof typeof variants] || variants.critical;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  if (loading && !healthData && !monitoringData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading system data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !healthData && !monitoringData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl">
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor health, performance, and logs</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'health', label: 'System Health', icon: Activity },
            { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
            { id: 'logs', label: 'Logs', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Health Tab */}
        {activeTab === 'health' && healthData && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-4">
                {getStatusIcon(healthData.overallStatus)}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Overall Status</h2>
                  <span className={`inline-flex px-3 py-1 rounded-xl text-sm font-medium ${getStatusBadge(healthData.overallStatus)}`}>
                    {healthData.overallStatus.toUpperCase()}
                  </span>
                </div>
                <div className="ml-auto text-right text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                    <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatUptime(healthData.systemMetrics.uptime)}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Uptime</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                    <HardDrive className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{healthData.systemMetrics.memory.percentage}%</h3>
                    <p className="text-gray-600 dark:text-gray-400">Memory</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                    <Cpu className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{healthData.systemMetrics.cpu.percentage}%</h3>
                    <p className="text-gray-600 dark:text-gray-400">CPU</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
                    <Database className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{healthData.databaseMetrics.collections.users + healthData.databaseMetrics.collections.content + healthData.databaseMetrics.collections.sites}</h3>
                    <p className="text-gray-600 dark:text-gray-400">DB Records</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Status</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {healthData.serviceStatus.map((service, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{service.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Uptime: {service.uptime}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{service.responseTime}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Response</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && monitoringData && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Requests</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{monitoringData.requestMetrics.totalRequests.toLocaleString()}</div>
                <div className="text-sm text-green-600 mt-1">+8.2% from last period</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Error Rate</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{monitoringData.errorMetrics.errorRate}%</div>
                <div className="text-sm text-red-600 mt-1">{monitoringData.errorMetrics.totalErrors} errors</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Success Rate</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {((monitoringData.requestMetrics.successfulRequests / monitoringData.requestMetrics.totalRequests) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-green-600 mt-1">Healthy</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Failed Requests</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{monitoringData.requestMetrics.errorRequests}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Need attention</div>
              </div>
            </div>

            {/* Alerts */}
            {monitoringData.alerts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Alerts</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {monitoringData.alerts.map(alert => (
                    <div key={alert.id} className="p-4 flex items-center space-x-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{alert.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{alert.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-64"
                  />
                </div>
                
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>

                <button
                  onClick={handleExportLogs}
                  className="ml-auto flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Logs ({filteredLogs.length})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Module</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            log.level === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            log.level === 'warn' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            log.level === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.module}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSystemPage;
