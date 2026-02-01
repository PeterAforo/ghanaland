'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { API_BASE_URL } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ProfessionalProfile {
  id: string;
  type: string;
  title: string;
  bio: string | null;
  yearsExperience: number | null;
  licenseNumber: string | null;
  licenseVerified: boolean;
  regions: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  hourlyRateGhs: number | null;
  fixedRateGhs: number | null;
  isAvailable: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    priceGhs: number;
    priceType: string;
  }>;
}

interface ServiceRequest {
  id: string;
  description: string;
  status: string;
  agreedPriceGhs: number | null;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    email: string;
  };
  service: {
    name: string;
  } | null;
}

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalEarnings: number;
  averageRating: number;
  reviewCount: number;
}

const PROFESSIONAL_CONFIG: Record<string, {
  title: string;
  icon: string;
  color: string;
  features: string[];
  quickActions: Array<{ label: string; href: string; icon: any }>;
}> = {
  SURVEYOR: {
    title: 'Surveyor Dashboard',
    icon: '📐',
    color: 'bg-blue-500',
    features: ['Site Surveys', 'Boundary Demarcation', 'Topographic Mapping', 'GPS Coordinates'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'View Active Jobs', href: '/dashboard/service-requests', icon: Briefcase },
      { label: 'Upload Survey Plan', href: '#', icon: FileText },
    ],
  },
  LAWYER: {
    title: 'Legal Practice Dashboard',
    icon: '⚖️',
    color: 'bg-purple-500',
    features: ['Land Title Search', 'Indenture Preparation', 'Contract Review', 'Legal Opinion'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'View Active Cases', href: '/dashboard/service-requests', icon: Briefcase },
      { label: 'Document Review Queue', href: '#', icon: FileText },
    ],
  },
  ARCHITECT: {
    title: 'Architecture Studio',
    icon: '🏗️',
    color: 'bg-orange-500',
    features: ['Building Design', 'Floor Plans', '3D Visualization', 'Permit Drawings'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'View Projects', href: '/dashboard/service-requests', icon: Briefcase },
      { label: 'Upload Drawings', href: '#', icon: FileText },
    ],
  },
  ENGINEER: {
    title: 'Engineering Dashboard',
    icon: '🔧',
    color: 'bg-green-500',
    features: ['Structural Analysis', 'Load Calculations', 'Material Specs', 'Site Inspection'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'View Projects', href: '/dashboard/service-requests', icon: Briefcase },
      { label: 'Site Inspection', href: '#', icon: MapPin },
    ],
  },
  VALUER: {
    title: 'Valuation Office',
    icon: '💰',
    color: 'bg-yellow-500',
    features: ['Property Valuation', 'Market Analysis', 'Comparable Sales', 'Valuation Reports'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'View Assignments', href: '/dashboard/service-requests', icon: Briefcase },
      { label: 'Market Research', href: '#', icon: TrendingUp },
    ],
  },
  PLANNER: {
    title: 'Planning Consultancy',
    icon: '📋',
    color: 'bg-teal-500',
    features: ['Development Permits', 'Zoning Analysis', 'Land Use Planning', 'Permit Applications'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'View Projects', href: '/dashboard/service-requests', icon: Briefcase },
      { label: 'Zoning Check', href: '#', icon: MapPin },
    ],
  },
  AGENT: {
    title: 'Real Estate Dashboard',
    icon: '🏠',
    color: 'bg-red-500',
    features: ['Property Listings', 'Client Matching', 'Site Visits', 'Negotiations'],
    quickActions: [
      { label: 'Manage Services', href: '/dashboard/professional/services', icon: Settings },
      { label: 'New Listing', href: '/dashboard/listings/new', icon: MapPin },
      { label: 'View Clients', href: '/dashboard/service-requests', icon: Users },
    ],
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
  ESCROW_FUNDED: { label: 'Funded', color: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

export default function ProfessionalDashboardPage() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      // Silent fail - user may not be a professional
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests/professional`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      // Silent fail - user may not be a professional
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reqs: ServiceRequest[]) => {
    const completed = reqs.filter(r => r.status === 'COMPLETED');
    const totalEarnings = completed.reduce((sum, r) => sum + (Number(r.agreedPriceGhs) || 0) * 0.9, 0);
    
    setStats({
      totalRequests: reqs.length,
      pendingRequests: reqs.filter(r => r.status === 'PENDING').length,
      activeRequests: reqs.filter(r => ['ACCEPTED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'DELIVERED'].includes(r.status)).length,
      completedRequests: completed.length,
      totalEarnings,
      averageRating: profile?.rating || 0,
      reviewCount: profile?.reviewCount || 0,
    });
  };

  useEffect(() => {
    if (profile && requests.length > 0) {
      calculateStats(requests);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="No Professional Profile"
              description="Create a professional profile to start receiving service requests."
            />
            <div className="mt-4 flex justify-center">
              <Link href="/dashboard/professional/setup">
                <Button variant="primary">Create Professional Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = PROFESSIONAL_CONFIG[profile.type] || PROFESSIONAL_CONFIG.AGENT;
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const activeRequests = requests.filter(r => ['ACCEPTED', 'ESCROW_FUNDED', 'IN_PROGRESS', 'DELIVERED'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${config.color} rounded-2xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{config.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{config.title}</h1>
              <p className="text-white/80">{profile.title}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-bold">{Number(profile.rating || 0).toFixed(1)}</span>
            </div>
            <p className="text-sm text-white/80">{profile.reviewCount} reviews</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-white/80">Pending</p>
            <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-white/80">Active</p>
            <p className="text-2xl font-bold">{stats?.activeRequests || 0}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-white/80">Completed</p>
            <p className="text-2xl font-bold">{stats?.completedRequests || 0}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-white/80">Earnings</p>
            <p className="text-2xl font-bold">GHS {(stats?.totalEarnings || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {config.quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}/10`}>
                    <Icon className={`h-5 w-5 text-${config.color.replace('bg-', '')}`} />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Pending Requests
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {pendingRequests.length} waiting
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((req) => (
                  <Link key={req.id} href={`/dashboard/service-requests/${req.id}`}>
                    <div className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{req.client.fullName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{req.description}</p>
                      {req.service && (
                        <span className="text-xs text-primary">{req.service.name}</span>
                      )}
                    </div>
                  </Link>
                ))}
                {pendingRequests.length > 5 && (
                  <Link href="/dashboard/service-requests">
                    <Button variant="ghost" className="w-full">
                      View all {pendingRequests.length} pending requests
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Active Jobs
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {activeRequests.length} in progress
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active jobs</p>
            ) : (
              <div className="space-y-3">
                {activeRequests.slice(0, 5).map((req) => (
                  <Link key={req.id} href={`/dashboard/service-requests/${req.id}`}>
                    <div className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{req.client.fullName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[req.status]?.color || ''}`}>
                          {STATUS_CONFIG[req.status]?.label || req.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{req.description}</p>
                      {req.agreedPriceGhs && (
                        <span className="text-xs text-green-600">
                          GHS {(Number(req.agreedPriceGhs) * 0.9).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {activeRequests.length > 5 && (
                  <Link href="/dashboard/service-requests">
                    <Button variant="ghost" className="w-full">
                      View all {activeRequests.length} active jobs
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services & Specializations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Services</span>
            <Link href="/dashboard/professional/services">
              <Button variant="outline" size="sm">Manage Services</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {profile.services.map((service) => (
              <div key={service.id} className="p-3 rounded-lg border border-border">
                <p className="font-medium text-sm">{service.name}</p>
                <p className="text-sm text-primary">
                  GHS {Number(service.priceGhs).toLocaleString()}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({service.priceType.toLowerCase()})
                  </span>
                </p>
              </div>
            ))}
            {profile.services.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                No services added yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional-Specific Features */}
      <Card>
        <CardHeader>
          <CardTitle>Your Specializations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {config.features.map((feature, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-full text-sm ${config.color} text-white`}
              >
                {feature}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              {profile.licenseVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-sm">License Verification</p>
                <p className="text-xs text-muted-foreground">
                  {profile.licenseVerified ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {profile.isAvailable ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium text-sm">Availability</p>
                <p className="text-xs text-muted-foreground">
                  {profile.isAvailable ? 'Available for work' : 'Not available'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Service Areas</p>
                <p className="text-xs text-muted-foreground">
                  {profile.regions.length} region(s)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
