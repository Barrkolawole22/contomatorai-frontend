export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';
import { Shield } from 'lucide-react';

const sections = [
  { title: '1. Information We Collect',
    content: `We collect information you provide directly to us, including when you create an account (name, email address, password), connect a WordPress site (site URL, application credentials stored encrypted), generate content (keywords, preferences, generated output), or contact us for support.

We also automatically collect usage data such as pages visited, features used, content generation statistics, and error logs to improve the service.` },
  { title: '2. How We Use Your Information',
    content: `We use the information we collect to provide, maintain, and improve ContomatorAI; process transactions and send related information including purchase confirmations; send technical notices, security alerts, and support messages; respond to your comments and questions; monitor and analyse usage patterns to improve user experience; and detect, investigate, and prevent fraudulent transactions and other illegal activities.` },
  { title: '3. Information Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform (such as cloud hosting providers and payment processors), subject to confidentiality agreements. We may also disclose information if required by law or to protect our rights and the safety of our users.` },
  { title: '4. Data Security',
    content: `We implement industry-standard security measures including end-to-end encryption for sensitive data, encrypted storage for WordPress application passwords, JWT-based authentication with short-lived access tokens, rate limiting to prevent abuse, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.` },
  { title: '5. Data Retention',
    content: `We retain your account information for as long as your account is active. Generated content is retained in your account library until you delete it. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.` },
  { title: '6. Your Rights',
    content: `You have the right to access the personal data we hold about you, correct inaccurate data, request deletion of your data (subject to legal requirements), export your data in a portable format, and opt out of marketing communications at any time. To exercise these rights, contact us at privacy@contomatorai.com or use the Data & Privacy settings in your account.` },
  { title: '7. Cookies',
    content: `We use essential cookies for authentication and session management. With your consent, we also use analytics cookies to understand how you use the platform. You can control cookie preferences from your account Settings → Data & Privacy.` },
  { title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice in the application. Your continued use of ContomatorAI after changes become effective constitutes acceptance of the updated policy.` },
  { title: '9. Contact Us',
    content: `If you have questions about this Privacy Policy or our privacy practices, please contact us at privacy@contomatorai.com or visit our Contact page.` },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav />

      <section className="pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: January 2025</p>
          <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
            We take your privacy seriously. This policy explains how ContomatorAI collects, uses, and protects your information.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {sections.map(({ title, content }) => (
                <div key={title} className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">{content}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions about your privacy?</h3>
            <p className="text-gray-600 mb-4">We're happy to answer any questions about how we handle your data.</p>
            <Link href="/contact" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all inline-block">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
