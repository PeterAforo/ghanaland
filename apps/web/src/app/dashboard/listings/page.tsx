'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';

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
  viewCount: number;
  createdAt: string;
}

export default function UserListingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Mock data - will be replaced with API call
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
      viewCount: 245,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Commercial Plot in Tema',
      category: 'COMMERCIAL',
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      priceGhs: 5000000,
      sizeAcres: 10,
      listingStatus: 'DRAFT',
      verificationStatus: 'UNVERIFIED',
      viewCount: 0,
      createdAt: '2024-01-18T14:30:00Z',
    },
  ];

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !search || listing.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || listing.listingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return <ListingsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - reuse from dashboard */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Ghana Lands
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <NavItem href="/dashboard" icon={<MapPin />} label="Dashboard" />
            <NavItem href="/dashboard/listings" icon={<MapPin />} label="My Listings" active />
            <NavItem href="/dashboard/transactions" icon={<MapPin />} label="Transactions" />
            <NavItem href="/dashboard/favorites" icon={<MapPin />} label="Favorites" />
            <NavItem href="/dashboard/settings" icon={<MapPin />} label="Settings" />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Listings</h1>
            <p className="text-sm text-muted-foreground">Manage your land listings</p>
          </div>
          <Link href="/dashboard/listings/new">
            <Button variant="primary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total Listings" value={listings.length} />
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
                      {/* Image placeholder */}
                      <div className="w-full lg:w-32 h-24 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
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
                          <span>{formatPrice(listing.priceGhs)}</span>
                          <span>{listing.sizeAcres} acres</span>
                          <span>{listing.viewCount} views</span>
                          <span>Listed {formatDate(listing.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/listings/${listing.id}`}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="h-5 w-5">{icon}</span>
      {label}
    </Link>
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
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden lg:block">
        <div className="p-6">
          <Skeleton className="h-8 w-32" />
        </div>
      </aside>
      <main className="lg:pl-64 p-6">
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-14 rounded-2xl mb-6" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl mb-4" />
        ))}
      </main>
    </div>
  );
}
