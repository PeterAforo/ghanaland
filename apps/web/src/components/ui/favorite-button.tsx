'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from './button';
import { API_BASE_URL } from '@/lib/api';

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({
  listingId,
  initialFavorited = false,
  size = 'md',
  variant = 'icon',
  className = '',
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Check if user is logged in and fetch favorite status
    const token = localStorage.getItem('accessToken');
    if (token && !isChecked) {
      checkFavoriteStatus(token);
    }
  }, [listingId]);

  const checkFavoriteStatus = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/favorites/check/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsFavorited(data.data.isFavorite);
        }
      }
      // Silently fail for 401/404 - user not logged in or endpoint not available
    } catch (error) {
      // Silently fail - don't log errors for expected failures
    } finally {
      setIsChecked(true);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Redirect to login or show login modal
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setIsLoading(true);
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE_URL}/api/v1/favorites/${listingId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const newState = !isFavorited;
        setIsFavorited(newState);
        onToggle?.(newState);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isFavorited ? 'secondary' : 'ghost'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Heart
            className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-destructive text-destructive' : ''}`}
          />
        )}
        {isFavorited ? 'Saved' : 'Save'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`${sizeClasses[size]} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin text-muted-foreground`} />
      ) : (
        <Heart
          className={`${iconSizes[size]} ${
            isFavorited ? 'fill-destructive text-destructive' : 'text-muted-foreground'
          }`}
        />
      )}
    </button>
  );
}
