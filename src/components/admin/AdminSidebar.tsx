// src/components/admin/AdminSidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  BellIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const AdminSidebar = () => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
    },
    {
      name: 'Users',
      icon: UsersIcon,
      submenu: [
        { name: 'All Users', href: '/admin/users' },
        { name: 'Add User', href: '/admin/users/add' },
        { name: 'User Roles', href: '/admin/users/roles' },
      ]
    },
    {
      name: 'Content',
      icon: DocumentTextIcon,
      submenu: [
        { name: 'Posts', href: '/admin/content/posts' },
        { name: 'Pages', href: '/admin/content/pages' },
        { name: 'Media', href: '/admin/content/media' },
      ]
    },
    {
      name: 'E-commerce',
      icon: ShoppingBagIcon,
      submenu: [
        { name: 'Products', href: '/admin/ecommerce/products' },
        { name: 'Orders', href: '/admin/ecommerce/orders' },
        { name: 'Categories', href: '/admin/ecommerce/categories' },
      ]
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
    },
    {
      name: 'Files',
      href: '/admin/files',
      icon: FolderIcon,
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: BellIcon,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: CogIcon,
    },
  ];

  const isActiveLink = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isActiveSubmenu = (submenu: Array<{ href: string }>) => {
    return submenu.some(item => isActiveLink(item.href));
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
              Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.submenu) {
              const isExpanded = expandedMenus[item.name];
              const hasActiveSubmenu = isActiveSubmenu(item.submenu);

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      hasActiveSubmenu
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                            isActiveLink(subItem.href)
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                  isActiveLink(item.href!)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">AD</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;