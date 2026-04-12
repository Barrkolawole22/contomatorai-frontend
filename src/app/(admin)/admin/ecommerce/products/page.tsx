// frontend/src/app/(admin)/admin/ecommerce/products/page.tsx - FIXED WITH FINANCIAL DATA TRANSFORMATION
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  Settings,
  Copy,
  Download
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  sales: number;
  wordCount: number;
  description: string;
  isPopular?: boolean;
  discountPercentage?: number;
}

interface ProductStats {
  total: number;
  active: number;
  outOfStock: number;
  totalRevenue: number;
}

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
}

const AdminEcommerceProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [statistics, setStatistics] = useState<ProductStats | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both products and financial data
      const productsResponse = await adminAPI.ecommerce.getProducts();
      const financialResponse = await adminAPI.financial.getFinancialOverview('30d');
      
      if (productsResponse.data.success && financialResponse.data.success) {
        const productsData = productsResponse.data.data.products;
        const financialData = financialResponse.data.data;
        
        setFinancialData(financialData);
        
        // Transform products with financial data like overview page does
        const transformedProducts = productsData.map((product: Product) => {
          // Find matching package in financial data
          const packagePerformance = financialData.packagePerformance.find(
            (pkg: any) => pkg.packageName === product.name
          );
          
          return {
            ...product,
            // Use actual sales count from financial data if available
            sales: packagePerformance ? packagePerformance.salesCount : product.sales,
            // Add financial revenue data
            financialRevenue: packagePerformance ? packagePerformance.revenue : product.price * product.sales
          };
        });

        setProducts(transformedProducts);

        // Calculate statistics with financial data
        const totalRevenue = financialData.revenue.total;
        const activeProducts = productsData.filter((p: Product) => p.active).length;
        const outOfStock = productsData.filter((p: Product) => !p.active).length;

        setStatistics({
          total: productsData.length,
          active: activeProducts,
          outOfStock: outOfStock,
          totalRevenue: totalRevenue
        });
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Products fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const getStatusBadge = (active: boolean) => {
    return active 
      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const formatNGN = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredProducts = products.filter(product => {
    const statusMatch = filters.status === '' || 
                       (filters.status === 'active' && product.active) ||
                       (filters.status === 'inactive' && !product.active);
    const searchMatch = filters.search === '' ||
                       product.name.toLowerCase().includes(filters.search.toLowerCase());
    return statusMatch && searchMatch;
  });

  // Get revenue for product - use financial data if available
  const getProductRevenue = (product: any) => {
    return product.financialRevenue || (product.price * product.sales);
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
                Error Loading Products
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your service packages and pricing
              </p>
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
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Using financial data for revenue */}
        {statistics && financialData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Total Products</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.active}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Active Products</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200/50 dark:border-yellow-700/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.outOfStock}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Out of Stock</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                  <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNGN(statistics.totalRevenue)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {financialData.revenue.growth >= 0 ? '+' : ''}{financialData.revenue.growth}% from last month
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products by name..."
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
              <option value="">All Products</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Products Grid - Using financial data for revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(product.active)}`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Word Count</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.wordCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatNGN(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sales</span>
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.sales}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatNGN(getProductRevenue(product))}
                      </span>
                    </div>
                  </div>

                  {product.isPopular && (
                    <div className="flex items-center justify-center pt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Popular
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <button className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button className="flex-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 p-2 rounded-xl transition-all duration-200">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">No products match your current filters.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto">
              <Plus className="w-5 h-5" />
              <span>Add Your First Product</span>
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 group">
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Add Product</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create new service</p>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/admin/ecommerce/orders')}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 group"
            >
              <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">View Orders</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check recent sales</p>
              </div>
            </button>
            
            <button className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200 group">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sales performance</p>
              </div>
            </button>

            <button className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 rounded-xl transition-all duration-200 group">
              <Settings className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Settings</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure pricing</p>
              </div>
            </button>
          </div>
        </div>

        {/* Financial Data Integration Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
              <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Data Integrated</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Revenue data is now sourced from the financial endpoint for accurate reporting. 
                {financialData && ` Current total revenue: ${formatNGN(financialData.revenue.total)} with ${financialData.revenue.growth >= 0 ? '+' : ''}${financialData.revenue.growth}% growth.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEcommerceProductsPage;
