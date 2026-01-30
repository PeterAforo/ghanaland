'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { User, LogOut, LayoutDashboard, ChevronDown, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          Ghana Lands
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/listings" className="text-sm text-muted-foreground hover:text-foreground">
            Listings
          </Link>
          <Link href="/professionals" className="text-sm text-muted-foreground hover:text-foreground">
            Professionals
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-xl" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard/notifications" className="relative p-2 rounded-xl hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.fullName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/listings"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="h-4 w-4" />
                        My Listings
                      </Link>
                      <hr className="my-2 border-border" />
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
