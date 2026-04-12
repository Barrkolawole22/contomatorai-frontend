'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import { keywordsAPI, contentAPI, sitesAPI, sitemapAPI } from '@/lib/api';
import ScheduleModal from '@/components/scheduler/ScheduleModal';
import PublishProgressModal, { PublishStep } from '@/components/articles/PublishProgressModal';
import type { InternalLinkSuggestion } from '@/types';
import {
  FileText,
  Wand2,
  Eye,
  Save,
  Send,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Lightbulb,
  BookOpen,
  Settings,
  RefreshCw,
  Check,
  X,
  Plus,
  Minus,
  Edit3,
  Download,
  AlertCircle,
  CheckCircle,
  Globe,
  ExternalLink,
  Link,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  Sparkles,
  Brain,
  Layers,
  Zap,
  Calendar,
  Link2,
  Upload,
  FileUp,
  Trash2
} from 'lucide-react';

// Model configuration with credit multipliers
const MODEL_CONFIG: Record<string, { label: string; description: string; creditMultiplier: number; icon: string }> = {
  groq: {
    label: 'Fast Generation',
    description: 'Quick and efficient content generation',
    creditMultiplier: 1,
    icon: '⚡'
  },
  gemini: {
    label: 'Balanced',
    description: 'Good quality with moderate speed',
    creditMultiplier: 2,
    icon: '⭐'
  },
  claude: {
    label: 'Premium Quality',
    description: 'Highest quality and most detailed content',
    creditMultiplier: 5,
    icon: '💎'
  }
};

interface SavedKeyword {
  id: string;
  keyword: string;
  term?: string;
  searchVolume: number;
  volume?: number;
  difficulty: number;
  status: 'available' | 'used';
}

interface Site {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

interface EnhancedGenerationSettings {
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  wordCount: number;
  includeIntro: boolean;
  includeConclusion: boolean;
  includeFAQ: boolean;
  targetAudience: string;
  extraInstructions: string;
  contentIntent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  customPrompt: string;
  additionalContext: string;
  writingStyle: 'conversational' | 'academic' | 'journalistic' | 'technical' | 'creative';
  seoFocus: 'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced';
  callToAction: string;
  includeStatistics: boolean;
  includeExamples: boolean;
  includeComparisons: boolean;
  targetKeywordDensity: number;
  includeInternalLinks: boolean;
  internalLinkDensity: number;
  maxInternalLinks: number;
}

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  site?: {
    id: string;
    name: string;
    url: string;
  } | null;
}

