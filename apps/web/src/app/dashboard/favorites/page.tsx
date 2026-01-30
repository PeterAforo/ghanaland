'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import { DashboardLayout } from '../_components/dashboard-layout';
import { API_BASE_URL } from '@/lib/api';

interface Favorite {
  id: string;
  listingId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    category: string;
    region: string;
    district: string;
    priceGhs: string;
    pricePerPlot?: string;
    sizeAcres: string;
    verificationStatus: string;
    media: Array<{ url: string }>;
    seller: { fullName: string };
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/favorites?page=${page}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setFavorites(data.data);
        setPagination(data.meta.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (listingId: string) => {
    setRemovingId(listingId);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/favorites/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.listingId !== listingId));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Listings</h1>
          <p className="text-muted-foreground">
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="No saved listings"
            description="Start exploring and save listings you're interested in"
            action={
              <Link href="/listings">
                <Button variant="primary">Browse Listings</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite) => (
                <FavoriteCard
                  key={favorite.id}
                  favorite={favorite}
                  onRemove={handleRemove}
                  isRemoving={removingId === favorite.listingId}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= Math.ceil(pagination.total / pagination.pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function FavoriteCard({
  favorite,
  onRemove,
  isRemoving,
}: {
  favorite: Favorite;
  onRemove: (listingId: string) => void;
  isRemoving: boolean;
}) {
  const { listing } = favorite;
  const isVerified = listing.verificationStatus === 'VERIFIED';
  const imageUrl = listing.media?.[0]?.url;

  return (
    <Card className="overflow-hidden group">
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
            <Badge variant="verified" className="absolute top-3 right-3">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/listings/${listing.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
              {listing.title}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => onRemove(favorite.listingId)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" />
          {listing.district}, {listing.region}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-lg font-bold text-primary">
              {listing.pricePerPlot
                ? formatPrice(parseFloat(listing.pricePerPlot))
                : formatPrice(parseFloat(listing.priceGhs))}
            </p>
            {listing.pricePerPlot && (
              <p className="text-xs text-muted-foreground">per plot</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Saved {formatDate(favorite.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
