'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
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
  Link2,
  Layers,
  Calendar,
  Sparkles,
  HelpCircle,
  Phone,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  BookOpen   // NEW icon for Knowledgebase
} from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import NotificationDropdown from '@/components/NotificationDropdown';
import { notificationAPI } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [redirectHandled, setRedirectHandled] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [debugCollapsed, setDebugCollapsed] = useState(true);

  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const helpPanelRef = useRef<HTMLDivElement>(null);

  // Theme initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Authentication redirect
  useEffect(() => {
    if (!loading && !redirectHandled) {
      if (!isAuthenticated) {
        console.log('🔒 Redirecting to login...');
        setRedirectHandled(true);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [loading, isAuthenticated, router, pathname, redirectHandled]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationOpen &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node) &&
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
      if (
        helpOpen &&
        helpButtonRef.current &&
        !helpButtonRef.current.contains(event.target as Node) &&
        helpPanelRef.current &&
        !helpPanelRef.current.contains(event.target as Node)
      ) {
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen, helpOpen]);

  // Load unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

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

  const getUserCredits = () => {
    return user?.wordCredits || user?.credits || 0;
  };

  const getUserPlan = () => {
    return user?.plan || user?.subscription?.plan || user?.subscriptionPlan || 'Free';
  };

  const getUserUsedCredits = () => {
    return user?.currentMonthUsage || user?.totalWordsUsed || 0;
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard',
      badge: null
    },
    {
      name: 'Keywords',
      href: '/keywords',
      icon: Search,
      current: pathname === '/keywords',
      badge: null
    },
    {
      name: 'Articles',
      href: '/articles',
      icon: FileText,
      current: pathname === '/articles',
      badge: null
    },
    {
      name: 'Bulk Create',
      href: '/bulk-create',
      icon: Layers,
      current: pathname === '/bulk-create',
      badge: { text: 'New', color: 'bg-green-500' }
    },
    // -- NEW Knowledgebase item inserted here --
    {
      name: 'Knowledgebase',
      href: '/knowledgebase',
      icon: BookOpen,
      current: pathname === '/knowledgebase',
      badge: null
    },
    {
      name: 'Scheduler',
      href: '/scheduler',
      icon: Calendar,
      current: pathname.startsWith('/scheduler'),
      badge: null
    },
    {
      name: 'Sitemap',
      href: '/dashboard/wordpress/sitemap',
      icon: Link2,
      current: pathname === '/sitemap',
      badge: null
    },
    {
      name: 'WordPress',
      href: '/dashboard/wordpress',
      icon: Globe,
      current: pathname === '/wordpress',
      badge: null
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      current: pathname.startsWith('/billing'),
      badge: null
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: pathname.startsWith('/settings'),
      badge: null
    }
  ];

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const userCredits = getUserCredits();
  const userPlan = getUserPlan();
  const usedCredits = getUserUsedCredits();
  const isEnterprise = userPlan.toLowerCase() === 'enterprise';

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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ContentAI
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
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                  item.current
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${item.badge.color}`}>
                    {item.badge.text}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                {userPlan} Plan
              </p>
            </div>
          </div>

          {/* Credits display */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Words Remaining
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {userCredits.toLocaleString()}
              </span>
            </div>
            {usedCredits > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Used: {usedCredits.toLocaleString()} words
              </div>
            )}
            {(userCredits + usedCredits) > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((usedCredits / (userCredits + usedCredits)) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              {/* Plan and credits info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium capitalize">{userPlan} Plan</span>
                <span>•</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {userCredits.toLocaleString()} words
                </span>
              </div>

              {/* Quick action button - Bulk Create */}
              <Link
                href="/bulk-create"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm"
              >
                <Layers className="w-4 h-4" />
                <span>Bulk Create</span>
              </Link>

              {/* --- HELP BUTTON --- */}
              <div className="relative">
                <button
                  ref={helpButtonRef}
                  onClick={() => setHelpOpen(o => !o)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
                {helpOpen && (
                  <div
                    ref={helpPanelRef}
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Support Center
                      </h3>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/support"
                        onClick={() => setHelpOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        Submit a Ticket
                      </Link>
                      <a
                        href="https://docs.botquill.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setHelpOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        Knowledgebase
                        <ExternalLink className="w-3 h-3 inline-block ml-1" />
                      </a>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      {isEnterprise ? (
                         <a
                          href="tel:+18005550199"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call Enterprise Support</span>
                        </a>
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-400 dark:text-gray-500">
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>Priority Call Line</span>
                          </p>
                          <p className="text-xs mt-1">
                            (Available for Enterprise plan)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification button */}
              <div className="relative">
                <button
                  ref={notificationButtonRef}
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <div ref={notificationPanelRef}>
                  <NotificationDropdown
                    isOpen={notificationOpen}
                    onClose={() => setNotificationOpen(false)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {userPlan}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              © 2025 ContentAI Pro. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="hover:text-gray-700 dark:hover:text-gray-300">
                Help
              </Link>
              <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          {debugCollapsed ? (
            <button
              onClick={() => setDebugCollapsed(false)}
              className="bg-black bg-opacity-90 text-green-400 p-3 rounded-lg shadow-xl hover:bg-opacity-100 transition-all"
              title="Show Debug Info"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          ) : (
            <div className="bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs max-w-xs shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-green-400">🔧 Debug User Data:</div>
                <button
                  onClick={() => setDebugCollapsed(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <div>Word Credits: <span className="text-blue-400">{userCredits}</span></div>
                <div>Used: <span className="text-red-400">{usedCredits}</span></div>
                <div>Plan: <span className="text-purple-400">{userPlan}</span></div>
                <div>Name: <span className="text-yellow-400">{user?.name}</span></div>
                <div>Email: <span className="text-gray-400">{user?.email}</span></div>
                <div>Unread: <span className="text-orange-400">{unreadCount}</span></div>
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-gray-400">Current Page:</div>
                  <div className="text-green-400 break-all">{pathname}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;