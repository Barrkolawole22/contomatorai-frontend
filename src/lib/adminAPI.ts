// frontend/src/lib/adminAPI.ts - COMPLETE VERSION WITH ALL UPDATES
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance specifically for admin operations
const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============================================
// 📊 ANALYTICS API (REAL DATA)
// =============================================
export const analyticsAPI = {
  // Dashboard analytics (working)
  getDashboardAnalytics: (timeRange = '30d') =>
    adminApiClient.get(`/admin/dashboard/analytics?timeRange=${timeRange}`),
  
  // Real-time analytics (working)
  getRealTimeAnalytics: () =>
    adminApiClient.get('/admin/analytics/real-time'),
  
  // Analytics overview (/admin/analytics) - FIXED
  getAnalyticsOverview: (timeframe = '30d') =>
    adminApiClient.get(`/admin/analytics?timeframe=${timeframe}`),
  
  // Performance analytics (/admin/analytics/performance) - FIXED
  getPerformanceAnalytics: (timeframe = '24h') =>
    adminApiClient.get(`/admin/analytics/performance?timeframe=${timeframe}`),
  
  // Usage analytics (/admin/analytics/usage) - FIXED
  getUsageAnalytics: (timeframe = '7d') =>
    adminApiClient.get(`/admin/analytics/usage?timeframe=${timeframe}`),
};

// =============================================
// 👥 USER MANAGEMENT API - COMPLETELY FIXED
// =============================================
export const userAPI = {
  // Get all users with pagination, search, filters
  getAllUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/users?${queryString}`);
  },
  
  // 🔥 FIXED: Main method that was causing the infinite loading
  getUserDetails: (userId: string) => {
    console.log('🔍 API: Calling getUserDetails for ID:', userId);
    return adminApiClient.get(`/admin/users/${userId}`);
  },
  
  // Alternative method (same endpoint, different name for compatibility)
  getUserById: (userId: string) => {
    console.log('🔍 API: Calling getUserById for ID:', userId);
    return adminApiClient.get(`/admin/users/${userId}`);
  },
  
  // Create new user (admin only)
  createUser: (data: any) =>
    adminApiClient.post('/admin/users', data),
  
  // Update user (admin only)
  updateUser: (userId: string, data: any) => {
    console.log('🔄 API: Updating user:', userId, data);
    return adminApiClient.put(`/admin/users/${userId}`, data);
  },
  
  // Delete user (admin only)
  deleteUser: (userId: string) => {
    console.log('🗑️ API: Deleting user:', userId);
    return adminApiClient.delete(`/admin/users/${userId}`);
  },
  
  // Bulk operations on users
  bulkUserAction: (data: any) =>
    adminApiClient.post('/admin/users/bulk-action', data),
  
  // User statistics and analytics
  getUserStats: () =>
    adminApiClient.get('/admin/users/stats'),
  
  // Detailed user analytics with timeframes
  getUserAnalytics: (timeframe = '30d') =>
    adminApiClient.get(`/admin/users/analytics?timeframe=${timeframe}`),
};

// =============================================
// 📝 CONTENT MANAGEMENT API (REAL DATA) - FIXED
// =============================================
export const contentAPI = {
  // Content overview (/admin/content) - FIXED
  getContentOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/content?${queryString}`);
  },
  
  // Content quality (/admin/content/quality) - FIXED
  getContentQuality: () =>
    adminApiClient.get('/admin/content/quality'),
  
  // Content review (/admin/content/review) - FIXED
  getContentReview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/content/review?${queryString}`);
  },
  
  // Get specific content
  getContentById: (contentId: string) =>
    adminApiClient.get(`/admin/content/${contentId}`),
  
  // Update content
  updateContent: (contentId: string, data: any) =>
    adminApiClient.put(`/admin/content/${contentId}`, data),
  
  // Bulk content operations
  bulkContentAction: (data: any) =>
    adminApiClient.post('/admin/content/bulk-action', data),
};

// =============================================
// 🛒 E-COMMERCE API (REAL PLACEHOLDERS) - FIXED
// =============================================
export const ecommerceAPI = {
  // E-commerce overview (/admin/ecommerce) - FIXED
  getEcommerceOverview: () =>
    adminApiClient.get('/admin/ecommerce'),
  
  // E-commerce orders (/admin/ecommerce/orders) - FIXED
  getOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/ecommerce/orders?${queryString}`);
  },
  
  // E-commerce products (/admin/ecommerce/products) - FIXED
  getProducts: () =>
    adminApiClient.get('/admin/ecommerce/products'),
  
  // Process refund
  processRefund: (orderId: string, data: any) =>
    adminApiClient.post(`/admin/ecommerce/orders/${orderId}/refund`, data),
};

