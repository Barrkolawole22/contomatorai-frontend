export interface Keyword {
  id: string;
  term: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent?: KeywordIntent;
  createdAt: string;
  updatedAt: string;
  userId: string;
  parentKeywordId?: string;
  relatedKeywords?: RelatedKeyword[];
  metrics?: KeywordMetrics;
  rankings?: KeywordRanking[];
  notes?: string;
  tags?: string[];
}

export type KeywordIntent = 'informational' | 'navigational' | 'commercial' | 'transactional' | 'mixed';

export interface RelatedKeyword {
  id: string;
  term: string;
  volume: number;
  difficulty: number;
  relationship?: 'variant' | 'question' | 'related' | 'lsi';
}

export interface KeywordMetrics {
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
  trend?: {
    lastMonth: number;
    last3Months: number;
    lastYear: number;
  };
}

export interface KeywordRanking {
  date: string;
  position: number;
  url?: string;
}

export interface KeywordResearchRequest {
  seed: string;
  country?: string;
  language?: string;
  limit?: number;
  includeRelated?: boolean;
  includeQuestions?: boolean;
}

export interface KeywordSuggestion {
  term: string;
  volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent?: KeywordIntent;
}

export interface KeywordCluster {
  id: string;
  name: string;
  mainKeyword: string;
  keywords: Keyword[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface KeywordFilterOptions {
  search?: string;
  minVolume?: number;
  maxVolume?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  intent?: KeywordIntent;
  tag?: string;
  sortBy?: 'volume' | 'difficulty' | 'cpc' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface KeywordListResponse {
  keywords: Keyword[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}