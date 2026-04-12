'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
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
  Download
} from 'lucide-react';

interface SavedKeyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  status: 'available' | 'used';
}

interface ArticleOutline {
  title: string;
  introduction: string;
  sections: {
    heading: string;
    subpoints: string[];
  }[];
  conclusion: string;
  wordCount: number;
}

interface GenerationSettings {
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  length: 'short' | 'medium' | 'long';
  includeIntro: boolean;
  includeConclusion: boolean;
  includeFAQ: boolean;
  targetAudience: string;
}

export default function CreateArticlePage() {
  const { user } = useAuth();
  const [step, setStep] = useState<'keyword' | 'outline' | 'generate' | 'edit'>('keyword');
  const [selectedKeyword, setSelectedKeyword] = useState<SavedKeyword | null>(null);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [outline, setOutline] = useState<ArticleOutline | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>({
    tone: 'professional',
    length: 'medium',
    includeIntro: true,
    includeConclusion: true,
    includeFAQ: false,
    targetAudience: 'General audience'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSavedKeywords();
  }, []);

  const loadSavedKeywords = async () => {
    // Mock data - replace with actual API call
    const mockKeywords: SavedKeyword[] = [
      {
        id: '1',
        keyword: 'AI content writing',
        searchVolume: 8100,
        difficulty: 65,
        status: 'available'
      },
      {
        id: '2',
        keyword: 'WordPress automation',
        searchVolume: 2900,
        difficulty: 42,
        status: 'available'
      },
      {
        id: '3',
        keyword: 'SEO optimization tools',
        searchVolume: 5400,
        difficulty: 58,
        status: 'used'
      }
    ];
    setSavedKeywords(mockKeywords);
  };

  const generateOutline = async () => {
    const topic = selectedKeyword?.keyword || customTopic;
    if (!topic) return;

    setLoading(true);
    setLoadingStage('Analyzing topic and generating outline...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockOutline: ArticleOutline = {
        title: `The Complete Guide to ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        introduction: `Understanding ${topic} is crucial for modern businesses and individuals looking to stay competitive in today's digital landscape.`,
        sections: [
          {
            heading: `What is ${topic}?`,
            subpoints: [
              'Definition and core concepts',
              'Historical background and evolution',
              'Current market landscape'
            ]
          },
          {
            heading: `Benefits of ${topic}`,
            subpoints: [
              'Increased efficiency and productivity',
              'Cost savings and ROI',
              'Competitive advantages'
            ]
          },
          {
            heading: `How to Implement ${topic}`,
            subpoints: [
              'Step-by-step implementation guide',
              'Best practices and recommendations',
              'Common pitfalls to avoid'
            ]
          },
          {
            heading: `Tools and Resources for ${topic}`,
            subpoints: [
              'Top recommended tools',
              'Free vs paid options',
              'Integration considerations'
            ]
          },
          {
            heading: `Case Studies and Examples`,
            subpoints: [
              'Success stories from industry leaders',
              'Lessons learned from failures',
              'Measurable results and metrics'
            ]
          }
        ],
        conclusion: `${topic} represents a significant opportunity for growth and improvement. By following the strategies outlined in this guide, you can successfully implement and benefit from these approaches.`,
        wordCount: 2500
      };
      
      setOutline(mockOutline);
      setStep('outline');
    } catch (error) {
      console.error('Error generating outline:', error);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const generateFullArticle = async () => {
    if (!outline) return;

    setLoading(true);
    setLoadingStage('Generating full article content...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const mockArticle = `# ${outline.title}

${outline.introduction}

## ${outline.sections[0].heading}

${outline.sections[0].subpoints.map(point => `
### ${point}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`).join('')}

## ${outline.sections[1].heading}

${outline.sections[1].subpoints.map(point => `
### ${point}

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
`).join('')}

## ${outline.sections[2].heading}

${outline.sections[2].subpoints.map(point => `
### ${point}

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
`).join('')}

## Conclusion

${outline.conclusion}

---

*This article was generated using AI-powered content creation tools. Always review and customize the content to match your brand voice and specific requirements.*`;

      setGeneratedContent(mockArticle);
      setEditingContent(mockArticle);
      setStep('generate');
    } catch (error) {
      console.error('Error generating article:', error);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const saveArticle = async (status: 'draft' | 'published') => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update keyword status if used
      if (selectedKeyword) {
        setSavedKeywords(prev => 
          prev.map(k => 
            k.id === selectedKeyword.id 
              ? { ...k, status: 'used' }
              : k
          )
        );
      }
      
      // Reset form
      setStep('keyword');
      setSelectedKeyword(null);
      setCustomTopic('');
      setOutline(null);
      setGeneratedContent('');
      setEditingContent('');
      setIsEditing(false);
      
      alert(`Article ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`);
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600 bg-green-50';
    if (difficulty <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStepStatus = (stepName: string) => {
    const stepOrder = ['keyword', 'outline', 'generate', 'edit'];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepName);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <DashboardLayout>
      {/* Main Content - Remove any duplicate navigation/sidebar elements */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Article
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate AI-powered content from your saved keywords
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            {[
              { key: 'keyword', label: 'Choose Topic', icon: Target },
              { key: 'outline', label: 'Generate Outline', icon: BookOpen },
              { key: 'generate', label: 'Create Content', icon: Wand2 },
              { key: 'edit', label: 'Review & Publish', icon: Edit3 }
            ].map((stepItem, index) => {
              const status = getStepStatus(stepItem.key);
              const Icon = stepItem.icon;
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === 'completed' 
                      ? 'bg-green-100 text-green-600' 
                      : status === 'current'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      status === 'current' 
                        ? 'text-primary-600' 
                        : status === 'completed'
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {stepItem.label}
                    </div>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="w-5 h-5 text-gray-300 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <RefreshCw className="w-8 h-8 text-primary-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Generating Content...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {loadingStage}
            </p>
          </div>
        )}

        {/* Step 1: Choose Topic */}
        {step === 'keyword' && !loading && (
          <div className="space-y-6">
            {/* Saved Keywords */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Choose from Saved Keywords
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedKeywords.filter(k => k.status === 'available').map((keyword) => (
                  <div
                    key={keyword.id}
                    onClick={() => setSelectedKeyword(keyword)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedKeyword?.id === keyword.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
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
                      Search Volume: {keyword.searchVolume.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              {savedKeywords.filter(k => k.status === 'available').length === 0 && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No available keywords found. Visit the keyword research page to save some keywords first.
                  </p>
                </div>
              )}
            </div>

            {/* Custom Topic */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Or Enter Custom Topic
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    if (e.target.value) setSelectedKeyword(null);
                  }}
                  placeholder="Enter your topic or keyword..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generation Settings
                </h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {showSettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              
              {showSettings && (
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
                      Length
                    </label>
                    <select
                      value={settings.length}
                      onChange={(e) => setSettings(prev => ({ ...prev, length: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="short">Short (800-1200 words)</option>
                      <option value="medium">Medium (1500-2500 words)</option>
                      <option value="long">Long (3000+ words)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={settings.targetAudience}
                      onChange={(e) => setSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                      placeholder="e.g., Beginners, Professionals, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Include Sections
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'includeIntro', label: 'Introduction' },
                        { key: 'includeConclusion', label: 'Conclusion' },
                        { key: 'includeFAQ', label: 'FAQ Section' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings[key as keyof GenerationSettings] as boolean}
                            onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={generateOutline}
                disabled={!selectedKeyword && !customTopic.trim()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <Lightbulb className="w-5 h-5" />
                Generate Outline
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review Outline */}
        {step === 'outline' && outline && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Generated Outline
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated: {outline.wordCount} words
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {outline.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {outline.introduction}
                  </p>
                </div>
                
                {outline.sections.map((section, index) => (
                  <div key={index}>
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {section.heading}
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                      {section.subpoints.map((point, pointIndex) => (
                        <li key={pointIndex}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Conclusion
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {outline.conclusion}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('keyword')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Topic
              </button>
              <button
                onClick={generateFullArticle}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium"
              >
                <Wand2 className="w-5 h-5" />
                Generate Full Article
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Content */}
        {step === 'generate' && generatedContent && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Generated Article
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      {isEditing ? 'Preview' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>
              
              {isEditing ? (
                <div className="p-6">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Edit your article content here..."
                  />
                </div>
              ) : (
                <div className="p-6 prose dark:prose-invert max-w-none">
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: editingContent.replace(/\n/g, '<br>').replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('outline')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back to Outline
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => saveArticle('draft')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Draft
                </button>
                <button
                  onClick={() => saveArticle('published')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                >
                  <Send className="w-5 h-5" />
                  Publish Article
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
