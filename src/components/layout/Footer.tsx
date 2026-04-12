import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/help" className="text-gray-400 hover:text-gray-500">
            Help Center
          </Link>
          <Link href="/privacy" className="text-gray-400 hover:text-gray-500">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-gray-400 hover:text-gray-500">
            Terms of Service
          </Link>
        </div>
        <div className="mt-2 md:mt-0 md:order-1">
          <p className="text-center text-sm text-gray-400">
            &copy; {currentYear} Content Automation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;