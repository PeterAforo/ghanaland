'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Shield, 
  Banknote, 
  Users, 
  Search, 
  ArrowRight,
  TrendingUp,
  Building2,
  Leaf,
  Factory,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { formatPrice } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { useHeroAnimation } from '@/hooks/useHeroAnimation';
import { HeroBackground } from '@/components/hero/HeroBackground';

interface Listing {
  id: string;
  title: string;
  category: string;
  region: string;
  district: string;
  priceGhs: string;
  pricePerPlot?: string | number;
  verificationStatus: string;
  media: Array<{ url: string }>;
}

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
];

const CATEGORIES = [
  { value: 'RESIDENTIAL', label: 'Residential', icon: Building2, color: 'bg-blue-500' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: TrendingUp, color: 'bg-purple-500' },
  { value: 'AGRICULTURAL', label: 'Agricultural', icon: Leaf, color: 'bg-green-500' },
  { value: 'INDUSTRIAL', label: 'Industrial', icon: Factory, color: 'bg-orange-500' },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ listings: 0, verified: 0, transactions: 0 });

  useEffect(() => {
    fetchListings();
    fetchStats();
  }, []);

  const fetchListings = async () => {
    try {
      // Fetch featured (verified) listings
      const featuredRes = await fetch(`${API_BASE_URL}/api/v1/listings?limit=4`);
      const featuredData = await featuredRes.json();
      console.log('Featured listings response:', featuredData);
      if (featuredData.success && Array.isArray(featuredData.data)) {
        // Prioritize verified listings
        const sorted = [...featuredData.data].sort((a: Listing, b: Listing) => {
          if (a.verificationStatus === 'VERIFIED' && b.verificationStatus !== 'VERIFIED') return -1;
          if (b.verificationStatus === 'VERIFIED' && a.verificationStatus !== 'VERIFIED') return 1;
          return 0;
        });
        setFeaturedListings(sorted.slice(0, 4));
      }

      // Fetch recent listings
      const recentRes = await fetch(`${API_BASE_URL}/api/v1/listings?limit=6`);
      const recentData = await recentRes.json();
      console.log('Recent listings response:', recentData);
      if (recentData.success && Array.isArray(recentData.data)) {
        setRecentListings(recentData.data.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/listings?limit=1`);
      const data = await res.json();
      if (data.success && data.meta?.pagination) {
        setStats({
          listings: data.meta.pagination.total || 0,
          verified: Math.floor((data.meta.pagination.total || 0) * 0.3),
          transactions: Math.floor((data.meta.pagination.total || 0) * 0.5),
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('query', searchQuery);
    if (selectedRegion) params.append('region', selectedRegion);
    router.push(`/listings?${params.toString()}`);
  };

  const heroRef = useHeroAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section 
        ref={heroRef}
        data-hero="root"
        className="relative py-16 md:py-24 overflow-hidden"
      >
        {/* Hero Background with image and overlay */}
        <HeroBackground />
        
        {/* Background accent for parallax (fallback gradient) */}
        <div 
          data-hero="bg-accent"
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none z-[1]"
        />
        
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="text-center">
            <Badge data-hero="eyebrow" variant="secondary" className="mb-4">
              🇬🇭 Ghana's #1 Land Marketplace
            </Badge>
            <h1 data-hero="headline" className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              <span data-hero="headline-line">Find Your Perfect</span>
              <span data-hero="headline-line" className="block text-primary">Land in Ghana</span>
            </h1>
            <p data-hero="subtext" className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Buy and sell land with confidence. Verified listings, secure escrow payments, 
              and transparent transactions.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mt-10 mx-auto max-w-3xl">
            <div 
              data-hero="search-card"
              className="flex flex-col sm:flex-row gap-3 p-3 bg-card rounded-2xl shadow-lg border border-border"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  data-hero="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location, title..."
                  className="pl-10 h-12 border-0 bg-transparent focus-visible:ring-0"
                />
              </div>
              <select
                data-hero="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="h-12 px-4 rounded-xl border border-border bg-background text-sm"
              >
                <option value="">All Regions</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Button 
                data-hero="search-button"
                type="submit" 
                variant="primary" 
                size="lg" 
                className="h-12 px-8"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Secondary CTA */}
          <div data-hero="secondary-cta" className="mt-6 text-center">
            <Link href="/listings" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
              Or browse all listings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Quick Stats / Trust Strip */}
          <div data-hero="trust-strip" className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
            <div data-hero="trust-item" className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.listings.toLocaleString()}+</p>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div data-hero="trust-item" className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.verified.toLocaleString()}+</p>
              <p className="text-sm text-muted-foreground">Verified Lands</p>
            </div>
            <div data-hero="trust-item" className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.transactions.toLocaleString()}+</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-border">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Browse by Category</h2>
            <Link href="/listings" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/listings?category=${cat.value}`}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className={`h-12 w-12 rounded-xl ${cat.color} flex items-center justify-center text-white mb-4`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {cat.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse {cat.label.toLowerCase()} lands
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Featured Listings</h2>
                <p className="text-sm text-muted-foreground">Hand-picked properties for you</p>
              </div>
              <Link href="/listings" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground">Why Choose Ghana Lands?</h2>
            <p className="text-muted-foreground mt-2">The safest way to buy and sell land in Ghana</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Verified Listings"
              description="All listings undergo verification to ensure legitimacy and clear ownership."
            />
            <FeatureCard
              icon={<Banknote className="h-6 w-6" />}
              title="Secure Escrow"
              description="Your payment is held securely until all conditions are met."
            />
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="GPS Mapping"
              description="View exact parcel locations with GPS coordinates on interactive maps."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Installment Plans"
              description="Flexible payment options with 6-24 month installment plans."
            />
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      {recentListings.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Recently Added</h2>
                <p className="text-sm text-muted-foreground">Fresh listings just for you</p>
              </div>
              <Link href="/listings" className="text-sm text-primary hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            Ready to list your land?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of sellers on Ghana's most trusted land marketplace. 
            List your property in minutes and reach verified buyers.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/listings">
              <Button variant="ghost" size="lg" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-bold text-foreground text-lg">Ghana Lands</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ghana's trusted platform for secure land transactions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Platform</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/listings" className="hover:text-foreground transition-colors">Browse Listings</Link></li>
                <li><Link href="/listings/map" className="hover:text-foreground transition-colors">Map View</Link></li>
                <li><Link href="/auth/register" className="hover:text-foreground transition-colors">Sell Land</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><a href="mailto:support@ghanalands.com" className="hover:text-foreground transition-colors">support@ghanalands.com</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ghana Lands. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>🇬🇭 Made in Ghana</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const isVerified = listing.verificationStatus === 'VERIFIED';
  const imageUrl = listing.media?.[0]?.url;
  const price = listing.pricePerPlot ? Number(listing.pricePerPlot) : parseFloat(listing.priceGhs);

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <Link href={`/listings/${listing.id}`}>
        <div className="aspect-[4/3] bg-muted relative">
          {imageUrl ? (
            <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-primary/40" />
            </div>
          )}
          {isVerified && (
            <Badge variant="verified" className="absolute top-3 left-3">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <FavoriteButton listingId={listing.id} className="absolute top-3 right-3" size="sm" />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/listings/${listing.id}`}>
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" />
          {listing.district}, {listing.region}
        </p>
        <p className="text-lg font-bold text-primary mt-2">
          {formatPrice(price)}
          {listing.pricePerPlot && (
            <span className="text-xs font-normal text-muted-foreground ml-1">per plot</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center hover:shadow-md transition-shadow">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
