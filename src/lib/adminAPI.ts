// src/lib/adminAPI.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const adminApiClient = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

adminApiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const analyticsAPI = {
  getDashboardAnalytics: (timeRange = '30d') =>
    adminApiClient.get(`/admin/dashboard/analytics?timeRange=${timeRange}`),
  getRealTimeAnalytics: () =>
    adminApiClient.get('/admin/analytics/real-time'),
  getAnalyticsOverview: (timeframe = '30d') =>
    adminApiClient.get(`/admin/analytics?timeframe=${timeframe}`),
  getOverview: (timeframe = '30d') =>
    adminApiClient.get(`/admin/analytics?timeframe=${timeframe}`),
  getPerformanceAnalytics: (timeframe = '24h') =>
    adminApiClient.get(`/admin/analytics/performance?timeframe=${timeframe}`),
  getUsageAnalytics: (timeframe = '7d') =>
    adminApiClient.get(`/admin/analytics/usage?timeframe=${timeframe}`),
};

export const userAPI = {
  getAllUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/users?${queryString}`);
  },
  getUserDetails: (userId: string) =>
    adminApiClient.get(`/admin/users/${userId}`),
  getUserById: (userId: string) =>
    adminApiClient.get(`/admin/users/${userId}`),
  createUser: (data: any) =>
    adminApiClient.post('/admin/users', data),
  updateUser: (userId: string, data: any) =>
    adminApiClient.put(`/admin/users/${userId}`, data),
  deleteUser: (userId: string) =>
    adminApiClient.delete(`/admin/users/${userId}`),
  bulkUserAction: (data: any) =>
    adminApiClient.post('/admin/users/bulk-action', data),
  getUserStats: () =>
    adminApiClient.get('/admin/users/stats'),
  getUserAnalytics: (timeframe = '30d') =>
    adminApiClient.get(`/admin/users/analytics?timeframe=${timeframe}`),
};

export const contentAPI = {
  getContentOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/content?${queryString}`);
  },
  getContentQuality: () =>
    adminApiClient.get('/admin/content/quality'),
  getContentReview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/content/review?${queryString}`);
  },
  getContentById: (contentId: string) =>
    adminApiClient.get(`/admin/content/${contentId}`),
  updateContent: (contentId: string, data: any) =>
    adminApiClient.put(`/admin/content/${contentId}`, data),
  deleteContent: (contentId: string) =>
    adminApiClient.delete(`/admin/content/${contentId}`),
  bulkContentAction: (data: any) =>
    adminApiClient.post('/admin/content/bulk-action', data),
};

export const ecommerceAPI = {
  getEcommerceOverview: () =>
    adminApiClient.get('/admin/ecommerce'),
  getOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/ecommerce/orders?${queryString}`);
  },
  getProducts: () =>
    adminApiClient.get('/admin/ecommerce/products'),
  // NOTE: no backend route exists for this yet
  processRefund: (orderId: string, data: any) =>
    adminApiClient.post(`/admin/ecommerce/orders/${orderId}/refund`, data),
};

export const financialAPI = {
  getFinancialOverview: (timeframe = '30d') =>
    adminApiClient.get(`/admin/financial?timeframe=${timeframe}`),
  getRevenueAnalytics: (timeframe = '30d') =>
    adminApiClient.get(`/admin/financial/revenue?timeframe=${timeframe}`),
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/financial/transactions?${queryString}`);
  },
  // NOTE: no backend route exists for these yet
  processRefund: (transactionId: string, data: any) =>
    adminApiClient.post(`/admin/financial/transactions/${transactionId}/refund`, data),
  adjustUserCredits: (userId: string, data: any) =>
    adminApiClient.post(`/admin/financial/users/${userId}/credits`, data),
};

export const systemAPI = {
  getSystemHealth: () =>
    adminApiClient.get('/admin/system/health'),
  getSystemMonitoring: (timeRange = '24h') =>
    adminApiClient.get(`/admin/system/monitoring?timeRange=${timeRange}`),
  getSystemLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/system/logs?${queryString}`);
  },
  getSystemConfig: () =>
    adminApiClient.get('/admin/system/config'),
  updateSystemConfig: (config: any) =>
    adminApiClient.put('/admin/system/config', { config }),
  // NOTE: no backend route exists for these yet
  getPerformanceMetrics: () =>
    adminApiClient.get('/admin/metrics/performance'),
  getActivityLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/logs/activity?${queryString}`);
  },
  toggleMaintenance: (data: any) =>
    adminApiClient.post('/admin/system/maintenance', data),
};

export const wordpressAPI = {
  getWordPressOverview: () =>
    adminApiClient.get('/admin/wordpress'),
  getAllSites: () =>
    adminApiClient.get('/admin/wordpress/sites'),
  getSiteById: (siteId: string) =>
    adminApiClient.get(`/admin/wordpress/sites/${siteId}`),
  addSite: (data: any) =>
    adminApiClient.post('/admin/wordpress/sites', data),
  updateSite: (siteId: string, data: any) =>
    adminApiClient.put(`/admin/wordpress/sites/${siteId}`, data),
  deleteSite: (siteId: string) =>
    adminApiClient.delete(`/admin/wordpress/sites/${siteId}`),
  // NOTE: no backend route exists for this yet
  performHealthCheck: (siteId: string) =>
    adminApiClient.post(`/admin/wordpress/sites/${siteId}/health-check`),
  syncSite: (siteId: string) =>
    adminApiClient.post(`/admin/wordpress/sites/${siteId}/sync`),
};

export const supportAPI = {
  getSupportOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/support?${queryString}`);
  },
  getAllTickets: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return adminApiClient.get(`/admin/support/tickets?${queryString}`);
  },
  getTicketDetails: (ticketId: string) =>
    adminApiClient.get(`/admin/support/tickets/${ticketId}`),
  updateTicket: (ticketId: string, data: any) =>
    adminApiClient.put(`/admin/support/tickets/${ticketId}`, data),
  addTicketMessage: (ticketId: string, data: any) =>
    adminApiClient.post(`/admin/support/tickets/${ticketId}/messages`, data),
  // NOTE: no backend route exists for this yet
  getKnowledgeBase: () =>
    adminApiClient.get('/admin/support/knowledge-base'),
};

