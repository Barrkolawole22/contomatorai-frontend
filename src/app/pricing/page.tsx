export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ArrowRight, Check, Zap, Globe, TrendingUp, Crown, Users, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: 29,
      period: "month",
      description: "Perfect for individual bloggers and small content creators",
      credits: "10,000 AI Credits",
      features: [
        "10,000 AI-generated words/month",
        "2 WordPress sites",
        "Basic keyword research",
        "SEO optimization",
        "Content library",
        "Email support",
        "Basic analytics"
      ],
      popular: false,
      color: "blue"
    },
    {
      name: "Professional",
      price: 79,
      period: "month",
      description: "Ideal for growing businesses and content agencies",
      credits: "50,000 AI Credits",
      features: [
        "50,000 AI-generated words/month",
        "10 WordPress sites",
        "Advanced keyword research",
        "Priority content generation",
        "Content optimization suggestions",
        "Publishing scheduler",
        "Advanced analytics",
        "Priority support",
        "Custom content templates"
      ],
      popular: true,
      color: "purple"
    },
    {
      name: "Enterprise",
      price: 199,
      period: "month", 
      description: "For large teams and high-volume content production",
      credits: "Unlimited AI Credits",
      features: [
        "Unlimited AI-generated words",
        "Unlimited WordPress sites",
        "White-label solution",
        "Custom AI training",
        "API access",
        "Team collaboration tools",
        "Advanced reporting",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantee"
      ],
      popular: false,
      color: "gold"
    }
  ];

  const addOns = [
    {
      name: "Extra AI Credits",
      price: 10,
      unit: "per 10,000 words",
      description: "Additional AI content generation credits"
    },
    {
      name: "Premium Templates",
      price: 29,
      unit: "one-time",
      description: "Access to 100+ premium content templates"
    },
    {
      name: "Advanced Analytics",
      price: 19,
      unit: "per month",
      description: "Detailed performance metrics and insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ContentAI Pro
                </h1>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Features
                </Link>
                <Link href="/pricing" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium font-semibold">
                  Pricing
                </Link>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className="text-gray-600">Monthly</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" />
              <div className="w-12 h-6 bg-gray-300 rounded-full cursor-pointer"></div>
              <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
            </div>
            <span className="text-gray-600">
              Yearly 
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl shadow-xl ${plan.popular ? 'ring-2 ring-purple-600 scale-105' : ''} transition-all duration-300 hover:shadow-2xl`}>
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
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
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
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
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
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What are AI Credits?</h3>
              <p className="text-gray-600">AI Credits are used to generate content. Each word generated consumes 1 credit. For example, a 1,000-word blog post uses 1,000 credits.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the next billing cycle.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do unused credits roll over?</h3>
              <p className="text-gray-600">Credits reset each month, but you can purchase additional credits that never expire for overflow usage.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Yes! All new users get a 7-day free trial with 5,000 AI credits to test our platform before committing to a paid plan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ContentAI Pro</h3>
              <p className="text-gray-400">
                AI-powered content generation and WordPress management platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ContentAI Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
