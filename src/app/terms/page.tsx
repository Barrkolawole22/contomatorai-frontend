export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';
import { FileText } from 'lucide-react';

const sections = [
  { title: '1. Acceptance of Terms',
    content: 'By accessing or using ContomatorAI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to update these terms at any time with notice.' },
  { title: '2. Use of the Service',
    content: `You may use ContomatorAI only for lawful purposes and in accordance with these Terms. You agree not to use the Service to generate content that is illegal, defamatory, or infringes on third-party rights; attempt to gain unauthorized access to any part of the Service; reverse-engineer, decompile, or disassemble any part of the Service; or use automated tools to scrape or extract data from the Service beyond what is permitted by the API.` },
  { title: '3. Accounts',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these Terms.' },
  { title: '4. Content & Intellectual Property',
    content: `Content you generate using ContomatorAI is yours. You retain full ownership of the output. However, by using the Service you grant ContomatorAI a limited licence to process your inputs to deliver the Service.

ContomatorAI and its logo, branding, and underlying technology are owned by ContomatorAI and protected by intellectual property laws. You may not use our branding without written permission.` },
  { title: '5. Credits & Billing',
    content: `Word credits are consumed when content is generated. Credits are non-refundable once consumed. Subscription credits reset monthly; unused credits do not roll over. Top-up credits do not expire. Refunds for unused subscription time may be issued at our discretion within 7 days of purchase. Billing disputes must be raised within 30 days of the charge.` },
  { title: '6. Service Availability',
    content: 'We aim for 99.9% uptime but do not guarantee uninterrupted access. We may perform maintenance that temporarily affects availability. We are not liable for downtime caused by third-party services, including AI model providers or WordPress hosting.' },
  { title: '7. Limitation of Liability',
    content: 'To the maximum extent permitted by law, ContomatorAI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including loss of revenue, data, or business opportunity. Our total liability to you for any claim shall not exceed the amount you paid to us in the 3 months preceding the claim.' },
  { title: '8. Termination',
    content: 'You may cancel your account at any time from the Billing page. We may suspend or terminate your account for violation of these Terms. Upon termination, your right to use the Service ceases and your data will be deleted within 30 days.' },
  { title: '9. Governing Law',
    content: 'These Terms shall be governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through binding arbitration in Lagos, Nigeria, except where prohibited by law.' },
  { title: '10. Contact',
    content: 'For questions about these Terms, please contact us at legal@contomatorai.com or through our Contact page.' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <PublicNav />

      <section className="pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-blue-700 text-sm font-medium mb-6">
            <FileText className="w-4 h-4 mr-2" /> Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: January 2025</p>
          <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
            Please read these terms carefully before using ContomatorAI.
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
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions about these terms?</h3>
            <p className="text-gray-600 mb-4">Contact our team and we'll be happy to clarify anything.</p>
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
