'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Heart, User, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/listings', icon: Search, label: 'Search' },
  { href: '/listings/new', icon: Plus, label: 'Sell', highlight: true },
  { href: '/dashboard/favorites', icon: Heart, label: 'Saved' },
  { href: '/dashboard', icon: User, label: 'Account' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Don't show on auth pages or admin pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav sm:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          // Redirect to login for protected routes if not authenticated
          const href = !isAuthenticated && (item.href.startsWith('/dashboard') || item.href === '/listings/new')
            ? `/auth/login?redirect=${encodeURIComponent(item.href)}`
            : item.href;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 text-primary font-medium">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex flex-col items-center justify-center py-1 px-3 touch-target ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-[10px] mt-1 ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
