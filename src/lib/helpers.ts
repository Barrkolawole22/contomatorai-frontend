import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to combine class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date to a readable string
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract keywords from text (simple implementation)
 */
export function extractKeywords(text: string, count: number = 10): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get SEO score based on content analysis
 */
export function calculateSEOScore(content: string, keywords: string[]): number {
  let score = 0;
  
  // Check content length (optimal: 300-2000 words)
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 2000) {
    score += 20;
  } else if (wordCount >= 200) {
    score += 10;
  }

  // Check for headings
  const headingMatches = content.match(/#{1,6}\s/g);
  if (headingMatches && headingMatches.length >= 2) {
    score += 15;
  }

  // Check keyword density
  if (keywords.length > 0) {
    const contentLower = content.toLowerCase();
    const keywordDensity = keywords.reduce((acc, keyword) => {
      const keywordCount = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      return acc + keywordCount;
    }, 0) / wordCount;

    if (keywordDensity >= 0.01 && keywordDensity <= 0.03) {
      score += 25;
    } else if (keywordDensity > 0) {
      score += 10;
    }
  }

  // Check for meta description length simulation (first paragraph)
  const firstParagraph = content.split('\n')[0];
  if (firstParagraph && firstParagraph.length >= 120 && firstParagraph.length <= 160) {
    score += 20;
  }

  // Check for internal/external links
  const linkMatches = content.match(/\[.*?\]\(.*?\)/g);
  if (linkMatches && linkMatches.length >= 2) {
    score += 10;
  }

  // Check for images/media references
  const imageMatches = content.match(/!\[.*?\]\(.*?\)/g);
  if (imageMatches && imageMatches.length >= 1) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Generate random ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Download content as file
 */
export function downloadAsFile(content: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and format WordPress URL
 */
export function formatWordPressUrl(url: string): string {
  if (!url) return '';
  
  // Remove trailing slash and ensure proper format
  const cleanUrl = url.replace(/\/$/, '');
  
  // Add protocol if missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return `https://${cleanUrl}`;
  }
  
  return cleanUrl;
}

/**
 * Get difficulty color based on keyword difficulty score
 */
export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 30) return 'text-green-600 bg-green-100';
  if (difficulty <= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

/**
 * Get difficulty label based on keyword difficulty score
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 30) return 'Easy';
  if (difficulty <= 60) return 'Medium';
  return 'Hard';
}

/**
 * Format search volume for display
 */
export function formatSearchVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Get content type icon
 */
export function getContentTypeIcon(type: string): string {
  switch (type) {
    case 'article':
      return '📄';
    case 'post':
      return '📝';
    case 'page':
      return '📋';
    default:
      return '📄';
  }
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'published':
      return 'status-published';
    case 'draft':
      return 'status-draft';
    case 'generating':
      return 'status-generating';
    default:
      return 'status-draft';
  }
}

/**
 * Validate keyword input
 */
export function validateKeywords(keywords: string[]): string | null {
  if (keywords.length === 0) {
    return 'At least one keyword is required';
  }
  
  if (keywords.some(keyword => keyword.trim().length === 0)) {
    return 'Keywords cannot be empty';
  }
  
  if (keywords.some(keyword => keyword.length > 100)) {
    return 'Keywords must be less than 100 characters';
  }
  
  return null;
}

/**
 * Parse keywords from string input
 */
export function parseKeywords(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
}

/**
 * Format CPC (Cost Per Click) for display
 */
export function formatCPC(cpc: number): string {
  return `${cpc.toFixed(2)}`;
}

/**
 * Get trend color and icon
 */
export function getTrendInfo(trend: string): { color: string; icon: string } {
  switch (trend) {
    case 'rising':
      return { color: 'text-green-600', icon: '📈' };
    case 'declining':
      return { color: 'text-red-600', icon: '📉' };
    case 'stable':
    default:
      return { color: 'text-gray-600', icon: '➡️' };
  }
}

/**
 * Calculate content score based on multiple factors
 */
export function calculateContentScore(
  wordCount: number,
  seoScore: number,
  keywordCount: number,
  hasImages: boolean,
  hasHeadings: boolean
): number {
  let score = 0;
  
  // Word count score (30% weight)
  if (wordCount >= 1000) score += 30;
  else if (wordCount >= 500) score += 20;
  else if (wordCount >= 300) score += 15;
  else score += 5;
  
  // SEO score (40% weight)
  score += (seoScore * 0.4);
  
  // Keyword optimization (15% weight)
  if (keywordCount >= 3) score += 15;
  else if (keywordCount >= 1) score += 10;
  else score += 5;
  
  // Content elements (15% weight)
  if (hasImages) score += 7.5;
  if (hasHeadings) score += 7.5;
  
  return Math.min(Math.round(score), 100);
}

/**
 * Generate content suggestions based on keywords
 */
export function generateContentSuggestions(keywords: string[]): string[] {
  const suggestions = [];
  
  for (const keyword of keywords.slice(0, 3)) {
    suggestions.push(`How to ${keyword}: A Complete Guide`);
    suggestions.push(`${keyword}: Everything You Need to Know`);
    suggestions.push(`Top 10 Tips for ${keyword}`);
    suggestions.push(`The Ultimate ${keyword} Tutorial`);
    suggestions.push(`${keyword} vs Alternatives: Which is Better?`);
  }
  
  return suggestions.slice(0, 10);
}