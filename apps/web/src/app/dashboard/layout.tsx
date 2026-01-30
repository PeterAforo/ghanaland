'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  MapPin,
  CreditCard,
  Heart,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Bell,
  User,
  Menu,
  X,
  Briefcase,
  Route,
  Crown,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { useState } from 'react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="h-5 w-5">{icon}</span>
      {label}
    </Link>
  );
}

function DashboardLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <aside className="hidden lg:block w-64 border-r border-border bg-card">
          <div className="p-6">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="px-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </aside>
        <main className="flex-1">
          <header className="h-16 border-b border-border bg-card px-6">
            <Skeleton className="h-full w-full" />
          </header>
          <div className="p-6">
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { href: '/dashboard/professional', icon: <Briefcase className="h-5 w-5" />, label: 'Professional' },
    { href: '/dashboard/listings', icon: <MapPin className="h-5 w-5" />, label: 'My Listings' },
    { href: '/dashboard/transactions', icon: <CreditCard className="h-5 w-5" />, label: 'Transactions' },
    { href: '/dashboard/my-lands', icon: <Route className="h-5 w-5" />, label: 'My Lands' },
    { href: '/dashboard/service-requests', icon: <MessageSquare className="h-5 w-5" />, label: 'Service Requests' },
    { href: '/dashboard/inquiries', icon: <MessageSquare className="h-5 w-5" />, label: 'Inquiries' },
    { href: '/dashboard/favorites', icon: <Heart className="h-5 w-5" />, label: 'Favorites' },
    { href: '/dashboard/subscription', icon: <Crown className="h-5 w-5" />, label: 'Subscription' },
    { href: '/dashboard/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card transform transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Ghana Lands
            </Link>
            <button
              className="lg:hidden p-1 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}
          </nav>

          {/* User */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 justify-start text-muted-foreground"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-medium text-foreground">{user?.fullName?.split(' ')[0] || 'User'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Website
              </Button>
              <Button variant="outline" size="icon" className="sm:hidden" aria-label="View Website">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Link href="/dashboard/listings/new">
              <Button variant="primary" size="sm" className="hidden sm:flex">
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
              <Button variant="primary" size="icon" className="sm:hidden" aria-label="New Listing">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
