// frontend/src/components/content/ContentGenerationForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { keywordsAPI, contentAPI, sitesAPI } from '@/lib/api';
import {
  FileText,
  Wand2,
  Settings,
  ChevronDown,
  ChevronUp,
  Globe,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Target,
  BarChart3,
  ShoppingCart,
} from 'lucide-react';

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
}

export default function ContentGenerationForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedKeyword, setSelectedKeyword] = useState<SavedKeyword | null>(null);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
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
    targetKeywordDensity: 1.5
  });

  useEffect(() => {
    loadSavedKeywords();
    loadUserSites();
  }, []);

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
      // Use the sites API from your API client
      const response = await sitesAPI.getSites();
      
      console.log('Sites loaded:', response.data);
      
      if (response.data.success) {
        const sites = response.data.data || [];
        setAvailableSites(sites);
        
        // Auto-select first active site if available
        const firstActiveSite = sites.find((site: Site) => site.isActive);
        if (firstActiveSite) {
          setSelectedSite(firstActiveSite.id);
          console.log('Auto-selected first active site:', firstActiveSite.name);
        } else if (sites.length > 0) {
          setSelectedSite(sites[0].id);
          console.log('Auto-selected first site:', sites[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading user sites:', error);
      setAvailableSites([]);
    }
  };

  const generateContent = async () => {
    const topic = selectedKeyword?.keyword || selectedKeyword?.term || customTopic;
    if (!topic) {
      setError('Please select a keyword or enter a custom topic');
      return;
    }

    if (!user || (user.credits || 0) <= 0) {
      setError('You have no credits remaining. Please upgrade your plan to continue.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('Preparing enhanced content generation...');
    
    try {
      setLoadingStage('Generating content with advanced AI settings...');
      
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
        extraInstructions: [
          settings.extraInstructions,
          settings.customPrompt,
          settings.additionalContext
        ].filter(Boolean).join('\n\n')
      };
      
      console.log('Generating content with siteId:', selectedSite);
      
      const response = await contentAPI.generateContent({
        keyword: topic,
        siteId: selectedSite || undefined, // Send undefined instead of null
        options: enhancedOptions
      });
      
      if (response.data.success) {
        const contentData = response.data.data;
        router.push(`/articles/${contentData.id}/edit`);
        console.log('Content generated successfully:', contentData.title);
      } else {
        throw new Error(response.data.message || 'Failed to generate content');
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStage('');
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

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Generating Enhanced Content with AI...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {loadingStage}
          </p>
        </div>
      )}

      {!loading && (
        <>
          {/* Topic Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Your Topic
            </h3>
            
            {/* Saved Keywords */}
            {savedKeywords.length > 0 && (
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
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {keyword.keyword}
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {keyword.searchVolume.toLocaleString()} searches
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {savedKeywords.length > 0 ? 'Or Enter Custom Topic' : 'Enter Your Topic'}
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

          {/* Site Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Globe className="w-5 h-5 inline-block mr-2" />
              WordPress Site
            </h3>
            
            {availableSites.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      No WordPress sites connected. You can still generate content, but you'll need to add a site before publishing.
                    </p>
                    <button
                      onClick={() => router.push('/wordpress')}
                      className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline"
                    >
                      Connect a WordPress site →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Site for Publishing
                </label>
                <select
                  value={selectedSite || ''}
                  onChange={(e) => setSelectedSite(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Generate without site (associate later)</option>
                  {availableSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} - {site.url}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedSite 
                    ? 'Content will be ready to publish to this site' 
                    : 'You can associate a site later before publishing'}
                </p>
              </div>
            )}
          </div>

          {/* Content Intent Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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

          {/* Rest of your existing settings sections... */}
          {/* (Keep all your existing advanced settings code) */}

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={generateContent}
              disabled={!selectedKeyword && !customTopic.trim()}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium text-lg transition-colors"
            >
              <Wand2 className="w-6 h-6" />
              Generate Enhanced Content
            </button>
          </div>

          {/* Credits Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have <span className="font-medium text-blue-600">{user?.credits || 0}</span> credits remaining
            </p>
          </div>
        </>
      )}
    </div>
  );
}