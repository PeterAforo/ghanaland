'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Shield,
  Phone,
  Mail,
  Calendar,
  Ruler,
  Building2,
  FileText,
  Share2,
  Heart,
  Loader2,
  Calculator,
  Minus,
  Plus,
  Check,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { formatPrice, formatDate } from '@/lib/utils';

interface InstallmentPackage {
  id: string;
  durationMonths: number;
  interestRate: number;
  initialDepositPercent: number;
}

interface ListingDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  landType: string;
  tenureType: string;
  leasePeriodYears?: number;
  sizeAcres: string;
  priceGhs: string;
  pricePerPlot?: number;
  totalPlots?: number;
  availablePlots?: number;
  plotLength?: number;
  plotWidth?: number;
  plotDimensionUnit?: string;
  region: string;
  district: string;
  constituency?: string;
  town?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: string;
  verifiedAt?: string;
  viewCount: number;
  createdAt: string;
  allowOneTimePayment?: boolean;
  allowInstallments?: boolean;
  installmentPackages?: InstallmentPackage[];
  landAccessPercentage?: number;
  sitePlanAccessPercentage?: number;
  documentTransferPercentage?: number;
  media: Array<{ id: string; url: string; type: string }>;
  seller?: {
    id: string;
    fullName: string;
    phone?: string;
  };
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Buyer state
  const [selectedPlots, setSelectedPlots] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'ONE_TIME' | 'INSTALLMENT'>('ONE_TIME');

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/listings/${id}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message);
      return result.data as ListingDetail;
    },
  });

  // Calculate buyer payment based on selections
  const buyerCalculation = useMemo(() => {
    if (!listing) return null;
    
    const pricePerPlot = listing.pricePerPlot || parseFloat(listing.priceGhs);
    const baseCost = pricePerPlot * selectedPlots;
    
    if (paymentType === 'ONE_TIME') {
      return {
        type: 'ONE_TIME' as const,
        totalCost: baseCost,
        initialPayment: baseCost,
        monthlyPayment: 0,
        durationMonths: 0,
        interestRate: 0,
        totalWithInterest: baseCost,
      };
    }
    
    // Installment calculation
    const pkg = listing.installmentPackages?.find(p => p.id === selectedPackageId);
    if (!pkg) {
      // Default to first package if none selected
      const defaultPkg = listing.installmentPackages?.[0];
      if (!defaultPkg) return null;
      
      const interestAmount = (baseCost * defaultPkg.interestRate) / 100;
      const totalWithInterest = baseCost + interestAmount;
      const initialDeposit = (baseCost * defaultPkg.initialDepositPercent) / 100;
      const remainingBalance = totalWithInterest - initialDeposit;
      const monthlyPayment = remainingBalance / defaultPkg.durationMonths;
      
      return {
        type: 'INSTALLMENT' as const,
        totalCost: baseCost,
        initialPayment: initialDeposit,
        monthlyPayment,
        durationMonths: defaultPkg.durationMonths,
        interestRate: defaultPkg.interestRate,
        totalWithInterest,
        packageId: defaultPkg.id,
      };
    }
    
    const interestAmount = (baseCost * pkg.interestRate) / 100;
    const totalWithInterest = baseCost + interestAmount;
    const initialDeposit = (baseCost * pkg.initialDepositPercent) / 100;
    const remainingBalance = totalWithInterest - initialDeposit;
    const monthlyPayment = remainingBalance / pkg.durationMonths;
    
    return {
      type: 'INSTALLMENT' as const,
      totalCost: baseCost,
      initialPayment: initialDeposit,
      monthlyPayment,
      durationMonths: pkg.durationMonths,
      interestRate: pkg.interestRate,
      totalWithInterest,
      packageId: pkg.id,
    };
  }, [listing, selectedPlots, paymentType, selectedPackageId]);

  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={<MapPin className="h-6 w-6" />}
          title="Listing not found"
          description="This listing may have been removed or doesn't exist"
          action={
            <Link href="/listings">
              <Button variant="primary">Browse Listings</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isVerified = listing.verificationStatus === 'VERIFIED';
  const availablePlots = listing.availablePlots || listing.totalPlots || 1;
  const pricePerPlot = listing.pricePerPlot || parseFloat(listing.priceGhs);
  
  const incrementPlots = () => {
    if (selectedPlots < availablePlots) {
      setSelectedPlots(selectedPlots + 1);
    }
  };
  
  const decrementPlots = () => {
    if (selectedPlots > 1) {
      setSelectedPlots(selectedPlots - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Ghana Lands
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/listings" className="text-sm text-muted-foreground hover:text-foreground">
              Listings
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Back Link */}
        <Link
          href="/listings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to listings
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="aspect-[16/9] rounded-2xl bg-muted overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-primary/40" />
              </div>
            </div>

            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {listing.town && `${listing.town}, `}
                    {listing.district}, {listing.region}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {isVerified && (
                  <Badge variant="verified">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Land
                  </Badge>
                )}
                <Badge variant="neutral" className="capitalize">
                  {listing.category.toLowerCase()}
                </Badge>
                <Badge variant="neutral" className="capitalize">
                  {listing.landType.toLowerCase().replace('_', ' ')}
                </Badge>
                <Badge variant="neutral" className="capitalize">
                  {listing.tenureType.toLowerCase()}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={<Ruler className="h-4 w-4" />}
                    label="Size"
                    value={`${listing.sizeAcres} acres`}
                  />
                  <DetailItem
                    icon={<Building2 className="h-4 w-4" />}
                    label="Category"
                    value={listing.category.toLowerCase()}
                  />
                  <DetailItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Land Type"
                    value={listing.landType.toLowerCase().replace('_', ' ')}
                  />
                  <DetailItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Tenure"
                    value={listing.tenureType.toLowerCase()}
                  />
                  {listing.leasePeriodYears && (
                    <DetailItem
                      icon={<Calendar className="h-4 w-4" />}
                      label="Lease Period"
                      value={`${listing.leasePeriodYears} years`}
                    />
                  )}
                  <DetailItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Listed"
                    value={formatDate(listing.createdAt)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            {isVerified && listing.verifiedAt && (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Verified Land</p>
                      <p className="text-sm text-muted-foreground">
                        Verification status is logged and auditable. Verified on{' '}
                        {formatDate(listing.verifiedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Buyer Calculator */}
          <div className="space-y-4">
            {/* Price & Plot Selection Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Price per plot */}
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Price per plot</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(pricePerPlot)}
                  </p>
                  {listing.plotLength && listing.plotWidth && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {listing.plotLength} × {listing.plotWidth} {listing.plotDimensionUnit?.toLowerCase()}
                    </p>
                  )}
                </div>

                {/* Available plots */}
                <div className="text-center mb-6 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{availablePlots.toLocaleString()}</span> plots available
                  </p>
                </div>

                {/* Plot quantity selector */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    How many plots do you want?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={decrementPlots}
                      disabled={selectedPlots <= 1}
                      className="h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <Input
                      type="number"
                      min={1}
                      max={availablePlots}
                      value={selectedPlots}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setSelectedPlots(Math.min(Math.max(1, val), availablePlots));
                      }}
                      className="text-center font-medium"
                    />
                    <button
                      type="button"
                      onClick={incrementPlots}
                      disabled={selectedPlots >= availablePlots}
                      className="h-10 w-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Payment type selection */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {listing.allowOneTimePayment !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentType('ONE_TIME')}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          paymentType === 'ONE_TIME'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-medium">Full Payment</p>
                      </button>
                    )}
                    {listing.allowInstallments !== false && listing.installmentPackages && listing.installmentPackages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentType('INSTALLMENT');
                          if (!selectedPackageId && listing.installmentPackages?.[0]) {
                            setSelectedPackageId(listing.installmentPackages[0].id);
                          }
                        }}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          paymentType === 'INSTALLMENT'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-medium">Installments</p>
                      </button>
                    )}
                  </div>
                </div>

                {/* Installment package selection */}
                {paymentType === 'INSTALLMENT' && listing.installmentPackages && listing.installmentPackages.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Choose Payment Plan
                    </label>
                    <div className="space-y-2">
                      {listing.installmentPackages.map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                            selectedPackageId === pkg.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{pkg.durationMonths} months</p>
                              <p className="text-xs text-muted-foreground">
                                {pkg.interestRate}% interest • {pkg.initialDepositPercent}% deposit
                              </p>
                            </div>
                            {selectedPackageId === pkg.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment calculation summary */}
                {buyerCalculation && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                    <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Your Payment Summary
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plots:</span>
                        <span className="font-medium">{selectedPlots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base cost:</span>
                        <span className="font-medium">{formatPrice(buyerCalculation.totalCost)}</span>
                      </div>
                      {buyerCalculation.type === 'INSTALLMENT' && buyerCalculation.interestRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interest ({buyerCalculation.interestRate}%):</span>
                          <span className="font-medium">{formatPrice(buyerCalculation.totalWithInterest - buyerCalculation.totalCost)}</span>
                        </div>
                      )}
                      <div className="border-t border-primary/20 pt-2 mt-2">
                        <div className="flex justify-between text-primary">
                          <span className="font-medium">
                            {buyerCalculation.type === 'ONE_TIME' ? 'Total to pay:' : 'Initial deposit:'}
                          </span>
                          <span className="font-bold">{formatPrice(buyerCalculation.initialPayment)}</span>
                        </div>
                        {buyerCalculation.type === 'INSTALLMENT' && (
                          <>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">Monthly payment:</span>
                              <span className="font-bold text-primary">
                                {formatPrice(buyerCalculation.monthlyPayment)}
                              </span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-medium">{buyerCalculation.durationMonths} months</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">Total amount:</span>
                              <span className="font-medium">{formatPrice(buyerCalculation.totalWithInterest)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditions info */}
                {(listing.landAccessPercentage || listing.sitePlanAccessPercentage || listing.documentTransferPercentage) && (
                  <div className="p-3 rounded-lg bg-muted/50 mb-6">
                    <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Payment Milestones
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {listing.landAccessPercentage && (
                        <p>• Land access at {listing.landAccessPercentage}% payment</p>
                      )}
                      {listing.sitePlanAccessPercentage && (
                        <p>• Site plan at {listing.sitePlanAccessPercentage}% payment</p>
                      )}
                      {listing.documentTransferPercentage && (
                        <p>• Documents at {listing.documentTransferPercentage}% payment</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button variant="primary" className="w-full">
                    {paymentType === 'ONE_TIME' 
                      ? `Buy Now - ${formatPrice(buyerCalculation?.initialPayment || 0)}`
                      : `Start Purchase - ${formatPrice(buyerCalculation?.initialPayment || 0)} deposit`
                    }
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Contact Seller
                  </Button>
                </div>

                {/* Seller Info */}
                {listing.seller && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Seller</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {listing.seller.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{listing.seller.fullName}</p>
                        {listing.seller.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {listing.seller.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Trust Copy */}
                <p className="mt-6 text-xs text-muted-foreground text-center">
                  Secure payment via Hubtel escrow
                </p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  {listing.viewCount} views
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}

function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-[16/9] rounded-2xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
