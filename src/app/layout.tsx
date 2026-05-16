// ========================================
// 1. app/layout.tsx (Root Layout - FIXED)
// ========================================
// @ts-ignore: CSS module declarations are handled by Next.js global styles
import './globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthProvider';

export const metadata = {
  title: 'ContentAI',
  description: 'AI-powered content generation platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}