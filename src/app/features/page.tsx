export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';
import { Zap, Globe, TrendingUp, Shield, Users, BarChart2, Repeat, Layers, Search, Check, ArrowRight } from 'lucide-react';

const features = [
  { icon: Zap,      color: 'blue',   title: 'AI Content Generation',
    desc: 'Generate SEO-optimized blog posts, articles, and landing pages in seconds using GPT-4, Claude, and Gemini.',
    bullets: ['Custom tone & style controls', 'Adjustable word count (500–10,000+)', 'Multi-language support', 'Internal link suggestions'] },
  { icon: Globe,    color: 'purple', title: 'WordPress Integration',
    desc: 'Connect unlimited WordPress sites and publish content directly with full control over scheduling and metadata.',
    bullets: ['One-click publishing', 'Multi-site management', 'Scheduled publishing', 'Draft & revision support'] },
  { icon: TrendingUp, color: 'green', title: 'Keyword Research',
    desc: 'Discover high-value keywords with difficulty scores, search volume, and content gap analysis.',
    bullets: ['Keyword difficulty scoring', 'Related keyword clusters', 'Content gap analysis', 'SERP tracking'] },
  { icon: BarChart2, color: 'yellow', title: 'Content Analytics',
    desc: 'Track performance of every piece of content and understand what resonates with your audience.',
    bullets: ['SEO score tracking', 'Word count analytics', 'Publication status', 'Export reports'] },
  { icon: Repeat,   color: 'indigo', title: 'Autonomous Pipeline',
    desc: 'Set up content pipelines that run on autopilot — define your topics and let ContomatorAI handle the rest.',
    bullets: ['Scheduled content runs', 'RSS feed integration', 'Topic-based automation', 'Failure alerts & retries'] },
  { icon: Layers,   color: 'pink',   title: 'Knowledge Base',
    desc: 'Upload brand documents and style guides so the AI always produces on-brand content.',
    bullets: ['PDF & document upload', 'Brand voice consistency', 'Custom prompt templates', 'Context injection'] },
  { icon: Search,   color: 'teal',   title: 'Sitemap Crawler',
    desc: 'Crawl your WordPress sites to audit content, find gaps, and map internal linking opportunities.',
    bullets: ['Full site URL discovery', 'Content gap detection', 'Internal link mapping', 'Duplicate detection'] },
  { icon: Shield,   color: 'red',    title: 'Secure & Reliable',
    desc: 'Enterprise-grade security with JWT auth, encrypted credentials, rate limiting, and 99.9% uptime.',
    bullets: ['End-to-end encryption', 'OAuth WordPress auth', 'Role-based access control', '99.9% uptime SLA'] },
  { icon: Users,    color: 'orange', title: 'Team Collaboration',
    desc: 'Invite team members, assign roles, and manage content workflows together.',
    bullets: ['Multi-user accounts', 'Admin & editor roles', 'Activity audit logs', 'Shared content library'] },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600',
  indigo: 'bg-indigo-50 text-indigo-600', pink: 'bg-pink-50 text-pink-600',
  teal: 'bg-teal-50 text-teal-600', red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav active="Features" />

      <section className="pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" /> Everything you need to scale content
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful features for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              modern content teams
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From AI generation to autonomous publishing pipelines — every tool you need to dominate your niche with content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center justify-center shadow-lg">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/pricing" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, color, title, desc, bullets }) => (
              <div key={title} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-8 border border-gray-100">
                <div className={`w-14 h-14 ${colorMap[color]} rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 mb-5 leading-relaxed">{desc}</p>
                <ul className="space-y-2">
                  {bullets.map(b => (
                    <li key={b} className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to see it in action?</h2>
          <p className="text-xl text-blue-100 mb-8">Start your free trial today. No credit card required.</p>
          <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
