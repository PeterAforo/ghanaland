'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Star, MapPin, BadgeCheck, Filter, ArrowLeft, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { API_BASE_URL } from '@/lib/api';

interface Professional {
  id: string;
  type: string;
  title: string;
  bio: string | null;
  yearsExperience: number | null;
  licenseVerified: boolean;
  regions: string[];
  rating: number;
  reviewCount: number;
  hourlyRateGhs: number | null;
  fixedRateGhs: number | null;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    priceGhs: number;
  }>;
}

const PROFESSIONAL_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'AGENT', label: 'Real Estate Agents' },
  { value: 'SURVEYOR', label: 'Land Surveyors' },
  { value: 'ARCHITECT', label: 'Architects' },
  { value: 'LAWYER', label: 'Lawyers' },
  { value: 'ENGINEER', label: 'Engineers' },
  { value: 'VALUER', label: 'Property Valuers' },
  { value: 'PLANNER', label: 'Town Planners' },
];

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Savannah',
  'North East',
  'Oti',
  'Western North',
];

const STAGE_LABELS: Record<string, string> = {
  LAND_SEARCH: 'Land Search',
  SURVEY: 'Survey & Site Plan',
  LEGAL_DOCUMENTATION: 'Legal Documentation',
  ARCHITECTURAL_DESIGN: 'Architectural Design',
  STRUCTURAL_ENGINEERING: 'Structural Engineering',
  BUILDING_PERMIT: 'Building Permit',
  CONSTRUCTION: 'Construction',
};

export default function ProfessionalsPage() {
  const searchParams = useSearchParams();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Journey context from URL params
  const landId = searchParams.get('landId');
  const stage = searchParams.get('stage');
  const initialType = searchParams.get('type');

  useEffect(() => {
    // Set initial type from URL if provided
    if (initialType) {
      setType(initialType);
    }
  }, [initialType]);

  useEffect(() => {
    fetchProfessionals();
  }, [type, region]);

  const fetchProfessionals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (region) params.append('region', region);
      params.append('limit', '20');

      const res = await fetch(`${API_BASE_URL}/api/v1/professionals?${params}`);
      const data = await res.json();
      if (data.success) {
        setProfessionals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch professionals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (typeValue: string) => {
    return PROFESSIONAL_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  const getTypeIcon = (typeValue: string) => {
    const icons: Record<string, string> = {
      AGENT: '🏠',
      SURVEYOR: '📐',
      ARCHITECT: '🏗️',
      LAWYER: '⚖️',
      ENGINEER: '🔧',
      VALUER: '💰',
      PLANNER: '📋',
    };
    return icons[typeValue] || '👤';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Journey Context Banner */}
      {landId && stage && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Route className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Finding professional for: <span className="font-bold">{STAGE_LABELS[stage] || stage}</span>
                </p>
                <p className="text-xs text-primary/70">
                  Select a professional below to link them to this step in your land journey
                </p>
              </div>
              <Link href={`/dashboard/my-lands/${landId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Land
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground">Find Professionals</h1>
          <p className="text-muted-foreground mt-2">
            Connect with verified land surveyors, lawyers, architects, and more
          </p>

          {/* Search/Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PROFESSIONAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="No professionals found"
                description="Try adjusting your filters or check back later for new professionals."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {professionals.map((professional) => (
              <Link key={professional.id} href={`/professionals/${professional.id}${landId && stage ? `?landId=${landId}&stage=${stage}` : ''}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                        {getTypeIcon(professional.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {professional.user.fullName}
                          </h3>
                          {professional.licenseVerified && (
                            <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{professional.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{Number(professional.rating).toFixed(1)}</span>
                        <span className="text-muted-foreground">({professional.reviewCount})</span>
                      </div>
                      {professional.yearsExperience && (
                        <span className="text-muted-foreground">
                          {professional.yearsExperience}+ years
                        </span>
                      )}
                    </div>

                    {professional.regions.length > 0 && (
                      <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{professional.regions.slice(0, 2).join(', ')}</span>
                        {professional.regions.length > 2 && (
                          <span>+{professional.regions.length - 2}</span>
                        )}
                      </div>
                    )}

                    {professional.bio && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {professional.bio}
                      </p>
                    )}

                    {professional.services.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">Service Charges</p>
                        <p className="font-semibold text-primary text-lg">
                          GHS {Math.min(...professional.services.map(s => Number(s.priceGhs))).toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground ml-1">starting</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {professional.services.length} service{professional.services.length > 1 ? 's' : ''} available
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
