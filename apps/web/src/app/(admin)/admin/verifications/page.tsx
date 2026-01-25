'use client';

import { useState } from 'react';
import {
  Shield,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '../_components/admin-layout';

interface VerificationRequest {
  id: string;
  listing: {
    id: string;
    title: string;
    region: string;
    district: string;
  };
  requester: { fullName: string; email: string };
  status: string;
  notes?: string;
  documents: Array<{ id: string; name: string; documentType: string }>;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // Mock data
  const verificationRequests: VerificationRequest[] = [
    {
      id: '1',
      listing: {
        id: 'l1',
        title: '5 Acres Prime Land in East Legon',
        region: 'Greater Accra',
        district: 'Accra Metropolitan',
      },
      requester: { fullName: 'John Doe', email: 'john@example.com' },
      status: 'PENDING',
      notes: 'Please verify the title deed and site plan',
      documents: [
        { id: 'd1', name: 'title_deed.pdf', documentType: 'TITLE_DEED' },
        { id: 'd2', name: 'site_plan.pdf', documentType: 'SITE_PLAN' },
      ],
      createdAt: '2024-01-20T10:00:00Z',
    },
    {
      id: '2',
      listing: {
        id: 'l2',
        title: 'Commercial Plot in Tema Industrial Area',
        region: 'Greater Accra',
        district: 'Tema Metropolitan',
      },
      requester: { fullName: 'Jane Smith', email: 'jane@example.com' },
      status: 'IN_REVIEW',
      documents: [
        { id: 'd3', name: 'indenture.pdf', documentType: 'INDENTURE' },
        { id: 'd4', name: 'survey_report.pdf', documentType: 'SURVEY_REPORT' },
      ],
      createdAt: '2024-01-18T14:30:00Z',
    },
    {
      id: '3',
      listing: {
        id: 'l3',
        title: 'Agricultural Land in Volta Region',
        region: 'Volta',
        district: 'Ho Municipal',
      },
      requester: { fullName: 'Kwame Asante', email: 'kwame@example.com' },
      status: 'APPROVED',
      documents: [
        { id: 'd5', name: 'title_deed.pdf', documentType: 'TITLE_DEED' },
      ],
      createdAt: '2024-01-15T09:15:00Z',
    },
  ];

  const filteredRequests = verificationRequests.filter((req) => {
    const matchesSearch =
      !search ||
      req.listing.title.toLowerCase().includes(search.toLowerCase()) ||
      req.requester.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    console.log('Approve:', id);
    // API call would go here
  };

  const handleReject = (id: string) => {
    console.log('Reject:', id);
    // API call would go here
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verifications</h1>
            <p className="text-muted-foreground">Review and approve land verification requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            label="Pending"
            value={verificationRequests.filter((r) => r.status === 'PENDING').length}
            variant="warning"
          />
          <StatCard
            label="In Review"
            value={verificationRequests.filter((r) => r.status === 'IN_REVIEW').length}
          />
          <StatCard
            label="Approved"
            value={verificationRequests.filter((r) => r.status === 'APPROVED').length}
            variant="success"
          />
          <StatCard
            label="Rejected"
            value={verificationRequests.filter((r) => r.status === 'REJECTED').length}
            variant="danger"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by listing or requester..."
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full sm:w-48 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Verification Requests */}
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Listing Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{request.listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {request.listing.district}, {request.listing.region}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested by {request.requester.fullName} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{request.documents.length} documents</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <VerificationStatusBadge status={request.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    {request.status === 'PENDING' || request.status === 'IN_REVIEW' ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Notes */}
                {request.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes:</span> {request.notes}
                    </p>
                  </div>
                )}

                {/* Documents List */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Submitted Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {request.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
                      >
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{doc.name}</span>
                        <Badge variant="neutral" className="text-xs">
                          {doc.documentType.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <EmptyState
                icon={<Shield className="h-6 w-6" />}
                title="No verification requests found"
                description="Try adjusting your search or filters"
              />
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRequests.length} of {verificationRequests.length} requests
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-warning/30';
      case 'success':
        return 'border-success/30';
      case 'danger':
        return 'border-destructive/30';
      default:
        return '';
    }
  };

  const getValueStyles = () => {
    switch (variant) {
      case 'warning':
        return 'text-warning';
      case 'success':
        return 'text-success';
      case 'danger':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className={getVariantStyles()}>
      <CardContent className="p-4">
        <p className={`text-2xl font-bold ${getValueStyles()}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function VerificationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="pending">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'IN_REVIEW':
      return (
        <Badge variant="warning">
          <Eye className="h-3 w-3 mr-1" />
          In Review
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="verified">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="rejected">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
