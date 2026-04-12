import { Sparkles, Zap, FileText, Globe } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-center p-12">
            <div className="max-w-md text-center text-white">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">ContentAI Pro</h1>
                <p className="text-xl text-blue-100">
                  AI-Powered Content Generation & WordPress Management
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Sparkles className="h-8 w-8 text-yellow-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">AI Content Generation</h3>
                    <p className="text-sm text-blue-100">Generate SEO-optimized blog posts instantly</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Globe className="h-8 w-8 text-green-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">WordPress Integration</h3>
                    <p className="text-sm text-blue-100">Publish directly to multiple WordPress sites</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Zap className="h-8 w-8 text-orange-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Advanced Analytics</h3>
                    <p className="text-sm text-blue-100">Track performance and optimize content</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-purple-300" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Content Management</h3>
                    <p className="text-sm text-blue-100">Organize and manage your content library</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-sm italic">
                  "ContentAI Pro has transformed how we create content. We've increased our publishing rate by 300% while maintaining quality."
                </p>
                <p className="text-xs mt-2 text-blue-200">- Sarah Johnson, Content Manager</p>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl transform translate-x-1/2"></div>
        </div>
        
        {/* Right Side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ContentAI Pro
              </h1>
              <p className="text-gray-600">AI-Powered Content Generation</p>
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}