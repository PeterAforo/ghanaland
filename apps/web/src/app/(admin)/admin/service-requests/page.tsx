'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  DollarSign,
  Eye,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ServiceRequest {
  id: string;
  description: string;
  status: string;
  agreedPriceGhs: number | null;
  paymentStatus: string;
  clientConfirmedWork: boolean;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    email: string;
  };
  professional: {
    id: string;
    type: string;
    user: {
      id: string;
      fullName: string;
    };
  };
  service: {
    id: string;
    name: string;
  } | null;
  documents: any[];
  confirmations: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
  ESCROW_FUNDED: { label: 'Escrow Funded', color: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Delivered', color: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  DISPUTED: { label: 'Disputed', color: 'bg-orange-100 text-orange-800' },
};

const PROFESSIONAL_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'SURVEYOR', label: 'Surveyor' },
  { value: 'LAWYER', label: 'Lawyer' },
  { value: 'ARCHITECT', label: 'Architect' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'VALUER', label: 'Valuer' },
  { value: 'PLANNER', label: 'Planner' },
  { value: 'AGENT', label: 'Agent' },
];

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pendingReview: 0,
    readyForRelease: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter, page]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('professionalType', typeFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await fetch(
        `${API_BASE_URL}/api/v1/professionals/admin/requests?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
        setTotalPages(data.meta.totalPages || 1);
        
        // Calculate stats
        const allRequests = data.data;
        setStats({
          total: data.meta.total || allRequests.length,
          pendingReview: allRequests.filter((r: ServiceRequest) => 
            r.status === 'DELIVERED' && r.clientConfirmedWork
          ).length,
          readyForRelease: allRequests.filter((r: ServiceRequest) => 
            r.clientConfirmedWork && r.status !== 'COMPLETED'
          ).length,
          completed: allRequests.filter((r: ServiceRequest) => 
            r.status === 'COMPLETED'
          ).length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const needsAdminAction = (request: ServiceRequest) => {
    return request.clientConfirmedWork && request.status !== 'COMPLETED';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Requests</h1>
          <p className="text-muted-foreground">Manage professional service requests and escrow releases</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.readyForRelease}</p>
                <p className="text-xs text-muted-foreground">Ready for Release</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                {PROFESSIONAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No service requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card 
              key={request.id}
              className={needsAdminAction(request) ? 'border-orange-300 bg-orange-50/50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">
                        {request.service?.name || 'Service Request'}
                      </h3>
                      {getStatusBadge(request.status)}
                      {needsAdminAction(request) && (
                        <Badge variant="warning" className="text-xs">
                          Needs Review
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{request.client.fullName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Professional</p>
                        <p className="font-medium">
                          {request.professional.user.fullName}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({request.professional.type})
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">
                          {request.agreedPriceGhs 
                            ? `GHS ${Number(request.agreedPriceGhs).toLocaleString()}`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Documents</p>
                        <p className="font-medium">
                          {request.documents.length} uploaded
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/admin/service-requests/${request.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
