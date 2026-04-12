import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, FileText, Search, Upload, Settings, ChevronDown } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  subItems?: Array<{ href: string; title: string }>;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, title, active, subItems }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasSubItems = subItems && subItems.length > 0;

  return (
    <div>
      {hasSubItems ? (
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center w-full py-2 px-4 rounded-lg text-left ${
              active ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600'
            }`}
          >
            <span className="mr-3">{icon}</span>
            <span className="flex-1">{title}</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            />
          </button>
          {isOpen && (
            <div className="pl-10 mt-1 space-y-1">
              {subItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block py-2 px-4 rounded-lg text-sm text-gray-300 hover:bg-indigo-600"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link
          href={href}
          className={`flex items-center py-2 px-4 rounded-lg ${
            active ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600'
          }`}
        >
          <span className="mr-3">{icon}</span>
          <span>{title}</span>
        </Link>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-indigo-800 min-h-screen">
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-white">Content Automation</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard className="w-5 h-5" />}
          title="Dashboard"
          active={isActive('/dashboard')}
        />
        <NavItem
          href="/content"
          icon={<FileText className="w-5 h-5" />}
          title="Content"
          active={isActive('/content')}
          subItems={[
            { href: '/content/create', title: 'Create Content' },
            { href: '/content/history', title: 'Content History' },
            { href: '/content/templates', title: 'Templates' },
          ]}
        />
        <NavItem
          href="/keywords"
          icon={<Search className="w-5 h-5" />}
          title="Keyword Research"
          active={isActive('/keywords')}
          subItems={[
            { href: '/keywords/search', title: 'Search Keywords' },
            { href: '/keywords/history', title: 'Keyword History' },
          ]}
        />
        <NavItem
          href="/wordpress"
          icon={<Upload className="w-5 h-5" />}
          title="WordPress"
          active={isActive('/wordpress')}
          subItems={[
            { href: '/wordpress/sites', title: 'Manage Sites' },
            { href: '/wordpress/publish', title: 'Publish Content' },
          ]}
        />
        <NavItem
          href="/settings"
          icon={<Settings className="w-5 h-5" />}
          title="Settings"
          active={isActive('/settings')}
        />
      </nav>
      <div className="px-4 py-4">
        <div className="flex items-center px-2 py-3 rounded-lg bg-indigo-900">
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Account Status</p>
            <p className="text-xs text-indigo-200">Premium Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;