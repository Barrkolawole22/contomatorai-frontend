// frontend/src/app/bulk-create/page.tsx - COMPLETE BULK CREATION PAGE
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import { bulkContentAPI, sitesAPI } from '@/lib/api';
import {
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  Calendar,
  AlertCircle,
  Sparkles,
  Zap,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BulkEntry {
  keyword: string;
  scheduledDate: string;
  customPrompt: string;
}

interface Site {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

export default function BulkCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [entries, setEntries] = useState<BulkEntry[]>([
    { keyword: '', scheduledDate: '', customPrompt: '' }
  ]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedModel, setSelectedModel] = useState<'groq' | 'gemini' | 'claude'>('groq');
  const [wordCount, setWordCount] = useState(1500);
  const [tone, setTone] = useState('professional');
  const [includeInternalLinks, setIncludeInternalLinks] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSites, setLoadingSites] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState(0);

  const MODEL_CONFIG = {
    groq: { label: 'Fast (1x)', multiplier: 1, icon: '⚡' },
    gemini: { label: 'Balanced (2x)', multiplier: 2, icon: '⭐' },
    claude: { label: 'Premium (5x)', multiplier: 5, icon: '💎' }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    calculateEstimate();
  }, [entries, wordCount, selectedModel]);

  const loadSites = async () => {
    try {
      setLoadingSites(true);
      const response = await sitesAPI.getUserSites();
      if (response.data.success) {
        setAvailableSites(response.data.data || []);
        if (response.data.data.length > 0) {
          setSelectedSite(response.data.data[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error loading sites:', error);
      setError('Failed to load WordPress sites');
    } finally {
      setLoadingSites(false);
    }
  };

  const calculateEstimate = () => {
    const validEntries = entries.filter(e => e.keyword.trim());
    const multiplier = MODEL_CONFIG[selectedModel].multiplier;
    const total = Math.ceil(wordCount * multiplier * validEntries.length);
    setEstimatedCredits(total);
  };

  const addEntry = () => {
    if (entries.length >= 20) {
      setError('Maximum 20 articles per batch');
      return;
    }
    setEntries([...entries, { keyword: '', scheduledDate: '', customPrompt: '' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof BulkEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleBulkGenerate = async () => {
    try {
      setError(null);
      setResults(null);
      
      const validEntries = entries.filter(e => e.keyword.trim());
      
      if (validEntries.length === 0) {
        setError('Please add at least one keyword');
        return;
      }

      if (!selectedSite) {
        setError('Please select a WordPress site');
        return;
      }

      if ((user?.wordCredits || 0) < estimatedCredits) {
        setError(`Insufficient credits. Need ${estimatedCredits.toLocaleString()} but only have ${(user?.wordCredits || 0).toLocaleString()}`);
        return;
      }

      setLoading(true);

      const response = await bulkContentAPI.generateAndSchedule({
        entries: validEntries.map(e => ({
          keyword: e.keyword,
          scheduledDate: e.scheduledDate || undefined,
          customPrompt: e.customPrompt || undefined
        })),
        options: {
          siteId: selectedSite,
          model: selectedModel,
          wordCount,
          tone,
          targetAudience: 'general audience',
          includeIntroduction: true,
          includeConclusion: true,
          includeExamples: true,
          includeStatistics: true,
          includeInternalLinks,
          maxInternalLinks: 5,
          internalLinkDensity: 3,
          contentIntent: 'informational',
          writingStyle: 'conversational',
          seoFocus: 'balanced'
        }
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        throw new Error(response.data.message || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Bulk generation error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const validEntriesCount = entries.filter(e => e.keyword.trim()).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bulk Article Generation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate multiple articles at once with custom prompts and scheduling
          </p>
        </div>

        {/* Credits & Site Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Available Credits
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(user?.wordCredits || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Estimated Cost
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {estimatedCredits.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                WordPress Sites
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {availableSites.length}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Main Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generation Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WordPress Site *
              </label>
              {loadingSites ? (
                <div className="text-sm text-gray-500">Loading sites...</div>
              ) : availableSites.length === 0 ? (
                <div className="text-sm text-red-600">No sites available</div>
              ) : (
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {availableSites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {Object.entries(MODEL_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Word Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Word Count
              </label>
              <input
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value) || 1500)}
                min="300"
                max="5000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeInternalLinks}
                      onChange={(e) => setIncludeInternalLinks(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Include Internal Links
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Article Entries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Articles to Generate ({validEntriesCount}/20)
            </h3>
            <button
              onClick={addEntry}
              disabled={entries.length >= 20}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Article
            </button>
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    {/* Keyword */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Keyword/Topic *
                      </label>
                      <input
                        type="text"
                        value={entry.keyword}
                        onChange={(e) => updateEntry(index, 'keyword', e.target.value)}
                        placeholder="Enter keyword or topic..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Schedule Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Schedule (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={entry.scheduledDate}
                          onChange={(e) => updateEntry(index, 'scheduledDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Custom Prompt */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Custom Prompt (Optional)
                        </label>
                        <input
                          type="text"
                          value={entry.customPrompt}
                          onChange={(e) => updateEntry(index, 'customPrompt', e.target.value)}
                          placeholder="Special instructions..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove article"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBulkGenerate}
            disabled={loading || validEntriesCount === 0 || !selectedSite || (user?.wordCredits || 0) < estimatedCredits}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating {validEntriesCount} Article{validEntriesCount !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate {validEntriesCount} Article{validEntriesCount !== 1 ? 's' : ''} ({estimatedCredits.toLocaleString()} credits)
              </>
            )}
          </button>
        </div>

        {/* Results Display */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Generation Complete!
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {results.successful}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {results.failed}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {results.totalCreditsUsed.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Credits Used</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">Details:</h4>
              {results.results.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    result.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.keyword}
                    </span>
                  </div>
                  {result.status === 'success' ? (
                    <div className="flex items-center gap-3 text-sm">
                      {result.scheduledDate && (
                        <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Scheduled
                        </span>
                      )}
                      <span className="text-green-600 dark:text-green-400">
                        {result.creditsUsed} credits
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => router.push('/articles')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View All Articles
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setEntries([{ keyword: '', scheduledDate: '', customPrompt: '' }]);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Generate More
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
