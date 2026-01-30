'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  List,
  Filter,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { MAP_COLORS } from '@/lib/map-tokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { formatPrice } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  category: string;
  region: string;
  district: string;
  priceGhs: string;
  pricePerPlot?: number;
  latitude?: number;
  longitude?: number;
  verificationStatus: string;
  media: Array<{ url: string }>;
}

export default function ListingsMapPage() {
  const searchParams = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filters
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchListings();
  }, [region, category]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (region) params.append('region', region);
      if (category) params.append('category', category);
      params.append('limit', '100'); // Get more listings for map view

      const res = await fetch(`${API_BASE_URL}/api/v1/listings?${params}`);
      const data = await res.json();
      
      if (data.success) {
        // Filter to only listings with coordinates
        const listingsWithCoords = data.data.filter(
          (l: Listing) => l.latitude && l.longitude
        );
        setListings(listingsWithCoords);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current || mapInstanceRef.current) return;

      // Center on Ghana
      const map = L.map(mapRef.current, {
        center: [7.9465, -1.0232],
        zoom: 7,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when listings change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = require('leaflet');

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    listings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return;

      const isVerified = listing.verificationStatus === 'VERIFIED';
      const price = listing.pricePerPlot || parseFloat(listing.priceGhs);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${isVerified ? MAP_COLORS.success : MAP_COLORS.primary};
            color: ${MAP_COLORS.white};
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            border: 2px solid ${MAP_COLORS.white};
            box-shadow: 0 2px 8px ${MAP_COLORS.shadow};
            cursor: pointer;
          ">
            ${formatPrice(price)}
          </div>
        `,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      const marker = L.marker([listing.latitude, listing.longitude], {
        icon: customIcon,
      }).addTo(mapInstanceRef.current);

      marker.on('click', () => {
        setSelectedListing(listing);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [listings, mapLoaded]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/listings">
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              {listings.length} listings with location
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">All Regions</option>
              <option value="Greater Accra">Greater Accra</option>
              <option value="Ashanti">Ashanti</option>
              <option value="Western">Western</option>
              <option value="Eastern">Eastern</option>
              <option value="Central">Central</option>
              <option value="Northern">Northern</option>
              <option value="Volta">Volta</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">All Categories</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="AGRICULTURAL">Agricultural</option>
            </select>
            {(region || category) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRegion('');
                  setCategory('');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Map container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Loading overlay */}
        {(isLoading || !mapLoaded) && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading map...
            </div>
          </div>
        )}

        {/* Selected listing card */}
        {selectedListing && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20">
            <Card className="shadow-xl">
              <CardContent className="p-0">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
                <Link href={`/listings/${selectedListing.id}`}>
                  <div className="aspect-[16/9] bg-muted relative">
                    {selectedListing.media?.[0]?.url ? (
                      <img
                        src={selectedListing.media[0].url}
                        alt={selectedListing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                    {selectedListing.verificationStatus === 'VERIFIED' && (
                      <Badge variant="verified" className="absolute top-2 left-2">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {selectedListing.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedListing.district}, {selectedListing.region}
                    </p>
                    <p className="text-lg font-bold text-primary mt-2">
                      {formatPrice(
                        selectedListing.pricePerPlot || parseFloat(selectedListing.priceGhs)
                      )}
                      {selectedListing.pricePerPlot && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          per plot
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No listings message */}
        {!isLoading && listings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center p-6 bg-card rounded-xl shadow-lg">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-foreground">No listings with location</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or check back later
              </p>
              <Link href="/listings">
                <Button variant="primary" size="sm" className="mt-4">
                  View All Listings
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
