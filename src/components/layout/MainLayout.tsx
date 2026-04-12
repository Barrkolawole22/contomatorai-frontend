import React, { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '@/context/AuthProvider'
import { useRouter } from 'next/router';

interface MainLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideSidebar?: boolean;
  hideFooter?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  hideHeader = false,
  hideSidebar = false,
  hideFooter = false,
}) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated && router.pathname !== '/auth/login' && router.pathname !== '/auth/signup') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!hideHeader && <Header />}
      <div className="flex flex-col md:flex-row">
        {!hideSidebar && <Sidebar />}
        <main className="flex-grow p-4 md:p-6">
          {children}
        </main>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;