'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { dashboardAPI } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import the layout component
import {
  FileText,
  Globe,
  Search,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  Target,
  Bookmark,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  totalKeywords: number;
  totalSites: number;
}

interface RecentItem {
  id: string;
  title: string;
  type: 'article' | 'keyword' | 'site';
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    totalKeywords: 0,
    totalSites: 0
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Try to load dashboard data
      try {
        const response = await dashboardAPI.getAllData();
        
        if (response.data.success) {
          const data = response.data.data;
          
          setStats({
            totalArticles: data.content?.data?.length || 0,
            publishedArticles: data.content?.data?.filter((item: any) => item.status === 'published').length || 0,
            totalKeywords: data.keywords?.data?.length || 0,
            totalSites: data.sites?.data?.length || 0
          });

          // Set recent items
          const recent: RecentItem[] = [
            ...(data.content?.data || []).slice(0, 3).map((item: any) => ({
              id: item.id,
              title: item.title || 'Untitled Article',
              type: 'article' as const,
              status: item.status || 'draft',
              createdAt: item.createdAt || new Date().toISOString()
            })),
            ...(data.keywords?.data || []).slice(0, 2).map((item: any) => ({
              id: item.id,
              title: item.term || 'Unknown Keyword',
              type: 'keyword' as const,
              status: 'researched',
              createdAt: item.createdAt || new Date().toISOString()
            }))
          ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

          setRecentItems(recent);
        }
      } catch (apiError) {
        console.warn('Dashboard API failed, using fallback data:', apiError);
        // Continue with user context data only
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'keyword':
        return <Search className="w-4 h-4" />;
      case 'site':
        return <Globe className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'researched':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Quick actions
  const quickActions = [
    {
      title: 'Research Keywords',
      description: 'Find profitable keywords for your niche',
      icon: Search,
      href: '/keywords',
      color: 'bg-blue-500'
    },
    {
      title: 'Create Article',
      description: 'Generate AI-powered content',
      icon: FileText,
      href: '/articles/create',
      color: 'bg-green-500'
    },
    {
      title: 'Add WordPress Site',
      description: 'Connect a new publishing destination',
      icon: Globe,
      href: '/wordpress',
      color: 'bg-purple-500'
    },
    {
      title: 'View Settings',
      description: 'Manage your account preferences',
      icon: Settings,
      href: '/settings',
      color: 'bg-gray-500'
    }
  ];

  // Use the DashboardLayout component to match the keyword page's structure
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-blue-100">
                Ready to create amazing content? Let's get started.
              </p>
            </div>
            {/* Remove explicit word credits from welcome banner since they're in the header */}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '-' : stats.totalArticles}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Articles</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '-' : stats.publishedArticles}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '-' : stats.totalKeywords}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Keywords</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '-' : stats.totalSites}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sites</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <a
                    key={index}
                    href={action.href}
                    className="block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : recentItems.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {getItemIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Start by researching keywords or creating articles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Unable to load some dashboard data
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
