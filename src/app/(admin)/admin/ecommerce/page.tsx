// frontend/src/app/(admin)/admin/ecommerce/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  CreditCard,
  Calendar,
  Eye,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';

interface EcommerceData {
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
    processing: number;
    cancelled: number;
    refunded: number;
  };
  products: {
    total: number;
    active: number;
  };
  recentOrders: any[];
  topProducts: {
    name: string;
    sales: number;
    revenue: number;
    wordCount?: number;
  }[];
}

const AdminEcommercePage = () => {
  const router = useRouter();
  const [ecommerceData, setEcommerceData] = useState<EcommerceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchEcommerceData();
  }, [dateRange]);

  const fetchEcommerceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.financial.getFinancialOverview(dateRange);
      
      if (response.data.success) {
        const financialData = response.data.data;
        
        // Transform financial data to ecommerce structure
        const transactions = financialData.transactions.recent || [];
        
        setEcommerceData({
          orders: {
            total: financialData.transactions.total,
            completed: transactions.filter((t: any) => t.status === 'completed').length,
            pending: transactions.filter((t: any) => t.status === 'pending').length,
            processing: transactions.filter((t: any) => t.status === 'processing').length,
            cancelled: transactions.filter((t: any) => t.status === 'cancelled').length,
            refunded: transactions.filter((t: any) => t.status === 'refunded').length,
            revenue: financialData.revenue.total
          },
          products: {
            total: 5, // Static for now
            active: 5
          },
          recentOrders: transactions.slice(0, 5),
          topProducts: transactions
            .reduce((acc: any[], curr: any) => {
              const existing = acc.find(p => p.name === curr.packageName);
              if (existing) {
                existing.sales += 1;
                existing.revenue += curr.amount;
              } else {
                acc.push({
                  name: curr.packageName,
                  sales: 1,
                  revenue: curr.amount,
                  wordCount: 1500
                });
              }
              return acc;
            }, [])
            .sort((a: any, b: any) => b.revenue - a.revenue)
            .slice(0, 5)
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error('E-commerce fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch e-commerce data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEcommerceData();
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
                Error Loading E-commerce Data
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchEcommerceData}
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">E-commerce Overview</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitor orders, products, and revenue performance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => router.push('/admin/ecommerce/orders')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Eye className="w-5 h-5" />
                <span>View Orders</span>
              </button>
            </div>
          </div>
        </div>

        {ecommerceData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                    <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{ecommerceData.orders.total}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Total Orders</p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        {ecommerceData.orders.pending} pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNGN(ecommerceData.orders.revenue)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 dark:text-green-400">From all orders</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                    <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{ecommerceData.products.total}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Total Products</p>
                    <div className="flex items-center mt-1">
                      <Package className="w-4 h-4 text-purple-500 mr-1" />
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {ecommerceData.products.active} active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200/50 dark:border-yellow-700/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{ecommerceData.orders.completed}</h3>
                    <p className="text-gray-600 dark:text-gray-400">Completed Orders</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">This period</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/admin/ecommerce/orders')}
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 group"
                >
                  <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Manage Orders</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View and process orders</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
                
                <button
                  onClick={() => router.push('/admin/ecommerce/products')}
                  className="flex items-center p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 group"
                >
                  <Package className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Product Catalog</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage products & pricing</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400 ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
                
                <button
                  onClick={() => router.push('/admin/financial/revenue')}
                  className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200 group"
                >
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Revenue Analytics</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Detailed financial reports</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-purple-600 dark:text-purple-400 ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top Performing Products</h2>
                <button
                  onClick={() => router.push('/admin/ecommerce/products')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              {ecommerceData.topProducts && ecommerceData.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {ecommerceData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {product.wordCount?.toLocaleString()} words • {product.sales} sales
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatNGN(product.revenue)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No product sales data available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEcommercePage;
