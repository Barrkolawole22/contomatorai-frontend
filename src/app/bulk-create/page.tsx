'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import { bulkContentAPI, sitesAPI, knowledgebaseAPI } from '@/lib/api';
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
  ChevronUp,
  Upload,
  FileSpreadsheet,
  BookOpen,
  XCircle,
  Clock,
  Info,
  Layers
} from 'lucide-react';
import { KnowledgeDoc, CSVParseResult } from '@/types';

export type ContentMode = 'seo_blog' | 'news' | 'academic' | 'technical' | 'commercial' | 'opinion' | 'listicle';

const CONTENT_MODES: Record<ContentMode, {
  label: string;
  icon: string;
  description: string;
  defaults: {
    wordCount: number;
    includeFAQ: boolean;
    includeStatistics: boolean;
    includeExamples: boolean;
    includeComparisons: boolean;
    includeConclusion: boolean;
  };
}> = {
  seo_blog: {
    label: 'SEO Blog',
    icon: '📝',
    description: 'Conversational evergreen post, question-based headings, featured snippet optimized',
    defaults: { wordCount: 1500, includeFAQ: true, includeStatistics: true, includeExamples: true, includeComparisons: false, includeConclusion: true }
  },
  news: {
    label: 'News / Reporting',
    icon: '📰',
    description: 'Inverted pyramid, 5Ws lead, factual attribution, authority commentary',
    defaults: { wordCount: 800, includeFAQ: false, includeStatistics: false, includeExamples: false, includeComparisons: false, includeConclusion: true }
  },
  academic: {
    label: 'Academic / Research',
    icon: '🎓',
    description: 'Abstract, thesis-driven argument, formal register, evidence-based paragraphs',
    defaults: { wordCount: 2500, includeFAQ: false, includeStatistics: true, includeExamples: true, includeComparisons: false, includeConclusion: true }
  },
  technical: {
    label: 'Technical / How-To',
    icon: '⚙️',
    description: 'Prerequisites, numbered steps, expected outcomes, troubleshooting section',
    defaults: { wordCount: 2000, includeFAQ: true, includeStatistics: false, includeExamples: true, includeComparisons: false, includeConclusion: true }
  },
  commercial: {
    label: 'Commercial / Review',
    icon: '🛍️',
    description: 'Quick verdict, pros/cons, feature breakdown, who it\'s for, final recommendation',
    defaults: { wordCount: 1500, includeFAQ: false, includeStatistics: true, includeExamples: true, includeComparisons: true, includeConclusion: true }
  },
  opinion: {
    label: 'Opinion / Editorial',
    icon: '💬',
    description: 'Strong thesis, evidence-backed arguments, counterargument, persuasive close',
    defaults: { wordCount: 1200, includeFAQ: false, includeStatistics: true, includeExamples: true, includeComparisons: false, includeConclusion: true }
  },
  listicle: {
    label: 'Listicle / Roundup',
    icon: '📋',
    description: 'Numbered items, consistent per-item structure, scannable, brief sections',
    defaults: { wordCount: 1500, includeFAQ: false, includeStatistics: false, includeExamples: true, includeComparisons: false, includeConclusion: false }
  }
};

interface BulkEntry {
  keyword: string;
  scheduledDate: string;
  customPrompt: string;
  docIds?: string[];
  dos?: string;
  donts?: string;
}

