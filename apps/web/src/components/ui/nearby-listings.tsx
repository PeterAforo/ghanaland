'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Loader2, Shield } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { formatPrice } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface NearbyListing {
  id: string;
  title: string;
  category: string;
  region: string;
  district: string;
  priceGhs: string;
  sizeAcres: string;
  latitude: number;
  longitude: number;
  verificationStatus: string;
  distanceKm: number;
  media?: Array<{ url: string }>;
}

interface NearbyListingsProps {
  latitude: number;
  longitude: number;
  excludeListingId?: string;
  radiusKm?: number;
  limit?: number;
  className?: string;
}

export function NearbyListings({
  latitude,
  longitude,
  excludeListingId,
  radiusKm = 10,
  limit = 6,
  className = '',
}: NearbyListingsProps) {
  const [listings, setListings] = useState<NearbyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearby = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: radiusKm.toString(),
          limit: (limit + 1).toString(), // Fetch one extra in case we need to exclude current
        });

        const res = await fetch(`${API_BASE_URL}/api/v1/search/nearby?${params}`);
        const data = await res.json();

        if (data.success) {
          let nearbyListings = data.data as NearbyListing[];
          
          // Exclude current listing if provided
          if (excludeListingId) {
            nearbyListings = nearbyListings.filter((l) => l.id !== excludeListingId);
          }
          
          setListings(nearbyListings.slice(0, limit));
        } else {
          setError('Failed to load nearby listings');
        }
      } catch (err) {
        console.error('Failed to fetch nearby listings:', err);
        setError('Failed to load nearby listings');
      } finally {
        setIsLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchNearby();
    }
  }, [latitude, longitude, radiusKm, limit, excludeListingId]);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Finding nearby listings...</span>
        </div>
      </div>
    );
  }

  if (error || listings.length === 0) {
    return null; // Don't show section if no nearby listings
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Nearby Listings
        </h3>
        <span className="text-sm text-muted-foreground">
          Within {radiusKm}km
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <NearbyListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function NearbyListingCard({ listing }: { listing: NearbyListing }) {
  const isVerified = listing.verificationStatus === 'VERIFIED';
  const imageUrl = listing.media?.[0]?.url;

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden h-full">
        <div className="aspect-[4/3] bg-muted relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary/40" />
            </div>
          )}
          {isVerified && (
            <Badge variant="verified" className="absolute top-2 left-2">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <Badge variant="neutral" className="absolute top-2 right-2">
            {listing.distanceKm.toFixed(1)} km
          </Badge>
        </div>
        <CardContent className="p-3">
          <h4 className="font-medium text-foreground text-sm line-clamp-1">
            {listing.title}
          </h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {listing.district}, {listing.region}
          </p>
          <p className="text-sm font-bold text-primary mt-2">
            {formatPrice(parseFloat(listing.priceGhs))}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// Hook for getting user's current location
export function useUserLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        setError('Unable to get your location');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { location, isLoading, error, getLocation };
}

// Component for "Find Near Me" button
export function FindNearMeButton({
  onLocationFound,
  className = '',
}: {
  onLocationFound: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}) {
  const { location, isLoading, error, getLocation } = useUserLocation();

  useEffect(() => {
    if (location) {
      onLocationFound(location);
    }
  }, [location, onLocationFound]);

  return (
    <div className={className}>
      <Button
        variant="secondary"
        size="sm"
        onClick={getLocation}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4 mr-2" />
        )}
        Find Near Me
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
