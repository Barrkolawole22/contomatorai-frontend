// src/components/auth/AuthLayout.tsx
'use client';

import { Sparkles, Zap, Globe, FileText } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-12 text-white">
          <div className="flex flex-col justify-between w-full">
            {/* Logo & Brand */}
            <div>
              <Link href="/" className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">ContentAI Pro</h1>
                  <p className="text-blue-100 text-sm">AI-Powered Content Generation</p>
                </div>
              </Link>

              {/* Features List */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold leading-tight">
                  Create SEO-optimized content with the power of AI
                </h2>
                <p className="text-blue-100 text-lg">
                  Generate high-quality blog posts, manage multiple WordPress sites, 
                  and scale your content marketing effortlessly.
                </p>

                <div className="space-y-4 mt-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Content Generation</h3>
                      <p className="text-blue-100 text-sm">Create engaging blog posts in seconds</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">WordPress Integration</h3>
                      <p className="text-blue-100 text-sm">Publish directly to multiple sites</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">SEO Optimization</h3>
                      <p className="text-blue-100 text-sm">Built-in keyword research & optimization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <p className="text-blue-100 italic mb-3">
                "ContentAI Pro has revolutionized our content strategy. We're publishing 5x more 
                high-quality content with half the effort."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">JS</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">John Smith</p>
                  <p className="text-blue-200 text-xs">Digital Marketing Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">ContentAI Pro</span>
              </Link>
            </div>

            {/* Auth Form Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {children}
            </div>

            {/* Footer Links */}
            <div className="text-center mt-6 space-y-2">
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-gray-700 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-gray-700 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/support" className="hover:text-gray-700 transition-colors">
                  Support
                </Link>
              </div>
              <p className="text-xs text-gray-400">
                © 2025 ContentAI Pro. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}