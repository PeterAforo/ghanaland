'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Archive,
  MapPin,
  Ruler,
  DollarSign,
  Calendar,
  Eye,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';

interface InstallmentPackage {
  id: string;
  durationMonths: number;
  interestRate: number;
  initialDepositPercent: number;
}

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  landType: string;
  tenureType: string;
  leasePeriodYears?: number;
  region: string;
  district: string;
  constituency?: string;
  town?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  sizeAcres: string;
  priceGhs: string;
  plotLength?: number;
  plotWidth?: number;
  plotDimensionUnit?: string;
  totalPlots?: number;
  availablePlots?: number;
  pricePerPlot?: string;
  allowOneTimePayment?: boolean;
  allowInstallments?: boolean;
  installmentPackages?: InstallmentPackage[];
  landAccessPercentage?: number;
  sitePlanAccessPercentage?: number;
  documentTransferPercentage?: number;
  listingStatus: string;
  verificationStatus: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  media: Array<{ id: string; url: string; type: string }>;
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    RESIDENTIAL: 'Residential',
    COMMERCIAL: 'Commercial',
    INDUSTRIAL: 'Industrial',
    AGRICULTURAL: 'Agricultural',
    MIXED_USE: 'Mixed Use',
  };
  return map[category] || category;
}

function formatLandType(type: string): string {
  const map: Record<string, string> = {
    CUSTOMARY: 'Customary',
    TITLED: 'Titled',
    LEASEHOLD: 'Leasehold',
    FREEHOLD: 'Freehold',
    GOVERNMENT: 'Government',
  };
  return map[type] || type;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: string; icon: any; label: string }> = {
    DRAFT: { variant: 'secondary', icon: Clock, label: 'Draft' },
    PUBLISHED: { variant: 'success', icon: Globe, label: 'Published' },
    SUBMITTED: { variant: 'pending', icon: Clock, label: 'Pending Review' },
    ARCHIVED: { variant: 'neutral', icon: Archive, label: 'Archived' },
  };
  const { variant, icon: Icon, label } = config[status] || config.DRAFT;
  return (
    <Badge variant={variant as any} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function VerificationBadge({ status }: { status: string }) {
  if (status === 'VERIFIED') {
    return (
      <Badge variant="verified" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Verified
      </Badge>
    );
  }
  return (
    <Badge variant="pending" className="flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      Unverified
    </Badge>
  );
}

export default function DashboardListingViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && id) {
      fetchListing();
    }
  }, [authLoading, isAuthenticated, id]);

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/listings/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError('Listing not found');
          return;
        }
        throw new Error('Failed to fetch listing');
      }

      const result = await res.json();
      if (result.success) {
        setListing(result.data);
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      PUBLISHED: 'publish',
      DRAFT: 'unpublish',
      ARCHIVED: 'archive',
    };

    if (!confirm(`Are you sure you want to ${statusLabels[newStatus]} this listing?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/listings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      const result = await res.json();
      if (result.success) {
        setListing({ ...listing!, listingStatus: newStatus });
        setSuccessMessage(`Listing ${statusLabels[newStatus]}ed successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update listing status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/listings/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete listing');

      router.push('/dashboard/listings');
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing');
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/listings/${id}`;
    navigator.clipboard.writeText(url);
    setSuccessMessage('Link copied to clipboard!');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error || 'Listing not found'}</p>
              <Link href="/dashboard/listings">
                <Button variant="primary">Back to Listings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const plotSize = listing.plotLength && listing.plotWidth
    ? `${listing.plotLength} x ${listing.plotWidth} ${listing.plotDimensionUnit?.toLowerCase() || 'ft'}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/listings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Listing Details</h1>
              <p className="text-sm text-muted-foreground">Manage your listing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/listings/${id}`} target="_blank">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Public
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Link
            </Button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Status & Actions Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={listing.listingStatus} />
                <VerificationBadge status={listing.verificationStatus} />
              </div>
              <div className="flex items-center gap-2">
                {listing.listingStatus === 'DRAFT' && (
                  <Button variant="primary" size="sm" onClick={() => handleStatusChange('PUBLISHED')}>
                    <Globe className="h-4 w-4 mr-1" />
                    Publish
                  </Button>
                )}
                {listing.listingStatus === 'PUBLISHED' && (
                  <Button variant="secondary" size="sm" onClick={() => handleStatusChange('DRAFT')}>
                    <Archive className="h-4 w-4 mr-1" />
                    Unpublish
                  </Button>
                )}
                <Link href={`/dashboard/listings/${id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{listing.viewCount}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{listing.availablePlots || listing.totalPlots || '-'}</p>
              <p className="text-xs text-muted-foreground">Available Plots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{listing.pricePerPlot ? formatPrice(parseFloat(listing.pricePerPlot)) : '-'}</p>
              <p className="text-xs text-muted-foreground">Per Plot</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-medium">{formatDate(listing.createdAt)}</p>
              <p className="text-xs text-muted-foreground">Created</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{listing.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.description && (
              <p className="text-muted-foreground">{listing.description}</p>
            )}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{formatCategory(listing.category)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Land Type</p>
                <p className="font-medium">{formatLandType(listing.landType)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenure</p>
                <p className="font-medium">{formatLandType(listing.tenureType)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="font-medium">{listing.region}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">District</p>
                <p className="font-medium">{listing.district}</p>
              </div>
              {listing.constituency && (
                <div>
                  <p className="text-xs text-muted-foreground">Constituency</p>
                  <p className="font-medium">{listing.constituency}</p>
                </div>
              )}
              {listing.town && (
                <div>
                  <p className="text-xs text-muted-foreground">Town/Area</p>
                  <p className="font-medium">{listing.town}</p>
                </div>
              )}
              {listing.address && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{listing.address}</p>
                </div>
              )}
              {listing.latitude && listing.longitude && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">GPS Coordinates</p>
                  <p className="font-medium">{listing.latitude}, {listing.longitude}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plot Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Plot Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {plotSize && (
                <div>
                  <p className="text-xs text-muted-foreground">Plot Size</p>
                  <p className="font-medium">{plotSize}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Total Plots</p>
                <p className="font-medium">{listing.totalPlots || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Plots</p>
                <p className="font-medium">{listing.availablePlots || listing.totalPlots || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Land Size</p>
                <p className="font-medium">{listing.sizeAcres} acres</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        {listing.media && listing.media.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Media ({listing.media.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {listing.media.map((media) => (
                  <div
                    key={media.id}
                    className="aspect-square rounded-lg bg-muted overflow-hidden"
                  >
                    {media.type === 'VIDEO' ? (
                      <video
                        src={media.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt="Listing media"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Price Per Plot</p>
                <p className="text-xl font-bold text-primary">
                  {listing.pricePerPlot ? formatPrice(parseFloat(listing.pricePerPlot)) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">{formatPrice(parseFloat(listing.priceGhs))}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Payment Options</p>
              <div className="flex gap-2">
                {listing.allowOneTimePayment && (
                  <Badge variant="neutral">One-Time Payment</Badge>
                )}
                {listing.allowInstallments && (
                  <Badge variant="neutral">Installments</Badge>
                )}
              </div>
            </div>

            {listing.allowInstallments && listing.installmentPackages && listing.installmentPackages.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">Installment Packages</p>
                <div className="space-y-2">
                  {listing.installmentPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">{pkg.durationMonths} months</span>
                      <span className="text-sm text-muted-foreground">
                        {pkg.initialDepositPercent}% deposit • {pkg.interestRate}% interest
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(listing.landAccessPercentage || listing.sitePlanAccessPercentage || listing.documentTransferPercentage) && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">Payment Milestones</p>
                <div className="grid grid-cols-3 gap-4">
                  {listing.landAccessPercentage && (
                    <div>
                      <p className="text-xs text-muted-foreground">Land Access</p>
                      <p className="font-medium">{listing.landAccessPercentage}%</p>
                    </div>
                  )}
                  {listing.sitePlanAccessPercentage && (
                    <div>
                      <p className="text-xs text-muted-foreground">Site Plan</p>
                      <p className="font-medium">{listing.sitePlanAccessPercentage}%</p>
                    </div>
                  )}
                  {listing.documentTransferPercentage && (
                    <div>
                      <p className="text-xs text-muted-foreground">Document Transfer</p>
                      <p className="font-medium">{listing.documentTransferPercentage}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