// =============================================
// 💰 FINANCIAL API (REAL PROJECTIONS) - FIXED
// =============================================
export const financialAPI = {
  // Financial overview (/admin/financial) - FIXED
  getFinancialOverview: (timeframe = '30d') =>
    adminApiClient.get(`/admin/financial?timeframe=${timeframe}`),
  
  // Revenue analytics (/admin/financial/revenue) - FIXED
  getRevenueAnalytics: (timeframe = '30d') =>
    adminApiClient.get(`/admin/financial/revenue?timeframe=${timeframe}`),
  
  // Transactions (/admin/financial/transactions) - FIXED
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/financial/transactions?${queryString}`);
  },
  
  // Process refund
  processRefund: (transactionId: string, data: any) =>
    adminApiClient.post(`/admin/financial/transactions/${transactionId}/refund`, data),
  
  // Adjust user credits
  adjustUserCredits: (userId: string, data: any) =>
    adminApiClient.post(`/admin/financial/users/${userId}/credits`, data),
};

// =============================================
// 🖥️ SYSTEM MANAGEMENT API (REAL DATA) - FIXED
// =============================================
export const systemAPI = {
  // System health
  getSystemHealth: () =>
    adminApiClient.get('/admin/system/health'),
  
  // System monitoring
  getSystemMonitoring: (timeRange = '24h') =>
    adminApiClient.get(`/admin/system/monitoring?timeRange=${timeRange}`),
  
  // System logs
  getSystemLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/system/logs?${queryString}`);
  },
  
  // System config
  getSystemConfig: () =>
    adminApiClient.get('/admin/system/config'),
  
  // Update config
  updateSystemConfig: (config: any) =>
    adminApiClient.put('/admin/system/config', { config }),
  
  // Performance metrics
  getPerformanceMetrics: () =>
    adminApiClient.get('/admin/metrics/performance'),
  
  // Activity logs
  getActivityLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/logs/activity?${queryString}`);
  },
  
  // Maintenance mode
  toggleMaintenance: (data: any) =>
    adminApiClient.post('/admin/system/maintenance', data),
};

// =============================================
// 🌐 WORDPRESS MANAGEMENT API (REAL DATA) - FIXED
// =============================================
export const wordpressAPI = {
  // WordPress overview (/admin/wordpress) - FIXED
  getWordPressOverview: () =>
    adminApiClient.get('/admin/wordpress'),
  
  // All sites (/admin/wordpress/sites) - FIXED
  getAllSites: () =>
    adminApiClient.get('/admin/wordpress/sites'),
  
  // Get specific site
  getSiteById: (siteId: string) =>
    adminApiClient.get(`/admin/wordpress/sites/${siteId}`),
  
  // Add site - FIXED
  addSite: (data: any) =>
    adminApiClient.post('/admin/wordpress/sites', data),
  
  // Update site - FIXED
  updateSite: (siteId: string, data: any) =>
    adminApiClient.put(`/admin/wordpress/sites/${siteId}`, data),
  
  // Delete site - FIXED
  deleteSite: (siteId: string) =>
    adminApiClient.delete(`/admin/wordpress/sites/${siteId}`),
  
  // Health check - FIXED
  performHealthCheck: (siteId: string) =>
    adminApiClient.post(`/admin/wordpress/sites/${siteId}/health-check`),
  
  // Sync taxonomies - FIXED
  syncSite: (siteId: string) =>
    adminApiClient.post(`/admin/wordpress/sites/${siteId}/sync`),
};

// =============================================
// 🎧 SUPPORT MANAGEMENT API (REAL DATA) - FIXED
// =============================================
export const supportAPI = {
  // Support overview (/admin/support) - FIXED
  getSupportOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/support?${queryString}`);
  },
  
  // All tickets (/admin/support/tickets) - FIXED
  getAllTickets: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/support/tickets?${queryString}`);
  },
  
  // Get ticket details
  getTicketDetails: (ticketId: string) =>
    adminApiClient.get(`/admin/support/tickets/${ticketId}`),
  
  // Update ticket
  updateTicket: (ticketId: string, data: any) =>
    adminApiClient.put(`/admin/support/tickets/${ticketId}`, data),
  
  // Add message to ticket
  addTicketMessage: (ticketId: string, data: any) =>
    adminApiClient.post(`/admin/support/tickets/${ticketId}/messages`, data),
  
  // Knowledge base (/admin/support/knowledge-base) - FIXED
  getKnowledgeBase: () =>
    adminApiClient.get('/admin/support/knowledge-base'),
};

// =============================================
// 🔔 NOTIFICATIONS API (REAL DATA) - UPDATED
// =============================================
export const notificationsAPI = {
  // Get all notifications (admin can see all)
  getNotifications: (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
    userId?: string; // Admin can filter by user
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', 'true');
    if (params?.userId) searchParams.append('userId', params.userId);

    return adminApiClient.get(`/admin/notifications?${searchParams.toString()}`);
  },

  // Get unread count
  getUnreadCount: () =>
    adminApiClient.get('/admin/notifications/unread-count'),

  // Mark notification as read (Using PATCH as in original file)
  markAsRead: (id: string) =>
    adminApiClient.patch(`/admin/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: () =>
    adminApiClient.put('/admin/notifications/mark-all-read'),

  // Delete notification
  deleteNotification: (id: string) =>
    adminApiClient.delete(`/admin/notifications/${id}`),

  // Clear all notifications
  clearAll: () =>
    adminApiClient.delete('/admin/notifications'),

  // Admin: Create notification
  createNotification: (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    recipientType: 'user' | 'admin' | 'all' | 'role_based';
    recipientId?: string;
    targetRoles?: string[];
  }) =>
    adminApiClient.post('/admin/notifications', data),

  // Admin: Broadcast notification to all users
  broadcastNotification: (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) =>
    adminApiClient.post('/admin/notifications/broadcast', data),
};
// =============================================
// 👆 END OF UPDATED SECTION
// =============================================

