import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// ✅ Fixes the "Property 'metadata' does not exist" errors
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: { startTime: Date };
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api`
    : 'http://localhost:5000/api'
);

// 🚀 RATE LIMITING CONFIGURATION
const RATE_LIMIT_CONFIG = {
  maxConcurrentRequests: 2, // Max simultaneous requests
  requestDelay: 500, // Delay between requests (ms)
  maxRetries: 3, // Max retry attempts
  retryDelay: 1000, // Base retry delay (ms)
  rateLimitCodes: [429, 503], // Status codes to retry
};

// 🚀 REQUEST QUEUE MANAGER
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private processing = false;

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processNext();
        }
      });

      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.activeRequests >= RATE_LIMIT_CONFIG.maxConcurrentRequests) {
      return;
    }

    const nextRequest = this.queue.shift();
    if (!nextRequest) return;

    this.processing = true;
    
    // Add delay between requests
    if (this.activeRequests > 0) {
      await this.delay(RATE_LIMIT_CONFIG.requestDelay);
    }

    this.processing = false;
    await nextRequest();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 🚀 GLOBAL REQUEST QUEUE
const requestQueue = new RequestQueue();

// 🚀 RETRY LOGIC WITH EXPONENTIAL BACKOFF
const retryRequest = async (
  requestFn: () => Promise<any>,
  attempt = 0
): Promise<any> => {
  try {
    return await requestFn();
  } catch (error: any) {
    const isRateLimited = RATE_LIMIT_CONFIG.rateLimitCodes.includes(error.response?.status);
    
    if (isRateLimited && attempt < RATE_LIMIT_CONFIG.maxRetries) {
      const retryAfter = error.response?.headers['retry-after'];
      const delay = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : RATE_LIMIT_CONFIG.retryDelay * Math.pow(2, attempt);

      console.log(`🔄 Rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1}/${RATE_LIMIT_CONFIG.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, attempt + 1);
    }
    
    throw error;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // Default: 2 minutes
});

// 🚀 ENHANCED REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🚀 ENHANCED RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    // Log request timing in development
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const duration = new Date().getTime() - response.config.metadata.startTime.getTime();
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  (error: AxiosError) => {
    // Enhanced error logging
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'UNKNOWN';
    const status = error.response?.status || 'NETWORK_ERROR';

    console.error(`❌ API Error: ${method} ${url} - Status: ${status}`, {
      message: error.message,
      data: error.response?.data,
      headers: error.response?.headers
    });

    // Handle specific Vercel deployment issues
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      console.error('🌐 Network error - likely API URL configuration issue');
      // Don't redirect on network errors, let the component handle it
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on a login/auth page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/auth')) {
        console.log('🔄 Redirecting to login due to 401');
        window.location.href = '/login?error=session_expired';
      }
    }

    return Promise.reject(error);
  }
);

// 🚀 ENHANCED API WRAPPER WITH QUEUING AND RETRY
const makeRequest = async (requestConfig: AxiosRequestConfig) => {
  return requestQueue.add(() => 
    retryRequest(() => api(requestConfig))
  );
};

// 🚀 ADMIN API - COMPLETE INTEGRATION
export const adminAPI = {
  // Dashboard data
  getDashboard: () =>
    makeRequest({ method: 'GET', url: '/admin/dashboard' }),
  
  // User management
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    
    return makeRequest({ 
      method: 'GET', 
      url: `/admin/users?${searchParams.toString()}` 
    });
  },
  
  getUserById: (id: string) =>
    makeRequest({ method: 'GET', url: `/admin/users/${id}` }),
  
  createUser: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    credits?: number;
    emailVerified?: boolean;
  }) =>
    makeRequest({ method: 'POST', url: '/admin/users', data }),
  
  updateUser: (id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    credits?: number;
    emailVerified?: boolean;
  }) =>
    makeRequest({ method: 'PUT', url: `/admin/users/${id}`, data }),
  
  deleteUser: (id: string) =>
    makeRequest({ method: 'DELETE', url: `/admin/users/${id}` }),
  
  bulkUpdateUsers: (data: {
    userIds: string[];
    action: 'status' | 'role' | 'credits';
    value: any;
  }) =>
    makeRequest({ method: 'POST', url: '/admin/users/bulk', data }),
  
  // Analytics
  getUserAnalytics: (timeframe: '7d' | '30d' | '90d' = '30d') =>
    makeRequest({ 
      method: 'GET', 
      url: '/admin/analytics/users',
      params: { timeframe }
    }),
  
  // System status
  getSystemStatus: () =>
    makeRequest({ method: 'GET', url: '/admin/system/status' }),
  
  // Export data
  exportUsers: (format: 'json' | 'csv' = 'json') =>
    makeRequest({ 
      method: 'GET', 
      url: '/admin/export/users',
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    }),
};

