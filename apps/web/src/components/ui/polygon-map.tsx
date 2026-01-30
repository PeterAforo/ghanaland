'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Trash2, Undo, Check, Edit3, Loader2 } from 'lucide-react';
import { Button } from './button';
import { MAP_STYLES } from '@/lib/map-tokens';

interface PolygonMapProps {
  coordinates?: Array<[number, number]>; // Array of [lat, lng] pairs
  onChange?: (coordinates: Array<[number, number]>) => void;
  center?: { latitude: number; longitude: number };
  editable?: boolean;
  className?: string;
}

export function PolygonMap({
  coordinates = [],
  onChange,
  center,
  editable = true,
  className = '',
}: PolygonMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Array<[number, number]>>(coordinates);
  const [L, setL] = useState<any>(null);

  // Default to Accra, Ghana
  const defaultCenter = { latitude: 5.6037, longitude: -0.1870 };
  const mapCenter = center || defaultCenter;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadMap = async () => {
      const leaflet = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      setL(leaflet);

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = leaflet.map(mapRef.current, {
        center: [mapCenter.latitude, mapCenter.longitude],
        zoom: coordinates.length > 0 ? 15 : 12,
      });

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // If we have initial coordinates, draw the polygon
      if (coordinates.length > 0) {
        setPoints(coordinates);
      }
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Draw polygon when points change
  useEffect(() => {
    if (!mapInstanceRef.current || !L || !mapLoaded) return;

    // Clear existing polygon and markers
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (points.length < 3) {
      // Draw lines between points if less than 3
      if (points.length >= 2) {
        const polyline = L.polyline(points, MAP_STYLES.polyline).addTo(mapInstanceRef.current);
        polygonRef.current = polyline;
      }
    } else {
      // Draw polygon
      const polygon = L.polygon(points, MAP_STYLES.polygon).addTo(mapInstanceRef.current);
      polygonRef.current = polygon;

      // Fit bounds to polygon
      mapInstanceRef.current.fitBounds(polygon.getBounds().pad(0.1));
    }

    // Add draggable markers for each point if editable
    if (editable && isDrawing) {
      points.forEach((point, index) => {
        const marker = L.circleMarker(point, MAP_STYLES.marker).addTo(mapInstanceRef.current);

        if (editable) {
          marker.on('click', () => {
            // Remove point on click
            const newPoints = points.filter((_, i) => i !== index);
            setPoints(newPoints);
            onChange?.(newPoints);
          });
        }

        markersRef.current.push(marker);
      });
    }
  }, [points, L, mapLoaded, editable, isDrawing]);

  // Handle map clicks when drawing
  useEffect(() => {
    if (!mapInstanceRef.current || !isDrawing) return;

    const handleClick = (e: any) => {
      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const newPoints = [...points, newPoint];
      setPoints(newPoints);
      onChange?.(newPoints);
    };

    mapInstanceRef.current.on('click', handleClick);

    return () => {
      mapInstanceRef.current?.off('click', handleClick);
    };
  }, [isDrawing, points, onChange]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setPoints([]);
    onChange?.([]);
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
    if (points.length >= 3) {
      onChange?.(points);
    }
  };

  const handleUndo = () => {
    if (points.length > 0) {
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);
      onChange?.(newPoints);
    }
  };

  const handleClear = () => {
    setPoints([]);
    onChange?.([]);
  };

  const calculateArea = () => {
    if (points.length < 3) return null;

    // Shoelace formula for polygon area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][1] * points[j][0];
      area -= points[j][1] * points[i][0];
    }
    area = Math.abs(area) / 2;

    // Convert to approximate square meters (rough approximation for Ghana's latitude)
    const latMid = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(latMid * Math.PI / 180);
    const areaInSqMeters = area * metersPerDegreeLat * metersPerDegreeLng;

    // Convert to acres (1 acre = 4046.86 sq meters)
    const areaInAcres = areaInSqMeters / 4046.86;

    return {
      sqMeters: areaInSqMeters.toFixed(2),
      acres: areaInAcres.toFixed(4),
      plots: (areaInSqMeters / 464.5).toFixed(1), // Approximate 70x70 ft plot
    };
  };

  const area = calculateArea();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls */}
      {editable && (
        <div className="flex flex-wrap gap-2">
          {!isDrawing ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStartDrawing}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {points.length > 0 ? 'Redraw Boundary' : 'Draw Boundary'}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleFinishDrawing}
                disabled={points.length < 3}
              >
                <Check className="h-4 w-4 mr-2" />
                Finish ({points.length} points)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUndo}
                disabled={points.length === 0}
              >
                <Undo className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={points.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </>
          )}
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <div ref={mapRef} className="w-full h-[400px]" />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Drawing instructions */}
        {isDrawing && (
          <div className="absolute top-3 left-3 right-3 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">
            <MapPin className="h-4 w-4 inline mr-2" />
            Click on the map to add boundary points. Add at least 3 points to create a polygon.
          </div>
        )}
      </div>

      {/* Area calculation */}
      {area && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">Estimated Land Area</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Sq. Meters:</span>
              <span className="ml-1 font-medium">{Number(area.sqMeters).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Acres:</span>
              <span className="ml-1 font-medium">{area.acres}</span>
            </div>
            <div>
              <span className="text-muted-foreground">~Plots:</span>
              <span className="ml-1 font-medium">{area.plots}</span>
            </div>
          </div>
        </div>
      )}

      {/* Coordinates display */}
      {points.length > 0 && !isDrawing && (
        <details className="text-xs">
          <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
            View coordinates ({points.length} points)
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(points, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Component for displaying polygon on listing detail page (non-editable)
export function ListingPolygon({
  coordinates,
  className = '',
}: {
  coordinates: Array<[number, number]>;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || coordinates.length < 3) return;

    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Draw polygon
      const polygon = L.polygon(coordinates, MAP_STYLES.polygonVerified).addTo(map);

      map.fitBounds(polygon.getBounds().pad(0.1));

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
  }, [coordinates]);

  if (coordinates.length < 3) {
    return null;
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
      <div ref={mapRef} className="w-full h-[300px]" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
