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
  XCircle
} from 'lucide-react';
import { KnowledgeDoc, CSVParseResult } from '@/types';

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

export default function BulkCreatePage() {
  const router = useRouter();
  const { user } = useAuth();

  // ---------- Common state ----------
  const [selectedSite, setSelectedSite] = useState('');
 const [selectedModel, setSelectedModel] = useState<'gemini' | 'gemini-pro' | 'gpt4o' | 'claude'>('gemini');
  const [wordCount, setWordCount] = useState(1500);
  const [tone, setTone] = useState<'professional' | 'casual' | 'friendly' | 'authoritative'>('professional');
  const [includeInternalLinks, setIncludeInternalLinks] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- New advanced settings ---
  const [writingStyle, setWritingStyle] = useState<'conversational' | 'academic' | 'journalistic' | 'technical' | 'creative'>('conversational');
  const [contentIntent, setContentIntent] = useState<'informational' | 'navigational' | 'commercial' | 'transactional'>('informational');
  const [seoFocus, setSeoFocus] = useState<'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced'>('balanced');
  const [callToAction, setCallToAction] = useState('');
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(false);
  const [includeStatistics, setIncludeStatistics] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeComparisons, setIncludeComparisons] = useState(false);
  const [targetKeywordDensity, setTargetKeywordDensity] = useState(1.5);
  const [internalLinkDensity, setInternalLinkDensity] = useState(3);
  const [maxInternalLinks, setMaxInternalLinks] = useState(5);
  // --- end new advanced settings ---

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

  // ---------- Input mode (manual / csv) ----------
  const [inputMode, setInputMode] = useState<InputMode>('manual');

  // ---------- Manual entries ----------
  const [entries, setEntries] = useState<BulkEntry[]>([
    { keyword: '', scheduledDate: '', customPrompt: '' }
  ]);

  // ---------- CSV state ----------
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsed, setCsvParsed] = useState<CSVParseResult | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MODEL_CONFIG = {
    gemini: { label: 'Fast (1x)', multiplier: 1, icon: '⚡' },
    'gemini-pro': { label: 'Balanced (2x)', multiplier: 2, icon: '🌿' },
    gpt4o: { label: 'Premium (3x)', multiplier: 3, icon: '🚀' },
    claude: { label: 'Elite (5x)', multiplier: 5, icon: '🔮' }
  };

  // ---------- Effects ----------
  useEffect(() => {
    loadSites();
    loadKnowledgeDocs();
  }, []);

  useEffect(() => {
    calculateEstimate();
  }, [entries, wordCount, selectedModel, inputMode, csvParsed]);

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
        setKnowledgeDocs(response.data.data || []);
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
    const total = Math.ceil(wordCount * multiplier * validEntries.length);
    setEstimatedCredits(total);
  };

  // ---------- Manual entry handlers ----------
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

  const updateEntry = (index: number, field: keyof BulkEntry, value: any) => {
    const newEntries = [...entries];
    if (field === 'docIds' && Array.isArray(value)) {
      newEntries[index].docIds = value;
    } else if (typeof value === 'string') {
      (newEntries[index] as any)[field] = value;
    }
    setEntries(newEntries);
  };

  const toggleEntryExpanded = (index: number) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ---------- CSV handlers ----------
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('CSV file must be under 2MB');
        return;
      }
      setCsvFile(file);
      setError(null);
      setCsvParsed(null);
    }
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

  // ---------- Common submission ----------
  const handleBulkGenerate = async () => {
    try {
      setError(null);
      setResults(null);

      if (!selectedSite) {
        setError('Please select a WordPress site');
        return;
      }

      let entriesToSubmit: any[] = [];

      if (inputMode === 'manual') {
        const validEntries = entries.filter(e => e.keyword.trim());
        if (validEntries.length === 0) {
          setError('Please add at least one keyword');
          return;
        }
        entriesToSubmit = validEntries.map(e => ({
          keyword: e.keyword,
          scheduledDate: e.scheduledDate || undefined,
          customPrompt: e.customPrompt || undefined,
          docIds: e.docIds?.length ? e.docIds : undefined,
          dos: e.dos || undefined,
          donts: e.donts || undefined,
        }));
      } else {
        if (!csvParsed || csvParsed.rows.length === 0) {
          setError('No parsed CSV data. Upload and parse a CSV file first.');
          return;
        }
        entriesToSubmit = csvParsed.rows.map(row => ({
          topic: row.topic,
          keyword: row.keyword,
          scheduledDate: row.publish_date || undefined,
          docIds: row.doc_ids ? row.doc_ids.split('|').map(id => id.trim()).filter(Boolean) : undefined,
          dos: row.dos || undefined,
          donts: row.donts || undefined,
          customPrompt: undefined,
          additionalContext: undefined,
        }));
      }

      const userCredits = user?.wordCredits || 0;
      if (userCredits < estimatedCredits) {
        setError(`Insufficient credits. Need ${estimatedCredits.toLocaleString()} but only have ${userCredits.toLocaleString()}`);
        return;
      }

      setLoading(true);

      // Build the options object with all new settings
      const options = {
        siteId: selectedSite,
        model: selectedModel,
        wordCount,
        tone,
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
        contentIntent,
        writingStyle,
        seoFocus,
        callToAction,
        targetKeywordDensity,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      let response;
      if (inputMode === 'csv') {
        response = await bulkContentAPI.executeCSV({
          rows: entriesToSubmit,
          options,
        });
      } else {
        response = await bulkContentAPI.generateAndSchedule({
          entries: entriesToSubmit,
          options,
        });
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

        {/* Main Settings (shared) */}
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
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
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
                min="300"
                max="5000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Advanced Settings (now fully expanded with all options) */}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value as 'professional' | 'casual' | 'friendly' | 'authoritative')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Writing Style</label>
                  <select value={writingStyle} onChange={(e) => setWritingStyle(e.target.value as 'conversational' | 'academic' | 'journalistic' | 'technical' | 'creative')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="conversational">Conversational</option>
                    <option value="academic">Academic</option>
                    <option value="journalistic">Journalistic</option>
                    <option value="technical">Technical</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Intent</label>
                  <select value={contentIntent} onChange={(e) => setContentIntent(e.target.value as 'informational' | 'navigational' | 'commercial' | 'transactional')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="informational">Informational</option>
                    <option value="navigational">Navigational</option>
                    <option value="commercial">Commercial</option>
                    <option value="transactional">Transactional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SEO Focus</label>
                  <select value={seoFocus} onChange={(e) => setSeoFocus(e.target.value as 'primary_keyword' | 'semantic_keywords' | 'long_tail' | 'balanced')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="balanced">Balanced SEO</option>
                    <option value="primary_keyword">Primary Keyword Focus</option>
                    <option value="semantic_keywords">Semantic Keywords</option>
                    <option value="long_tail">Long-tail Keywords</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Call to Action (Optional)</label>
                  <input type="text" value={callToAction} onChange={(e) => setCallToAction(e.target.value)} placeholder="e.g., Contact us for a free consultation" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>

                {/* Content feature checkboxes */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Content Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeIntro} onChange={(e) => setIncludeIntro(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Introduction</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeConclusion} onChange={(e) => setIncludeConclusion(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Conclusion</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeFAQ} onChange={(e) => setIncludeFAQ(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">FAQ Section</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeStatistics} onChange={(e) => setIncludeStatistics(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Statistics</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeExamples} onChange={(e) => setIncludeExamples(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Examples</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={includeComparisons} onChange={(e) => setIncludeComparisons(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Comparisons</span>
                    </label>
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

        {/* ---- INPUT MODE TABS ---- */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setInputMode('manual'); setError(null); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              inputMode === 'manual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => { setInputMode('csv'); setError(null); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              inputMode === 'csv'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 inline mr-1" />
            CSV Upload
          </button>
        </div>

        {/* ---- MANUAL ENTRY PANEL (unchanged except for internal link fields removed, already handled globally) ---- */}
        {inputMode === 'manual' && (
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

                      <button
                        type="button"
                        onClick={() => toggleEntryExpanded(index)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {expandedEntries.has(index) ? (
                          <><ChevronUp className="w-4 h-4" /> Hide Advanced</>
                        ) : (
                          <><ChevronDown className="w-4 h-4" /> Show Advanced</>
                        )}
                      </button>

                      {expandedEntries.has(index) && (
                        <div className="space-y-3 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              <BookOpen className="w-4 h-4 inline mr-1" />
                              Source Documents
                            </label>
                            {knowledgeDocs.length === 0 ? (
                              <p className="text-xs text-gray-500">No knowledgebase documents available.</p>
                            ) : (
                              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
                                {knowledgeDocs.map(doc => (
                                  <label key={doc.id} className="flex items-center gap-2 py-1 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={entry.docIds?.includes(doc.id) || false}
                                      onChange={(e) => {
                                        const current = entry.docIds || [];
                                        const updated = e.target.checked
                                          ? [...current, doc.id]
                                          : current.filter(id => id !== doc.id);
                                        updateEntry(index, 'docIds', updated);
                                      }}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-800 dark:text-gray-200">{doc.title}</span>
                                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                                      doc.status === 'ready' ? 'bg-green-100 text-green-700' :
                                      doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>{doc.status}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Do's (Optional instructions)
                            </label>
                            <input
                              type="text"
                              value={entry.dos || ''}
                              onChange={(e) => updateEntry(index, 'dos', e.target.value)}
                              placeholder="Things the AI should include..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Don'ts (Things to avoid)
                            </label>
                            <input
                              type="text"
                              value={entry.donts || ''}
                              onChange={(e) => updateEntry(index, 'donts', e.target.value)}
                              placeholder="What the AI should NOT do..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

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
        )}

        {/* ---- CSV UPLOAD PANEL (unchanged) ---- */}
        {inputMode === 'csv' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload CSV Content Calendar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              CSV columns: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">topic, keyword, tags, publish_date, doc_ids, dos, donts</code>.
              Only <strong>topic</strong> and <strong>keyword</strong> are required.
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
                {csvUploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Parse CSV</>
                )}
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publish Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Docs</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Do's / Don'ts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {csvParsed.rows.slice(0, 50).map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.topic}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">{row.keyword}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.tags || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.publish_date || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{row.doc_ids || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                            {row.dos && <span className="text-green-600">Do</span>}
                            {row.donts && (row.dos ? ' / ' : '') + ''}
                            {row.donts && <span className="text-red-600">Don't</span>}
                            {!row.dos && !row.donts && '-'}
                          </td>
                        </tr>
                      ))}
                      {csvParsed.rows.length > 50 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                            ...and {csvParsed.rows.length - 50} more rows
                          </td>
                        </tr>
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