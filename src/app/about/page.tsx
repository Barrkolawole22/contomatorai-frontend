export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';
import { Zap, Users, Globe, TrendingUp, ArrowRight, Heart } from 'lucide-react';

const stats = [
  { value: '2,500+', label: 'Active Users'      },
  { value: '500M+',  label: 'Words Generated'   },
  { value: '15,000+',label: 'WordPress Sites'   },
  { value: '99.9%',  label: 'Uptime'            },
];

const values = [
  { icon: Zap,         color: 'blue',   title: 'Speed First',
    desc: 'We believe content teams should spend time on strategy, not repetitive writing. Every feature we build is designed to save you time.' },
  { icon: Globe,       color: 'purple', title: 'Built for WordPress',
    desc: 'WordPress powers 43% of the web. We built ContomatorAI from the ground up to integrate seamlessly with the world\'s most popular CMS.' },
  { icon: TrendingUp,  color: 'green',  title: 'SEO at the Core',
    desc: 'Every piece of content we generate is optimized for search engines — keyword density, structure, and readability are built into every output.' },
  { icon: Heart,       color: 'red',    title: 'User Obsessed',
    desc: 'We talk to our users constantly. Every feature on our roadmap comes directly from real feedback from real content creators.' },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600',
};

const team = [
  { name: 'The ContomatorAI Team', role: 'Lagos, Nigeria 🇳🇬', initials: 'CA' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav />

      {/* Hero */}
      <section className="pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 text-sm font-medium mb-6">
            <Users className="w-4 h-4 mr-2" /> About Us
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            We're building the future of{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              content creation
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            ContomatorAI was built by content creators who were tired of spending hours writing blog posts. We combined the power of the latest AI models with deep WordPress integration to create a platform that lets you scale content without scaling your team.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{value}</div>
                  <div className="text-blue-100 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              To democratize high-quality content creation for businesses of every size — giving solo bloggers the same content output as enterprise teams, and giving agencies the tools to serve 10x more clients without hiring 10x more writers.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">What we believe in</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-start space-x-5">
                <div className={`w-12 h-12 ${colorMap[color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join thousands of content creators</h2>
          <p className="text-xl text-blue-100 mb-8">Start your free trial today. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors">
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
