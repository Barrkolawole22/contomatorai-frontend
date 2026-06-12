export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';
import { Code, Key, Zap, Shield, ArrowRight, Terminal, BookOpen } from 'lucide-react';

const endpoints = [
  { method: 'POST', path: '/api/auth/login',           desc: 'Authenticate and receive access token' },
  { method: 'POST', path: '/api/content/generate',     desc: 'Generate AI content with custom parameters' },
  { method: 'GET',  path: '/api/content',              desc: 'List all content for authenticated user' },
  { method: 'POST', path: '/api/keywords/research',    desc: 'Research keywords with difficulty scores' },
  { method: 'GET',  path: '/api/billing/packages',     desc: 'List available word packages' },
  { method: 'POST', path: '/api/billing/initialize-transaction', desc: 'Start a payment transaction' },
  { method: 'GET',  path: '/api/wordpress',            desc: 'List connected WordPress sites' },
  { method: 'POST', path: '/api/pipeline',             desc: 'Create autonomous content pipeline' },
];

const methodColor: Record<string, string> = {
  GET:    'bg-green-100 text-green-700',
  POST:   'bg-blue-100 text-blue-700',
  PUT:    'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav active="API" />

      <section className="pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 text-sm font-medium mb-6">
            <Code className="w-4 h-4 mr-2" /> REST API
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ContomatorAI{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              API Reference
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build powerful integrations with the ContomatorAI REST API. Generate content, manage WordPress sites, and automate publishing pipelines programmatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center justify-center shadow-lg">
              Get API Key <Key className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/docs" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors inline-flex items-center justify-center">
              <BookOpen className="mr-2 h-5 w-5" /> Full Docs
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Base URL */}
          <div className="bg-gray-900 rounded-2xl p-6 mb-8">
            <p className="text-gray-400 text-sm mb-2">Base URL</p>
            <code className="text-green-400 text-lg font-mono">https://api.contomatorai.com/api</code>
          </div>

          {/* Auth */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mr-3">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
            </div>
            <p className="text-gray-600 mb-4">All API requests require a Bearer token in the Authorization header.</p>
            <div className="bg-gray-900 rounded-xl p-4">
              <code className="text-green-400 font-mono text-sm whitespace-pre">{`Authorization: Bearer YOUR_API_KEY`}</code>
            </div>
            <p className="text-gray-500 text-sm mt-4">Get your API key from <Link href="/settings?tab=api" className="text-blue-600 hover:underline">Settings → API & Integrations</Link>.</p>
          </div>

          {/* Quick Example */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-3">
                <Terminal className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Start</h2>
            </div>
            <p className="text-gray-600 mb-4">Generate your first piece of content in one API call:</p>
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <code className="text-green-400 font-mono text-sm whitespace-pre">{`curl -X POST https://api.contomatorai.com/api/content/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "keyword": "best wordpress plugins 2025",
    "wordCount": 1500,
    "tone": "professional",
    "model": "claude"
  }'`}</code>
            </div>
          </div>

          {/* Endpoints */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mr-3">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Core Endpoints</h2>
            </div>
            <div className="space-y-3">
              {endpoints.map(({ method, path, desc }) => (
                <div key={path} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold mr-4 min-w-[52px] justify-center ${methodColor[method]}`}>
                    {method}
                  </span>
                  <code className="text-gray-800 font-mono text-sm mr-4 min-w-[300px]">{path}</code>
                  <span className="text-gray-500 text-sm">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limits */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mr-3">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Rate Limits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { plan: 'Starter',      limit: '100 req/min',  color: 'blue'   },
                { plan: 'Professional', limit: '500 req/min',  color: 'purple' },
                { plan: 'Enterprise',   limit: 'Unlimited',    color: 'green'  },
              ].map(({ plan, limit, color }) => (
                <div key={plan} className={`p-4 rounded-xl bg-${color}-50 border border-${color}-100`}>
                  <p className={`font-semibold text-${color}-700`}>{plan}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{limit}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start building?</h2>
          <p className="text-xl text-blue-100 mb-8">Get your API key and start integrating in minutes.</p>
          <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center">
            Get Your API Key <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
