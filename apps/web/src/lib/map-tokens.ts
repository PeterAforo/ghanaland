/**
 * Map Color Tokens
 * Centralized color definitions for Leaflet map components.
 * These map to our design system semantic tokens.
 * 
 * Note: Leaflet requires hex/rgb values directly, so we define them here
 * as the single source of truth for map-related colors.
 */

export const MAP_COLORS = {
  // Primary blue (matches --primary in CSS)
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  
  // Success green (matches --success in CSS)
  success: '#16a34a',
  successLight: '#22c55e',
  
  // Neutral
  white: '#ffffff',
  gray: '#666666',
  
  // Shadows
  shadow: 'rgba(0,0,0,0.3)',
} as const;

export const MAP_STYLES = {
  polygon: {
    color: MAP_COLORS.primary,
    fillColor: MAP_COLORS.primary,
    fillOpacity: 0.2,
    weight: 3,
  },
  polygonVerified: {
    color: MAP_COLORS.success,
    fillColor: MAP_COLORS.success,
    fillOpacity: 0.2,
    weight: 3,
  },
  polyline: {
    color: MAP_COLORS.primary,
    weight: 3,
    dashArray: '5, 10',
  },
  marker: {
    radius: 8,
    color: MAP_COLORS.primary,
    fillColor: MAP_COLORS.white,
    fillOpacity: 1,
    weight: 3,
  },
} as const;
