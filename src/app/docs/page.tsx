export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';
import { BookOpen, Zap, Globe, TrendingUp, Repeat, Key, ArrowRight, ChevronRight } from 'lucide-react';

const sections = [
  { icon: Zap,        color: 'blue',   title: 'Getting Started',
    desc: 'Create your account, add your first WordPress site, and generate your first piece of content.',
    links: ['Quick Start Guide', 'Account Setup', 'Connecting WordPress', 'Your First Article'] },
  { icon: Globe,      color: 'purple', title: 'WordPress Integration',
    desc: 'Connect and manage multiple WordPress sites, configure auto-publish settings, and manage categories.',
    links: ['Adding a Site', 'Application Passwords', 'Publishing Settings', 'Troubleshooting'] },
  { icon: TrendingUp, color: 'green',  title: 'Content Generation',
    desc: 'Learn how to use AI models, tune tone and length, add keywords, and use the knowledge base.',
    links: ['Choosing AI Models', 'Keyword Optimization', 'Tone & Style', 'Knowledge Base'] },
  { icon: Repeat,     color: 'indigo', title: 'Autonomous Pipelines',
    desc: 'Set up fully automated content workflows that run on a schedule without manual intervention.',
    links: ['Pipeline Basics', 'RSS Integration', 'Scheduling', 'Monitoring & Alerts'] },
  { icon: Key,        color: 'yellow', title: 'API Reference',
    desc: 'Integrate ContomatorAI into your own tools and workflows using the REST API.',
    links: ['Authentication', 'Core Endpoints', 'Webhooks', 'Rate Limits'] },
  { icon: BookOpen,   color: 'pink',   title: 'Billing & Credits',
    desc: 'Understand word credits, subscription plans, top-ups, and how billing works.',
    links: ['How Credits Work', 'Subscription Plans', 'Top-up Packages', 'Invoices'] },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600', indigo: 'bg-indigo-50 text-indigo-600',
  yellow: 'bg-yellow-50 text-yellow-600', pink: 'bg-pink-50 text-pink-600',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav active="Docs" />

      <section className="pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4 mr-2" /> Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ContomatorAI{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Everything you need to get up and running — from connecting your first WordPress site to building fully automated content pipelines.
          </p>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full px-5 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-gray-900 bg-white"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map(({ icon: Icon, color, title, desc, links }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-8">
                <div className={`w-12 h-12 ${colorMap[color]} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">{desc}</p>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link}>
                      <Link href="/help" className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        <ChevronRight className="w-4 h-4 mr-1" />{link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Quick links bar */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h2>
            <p className="text-blue-100 mb-6">Our support team is ready to help you out.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/help" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Visit Help Center
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
