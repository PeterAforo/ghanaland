'use client';

import { useState } from 'react';
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

interface Listing {
  id: string;
  title: string;
  category: string;
  region: string;
  district: string;
  priceGhs: number;
  sizeAcres: number;
  listingStatus: string;
  verificationStatus: string;
  seller: { fullName: string };
  createdAt: string;
}

export default function AdminListingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Mock data
  const listings: Listing[] = [
    {
      id: '1',
      title: '5 Acres Prime Land in East Legon',
      category: 'RESIDENTIAL',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      priceGhs: 2500000,
      sizeAcres: 5,
      listingStatus: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
      seller: { fullName: 'John Doe' },
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Commercial Plot in Tema Industrial Area',
      category: 'COMMERCIAL',
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      priceGhs: 5000000,
      sizeAcres: 10,
      listingStatus: 'UNDER_REVIEW',
      verificationStatus: 'PENDING',
      seller: { fullName: 'Jane Smith' },
      createdAt: '2024-01-18T14:30:00Z',
    },
    {
      id: '3',
      title: 'Agricultural Land in Ashanti Region',
      category: 'AGRICULTURAL',
      region: 'Ashanti',
      district: 'Kumasi Metropolitan',
      priceGhs: 800000,
      sizeAcres: 20,
      listingStatus: 'DRAFT',
      verificationStatus: 'UNVERIFIED',
      seller: { fullName: 'Kwame Asante' },
      createdAt: '2024-01-20T09:15:00Z',
    },
  ];

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !search ||
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.region.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || listing.listingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <StatCard label="Total" value={listings.length} />
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
                          {formatPrice(listing.priceGhs)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(listing.priceGhs / listing.sizeAcres)}/acre
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
                Showing {filteredListings.length} of {listings.length} listings
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
