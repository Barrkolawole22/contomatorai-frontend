'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import { contentAPI } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Share2,
  Copy,
  Globe,
  Calendar,
  Clock,
  Eye,
  BarChart3,
  FileText,
  Tag,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  BookOpen,
  Target
} from 'lucide-react';
import { Content } from '@/types/content.types';

// Safe HTML Content Renderer Component - Fixed for consistency
const RichContentRenderer = ({ content }: { content: string }) => {
  const processArticleContent = (content: string) => {
    if (!content) return '';
    
    // Clean the content and preserve existing styling - do NOT add default classes if classes already exist
    let processedContent = content
      // Remove potentially harmful content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .trim();

    // ONLY apply default styling if NO classes exist anywhere in the content
    // This prevents double-processing of content that already has classes from the editor
    const hasClasses = /class\s*=\s*["'][^"']*["']/i.test(processedContent);
    
    if (hasClasses) {
      // Content already has classes from editor, return as-is
      return processedContent;
    }

    // Only apply default styling if no classes exist
    processedContent = processedContent
      // Style headings - only if they don't have classes
      .replace(/<h1(?![^>]*class=)([^>]*?)>/gi, '<h1$1 class="text-4xl font-bold text-gray-900 dark:text-white mt-12 mb-8 pb-4 border-b-2 border-primary-300 dark:border-primary-700 leading-tight">')
      .replace(/<h2(?![^>]*class=)([^>]*?)>/gi, '<h2$1 class="text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-8 pb-3 border-b-2 border-primary-200 dark:border-primary-800 leading-tight">')
      .replace(/<h3(?![^>]*class=)([^>]*?)>/gi, '<h3$1 class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700 leading-tight">')
      .replace(/<h4(?![^>]*class=)([^>]*?)>/gi, '<h4$1 class="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4 leading-tight">')
      .replace(/<h5(?![^>]*class=)([^>]*?)>/gi, '<h5$1 class="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-4 leading-tight">')
      
      // Style paragraphs - only if they don't have classes
      .replace(/<p(?![^>]*class=)>/gi, '<p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-base">')
      
      // Style text formatting - only if they don't have classes
      .replace(/<strong(?![^>]*class=)>/gi, '<strong class="font-semibold text-gray-900 dark:text-white">')
      .replace(/<b(?![^>]*class=)>/gi, '<strong class="font-semibold text-gray-900 dark:text-white">')
      .replace(/<em(?![^>]*class=)>/gi, '<em class="italic">')
      .replace(/<i(?![^>]*class=)>/gi, '<em class="italic">')
      
      // Style links - add attributes if missing and no classes
      .replace(/<a\s+href="([^"]*)"([^>]*?)>/gi, (match, href, attrs) => {
        if (attrs.includes('class=')) return match; // Already has classes
        
        let linkAttrs = attrs;
        if (!linkAttrs.includes('target=')) linkAttrs += ' target="_blank"';
        if (!linkAttrs.includes('rel=')) linkAttrs += ' rel="noopener noreferrer"';
        linkAttrs += ' class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 underline font-medium transition-colors"';
        return `<a href="${href}"${linkAttrs}>`;
      })
      
      // Style blockquotes - only if they don't have classes
      .replace(/<blockquote(?![^>]*class=)>/gi, '<blockquote class="border-l-4 border-primary-500 dark:border-primary-400 pl-6 py-4 my-6 bg-primary-50 dark:bg-primary-900/20 italic text-gray-700 dark:text-gray-300 rounded-r-lg">')
      
      // Style lists - only if they don't have classes
      .replace(/<ul(?![^>]*class=)>/gi, '<ul class="list-disc list-inside space-y-2 my-6 pl-4">')
      .replace(/<ol(?![^>]*class=)>/gi, '<ol class="list-decimal list-inside space-y-2 my-6 pl-4">')
      .replace(/<li(?![^>]*class=)>/gi, '<li class="text-gray-700 dark:text-gray-300 leading-relaxed">')
      
      // Style code - only if they don't have classes
      .replace(/<code(?![^>]*class=)>/gi, '<code class="bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-1 py-0.5 rounded text-sm font-mono">')
      .replace(/<pre(?![^>]*class=)>/gi, '<pre class="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg my-6 overflow-x-auto">')
      
      // Style horizontal rules
      .replace(/<hr>/gi, '<hr class="my-8 border-gray-300 dark:border-gray-600">');

    return processedContent;
  };

  const cleanContent = processArticleContent(content);

  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <div 
        className="article-content"
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />
    </div>
  );
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [article, setArticle] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  
  // Publishing success info from URL params
  const publishedNow = searchParams.get('published') === 'true';
  const wordpressUrl = searchParams.get('wordpressUrl') || '';
  const postId = searchParams.get('postId') || '';
  const siteName = searchParams.get('siteName') || '';
  const publishedAt = searchParams.get('publishedAt') || '';

  console.log('🔍 URL Params:', { publishedNow, wordpressUrl, postId, siteName, publishedAt });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Preview Page Debug:', {
      publishedNow,
      wordpressUrl,
      postId,
      siteName,
      publishedAt,
      articleStatus: article?.status,
      articlePublishedAt: article?.publishedAt,
      articleWordpressSite: article?.wordpressSite,
      articlePublishedUrl: article?.publishedUrl,
      fullArticle: article
    });
  }, [article, publishedNow, wordpressUrl, postId, siteName, publishedAt]);

  useEffect(() => {
    loadArticle();
    // Close dropdown when clicking outside
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [params.id]);

  // Reload article data after publishing to get fresh WordPress info from database
  useEffect(() => {
    if (publishedNow) {
      const timer = setTimeout(() => {
        loadArticle();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [publishedNow]);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contentAPI.getContentById(params.id as string);
      
      if (response.data?.success) {
        setArticle(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to load article');
      }
    } catch (err: any) {
      console.error('Error loading article:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'draft':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyContent = async () => {
    if (!article) return;
    
    setCopying(true);
    try {
      // Copy the raw content without HTML tags for better usability
      const textContent = article.body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      await navigator.clipboard.writeText(textContent);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
      setCopying(false);
    }
  };

  const handleDelete = async () => {
    if (!article || deleting) return;
    
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      setDeleting(true);
      try {
        await contentAPI.deleteContent(article.id);
        router.push('/articles');
      } catch (error: any) {
        console.error('Error deleting article:', error);
        alert(error.response?.data?.message || 'Failed to delete article');
        setDeleting(false);
      }
    }
  };

  const handleShare = async () => {
    if (!article) return;
    
    const shareData = {
      title: article.title,
      text: article.excerpt || '',
      url: article.metadata?.canonicalUrl || window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  const handleDuplicate = async () => {
    if (!article || duplicating) return;
    
    if (!window.confirm('Create a duplicate of this article?')) return;
    
    setDuplicating(true);
    try {
      // If duplicateContent method exists, use it
      if (typeof contentAPI.duplicateContent === 'function') {
        const response = await contentAPI.duplicateContent(article.id);
        if (response.data?.success && response.data?.data?.id) {
          router.push(`/articles/${response.data.data.id}`);
        }
      } else {
        // Fallback: create new content with duplicated data
        const duplicateData = {
          title: `${article.title} (Copy)`,
          body: article.body,
          excerpt: article.excerpt,
          primaryKeyword: (article as any).primaryKeyword,
          seoScore: article.seoScore,
          readingTime: article.readingTime,
          wordCount: article.wordCount,
          metadata: article.metadata,
          status: 'draft'
        };
        
        const response = await contentAPI.createContent(duplicateData);
        if (response.data?.success && response.data?.data?.id) {
          router.push(`/articles/${response.data.data.id}`);
        }
      }
    } catch (error: any) {
      console.error('Error duplicating article:', error);
      alert(error.response?.data?.message || 'Failed to duplicate article');
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-lg text-gray-600 dark:text-gray-400">Loading article...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error loading article
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={loadArticle}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Article not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The article you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/articles"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen">
        <div className="max-w-none px-6 pb-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full pt-4">
              <Link
                href="/articles"
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Articles
              </Link>
              
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      <Link
                        href={`/articles/${article.id}/edit`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit3 className="w-4 h-4 mr-3" />
                        Edit
                      </Link>
                      <button
                        onClick={handleDuplicate}
                        disabled={duplicating}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4 mr-3" />
                        {duplicating ? 'Duplicating...' : 'Duplicate'}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Share2 className="w-4 h-4 mr-3" />
                        Share
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Success Banner */}
            {publishedNow && wordpressUrl && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Successfully Published!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                      Your article has been published to WordPress
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                      {siteName && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-800 dark:text-green-200">
                            <span className="font-medium">Site:</span> {siteName}
                          </span>
                        </div>
                      )}
                      {postId && (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-800 dark:text-green-200">
                            <span className="font-medium">Post ID:</span> {postId}
                          </span>
                        </div>
                      )}
                      {publishedAt && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-800 dark:text-green-200">
                            <span className="font-medium">Published:</span> {new Date(publishedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={wordpressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on WordPress
                      </a>
                      <Link
                        href={`/dashboard/articles/${params.id}/edit`}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors font-medium text-sm"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Article
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article Header */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 break-words">
                      {article.title}
                    </h1>
                    {article.excerpt && (
                      <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(article.status)}`}>
                      {getStatusIcon(article.status)}
                      <span className="ml-2 capitalize">{article.status}</span>
                    </span>
                  </div>
                </div>

                {/* Meta Information Grid */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Created
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {formatDate(article.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Word Count
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {article.wordCount?.toLocaleString() || 'Unknown'} words
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Reading Time
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {article.readingTime || 'Unknown'} min read
                        </p>
                      </div>
                    </div>
                    
                    {article.wordPressPublications && article.wordPressPublications.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <Eye className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Published Sites
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {article.wordPressPublications.length}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SEO and Publishing Info */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SEO Information */}
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    SEO Information
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Keyword
                      </label>
                      <div className="flex items-center space-x-3">
                        <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-white break-words">
                          {article.metadata?.focusKeyword || 'Not set'}
                        </span>
                      </div>
                    </div>
                    
                    {article.seoScore && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          SEO Score
                        </label>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                article.seoScore >= 80 ? 'bg-green-500' :
                                article.seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(article.seoScore, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-shrink-0">
                            {article.seoScore}/100
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {article.metadata?.metaDescription && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Meta Description
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {article.metadata.metaDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Publishing Information */}
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Publishing Information
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(article.status)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {article.status}
                        </span>
                      </div>
                    </div>

                    {/* Published Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Published Date
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {(publishedAt || article.publishedAt) 
                            ? formatDate(publishedAt || article.publishedAt!)
                            : <span className="text-gray-500 italic">Not published yet</span>
                          }
                        </span>
                      </div>
                    </div>

                    {/* WordPress Site */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        WordPress Site
                      </label>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {(siteName || article.wordpressSite)
                            ? (siteName || article.wordpressSite)
                            : <span className="text-gray-500 italic">Not published to WordPress</span>
                          }
                        </span>
                      </div>
                    </div>

                    {/* WordPress URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        WordPress URL
                      </label>
                      {(wordpressUrl || article.publishedUrl) ? (
                        <a
                          href={wordpressUrl || article.publishedUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 break-all group"
                        >
                          <ExternalLink className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="underline">View on WordPress</span>
                        </a>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500 italic">No WordPress URL available</span>
                        </div>
                      )}
                    </div>

                    {/* Post ID - only from URL param */}
                    {postId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          WordPress Post ID
                        </label>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            #{postId}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Legacy: Published Sites (if exists in article data) */}
                    {article.wordPressPublications && article.wordPressPublications.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Published Sites
                        </label>
                        <div className="space-y-2">
                          {article.wordPressPublications.map((pub, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                  {pub.siteName}
                                </span>
                              </div>
                              {pub.postUrl && (
                                <a
                                  href={pub.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-1 flex-shrink-0"
                                  title="View published article"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Canonical URL */}
                    {article.metadata?.canonicalUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Canonical URL
                        </label>
                        <a
                          href={article.metadata.canonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 break-all"
                        >
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span>View Live Article</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Article Content
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyContent}
                      disabled={copying}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copying ? 'Copied!' : 'Copy'}
                    </button>
                    <Link
                      href={`/articles/${article.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-6 w-full">
                <div className="w-full max-w-none">
                  <RichContentRenderer content={article.body} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}