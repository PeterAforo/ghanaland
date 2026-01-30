'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  MapPin,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  Bell,
  FileText,
  Briefcase,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <AdminLayoutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Ghana Lands
            </Link>
            <Badge variant="warning" className="ml-2">
              Admin
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <AdminNavItem
              href="/admin"
              icon={<LayoutDashboard className="h-5 w-5" />}
              label="Dashboard"
              active={pathname === '/admin'}
            />
            <AdminNavItem
              href="/admin/users"
              icon={<Users className="h-5 w-5" />}
              label="Users"
              active={pathname === '/admin/users'}
            />
            <AdminNavItem
              href="/admin/listings"
              icon={<MapPin className="h-5 w-5" />}
              label="Listings"
              active={pathname === '/admin/listings'}
            />
            <AdminNavItem
              href="/admin/transactions"
              icon={<CreditCard className="h-5 w-5" />}
              label="Transactions"
              active={pathname === '/admin/transactions'}
            />
            <AdminNavItem
              href="/admin/verifications"
              icon={<Shield className="h-5 w-5" />}
              label="Verifications"
              active={pathname === '/admin/verifications'}
            />
            <AdminNavItem
              href="/admin/permits"
              icon={<FileText className="h-5 w-5" />}
              label="Permits"
              active={pathname.startsWith('/admin/permits')}
            />
            <AdminNavItem
              href="/admin/service-requests"
              icon={<Briefcase className="h-5 w-5" />}
              label="Service Requests"
              active={pathname.startsWith('/admin/service-requests')}
            />
            <AdminNavItem
              href="/admin/audit-logs"
              icon={<Activity className="h-5 w-5" />}
              label="Audit Logs"
              active={pathname.startsWith('/admin/audit-logs')}
            />
            <AdminNavItem
              href="/admin/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              active={pathname === '/admin/settings'}
            />
          </nav>

          {/* User */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.fullName || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="lg:hidden">
            <Link href="/" className="text-xl font-bold text-primary">
              Ghana Lands
            </Link>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function AdminNavItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge variant={active ? 'neutral' : 'warning'} className="text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <div className="p-6">
          <Skeleton className="h-8 w-32" />
        </div>
      </aside>
      <main className="lg:pl-64 p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </main>
    </div>
  );
}
