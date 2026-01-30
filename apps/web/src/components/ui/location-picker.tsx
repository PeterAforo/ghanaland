'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Crosshair, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { MAP_COLORS } from '@/lib/map-tokens';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  className = '',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Default to Accra, Ghana
  const defaultLat = 5.6037;
  const defaultLng = -0.1870;
  const initialLat = latitude || defaultLat;
  const initialLng = longitude || defaultLng;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: latitude && longitude ? 15 : 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Create draggable marker
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${MAP_COLORS.primary};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid ${MAP_COLORS.white};
            box-shadow: 0 2px 8px ${MAP_COLORS.shadow};
            cursor: grab;
          ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange({ latitude: pos.lat, longitude: pos.lng });
      });

      // Click on map to move marker
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
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

  // Update marker when props change
  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current?.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap's geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Ghana')}&limit=1`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 15);
          onChange({ latitude: newLat, longitude: newLng });
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 15);
          onChange({ latitude: lat, longitude: lng });
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search and controls */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location (e.g., Tema, Kumasi)"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-10"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          title="Use my current location"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <div ref={mapRef} className="w-full h-[300px]" />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading map...</div>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 inline mr-1" />
          Click on the map or drag the marker to set the exact location
        </div>
      </div>

      {/* Coordinates display */}
      {latitude && longitude && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          <span>Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}
