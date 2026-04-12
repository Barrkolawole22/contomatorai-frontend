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
  ChevronRight,
  LogOut,
  User,
  Bell,
  Search,
  Monitor,
  FileText,
  Activity,
  CreditCard,
  Headphones,
  Home,
  AlertTriangle,
  Zap,
  Moon,
  Sun,
  Command,
  ShoppingCart,
  Settings,
  Eye,
  UserCog,
  ExternalLink,
  Check,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  children?: MenuItem[];
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Dashboard']);
  const [mounted, setMounted] = useState(false);
  
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Mount detection
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Memoize menuItems to prevent useEffect dependency array changes
  const menuItems: MenuItem[] = useMemo(() => [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      badge: '2.4k',
      children: [
        {
          title: 'All Users',
          href: '/admin/users',
          icon: <Users className="w-4 h-4" />
        },
        {
          title: 'User Details',
          href: '/admin/users/[id]',
          icon: <Eye className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      children: [
        {
          title: 'Overview',
          href: '/admin/analytics',
          icon: <BarChart3 className="w-4 h-4" />
        },
        {
          title: 'Usage Analytics',
          href: '/admin/analytics/usage',
          icon: <Activity className="w-4 h-4" />
        },
        {
          title: 'Performance',
          href: '/admin/analytics/performance',
          icon: <Monitor className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Content',
      href: '/admin/content',
      icon: <FileText className="w-5 h-5" />,
      children: [
        {
          title: 'Content Overview',
          href: '/admin/content',
          icon: <FileText className="w-4 h-4" />,
          badge: '12'
        },
        {
          title: 'Quality Control',
          href: '/admin/content/quality',
          icon: <Shield className="w-4 h-4" />
        },
        {
          title: 'Content Review',
          href: '/admin/content/review',
          icon: <Eye className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'E-commerce',
      href: '/admin/ecommerce',
      icon: <ShoppingCart className="w-5 h-5" />,
      children: [
        {
          title: 'Overview',
          href: '/admin/ecommerce',
          icon: <BarChart3 className="w-4 h-4" />
        },
        {
          title: 'Products',
          href: '/admin/ecommerce/products',
          icon: <FileText className="w-4 h-4" />
        },
        {
          title: 'Orders',
          href: '/admin/ecommerce/orders',
          icon: <ShoppingCart className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Financial',
      href: '/admin/financial',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      title: 'WordPress',
      href: '/admin/wordpress',
      icon: <Globe className="w-5 h-5" />
    },
    {
      title: 'Support',
      href: '/admin/support',
      icon: <Headphones className="w-5 h-5" />,
      children: [
        {
          title: 'Help Desk',
          href: '/admin/support',
          icon: <Headphones className="w-4 h-4" />,
          badge: '5'
        },
        {
          title: 'Support Tickets',
          href: '/admin/support/tickets',
          icon: <HelpCircle className="w-4 h-4" />
        },
        {
          title: 'Knowledge Base',
          href: 'https://botquill.com',
          icon: <FileText className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'System',
      href: '/admin/system',
      icon: <Monitor className="w-5 h-5" />
    },
    {
      title: 'Notifications',
      href: '/admin/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount > 0 ? unreadCount.toString() : undefined
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />
    }
  ], [unreadCount]);

  // Initialize dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('admin-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const { notificationAPI } = await import('@/lib/api');
      const response = await notificationAPI.getNotifications({ limit: 10 });
      
      if (response?.data?.success && Array.isArray(response.data.data.notifications)) {
        setNotifications(response.data.data.notifications);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Update unread count
  useEffect(() => {
    if (Array.isArray(notifications)) {
      const unread = notifications.filter(n => !n.read);
      setUnreadCount(unread.length);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setSearchOpen(true);
        }
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

  // Click outside handling with improved logic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close search if clicking outside
      if (searchOpen && searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchOpen(false);
      }
      
      // Close notifications if clicking outside
      if (notificationsPanelOpen && notificationButtonRef.current && !notificationButtonRef.current.contains(target)) {
        const notificationPanel = document.getElementById('notifications-panel');
        if (notificationPanel && !notificationPanel.contains(target)) {
          setNotificationsPanelOpen(false);
        }
      }
      
      // Close user menu if clicking outside
      if (userMenuOpen && userMenuButtonRef.current && !userMenuButtonRef.current.contains(target)) {
        const userMenuPanel = document.getElementById('user-menu-panel');
        if (userMenuPanel && !userMenuPanel.contains(target)) {
          setUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen, notificationsPanelOpen, userMenuOpen]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    
    try {
      if (typeof window === 'undefined') return;
      
      const { adminAPI } = await import('@/lib/adminAPI');
      const response = await adminAPI.search.globalSearch(query);
      
      if (response?.data?.success && response.data.data) {
        const results: SearchResult[] = [];
        
        response.data.data.users?.forEach((user: any) => {
          results.push({
            id: user._id,
            title: user.name,
            type: 'user',
            href: `/admin/users/${user._id}`,
            description: user.email
          });
        });
        
        response.data.data.content?.forEach((content: any) => {
          results.push({
            id: content._id,
            title: content.title,
            type: 'content',
            href: `/admin/content/${content._id}`,
            description: content.description || content.keyword
          });
        });

        setSearchResults(results);
        setSearchLoading(false);
        return;
      }
    } catch (error) {
      console.error('Search API failed:', error);
      setSearchResults([]);
      setSearchLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Event handlers
  const handleSearchFocus = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleNotificationClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotificationsPanelOpen(!notificationsPanelOpen);
  }, [notificationsPanelOpen]);

  const handleUserMenuClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
  }, [userMenuOpen]);

  // Navigation handler
  const handleNavigation = useCallback((href: string) => {
    setSearchOpen(false);
    setNotificationsPanelOpen(false);
    setUserMenuOpen(false);
    
    try {
      router.push(href);
    } catch (error) {
      console.error('Router navigation failed, using window.location:', error);
      window.location.href = href;
    }
  }, [router]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      if (typeof window !== 'undefined') {
        const { adminAPI } = await import('@/lib/adminAPI');
        await adminAPI.notifications.markAsRead(notificationId);
      }
    } catch (error) {
      console.warn('Mark as read API failed');
    }
    
    setNotifications(prev => 
      Array.isArray(prev) 
        ? prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        : []
    );
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      if (typeof window !== 'undefined') {
        const { adminAPI } = await import('@/lib/adminAPI');
        await adminAPI.notifications.deleteNotification(notificationId);
      }
    } catch (error) {
      console.warn('Delete notification API failed');
    }
    
    setNotifications(prev => 
      Array.isArray(prev) ? prev.filter(n => n.id !== notificationId) : []
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!Array.isArray(notifications)) return;
    
    try {
      if (typeof window !== 'undefined') {
        const { adminAPI } = await import('@/lib/adminAPI');
        const unreadNotifications = notifications.filter(n => !n.read);
        await Promise.all(
          unreadNotifications.map(n => adminAPI.notifications.markAsRead(n.id))
        );
      }
    } catch (error) {
      console.warn('Mark all as read API failed');
    }
    
    setNotifications(prev => 
      Array.isArray(prev) ? prev.map(n => ({ ...n, read: true })) : []
    );
  }, [notifications]);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-theme', newDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newDarkMode);
    }
  }, [darkMode]);

  const handleProfileClick = useCallback(() => {
    handleNavigation('/profile');
  }, [handleNavigation]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [logout, router]);

  const handleBackToDashboard = useCallback(() => {
    handleNavigation('/dashboard');
  }, [handleNavigation]);

  // Utility functions
  const formatTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, []);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  }, []);

  const getSearchIcon = useCallback((type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'content': return <FileText className="w-4 h-4" />;
      case 'ticket': return <HelpCircle className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  }, []);

  // Check admin access
  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin');
        return;
      }
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, router, isAdmin]);

  // Initialize expanded menus only when pathname changes
  useEffect(() => {
    const pathSegments = pathname.split('/');
    if (pathSegments.length > 2) {
      const parentPath = pathSegments[2];
      const menuToExpand = menuItems.find(item => 
        item.href.includes(parentPath) || 
        item.children?.some(child => child.href.includes(parentPath))
      );
      if (menuToExpand && menuToExpand.children) {
        setExpandedMenus(prev => 
          prev.includes(menuToExpand.title) 
            ? prev 
            : [...prev, menuToExpand.title]
        );
      }
    }
  }, [pathname, menuItems]);

  // Close dropdowns on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotificationsPanelOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const toggleMenu = useCallback((title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  }, []);

  const isActiveLink = useCallback((href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    
    if (href.includes('[id]')) {
      const baseRoute = href.replace('/[id]', '');
      const pathSegments = pathname.split('/');
      const hrefSegments = baseRoute.split('/');
      
      if (pathSegments.length === hrefSegments.length + 1) {
        const basePath = pathSegments.slice(0, -1).join('/');
        return basePath === baseRoute;
      }
    }
    
    return pathname.startsWith(href);
  }, [pathname]);

  const hasActiveChild = useCallback((children?: MenuItem[]) => {
    return children?.some(child => isActiveLink(child.href));
  }, [isActiveLink]);

  const renderMenuItem = useCallback((item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.title);
    const isActive = isActiveLink(item.href);
    const hasActiveChildren = hasActiveChild(item.children);

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.title)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              hasActiveChildren || isExpanded
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                hasActiveChildren || isExpanded 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-800/30 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400'
              }`}>
                {item.icon}
              </div>
              <span>{item.title}</span>
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
          
          {isExpanded && (
            <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
              {item.children?.map((child) => {
                const isExternalLink = child.href.startsWith('http');
                const isChildActive = isActiveLink(child.href);
                
                if (isExternalLink) {
                  return (
                    <a
                      key={child.href}
                      href={child.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                        isChildActive
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 shadow-sm border-l-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded-md transition-all duration-200 ${
                          isChildActive
                            ? 'bg-blue-200/50 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400'
                        }`}>
                          {child.icon}
                        </div>
                        <span className="font-medium">{child.title}</span>
                      </div>
                      {child.badge && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium shadow-sm">
                          {child.badge}
                        </span>
                      )}
                    </a>
                  );
                } else {
                  const childHref = child.href.includes('[id]') ? child.href.replace('/[id]', '') : child.href;
                  
                  return (
                    <Link
                      key={child.href}
                      href={childHref}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                        isChildActive
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 shadow-sm border-l-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-1 rounded-md transition-all duration-200 ${
                          isChildActive
                            ? 'bg-blue-200/50 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400'
                        }`}>
                          {child.icon}
                        </div>
                        <span className="font-medium">{child.title}</span>
                      </div>
                      {child.badge && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium shadow-sm">
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  );
                }
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group block ${
          isActive
            ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 shadow-md border-l-2 border-blue-500'
            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-blue-200/50 text-blue-600 dark:bg-blue-800/50 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/20 dark:group-hover:text-blue-400'
          }`}>
            {item.icon}
          </div>
          <span>{item.title}</span>
        </div>
        {item.badge && (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium shadow-sm">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }, [expandedMenus, isActiveLink, hasActiveChild, toggleMenu]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              ContentAI Admin
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Verifying administrator access...
          </p>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to access the admin panel.
          </p>
          <button
            onClick={() => router.push('/login?redirect=/admin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have the required permissions to access the admin panel. 
            Only administrators can view this content.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main admin layout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[70] w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 transform transition-all duration-300 ease-out overflow-hidden shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 lg:z-auto`}>
        {/* Sidebar header */}
        <div className="relative flex items-center justify-between h-18 px-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                <Shield className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <span className="text-xl font-bold text-white drop-shadow-sm">
                Admin Panel
              </span>
              <p className="text-xs text-white/80">ContentAI System</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick access to main dashboard */}
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-3 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all duration-200 w-full text-left p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 group"
          >
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
              <Home className="w-4 h-4" />
            </div>
            <span className="font-medium">Back to Main Dashboard</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-gray-50/30 dark:bg-gray-800/30">
          <div className="flex items-center space-x-3 mb-4 p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl backdrop-blur-sm">
            <Avatar size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
            >
              <div className="p-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 group"
            >
              <div className="p-1 rounded-md bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 group-hover:scale-110 transition-transform duration-200">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 h-18 flex items-center justify-between px-6 shadow-sm sticky top-0 z-[50]">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Input */}
            <div className="hidden md:block relative" ref={searchContainerRef}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  ref={searchInputRef}
                  id="admin-search"
                  type="text"
                  placeholder="Search admin panel... (⌘K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="block w-96 pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <kbd className="inline-flex items-center px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs font-sans font-medium text-gray-400 dark:text-gray-500">
                    <Command className="w-3 h-3 mr-1" />K
                  </kbd>
                </div>
              </div>

              {/* Search Dropdown */}
              {searchOpen && mounted && (searchQuery.length > 0 || searchResults.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[100] max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="px-4 py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Search Results
                        </p>
                      </div>
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleNavigation(result.href)}
                          className="w-full block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              {getSearchIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {result.title}
                              </p>
                              {result.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </>
                  ) : searchQuery.length > 2 ? (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No results found</p>
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Type to search...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Header right section */}
          <div className="flex items-center space-x-4">
            {/* Notifications Button */}
            <div className="relative">
              <button 
                ref={notificationButtonRef}
                onClick={handleNotificationClick}
                className="relative p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {notificationsPanelOpen && mounted && (
                <div 
                  id="notifications-panel"
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[100] max-h-96 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {Array.isArray(notifications) && notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                            !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <div className="flex items-center space-x-1">
                                  {!notification.read && (
                                    <button
                                      onClick={() => markNotificationAsRead(notification.id)}
                                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                      title="Mark as read"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    title="Delete notification"
                                    >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimeAgo(notification.timestamp)}
                                </p>
                                {notification.href && (
                                  <button
                                    onClick={() => handleNavigation(notification.href!)}
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center"
                                  >
                                    View <ExternalLink className="w-3 h-3 ml-1" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleNavigation('/admin/notifications')}
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium w-full"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu Button */}
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                onClick={handleUserMenuClick}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              >
                <Avatar size="md" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu */}
              {userMenuOpen && mounted && (
                <div 
                  id="user-menu-panel"
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[100] animate-in slide-in-from-top-2 duration-200"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.email || 'admin@example.com'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Administrator Account
                    </p>
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    
                    <button
                      onClick={toggleDarkMode}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button
                      onClick={() => handleNavigation('/admin/settings')}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin Settings</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 relative">
          <div className="min-h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;