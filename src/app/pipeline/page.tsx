'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthProvider';
import { sitesAPI, pipelineAPI } from '@/lib/api';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Brain,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  BarChart3,
  Sparkles,
  Lock,
  TrendingUp,
  FileText,
  Send,
  Eye
} from 'lucide-react';

interface PipelineConfig {
  id: string;
  siteId: string;
  siteName?: string;
  isActive: boolean;
  schedule: 'hourly' | 'twice_daily' | 'daily' | 'weekly';
  niche: string;
  targetWordCount: number;
  model: 'gemini' | 'gemini-pro' | 'gpt4o' | 'claude';
  previewWindowMinutes: number;
  maxArticlesPerRun: number;
  lastRunAt?: string;
  createdAt: string;
}

interface PipelineRun {
  id: string;
  pipelineConfigId: string;
  status: 'running' | 'completed' | 'failed';
  articlesGenerated: number;
  articlesPublished: number;
  errors: string[];
  runAt: string;
  completedAt?: string;
  results: Array<{
    topic: string;
    contentId?: string;
    status: 'generated' | 'published' | 'failed';
    error?: string;
  }>;
}

interface Site {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

const MODEL_LABELS: Record<string, string> = {
  gemini: 'Gemini Flash (Fast)',
  'gemini-pro': 'Gemini Pro (Balanced)',
  gpt4o: 'GPT-4o (Premium)',
  claude: 'Claude Sonnet (Elite)'
};

const SCHEDULE_LABELS: Record<string, string> = {
  hourly: 'Every Hour',
  twice_daily: 'Twice Daily',
  daily: 'Once Daily',
  weekly: 'Weekly'
};

const SCHEDULE_CRON: Record<string, string> = {
  hourly: '0 * * * *',
  twice_daily: '0 8,20 * * *',
  daily: '0 9 * * *',
  weekly: '0 9 * * 1'
};

export default function PipelinePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [pipelines, setPipelines] = useState<PipelineConfig[]>([]);
  const [runs, setRuns] = useState<Record<string, PipelineRun[]>>({});
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    niche: '',
    schedule: 'daily' as PipelineConfig['schedule'],
    model: 'gemini-pro' as PipelineConfig['model'],
    targetWordCount: 1200,
    previewWindowMinutes: 15,
    maxArticlesPerRun: 3
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const userPlan = user?.plan || user?.subscription?.plan || 'free';
  const isPro = ['pro', 'agency', 'enterprise'].includes(userPlan.toLowerCase());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sitesRes, pipelinesRes] = await Promise.all([
        sitesAPI.getUserSites(),
        pipelineAPI.getPipelines()
      ]);

      if (sitesRes.data.success) {
        setSites(sitesRes.data.data || []);
        if (sitesRes.data.data?.length > 0) {
          setForm(prev => ({ ...prev, siteId: sitesRes.data.data[0].id }));
        }
      }

      if (pipelinesRes.data.success) {
        setPipelines(pipelinesRes.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const loadRuns = async (pipelineId: string) => {
    try {
      const res = await pipelineAPI.getRuns(pipelineId);
      if (res.data.success) {
        setRuns(prev => ({ ...prev, [pipelineId]: res.data.data || [] }));
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    }
  };

  const handleToggleExpand = (id: string) => {
    if (expandedPipeline === id) {
      setExpandedPipeline(null);
    } else {
      setExpandedPipeline(id);
      if (!runs[id]) loadRuns(id);
    }
  };

  const handleCreate = async () => {
    if (!form.siteId || !form.niche.trim()) {
      setFormError('Site and niche are required');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      const res = await pipelineAPI.createPipeline(form);
      if (res.data.success) {
        setPipelines(prev => [res.data.data, ...prev]);
        setShowCreateForm(false);
        setForm(prev => ({ ...prev, niche: '' }));
      } else {
        throw new Error(res.data.message || 'Failed to create pipeline');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create pipeline');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (pipeline: PipelineConfig) => {
    try {
      setTogglingId(pipeline.id);
      const res = await pipelineAPI.updatePipeline(pipeline.id, { isActive: !pipeline.isActive });
      if (res.data.success) {
        setPipelines(prev => prev.map(p => p.id === pipeline.id ? { ...p, isActive: !p.isActive } : p));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update pipeline');
    } finally {
      setTogglingId(null);
    }
  };

  const handleTrigger = async (id: string) => {
    try {
      setTriggeringId(id);
      const res = await pipelineAPI.triggerPipeline(id);
      if (res.data.success) {
        await loadRuns(id);
        if (expandedPipeline !== id) setExpandedPipeline(id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger pipeline');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pipeline? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await pipelineAPI.deletePipeline(id);
      setPipelines(prev => prev.filter(p => p.id !== id));
      if (expandedPipeline === id) setExpandedPipeline(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete pipeline');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getRunStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'running': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Lock screen for non-Pro users
  if (!isPro) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Autonomous Pipeline</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Fully autonomous content generation and publishing
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mx-auto mb-6">
              <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Pro Feature
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
              The Autonomous Pipeline is available on Pro and Agency plans. It automatically finds trending topics, generates articles, and publishes them to your WordPress sites — completely hands-free.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { icon: TrendingUp, label: 'Trend Detection', desc: 'Finds trending topics in your niche automatically' },
                { icon: Brain, label: 'AI Research', desc: 'Gemini Pro researches each topic with live search' },
                { icon: Send, label: 'Auto Publish', desc: 'Publishes to WordPress on your schedule' }
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-left">
                  <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">{label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/billing')}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Autonomous Pipeline
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set up automated content generation and publishing
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Pipeline
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* How it works banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                How Autonomous Pipeline Works
              </h3>
              <p className="text-blue-100 text-sm max-w-2xl">
                Each pipeline runs on your schedule: it fetches trending topics in your niche, uses Gemini Pro with live Google Search to research each topic, generates a full article, then either previews it for your approval or publishes directly to WordPress.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-blue-100">
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> Trend Detection
            </div>
            <span>→</span>
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <Brain className="w-3 h-3" /> AI Research
            </div>
            <span>→</span>
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <FileText className="w-3 h-3" /> Generate
            </div>
            <span>→</span>
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <Eye className="w-3 h-3" /> Preview
            </div>
            <span>→</span>
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
              <Send className="w-3 h-3" /> Publish
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Pipeline
              </h3>
              <button
                onClick={() => { setShowCreateForm(false); setFormError(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WordPress Site *
                </label>
                {sites.length === 0 ? (
                  <div className="text-sm text-red-600">No sites connected. <button onClick={() => router.push('/wordpress')} className="underline">Add a site</button></div>
                ) : (
                  <select
                    value={form.siteId}
                    onChange={e => setForm(prev => ({ ...prev, siteId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Niche *
                </label>
                <input
                  type="text"
                  value={form.niche}
                  onChange={e => setForm(prev => ({ ...prev, niche: e.target.value }))}
                  placeholder="e.g. Nigerian company law, digital marketing, tech news"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule
                </label>
                <select
                  value={form.schedule}
                  onChange={e => setForm(prev => ({ ...prev, schedule: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(SCHEDULE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label} ({SCHEDULE_CRON[key]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Model
                </label>
                <select
                  value={form.model}
                  onChange={e => setForm(prev => ({ ...prev, model: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(MODEL_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Word Count
                </label>
                <input
                  type="number"
                  value={form.targetWordCount}
                  onChange={e => setForm(prev => ({ ...prev, targetWordCount: parseInt(e.target.value) || 1200 }))}
                  min="300"
                  max="5000"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Articles Per Run
                </label>
                <input
                  type="number"
                  value={form.maxArticlesPerRun}
                  onChange={e => setForm(prev => ({ ...prev, maxArticlesPerRun: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview Window
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.previewWindowMinutes === 0}
                      onChange={() => setForm(prev => ({ ...prev, previewWindowMinutes: 0 }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.previewWindowMinutes > 0}
                      onChange={() => setForm(prev => ({ ...prev, previewWindowMinutes: 15 }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Preview for</span>
                  </label>
                  {form.previewWindowMinutes > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={form.previewWindowMinutes}
                        onChange={e => setForm(prev => ({ ...prev, previewWindowMinutes: parseInt(e.target.value) || 15 }))}
                        min="5"
                        max="1440"
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <span className="text-sm text-gray-500">minutes before publishing</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateForm(false); setFormError(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={formLoading || !form.siteId || !form.niche.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {formLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Pipeline</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {pipelines.length === 0 && !showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Pipelines Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first autonomous pipeline and let AI generate and publish content for you automatically.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto font-medium"
            >
              <Plus className="w-5 h-5" />
              Create First Pipeline
            </button>
          </div>
        )}

        {/* Pipeline List */}
        {pipelines.length > 0 && (
          <div className="space-y-4">
            {pipelines.map(pipeline => (
              <div key={pipeline.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Pipeline Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(pipeline)}
                        disabled={togglingId === pipeline.id}
                        className={`mt-1 flex-shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                          pipeline.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        } ${togglingId === pipeline.id ? 'opacity-50' : ''}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          pipeline.isActive ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {pipeline.niche}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pipeline.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {pipeline.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {pipeline.siteName || 'WordPress Site'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {SCHEDULE_LABELS[pipeline.schedule]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="w-3.5 h-3.5" />
                            {MODEL_LABELS[pipeline.model]?.split(' ')[0]} {MODEL_LABELS[pipeline.model]?.split(' ')[1]}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5" />
                            {pipeline.targetWordCount} words
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            Max {pipeline.maxArticlesPerRun}/run
                          </span>
                          {pipeline.previewWindowMinutes > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {pipeline.previewWindowMinutes}min preview
                            </span>
                          )}
                          {pipeline.lastRunAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Last run: {formatDate(pipeline.lastRunAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleTrigger(pipeline.id)}
                        disabled={triggeringId === pipeline.id}
                        title="Run now"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
                      >
                        {triggeringId === pipeline.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Run Now
                      </button>

                      <button
                        onClick={() => handleToggleExpand(pipeline.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="View run history"
                      >
                        {expandedPipeline === pipeline.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(pipeline.id)}
                        disabled={deletingId === pipeline.id}
                        className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                        title="Delete pipeline"
                      >
                        {deletingId === pipeline.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Run History */}
                {expandedPipeline === pipeline.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-5">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Run History
                    </h4>

                    {!runs[pipeline.id] ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading runs...
                      </div>
                    ) : runs[pipeline.id].length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No runs yet. Click "Run Now" to trigger the pipeline manually.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {runs[pipeline.id].slice(0, 5).map(run => (
                          <div key={run.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRunStatusColor(run.status)}`}>
                                  {run.status === 'running' && <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />}
                                  {run.status}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(run.runAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  {run.articlesGenerated} generated
                                </span>
                                <span className="flex items-center gap-1">
                                  <Send className="w-3.5 h-3.5" />
                                  {run.articlesPublished} published
                                </span>
                              </div>
                            </div>

                            {run.results?.length > 0 && (
                              <div className="space-y-1 mt-2">
                                {run.results.map((result, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    {result.status === 'published' ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    ) : result.status === 'failed' ? (
                                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{result.topic}</span>
                                    {result.error && (
                                      <span className="text-red-500 ml-auto flex-shrink-0">— {result.error}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {run.errors?.length > 0 && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                                {run.errors.join('; ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}