'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';

export function HomeButton() {
  const pathname = usePathname();
  
  // Don't show home button on the home page
  if (pathname === '/') return null;

  return (
    <Link
      href="/"
      className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-2 border-white dark:border-gray-800"
      title="Go to Home"
    >
      <Home size={20} className="text-white" />
    </Link>
  );
}
