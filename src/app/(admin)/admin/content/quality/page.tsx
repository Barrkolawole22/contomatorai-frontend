// frontend/src/app/(admin)/admin/content/quality/page.tsx - CORRECTED API INTEGRATION
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminAPI } from '@/lib/adminAPI';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Target,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Edit,
  Search
} from 'lucide-react';

interface QualityData {
  qualityDistribution: Array<{
    _id: number | string;
    count: number;
    avgWordCount?: number;
  }>;
  seoDistribution: Array<{
    _id: number | string;
    count: number;
  }>;
  lowQualityContent: Array<{
    _id: string;
    title: string;
    qualityScore: number;
    seoScore: number;
    wordCount: number;
    userId: string;
    createdAt: string;
  }>;
  topPerformers: Array<{
    _id: string;
    title: string;
    qualityScore: number;
    seoScore: number;
    views: number;
    userId: string;
  }>;
}

const AdminContentQualityPage = () => {
  const router = useRouter();
  const [qualityData, setQualityData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the correct API endpoint that matches the backend route
      const response = await adminAPI.content.getContentQuality();
      
      if (response.data.success) {
        setQualityData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch content quality data');
      }
    } catch (err: any) {
      console.error('Content quality fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch content quality data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQualityData();
    setRefreshing(false);
  };

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  const getQualityLabel = (scoreRange: string | number) => {
    if (typeof scoreRange === 'string') {
      if (scoreRange === 'unscored') return 'Unscored';
      return scoreRange;
    }
    
    if (scoreRange < 20) return 'Very Poor (0-19)';
    if (scoreRange < 40) return 'Poor (20-39)';
    if (scoreRange < 60) return 'Fair (40-59)';
    if (scoreRange < 80) return 'Good (60-79)';
    return 'Excellent (80-100)';
  };

  const getQualityColor = (score: number) => {
    if (score < 40) return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    if (score < 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (score < 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
    return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-6">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                Error Loading Quality Data
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchQualityData}
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Quality Analysis</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive quality metrics and content performance insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/content')}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Content Overview</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="flex border-b border-gray-200/50 dark:border-gray-700/50">
            {[
              { id: 'overview', label: 'Quality Overview', icon: BarChart3 },
              { id: 'distribution', label: 'Score Distribution', icon: Target },
              { id: 'performers', label: 'Top Performers', icon: Award },
              { id: 'improvements', label: 'Needs Improvement', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                    selectedTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {qualityData && (
          <>
            {/* Quality Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Quality Distribution Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quality Score Distribution</h3>
                    
                    {qualityData.qualityDistribution && qualityData.qualityDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={qualityData.qualityDistribution}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="_id" 
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => getQualityLabel(value)}
                          />
                          <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                            }}
                            labelFormatter={(value) => getQualityLabel(value)}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No quality score data available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">SEO Score Distribution</h3>
                    
                    {qualityData.seoDistribution && qualityData.seoDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={qualityData.seoDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ _id, percent }) => `${getQualityLabel(_id)} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {qualityData.seoDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No SEO score data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quality Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-xl">
                        <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {qualityData.topPerformers?.length || 0}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">High Quality</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200/50 dark:border-yellow-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded-xl">
                        <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {qualityData.lowQualityContent?.length || 0}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">Needs Improvement</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl">
                        <Star className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {qualityData.qualityDistribution ? 
                            Math.round(qualityData.qualityDistribution.reduce((acc, item) => acc + (item._id as number * item.count), 0) / 
                            qualityData.qualityDistribution.reduce((acc, item) => acc + item.count, 0) || 0) : 0}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">Avg Quality Score</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {qualityData.seoDistribution ? 
                            Math.round(qualityData.seoDistribution.reduce((acc, item) => acc + (item._id as number * item.count), 0) / 
                            qualityData.seoDistribution.reduce((acc, item) => acc + item.count, 0) || 0) : 0}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">Avg SEO Score</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Performers Tab */}
            {selectedTab === 'performers' && (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Top Performing Content</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Content with highest quality and SEO scores</p>
                </div>
                
                {qualityData.topPerformers && qualityData.topPerformers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Content
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quality Score
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            SEO Score
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                        {qualityData.topPerformers.map((content) => (
                          <tr key={content._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {content.title}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {content._id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getQualityColor(content.qualityScore)}`}>
                                {content.qualityScore}/100
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getQualityColor(content.seoScore)}`}>
                                {content.seoScore}/100
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <Eye className="w-4 h-4 text-gray-400 mr-2" />
                                {content.views.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => router.push(`/admin/content/${content._id}`)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                                  title="Edit Content"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No top performers yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">No content with high quality scores found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Needs Improvement Tab */}
            {selectedTab === 'improvements' && (
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Content Needing Improvement</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Content with low quality scores that need attention</p>
                </div>
                
                {qualityData.lowQualityContent && qualityData.lowQualityContent.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                      <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Content
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quality Score
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            SEO Score
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Word Count
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                        {qualityData.lowQualityContent.map((content) => (
                          <tr key={content._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {content.title}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {content._id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getQualityColor(content.qualityScore)}`}>
                                {content.qualityScore}/100
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getQualityColor(content.seoScore)}`}>
                                {content.seoScore}/100
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {content.wordCount} words
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(content.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => router.push(`/admin/content/${content._id}`)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                                  title="Edit Content"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All content looks good!</h3>
                    <p className="text-gray-500 dark:text-gray-400">No content with low quality scores found.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContentQualityPage;
