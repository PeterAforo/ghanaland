'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CreditCard,
  Plus,
  Eye,
  TrendingUp,
  Clock,
  ChevronRight,
  Settings,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  pendingTransactions: number;
  recentActivity: RecentActivity[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    pendingTransactions: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        setIsLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard stats from dedicated endpoint
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/dashboard-stats`, { headers });
      const data = await res.json();

      if (data.success) {
        setStats({
          totalListings: data.data.totalListings,
          activeListings: data.data.activeListings,
          totalViews: data.data.totalViews,
          pendingTransactions: data.data.pendingTransactions,
          recentActivity: data.data.recentActivity || [],
        });
      } else {
        console.error('Dashboard stats API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Total Listings"
          value={stats.totalListings}
          trend="+2 this month"
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Total Views"
          value={stats.totalViews}
          trend="+12% from last week"
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Pending Transactions"
          value={stats.pendingTransactions}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Active Listings"
          value={stats.activeListings}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction
              href="/dashboard/listings/new"
              icon={<Plus />}
              label="Create New Listing"
              description="List your land for sale"
            />
            <QuickAction
              href="/listings"
              icon={<MapPin />}
              label="Browse Listings"
              description="Find land to purchase"
            />
            <QuickAction
              href="/dashboard/settings"
              icon={<Settings />}
              label="Account Settings"
              description="Update your profile"
            />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-5 w-5" />}
                title="No recent activity"
                description="Your recent actions will appear here"
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.entityType} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        {trend && (
          <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({
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

