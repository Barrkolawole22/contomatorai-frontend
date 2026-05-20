// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'expired';
    expiresAt?: string;
  };
  preferences?: {
    defaultTone: 'professional' | 'casual' | 'friendly' | 'authoritative';
    defaultLength: 'short' | 'medium' | 'long';
    autoSave: boolean;
    notifications: boolean;
  };
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Content Types
export interface ContentItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  type: 'article' | 'post' | 'page';
  status: 'draft' | 'published' | 'generating' | 'error';
  keywords: string[];
  seoScore?: number;
  wordCount: number;
  readingTime: number;
  slug: string;
  featuredImage?: string;
  metaDescription?: string;
  tags: string[];
  wordpressPostId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ContentGenerationParams {
  topic: string;
  keywords: string[];
  contentType: 'article' | 'post' | 'page';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  length: 'short' | 'medium' | 'long';
  includeIntroduction: boolean;
  includeConclusion: boolean;
  includeHeadings: boolean;
  targetAudience?: string;
  callToAction?: string;
  outline?: string[];
}

export interface ContentUpdateData {
  title?: string;
  content?: string;
  excerpt?: string;
  keywords?: string[];
  tags?: string[];
  metaDescription?: string;
  featuredImage?: string;
  status?: 'draft' | 'published';
}

// Keyword Types
export interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'declining';
  relatedKeywords: string[];
  createdAt: string;
  userId: string;
  saved?: boolean;
}

export interface KeywordResearchParams {
  seedKeyword: string;
  location?: string;
  language?: string;
  includeRelated?: boolean;
  maxResults?: number;
  minSearchVolume?: number;
  maxDifficulty?: number;
}

export interface KeywordAnalysisResult {
  keywords: Keyword[];
  suggestions: string[];
  competitorKeywords: string[];
  longtailOpportunities: string[];
  searchTrends: {
    keyword: string;
    trend: number[];
    timeframe: string[];
  }[];
}

// WordPress Types
export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  isConnected: boolean;
  lastSync?: string;
  postsCount?: number;
  createdAt: string;
  userId: string;
}

export interface WordPressPost {
  id: string;
  title: string;
  content: string;
  status: 'publish' | 'draft' | 'private';
  slug: string;
  excerpt?: string;
  featuredMedia?: string;
  categories: string[];
  tags: string[];
  publishedAt?: string;
  wordpressId: number;
  siteId: string;
}

export interface WordPressConnectionData {
  name: string;
  url: string;
  username: string;
  password: string;
}

export interface PublishToWordPressParams {
  siteId: string;
  contentId: string;
  publishImmediately?: boolean;
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  totalKeywords: number;
  avgSeoScore: number;
  contentThisMonth: number;
  keywordsThisMonth: number;
  topPerformingContent: ContentItem[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'content_created' | 'content_published' | 'keyword_researched' | 'site_connected';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Sitemap & Internal Links Types
export interface IndexedUrl {
  id: string;
  siteId: string;
  url: string;
  title: string;
  description?: string;
  keywords: string[];
  status: 'active' | 'inactive' | 'error';
  lastCrawled: string;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
  siteName?: string;
  errorMessage?: string;
}

export interface SitemapCrawlStatus {
  siteId: string;
  status: 'idle' | 'crawling' | 'completed' | 'error';
  progress: number;
  totalUrls: number;
  processedUrls: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface InternalLinkSuggestion {
  url: string;
  title: string;
  relevanceScore: number;
  excerpt?: string;
  keywords: string[];
}

export interface SitemapStats {
  totalUrls: number;
  activeUrls: number;
  inactiveUrls: number;
  errorUrls: number;
  lastCrawl?: string;
  avgRelevanceScore?: number;
}

// Scheduler Types
export interface ScheduledPost {
  id: string;
  contentId: string;
  siteId: string;
  userId: string;
  scheduledFor: string;
  timezone: string;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  autoPublish: boolean;
  notifyOnPublish: boolean;
  publishedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  content?: ContentItem;
  site?: WordPressSite;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  contentId: string;
  siteId: string;
  siteName: string;
}

export interface SchedulerStats {
  totalScheduled: number;
  pendingPosts: number;
  publishedToday: number;
  failedPosts: number;
  upcomingThisWeek: number;
}

export interface ScheduleFormData {
  contentId: string;
  siteId: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  autoPublish: boolean;
  notifyOnPublish: boolean;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | undefined;
}

// Settings Types
export interface UserSettings {
  general: {
    name: string;
    email: string;
    timezone: string;
    language: string;
  };
  content: {
    defaultTone: 'professional' | 'casual' | 'friendly' | 'authoritative';
    defaultLength: 'short' | 'medium' | 'long';
    autoSave: boolean;
    includeIntroduction: boolean;
    includeConclusion: boolean;
    includeHeadings: boolean;
  };
  seo: {
    defaultMetaDescriptionLength: number;
    focusKeywordDensity: number;
    enableSeoAnalysis: boolean;
  };
  wordpress: {
    defaultCategories: string[];
    defaultTags: string[];
    publishImmediately: boolean;
  };
  notifications: {
    email: boolean;
    contentGenerated: boolean;
    keywordAlerts: boolean;
    weeklyReports: boolean;
  };
}

export interface SettingsUpdateData {
  section: keyof UserSettings;
  data: Partial<UserSettings[keyof UserSettings]>;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Hook Return Types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  type?: 'article' | 'post' | 'page' | 'all';
  status?: 'draft' | 'published' | 'all';
  dateFrom?: string;
  dateTo?: string;
  keywords?: string[];
  minSeoScore?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'seoScore';
  sortDirection?: 'asc' | 'desc';
}

export interface KeywordFilters {
  query?: string;
  minSearchVolume?: number;
  maxDifficulty?: number;
  competition?: 'low' | 'medium' | 'high' | 'all';
  trend?: 'rising' | 'stable' | 'declining' | 'all';
  sortBy?: 'searchVolume' | 'difficulty' | 'cpc' | 'keyword';
  sortDirection?: 'asc' | 'desc';
}

// Export/Import Types
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeContent?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ImportData {
  file: File;
  type: 'keywords' | 'content';
  mappings?: Record<string, string>;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// ---------- NEW KNOWLEDGEBASE & CSV TYPES ----------
export interface KnowledgeDoc {
  id: string;
  userId: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: 'docx' | 'txt';
  fileSize: number;
  status: 'processing' | 'ready' | 'failed';
  processingError?: string;
  totalChunks: number;
  totalWords: number;
  createdAt: string;
  updatedAt: string;
}

export interface CSVRow {
  topic: string;
  keyword: string;
  tags?: string;
  publish_date?: string;
  doc_ids?: string;
  dos?: string;
  donts?: string;
}

export interface CSVParseResult {
  rows: CSVRow[];
  totalRows: number;
  estimatedCredits: number;
  errors: string[];
}