interface Site {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

type InputMode = 'manual' | 'csv';
type ScheduleMode = 'now' | 'scheduled';

const MODEL_CONFIG = {
  gemini: { label: 'Fast (1x)', multiplier: 1, icon: '⚡' },
  'gemini-pro': { label: 'Balanced (2x)', multiplier: 2, icon: '🌿' },
  gpt4o: { label: 'Premium (3x)', multiplier: 3, icon: '🚀' },
  claude: { label: 'Elite (5x)', multiplier: 5, icon: '🔮' }
};

export default function BulkCreatePage() {
  const router = useRouter();
  const { user } = useAuth();

  // ---------- Common state ----------
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gemini-pro' | 'gpt4o' | 'claude'>('gemini');
  const [contentMode, setContentMode] = useState<ContentMode>('seo_blog');
  const [wordCount, setWordCount] = useState(1500);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Advanced settings (derived defaults from mode, overridable) ---
  const [seoFocus, setSeoFocus] = useState<'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced'>('balanced');
  const [callToAction, setCallToAction] = useState('');
  const [includeInternalLinks, setIncludeInternalLinks] = useState(true);
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(false);
  const [includeStatistics, setIncludeStatistics] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeComparisons, setIncludeComparisons] = useState(false);
  const [targetKeywordDensity, setTargetKeywordDensity] = useState(1.5);
  const [internalLinkDensity, setInternalLinkDensity] = useState(3);
  const [maxInternalLinks, setMaxInternalLinks] = useState(5);

  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  // ---------- Knowledgebase docs ----------
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());

  // ---------- Input / Schedule mode ----------
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('scheduled');

  // ---------- Global schedule ----------
  const [globalDate, setGlobalDate] = useState('');
  const [globalTime, setGlobalTime] = useState('');

  // ---------- Manual entries ----------
  const [entries, setEntries] = useState<BulkEntry[]>([
    { keyword: '', scheduledDate: '', customPrompt: '' }
  ]);

  // ---------- CSV state ----------
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsed, setCsvParsed] = useState<CSVParseResult | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Effects ----------
  useEffect(() => {
    loadSites();
    loadKnowledgeDocs();
  }, []);

  useEffect(() => {
    calculateEstimate();
  }, [entries, wordCount, selectedModel, inputMode, csvParsed]);

  // Apply mode defaults when mode changes
  const applyModeDefaults = (mode: ContentMode) => {
    const defaults = CONTENT_MODES[mode].defaults;
    setContentMode(mode);
    setWordCount(defaults.wordCount);
    setIncludeFAQ(defaults.includeFAQ);
    setIncludeStatistics(defaults.includeStatistics);
    setIncludeExamples(defaults.includeExamples);
    setIncludeComparisons(defaults.includeComparisons);
    setIncludeConclusion(defaults.includeConclusion);
  };

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

  const loadKnowledgeDocs = async () => {
    try {
      setLoadingDocs(true);
      const response = await knowledgebaseAPI.getDocuments();
      if (response.data.success) {
        const docs = (response.data.data || []).map((d: any) => ({
          ...d,
          id: d._id?.toString() || d.id,
        }));
        setKnowledgeDocs(docs);
      }
    } catch (error) {
      console.error('Error loading knowledge docs:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const calculateEstimate = () => {
    const validEntries = (inputMode === 'manual' ? entries : csvParsed?.rows || []).filter(
      (e: any) => e.keyword?.trim()
    );
    const multiplier = MODEL_CONFIG[selectedModel].multiplier;
    setEstimatedCredits(Math.ceil(wordCount * multiplier * validEntries.length));
  };

  const getEffectivePublishDate = (entry: BulkEntry): Date | null => {
    if (entry.scheduledDate) return new Date(entry.scheduledDate);
    if (scheduleMode === 'scheduled' && globalDate && globalTime) {
      return new Date(`${globalDate}T${globalTime}`);
    }
    return null;
  };

  const getTimeline = (publishDate: Date) => {
    const generateAt = new Date(publishDate.getTime() - 15 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    return { generateAt: fmt(generateAt), publishAt: fmt(publishDate) };
  };

  // ---------- Manual entry handlers ----------
  const addEntry = () => {
    if (entries.length >= 20) { setError('Maximum 20 articles per batch'); return; }
    setEntries([...entries, { keyword: '', scheduledDate: '', customPrompt: '' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof BulkEntry, value: any) => {
    const next = [...entries];
    if (field === 'docIds' && Array.isArray(value)) {
      next[index].docIds = value;
    } else if (typeof value === 'string') {
      (next[index] as any)[field] = value;
    }
    setEntries(next);
  };

  const toggleEntryExpanded = (index: number) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // ---------- CSV handlers ----------
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('CSV file must be under 2MB'); return; }
    setCsvFile(file);
    setError(null);
    setCsvParsed(null);
  };

  const uploadCsvForPreview = async () => {
    if (!csvFile) return;
    try {
      setCsvUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('csv', csvFile);
      const response = await bulkContentAPI.uploadCSV(formData);
      if (response.data.success) {
        setCsvParsed(response.data.data);
        if (response.data.data.errors?.length) {
          setError(`CSV parse warnings: ${response.data.data.errors.join('; ')}`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to parse CSV');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'CSV upload failed');
    } finally {
      setCsvUploading(false);
    }
  };

  const clearCsv = () => {
    setCsvFile(null);
    setCsvParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------- Submission ----------
  const handleBulkGenerate = async () => {
    try {
      setError(null);
      setResults(null);

      if (!selectedSite) { setError('Please select a WordPress site'); return; }

      let entriesToSubmit: any[] = [];

      if (inputMode === 'manual') {
        const validEntries = entries.filter(e => e.keyword.trim());
        if (validEntries.length === 0) { setError('Please add at least one keyword'); return; }

        if (scheduleMode === 'scheduled') {
          const hasGlobal = globalDate && globalTime;
          const missingDate = validEntries.some(e => !e.scheduledDate && !hasGlobal);
          if (missingDate) {
            setError('All articles need a publish date. Set a global date above or a per-article date.');
            return;
          }
          for (const e of validEntries) {
            const pub = getEffectivePublishDate(e);
            if (!pub) continue;
            if (pub.getTime() - Date.now() < 15 * 60 * 1000) {
              setError('Publish time must be at least 15 minutes in the future.');
              return;
            }
          }
        }

        entriesToSubmit = validEntries.map(e => {
          const pub = getEffectivePublishDate(e);
          return {
            keyword: e.keyword,
            scheduledDate: pub ? pub : undefined,
            customPrompt: e.customPrompt || undefined,
            docIds: e.docIds?.length ? e.docIds : undefined,
            dos: e.dos || undefined,
            donts: e.donts || undefined,
          };
        });
      } else {
        if (!csvParsed || csvParsed.rows.length === 0) {
          setError('No parsed CSV data. Upload and parse a CSV file first.');
          return;
        }
        entriesToSubmit = csvParsed.rows.map((row: any) => ({
          topic: row.topic,
          keyword: row.keyword,
          scheduledDate: row.publish_date ? new Date(row.publish_date) : undefined,
          docIds: row.doc_ids ? row.doc_ids.split('|').map((id: string) => id.trim()).filter(Boolean) : undefined,
          dos: row.dos || undefined,
          donts: row.donts || undefined,
          customPrompt: undefined,
        }));
      }

      const userCredits = user?.wordCredits || 0;
      if (userCredits < estimatedCredits) {
        setError(`Insufficient credits. Need ${estimatedCredits.toLocaleString()} but only have ${userCredits.toLocaleString()}`);
        return;
      }

      setLoading(true);

      const options = {
        siteId: selectedSite,
        model: selectedModel,
        contentMode,
        wordCount,
        targetAudience: 'general audience',
        includeIntroduction: includeIntro,
        includeConclusion,
        includeFAQ,
        includeExamples,
        includeStatistics,
        includeComparisons,
        includeInternalLinks,
        maxInternalLinks,
        internalLinkDensity,
        seoFocus,
        callToAction,
        targetKeywordDensity,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      let response;
      if (inputMode === 'csv') {
        response = await bulkContentAPI.executeCSV({ rows: entriesToSubmit, options });
      } else {
        response = await bulkContentAPI.generateAndSchedule({ entries: entriesToSubmit, options });
      }

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

  const validEntriesCount = inputMode === 'manual'
    ? entries.filter(e => e.keyword.trim()).length
    : csvParsed?.totalRows || 0;

  const isScheduledMode = scheduleMode === 'scheduled';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bulk Article Generation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate multiple articles at once with knowledgebase integration, custom prompts, and scheduling
          </p>
        </div>

        {/* Credits & Site Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Available Credits</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(user?.wordCredits || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Estimated Cost</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {estimatedCredits.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">WordPress Sites</span>
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

        {/* Generation Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generation Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Word Count
              </label>
              <input
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value) || 1500)}
                min="300" max="5000" step="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Content Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Content Mode
              <span className="text-gray-400 font-normal">(sets structure, voice, and formatting)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              {(Object.entries(CONTENT_MODES) as [ContentMode, typeof CONTENT_MODES[ContentMode]][]).map(([key, mode]) => (
                <div
                  key={key}
                  onClick={() => applyModeDefaults(key)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    contentMode === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">{mode.icon}</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{mode.label}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{mode.defaults.wordCount.toLocaleString()}w</div>
                </div>
              ))}
            </div>
            {contentMode && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {CONTENT_MODES[contentMode].description}
              </p>
            )}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SEO Focus</label>
                  <select value={seoFocus} onChange={(e) => setSeoFocus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="balanced">Balanced SEO</option>
                    <option value="primary_keyword">Primary Keyword Focus</option>
                    <option value="semantic_keywords">Semantic Keywords</option>
                    <option value="long_tail">Long-tail Keywords</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Call to Action (Optional)</label>
                  <input type="text" value={callToAction} onChange={(e) => setCallToAction(e.target.value)} placeholder="e.g., Contact us for a free consultation" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Content Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Introduction', checked: includeIntro, onChange: setIncludeIntro },
                      { label: 'Conclusion', checked: includeConclusion, onChange: setIncludeConclusion },
                      { label: 'FAQ Section', checked: includeFAQ, onChange: setIncludeFAQ },
                      { label: 'Statistics', checked: includeStatistics, onChange: setIncludeStatistics },
                      { label: 'Examples', checked: includeExamples, onChange: setIncludeExamples },
                      { label: 'Comparisons', checked: includeComparisons, onChange: setIncludeComparisons },
                    ].map(f => (
                      <label key={f.label} className="flex items-center gap-2">
                        <input type="checkbox" checked={f.checked} onChange={(e) => f.onChange(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Keyword Density (%)</label>
                  <input type="number" value={targetKeywordDensity} onChange={(e) => setTargetKeywordDensity(parseFloat(e.target.value) || 1.5)} min="0.5" max="5" step="0.1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeInternalLinks} onChange={(e) => setIncludeInternalLinks(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Include Internal Links</span>
                  </label>
                </div>
                {includeInternalLinks && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link Density (per 1000 words)</label>
                      <input type="number" value={internalLinkDensity} onChange={(e) => setInternalLinkDensity(parseInt(e.target.value) || 3)} min="1" max="10" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Links</label>
                      <input type="number" value={maxInternalLinks} onChange={(e) => setMaxInternalLinks(parseInt(e.target.value) || 5)} min="1" max="20" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input mode tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setInputMode('manual'); setError(null); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${inputMode === 'manual' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => { setInputMode('csv'); setError(null); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${inputMode === 'csv' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FileSpreadsheet className="w-4 h-4 inline mr-1" />
            CSV Upload
          </button>
        </div>

        {/* Manual Entry Panel */}
        {inputMode === 'manual' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">

            {/* Schedule mode toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScheduleMode('now')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${scheduleMode === 'now' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Zap className="w-4 h-4 inline mr-1" />
                Generate Now
              </button>
              <button
                onClick={() => setScheduleMode('scheduled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${scheduleMode === 'scheduled' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Auto-Schedule
              </button>
            </div>

            {/* How auto-schedule works */}
            {isScheduledMode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">How auto-schedule works</p>
                  <p>Set a publish time. The system generates the article 15 minutes before that time, then publishes to WordPress at the scheduled time.</p>
                  <p className="text-blue-600 dark:text-blue-400 font-mono text-xs mt-1">
                    Generate → [15 min review] → Auto-publish
                  </p>
                </div>
              </div>
            )}

            {/* Global date/time */}
            {isScheduledMode && (
              <div className="bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Global Publish Date <span className="text-gray-400 font-normal">(applies to all articles unless overridden per-article)</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="date"
                    value={globalDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setGlobalDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={globalTime}
                    onChange={(e) => setGlobalTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {globalDate && globalTime && (() => {
                    const pub = new Date(`${globalDate}T${globalTime}`);
                    const { generateAt, publishAt } = getTimeline(pub);
                    return (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                          <Sparkles className="w-3 h-3" /> Generate: {generateAt}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                          <Check className="w-3 h-3" /> Publish: {publishAt}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Article list header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Articles ({validEntriesCount}/20)
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

            {/* Entries */}
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const effectivePub = getEffectivePublishDate(entry);
                const timeline = effectivePub ? getTimeline(effectivePub) : null;

                return (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Keyword / Topic *
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {isScheduledMode ? 'Publish Date (override)' : 'Schedule (Optional)'}
                            </label>
                            <input
                              type="datetime-local"
                              value={entry.scheduledDate}
                              onChange={(e) => updateEntry(index, 'scheduledDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
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

                        {timeline && (
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                              <Sparkles className="w-3 h-3" /> Generate: {timeline.generateAt}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                              <Check className="w-3 h-3" /> Publish: {timeline.publishAt}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleEntryExpanded(index)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {expandedEntries.has(index) ? <><ChevronUp className="w-4 h-4" /> Hide Advanced</> : <><ChevronDown className="w-4 h-4" /> Show Advanced</>}
                        </button>

                        {expandedEntries.has(index) && (
                          <div className="space-y-3 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <BookOpen className="w-4 h-4 inline mr-1" />
                                Source Documents
                              </label>
                              {loadingDocs ? (
                                <p className="text-xs text-gray-500">Loading documents...</p>
                              ) : knowledgeDocs.length === 0 ? (
                                <p className="text-xs text-gray-500">No knowledgebase documents available.</p>
                              ) : (
                                <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
                                  {knowledgeDocs.map(doc => (
                                    <label key={doc.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={entry.docIds?.includes(doc.id) || false}
                                        onChange={(e) => {
                                          const current = entry.docIds || [];
                                          updateEntry(index, 'docIds', e.target.checked
                                            ? [...current, doc.id]
                                            : current.filter(id => id !== doc.id));
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-gray-800 dark:text-gray-200 flex-1">{doc.title}</span>
                                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${doc.status === 'ready' ? 'bg-green-100 text-green-700' : doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {doc.status}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Do's</label>
                              <input type="text" value={entry.dos || ''} onChange={(e) => updateEntry(index, 'dos', e.target.value)} placeholder="Things the AI should include..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Don'ts</label>
                              <input type="text" value={entry.donts || ''} onChange={(e) => updateEntry(index, 'donts', e.target.value)} placeholder="What the AI should NOT do..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {entries.length > 1 && (
                        <button
                          onClick={() => removeEntry(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CSV Upload Panel */}
        {inputMode === 'csv' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload CSV Content Calendar</h3>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Include a <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">publish_date</code> column (ISO format or YYYY-MM-DD HH:mm) to enable auto-schedule. The system will generate each article 15 minutes before its publish time.
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Columns: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">topic, keyword, tags, publish_date, doc_ids, dos, donts</code>. Only <strong>keyword</strong> is required.
            </p>

            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFileChange}
                className="text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              />
              <button
                onClick={uploadCsvForPreview}
                disabled={!csvFile || csvUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {csvUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <><Upload className="w-4 h-4" /> Parse CSV</>}
              </button>
              {csvFile && (
                <button onClick={clearCsv} className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Clear
                </button>
              )}
            </div>

            {csvParsed && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Preview ({csvParsed.totalRows} rows) • Est. credits: {csvParsed.estimatedCredits}
                  </h4>
                </div>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {['Topic', 'Keyword', 'Tags', 'Publish Date', 'Generate At', 'Docs', "Do's/Don'ts"].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {csvParsed.rows.slice(0, 50).map((row: any, idx: number) => {
                        const pub = row.publish_date ? new Date(row.publish_date) : null;
                        const generateAt = pub ? new Date(pub.getTime() - 15 * 60 * 1000) : null;
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.topic}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.keyword}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.tags || '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.publish_date || '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-yellow-700 dark:text-yellow-400">
                              {generateAt ? generateAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.doc_ids || '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                              {row.dos && <span className="text-green-600">Do</span>}
                              {row.donts && row.dos && ' / '}
                              {row.donts && <span className="text-red-600">Don't</span>}
                              {!row.dos && !row.donts && '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {csvParsed.rows.length > 50 && (
                        <tr><td colSpan={7} className="px-3 py-2 text-center text-gray-500">...and {csvParsed.rows.length - 50} more rows</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBulkGenerate}
            disabled={
              loading ||
              (inputMode === 'manual' ? validEntriesCount === 0 : !csvParsed || csvParsed.totalRows === 0) ||
              !selectedSite ||
              (user?.wordCredits || 0) < estimatedCredits
            }
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Processing {validEntriesCount} Article{validEntriesCount !== 1 ? 's' : ''}...</>
            ) : isScheduledMode && inputMode === 'manual' ? (
              <><Calendar className="w-6 h-6" /> Schedule {validEntriesCount} {CONTENT_MODES[contentMode].label}{validEntriesCount !== 1 ? 's' : ''} ({estimatedCredits.toLocaleString()} credits)</>
            ) : (
              <><Sparkles className="w-6 h-6" /> Generate {validEntriesCount} {CONTENT_MODES[contentMode].label}{validEntriesCount !== 1 ? 's' : ''} ({estimatedCredits.toLocaleString()} credits)</>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isScheduledMode ? 'Articles Scheduled!' : 'Generation Complete!'}
            </h3>

            {isScheduledMode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200 flex gap-2">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Articles will be auto-generated 15 minutes before their scheduled publish time. Check the Scheduler page to monitor or edit.</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{results.successful}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{results.failed}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{results.totalCreditsUsed.toLocaleString()}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Credits Used</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">Details:</h4>
              {results.results.map((result: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg flex items-center justify-between ${result.status === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
                    <span className="font-medium text-gray-900 dark:text-white">{result.keyword}</span>
                  </div>
                  {result.status === 'success' ? (
                    <div className="flex items-center gap-3 text-sm">
                      {result.scheduledDate && (
                        <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(result.scheduledDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className="text-green-600 dark:text-green-400">{result.creditsUsed} credits</span>
                    </div>
                  ) : (
                    <span className="text-sm text-red-700 dark:text-red-300">{result.error}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button onClick={() => router.push('/scheduler')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                View Scheduler
              </button>
              <button onClick={() => router.push('/articles')} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                View All Articles
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setEntries([{ keyword: '', scheduledDate: '', customPrompt: '' }]);
                  clearCsv();
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