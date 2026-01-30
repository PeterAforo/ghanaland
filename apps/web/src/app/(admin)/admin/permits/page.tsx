'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { API_BASE_URL } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface PermitApplication {
  id: string;
  type: string;
  status: string;
  referenceNumber: string | null;
  propertyAddress: string;
  propertyRegion: string;
  applicationFee: number | null;
  feePaid: boolean;
  submittedAt: string | null;
  createdAt: string;
  applicant: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

const PERMIT_TYPE_LABELS: Record<string, string> = {
  BUILDING_PERMIT: 'Building Permit',
  LAND_USE_PERMIT: 'Land Use Permit',
  DEVELOPMENT_PERMIT: 'Development Permit',
  SUBDIVISION_PERMIT: 'Subdivision Permit',
  OCCUPANCY_PERMIT: 'Occupancy Permit',
  DEMOLITION_PERMIT: 'Demolition Permit',
  RENOVATION_PERMIT: 'Renovation Permit',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  ADDITIONAL_INFO_REQUIRED: { label: 'Info Required', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export default function AdminPermitsPage() {
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [statusFilter, typeFilter, page]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await fetch(`${API_BASE_URL}/api/v1/permits/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
        setTotal(data.meta.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/permits/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Permit Applications</h1>
        <p className="text-muted-foreground">Review and manage permit applications</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('SUBMITTED')}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{stats.byStatus.SUBMITTED || 0}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('UNDER_REVIEW')}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Under Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.UNDER_REVIEW || 0}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('APPROVED')}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.byStatus.APPROVED || 0}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('REJECTED')}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.byStatus.REJECTED || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          {Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {(statusFilter || typeFilter) && (
          <Button variant="secondary" size="sm" onClick={() => { setStatusFilter(''); setTypeFilter(''); }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No applications found"
              description="No permit applications match your filters."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Link key={application.id} href={`/admin/permits/${application.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(application.status)}
                        {application.referenceNumber && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {application.referenceNumber}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {PERMIT_TYPE_LABELS[application.type] || application.type}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.propertyAddress}, {application.propertyRegion}
                      </p>
                      <p className="text-sm text-primary mt-1">
                        Applicant: {application.applicant.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {application.submittedAt 
                          ? `Submitted ${formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}`
                          : `Created ${formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}`
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      {application.applicationFee && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Fee: </span>
                          <span className="font-medium">GHS {Number(application.applicationFee).toLocaleString()}</span>
                        </p>
                      )}
                      <Button variant="secondary" size="sm" className="mt-2">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