export const notificationsAPI = {
  getNotifications: (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
    userId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit)      searchParams.append('limit', params.limit.toString());
    if (params?.skip)       searchParams.append('skip', params.skip.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', 'true');
    if (params?.userId)     searchParams.append('userId', params.userId);
    return adminApiClient.get(`/admin/notifications?${searchParams.toString()}`);
  },
  // NOTE: no backend route exists for these yet
  getUnreadCount: () =>
    adminApiClient.get('/admin/notifications/unread-count'),
  // Fixed: backend uses PUT /:notificationId (no /read suffix, not PATCH)
  markAsRead: (id: string) =>
    adminApiClient.put(`/admin/notifications/${id}`, { read: true }),
  // NOTE: no backend route exists for this yet
  markAllAsRead: () =>
    adminApiClient.put('/admin/notifications/mark-all-read'),
  deleteNotification: (id: string) =>
    adminApiClient.delete(`/admin/notifications/${id}`),
  clearAll: () =>
    adminApiClient.delete('/admin/notifications'),
  createNotification: (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    recipientType: 'user' | 'admin' | 'all' | 'role_based';
    recipientId?: string;
    targetRoles?: string[];
  }) => adminApiClient.post('/admin/notifications', data),
  broadcastNotification: (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => adminApiClient.post('/admin/notifications/broadcast', data),
};

export const settingsAPI = {
  getSettings: () =>
    adminApiClient.get('/admin/settings'),
  updateSettings: (settings: any) =>
    adminApiClient.put('/admin/settings', settings),
  getFeatureFlags: () =>
    adminApiClient.get('/admin/settings/features'),
  updateFeatureFlags: (features: any) =>
    adminApiClient.put('/admin/settings/features', features),
};

export const exportAPI = {
  exportUsers: (format: 'json' | 'csv' = 'json') =>
    adminApiClient.get(`/admin/export/users?format=${format}`),
  exportContent: () =>
    adminApiClient.get('/admin/export/content'),
  generateAnalyticsReport: (data: any) =>
    adminApiClient.post('/admin/reports/analytics', data),
};

export const searchAPI = {
  globalSearch: (query: string, type = 'all') =>
    adminApiClient.get(`/admin/search?q=${encodeURIComponent(query)}&type=${type}`),
};

export const filesAPI = {
  getFilesOverview: () =>
    adminApiClient.get('/admin/files'),
  uploadFile: (formData: FormData) =>
    adminApiClient.post('/admin/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteFile: (fileId: string) =>
    adminApiClient.delete(`/admin/files/${fileId}`),
};

export const dashboardAPI = {
  getDashboardData: () =>
    adminApiClient.get('/admin/dashboard'),
  getDashboardAnalytics: (timeRange = '30d') =>
    adminApiClient.get(`/admin/dashboard/analytics?timeRange=${timeRange}`),
  getRealTimeData: () =>
    adminApiClient.get('/admin/dashboard/realtime'),
};

export const adminAPI = {
  analytics:     analyticsAPI,
  users:         userAPI,
  content:       contentAPI,
  ecommerce:     ecommerceAPI,
  financial:     financialAPI,
  system:        systemAPI,
  wordpress:     wordpressAPI,
  support:       supportAPI,
  notifications: notificationsAPI,
  settings:      settingsAPI,
  export:        exportAPI,
  search:        searchAPI,
  files:         filesAPI,
  dashboard:     dashboardAPI,
};

export default adminAPI;