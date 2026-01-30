'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { formatPrice, formatDate } from '@/lib/utils';
import { AdminLayout } from '../_components/admin-layout';
import { API_BASE_URL } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  category: string;
  region: string;
  district: string;
  priceGhs: string;
  sizeAcres: string;
  listingStatus: string;
  verificationStatus: string;
  seller: { fullName: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export default function AdminListingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [page, statusFilter]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      });

      const res = await fetch(`${API_BASE_URL}/api/v1/admin/listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setListings(data.data);
        setPagination(data.meta.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchListings();
  };

  const filteredListings = listings;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Listings</h1>
            <p className="text-muted-foreground">Manage and moderate land listings</p>
          </div>
          <Button variant="primary">
            <MapPin className="mr-2 h-4 w-4" />
            Export Listings
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-5">
          <StatCard label="Total" value={pagination.total} />
          <StatCard
            label="Published"
            value={listings.filter((l) => l.listingStatus === 'PUBLISHED').length}
          />
          <StatCard
            label="Under Review"
            value={listings.filter((l) => l.listingStatus === 'UNDER_REVIEW').length}
          />
          <StatCard
            label="Verified"
            value={listings.filter((l) => l.verificationStatus === 'VERIFIED').length}
          />
          <StatCard
            label="Drafts"
            value={listings.filter((l) => l.listingStatus === 'DRAFT').length}
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
                  placeholder="Search by title or location..."
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full sm:w-48 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Listing
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Location
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Verification
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Seller
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{listing.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="neutral" className="text-xs capitalize">
                              {listing.category.toLowerCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {listing.sizeAcres} acres
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground">{listing.district}</p>
                        <p className="text-xs text-muted-foreground">{listing.region}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">
                          {formatPrice(parseFloat(listing.priceGhs))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(parseFloat(listing.priceGhs) / parseFloat(listing.sizeAcres))}/acre
                        </p>
                      </td>
                      <td className="p-4">
                        <ListingStatusBadge status={listing.listingStatus} />
                      </td>
                      <td className="p-4">
                        <VerificationBadge status={listing.verificationStatus} />
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground">{listing.seller.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(listing.createdAt)}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/listings/${listing.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredListings.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={<MapPin className="h-6 w-6" />}
                  title="No listings found"
                  description="Try adjusting your search or filters"
                />
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {listings.length} of {pagination.total} listings
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={page >= Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ListingStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="verified">Published</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="pending">Under Review</Badge>;
    case 'DRAFT':
      return <Badge variant="neutral">Draft</Badge>;
    case 'SUSPENDED':
      return <Badge variant="rejected">Suspended</Badge>;
    case 'REJECTED':
      return <Badge variant="rejected">Rejected</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function VerificationBadge({ status }: { status: string }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge variant="verified">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="pending">
          <Clock className="h-3 w-3 mr-1" />
          Pending
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
      return <Badge variant="neutral">Unverified</Badge>;
  }
}
