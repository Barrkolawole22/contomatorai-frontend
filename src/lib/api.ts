import axios, { AxiosError, AxiosRequestConfig } from 'axios';

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

const RATE_LIMIT_CONFIG = {
  maxConcurrentRequests: 2,
  requestDelay: 500,
  maxRetries: 3,
  retryDelay: 1000,
  rateLimitCodes: [429, 503],
};

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
    if (this.processing || this.activeRequests >= RATE_LIMIT_CONFIG.maxConcurrentRequests) return;
    const nextRequest = this.queue.shift();
    if (!nextRequest) return;
    this.processing = true;
    if (this.activeRequests > 0) await this.delay(RATE_LIMIT_CONFIG.requestDelay);
    this.processing = false;
    await nextRequest();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const requestQueue = new RequestQueue();

const retryRequest = async (requestFn: () => Promise<any>, attempt = 0): Promise<any> => {
  try {
    return await requestFn();
  } catch (error: any) {
    const isRateLimited = RATE_LIMIT_CONFIG.rateLimitCodes.includes(error.response?.status);
    if (isRateLimited && attempt < RATE_LIMIT_CONFIG.maxRetries) {
      const retryAfter = error.response?.headers['retry-after'];
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : RATE_LIMIT_CONFIG.retryDelay * Math.pow(2, attempt);
      console.log(`⌛ Rate limit hit. Retrying in ${delay}ms (attempt ${attempt + 1}/${RATE_LIMIT_CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, attempt + 1);
    }
    throw error;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const duration = new Date().getTime() - response.config.metadata.startTime.getTime();
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url    = error.config?.url || 'UNKNOWN';
    const status = error.response?.status || 'NETWORK_ERROR';
    console.error(`❌ API Error: ${method} ${url} - Status: ${status}`, {
      message: error.message,
      data: error.response?.data,
    });
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register') && !path.includes('/auth')) {
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

const makeRequest = async (requestConfig: AxiosRequestConfig) =>
  requestQueue.add(() => retryRequest(() => api(requestConfig)));

// ---------- ADMIN API ----------
export const adminAPI = {
  getDashboard: () => makeRequest({ method: 'GET', url: '/admin/dashboard' }),
  getUsers: (params?: {
    page?: number; limit?: number; search?: string; status?: string;
    role?: string; sortBy?: string; sortOrder?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.page)      sp.append('page', params.page.toString());
    if (params?.limit)     sp.append('limit', params.limit.toString());
    if (params?.search)    sp.append('search', params.search);
    if (params?.status)    sp.append('status', params.status);
    if (params?.role)      sp.append('role', params.role);
    if (params?.sortBy)    sp.append('sortBy', params.sortBy);
    if (params?.sortOrder) sp.append('sortOrder', params.sortOrder);
    return makeRequest({ method: 'GET', url: `/admin/users?${sp.toString()}` });
  },
  getUserById:    (id: string) => makeRequest({ method: 'GET',    url: `/admin/users/${id}` }),
  createUser:     (data: any)  => makeRequest({ method: 'POST',   url: '/admin/users', data }),
  updateUser:     (id: string, data: any) => makeRequest({ method: 'PUT', url: `/admin/users/${id}`, data }),
  deleteUser:     (id: string) => makeRequest({ method: 'DELETE', url: `/admin/users/${id}` }),
  bulkUpdateUsers:(data: any)  => makeRequest({ method: 'POST',   url: '/admin/users/bulk', data }),
  getUserAnalytics:(timeframe: '7d' | '30d' | '90d' = '30d') =>
    makeRequest({ method: 'GET', url: '/admin/analytics/users', params: { timeframe } }),
  getSystemStatus: () => makeRequest({ method: 'GET', url: '/admin/system/status' }),
  exportUsers: (format: 'json' | 'csv' = 'json') =>
    makeRequest({ method: 'GET', url: '/admin/export/users', params: { format }, responseType: format === 'json' ? 'json' : 'blob' }),
};

// ---------- SETTINGS API ----------
export const settingsAPI = {
  getSettings: () => makeRequest({ method: 'GET', url: '/settings' }),
  updateProfile: (data: any)       => makeRequest({ method: 'PUT',    url: '/settings/profile', data }),
  updateNotifications: (data: any) => makeRequest({ method: 'PUT',    url: '/settings/notifications', data }),
  updatePreferences: (data: any)   => makeRequest({ method: 'PUT',    url: '/settings/preferences', data }),
  updateApiSettings: (data: any)   => makeRequest({ method: 'PUT',    url: '/settings/api', data }),
  changePassword: (data: any)      => makeRequest({ method: 'POST',   url: '/settings/password', data }),
  exportData: (format: 'json' | 'csv' = 'json') =>
    makeRequest({ method: 'GET', url: '/settings/export', params: { format }, responseType: format === 'json' ? 'json' : 'blob' }),
  deleteAccount: (data: any) => makeRequest({ method: 'DELETE', url: '/settings/account', data }),
};

// ---------- BILLING API ----------
export const billingAPI = {
  /** Returns { subscriptionPlans, topupPackages, currency } filtered by the given currency */
  getWordPackages: (currency?: 'USD' | 'NGN') =>
    makeRequest({ method: 'GET', url: '/billing/packages', params: currency ? { currency } : {} }),

  getBillingInfo: () =>
    makeRequest({ method: 'GET', url: '/billing/info' }),

  /**
   * Start a Paystack transaction.
   * Pass either `planId` (subscription) or `packageId` (topup), plus optional `currency`.
   */
  initializeTransaction: (data: {
    planId?:    string;
    packageId?: string;
    currency?:  'USD' | 'NGN';
  }) => makeRequest({ method: 'POST', url: '/billing/initialize-transaction', data }),

  verifyTransaction: (data: { reference: string }) =>
    makeRequest({ method: 'POST', url: '/billing/verify-transaction', data }),

  getUsageAnalytics: (timeframe: 'day' | 'week' | 'month' | 'all' = 'month') =>
    makeRequest({ method: 'GET', url: '/billing/usage-analytics', params: { timeframe } }),

  /** Update the user's preferred display/payment currency */
  updateCurrency: (currency: 'USD' | 'NGN') =>
    makeRequest({ method: 'PATCH', url: '/billing/currency', data: { currency } }),

  refreshUser: () =>
    makeRequest({ method: 'GET', url: '/billing/refresh-user' }),
};

// ---------- DASHBOARD API ----------
export const dashboardAPI = {
  getAllData: async () => {
    try {
      return await makeRequest({ url: '/dashboard' });
    } catch {
      console.log('🚧 Dashboard endpoint not available, using individual requests...');
      const results = await Promise.allSettled([
        makeRequest({ url: '/content', params: { limit: 100 } }),
        new Promise(r => setTimeout(() => r(makeRequest({ url: '/wordpress' })), 800)),
        new Promise(r => setTimeout(() => r(makeRequest({ url: '/keywords', params: { limit: 100 } })), 1600)),
      ]);
      return {
        data: {
          success: true,
          data: {
            content:  results[0].status === 'fulfilled' ? (results[0] as any).value.data : { success: false, data: [] },
            sites:    results[1].status === 'fulfilled' ? (results[1] as any).value.data : { success: false, data: [] },
            keywords: results[2].status === 'fulfilled' ? (results[2] as any).value.data : { success: false, data: [] },
          },
        },
      };
    }
  },
};

// ---------- AUTH API ----------
export const authAPI = {
  register:       (data: any) => makeRequest({ method: 'POST', url: '/auth/register', data }),
  login:          (data: any) => makeRequest({ method: 'POST', url: '/auth/login', data }),
  getCurrentUser: ()          => makeRequest({ method: 'GET',  url: '/auth/profile' }),
  updateProfile:  (data: any) => makeRequest({ method: 'PUT',  url: '/auth/profile', data }),
  changePassword: (data: any) => makeRequest({ method: 'POST', url: '/auth/change-password', data }),
  logout:         ()          => makeRequest({ method: 'POST', url: '/auth/logout' }),
  createAdmin:    (data: any) => makeRequest({ method: 'POST', url: '/auth/create-admin', data }),
  makeAdmin:      (data: any) => makeRequest({ method: 'POST', url: '/auth/make-admin', data }),
  get:    (url: string, config?: any)        => makeRequest({ method: 'GET',    url, ...config }),
  post:   (url: string, data?: any, config?: any) => makeRequest({ method: 'POST',   url, data, ...config }),
  put:    (url: string, data?: any, config?: any) => makeRequest({ method: 'PUT',    url, data, ...config }),
  patch:  (url: string, data?: any, config?: any) => makeRequest({ method: 'PATCH',  url, data, ...config }),
  delete: (url: string, config?: any)        => makeRequest({ method: 'DELETE', url, ...config }),
};

// ---------- SITES / WORDPRESS API ----------
export const sitesAPI = {
  getUserSites:    ()                  => makeRequest({ method: 'GET',    url: '/wordpress' }),
  getSites:        ()                  => makeRequest({ method: 'GET',    url: '/wordpress' }),
  getSiteById:     (id: string)        => makeRequest({ method: 'GET',    url: `/wordpress/${id}` }),
  addSite:         (data: any)         => makeRequest({ method: 'POST',   url: '/wordpress', data }),
  updateSite:      (id: string, data: any) => makeRequest({ method: 'PUT', url: `/wordpress/${id}`, data }),
  deleteSite:      (id: string)        => makeRequest({ method: 'DELETE', url: `/wordpress/${id}` }),
  testConnection:  (id: string)        => makeRequest({ method: 'POST',   url: `/wordpress/${id}/test` }),
  syncTaxonomies:  (id: string)        => makeRequest({ method: 'POST',   url: `/wordpress/${id}/sync` }),
  getRecentPosts:  (id: string, limit = 10) =>
    makeRequest({ method: 'GET', url: `/wordpress/${id}/posts`, params: { limit } }),
};

// ---------- KEYWORDS API ----------
export const keywordsAPI = {
  research:      (data: any)           => makeRequest({ method: 'POST',   url: '/keywords/research', data }),
  getHistory:    (params?: any)        => {
    const sp = new URLSearchParams();
    if (params?.page)  sp.append('page',  params.page.toString());
    if (params?.limit) sp.append('limit', params.limit.toString());
    return makeRequest({ method: 'GET', url: `/keywords?${sp.toString()}` });
  },
  getById:       (id: string)          => makeRequest({ method: 'GET',    url: `/keywords/${id}` }),
  delete:        (id: string)          => makeRequest({ method: 'DELETE', url: `/keywords/${id}` }),
  getSuggestions:(keyword: string, limit = 10) =>
    makeRequest({ method: 'GET', url: '/keywords/suggestions', params: { keyword, limit } }),
  getStats:      ()                    => makeRequest({ method: 'GET',    url: '/keywords/stats' }),
};

// ---------- CONTENT API ----------
export const contentAPI = {
  generateContent:   (data: any)           => makeRequest({ method: 'POST', url: '/content/generate', data, timeout: 300000 }),
  associateWithSite: (contentId: string, siteId: string) =>
    makeRequest({ method: 'POST', url: '/content/associate-site', data: { contentId, siteId } }),
  getContent: (params?: any) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.siteId) sp.append('siteId', params.siteId);
    if (params?.page)   sp.append('page',   params.page.toString());
    if (params?.limit)  sp.append('limit',  params.limit.toString());
    if (params?.search) sp.append('search', params.search);
    return makeRequest({ method: 'GET', url: `/content?${sp.toString()}` });
  },
  getContentById:  (id: string)           => makeRequest({ method: 'GET',    url: `/content/${id}` }),
  updateContent:   (id: string, data: any)=> makeRequest({ method: 'PUT',    url: `/content/${id}`, data }),
  deleteContent:   (id: string)           => makeRequest({ method: 'DELETE', url: `/content/${id}` }),
  publishContent:  (id: string, data?: any) =>
    makeRequest({ method: 'POST', url: `/content/${id}/publish`, data: data || {}, timeout: 180000 }),
  bulkUpdate:      (data: any)            => makeRequest({ method: 'POST',   url: '/content/bulk', data }),
  getAnalytics:    (contentId: string)    => makeRequest({ method: 'GET',    url: `/content/${contentId}/analytics` }),
  duplicateContent:(id: string)           => makeRequest({ method: 'POST',   url: `/content/${id}/duplicate` }),
  createContent:   (data: any)            => makeRequest({ method: 'POST',   url: '/content', data }),
};

// ---------- BULK CONTENT API ----------
export const bulkContentAPI = {
  generateAndSchedule: (data: {
    entries: Array<{
      keyword: string;
      topic?: string;
      scheduledDate?: string;
      customPrompt?: string;
      additionalContext?: string;
      docIds?: string[];
      dos?: string;
      donts?: string;
    }>;
    options: {
      siteId: string;
      model?: 'gemini' | 'gemini-pro' | 'gpt4o' | 'claude';
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
  }) => makeRequest({ method: 'POST', url: '/bulk-content/generate-and-schedule', data, timeout: 600000 }),

  generate: (data: {
    keywords: string[];
    options: {
      siteId: string;
      model?: 'gemini' | 'gemini-pro' | 'gpt4o' | 'claude';
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
  }) => makeRequest({ method: 'POST', url: '/bulk-content/generate', data, timeout: 600000 }),

  estimate: (data: {
    count: number;
    wordCount?: number;
    model?: 'gemini' | 'gemini-pro' | 'gpt4o' | 'claude';
  }) => makeRequest({ method: 'POST', url: '/bulk-content/estimate', data }),

  getProgress: (operationId: string) =>
    makeRequest({ method: 'GET', url: `/bulk-content/progress/${operationId}` }),

  uploadCSV: (formData: FormData) =>
    makeRequest({
      method: 'POST', url: '/bulk-content/upload-csv', data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  executeCSV: (data: {
    rows: any[];
    options: {
      siteId: string;
      model?: 'gemini' | 'gemini-pro' | 'gpt4o' | 'claude';
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
  }) => makeRequest({ method: 'POST', url: '/bulk-content/execute-csv', data, timeout: 600000 }),
};

// ---------- SITEMAP & INTERNAL LINKS API ----------
export const sitemapAPI = {
  crawlSitemap:   (siteId: string)                => makeRequest({ method: 'POST', url: `/sitemap/${siteId}/crawl`, timeout: 180000 }),
  enrichMetadata: (siteId: string, force = false) => makeRequest({ method: 'POST', url: `/sitemap/${siteId}/enrich`, data: { force }, timeout: 180000 }),
  getIndexedUrls: (params?: any) => {
    const sp = new URLSearchParams();
    if (params?.siteId)  sp.append('siteId',  params.siteId);
    if (params?.page)    sp.append('page',    params.page.toString());
    if (params?.limit)   sp.append('limit',   params.limit.toString());
    if (params?.search)  sp.append('search',  params.search);
    if (params?.status)  sp.append('status',  params.status);
    return makeRequest({ method: 'GET', url: `/sitemap/urls?${sp.toString()}` });
  },
  getUrlById:    (urlId: string)           => makeRequest({ method: 'GET',    url: `/sitemap/urls/${urlId}` }),
  updateUrl:     (urlId: string, data: any)=> makeRequest({ method: 'PUT',    url: `/sitemap/urls/${urlId}`, data }),
  deleteUrl:     (urlId: string)           => makeRequest({ method: 'DELETE', url: `/sitemap/urls/${urlId}` }),
  getSuggestions:(keyword: string, siteId?: string) => {
    const p = new URLSearchParams({ keyword });
    if (siteId) p.append('siteId', siteId);
    return makeRequest({ method: 'GET', url: `/sitemap/suggestions?${p.toString()}` });
  },
  getCrawlStatus:(siteId: string)          => makeRequest({ method: 'GET',    url: `/sitemap/${siteId}/status` }),
  bulkUpdate:    (data: any)               => makeRequest({ method: 'POST',   url: '/sitemap/urls/bulk', data }),
  getStats:      (siteId?: string)         => makeRequest({ method: 'GET',    url: `/sitemap/stats${siteId ? `?siteId=${siteId}` : ''}` }),
  addUrl:        (data: any)               => makeRequest({ method: 'POST',   url: '/sitemap/add-url', data }),
};

// ---------- SCHEDULER API ----------
export const schedulerAPI = {
  schedulePost:        (data: any)              => makeRequest({ method: 'POST', url: '/scheduler/schedule', data }),
  getScheduledPosts:   (params?: any)           => {
    const sp = new URLSearchParams();
    if (params?.siteId)    sp.append('siteId',    params.siteId);
    if (params?.status)    sp.append('status',    params.status);
    if (params?.startDate) sp.append('startDate', params.startDate);
    if (params?.endDate)   sp.append('endDate',   params.endDate);
    if (params?.page)      sp.append('page',      params.page.toString());
    if (params?.limit)     sp.append('limit',     params.limit.toString());
    return makeRequest({ method: 'GET', url: `/scheduler/posts?${sp.toString()}` });
  },
  getScheduledPostById:(scheduleId: string)     => makeRequest({ method: 'GET',  url: `/scheduler/posts/${scheduleId}` }),
  updateSchedule:      (scheduleId: string, data: any) => makeRequest({ method: 'PUT',  url: `/scheduler/posts/${scheduleId}`, data }),
  cancelSchedule:      (scheduleId: string)     => makeRequest({ method: 'POST', url: `/scheduler/posts/${scheduleId}/cancel` }),
  publishNow:          (scheduleId: string)     => makeRequest({ method: 'POST', url: `/scheduler/posts/${scheduleId}/publish-now`, timeout: 180000 }),
  getCalendarView:     (params: any)            => makeRequest({ method: 'GET',  url: '/scheduler/calendar', params }),
  bulkUpdate:          (data: any)              => makeRequest({ method: 'POST', url: '/scheduler/bulk', data }),
  getStats:            (siteId?: string)        => makeRequest({ method: 'GET',  url: `/scheduler/stats${siteId ? `?siteId=${siteId}` : ''}` }),
  bulkSchedule:        (schedules: any[])       => makeRequest({ method: 'POST', url: '/scheduler/bulk-schedule', data: { schedules } }),
  getCalendar:         (startDate: string, endDate: string) =>
    makeRequest({ method: 'GET', url: '/scheduler/calendar', params: { startDate, endDate } }),
};

// ---------- WORDPRESS API ----------
export const wordpressAPI = {
  addSite:        (data: any)              => makeRequest({ method: 'POST',   url: '/wordpress', data }),
  getSites:       ()                       => makeRequest({ method: 'GET',    url: '/wordpress' }),
  getSiteById:    (id: string)             => makeRequest({ method: 'GET',    url: `/wordpress/${id}` }),
  updateSite:     (id: string, data: any)  => makeRequest({ method: 'PUT',    url: `/wordpress/${id}`, data }),
  deleteSite:     (id: string)             => makeRequest({ method: 'DELETE', url: `/wordpress/${id}` }),
  testConnection: (id: string)             => makeRequest({ method: 'POST',   url: `/wordpress/${id}/test` }),
  syncTaxonomies: (id: string)             => makeRequest({ method: 'POST',   url: `/wordpress/${id}/sync` }),
  getRecentPosts: (id: string)             => makeRequest({ method: 'GET',    url: `/wordpress/${id}/posts` }),
};

// ---------- NOTIFICATIONS API ----------
export const notificationAPI = {
  getNotifications: (params?: any) => {
    const sp = new URLSearchParams();
    if (params?.limit)     sp.append('limit',      params.limit.toString());
    if (params?.skip)      sp.append('skip',       params.skip.toString());
    if (params?.unreadOnly)sp.append('unreadOnly', 'true');
    return makeRequest({ method: 'GET', url: `/notifications?${sp.toString()}` });
  },
  getUnreadCount:      ()          => makeRequest({ method: 'GET',    url: '/notifications/unread-count' }),
  markAsRead:          (id: string)=> makeRequest({ method: 'PUT',    url: `/notifications/${id}/read` }),
  markAllAsRead:       ()          => makeRequest({ method: 'PUT',    url: '/notifications/mark-all-read' }),
  deleteNotification:  (id: string)=> makeRequest({ method: 'DELETE', url: `/notifications/${id}` }),
  clearAll:            ()          => makeRequest({ method: 'DELETE', url: '/notifications' }),
};

// ---------- KNOWLEDGEBASE API ----------
export const knowledgebaseAPI = {
  upload: (formData: FormData) =>
    makeRequest({ method: 'POST', url: '/knowledgebase/upload', data: formData, headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  getDocuments:    ()           => makeRequest({ method: 'GET',    url: '/knowledgebase' }),
  getDocumentById: (id: string) => makeRequest({ method: 'GET',    url: `/knowledgebase/${id}` }),
  deleteDocument:  (id: string) => makeRequest({ method: 'DELETE', url: `/knowledgebase/${id}` }),
  searchContext:   (data: any)  => makeRequest({ method: 'POST',   url: '/knowledgebase/search', data }),
};

// ---------- SCRAPER API ----------
export const scraperAPI = {
  extract: (url: string) =>
    makeRequest({ method: 'POST', url: '/scraper/extract', data: { url } }),
};

// ---------- PIPELINE API ----------
export const pipelineAPI = {
  getPipelines:   ()                       => makeRequest({ method: 'GET',    url: '/pipelines' }),
  getRuns:        (pipelineId: string)     => makeRequest({ method: 'GET',    url: `/pipelines/${pipelineId}/runs` }),
  createPipeline: (data: any)              => makeRequest({ method: 'POST',   url: '/pipelines', data }),
  updatePipeline: (id: string, data: any)  => makeRequest({ method: 'PUT',    url: `/pipelines/${id}`, data }),
  triggerPipeline:(id: string)             => makeRequest({ method: 'POST',   url: `/pipelines/${id}/trigger` }),
  deletePipeline: (id: string)             => makeRequest({ method: 'DELETE', url: `/pipelines/${id}` }),
  suggestNiche:   (siteId: string)         => makeRequest({ method: 'GET',    url: '/pipelines/suggest-niche', params: { siteId } }),
};

// ---------- HELPERS ----------
export const apiHelpers = {
  hasUserSites: async (): Promise<boolean> => {
    try {
      const r = await sitesAPI.getSites();
      return r.data.success && r.data.data.length > 0;
    } catch { return false; }
  },
  getDefaultSite: async () => {
    try {
      const r = await sitesAPI.getSites();
      return r.data.success && r.data.data.length > 0 ? r.data.data[0] : null;
    } catch { return null; }
  },
  validateSite: async (siteId: string): Promise<boolean> => {
    try {
      const r = await sitesAPI.testConnection(siteId);
      return r.data.success;
    } catch { return false; }
  },
};

export const getQueueStatus = () => ({
  activeRequests: requestQueue['activeRequests'],
  queueLength:    requestQueue['queue'].length,
});

export default api;