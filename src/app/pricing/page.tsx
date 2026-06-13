'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ADD_ONS } from '@/lib/plans';
import { ArrowRight, Check, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 23,
    description: 'Perfect for individual bloggers and small content creators',
    credits: '10,000 AI Credits / month',
    features: [
      '10,000 AI-generated words/month',
      '2 WordPress sites',
      'Basic keyword research',
      'SEO optimization',
      'Content library',
      'Email support',
      'Basic analytics',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    monthlyPrice: 79,
    yearlyPrice: 63,
    description: 'Ideal for growing businesses and content agencies',
    credits: '50,000 AI Credits / month',
    features: [
      '50,000 AI-generated words/month',
      '10 WordPress sites',
      'Advanced keyword research',
      'Priority content generation',
      'Content optimization suggestions',
      'Publishing scheduler',
      'Advanced analytics',
      'Priority support',
      'Custom content templates',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 159,
    description: 'For large teams and high-volume content production',
    credits: 'Unlimited AI Credits',
    features: [
      'Unlimited AI-generated words',
      'Unlimited WordPress sites',
      'White-label solution',
      'Custom AI training',
      'API access',
      'Team collaboration tools',
      'Advanced reporting',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    popular: false,
  },
];

const faqs = [
  {
    q: 'What are AI Credits?',
    a: 'AI Credits are used to generate content. Each word generated consumes 1 credit. For example, a 1,000-word blog post uses 1,000 credits.',
  },
  {
    q: 'Can I change plans anytime?',
    a: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the next billing cycle.',
  },
  {
    q: 'Do unused credits roll over?',
    a: 'Credits reset each month, but you can purchase additional credits that never expire for overflow usage.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! All new users get a free trial with 5,000 AI credits to test our platform before committing to a paid plan.',
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const addOns = ADD_ONS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav active="Pricing" />

      {/* Hero */}
      <section className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your content needs. Scale up or down anytime with no hidden fees.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!yearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setYearly(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                yearly ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle yearly billing"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  yearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                Save 20%
              </span>
            </span>
          </div>

          {yearly && (
            <p className="text-sm text-blue-600 font-medium">
              Billed annually — you save up to $480/year
            </p>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map(plan => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              const period = yearly ? 'mo, billed yearly' : 'month';

              return (
                <div
                  key={plan.name}
                  className={`relative bg-white rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl ${
                    plan.popular ? 'ring-2 ring-purple-600 scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                        <Crown className="w-4 h-4 mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      <div className="flex items-end justify-center mb-1">
                        <span className="text-4xl font-bold text-gray-900">${price}</span>
                        <span className="text-gray-500 ml-2 mb-1 text-sm">/{period}</span>
                      </div>
                      {yearly && (
                        <p className="text-xs text-gray-400 mb-3 line-through">${plan.monthlyPrice}/month</p>
                      )}
                      <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm font-medium text-gray-700">{plan.credits}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/register"
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors block ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Add-ons & Extras</h2>
            <p className="text-xl text-gray-600">Enhance your plan with additional features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{addon.name}</h3>
                <p className="text-gray-600 mb-4">{addon.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${addon.price}</span>
                    <span className="text-gray-600 ml-1">/{addon.unit}</span>
                  </div>
                  <Link
                    href="/dashboard/billing?tab=topups"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Add
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <button
                  onClick={() => setOpenFaq(prev => (prev === i ? null : i))}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-gray-50">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start creating amazing content?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of content creators scaling their output with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
