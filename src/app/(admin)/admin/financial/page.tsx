// frontend/src/app/(admin)/admin/financial/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CreditCard
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { any } from 'zod';

interface FinancialData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    currency: string;
  };
  transactions: {
    total: number;
    recent: Array<{
      userName: string;
      userEmail: string;
      packageName: string;
      amount: number;
      currency: string;
      date: string;
      status: string;
    }>;
  };
  packagePerformance: Array<{
    packageId: string;
    packageName: string;
    revenue: number;
    salesCount: number;
  }>;
  charts: {
    revenueTrend: Array<{
      date: string;
      revenue: number;
    }>;
  };
}

const AdminFinancialPage = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [timeframe]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.financial.getFinancialOverview(timeframe);
      
      if (response.data.success) {
        setFinancialData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch financial data');
      }
    } catch (err: any) {
      console.error('Financial data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    setRefreshing(false);
  };

  const formatNGN = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  const MetricCard = ({ title, value, change, changeType, icon: Icon, color = "blue" }: any) => {
    const colorClasses = {
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : changeType === 'decrease' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                ) : null}
                <span className={`text-sm font-medium ${
                  changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 
                  changeType === 'decrease' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {change}
                </span>
                {changeType && <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last month</span>}
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading financial data...</p>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Data</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchFinancialData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!financialData) return null;

  const avgTransactionValue = financialData.transactions.total > 0 
    ? financialData.revenue.total / financialData.transactions.total 
    : 0;

  const avgDailyRevenue = financialData.revenue.thisMonth / 30;

  const mostPopularPackage = financialData.packagePerformance[0];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Revenue analytics and transaction monitoring
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatNGN(financialData.revenue.total)}
            change={null}
            changeType={null}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="This Month"
            value={formatNGN(financialData.revenue.thisMonth)}
            change={`${financialData.revenue.growth >= 0 ? '+' : ''}${financialData.revenue.growth}%`}
            changeType={financialData.revenue.growth >= 0 ? 'increase' : 'decrease'}
            icon={Calendar}
            color="blue"
          />
          <MetricCard
            title="Growth"
            value={`${financialData.revenue.growth >= 0 ? '+' : ''}${financialData.revenue.growth}%`}
            change={`vs ${formatNGN(financialData.revenue.lastMonth)}`}
            changeType={financialData.revenue.growth >= 0 ? 'increase' : 'decrease'}
            icon={financialData.revenue.growth >= 0 ? TrendingUp : TrendingDown}
            color={financialData.revenue.growth >= 0 ? 'green' : 'yellow'}
          />
          <MetricCard
            title="Total Transactions"
            value={financialData.transactions.total.toLocaleString()}
            change={null}
            changeType={null}
            icon={ShoppingCart}
            color="purple"
          />
        </div>

        {/* Section 2: Revenue Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Revenue Trends</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Revenue (₦)</span>
            </div>
          </div>
          
          {financialData.charts.revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={financialData.charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatNGN(value), 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No revenue data for selected timeframe</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Package Performance (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Revenue by Package</h3>
            
            {financialData.packagePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financialData.packagePerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ packageName, percent }) => `${packageName} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {financialData.packagePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px'
                    }}
                    formatter={(value: any) => formatNGN(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No package data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Top Packages List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Top Packages</h3>
            
            {financialData.packagePerformance.length > 0 ? (
              <div className="space-y-4">
                {financialData.packagePerformance.slice(0, 5).map((pkg, index) => (
                  <div key={pkg.packageId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{pkg.packageName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.salesCount} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{formatNGN(pkg.revenue)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNGN(pkg.revenue / pkg.salesCount)}/sale
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No package sales yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Recent Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          
          {financialData.transactions.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {financialData.transactions.recent.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.userName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{transaction.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.packageName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatNGN(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Avg Transaction Value</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNGN(avgTransactionValue)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Per completed transaction</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Avg Daily Revenue</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNGN(avgDailyRevenue)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Based on this month</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Most Popular Package</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {mostPopularPackage ? mostPopularPackage.packageName : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {mostPopularPackage ? `${mostPopularPackage.salesCount} sales` : 'No sales yet'}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinancialPage;
