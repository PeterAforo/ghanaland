'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  FileWarning
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
  listing: { id: string; title: string } | null;
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
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: FileWarning },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export default function PermitsPage() {
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/permits/my-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setIsLoading(false);
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

  const stats = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'DRAFT').length,
    pending: applications.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status)).length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permit Applications</h1>
          <p className="text-muted-foreground">Apply for and track your permit applications</p>
        </div>
        <Link href="/dashboard/permits/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No permit applications"
              description="Start a new permit application for your property or construction project."
            />
            <div className="mt-4 flex justify-center">
              <Link href="/dashboard/permits/new">
                <Button variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Application
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Link key={application.id} href={`/dashboard/permits/${application.id}`}>
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Created {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                        {application.submittedAt && (
                          <> • Submitted {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {application.applicationFee && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Fee: </span>
                          <span className="font-medium">GHS {Number(application.applicationFee).toLocaleString()}</span>
                        </p>
                      )}
                      {application.feePaid ? (
                        <span className="text-xs text-green-600">Paid</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unpaid</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
