'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface HeroBackgroundProps {
  className?: string;
}

export function HeroBackground({ className = '' }: HeroBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  // Image filter styles based on theme
  const imageFilters = isDark
    ? 'saturate-[0.7] contrast-[0.95] brightness-[0.75] blur-[1px]'
    : 'saturate-[0.75] contrast-[0.92] brightness-[0.95] blur-[1px]';

  // Overlay gradient based on theme
  const overlayGradient = isDark
    ? 'linear-gradient(to bottom, rgba(6,12,10,0.72), rgba(6,12,10,0.86))'
    : 'linear-gradient(to bottom, rgba(255,255,255,0.88), rgba(255,255,255,0.94))';

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Background Image */}
      <div
        data-hero="bg-image"
        className="absolute inset-0"
        style={{ transform: 'scale(1.02)' }}
      >
        <Image
          src="/images/hero/hero-bg-dark.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover object-center ${imageFilters}`}
          style={{
            objectPosition: 'center',
          }}
        />
      </div>

      {/* Overlay */}
      <div
        data-hero="bg-overlay"
        className="absolute inset-0"
        style={{
          background: overlayGradient,
        }}
      />
    </div>
  );
}

export function ContentBackdrop({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div
      data-hero="content-backdrop"
      className={`relative ${className}`}
      style={{
        background: isDark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.55)',
        backdropFilter: isDark ? 'blur(8px)' : 'blur(6px)',
        WebkitBackdropFilter: isDark ? 'blur(8px)' : 'blur(6px)',
      }}
    >
      {children}
    </div>
  );
}
