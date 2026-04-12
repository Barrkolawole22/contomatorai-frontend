// components/layout/AdminLayout.tsx - Fixed Admin Layout
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Zap,
  Sun,
  Moon,
  Globe,
  Shield,
  HeadphonesIcon,
  Monitor,
  TrendingUp,
  Activity,
  DollarSign,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [redirectHandled, setRedirectHandled] = useState(false);

  // Theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Authentication redirect for admin
  useEffect(() => {
    if (!loading && !redirectHandled) {
      if (!isAuthenticated) {
        console.log('🔒 Redirecting to login...');
        setRedirectHandled(true);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user && !['admin', 'super_admin'].includes(user.role)) {
        console.log('🚫 Access denied - not admin');
        setRedirectHandled(true);
        router.replace('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router, pathname, redirectHandled]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !user || !['admin', 'super_admin'].includes(user.role)) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/admin/analytics'),
      children: [
        { name: 'Overview', href: '/admin/analytics' },
        { name: 'Performance', href: '/admin/analytics/performance' },
        { name: 'Usage', href: '/admin/analytics/usage' }
      ]
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: FileText,
      current: pathname.startsWith('/admin/content'),
      children: [
        { name: 'Overview', href: '/admin/content' },
        { name: 'Quality Control', href: '/admin/content/quality' },
        { name: 'Review Queue', href: '/admin/content/review' }
      ]
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'E-commerce',
      href: '/admin/ecommerce',
      icon: ShoppingCart,
      current: pathname.startsWith('/admin/ecommerce'),
      children: [
        { name: 'Overview', href: '/admin/ecommerce' },
        { name: 'Orders', href: '/admin/ecommerce/orders' },
        { name: 'Products', href: '/admin/ecommerce/products' }
      ]
    },
    {
      name: 'Financial',
      href: '/admin/financial',
      icon: DollarSign,
      current: pathname.startsWith('/admin/financial'),
      children: [
        { name: 'Overview', href: '/admin/financial' },
        { name: 'Revenue', href: '/admin/financial/revenue' }
      ]
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: MessageSquare,
      current: pathname === '/admin/notifications'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: HeadphonesIcon,
      current: pathname.startsWith('/admin/support'),
      children: [
        { name: 'Overview', href: '/admin/support' },
        { name: 'Tickets', href: '/admin/support/tickets' },
        { name: 'Knowledge Base', href: '/admin/support/knowledge-base' }
      ]
    },
    {
      name: 'System',
      href: '/admin/system',
      icon: Monitor,
      current: pathname.startsWith('/admin/system'),
      children: [
        { name: 'Overview', href: '/admin/system' },
        { name: 'Configuration', href: '/admin/system/config' },
        { name: 'Logs', href: '/admin/system/logs' },
        { name: 'Monitoring', href: '/admin/system/monitoring' }
      ]
    },
    {
      name: 'WordPress',
      href: '/admin/wordpress',
      icon: Globe,
      current: pathname.startsWith('/admin/wordpress'),
      children: [
        { name: 'Overview', href: '/admin/wordpress' },
        { name: 'Sites', href: '/admin/wordpress/sites' }
      ]
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname === '/admin/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
                
                {/* Sub-navigation */}
                {item.children && item.current && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`block px-3 py-1 text-xs rounded-md transition-colors ${
                          pathname === child.href
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Admin user section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 truncate">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>

          {/* Admin status */}
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                Administrator Access
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
              title="Go to User Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Admin Panel</span>
                <span>•</span>
                <span>{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
              </div>

              <button className="text-gray-500 hover:text-gray-700 p-2 rounded-md relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;