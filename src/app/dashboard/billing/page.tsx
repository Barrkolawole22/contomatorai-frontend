'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { billingAPI } from '@/lib/api';
import {
  CreditCard,
  Zap,
  Check,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Package,
  Clock,
  Download,
  ExternalLink
} from 'lucide-react';

interface WordPackage {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  price: number;
  formattedPrice: string;
  pricePerWord: number;
  currency: string;
  isPopular?: boolean;
  features: string[];
  validityDays?: number;
  discountPercentage?: number;
}

interface BillingInfo {
  wordCredits: number;
  totalWordsUsed: number;
  currentMonthUsage: number;
  usageStats: {
    daily: { totalWords: number };
    weekly: { totalWords: number };
    monthly: { totalWords: number };
  };
  purchaseHistory: Array<{
    id: string;
    packageName: string;
    wordsIncluded: number;
    amountPaid: number;
    currency: string;
    purchaseDate: string;
    formattedAmount: string;
  }>;
  needsRefill: boolean;
}

interface UsageAnalytics {
  chartData: Array<{
    date: string;
    words: number;
  }>;
  totalWords: number;
  currentCredits: number;
  totalWordsUsed: number;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<WordPackage[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'packages' | 'usage' | 'history'>('packages');

  useEffect(() => {
    loadBillingData();
  }, []);

  // Handle payment verification on return from Paystack
  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [packagesResponse, billingResponse, analyticsResponse] = await Promise.all([
        billingAPI.getWordPackages(),
        billingAPI.getBillingInfo(),
        billingAPI.getUsageAnalytics('month')
      ]);

      if (packagesResponse.data?.success) {
        setPackages(packagesResponse.data.data);
      }
      if (billingResponse.data?.success) {
        setBillingInfo(billingResponse.data.data);
      }
      if (analyticsResponse.data?.success) {
        setUsageAnalytics(analyticsResponse.data.data);
      }

    } catch (err: any) {
      console.error('Error loading billing data:', err);
      setError(err.response?.data?.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setLoading(true);
      const response = await billingAPI.verifyTransaction({ reference });

      if (response.data?.success) {
        await refreshUser();
        await loadBillingData();
        alert(`✅ Payment successful! ${response.data.data.wordCreditsAdded.toLocaleString()} word credits added to your account.`);
        // Remove reference from URL
        router.replace('/billing');
      } else {
        setError(response.data?.message || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      setError(null);

      // Initialize Paystack transaction
      const response = await billingAPI.initializeTransaction({ packageId });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to initialize payment');
      }

      // Redirect to Paystack checkout
      window.location.href = response.data.data.authorizationUrl;

    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate purchase');
      setPurchasing(null);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const getUsagePercentage = () => {
    if (!billingInfo) return 0;
    const total = billingInfo.totalWordsUsed + billingInfo.wordCredits;
    return total > 0 ? (billingInfo.totalWordsUsed / total) * 100 : 0;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600 dark:text-gray-400">Loading billing information...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Word Credits & Billing</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your word credits and track your content generation usage
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'packages'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Word Packages
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'usage'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Usage Analytics
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Purchase History
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Credits Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(billingInfo?.wordCredits || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Available Words</div>
              {billingInfo?.needsRefill && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Low credits - consider refilling
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(billingInfo?.totalWordsUsed || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Words Used</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(billingInfo?.currentMonthUsage || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₦{((billingInfo?.totalWordsUsed || 0) * 0.6).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Equivalent Cost</div>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Credit Usage</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getUsagePercentage().toFixed(1)}% used
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 relative ${
                  pkg.isPopular 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {pkg.formattedPrice}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {formatNumber(pkg.wordCount)} words
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    ₦{(pkg.pricePerWord * 1000).toFixed(2)} per 1K words
                  </p>
                  {pkg.discountPercentage && (
                    <div className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-xs font-medium mt-2">
                      {pkg.discountPercentage}% savings
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {pkg.description}
                  </p>
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing === pkg.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    pkg.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                      : 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400'
                  }`}
                >
                  {purchasing === pkg.id ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase Credits
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'usage' && usageAnalytics && (
          <div className="space-y-6">
            {/* Usage Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Word Usage (Last 7 Days)
              </h3>
              <div className="relative">
                {(() => {
                  // Get last 7 days
                  const last7Days = [];
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateKey = date.toISOString().split('T')[0];
                    
                    // Find matching data
                    const dataPoint = usageAnalytics.chartData.find(d => 
                      d.date.split('T')[0] === dateKey
                    );
                    
                    last7Days.push({
                      date: dateKey,
                      words: dataPoint?.words || 0,
                      displayDate: date
                    });
                  }

                  // Calculate Y-axis scale
                  const maxWords = Math.max(...last7Days.map(d => d.words), 100);
                  const scales = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
                  const maxScale = scales.find(s => s >= maxWords) || Math.ceil(maxWords / 1000) * 1000;
                  const yAxisLabels = [];
                  
                  if (maxScale <= 1000) {
                    yAxisLabels.push(0, 100, 500, 1000);
                  } else if (maxScale <= 5000) {
                    yAxisLabels.push(0, 1000, 2000, 5000);
                  } else if (maxScale <= 10000) {
                    yAxisLabels.push(0, 2000, 5000, 10000);
                  } else {
                    const step = Math.ceil(maxScale / 4 / 1000) * 1000;
                    for (let i = 0; i <= 4; i++) {
                      yAxisLabels.push(i * step);
                    }
                  }

                  return (
                    <>
                      {/* Chart Area */}
                      <div className="flex gap-4">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between h-64 py-2">
                          {[...yAxisLabels].reverse().map((label, idx) => (
                            <div key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                              {label.toLocaleString()}
                            </div>
                          ))}
                        </div>

                        {/* Chart */}
                        <div className="flex-1 relative">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between">
                            {yAxisLabels.map((_, idx) => (
                              <div 
                                key={idx} 
                                className="border-t border-gray-200 dark:border-gray-700"
                              />
                            ))}
                          </div>

                          {/* Bars */}
                          <div className="relative h-64 flex items-end justify-between gap-2 px-2">
                            {last7Days.map((data, index) => {
                              const barHeightPx = data.words > 0 
                                ? Math.max((data.words / maxScale) * 256, 4) // 256px = h-64
                                : 0;
                              
                              return (
                                <div 
                                  key={index} 
                                  className="flex-1 flex flex-col items-center justify-end"
                                  style={{ minWidth: '40px' }}
                                >
                                  {data.words > 0 && (
                                    <div className="text-xs font-semibold text-blue-600 mb-1">
                                      {data.words.toLocaleString()}
                                    </div>
                                  )}
                                  <div
                                    className={`w-full rounded-t transition-all duration-300 ${
                                      data.words > 0 
                                        ? 'bg-blue-500 hover:bg-blue-700 cursor-pointer' 
                                        : 'bg-transparent'
                                    }`}
                                    style={{ 
                                      height: `${barHeightPx}px`
                                    }}
                                    title={`${data.displayDate.toLocaleDateString()}: ${data.words.toLocaleString()} words`}
                                  />
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                                    {data.displayDate.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* X-axis label */}
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                        Last 7 Days
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total words this month: <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(usageAnalytics.totalWords)}</span>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Weekly Usage
                </h4>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatNumber(billingInfo?.usageStats.weekly.totalWords || 0)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">words this week</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Daily Average
                </h4>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatNumber(Math.round((billingInfo?.usageStats.monthly.totalWords || 0) / 30))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">words per day</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cost Efficiency
                </h4>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  ₦{billingInfo?.totalWordsUsed ? 
                    ((billingInfo.totalWordsUsed * 0.6) / (billingInfo.totalWordsUsed / 1000)).toFixed(2)
                    : '0.00'
                  }
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">per 1K words</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && billingInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Purchase History
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your recent word credit purchases
              </p>
            </div>

            {billingInfo.purchaseHistory.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No purchases yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your word credit purchase history will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Word Packages
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Words
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {billingInfo.purchaseHistory.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {purchase.packageName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatNumber(purchase.wordsIncluded)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {purchase.currency} {purchase.formattedAmount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