// =============================================
// ⚙️ SETTINGS API (REAL DATA) - FIXED
// =============================================
export const settingsAPI = {
  // Get settings (/admin/settings) - FIXED
  getSettings: () =>
    adminApiClient.get('/admin/settings'),
  
  // Update settings - FIXED
  updateSettings: (settings: any) =>
    adminApiClient.put('/admin/settings', settings),
  
  // Get feature flags - FIXED
  getFeatureFlags: () =>
    adminApiClient.get('/admin/settings/features'),
  
  // Update feature flags - FIXED
  updateFeatureFlags: (features: any) =>
    adminApiClient.put('/admin/settings/features', features),
};

// =============================================
// 📊 EXPORT & REPORTING API (REAL DATA)
// =============================================
export const exportAPI = {
  // Export users
  exportUsers: (format: 'json' | 'csv' = 'json') =>
    adminApiClient.get(`/admin/export/users?format=${format}`),
  
  // Export content
  exportContent: () =>
    adminApiClient.get('/admin/export/content'),
  
  // Generate analytics report
  generateAnalyticsReport: (data: any) =>
    adminApiClient.post('/admin/reports/analytics', data),
};

// =============================================
// 🔍 SEARCH API (REAL DATA)
// =============================================
export const searchAPI = {
  // Global admin search
  globalSearch: (query: string, type = 'all') =>
    adminApiClient.get(`/admin/search?q=${encodeURIComponent(query)}&type=${type}`),
};

// =============================================
// FILES MANAGEMENT API (ADDED)
// =============================================
export const filesAPI = {
  // Get files overview
  getFilesOverview: () =>
    adminApiClient.get('/admin/files'),
  
  // Upload file
  uploadFile: (formData: FormData) =>
    adminApiClient.post('/admin/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Delete file
  deleteFile: (fileId: string) =>
    adminApiClient.delete(`/admin/files/${fileId}`),
};

// =============================================
// DASHBOARD API (COMPLETE)
// =============================================
export const dashboardAPI = {
  // Main dashboard data
  getDashboardData: () =>
    adminApiClient.get('/admin/dashboard'),
  
  // Dashboard analytics
  getDashboardAnalytics: (timeRange = '30d') =>
    adminApiClient.get(`/admin/dashboard/analytics?timeRange=${timeRange}`),
  
  // Real-time data
  getRealTimeData: () =>
    adminApiClient.get('/admin/dashboard/realtime'),
};

// =============================================
// MAIN ADMIN API OBJECT (COMPLETE & FIXED)
// =============================================
export const adminAPI = {
  analytics: analyticsAPI,
  users: userAPI,
  content: contentAPI,
  ecommerce: ecommerceAPI,
  financial: financialAPI,
  system: systemAPI,
  wordpress: wordpressAPI,
  support: supportAPI,
  notifications: notificationsAPI,
  settings: settingsAPI,
  export: exportAPI,
  search: searchAPI,
  files: filesAPI,
  dashboard: dashboardAPI,
};

export default adminAPI;