// 🚀 SETTINGS API - COMPLETE INTEGRATION
export const settingsAPI = {
  // Get all user settings
  getSettings: () =>
    makeRequest({ method: 'GET', url: '/settings' }),
  
  // Update profile information
  updateProfile: (data: {
    name?: string;
    email?: string;
    bio?: string;
    website?: string;
    company?: string;
    location?: string;
  }) =>
    makeRequest({ method: 'PUT', url: '/settings/profile', data }),
  
  // Update notification preferences
  updateNotifications: (data: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    weeklyReports?: boolean;
    creditAlerts?: boolean;
    articleUpdates?: boolean;
    marketingEmails?: boolean;
  }) =>
    makeRequest({ method: 'PUT', url: '/settings/notifications', data }),
  
  // Update application preferences
  updatePreferences: (data: {
    theme?: 'system' | 'light' | 'dark';
    language?: string;
    timezone?: string;
    defaultContentType?: 'blog' | 'article' | 'social' | 'email' | 'product' | 'landing';
    autoSave?: boolean;
    wordCountDisplay?: boolean;
  }) =>
    makeRequest({ method: 'PUT', url: '/settings/preferences', data }),
  
  // Update API settings
  updateApiSettings: (data: {
    rateLimit?: number;
    webhookUrl?: string;
    enableWebhooks?: boolean;
    regenerateApiKey?: boolean;
  }) =>
    makeRequest({ method: 'PUT', url: '/settings/api', data }),
  
  // Change password
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    makeRequest({ method: 'POST', url: '/settings/password', data }),
  
  // Export user data
  exportData: (format: 'json' | 'csv' = 'json') =>
    makeRequest({ 
      method: 'GET', 
      url: '/settings/export', 
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    }),
  
  // Delete account
  deleteAccount: (data: { confirmPassword: string }) =>
    makeRequest({ method: 'DELETE', url: '/settings/account', data }),
};

// 🚀 BILLING API - PAYSTACK INTEGRATION
export const billingAPI = {
  // Get available word packages
  getWordPackages: () =>
    makeRequest({ method: 'GET', url: '/billing/packages' }),
  
  // Get user's billing information
  getBillingInfo: () =>
    makeRequest({ method: 'GET', url: '/billing/info' }),
  
  // PAYSTACK: Initialize transaction
  initializeTransaction: (data: { packageId: string }) =>
    makeRequest({ method: 'POST', url: '/billing/initialize-transaction', data }),
  
  // PAYSTACK: Verify transaction
  verifyTransaction: (data: { reference: string }) =>
    makeRequest({ method: 'POST', url: '/billing/verify-transaction', data }),
  
  // Get word usage analytics
  getUsageAnalytics: (timeframe: 'day' | 'week' | 'month' | 'all' = 'month') =>
    makeRequest({ 
      method: 'GET', 
      url: '/billing/usage-analytics',
      params: { timeframe }
    }),
};

