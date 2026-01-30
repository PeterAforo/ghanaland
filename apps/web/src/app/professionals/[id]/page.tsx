'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  BadgeCheck, 
  Clock, 
  Phone, 
  Mail, 
  ArrowLeft,
  MessageSquare,
  Calendar,
  Route
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

const STAGE_LABELS: Record<string, string> = {
  LAND_SEARCH: 'Land Search',
  SURVEY: 'Survey & Site Plan',
  LEGAL_DOCUMENTATION: 'Legal Documentation',
  ARCHITECTURAL_DESIGN: 'Architectural Design',
  STRUCTURAL_ENGINEERING: 'Structural Engineering',
  BUILDING_PERMIT: 'Building Permit',
  CONSTRUCTION: 'Construction',
};

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceGhs: number;
  priceType: string;
  durationDays: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    fullName: string;
    avatarUrl: string | null;
  };
}

interface Professional {
  id: string;
  type: string;
  title: string;
  bio: string | null;
  yearsExperience: number | null;
  licenseNumber: string | null;
  licenseVerified: boolean;
  regions: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  hourlyRateGhs: number | null;
  fixedRateGhs: number | null;
  isAvailable: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  services: Service[];
  reviews: Review[];
}

export default function ProfessionalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Journey context from URL params
  const landId = searchParams.get('landId');
  const stage = searchParams.get('stage');

  useEffect(() => {
    if (params.id) {
      fetchProfessional();
    }
  }, [params.id]);

  const fetchProfessional = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setProfessional(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch professional:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestService = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/professionals/${params.id}`);
      return;
    }

    if (!requestDescription.trim()) {
      alert('Please describe what you need help with');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          professionalId: professional?.id,
          serviceId: selectedService?.id,
          description: requestDescription,
          landId: landId || undefined,
          journeyStage: stage || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Request sent successfully! The professional will respond soon.');
        setShowRequestModal(false);
        setRequestDescription('');
        setSelectedService(null);
        router.push('/dashboard/service-requests');
      } else {
        alert(data.error?.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 rounded-xl mb-6" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Professional not found</h1>
          <Link href="/professionals" className="text-primary hover:underline mt-4 block">
            Browse all professionals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Journey Context Banner */}
      {landId && stage && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Route className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  Hiring for: <span className="font-bold">{STAGE_LABELS[stage] || stage}</span>
                </p>
                <p className="text-xs text-primary/70">
                  When you request this professional, they will be linked to your land journey
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

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Link
          href={landId && stage ? `/professionals?type=${professional.type}&landId=${landId}&stage=${stage}` : '/professionals'}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to professionals
        </Link>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl flex-shrink-0">
                {getTypeIcon(professional.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">
                    {professional.user.fullName}
                  </h1>
                  {professional.licenseVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  {!professional.isAvailable && (
                    <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                      Currently Unavailable
                    </span>
                  )}
                </div>
                <p className="text-lg text-muted-foreground mt-1">{professional.title}</p>

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{Number(professional.rating).toFixed(1)}</span>
                    <span className="text-muted-foreground">({professional.reviewCount} reviews)</span>
                  </div>
                  {professional.yearsExperience && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {professional.yearsExperience}+ years experience
                    </div>
                  )}
                </div>

                {professional.regions.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {professional.regions.join(', ')}
                  </div>
                )}

                {professional.bio && (
                  <p className="mt-4 text-foreground">{professional.bio}</p>
                )}

                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => setShowRequestModal(true)}
                    disabled={!professional.isAvailable}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Service
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        {professional.services.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professional.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-foreground">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                      {service.durationDays && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Estimated: {service.durationDays} days
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        GHS {Number(service.priceGhs).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{service.priceType}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSelectedService(service);
                          setShowRequestModal(true);
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({professional.reviewCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {professional.reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {professional.reviews.map((review) => (
                  <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {review.reviewer.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{review.reviewer.fullName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-foreground ml-13">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Request Service</h2>
            
            {selectedService && (
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-sm text-primary">GHS {Number(selectedService.priceGhs).toLocaleString()}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Describe what you need help with
              </label>
              <textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="E.g., I need a land survey for a 2-acre property in Tema..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedService(null);
                  setRequestDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleRequestService}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
