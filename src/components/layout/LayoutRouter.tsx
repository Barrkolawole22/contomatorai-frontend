'use client';

import { usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import AdminLayout from './AdminLayout'; // Your admin layout component

interface LayoutRouterProps {
  children: React.ReactNode;
}

const LayoutRouter: React.FC<LayoutRouterProps> = ({ children }) => {
  const pathname = usePathname();

  // Admin routes
  if (pathname?.startsWith('/admin')) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Auth routes (login, register, etc.) - no layout
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
    return <>{children}</>;
  }

  // Default to dashboard layout for all other routes
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default LayoutRouter;