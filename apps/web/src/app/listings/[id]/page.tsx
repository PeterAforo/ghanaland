'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Shield,
  Phone,
  Mail,
  Calendar,
  Ruler,
  Building2,
  FileText,
  Share2,
  Heart,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';

interface ListingDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  landType: string;
  tenureType: string;
  leasePeriodYears?: number;
  sizeAcres: string;
  priceGhs: string;
  region: string;
  district: string;
  town?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: string;
  verifiedAt?: string;
  viewCount: number;
  createdAt: string;
  media: Array<{ id: string; url: string; type: string }>;
  seller?: {
    id: string;
    fullName: string;
    phone?: string;
  };
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/listings/${id}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message);
      return result.data as ListingDetail;
    },
  });

  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={<MapPin className="h-6 w-6" />}
          title="Listing not found"
          description="This listing may have been removed or doesn't exist"
          action={
            <Link href="/listings">
              <Button variant="primary">Browse Listings</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isVerified = listing.verificationStatus === 'VERIFIED';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Ghana Lands
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/listings" className="text-sm text-muted-foreground hover:text-foreground">
              Listings
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Back Link */}
        <Link
          href="/listings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to listings
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="aspect-[16/9] rounded-2xl bg-muted overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-primary/40" />
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {listing.town && `${listing.town}, `}
                    {listing.district}, {listing.region}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {isVerified && (
                  <Badge variant="verified">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Land
                  </Badge>
                )}
                <Badge variant="neutral" className="capitalize">
                  {listing.category.toLowerCase()}
                </Badge>
                <Badge variant="neutral" className="capitalize">
                  {listing.landType.toLowerCase().replace('_', ' ')}
                </Badge>
                <Badge variant="neutral" className="capitalize">
                  {listing.tenureType.toLowerCase()}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={<Ruler className="h-4 w-4" />}
                    label="Size"
                    value={`${listing.sizeAcres} acres`}
                  />
                  <DetailItem
                    icon={<Building2 className="h-4 w-4" />}
                    label="Category"
                    value={listing.category.toLowerCase()}
                  />
                  <DetailItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Land Type"
                    value={listing.landType.toLowerCase().replace('_', ' ')}
                  />
                  <DetailItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Tenure"
                    value={listing.tenureType.toLowerCase()}
                  />
                  {listing.leasePeriodYears && (
                    <DetailItem
                      icon={<Calendar className="h-4 w-4" />}
                      label="Lease Period"
                      value={`${listing.leasePeriodYears} years`}
                    />
                  )}
                  <DetailItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Listed"
                    value={formatDate(listing.createdAt)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            {isVerified && listing.verifiedAt && (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Verified Land</p>
                      <p className="text-sm text-muted-foreground">
                        Verification status is logged and auditable. Verified on{' '}
                        {formatDate(listing.verifiedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(parseFloat(listing.priceGhs))}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPrice(parseFloat(listing.priceGhs) / parseFloat(listing.sizeAcres))}/acre
                </p>

                <div className="mt-6 space-y-3">
                  <Button variant="primary" className="w-full">
                    Contact Seller
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Make an Offer
                  </Button>
                </div>

                {/* Seller Info */}
                {listing.seller && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Seller</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {listing.seller.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{listing.seller.fullName}</p>
                        {listing.seller.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {listing.seller.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Trust Copy */}
                <p className="mt-6 text-xs text-muted-foreground text-center">
                  Secure payment via Hubtel escrow
                </p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  {listing.viewCount} views
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}

function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-[16/9] rounded-2xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
