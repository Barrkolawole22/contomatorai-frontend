'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Share2,
  Download,
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

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  wordCount: number;
  readingTime: number;
  keyword: string;
  views?: number;
  slug: string;
  excerpt: string;
  metaDescription?: string;
  seoScore?: number;
  publishedUrl?: string;
  wordpressSite?: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [params.id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on the ID
      const mockArticle: Article = {
        id: params.id as string,
        title: 'The Complete Guide to AI Content Writing',
        content: `# The Complete Guide to AI Content Writing

## Introduction

Artificial Intelligence has revolutionized the way we approach content creation. In this comprehensive guide, we'll explore how AI-powered tools are transforming the content writing landscape and how you can leverage them to create compelling, high-quality content that resonates with your audience.

## What is AI Content Writing?

AI content writing refers to the use of artificial intelligence technologies to generate, enhance, or assist in creating written content. These tools use natural language processing (NLP) and machine learning algorithms to understand context, tone, and style preferences to produce human-like text.

### Key Benefits of AI Content Writing

1. **Speed and Efficiency**: Generate content in minutes rather than hours
2. **Consistency**: Maintain consistent tone and style across all content
3. **Scalability**: Produce large volumes of content quickly
4. **Cost-Effective**: Reduce content creation costs significantly
5. **SEO Optimization**: Built-in SEO best practices and keyword integration

## How AI Content Writing Works

AI content writing tools typically follow this process:

1. **Input Analysis**: The AI analyzes your prompts, keywords, and requirements
2. **Content Generation**: Using trained models, it generates relevant content
3. **Optimization**: The content is optimized for readability and SEO
4. **Review and Edit**: Human oversight ensures quality and accuracy

## Best Practices for AI Content Writing

### 1. Provide Clear Instructions

The quality of AI-generated content heavily depends on the clarity of your instructions. Be specific about:
- Target audience
- Tone and style
- Content length
- Key points to cover
- Call-to-action requirements

### 2. Use Relevant Keywords

Incorporate your target keywords naturally throughout the content. AI tools can help with:
- Keyword density optimization
- Related keyword suggestions
- Semantic keyword integration
- Long-tail keyword incorporation

### 3. Maintain Human Oversight

While AI is powerful, human oversight is crucial for:
- Fact-checking accuracy
- Ensuring brand voice consistency
- Adding personal insights and experiences
- Final quality assurance

## Popular AI Content Writing Tools

### OpenAI GPT Models
- Advanced language understanding
- Versatile content generation
- Multiple language support
- Continuous learning capabilities

### Specialized Content Platforms
- Industry-specific templates
- Built-in SEO optimization
- Content calendar integration
- Team collaboration features

## The Future of AI Content Writing

As AI technology continues to evolve, we can expect:

1. **More Sophisticated Understanding**: Better context comprehension and nuanced writing
2. **Enhanced Personalization**: Content tailored to individual reader preferences
3. **Improved Fact-Checking**: Built-in verification systems for accuracy
4. **Seamless Integration**: Better integration with existing content management systems

## Conclusion

AI content writing is not about replacing human creativity but enhancing it. By understanding how to effectively use AI tools, content creators can produce higher quality content more efficiently while focusing on strategy and creative direction.

The key to success lies in finding the right balance between AI efficiency and human insight. As these tools continue to improve, they'll become even more valuable assets in the content creator's toolkit.`,
        status: 'published',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        publishedAt: '2024-01-15T14:20:00Z',
        wordCount: 2500,
        readingTime: 10,
        keyword: 'AI content writing',
        views: 1250,
        slug: 'complete-guide-ai-content-writing',
        excerpt: 'Understanding AI content writing is crucial for modern businesses and individuals looking to stay competitive in the digital landscape.',
        metaDescription: 'Learn everything about AI content writing, from basic concepts to advanced strategies. Discover how to create compelling content using artificial intelligence tools.',
        seoScore: 87,
        publishedUrl: 'https://example.com/complete-guide-ai-content-writing',
        wordpressSite: 'My Blog'
      };
      
      setArticle(mockArticle);
    } catch (error) {
      console.error('Error loading article:', error);
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
      await navigator.clipboard.writeText(article.content);
      // You could add a toast notification here
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
      setCopying(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/articles');
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const handleShare = async () => {
    if (!article) return;
    
    const shareData = {
      title: article.title,
      text: article.excerpt,
      url: article.publishedUrl || window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(shareData.url);
      // You could add a toast notification here
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/articles"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1">
                  <Link
                    href={`/articles/${article.id}/edit`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit3 className="w-4 h-4 mr-3" />
                    Edit Article
                  </Link>
                  <button
                    onClick={handleCopyContent}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-3" />
                    {copying ? 'Copied!' : 'Copy Content'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Share2 className="w-4 h-4 mr-3" />
                    Share Article
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-600"></div>
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Article
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Article Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {article.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {article.excerpt}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(article.status)}`}>
              {getStatusIcon(article.status)}
              <span className="ml-2 capitalize">{article.status}</span>
            </span>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(article.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Word Count</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {article.wordCount.toLocaleString()} words
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reading Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {article.readingTime} min read
                </p>
              </div>
            </div>
            
            {article.views !== undefined && (
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {article.views.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEO and Publishing Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SEO Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              SEO Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Keyword
                </label>
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{article.keyword}</span>
                </div>
              </div>
              
              {article.seoScore && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SEO Score
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          article.seoScore >= 80 ? 'bg-green-500' :
                          article.seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${article.seoScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {article.seoScore}/100
                    </span>
                  </div>
                </div>
              )}
              
              {article.metaDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meta Description
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {article.metaDescription}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Publishing Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Publishing Information
            </h3>
            
            <div className="space-y-4">
              {article.wordpressSite && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WordPress Site
                  </label>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{article.wordpressSite}</span>
                  </div>
                </div>
              )}
              
              {article.publishedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Published Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>
                </div>
              )}
              
              {article.publishedUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Published URL
                  </label>
                  <a
                    href={article.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Live Article</span>
                  </a>
                </div>
              )}
              
              {article.scheduledFor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scheduled For
                  </label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(article.scheduledFor)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Article Content
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyContent}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
          
          <div className="p-6">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{
                __html: article.content.replace(/\n/g, '<br>').replace(/#{1,6}\s+/g, match => {
                  const level = match.trim().length;
                  return `<h${level}>`;
                }).replace(/(?<=<h[1-6]>)(.*)$/gm, '$1</h$1>')
              }} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}