export default function EnhancedCreateArticlePage() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [step, setStep] = useState<'keyword' | 'site' | 'generate' | 'edit'>('keyword');
  const [selectedKeyword, setSelectedKeyword] = useState<SavedKeyword | null>(null);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'groq' | 'gemini' | 'claude'>('groq');
  const [estimatedCredits, setEstimatedCredits] = useState(1500);
  const [internalLinkSuggestions, setInternalLinkSuggestions] = useState<InternalLinkSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showInternalLinks, setShowInternalLinks] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPublishProgress, setShowPublishProgress] = useState(false);
  const [publishStep, setPublishStep] = useState<PublishStep>('validating');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [linksLastUpdated, setLinksLastUpdated] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<EnhancedGenerationSettings>({
    tone: 'professional',
    wordCount: 1500,
    includeIntro: true,
    includeConclusion: true,
    includeFAQ: false,
    targetAudience: 'General audience',
    extraInstructions: '',
    contentIntent: 'informational',
    customPrompt: '',
    additionalContext: '',
    writingStyle: 'conversational',
    seoFocus: 'balanced',
    callToAction: '',
    includeStatistics: true,
    includeExamples: true,
    includeComparisons: false,
    targetKeywordDensity: 1.5,
    includeInternalLinks: true,
    internalLinkDensity: 3,
    maxInternalLinks: 5
  });
  
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [loadingSites, setLoadingSites] = useState(false);
  const [siteError, setSiteError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const multiplier = MODEL_CONFIG[selectedModel].creditMultiplier;
    setEstimatedCredits(Math.ceil(settings.wordCount * multiplier));
  }, [selectedModel, settings.wordCount]);

  useEffect(() => {
    loadSavedKeywords();
    loadUserSites();
  }, []);

  useEffect(() => {
    const keywordFromUrl = searchParams?.get('keyword');
    if (keywordFromUrl && savedKeywords.length > 0) {
      const decodedKeyword = decodeURIComponent(keywordFromUrl);
      const matchingKeyword = savedKeywords.find(k => 
        (k.keyword?.toLowerCase() === decodedKeyword.toLowerCase()) ||
        (k.term?.toLowerCase() === decodedKeyword.toLowerCase())
      );
      
      if (matchingKeyword) {
        setSelectedKeyword(matchingKeyword);
      } else {
        setCustomTopic(decodedKeyword);
      }
    }
  }, [searchParams, savedKeywords]);

  // Load internal link suggestions when site is selected in Step 2
  useEffect(() => {
    if (step === 'site' && settings.includeInternalLinks && selectedSite && (selectedKeyword || customTopic)) {
      loadInternalLinkSuggestions();
    }
  }, [selectedSite, step]);

  const loadSavedKeywords = async () => {
    try {
      const response = await keywordsAPI.getHistory({ limit: 100 });
      
      if (response.data.success) {
        const keywordsData = response.data.data || [];
        const transformedKeywords: SavedKeyword[] = keywordsData.map((k: any) => ({
          id: k.id,
          keyword: k.term || k.keyword,
          term: k.term || k.keyword,
          searchVolume: k.volume || k.searchVolume || 0,
          volume: k.volume || k.searchVolume || 0,
          difficulty: k.difficulty || 0,
          status: 'available' as const
        }));
        
        setSavedKeywords(transformedKeywords);
      }
    } catch (error) {
      console.error('Error loading saved keywords:', error);
      setSavedKeywords([]);
    }
  };

  const loadUserSites = async () => {
    try {
      setLoadingSites(true);
      setSiteError(null);
      
      const response = await sitesAPI.getUserSites();
      
      if (response.data.success) {
        const sites = response.data.data || [];
        setAvailableSites(sites);
        
        if (sites.length > 0 && !selectedSite) {
          setSelectedSite(sites[0].id);
        }
      } else {
        throw new Error(response.data.message || 'Failed to load sites');
      }
    } catch (error: any) {
      console.error('Error loading user sites:', error);
      setSiteError(error.response?.data?.message || 'Failed to load WordPress sites');
      setAvailableSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadInternalLinkSuggestions = async () => {
    const topic = selectedKeyword?.keyword || selectedKeyword?.term || customTopic;
    
    console.log('🔍 Loading internal links...', { topic, selectedSite });
    
    if (!topic || !selectedSite) {
      console.warn('⚠️ Missing topic or site:', { topic, selectedSite });
      return;
    }

    try {
      setLoadingSuggestions(true);
      setShowInternalLinks(true); // ✅ Auto-expand on refresh
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages
      
      const response = await sitemapAPI.getSuggestions(topic, selectedSite);
      
      console.log('📡 API Response:', response.data);
      
      if (response.data.success) {
        const links = response.data.data || [];
        console.log(`✅ Found ${links.length} internal links`, links);
        setInternalLinkSuggestions(links);
        setLinksLastUpdated(new Date());
        
        // Show success message
        if (links.length > 0) {
          setSuccessMessage(`Successfully found ${links.length} relevant internal link${links.length !== 1 ? 's' : ''}`);
          setTimeout(() => setSuccessMessage(null), 5000); // Clear after 5 seconds
        }
      } else {
        console.warn('⚠️ API returned success=false:', response.data);
        setInternalLinkSuggestions([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading internal link suggestions:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setInternalLinkSuggestions([]);
      setError(`Failed to load internal links: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const proceedToSiteSelection = () => {
    const topic = selectedKeyword?.keyword || selectedKeyword?.term || customTopic;
    if (!topic) {
      setError('Please select a keyword or enter a custom topic');
      return;
    }
    
    setError(null);
    setStep('site');
  };

  const proceedToGeneration = () => {
    if (!selectedSite) {
      setSiteError('Please select a WordPress site to continue');
      return;
    }
    
    setSiteError(null);
    generateContent();
  };

  const generateContent = async () => {
    const topic = selectedKeyword?.keyword || selectedKeyword?.term || customTopic;
    if (!topic) {
      setError('Please select a keyword or enter a custom topic');
      return;
    }

    if (!selectedSite) {
      setError('Please select a WordPress site before generating content');
      setStep('site');
      return;
    }

    if (!user || (user.wordCredits || user.credits || 0) < estimatedCredits) {
      setError(`Insufficient credits. You need ${estimatedCredits} credits but only have ${user?.wordCredits || user?.credits || 0} remaining.`);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('Connecting to AI service...');
    setLoadingProgress(0);

    const progressStages = [
      { stage: 'Connecting to AI service...', progress: 10 },
      { stage: 'Analyzing your topic and keywords...', progress: 25 },
      { stage: settings.includeInternalLinks ? 'Finding relevant internal links...' : 'Generating content with advanced AI...', progress: 40 },
      { stage: 'Generating content with advanced AI...', progress: 60 },
      { stage: 'Optimizing for SEO and readability...', progress: 75 },
      { stage: 'Applying your custom settings...', progress: 85 },
      { stage: 'Finalizing content structure...', progress: 95 }
    ];

    let currentStageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      if (currentStageIndex < progressStages.length - 1) {
        currentStageIndex++;
        const { stage, progress } = progressStages[currentStageIndex];
        setLoadingStage(stage);
        setLoadingProgress(progress);
      }
    }, 8000);
    
    try {
      const enhancedOptions = {
        tone: settings.tone,
        wordCount: settings.wordCount,
        targetAudience: settings.targetAudience,
        includeIntroduction: settings.includeIntro,
        includeConclusion: settings.includeConclusion,
        includeFAQ: settings.includeFAQ,
        contentIntent: settings.contentIntent,
        customPrompt: settings.customPrompt,
        additionalContext: settings.additionalContext,
        writingStyle: settings.writingStyle,
        seoFocus: settings.seoFocus,
        callToAction: settings.callToAction,
        includeStatistics: settings.includeStatistics,
        includeExamples: settings.includeExamples,
        includeComparisons: settings.includeComparisons,
        targetKeywordDensity: settings.targetKeywordDensity,
        includeInternalLinks: settings.includeInternalLinks,
        internalLinkDensity: settings.internalLinkDensity,
        maxInternalLinks: settings.maxInternalLinks,
        internalLinkSuggestions: settings.includeInternalLinks ? internalLinkSuggestions : undefined,
        extraInstructions: [
          settings.extraInstructions,
          settings.customPrompt,
          settings.additionalContext,
          settings.includeInternalLinks && internalLinkSuggestions.length > 0
            ? `Include internal links to relevant pages from our site. Available links: ${internalLinkSuggestions.map(s => s.title).join(', ')}`
            : ''
        ].filter(Boolean).join('\n\n')
      };
      
      const response = await contentAPI.generateContent({
        keyword: topic,
        siteId: selectedSite,
        model: selectedModel,
        options: enhancedOptions
      } as any);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setLoadingStage('Content generated successfully!');
      setLoadingProgress(100);
      
      if (response.data.success) {
        const contentData = response.data.data;
        
        setGeneratedContent({
          id: contentData.id,
          title: contentData.title,
          content: contentData.content || contentData.body,
          wordCount: contentData.wordCount,
          readingTime: contentData.readingTime,
          seoScore: contentData.seoScore || 0,
          site: contentData.site
        });
        
        // Refresh user data to update credits in UI
        await refreshUser();
        
        setTimeout(() => {
          setStep('generate');
        }, 500);
      } else {
        throw new Error(response.data.message || 'Failed to generate content');
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setError(error.response?.data?.message || error.message || 'Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStage('');
      setLoadingProgress(0);
    }
  };

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      setFileError('Please upload a .txt, .pdf, .doc, or .docx file');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setFileError('File size must be less than 10MB');
      return;
    }

    setFileError(null);
    setUploadedFile(file);
    setFileProcessing(true);

    try {
      let extractedText = '';

      if (fileExtension === '.txt') {
        // Process .txt file
        extractedText = await readTextFile(file);
      } else if (fileExtension === '.pdf') {
        // Process .pdf file
        extractedText = await readPdfFile(file);
      } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        // Process .doc/.docx file
        extractedText = await readDocxFile(file);
      }

      // Update settings with extracted text
      setSettings(prev => ({ ...prev, additionalContext: extractedText }));
      setFileProcessing(false);
    } catch (error) {
      console.error('Error processing file:', error);
      setFileError('Failed to process file. Please try another file.');
      setUploadedFile(null);
      setFileProcessing(false);
    }
  };

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readPdfFile = async (file: File): Promise<string> => {
    try {
      // Import pdfjs dynamically
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      throw new Error('Failed to extract text from PDF');
    }
  };

  const readDocxFile = async (file: File): Promise<string> => {
    try {
      // Import mammoth dynamically
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to extract text from DOCX');
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFileError(null);
    setSettings(prev => ({ ...prev, additionalContext: '' }));
  };

  // Publish content to WordPress
  const handlePublish = async () => {
    if (!generatedContent?.id) {
      setPublishError('No content to publish');
      return;
    }

    setPublishError(null);
    setShowPublishProgress(true);
    
    try {
      // Step 1: Validating
      setPublishStep('validating');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!selectedSite) {
        setPublishError('Please select a WordPress site before publishing');
        setPublishStep('error');
        return;
      }

      // Step 2: Preparing
      setPublishStep('preparing');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Uploading
      setPublishStep('uploading');
      
      // Publish API call
      const response = await contentAPI.publishContent(generatedContent.id, { siteId: selectedSite });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Publishing failed');
      }

      // Step 4: Publishing
      setPublishStep('publishing');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 5: Complete
      setPublishStep('complete');
      
      // Wait 2 seconds then redirect to preview page with publish info
      setTimeout(() => {
        const publishData = response.data.data;
        const site = availableSites.find(s => s.id === selectedSite);
        
        const params = new URLSearchParams({
          published: 'true',
          wordpressUrl: publishData?.wordpressUrl || '',
          postId: publishData?.wordpressPostId || '',
          siteName: site?.name || publishData?.site || '',
          publishedAt: new Date().toISOString()
        });
        
        router.push(`/articles/${generatedContent.id}?${params.toString()}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error publishing article:', error);
      
      let errorMessage = 'Failed to publish content';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Publishing timed out. The post may still be processing on WordPress. Please check your WordPress site and refresh this page.';
      } else if (error.response?.status === 500) {
        errorMessage = 'WordPress server error. The post may have been published. Please check your WordPress site.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPublishError(errorMessage);
      setPublishStep('error');
    }
  };

  const getIntentDescription = (intent: string) => {
    switch (intent) {
      case 'informational': 
        return 'Educational content that answers questions and provides valuable information';
      case 'navigational': 
        return 'Content that helps users find specific information or navigate to resources';
      case 'commercial': 
        return 'Content that compares products/services and influences purchasing decisions';
      case 'transactional': 
        return 'Content designed to drive immediate action like purchases or sign-ups';
      default: 
        return 'General purpose content';
    }
  };

  const getStepStatus = (stepName: string) => {
    const stepOrder = ['keyword', 'site', 'generate', 'edit'];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepName);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600 bg-green-50';
    if (difficulty <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Enhanced Content Creation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate AI-powered content with advanced customization options
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {(user?.wordCredits || user?.credits || 0).toLocaleString()} credits remaining
              </span>
            </div>
            {availableSites.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {availableSites.length} site{availableSites.length !== 1 ? 's' : ''} connected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            {[
              { key: 'keyword', label: 'Choose Topic', icon: Target, description: 'Select or enter your topic' },
              { key: 'site', label: 'Choose Site', icon: Globe, description: 'Select WordPress site' },
              { key: 'generate', label: 'Generate Content', icon: Brain, description: 'AI creates your content' },
              { key: 'edit', label: 'Review & Publish', icon: Edit3, description: 'Edit and publish' }
            ].map((stepItem, index) => {
              const status = getStepStatus(stepItem.key);
              const Icon = stepItem.icon;
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className="text-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                      status === 'completed' 
                        ? 'bg-green-100 text-green-600' 
                        : status === 'current'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {status === 'completed' ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className={`text-sm font-medium ${
                      status === 'current' 
                        ? 'text-blue-600' 
                        : status === 'completed'
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {stepItem.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stepItem.description}
                    </div>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="w-6 h-6 text-gray-300 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State with Progress Bar */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                  <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                  Generating Enhanced Content with {MODEL_CONFIG[selectedModel].label}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {loadingStage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span className="font-medium">{loadingProgress}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{MODEL_CONFIG[selectedModel].label}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>SEO Optimization</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Custom Settings</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{settings.includeInternalLinks ? 'Internal Links' : 'Quality Assured'}</span>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                This may take 30-60 seconds depending on content length and model selection
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Topic Selection */}
        {step === 'keyword' && !loading && (
          <div className="space-y-6">
            {/* Topic Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Choose Your Topic
              </h3>
              
              {/* Saved Keywords */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select from Saved Keywords
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedKeywords.slice(0, 6).map((keyword) => (
                    <div
                      key={keyword.id}
                      onClick={() => {
                        setSelectedKeyword(keyword);
                        setCustomTopic('');
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedKeyword?.id === keyword.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {keyword.keyword}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(keyword.difficulty)}`}>
                          {keyword.difficulty}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {keyword.searchVolume.toLocaleString()} searches/month
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or Enter Custom Topic
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    if (e.target.value) setSelectedKeyword(null);
                  }}
                  placeholder="Enter your topic or keyword..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Content Intent Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Content Intent & Purpose
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'informational', label: 'Informational', icon: BookOpen },
                  { key: 'navigational', label: 'Navigational', icon: Target },
                  { key: 'commercial', label: 'Commercial', icon: BarChart3 },
                  { key: 'transactional', label: 'Transactional', icon: ShoppingCart }
                ].map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    onClick={() => setSettings(prev => ({ ...prev, contentIntent: key as any }))}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      settings.contentIntent === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Icon className="w-5 h-5 text-blue-600 mr-3" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {label}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getIntentDescription(key)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simple Internal Links Toggle - Step 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Internal Links
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Automatically include relevant internal links from your site to boost SEO
                  </p>
                </div>
                <label className="flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings.includeInternalLinks}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeInternalLinks: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Enable
                  </span>
                </label>
              </div>

              {settings.includeInternalLinks && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Smart Internal Linking Enabled
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        After selecting your WordPress site in the next step, we'll find relevant internal links from your indexed URLs and automatically include them in your content.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Custom Instructions & Context
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Prompt (Optional)
                  </label>
                  <textarea
                    value={settings.customPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
                    placeholder="Add specific instructions for how you want the content written..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Context (File Upload)
                  </label>
                  
                  {!uploadedFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={fileProcessing}
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-700/50"
                      >
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          TXT, PDF, DOC, DOCX (max 10MB)
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Recommended: Keep documents under 5 pages for best efficiency
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                      {fileProcessing ? (
                        <div className="flex items-center space-x-3">
                          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Processing file...
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Extracting text from {uploadedFile.name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {uploadedFile.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(uploadedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleClearFile}
                            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {fileError && (
                    <div className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm">{fileError}</p>
                    </div>
                  )}
                  
                  {uploadedFile && !fileProcessing && settings.additionalContext && (
                    <div className="mt-2 flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm">
                        {settings.additionalContext.length} characters extracted
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </h3>
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {showAdvancedSettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              
              {showAdvancedSettings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tone
                    </label>
                    <select
                      value={settings.tone}
                      onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="authoritative">Authoritative</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Writing Style
                    </label>
                    <select
                      value={settings.writingStyle}
                      onChange={(e) => setSettings(prev => ({ ...prev, writingStyle: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="conversational">Conversational</option>
                      <option value="academic">Academic</option>
                      <option value="journalistic">Journalistic</option>
                      <option value="technical">Technical</option>
                      <option value="creative">Creative</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Word Count
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={settings.wordCount}
                        onChange={(e) => setSettings(prev => ({ ...prev, wordCount: parseInt(e.target.value) || 1500 }))}
                        min="300"
                        max="5000"
                        step="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        300 - 5,000 words
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Focus
                    </label>
                    <select
                      value={settings.seoFocus}
                      onChange={(e) => setSettings(prev => ({ ...prev, seoFocus: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="balanced">Balanced SEO</option>
                      <option value="primary_keyword">Primary Keyword Focus</option>
                      <option value="semantic_keywords">Semantic Keywords</option>
                      <option value="long_tail">Long-tail Keywords</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Call to Action (Optional)
                    </label>
                    <input
                      type="text"
                      value={settings.callToAction}
                      onChange={(e) => setSettings(prev => ({ ...prev, callToAction: e.target.value }))}
                      placeholder="e.g., Contact us for a free consultation"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Content Features
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'includeIntro', label: 'Introduction' },
                        { key: 'includeConclusion', label: 'Conclusion' },
                        { key: 'includeFAQ', label: 'FAQ Section' },
                        { key: 'includeStatistics', label: 'Statistics' },
                        { key: 'includeExamples', label: 'Examples' },
                        { key: 'includeComparisons', label: 'Comparisons' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings[key as keyof EnhancedGenerationSettings] as boolean}
                            onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Model Selector */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Generation Speed & Quality
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(MODEL_CONFIG).map(([modelKey, modelConfig]) => (
                        <div
                          key={modelKey}
                          onClick={() => setSelectedModel(modelKey as 'groq' | 'gemini' | 'claude')}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedModel === modelKey
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{modelConfig.icon}</span>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {modelConfig.label}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {modelConfig.description}
                          </p>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {modelConfig.creditMultiplier}x credits
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-semibold">Estimated cost: </span>
                          {estimatedCredits.toLocaleString()} credits for {settings.wordCount} words
                        </p>
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Zap className="w-3 h-3" />
                          <span>{MODEL_CONFIG[selectedModel].label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="flex justify-center">
              <button
                onClick={proceedToSiteSelection}
                disabled={!selectedKeyword && !customTopic.trim()}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Continue to Site Selection
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Site Selection with Internal Links Configuration */}
        {step === 'site' && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Choose WordPress Site
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Select the WordPress site where you want to publish this content
                  </p>
                </div>
                <button
                  onClick={() => setStep('keyword')}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
              </div>

              {siteError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                    <p className="text-sm text-red-700 dark:text-red-300">{siteError}</p>
                  </div>
                </div>
              )}

              {loadingSites ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">Loading your WordPress sites...</p>
                </div>
              ) : availableSites.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No WordPress Sites Connected
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You need to connect at least one WordPress site before generating content. 
                    Connect your site to enable seamless publishing.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => router.push('/wordpress')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Connect WordPress Site
                    </button>
                    <button
                      onClick={() => setStep('keyword')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {availableSites.map((site) => (
                      <div
                        key={site.id}
                        onClick={() => {
                          setSelectedSite(site.id);
                          setSiteError(null);
                        }}
                        className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedSite === site.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {site.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                              {site.url}
                            </p>
                          </div>
                          <div className={`ml-3 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedSite === site.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedSite === site.id && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`flex items-center gap-1 ${
                            site.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              site.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            {site.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Added {new Date(site.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      onClick={() => router.push('/wordpress')}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Connect Another WordPress Site</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Internal Links Configuration - Step 2 (Only shown if enabled and site selected) */}
            {settings.includeInternalLinks && selectedSite && availableSites.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Configure Internal Links
                  </h3>
                  <button
                    onClick={loadInternalLinkSuggestions}
                    disabled={loadingSuggestions}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      loadingSuggestions
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                    {loadingSuggestions ? 'Finding Links...' : internalLinkSuggestions.length > 0 ? `Refresh (${internalLinkSuggestions.length})` : 'Find Links'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Smart Internal Linking Active
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          AI will automatically find and insert relevant internal links from your indexed URLs during content generation
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Link Density (per 1000 words)
                      </label>
                      <input
                        type="number"
                        value={settings.internalLinkDensity}
                        onChange={(e) => setSettings(prev => ({ ...prev, internalLinkDensity: parseInt(e.target.value) || 3 }))}
                        min="1"
                        max="10"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recommended: 2-5 links per 1000 words
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Links
                      </label>
                      <input
                        type="number"
                        value={settings.maxInternalLinks}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxInternalLinks: parseInt(e.target.value) || 5 }))}
                        min="1"
                        max="20"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total internal links in article
                      </p>
                    </div>
                  </div>

                  {/* Preview Available Links */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => {
                          setShowInternalLinks(!showInternalLinks);
                          if (!showInternalLinks && internalLinkSuggestions.length === 0) {
                            loadInternalLinkSuggestions();
                          }
                        }}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showInternalLinks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {loadingSuggestions 
                          ? '🔄 Loading available links...' 
                          : internalLinkSuggestions.length > 0
                          ? `✅ ${internalLinkSuggestions.length} links found - Click to ${showInternalLinks ? 'hide' : 'view'}`
                          : 'Check for available links'}
                      </button>
                      
                      {linksLastUpdated && internalLinkSuggestions.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Updated {formatTimeAgo(linksLastUpdated)}
                        </span>
                      )}
                    </div>

                    {/* Show count badge even when collapsed */}
                    {!showInternalLinks && internalLinkSuggestions.length > 0 && (
                      <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ✅ {internalLinkSuggestions.length} internal link{internalLinkSuggestions.length !== 1 ? 's' : ''} ready to use. Click above to preview.
                        </p>
                      </div>
                    )}

                    {/* Debug Info (Development Only) */}
                    {process.env.NODE_ENV === 'development' && showInternalLinks && (
                      <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-mono">
                        <div className="font-semibold mb-2">🔍 Debug Info:</div>
                        <div>Topic: {selectedKeyword?.keyword || customTopic || 'None'}</div>
                        <div>Site ID: {selectedSite || 'None'}</div>
                        <div>Loading: {loadingSuggestions ? 'Yes' : 'No'}</div>
                        <div>Links Found: {internalLinkSuggestions.length}</div>
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={async () => {
                                const topic = selectedKeyword?.keyword || customTopic;
                                console.log('🧪 Testing API directly...');
                                try {
                                  const resp = await sitemapAPI.getSuggestions(topic, selectedSite);
                                  console.log('✅ Direct API Response:', resp);
                                  alert(`API returned ${resp.data?.data?.length || 0} links. Check console for details.`);
                                } catch (err) {
                                  console.error('❌ Direct API Error:', err);
                                  alert('API call failed. Check console for details.');
                                }
                              }}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Test API
                            </button>
                            <button
                              onClick={async () => {
                                console.log('🔍 Checking site URLs...');
                                try {
                                  const resp = await sitemapAPI.getIndexedUrls({ siteId: selectedSite, limit: 10 });
                                  console.log('📊 Site URLs Response:', resp);
                                  const count = resp.data?.data?.length || 0;
                                  const total = resp.data?.pagination?.total || 0;
                                  alert(`Site has ${total} total URLs. Showing first ${count}. Check console for details.`);
                                  if (count > 0) {
                                    console.table(resp.data.data.map((url: any) => ({
                                      title: url.title || '(empty)',
                                      url: url.url.substring(0, 50) + '...',
                                      keywords: url.keywords?.slice(0, 3).join(', ') || '(none)'
                                    })));
                                  }
                                } catch (err) {
                                  console.error('❌ Error checking URLs:', err);
                                  alert('Failed to check URLs. Check console for details.');
                                }
                              }}
                              className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                            >
                              Check URLs
                            </button>
                            <button
                              onClick={async () => {
                                console.log('📊 Getting crawl stats...');
                                try {
                                  const resp = await sitemapAPI.getStats(selectedSite);
                                  console.log('📈 Crawl Stats:', resp);
                                  const stats = resp.data?.data || {};
                                  alert(`Total URLs: ${stats.totalUrls || 0}\nActive: ${stats.activeUrls || 0}\nLast Crawl: ${stats.lastCrawledAt || 'Never'}`);
                                } catch (err) {
                                  console.error('❌ Error getting stats:', err);
                                  alert('Failed to get stats. Check console.');
                                }
                              }}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              View Stats
                            </button>
                          </div>
                          
                          {/* Enrich Metadata Button - THE FIX! */}
                          <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded p-2 mb-2">
                              <p className="text-xs text-orange-800 dark:text-orange-200 font-semibold mb-1">
                                ⚠️ FIX: URLs have no titles/keywords!
                              </p>
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                Click below to fetch titles and keywords from your pages
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm('This will fetch titles, descriptions, and keywords from up to 50 URLs. This may take 1-2 minutes. Continue?')) {
                                  return;
                                }
                                
                                console.log('🔄 Starting metadata enrichment...');
                                setLoadingSuggestions(true);
                                
                                try {
                                  const resp = await sitemapAPI.enrichMetadata(selectedSite);
                                  console.log('✅ Enrichment Response:', resp);
                                  const count = resp.data?.data?.enrichedCount || 0;
                                  
                                  alert(`✅ Successfully enriched ${count} URLs!\n\nNow click "Refresh Links" to find matches.`);
                                  setSuccessMessage(`Enriched ${count} URLs with titles and keywords!`);
                                  
                                  // Auto-refresh links after enrichment
                                  setTimeout(() => {
                                    loadInternalLinkSuggestions();
                                  }, 1000);
                                  
                                } catch (err: any) {
                                  console.error('❌ Enrichment Error:', err);
                                  alert(`❌ Failed to enrich URLs: ${err.response?.data?.message || err.message}`);
                                  setError(`Enrichment failed: ${err.response?.data?.message || err.message}`);
                                } finally {
                                  setLoadingSuggestions(false);
                                }
                              }}
                              disabled={loadingSuggestions}
                              className={`w-full px-3 py-2 rounded font-semibold text-sm transition-all ${
                                loadingSuggestions 
                                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                              }`}
                            >
                              {loadingSuggestions ? (
                                <span className="flex items-center justify-center gap-2">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Enriching URLs... (1-2 min)
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-2">
                                  <Sparkles className="w-4 h-4" />
                                  🔧 Fix: Enrich URL Metadata
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-yellow-600 dark:text-yellow-400">
                          ⚠️ Check browser console for detailed logs
                        </div>
                      </div>
                    )}

                    {showInternalLinks && (
                      <div className="mt-3">
                        {loadingSuggestions ? (
                          <div className="text-center py-8">
                            <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Searching for relevant internal links...
                            </p>
                          </div>
                        ) : internalLinkSuggestions.length > 0 ? (
                          <div>
                            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                ✅ Found {internalLinkSuggestions.length} relevant internal link{internalLinkSuggestions.length !== 1 ? 's' : ''} for your content
                              </p>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {internalLinkSuggestions.map((suggestion, index) => (
                                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Link className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {suggestion.title}
                                        </p>
                                      </div>
                                      <a
                                        href={suggestion.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2"
                                      >
                                        {suggestion.url}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                      {suggestion.excerpt && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                          {suggestion.excerpt}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                                        {Math.round(suggestion.relevanceScore * 100)}% match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-start">
                              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                  No Indexed URLs Found
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                  This site hasn't been crawled yet. Run a sitemap crawl to enable internal link suggestions. The content will still be generated without internal links.
                                </p>
                                <button
                                  onClick={() => router.push('/sitemap')}
                                  className="mt-2 text-xs text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                                >
                                  Go to Sitemap Manager →
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {availableSites.length > 0 && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setStep('keyword')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                  Back to Topic
                </button>
                <button
                  onClick={proceedToGeneration}
                  disabled={!selectedSite}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Enhanced Content ({estimatedCredits.toLocaleString()} credits)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Content Generation Results */}
        {step === 'generate' && generatedContent && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Enhanced Content Generated Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Your content has been created with {MODEL_CONFIG[selectedModel].label}
              </p>
              {generatedContent.site && (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Ready to publish to <span className="font-semibold">{generatedContent.site.name}</span>
                </p>
              )}
              
              {/* Content Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {generatedContent.wordCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Words</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {generatedContent.readingTime}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Min Read</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {generatedContent.seoScore}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">SEO Score</div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push(`/articles/${generatedContent.id}/edit`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Content
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!selectedSite}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  title={!selectedSite ? 'Please select a site first' : 'Publish to WordPress'}
                >
                  <Send className="w-5 h-5" />
                  Publish Now
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule Post
                </button>
                <button
                  onClick={() => router.push('/articles')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  View All Articles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && generatedContent && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            router.push('/articles/schedule');
          }}
          // @ts-ignore
          preselectedContentId={generatedContent.id} 
        />
      )}

      {/* Publish Progress Modal */}
      <PublishProgressModal
        isOpen={showPublishProgress}
        currentStep={publishStep}
        error={publishError}
        onClose={() => {
          setShowPublishProgress(false);
          setPublishStep('validating');
          setPublishError(null);
        }}
      />
    </DashboardLayout>
  );
}
