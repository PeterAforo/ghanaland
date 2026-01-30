'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Filter,
  Grid3X3,
  List,
  Map,
  ChevronDown,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { formatPrice } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const REGIONS = [
  'All Regions',
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'AGRICULTURAL', label: 'Agricultural' },
];

const LAND_TYPES = [
  { value: '', label: 'All Land Types' },
  { value: 'FREEHOLD', label: 'Freehold' },
  { value: 'LEASEHOLD', label: 'Leasehold' },
  { value: 'STOOL_LAND', label: 'Stool Land' },
  { value: 'FAMILY_LAND', label: 'Family Land' },
  { value: 'STATE_LAND', label: 'State Land' },
];

const PRICE_RANGES = [
  { value: '', label: 'Any Price' },
  { value: '0-50000', label: 'Under GH₵50,000' },
  { value: '50000-100000', label: 'GH₵50,000 - GH₵100,000' },
  { value: '100000-500000', label: 'GH₵100,000 - GH₵500,000' },
  { value: '500000-1000000', label: 'GH₵500,000 - GH₵1,000,000' },
  { value: '1000000-', label: 'Over GH₵1,000,000' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'size_low', label: 'Size: Small to Large' },
  { value: 'size_high', label: 'Size: Large to Small' },
];

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  landType: string;
  sizeAcres: string;
  priceGhs: string;
  pricePerPlot?: string;
  totalPlots?: number;
  availablePlots?: number;
  region: string;
  district: string;
  verificationStatus: string;
  media: Array<{ url: string }>;
  seller?: { fullName: string };
}

export default function ListingsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [landType, setLandType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', { search, region, category, landType, priceRange, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('query', search);
      if (region && region !== 'All Regions') params.set('region', region);
      if (category) params.set('category', category);
      if (landType) params.set('landType', landType);
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        if (min) params.set('minPrice', min);
        if (max) params.set('maxPrice', max);
      }
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/v1/listings?${params}`);
      const result = await res.json();
      return result.data as Listing[];
    },
  });

  const listings = data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Land Listings</h1>
          <p className="text-muted-foreground">
            Find your perfect land in Ghana
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, location..."
                className="pl-10"
              />
            </div>

            {/* Region Select */}
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-10 w-full sm:w-48 rounded-xl border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r === 'All Regions' ? '' : r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>

            {/* View Toggle */}
            <div className="flex border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <Link
                href="/listings/map"
                className="p-2.5 bg-background text-muted-foreground hover:bg-muted"
                title="Map view"
              >
                <Map className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Land Type
                  </label>
                  <select
                    value={landType}
                    onChange={(e) => setLandType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {LAND_TYPES.map((lt) => (
                      <option key={lt.value} value={lt.value}>
                        {lt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Price Range
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PRICE_RANGES.map((pr) => (
                      <option key={pr.value} value={pr.value}>
                        {pr.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {SORT_OPTIONS.map((so) => (
                      <option key={so.value} value={so.value}>
                        {so.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Clear Filters */}
              {(category || landType || priceRange || sortBy !== 'newest') && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategory('');
                      setLandType('');
                      setPriceRange('');
                      setSortBy('newest');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
            {[...Array(8)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="Failed to load listings"
            description="Please try again later"
            action={
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="No listings found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'RESIDENTIAL': 'Residential',
    'COMMERCIAL': 'Commercial',
    'INDUSTRIAL': 'Industrial',
    'AGRICULTURAL': 'Agricultural',
    'MIXED_USE': 'Mixed Use',
  };
  return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function ListingCard({ listing, viewMode }: { listing: Listing; viewMode: 'grid' | 'list' }) {
  const isVerified = listing.verificationStatus === 'VERIFIED';
  const imageUrl = listing.media?.[0]?.url;

  if (viewMode === 'list') {
    return (
      <Link href={`/listings/${listing.id}`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex gap-4">
            <div className="w-32 h-24 rounded-xl bg-muted overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                {isVerified && (
                  <Badge variant="verified" className="flex-shrink-0">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {listing.district}, {listing.region}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-lg font-bold text-primary">
                    {listing.pricePerPlot ? formatPrice(parseFloat(listing.pricePerPlot)) : formatPrice(parseFloat(listing.priceGhs))}
                  </p>
                  {listing.pricePerPlot && (
                    <p className="text-xs text-muted-foreground">per plot</p>
                  )}
                </div>
                {(listing.availablePlots || listing.totalPlots) && (
                  <p className="text-sm text-muted-foreground">
                    {listing.availablePlots || listing.totalPlots} plots
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/listings/${listing.id}`}>
        <div className="aspect-[4/3] bg-muted relative">
          {imageUrl ? (
            <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {isVerified && (
            <Badge variant="verified" className="absolute top-3 right-12">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <FavoriteButton listingId={listing.id} className="absolute top-3 right-3" size="sm" />
          <Badge variant="neutral" className="absolute top-3 left-3">
            {formatCategory(listing.category)}
          </Badge>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">{listing.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" />
          {listing.district}, {listing.region}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-lg font-bold text-primary">
              {listing.pricePerPlot ? formatPrice(parseFloat(listing.pricePerPlot)) : formatPrice(parseFloat(listing.priceGhs))}
            </p>
            {listing.pricePerPlot && (
              <p className="text-xs text-muted-foreground">per plot</p>
            )}
          </div>
          {(listing.availablePlots || listing.totalPlots) && (
            <p className="text-sm text-muted-foreground">
              {listing.availablePlots || listing.totalPlots} plots
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
