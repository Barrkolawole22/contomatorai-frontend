import Link from 'next/link';
import { Zap } from 'lucide-react';

export const Logo = () => (
  <Link href="/" className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
      <Zap className="w-5 h-5 text-white fill-white" />
    </div>
    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      ContomatorAI
    </span>
  </Link>
);

export const PublicNav = ({ active }: { active?: string }) => (
  <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Logo />
        <div className="hidden md:flex items-center space-x-1">
          {[
            { href: '/features', label: 'Features' },
            { href: '/pricing',  label: 'Pricing'  },
            { href: '/api-docs', label: 'API'      },
            { href: '/docs',     label: 'Docs'     },
            { href: '/help',     label: 'Help'     },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active === label ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
            Login
          </Link>
          <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

export const PublicFooter = () => (
  <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold">ContomatorAI</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            AI-powered content generation and WordPress management platform.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="/pricing"  className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/api-docs" className="hover:text-white transition-colors">API</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><Link href="/docs"    className="hover:text-white transition-colors">Documentation</Link></li>
            <li><Link href="/help"    className="hover:text-white transition-colors">Help Center</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><Link href="/about"   className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            <li><Link href="/terms"   className="hover:text-white transition-colors">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} ContomatorAI. All rights reserved.</p>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  </footer>
);
