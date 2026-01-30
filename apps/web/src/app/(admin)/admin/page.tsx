'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MapPin,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Bell,
  User,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  pendingVerifications: number;
  activeTransactions: number;
  monthlyRevenue: number;
  revenueChange: number;
}

interface PendingItem {
  id: string;
  type: 'verification' | 'listing' | 'transaction';
  title: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalListings: 0,
    pendingVerifications: 0,
    activeTransactions: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
  });
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchAdminData(token);
  }, [router]);

  const fetchAdminData = async (token: string) => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/v1/admin/pending-items`, { headers }),
      ]);

      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (pendingData.success) {
        setPendingItems(pendingData.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
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
            <AdminNavItem href="/admin" icon={<LayoutDashboard />} label="Dashboard" active />
            <AdminNavItem href="/admin/users" icon={<Users />} label="Users" />
            <AdminNavItem href="/admin/listings" icon={<MapPin />} label="Listings" />
            <AdminNavItem href="/admin/transactions" icon={<CreditCard />} label="Transactions" />
            <AdminNavItem
              href="/admin/verifications"
              icon={<Shield />}
              label="Verifications"
              badge={stats.pendingVerifications}
            />
            <AdminNavItem href="/admin/settings" icon={<Settings />} label="Settings" />
          </nav>

          {/* User */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={handleLogout}
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
          <div>
            <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform overview and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <AdminStatCard
              icon={<Users className="h-5 w-5" />}
              label="Total Users"
              value={stats.totalUsers.toLocaleString()}
              trend={{ value: 8.2, isPositive: true }}
            />
            <AdminStatCard
              icon={<MapPin className="h-5 w-5" />}
              label="Total Listings"
              value={stats.totalListings.toLocaleString()}
              trend={{ value: 5.1, isPositive: true }}
            />
            <AdminStatCard
              icon={<Shield className="h-5 w-5" />}
              label="Pending Verifications"
              value={stats.pendingVerifications.toString()}
              variant="warning"
            />
            <AdminStatCard
              icon={<CreditCard className="h-5 w-5" />}
              label="Active Transactions"
              value={stats.activeTransactions.toString()}
            />
          </div>

          {/* Revenue Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-foreground">
                    GHS {stats.monthlyRevenue.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {stats.revenueChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={`text-sm ${
                        stats.revenueChange >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {stats.revenueChange}% from last month
                    </span>
                  </div>
                </div>
                <div className="h-16 w-32 bg-muted rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Items & Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Requires Attention</CardTitle>
                <Link href="/admin/verifications">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingItems.map((item) => (
                  <PendingItemCard key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AdminQuickAction
                  href="/admin/verifications"
                  icon={<Shield />}
                  label="Review Verifications"
                  description={`${stats.pendingVerifications} pending`}
                />
                <AdminQuickAction
                  href="/admin/listings?status=under_review"
                  icon={<MapPin />}
                  label="Moderate Listings"
                  description="Review submitted listings"
                />
                <AdminQuickAction
                  href="/admin/transactions?status=disputed"
                  icon={<AlertTriangle />}
                  label="Handle Disputes"
                  description="Resolve transaction issues"
                />
                <AdminQuickAction
                  href="/admin/users"
                  icon={<Users />}
                  label="Manage Users"
                  description="User accounts and roles"
                />
              </CardContent>
            </Card>
          </div>
        </div>
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
        <span className="h-5 w-5">{icon}</span>
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

function AdminStatCard({
  icon,
  label,
  value,
  trend,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning';
}) {
  return (
    <Card className={variant === 'warning' ? 'border-warning/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              variant === 'warning'
                ? 'bg-warning/10 text-warning'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span
              className={`text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}
            >
              {trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingItemCard({ item }: { item: PendingItem }) {
  const getIcon = () => {
    switch (item.type) {
      case 'verification':
        return <Shield className="h-4 w-4" />;
      case 'listing':
        return <MapPin className="h-4 w-4" />;
      case 'transaction':
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'pending':
        return <Badge variant="pending">Pending</Badge>;
      case 'under_review':
        return <Badge variant="warning">Under Review</Badge>;
      case 'disputed':
        return <Badge variant="rejected">Disputed</Badge>;
      default:
        return <Badge variant="neutral">{item.status}</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.createdAt}</p>
      </div>
      {getStatusBadge()}
    </div>
  );
}

function AdminQuickAction({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted transition-colors"
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <div className="p-6">
          <Skeleton className="h-8 w-32" />
        </div>
      </aside>
      <main className="lg:pl-64 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl mb-6" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
