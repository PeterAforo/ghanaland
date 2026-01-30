'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
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
import { FavoriteButton } from '@/components/ui/favorite-button';
import { ListingMap } from '@/components/ui/listing-map';
import { formatPrice, formatDate } from '@/lib/utils';
import { Header } from '@/components/layout/header';

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
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Buyer state
  const [selectedPlots, setSelectedPlots] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'ONE_TIME' | 'INSTALLMENT'>('ONE_TIME');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

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

  // Handle purchase initiation
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/listings/${id}`);
      return;
    }

    if (!listing || !buyerCalculation) return;

    // Check if user is trying to buy their own listing
    if (listing.seller?.id === user?.id) {
      setPurchaseError("You cannot purchase your own listing");
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Step 1: Create transaction via escrow
      const transactionRes = await fetch(`${API_BASE_URL}/api/v1/escrow/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          plotCount: selectedPlots,
          paymentType: paymentType,
          installmentPackageId: paymentType === 'INSTALLMENT' ? selectedPackageId : undefined,
        }),
      });

      const transactionResult = await transactionRes.json();
      
      if (!transactionResult.success) {
        throw new Error(transactionResult.error?.message || 'Failed to create transaction');
      }

      const transaction = transactionResult.data;

      // Step 2: Initiate payment via Hubtel
      const paymentRes = await fetch(`${API_BASE_URL}/api/v1/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          amount: buyerCalculation.initialPayment,
          paymentType: paymentType === 'ONE_TIME' ? 'FULL' : 'DEPOSIT',
          returnUrl: `${window.location.origin}/dashboard/transactions/${transaction.id}`,
        }),
      });

      const paymentResult = await paymentRes.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || 'Failed to initiate payment');
      }

      // Redirect to Hubtel checkout
      if (paymentResult.data?.checkoutUrl) {
        window.location.href = paymentResult.data.checkoutUrl;
      } else {
        // Fallback: redirect to transaction page
        router.push(`/dashboard/transactions/${transaction.id}`);
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setPurchaseError(err.message || 'Failed to process purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

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
      <Header />

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
              {listing.media && listing.media.length > 0 ? (
                <img
                  src={listing.media[0].url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MapPin className="h-16 w-16 text-primary/40" />
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {listing.media && listing.media.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.media.slice(0, 4).map((media, index) => (
                  <div
                    key={media.id}
                    className="aspect-square rounded-lg bg-muted overflow-hidden"
                  >
                    {media.type === 'VIDEO' ? (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

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
                  <FavoriteButton listingId={listing.id} size="lg" />
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                    {showShareMenu && (
                      <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setShowShareMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/?text=${encodeURIComponent(listing.title + ' - ' + window.location.href)}`, '_blank');
                            setShowShareMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
                        >
                          Share on WhatsApp
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(listing.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                            setShowShareMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
                        >
                          Share on Twitter
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                            setShowShareMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted"
                        >
                          Share on Facebook
                        </button>
                      </div>
                    )}
                  </div>
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

            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListingMap
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  title={listing.title}
                  address={`${listing.town ? listing.town + ', ' : ''}${listing.district}, ${listing.region}`}
                  className="h-[300px]"
                />
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing.town && `${listing.town}, `}
                    {listing.district}, {listing.region}
                  </p>
                  {listing.address && (
                    <p className="mt-1">{listing.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
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

                {/* Purchase Error */}
                {purchaseError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                    <p className="text-sm text-destructive">{purchaseError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={isPurchasing || listing.seller?.id === user?.id}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : listing.seller?.id === user?.id ? (
                      'This is your listing'
                    ) : !isAuthenticated ? (
                      'Login to Purchase'
                    ) : paymentType === 'ONE_TIME' ? (
                      `Buy Now - ${formatPrice(buyerCalculation?.initialPayment || 0)}`
                    ) : (
                      `Start Purchase - ${formatPrice(buyerCalculation?.initialPayment || 0)} deposit`
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push(`/auth/login?redirect=/listings/${id}`);
                        return;
                      }
                      setShowContactModal(true);
                    }}
                    disabled={listing.seller?.id === user?.id}
                  >
                    <Mail className="h-4 w-4 mr-2" />
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

      {/* Contact Seller Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowContactModal(false)} 
          />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold text-foreground mb-2">Contact Seller</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send a message to {listing.seller?.fullName} about this listing
            </p>

            {inquirySuccess ? (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium text-foreground">Message Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The seller will receive your inquiry via email and SMS
                </p>
                <Button 
                  variant="secondary" 
                  className="mt-4"
                  onClick={() => {
                    setShowContactModal(false);
                    setInquirySuccess(false);
                    setInquiryMessage('');
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!inquiryMessage.trim()) return;
                  
                  setIsSendingInquiry(true);
                  try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(`${API_BASE_URL}/api/v1/inquiries`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        listingId: listing.id,
                        message: inquiryMessage,
                      }),
                    });
                    
                    if (res.ok) {
                      setInquirySuccess(true);
                    } else {
                      // Show direct contact options as fallback
                      alert('Unable to send message through the platform. Please use the direct contact options below.');
                    }
                  } catch (error) {
                    alert('Unable to send message. Please use the direct contact options below.');
                  } finally {
                    setIsSendingInquiry(false);
                  }
                }}
              >
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Your Message
                  </label>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder={`Hi, I'm interested in "${listing.title}". I would like to know more about...`}
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowContactModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isSendingInquiry || !inquiryMessage.trim()}
                  >
                    {isSendingInquiry ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Direct contact options */}
            {listing.seller?.phone && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Or contact directly:</p>
                <div className="flex gap-2">
                  <a
                    href={`tel:${listing.seller.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${listing.seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on Ghana Lands.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