// 🚀 DASHBOARD-SPECIFIC API (OPTIMIZED)
export const dashboardAPI = {
  // Single endpoint to get all dashboard data
  getAllData: async () => {
    try {
      // Try to fetch from a single dashboard endpoint first
      return await makeRequest({ url: '/dashboard' });
    } catch (error: any) {
      // Fallback to individual requests with staggered timing
      console.log('📊 Dashboard endpoint not available, using individual requests...');
      
      const results = await Promise.allSettled([
        makeRequest({ url: '/content', params: { limit: 100 } }),
        new Promise(resolve => setTimeout(() => resolve(makeRequest({ url: '/wordpress' })), 800)),
        new Promise(resolve => setTimeout(() => resolve(makeRequest({ url: '/keywords', params: { limit: 100 } })), 1600)),
      ]);

      // ✅ Fixes the "Property 'data' does not exist on type 'unknown'" error
      return {
        data: {
          success: true,
          data: {
            content: results[0].status === 'fulfilled' ? (results[0] as any).value.data : { success: false, data: [] },
            sites: results[1].status === 'fulfilled' ? (results[1] as any).value.data : { success: false, data: [] },
            keywords: results[2].status === 'fulfilled' ? (results[2] as any).value.data : { success: false, data: [] },
          }
        }
      };
    }
  },
};

// Auth API - Enhanced with admin methods
export const authAPI = {
  register: (data: { email: string; password: string; name: string; confirmPassword: string }) =>
    makeRequest({ method: 'POST', url: '/auth/register', data }),
  
  login: (data: { email: string; password: string }) =>
    makeRequest({ method: 'POST', url: '/auth/login', data }),
  
  getCurrentUser: () =>
    makeRequest({ method: 'GET', url: '/auth/profile' }),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    makeRequest({ method: 'PUT', url: '/auth/profile', data }),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    makeRequest({ method: 'POST', url: '/auth/change-password', data }),

  logout: () =>
    makeRequest({ method: 'POST', url: '/auth/logout' }),

  // Admin authentication methods
  createAdmin: (data: { email: string; password: string; name: string; confirmPassword: string }) =>
    makeRequest({ method: 'POST', url: '/auth/create-admin', data }),
  
  makeAdmin: (data: { email: string }) =>
    makeRequest({ method: 'POST', url: '/auth/make-admin', data }),

  // ADMIN ENDPOINTS - Integrate with admin API
  get: (url: string, config?: any) => makeRequest({ method: 'GET', url, ...config }),
  post: (url: string, data?: any, config?: any) => makeRequest({ method: 'POST', url, data, ...config }),
  put: (url: string, data?: any, config?: any) => makeRequest({ method: 'PUT', url, data, ...config }),
  patch: (url: string, data?: any, config?: any) => makeRequest({ method: 'PATCH', url, data, ...config }),
  delete: (url: string, config?: any) => makeRequest({ method: 'DELETE', url, ...config }),
};

// 🔧 ENHANCED SITES API - Fixed to use correct endpoints
export const sitesAPI = {
  // Get user's sites - use the WordPress endpoint instead of /sites/user
  getUserSites: () =>
    makeRequest({ method: 'GET', url: '/wordpress' }),

  // Original WordPress API endpoints
  getSites: () =>
    makeRequest({ method: 'GET', url: '/wordpress' }),
  
  getSiteById: (id: string) =>
    makeRequest({ method: 'GET', url: `/wordpress/${id}` }),
  
  // Enhanced add site
  addSite: (data: {
    name: string;
    url: string;
    apiUrl: string;
    username: string;
    applicationPassword: string;
  }) =>
    makeRequest({ method: 'POST', url: '/wordpress', data }),
  
  updateSite: (id: string, data: Partial<{
    name: string;
    url: string;
    apiUrl: string;
    username: string;
    applicationPassword: string;
  }>) =>
    makeRequest({ method: 'PUT', url: `/wordpress/${id}`, data }),
  
  deleteSite: (id: string) =>
    makeRequest({ method: 'DELETE', url: `/wordpress/${id}` }),
  
  // Test site connection
  testConnection: (id: string ) =>
    makeRequest({ method: 'POST', url: `/wordpress/${id}/test` }),
  
  syncTaxonomies: (id: string) =>
    makeRequest({ method: 'POST', url: `/wordpress/${id}/sync` }),
  
  getRecentPosts: (id: string, limit = 10) =>
    makeRequest({ method: 'GET', url: `/wordpress/${id}/posts`, params: { limit } }),
};

