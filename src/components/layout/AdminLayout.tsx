'use client';

import { useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import Avatar from '@/components/shared/Avatar';
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  DollarSign,
  Globe,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Bell,
  Search,
  FileText,
  Activity,
  Headphones,
  Home,
  AlertTriangle,
  Zap,
  Moon,
  Sun,
  Command,
  Settings,
  ExternalLink,
  Check,
  Clock,
  Trash2,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'user' | 'content' | 'page' | 'ticket';
  href: string;
  description?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  href?: string;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const menuItems: MenuItem[] = useMemo(() => [
    { title: 'Dashboard',     href: '/admin',               icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: 'Users',         href: '/admin/users',         icon: <Users className="w-5 h-5" />, badge: undefined },
    { title: 'Analytics',     href: '/admin/analytics',     icon: <BarChart3 className="w-5 h-5" /> },
    { title: 'Content',       href: '/admin/content',       icon: <FileText className="w-5 h-5" /> },
    { title: 'Financial',     href: '/admin/financial',     icon: <DollarSign className="w-5 h-5" /> },
    { title: 'WordPress',     href: '/admin/wordpress',     icon: <Globe className="w-5 h-5" /> },
    { title: 'Support',       href: '/admin/support',       icon: <Headphones className="w-5 h-5" /> },
    { title: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { title: 'Settings',      href: '/admin/settings',      icon: <Settings className="w-5 h-5" /> },
  ], [unreadCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('admin-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      const { notificationAPI } = await import('@/lib/api');
      const response = await notificationAPI.getNotifications({ limit: 10 });
      if (response?.data?.success && Array.isArray(response.data.data.notifications)) {
        setNotifications(response.data.data.notifications);
      }
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    setUnreadCount(Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0);
  }, [notifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setUserMenuOpen(false);
        setSearchOpen(false);
        setNotificationsPanelOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (searchOpen && searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (notificationsPanelOpen && notificationButtonRef.current && !notificationButtonRef.current.contains(target)) {
        const panel = document.getElementById('notifications-panel');
        if (panel && !panel.contains(target)) setNotificationsPanelOpen(false);
      }
      if (userMenuOpen && userMenuButtonRef.current && !userMenuButtonRef.current.contains(target)) {
        const panel = document.getElementById('user-menu-panel');
        if (panel && !panel.contains(target)) setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen, notificationsPanelOpen, userMenuOpen]);

  const performSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    try {
      const { adminAPI } = await import('@/lib/adminAPI');
      const response = await adminAPI.search.globalSearch(query);
      if (response?.data?.success && response.data.data) {
        const results: SearchResult[] = [];
        response.data.data.users?.forEach((u: any) => {
          results.push({ id: u._id, title: u.name, type: 'user', href: `/admin/users/${u._id}`, description: u.email });
        });
        response.data.data.content?.forEach((c: any) => {
          results.push({ id: c._id, title: c.title, type: 'content', href: `/admin/content/${c._id}`, description: c.keyword });
        });
        setSearchResults(results);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    const id = setTimeout(() => {
      if (searchQuery.trim().length > 2) performSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, performSearch]);

  const handleNavigation = useCallback((href: string) => {
    setSearchOpen(false);
    setNotificationsPanelOpen(false);
    setUserMenuOpen(false);
    try { router.push(href); } catch { window.location.href = href; }
  }, [router]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      const { adminAPI } = await import('@/lib/adminAPI');
      await adminAPI.notifications.markAsRead(id);
    } catch {}
    setNotifications(prev => Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, read: true } : n) : []);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { adminAPI } = await import('@/lib/adminAPI');
      await adminAPI.notifications.deleteNotification(id);
    } catch {}
    setNotifications(prev => Array.isArray(prev) ? prev.filter(n => n.id !== id) : []);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!Array.isArray(notifications)) return;
    try {
      const { adminAPI } = await import('@/lib/adminAPI');
      await Promise.all(notifications.filter(n => !n.read).map(n => adminAPI.notifications.markAsRead(n.id)));
    } catch {}
    setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, read: true })) : []);
  }, [notifications]);

  const toggleDarkMode = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('admin-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }, [darkMode]);

  const handleLogout = useCallback(async () => {
    try { await logout(); router.push('/login'); }
    catch { window.location.href = '/login'; }
  }, [logout, router]);

  const formatTimeAgo = useCallback((ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }, []);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':   return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  }, []);

  const getSearchIcon = useCallback((type: string) => {
    switch (type) {
      case 'user':    return <Users className="w-4 h-4" />;
      case 'content': return <FileText className="w-4 h-4" />;
      case 'ticket':  return <HelpCircle className="w-4 h-4" />;
      default:        return <Search className="w-4 h-4" />;
    }
  }, []);

  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push('/login?redirect=/admin'); return; }
      if (!isAdmin) { router.push('/dashboard'); return; }
    }
  }, [user, loading, router, isAdmin]);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsPanelOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const isActiveLink = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ContentAI Admin</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to access the admin panel.</p>
          <button onClick={() => router.push('/login?redirect=/admin')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have the required permissions to access the admin panel.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Go to Dashboard</button>
            <button onClick={() => router.back()} className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-out overflow-hidden shadow-2xl flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 lg:z-auto`}>

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <span className="text-base font-bold text-white">Admin Panel</span>
              <p className="text-xs text-white/70">ContentAI System</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Back to dashboard */}
        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            onClick={() => handleNavigation('/dashboard')}
            className="flex items-center space-x-2.5 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all w-full text-left p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 group"
          >
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Home className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => {
            const active = isActiveLink(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 shadow-sm border-l-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-blue-200/50 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400'
                  }`}>
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-gray-50/30 dark:bg-gray-800/30">
          <div className="flex items-center space-x-3 mb-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl">
            <Avatar size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <button onClick={toggleDarkMode} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all group">
              <div className="p-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all">
              <div className="p-1 rounded-md bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-6 py-3 shadow-sm sticky top-0 z-[50]">
          <div className="flex items-center space-x-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="hidden md:block relative" ref={searchContainerRef}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search... (⌘K)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="block w-80 pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <kbd className="inline-flex items-center px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-400">
                    <Command className="w-3 h-3 mr-0.5" />K
                  </kbd>
                </div>
              </div>

              {searchOpen && mounted && (searchQuery.length > 0 || searchResults.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[100] max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="px-4 py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 text-sm mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Results</p>
                      </div>
                      {searchResults.map(result => (
                        <button key={result.id} onClick={() => handleNavigation(result.href)} className="w-full block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{getSearchIcon(result.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{result.title}</p>
                              {result.description && <p className="text-xs text-gray-500 truncate">{result.description}</p>}
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </>
                  ) : searchQuery.length > 2 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-500 text-sm">No results found</p>
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-500 text-sm">Type to search...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Header right */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={e => { e.preventDefault(); e.stopPropagation(); setNotificationsPanelOpen(v => !v); }}
                className="relative p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsPanelOpen && mounted && (
                <div id="notifications-panel" className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[100] max-h-96 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {Array.isArray(notifications) && notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">{getNotificationIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                              <div className="flex items-center space-x-1 ml-2">
                                {!n.read && (
                                  <button onClick={() => markNotificationAsRead(n.id)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => deleteNotification(n.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />{formatTimeAgo(n.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => handleNavigation('/admin/notifications')} className="text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium w-full">
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                onClick={e => { e.preventDefault(); e.stopPropagation(); setUserMenuOpen(v => !v); }}
                className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <Avatar size="md" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && mounted && (
                <div id="user-menu-panel" className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[100]">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => handleNavigation('/profile')} className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <User className="w-4 h-4" /><span>Profile Settings</span>
                    </button>
                    <button onClick={toggleDarkMode} className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button onClick={() => handleNavigation('/admin/settings')} className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <Settings className="w-4 h-4" /><span>Admin Settings</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut className="w-4 h-4" /><span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
          <div className="min-h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;