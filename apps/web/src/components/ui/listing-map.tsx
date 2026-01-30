'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Maximize2, X } from 'lucide-react';
import { Button } from './button';
import { MAP_COLORS } from '@/lib/map-tokens';

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  title?: string;
  address?: string;
  className?: string;
}

export function ListingMap({ 
  latitude, 
  longitude, 
  title,
  address,
  className = '' 
}: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Default to Accra, Ghana if no coordinates provided
  const lat = latitude || 5.6037;
  const lng = longitude || -0.1870;
  const hasCoordinates = latitude && longitude;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet
    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Import CSS
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current || mapInstanceRef.current) return;

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: hasCoordinates ? 15 : 10,
        scrollWheelZoom: false,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add marker if coordinates exist
      if (hasCoordinates) {
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: ${MAP_COLORS.primary};
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid ${MAP_COLORS.white};
              box-shadow: 0 2px 8px ${MAP_COLORS.shadow};
            ">
              <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        
        if (title || address) {
          marker.bindPopup(`
            <div style="min-width: 150px;">
              ${title ? `<strong>${title}</strong>` : ''}
              ${address ? `<p style="margin: 4px 0 0; font-size: 12px; color: ${MAP_COLORS.gray};">${address}</p>` : ''}
            </div>
          `);
        }
      }

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
  }, [lat, lng, hasCoordinates, title, address]);

  // Handle fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  if (!hasCoordinates) {
    return (
      <div className={`bg-muted rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative rounded-xl overflow-hidden ${className}`}>
        <div ref={mapRef} className="w-full h-full min-h-[200px]" />
        
        {/* Fullscreen button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur-sm shadow-md z-[1000]"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading map...</div>
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-card rounded-2xl overflow-hidden">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-[1001] bg-white/90 backdrop-blur-sm shadow-md"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <FullscreenMap
              latitude={lat}
              longitude={lng}
              title={title}
              address={address}
            />
          </div>
        </div>
      )}
    </>
  );
}

function FullscreenMap({ latitude, longitude, title, address }: {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 16,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${MAP_COLORS.primary};
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid ${MAP_COLORS.white};
            box-shadow: 0 2px 8px ${MAP_COLORS.shadow};
          ">
            <svg style="transform: rotate(45deg); width: 20px; height: 20px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      
      if (title || address) {
        marker.bindPopup(`
          <div style="min-width: 200px;">
            ${title ? `<strong style="font-size: 14px;">${title}</strong>` : ''}
            ${address ? `<p style="margin: 4px 0 0; font-size: 12px; color: ${MAP_COLORS.gray};">${address}</p>` : ''}
          </div>
        `).openPopup();
      }

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, title, address]);

  return <div ref={mapRef} className="w-full h-full" />;
}
