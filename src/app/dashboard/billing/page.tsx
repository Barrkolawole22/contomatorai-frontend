'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { billingAPI } from '@/lib/api';
import {
  CreditCard, Zap, Check, Star, TrendingUp, Calendar,
  BarChart3, RefreshCw, AlertCircle, Package, Clock,
  Globe, DollarSign, ChevronRight, Crown, Rocket, Building2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubscriptionPlan {
  id: string;
  type: 'subscription';
  name: string;
  description: string;
  wordsPerMonth: number;
  price: number;
  formattedPrice: string;
  currency: string;
  features: string[];
  isPopular: boolean;
  autonomousPipeline: boolean;
  knowledgebaseDocs: number;
  allowedModels: string[];
}

interface TopupPackage {
  id: string;
  type: 'topup';
  name: string;
  description: string;
  wordCount: number;
  price: number;
  formattedPrice: string;
  currency: string;
  features: string[];
  isPopular: boolean;
}

interface BillingInfo {
  wordCredits: number;
  subscriptionWordBalance: number;
  topupWordBalance: number;
  totalWordsUsed: number;
  currentMonthUsage: number;
  plan: string;
  planName: string;
  wordsPerMonth: number;
  subscriptionRenewalDate: string | null;
  preferredCurrency: 'USD' | 'NGN';
  autonomousPipelineEnabled: boolean;
  allowedModels: string[];
  usageStats: {
    daily: { totalWords: number };
    weekly: { totalWords: number };
    monthly: { totalWords: number };
  };
  purchaseHistory: Array<{
    id: string;
    packageName: string;
    wordsIncluded: number;
    amountPaid: number;
    currency: string;
    purchaseDate: string;
    formattedAmount: string;
    type: string;
  }>;
  needsRefill: boolean;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:   <Package className="w-5 h-5" />,
  basic:  <Zap     className="w-5 h-5" />,
  pro:    <Rocket  className="w-5 h-5" />,
  agency: <Building2 className="w-5 h-5" />,
};

export default function BillingPage() {
  const router      = useRouter();
  const searchParams= useSearchParams();
  const { user, refreshUser } = useAuth();

  const [currency, setCurrency]           = useState<'USD' | 'NGN'>('NGN');
  const [plans, setPlans]                 = useState<SubscriptionPlan[]>([]);
  const [topups, setTopups]               = useState<TopupPackage[]>([]);
  const [billingInfo, setBillingInfo]     = useState<BillingInfo | null>(null);
  const [usageChartData, setChartData]    = useState<{ date: string; words: number }[]>([]);
  const [loading, setLoading]             = useState(true);
  const [purchasing, setPurchasing]       = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<'plans' | 'topups' | 'usage' | 'history'>('plans');

  useEffect(() => { loadAll(); }, []);

  // Verify payment return
  useEffect(() => {
    const verify = searchParams.get('verify');
    const ref    = searchParams.get('reference') || searchParams.get('trxref');
    if (verify === '1' && ref) {
      verifyPayment(ref);
    }
  }, [searchParams]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pkgRes, infoRes, analyticsRes] = await Promise.all([
        billingAPI.getWordPackages(),
        billingAPI.getBillingInfo(),
        billingAPI.getUsageAnalytics('month'),
      ]);

      if (pkgRes.data?.success) {
        const { subscriptionPlans, topupPackages, currency: serverCurrency } = pkgRes.data.data;
        setPlans(subscriptionPlans || []);
        setTopups(topupPackages   || []);
        setCurrency(serverCurrency || 'NGN');
      }
      if (infoRes.data?.success) {
        setBillingInfo(infoRes.data.data);
        setCurrency(infoRes.data.data.preferredCurrency || 'NGN');
      }
      if (analyticsRes.data?.success) {
        setChartData(analyticsRes.data.data.chartData || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setLoading(true);
      const res = await billingAPI.verifyTransaction({ reference });
      if (res.data?.success) {
        await refreshUser();
        await loadAll();
        setSuccess(res.data.message || 'Payment successful!');
        router.replace('/billing');
      } else {
        setError(res.data?.message || 'Payment verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePlan = async (planId: string) => {
    try {
      setPurchasing(planId);
      setError(null);
      const res = await billingAPI.initializeTransaction({ planId, currency });
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to initialize payment');
      window.location.href = res.data.data.authorizationUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to initiate purchase');
      setPurchasing(null);
    }
  };

  const handlePurchaseTopup = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      setError(null);
      const res = await billingAPI.initializeTransaction({ packageId, currency });
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to initialize payment');
      window.location.href = res.data.data.authorizationUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to initiate purchase');
      setPurchasing(null);
    }
  };

  const handleCurrencyToggle = async (next: 'USD' | 'NGN') => {
    setCurrency(next);
    try {
      await billingAPI.updateCurrency(next);
      await loadAll();
    } catch { /* non-fatal */ }
  };

  const fmt = (n: number) => n.toLocaleString();

  const usagePct = () => {
    if (!billingInfo) return 0;
    const total = billingInfo.wordCredits + billingInfo.totalWordsUsed;
    return total > 0 ? Math.min((billingInfo.totalWordsUsed / total) * 100, 100) : 0;
  };

  // ── Chart ────────────────────────────────────────────────────────────────────
  const renderChart = () => {
    const last7: { date: Date; words: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const pt  = usageChartData.find(x => x.date.split('T')[0] === key);
      last7.push({ date: d, words: pt?.words || 0 });
    }
    const max   = Math.max(...last7.map(d => d.words), 100);
    const scale = [100, 500, 1000, 2000, 5000, 10000, 50000, 100000].find(s => s >= max) || Math.ceil(max / 1000) * 1000;

    return (
      <div className="flex gap-4">
        <div className="flex flex-col justify-between h-56 py-1 text-xs text-gray-500 dark:text-gray-400 w-14 text-right">
          {[scale, Math.round(scale * 0.75), Math.round(scale * 0.5), Math.round(scale * 0.25), 0].map((v, i) => (
            <span key={i}>{v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}</span>
          ))}
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="border-t border-gray-200 dark:border-gray-700" />
            ))}
          </div>
          <div className="relative h-56 flex items-end justify-between gap-1 px-1">
            {last7.map((d, i) => {
              const h = d.words > 0 ? Math.max((d.words / scale) * 224, 4) : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  {d.words > 0 && (
                    <div className="text-xs font-semibold text-blue-600 mb-1">{d.words >= 1000 ? `${(d.words / 1000).toFixed(1)}k` : d.words}</div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${d.words > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-transparent'}`}
                    style={{ height: `${h}px` }}
                    title={`${d.date.toLocaleDateString()}: ${d.words.toLocaleString()} words`}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Loading billing information…</span>
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = billingInfo?.plan || 'free';

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Credits</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage your subscription plan and word credit top-ups
            </p>
          </div>

          {/* Currency toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['NGN', 'USD'] as const).map(c => (
              <button
                key={c}
                onClick={() => handleCurrencyToggle(c)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currency === c
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {c === 'NGN' ? '₦ NGN' : '$ USD'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Alerts ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* ── Credit overview ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmt(billingInfo?.wordCredits || 0)}
              </div>
              <div className="text-sm text-gray-500">Total Available</div>
              {billingInfo?.needsRefill && (
                <div className="text-xs text-orange-500 mt-1">Low — consider topping up</div>
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmt(billingInfo?.subscriptionWordBalance || 0)}
              </div>
              <div className="text-sm text-gray-500">Subscription Words</div>
              {billingInfo?.subscriptionRenewalDate && (
                <div className="text-xs text-gray-400 mt-1">
                  Renews {new Date(billingInfo.subscriptionRenewalDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-3">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmt(billingInfo?.topupWordBalance || 0)}
              </div>
              <div className="text-sm text-gray-500">Topup Words</div>
              <div className="text-xs text-green-600 mt-1">Never expire</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmt(billingInfo?.currentMonthUsage || 0)}
              </div>
              <div className="text-sm text-gray-500">Used This Month</div>
            </div>
          </div>

          {/* Usage bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Credit Usage</span>
              <span className="text-gray-500">{usagePct().toFixed(1)}% used</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  usagePct() > 80 ? 'bg-red-500' : usagePct() > 60 ? 'bg-orange-500' : 'bg-blue-600'
                }`}
                style={{ width: `${usagePct()}%` }}
              />
            </div>
          </div>

          {/* Current plan badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Current plan:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              {PLAN_ICONS[currentPlan]}
              {billingInfo?.planName || currentPlan}
            </span>
            {billingInfo?.autonomousPipelineEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                <Crown className="w-3 h-3" /> Pipeline enabled
              </span>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {([
            { key: 'plans',   label: 'Subscription Plans', icon: <Rocket   className="w-4 h-4" /> },
            { key: 'topups',  label: 'Word Topups',        icon: <Package  className="w-4 h-4" /> },
            { key: 'usage',   label: 'Usage Analytics',   icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'history', label: 'Purchase History',   icon: <Clock    className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ── SUBSCRIPTION PLANS ─────────────────────────────────────────────── */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map(plan => {
              const isCurrent = plan.id === currentPlan;
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 p-6 flex flex-col ${
                    plan.isPopular
                      ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                      : isCurrent
                        ? 'border-green-500'
                        : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  {isCurrent && !plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-blue-600 dark:text-blue-400">{PLAN_ICONS[plan.id]}</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  </div>

                  <div className="mb-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.formattedPrice}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{fmt(plan.wordsPerMonth)} words/month</p>
                  <p className="text-xs text-gray-400 mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && handlePurchasePlan(plan.id)}
                    disabled={purchasing === plan.id || isCurrent || plan.price === 0}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 cursor-default'
                        : plan.isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                          : plan.price === 0
                            ? 'bg-gray-100 text-gray-500 cursor-default'
                            : 'bg-gray-800 dark:bg-gray-600 text-white hover:bg-gray-900 disabled:opacity-50'
                    }`}
                  >
                    {purchasing === plan.id ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : isCurrent ? (
                      <><Check className="w-4 h-4" /> Current Plan</>
                    ) : plan.price === 0 ? (
                      'Free Plan'
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Upgrade</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TOPUP PACKAGES ─────────────────────────────────────────────────── */}
        {activeTab === 'topups' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Top-up words are added on top of your subscription balance and <strong>never expire</strong>.
              Subscription words are consumed first.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topups.map(pkg => (
                <div
                  key={pkg.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 p-6 flex flex-col ${
                    pkg.isPopular
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Best Value
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{pkg.formattedPrice}</div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    {fmt(pkg.wordCount)} words
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {currency === 'NGN'
                      ? `₦${((pkg.price / pkg.wordCount) * 1000).toFixed(0)} per 1K words`
                      : `$${((pkg.price / pkg.wordCount) * 1000 / 100).toFixed(3)} per 1K words`
                    }
                  </p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchaseTopup(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                      pkg.isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                        : 'bg-gray-800 dark:bg-gray-600 text-white hover:bg-gray-900 disabled:opacity-50'
                    }`}
                  >
                    {purchasing === pkg.id ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Buy Words</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USAGE ANALYTICS ────────────────────────────────────────────────── */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Daily Usage — Last 7 Days
              </h3>
              {renderChart()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Words Today',        value: billingInfo?.usageStats.daily.totalWords  || 0, color: 'text-blue-600' },
                { label: 'Words This Week',    value: billingInfo?.usageStats.weekly.totalWords || 0, color: 'text-purple-600' },
                { label: 'Words This Month',   value: billingInfo?.usageStats.monthly.totalWords|| 0, color: 'text-green-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <p className="text-sm text-gray-500 mb-2">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{fmt(stat.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PURCHASE HISTORY ───────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase History</h3>
            </div>

            {!billingInfo?.purchaseHistory?.length ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No purchases yet.</p>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  View Plans
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Package', 'Type', 'Words', 'Amount', 'Date'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {billingInfo.purchaseHistory.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.packageName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.type === 'subscription'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {p.type === 'subscription' ? 'Subscription' : 'Topup'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{fmt(p.wordsIncluded)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {p.currency} {p.formattedAmount}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(p.purchaseDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}