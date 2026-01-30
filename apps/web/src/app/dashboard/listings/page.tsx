'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  MapPin,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  Globe,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';

interface ListingMedia {
  id: string;
  url: string;
  type: string;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  region: string;
  district: string;
  priceGhs: string;
  sizeAcres: string;
  pricePerPlot?: string;
  totalPlots?: number;
  listingStatus: string;
  verificationStatus: string;
  viewCount: number;
  createdAt: string;
  media?: ListingMedia[];
}

export default function UserListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createdId = searchParams.get('created');

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/v1/listings/my?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch listings');
      }

      const result = await res.json();
      if (result.success) {
        setListings(result.data);
        setTotal(result.meta?.pagination?.total || result.data.length);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (isAuthenticated) {
      fetchListings();
    }
  }, [authLoading, isAuthenticated, router, fetchListings]);

  useEffect(() => {
    if (createdId) {
      setSuccessMessage('Listing created successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [createdId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    setDeleteId(id);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete listing');
      }

      setListings(listings.filter(l => l.id !== id));
      setSuccessMessage('Listing deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing. Please try again.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      PUBLISHED: 'publish',
      SUBMITTED: 'submit for review',
      DRAFT: 'unpublish',
      ARCHIVED: 'archive',
    };
    
    if (!confirm(`Are you sure you want to ${statusLabels[newStatus] || newStatus.toLowerCase()} this listing?`)) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/listings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update listing status');
      }

      const result = await res.json();
      if (result.success) {
        setListings(listings.map(l => l.id === id ? { ...l, listingStatus: newStatus } : l));
        setSuccessMessage(`Listing ${statusLabels[newStatus] || 'updated'} successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating listing status:', err);
      setError('Failed to update listing status. Please try again.');
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !search || listing.title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  if (isLoading && listings.length === 0) {
    return <ListingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Listings" value={total} />
        <StatCard
          label="Published"
          value={listings.filter((l) => l.listingStatus === 'PUBLISHED').length}
        />
        <StatCard
          label="Drafts"
          value={listings.filter((l) => l.listingStatus === 'DRAFT').length}
        />
        <StatCard
          label="Total Views"
          value={listings.reduce((sum, l) => sum + l.viewCount, 0)}
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
                placeholder="Search your listings..."
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
              <option value="PUBLISHED">Published</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No listings yet"
              description="Create your first listing to start selling land"
              action={
                <Link href="/dashboard/listings/new">
                  <Button variant="primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Listing
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Image */}
                  <div className="w-full lg:w-32 h-24 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {listing.media && listing.media.length > 0 ? (
                      <img
                        src={listing.media[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.district}, {listing.region}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ListingStatusBadge status={listing.listingStatus} />
                        <VerificationBadge status={listing.verificationStatus} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{formatPrice(parseFloat(listing.priceGhs))}</span>
                      <span>{listing.sizeAcres} acres</span>
                      <span>{listing.viewCount} views</span>
                      <span>Listed {formatDate(listing.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {listing.listingStatus === 'DRAFT' && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleStatusChange(listing.id, 'PUBLISHED')}
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    {listing.listingStatus === 'PUBLISHED' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStatusChange(listing.id, 'DRAFT')}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Unpublish
                      </Button>
                    )}
                    {listing.listingStatus === 'SUBMITTED' && (
                      <Badge variant="pending">Pending Review</Badge>
                    )}
                    
                    <Link href={`/dashboard/listings/${listing.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(listing.id)}
                      disabled={deleteId === listing.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredListings.length > 0 && (
        <div className="flex items-center justify-between">
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
      )}
    </div>
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
    case 'DRAFT':
      return <Badge variant="neutral">Draft</Badge>;
    case 'SUBMITTED':
      return <Badge variant="pending">Submitted</Badge>;
    case 'SUSPENDED':
      return <Badge variant="rejected">Suspended</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function VerificationBadge({ status }: { status: string }) {
  if (status === 'VERIFIED') {
    return (
      <Badge variant="verified">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }
  if (status === 'PENDING') {
    return (
      <Badge variant="pending">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  }
  return null;
}

function ListingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