// Keywords API
export const keywordsAPI = {
  research: (data: {
    keyword: string;
    country?: string;
    language?: string;
  }) =>
    makeRequest({ method: 'POST', url: '/keywords/research', data }),
  
  getHistory: (params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    return makeRequest({ 
      method: 'GET', 
      url: `/keywords?${searchParams.toString()}` 
    });
  },
  
  getById: (id: string) =>
    makeRequest({ method: 'GET', url: `/keywords/${id}` }),
  
  delete: (id: string) =>
    makeRequest({ method: 'DELETE', url: `/keywords/${id}` }),
  
  getSuggestions: (keyword: string, limit = 10) =>
    makeRequest({ 
      method: 'GET', 
      url: '/keywords/suggestions', 
      params: { keyword, limit } 
    }),
  
  getStats: () =>
    makeRequest({ method: 'GET', url: '/keywords/stats' }),
};

// 🔧 ENHANCED CONTENT API - ✅ FIXED TIMEOUT FOR CONTENT GENERATION
export const contentAPI = {
  // ✅ UPDATED: 5-minute timeout specifically for content generation
  generateContent: (data: {
    keyword: string;
    siteId?: string | null;
    options?: {
      tone?: string;
      wordCount?: number;
      targetAudience?: string;
      includeHeadings?: boolean;
      includeIntroduction?: boolean;
      includeConclusion?: boolean;
      includeFAQ?: boolean;
      extraInstructions?: string;
      contentIntent?: string;
      customPrompt?: string;
      additionalContext?: string;
      writingStyle?: string;
      seoFocus?: string;
      callToAction?: string;
      includeStatistics?: boolean;
      includeExamples?: boolean;
      includeComparisons?: boolean;
      targetKeywordDensity?: number;
    };
  }) =>
    makeRequest({ 
      method: 'POST', 
      url: '/content/generate', 
      data,
      timeout: 300000 // ✅ 5 MINUTES for AI content generation
    }),
  
  // New: Associate content with a site after generation
  associateWithSite: (contentId: string, siteId: string) =>
    makeRequest({ 
      method: 'POST', 
      url: '/content/associate-site', 
      data: { contentId, siteId } 
    }),
  
  getContent: (params?: {
    status?: string;
    siteId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.siteId) searchParams.append('siteId', params.siteId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    return makeRequest({ 
      method: 'GET', 
      url: `/content?${searchParams.toString()}` 
    });
  },
  
  getContentById: (id: string) =>
    makeRequest({ method: 'GET', url: `/content/${id}` }),
  
  updateContent: (id: string, data: {
    title?: string;
    content?: string;
    excerpt?: string;
    metaDescription?: string;
    slug?: string;
    status?: string; // ✅ Changed from strict literal types to string
    scheduledFor?: string;
    tags?: string[];
    keyword?: string;
  }) =>
    makeRequest({ method: 'PUT', url: `/content/${id}`, data }),
  
  deleteContent: (id: string) =>
    makeRequest({ method: 'DELETE', url: `/content/${id}` }),
  
  publishContent: (id: string, data?: {
    publishDate?: string;
    status?: string;
    siteId?: string;
  }) =>
    makeRequest({ 
      method: 'POST', 
      url: `/content/${id}/publish`, 
      data: data || {},
      timeout: 180000 // 3 minutes for publishing
    }),

  // New: Bulk operations
  bulkUpdate: (data: {
    contentIds: string[];
    action: 'status' | 'site' | 'delete';
    value?: any;
  }) =>
    makeRequest({ method: 'POST', url: '/content/bulk', data }),

  // New: Content analytics
  getAnalytics: (contentId: string) =>
    makeRequest({ method: 'GET', url: `/content/${contentId}/analytics` }),

  // ✅ Added missing endpoints required by your frontend components
  duplicateContent: (id: string) => 
    makeRequest({ method: 'POST', url: `/content/${id}/duplicate` }),
    
  createContent: (data: any) => 
    makeRequest({ method: 'POST', url: '/content', data }),
};

// ✅ NEW: BULK CONTENT API - INTEGRATED FROM DOCUMENT 1
export const bulkContentAPI = {
  /**
   * Generate and schedule multiple articles in one operation
   * This is your main bulk endpoint
   */
  generateAndSchedule: (data: {
    entries: Array<{
      keyword: string;
      scheduledDate?: string;
      customPrompt?: string;
      additionalContext?: string;
    }>;
    options: {
      siteId: string;
      model?: 'groq' | 'gemini' | 'claude';
      tone?: string;
      wordCount?: number;
      targetAudience?: string;
      includeIntroduction?: boolean;
      includeConclusion?: boolean;
      includeFAQ?: boolean;
      contentIntent?: 'informational' | 'navigational' | 'commercial' | 'transactional';
      writingStyle?: 'conversational' | 'academic' | 'journalistic' | 'technical' | 'creative';
      seoFocus?: 'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced';
      callToAction?: string;
      includeStatistics?: boolean;
      includeExamples?: boolean;
      includeComparisons?: boolean;
      targetKeywordDensity?: number;
      includeInternalLinks?: boolean;
      internalLinkDensity?: number;
      maxInternalLinks?: number;
      timezone?: string;
    };
  }) =>
    makeRequest({ 
      method: 'POST', 
      url: '/bulk-content/generate-and-schedule', 
      data,
      timeout: 600000 // 10 minutes for bulk operations
    }),

  /**
   * Simple bulk generation - all as drafts (no scheduling)
   */
  generate: (data: {
    keywords: string[];
    options: {
      siteId: string;
      model?: 'groq' | 'gemini' | 'claude';
      tone?: string;
      wordCount?: number;
      targetAudience?: string;
      includeIntroduction?: boolean;
      includeConclusion?: boolean;
      includeFAQ?: boolean;
      contentIntent?: 'informational' | 'navigational' | 'commercial' | 'transactional';
      writingStyle?: 'conversational' | 'academic' | 'journalistic' | 'technical' | 'creative';
      seoFocus?: 'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced';
      callToAction?: string;
      includeStatistics?: boolean;
      includeExamples?: boolean;
      includeComparisons?: boolean;
      targetKeywordDensity?: number;
      includeInternalLinks?: boolean;
      internalLinkDensity?: number;
      maxInternalLinks?: number;
    };
  }) =>
    makeRequest({ 
      method: 'POST', 
      url: '/bulk-content/generate', 
      data,
      timeout: 600000 // 10 minutes for bulk operations
    }),

  /**
   * Estimate credits needed for bulk operation
   */
  estimate: (data: {
    count: number;
    wordCount?: number;
    model?: 'groq' | 'gemini' | 'claude';
  }) =>
    makeRequest({ method: 'POST', url: '/bulk-content/estimate', data }),

  /**
   * Get progress of bulk operation (for real-time updates)
   */
  getProgress: (operationId: string) =>
    makeRequest({ method: 'GET', url: `/bulk-content/progress/${operationId}` }),
};

// 🔗 SITEMAP & INTERNAL LINKS API
export const sitemapAPI = {
  // Crawl sitemap for a WordPress site
  crawlSitemap: (siteId: string) =>
    makeRequest({ 
      method: 'POST', 
      url: `/sitemap/${siteId}/crawl`,
      timeout: 180000 // 3 minutes for crawling
    }),
  
    // ✅ NEW: Re-enrich metadata for URLs (fetch titles, descriptions, keywords)
enrichMetadata: (siteId: string, force: boolean = false) =>
  makeRequest({ 
    method: 'POST', 
    url: `/sitemap/${siteId}/enrich`,
    data: { force },
    timeout: 180000 // 3 minutes for enrichment
  }),
  
  // Get all indexed URLs
  getIndexedUrls: (params?: {
    siteId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'error';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.siteId) searchParams.append('siteId', params.siteId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    
    return makeRequest({ 
      method: 'GET', 
      url: `/sitemap/urls?${searchParams.toString()}` 
    });
  },
  
  // Get indexed URL by ID
  getUrlById: (urlId: string) =>
    makeRequest({ method: 'GET', url: `/sitemap/urls/${urlId}` }),
  
  // Update indexed URL
  updateUrl: (urlId: string, data: {
    title?: string;
    description?: string;
    keywords?: string[];
    status?: 'active' | 'inactive';
  }) =>
    makeRequest({ method: 'PUT', url: `/sitemap/urls/${urlId}`, data }),
  
  // Delete indexed URL
  deleteUrl: (urlId: string) =>
    makeRequest({ method: 'DELETE', url: `/sitemap/urls/${urlId}` }),
  
  // Get internal link suggestions for a keyword
  getSuggestions: (keyword: string, siteId?: string) => {
    const params = new URLSearchParams({ keyword });
    if (siteId) params.append('siteId', siteId);
    
    return makeRequest({ 
      method: 'GET', 
      url: `/sitemap/suggestions?${params.toString()}` 
    });
  },
  
  // Get sitemap crawl status
  getCrawlStatus: (siteId: string) =>
    makeRequest({ method: 'GET', url: `/sitemap/${siteId}/status` }),
  
  // Bulk operations
  bulkUpdate: (data: {
    urlIds: string[];
    action: 'activate' | 'deactivate' | 'delete';
  }) =>
    makeRequest({ method: 'POST', url: '/sitemap/urls/bulk', data }),
  
  // Get statistics
  getStats: (siteId?: string) => {
    const params = siteId ? `?siteId=${siteId}` : '';
    return makeRequest({ method: 'GET', url: `/sitemap/stats${params}` });
  }
};

// 📅 POST SCHEDULER API
export const schedulerAPI = {
  // Schedule a post
  schedulePost: (data: {
    contentId: string;
    siteId: string;
    scheduledFor: string; // ISO 8601 datetime
    timezone?: string;
    autoPublish?: boolean;
    notifyOnPublish?: boolean;
  }) =>
    makeRequest({ method: 'POST', url: '/scheduler/schedule', data }),
  
  // Get all scheduled posts
  getScheduledPosts: (params?: {
    siteId?: string;
    status?: 'pending' | 'published' | 'failed' | 'cancelled';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.siteId) searchParams.append('siteId', params.siteId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    return makeRequest({ 
      method: 'GET', 
      url: `/scheduler/posts?${searchParams.toString()}` 
    });
  },
  
  // Get scheduled post by ID
  getScheduledPostById: (scheduleId: string) =>
    makeRequest({ method: 'GET', url: `/scheduler/posts/${scheduleId}` }),
  
  // Update scheduled post
  updateSchedule: (scheduleId: string, data: {
    scheduledFor?: string;
    timezone?: string;
    autoPublish?: boolean;
    notifyOnPublish?: boolean;
  }) =>
    makeRequest({ method: 'PUT', url: `/scheduler/posts/${scheduleId}`, data }),
  
  // Cancel scheduled post
  cancelSchedule: (scheduleId: string) =>
    makeRequest({ method: 'POST', url: `/scheduler/posts/${scheduleId}/cancel` }),
  
  // Manually trigger publish
  publishNow: (scheduleId: string) =>
    makeRequest({ 
      method: 'POST', 
      url: `/scheduler/posts/${scheduleId}/publish-now`,
      timeout: 180000 // 3 minutes for publishing
    }),
  
  // Get calendar view data
  getCalendarView: (params: {
    siteId?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
  }) =>
    makeRequest({ 
      method: 'GET', 
      url: '/scheduler/calendar',
      params
    }),
  
  // Bulk operations
  bulkUpdate: (data: {
    scheduleIds: string[];
    action: 'cancel' | 'reschedule' | 'publish';
    scheduledFor?: string;
  }) =>
    makeRequest({ method: 'POST', url: '/scheduler/bulk', data }),
  
  // Get scheduler statistics
  getStats: (siteId?: string) => {
    const params = siteId ? `?siteId=${siteId}` : '';
    return makeRequest({ method: 'GET', url: `/scheduler/stats${params}` });
  },

  // ✅ INTEGRATED: Additional scheduler methods from Document 1
  bulkSchedule: (schedules: Array<{
    contentId: string;
    scheduledDate: string;
  }>) =>
    makeRequest({ method: 'POST', url: '/scheduler/bulk-schedule', data: { schedules } }),
  
  getCalendar: (startDate: string, endDate: string) => 
    makeRequest({ 
      method: 'GET', 
      url: '/scheduler/calendar', 
      params: { startDate, endDate } 
    }),
};

// ✅ INTEGRATED: WordPress API from Document 1
export const wordpressAPI = {
  addSite: (data: any) =>
    makeRequest({ method: 'POST', url: '/wordpress', data }),
  
  getSites: () =>
    makeRequest({ method: 'GET', url: '/wordpress' }),
  
  getSiteById: (id: string) =>
    makeRequest({ method: 'GET', url: `/wordpress/${id}` }),
  
  updateSite: (id: string, data: any) =>
    makeRequest({ method: 'PUT', url: `/wordpress/${id}`, data }),
  
  deleteSite: (id: string) =>
    makeRequest({ method: 'DELETE', url: `/wordpress/${id}` }),
  
  testConnection: (id: string) =>
    makeRequest({ method: 'POST', url: `/wordpress/${id}/test` }),
  
  syncTaxonomies: (id: string) =>
    makeRequest({ method: 'POST', url: `/wordpress/${id}/sync` }),
  
  getRecentPosts: (id: string) =>
    makeRequest({ method: 'GET', url: `/wordpress/${id}/posts` }),
};

// 🔔 NOTIFICATIONS API
export const notificationAPI = {
  // Get all notifications
  getNotifications: (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', 'true');
    
    return makeRequest({ 
      method: 'GET', 
      url: `/notifications?${searchParams.toString()}` 
    });
  },

  // Get unread count
  getUnreadCount: () =>
    makeRequest({ method: 'GET', url: '/notifications/unread-count' }),

  // Mark notification as read
  markAsRead: (id: string) =>
    makeRequest({ method: 'PUT', url: `/notifications/${id}/read` }),

  // Mark all as read
  markAllAsRead: () =>
    makeRequest({ method: 'PUT', url: '/notifications/mark-all-read' }),

  // Delete notification
  deleteNotification: (id: string) =>
    makeRequest({ method: 'DELETE', url: `/notifications/${id}` }),

  // Clear all notifications
  clearAll: () =>
    makeRequest({ method: 'DELETE', url: '/notifications' }),
};

// 🔧 NEW: HELPER FUNCTIONS FOR FRONTEND
export const apiHelpers = {
  // Check if user has any sites
  hasUserSites: async (): Promise<boolean> => {
    try {
      const response = await sitesAPI.getSites();
      return response.data.success && response.data.data.length > 0;
    } catch (error) {
      console.error('Error checking user sites:', error);
      return false;
    }
  },

  // Get user's first site (for default selection)
  getDefaultSite: async () => {
    try {
      const response = await sitesAPI.getSites();
      if (response.data.success && response.data.data.length > 0) {
        return response.data.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting default site:', error);
      return null;
    }
  },

  // Validate site before content generation
  validateSite: async (siteId: string): Promise<boolean> => {
    try {
      const response = await sitesAPI.testConnection(siteId);
      return response.data.success;
    } catch (error) {
      console.error('Error validating site:', error);
      return false;
    }
  }
};

// 🚀 EXPORT REQUEST QUEUE STATUS (for debugging)
export const getQueueStatus = () => ({
  activeRequests: requestQueue['activeRequests'],
  queueLength: requestQueue['queue'].length,
});

export default api;