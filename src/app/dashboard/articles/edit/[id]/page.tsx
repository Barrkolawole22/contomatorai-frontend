'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  RefreshCw,
  Globe,
  Calendar,
  Clock,
  FileText,
  Tag,
  Target,
  Wand2,
  CheckCircle,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
  ExternalLink
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
  tags?: string[];
}

export default function ArticleEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    keyword: '',
    metaDescription: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    scheduledFor: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadArticle();
  }, [params.id]);

  useEffect(() => {
    // Calculate word count and reading time
    const wordCount = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    setArticle(prev => prev ? {
      ...prev,
      ...formData,
      wordCount,
      readingTime,
      updatedAt: new Date().toISOString()
    } : null);
  }, [formData]);

  // Auto-save functionality
  useEffect(() => {
    if (unsavedChanges && article) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 3000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, unsavedChanges]);

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

## Best Practices for AI Content Writing

### 1. Provide Clear Instructions

The quality of AI-generated content heavily depends on the clarity of your instructions. Be specific about:
- Target audience
- Tone and style
- Content length
- Key points to cover
- Call-to-action requirements

### 2. Use Relevant Keywords

Incorporate your target keywords naturally throughout the content.

## Conclusion

AI content writing is not about replacing human creativity but enhancing it. By understanding how to effectively use AI tools, content creators can produce higher quality content more efficiently.`,
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
        wordpressSite: 'My Blog',
        tags: ['AI', 'Content Writing', 'SEO', 'Marketing']
      };
      
      setArticle(mockArticle);
      setFormData({
        title: mockArticle.title,
        content: mockArticle.content,
        excerpt: mockArticle.excerpt,
        keyword: mockArticle.keyword,
        metaDescription: mockArticle.metaDescription || '',
        slug: mockArticle.slug,
        status: mockArticle.status,
        scheduledFor: mockArticle.scheduledFor || '',
        tags: mockArticle.tags || []
      });
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
    setSaveStatus(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
      setUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setUnsavedChanges(true);
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    handleInputChange('slug', slug);
  };

  const generateExcerpt = () => {
    const excerpt = formData.content
      .replace(/#+\s/g, '')
      .replace(/\*\*/g, '')
      .split('\n')
      .filter(line => line.trim().length > 0)[0]
      ?.substring(0, 160) + '...';
    if (excerpt) {
      handleInputChange('excerpt', excerpt);
    }
  };

  const handleAutoSave = async () => {
    if (!unsavedChanges) return;
    
    setSaveStatus('saving');
    try {
      // Simulate auto-save API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Clear save status after 2 seconds
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async (newStatus?: 'draft' | 'published' | 'scheduled') => {
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      const statusToSave = newStatus || formData.status;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update form data with new status if provided
      if (newStatus) {
        setFormData(prev => ({ ...prev, status: statusToSave }));
      }
      
      setUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Clear save status after 2 seconds
      setTimeout(() => setSaveStatus(null), 2000);
      
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving article:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Simulate WordPress publishing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await handleSave('published');
      
      // Update article with published data
      setArticle(prev => prev ? {
        ...prev,
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishedUrl: `https://example.com/${formData.slug}`
      } : null);
      
    } catch (error) {
      console.error('Error publishing article:', error);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/articles');
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-200">{line.slice(4)}</h3>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-3 text-gray-600 dark:text-gray-300 leading-relaxed">{line}</p>;
      });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
            <span className="text-gray-600 dark:text-gray-300">Loading article...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!article) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
          <Link
            href="/articles"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Articles</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/articles"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Article</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Last updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{article.wordCount} words</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.readingTime} min read</span>
                </span>
                {saveStatus === 'saved' && (
                  <span className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'saving' && (
                  <span className="flex items-center space-x-1 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Edit' : 'Preview'}</span>
            </button>
            
            <button
              onClick={() => handleSave()}
              disabled={saving || !unsavedChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            
            {formData.status !== 'published' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{publishing ? 'Publishing...' : 'Publish'}</span>
              </button>
            )}
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              article.status === 'published' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : article.status === 'scheduled'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
            </div>
            
            {article.publishedUrl && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(article.publishedUrl!)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy URL</span>
                </button>
                <a
                  href={article.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Live</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              {!showPreview ? (
                <div className="p-6">
                  {/* Title */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-lg font-medium"
                      placeholder="Enter article title..."
                    />
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                      rows={20}
                      placeholder="Write your content here..."
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Excerpt
                      </label>
                      <button
                        onClick={generateExcerpt}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Wand2 className="w-4 h-4" />
                        <span>Auto-generate</span>
                      </button>
                    </div>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Brief description of your article..."
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    {renderMarkdown(formData.content)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>SEO Settings</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => handleInputChange('keyword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    placeholder="Enter focus keyword..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slug
                    </label>
                    <button
                      onClick={generateSlug}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    placeholder="article-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    rows={3}
                    placeholder="Enter meta description..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>

                {article.seoScore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Score
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            article.seoScore >= 80 ? 'bg-green-500' :
                            article.seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${article.seoScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {article.seoScore}/100
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Tags</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    placeholder="Add tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Publishing Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Publishing</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Schedule For
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}

                {article.publishedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Published On
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {article.wordpressSite && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      WordPress Site
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {article.wordpressSite}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Article Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Article Stats</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Word Count</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {article.wordCount.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reading Time</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {article.readingTime} min
                  </span>
                </div>
                
                {article.views && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {article.views.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Modified</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Article
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{article.title}"? This will permanently remove the article and all its data.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Article
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {unsavedChanges && (
          <div className="fixed bottom-4 right-4 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                You have unsaved changes
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}