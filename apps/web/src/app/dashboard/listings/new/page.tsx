'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
  DollarSign,
  FileText,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Calculator,
  Info,
  Trash2,
  Navigation,
  Plus,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import {
  GHANA_REGIONS,
  getConstituenciesByRegion,
  getDistrictsByConstituency,
} from '@ghana-lands/shared';

const STEPS = [
  { id: 'basics', title: 'Listing Basics', description: 'Title & category' },
  { id: 'location', title: 'Location', description: 'Region, GPS coordinates' },
  { id: 'sizing', title: 'Land Size', description: 'Plots with dimensions' },
  { id: 'pricing', title: 'Pricing', description: 'Price per plot' },
  { id: 'payment', title: 'Payment Plans', description: 'Installment packages' },
  { id: 'conditions', title: 'Conditions', description: 'Access & document transfer' },
  { id: 'media', title: 'Media', description: 'Photos & video' },
  { id: 'review', title: 'Review', description: 'Confirm & publish' },
];

const CATEGORIES = [
  { value: 'RESIDENTIAL', label: 'Residential', description: 'For homes and housing' },
  { value: 'COMMERCIAL', label: 'Commercial', description: 'For business use' },
  { value: 'INDUSTRIAL', label: 'Industrial', description: 'For manufacturing' },
  { value: 'AGRICULTURAL', label: 'Agricultural', description: 'For farming' },
  { value: 'MIXED_USE', label: 'Mixed Use', description: 'Multiple purposes' },
];

const LAND_TYPES = [
  { value: 'CUSTOMARY', label: 'Customary' },
  { value: 'TITLED', label: 'Titled' },
  { value: 'LEASEHOLD', label: 'Leasehold' },
  { value: 'FREEHOLD', label: 'Freehold' },
  { value: 'GOVERNMENT', label: 'Government' },
];

const TENURE_TYPES = [
  { value: 'FREEHOLD', label: 'Freehold' },
  { value: 'LEASEHOLD', label: 'Leasehold' },
  { value: 'CUSTOMARY', label: 'Customary' },
];

interface InstallmentPackage {
  id: string;
  durationMonths: number;
  interestRate: number;
  initialDepositPercent: number;
}

const installmentPackageSchema = z.object({
  id: z.string(),
  durationMonths: z.number().int().positive(),
  interestRate: z.number().min(0).max(100),
  initialDepositPercent: z.number().min(0).max(100),
});

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(5000).optional(),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE']),
  landType: z.enum(['CUSTOMARY', 'TITLED', 'LEASEHOLD', 'FREEHOLD', 'GOVERNMENT']),
  tenureType: z.enum(['FREEHOLD', 'LEASEHOLD', 'CUSTOMARY']),
  leasePeriodYears: z.number().int().positive().optional(),
  
  // Location
  region: z.string().min(1, 'Region is required'),
  constituency: z.string().min(1, 'Constituency is required'),
  district: z.string().min(1, 'District is required'),
  town: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Sizing - Per Plot
  plotLength: z.number().positive('Length is required'),
  plotWidth: z.number().positive('Width is required'),
  plotDimensionUnit: z.enum(['FEET', 'METERS']),
  totalPlots: z.number().int().positive('Number of plots is required'),
  
  // Pricing - Per Plot
  pricePerPlot: z.number().positive('Price per plot is required'),
  
  // Payment Options
  allowOneTimePayment: z.boolean(),
  allowInstallments: z.boolean(),
  
  // Conditions
  landAccessPercentage: z.number().min(0).max(100).optional(),
  sitePlanAccessPercentage: z.number().min(0).max(100).optional(),
  documentTransferPercentage: z.number().min(0).max(100).optional(),
});

type ListingForm = z.infer<typeof listingSchema>;

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  size: number;
}

export default function NewListingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // GPS state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Installment packages
  const [installmentPackages, setInstallmentPackages] = useState<InstallmentPackage[]>([
    { id: '1', durationMonths: 6, interestRate: 0, initialDepositPercent: 20 },
    { id: '2', durationMonths: 12, interestRate: 5, initialDepositPercent: 15 },
    { id: '3', durationMonths: 24, interestRate: 10, initialDepositPercent: 10 },
  ]);
  
  // Media uploads
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [video, setVideo] = useState<UploadedFile | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      category: 'RESIDENTIAL',
      landType: 'TITLED',
      tenureType: 'FREEHOLD',
      plotDimensionUnit: 'FEET',
      allowOneTimePayment: true,
      allowInstallments: true,
      landAccessPercentage: 30,
      sitePlanAccessPercentage: 50,
      documentTransferPercentage: 100,
    },
  });

  const formValues = watch();

  // Cascading location dropdowns
  const constituencies = useMemo(() => {
    if (!formValues.region) return [];
    return getConstituenciesByRegion(formValues.region);
  }, [formValues.region]);

  const districts = useMemo(() => {
    if (!formValues.region || !formValues.constituency) return [];
    return getDistrictsByConstituency(formValues.region, formValues.constituency);
  }, [formValues.region, formValues.constituency]);

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (formValues.region) {
      setValue('constituency', '');
      setValue('district', '');
    }
  }, [formValues.region, setValue]);

  useEffect(() => {
    if (formValues.constituency) {
      setValue('district', '');
    }
  }, [formValues.constituency, setValue]);

  // Seller financial calculations
  const sellerFinancials = useMemo(() => {
    const pricePerPlot = formValues.pricePerPlot || 0;
    const totalPlots = formValues.totalPlots || 0;
    const totalRevenue = pricePerPlot * totalPlots;
    
    // Calculate for each installment package
    const packageFinancials = installmentPackages.map(pkg => {
      const interestAmount = (pricePerPlot * pkg.interestRate) / 100;
      const priceWithInterest = pricePerPlot + interestAmount;
      const initialDeposit = (pricePerPlot * pkg.initialDepositPercent) / 100;
      const remainingAfterDeposit = priceWithInterest - initialDeposit;
      const monthlyPayment = remainingAfterDeposit / pkg.durationMonths;
      
      return {
        ...pkg,
        priceWithInterest,
        initialDeposit,
        monthlyPayment,
        totalPerPlot: priceWithInterest,
        totalAllPlots: priceWithInterest * totalPlots,
        totalInitialAllPlots: initialDeposit * totalPlots,
        monthlyAllPlots: monthlyPayment * totalPlots,
      };
    });
    
    return {
      pricePerPlot,
      totalPlots,
      totalRevenue,
      packageFinancials,
    };
  }, [formValues.pricePerPlot, formValues.totalPlots, installmentPackages]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsGettingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(
          error.code === 1 ? 'Location permission denied' :
          error.code === 2 ? 'Location unavailable' :
          'Location request timed out'
        );
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Installment package management
  const addInstallmentPackage = () => {
    const newPackage: InstallmentPackage = {
      id: Date.now().toString(),
      durationMonths: 12,
      interestRate: 0,
      initialDepositPercent: 20,
    };
    setInstallmentPackages([...installmentPackages, newPackage]);
  };

  const updateInstallmentPackage = (id: string, field: keyof InstallmentPackage, value: number) => {
    setInstallmentPackages(packages =>
      packages.map(pkg =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    );
  };

  const removeInstallmentPackage = (id: string) => {
    if (installmentPackages.length > 1) {
      setInstallmentPackages(packages => packages.filter(pkg => pkg.id !== id));
    }
  };

  const validateStep = async () => {
    switch (currentStep) {
      case 0:
        return await trigger(['title', 'description', 'category', 'landType', 'tenureType']);
      case 1:
        return await trigger(['region', 'constituency', 'district', 'town', 'address']);
      case 2:
        return await trigger(['plotLength', 'plotWidth', 'plotDimensionUnit', 'totalPlots']);
      case 3:
        return await trigger(['pricePerPlot']);
      case 4:
        return await trigger(['allowOneTimePayment', 'allowInstallments']);
      case 5:
        return await trigger(['landAccessPercentage', 'sitePlanAccessPercentage', 'documentTransferPercentage']);
      case 6:
        return true; // Media step
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const newImage: UploadedFile = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'image',
        url: URL.createObjectURL(file),
        size: file.size,
      };
      setImages((prev) => [...prev, newImage]);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const newVideo: UploadedFile = {
      id: `vid_${Date.now()}`,
      name: file.name,
      type: 'video',
      url: URL.createObjectURL(file),
      size: file.size,
    };
    setVideo(newVideo);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const onSubmit = async (data: ListingForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        ...data,
        installmentPackages,
        images: images.map(img => img.url),
        videoUrl: video?.url,
      };
      
      const res = await fetch('/api/v1/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to create listing');
        return;
      }

      router.push(`/dashboard/listings?created=${result.data.id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard/listings"
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Create New Listing</h1>
            <p className="text-sm text-muted-foreground">List your land for sale</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Stepper */}
        <Stepper steps={STEPS} currentStep={currentStep} className="mb-8" />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Provide basic information about your land'}
              {currentStep === 1 && 'Where is your land located? Include GPS coordinates'}
              {currentStep === 2 && 'Specify plot dimensions and quantity'}
              {currentStep === 3 && 'Set your price per plot'}
              {currentStep === 4 && 'Configure payment plans and installment options'}
              {currentStep === 5 && 'Define conditions for buyers'}
              {currentStep === 6 && 'Upload photos and video of your land'}
              {currentStep === 7 && 'Review your listing before publishing'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Basics */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Title</label>
                    <Input
                      {...register('title')}
                      placeholder="e.g., 1500 Plots of Prime Land in East Legon"
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      placeholder="Describe your land, its features, and surroundings..."
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setValue('category', cat.value as any)}
                          className={`p-3 rounded-xl border-2 text-left transition-colors ${
                            formValues.category === cat.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium text-foreground">{cat.label}</p>
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Land Type</label>
                      <select
                        {...register('landType')}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {LAND_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Tenure Type</label>
                      <select
                        {...register('tenureType')}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {TENURE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location with GPS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Region</label>
                    <select
                      {...register('region')}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select region</option>
                      {GHANA_REGIONS.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {errors.region && (
                      <p className="text-xs text-destructive">{errors.region.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Constituency</label>
                      <select
                        {...register('constituency')}
                        disabled={!formValues.region}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <option value="">Select constituency</option>
                        {constituencies.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.constituency && (
                        <p className="text-xs text-destructive">{errors.constituency.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">District</label>
                      <select
                        {...register('district')}
                        disabled={!formValues.constituency}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <option value="">Select district</option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      {errors.district && (
                        <p className="text-xs text-destructive">{errors.district.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Town/Area <span className="text-muted-foreground">(optional)</span>
                      </label>
                      <Input {...register('town')} placeholder="e.g., Community 25" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Address/Landmark <span className="text-muted-foreground">(optional)</span>
                      </label>
                      <Input {...register('address')} placeholder="e.g., Near Tema Motorway" />
                    </div>
                  </div>

                  {/* GPS Coordinates */}
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">GPS Coordinates</p>
                        <p className="text-xs text-muted-foreground">Get your current location or enter manually</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                      >
                        {isGettingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Navigation className="h-4 w-4 mr-2" />
                        )}
                        Get Current Location
                      </Button>
                    </div>

                    {locationError && (
                      <p className="text-xs text-destructive mb-3">{locationError}</p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Latitude</label>
                        <Input
                          {...register('latitude', { valueAsNumber: true })}
                          type="number"
                          step="any"
                          placeholder="e.g., 5.6037"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Longitude</label>
                        <Input
                          {...register('longitude', { valueAsNumber: true })}
                          type="number"
                          step="any"
                          placeholder="e.g., -0.1870"
                        />
                      </div>
                    </div>

                    {formValues.latitude && formValues.longitude && (
                      <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs text-primary flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location set: {formValues.latitude.toFixed(6)}, {formValues.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Land Size - Per Plot */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Plot Dimensions</p>
                    <p className="text-xs text-muted-foreground mb-4">Define the size of each individual plot</p>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Length</label>
                        <Input
                          {...register('plotLength', { valueAsNumber: true })}
                          type="number"
                          placeholder="e.g., 100"
                        />
                        {errors.plotLength && (
                          <p className="text-xs text-destructive">{errors.plotLength.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Width</label>
                        <Input
                          {...register('plotWidth', { valueAsNumber: true })}
                          type="number"
                          placeholder="e.g., 70"
                        />
                        {errors.plotWidth && (
                          <p className="text-xs text-destructive">{errors.plotWidth.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Unit</label>
                        <select
                          {...register('plotDimensionUnit')}
                          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          <option value="FEET">Feet</option>
                          <option value="METERS">Meters</option>
                        </select>
                      </div>
                    </div>

                    {formValues.plotLength && formValues.plotWidth && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Each plot: <span className="font-medium text-foreground">{formValues.plotLength} × {formValues.plotWidth} {formValues.plotDimensionUnit?.toLowerCase()}</span>
                        {' '}= <span className="font-medium text-foreground">{(formValues.plotLength * formValues.plotWidth).toLocaleString()} sq {formValues.plotDimensionUnit?.toLowerCase()}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Total Number of Plots Available</label>
                    <Input
                      {...register('totalPlots', { valueAsNumber: true })}
                      type="number"
                      placeholder="e.g., 1500"
                    />
                    {errors.totalPlots && (
                      <p className="text-xs text-destructive">{errors.totalPlots.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      How many plots are you selling in total?
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Pricing - Per Plot */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Price Per Plot (GHS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">GHS</span>
                      <Input
                        {...register('pricePerPlot', { valueAsNumber: true })}
                        type="number"
                        placeholder="e.g., 40000"
                        className="pl-12"
                      />
                    </div>
                    {errors.pricePerPlot && (
                      <p className="text-xs text-destructive">{errors.pricePerPlot.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This is the base price for one plot (before any interest)
                    </p>
                  </div>

                  {formValues.pricePerPlot && formValues.totalPlots && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-foreground mb-3">Seller Financial Summary</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price per plot:</span>
                          <span className="font-medium">GHS {formValues.pricePerPlot.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total plots:</span>
                          <span className="font-medium">{formValues.totalPlots.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-primary/20 pt-2 mt-2">
                          <div className="flex justify-between text-primary">
                            <span className="font-medium">Total Expected Revenue:</span>
                            <span className="font-bold">GHS {(formValues.pricePerPlot * formValues.totalPlots).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Payment Plans with Installment Packages */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        {...register('allowOneTimePayment')}
                        id="allowOneTimePayment"
                        className="h-4 w-4 rounded border-input"
                      />
                      <label htmlFor="allowOneTimePayment" className="text-sm font-medium text-foreground">
                        Allow One-Time Payment
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      Buyers can pay the full amount upfront (GHS {formValues.pricePerPlot?.toLocaleString() || 0} per plot)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        {...register('allowInstallments')}
                        id="allowInstallments"
                        className="h-4 w-4 rounded border-input"
                      />
                      <label htmlFor="allowInstallments" className="text-sm font-medium text-foreground">
                        Allow Installment Payments
                      </label>
                    </div>
                  </div>

                  {formValues.allowInstallments && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Installment Packages</p>
                          <p className="text-xs text-muted-foreground">Create different payment plans with varying durations and interest rates</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={addInstallmentPackage}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Package
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {installmentPackages.map((pkg, index) => (
                          <div key={pkg.id} className="p-4 rounded-lg bg-background border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-medium text-foreground">Package {index + 1}</p>
                              {installmentPackages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeInstallmentPackage(pkg.id)}
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Duration (months)</label>
                                <Input
                                  type="number"
                                  value={pkg.durationMonths}
                                  onChange={(e) => updateInstallmentPackage(pkg.id, 'durationMonths', parseInt(e.target.value) || 0)}
                                  placeholder="e.g., 12"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Interest Rate (%)</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={pkg.interestRate}
                                    onChange={(e) => updateInstallmentPackage(pkg.id, 'interestRate', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 5"
                                    className="pr-8"
                                  />
                                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Initial Deposit (%)</label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="1"
                                    value={pkg.initialDepositPercent}
                                    onChange={(e) => updateInstallmentPackage(pkg.id, 'initialDepositPercent', parseFloat(e.target.value) || 0)}
                                    placeholder="e.g., 20"
                                    className="pr-8"
                                  />
                                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </div>

                            {/* Package calculation preview */}
                            {formValues.pricePerPlot && (
                              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs">
                                <p className="font-medium text-foreground mb-2">Per Plot Breakdown:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground">Base price:</span>
                                  <span>GHS {formValues.pricePerPlot.toLocaleString()}</span>
                                  
                                  <span className="text-muted-foreground">Interest ({pkg.interestRate}%):</span>
                                  <span>GHS {((formValues.pricePerPlot * pkg.interestRate) / 100).toLocaleString()}</span>
                                  
                                  <span className="text-muted-foreground">Total per plot:</span>
                                  <span className="font-medium">GHS {(formValues.pricePerPlot * (1 + pkg.interestRate / 100)).toLocaleString()}</span>
                                  
                                  <span className="text-muted-foreground">Initial deposit ({pkg.initialDepositPercent}%):</span>
                                  <span className="font-medium text-primary">GHS {((formValues.pricePerPlot * pkg.initialDepositPercent) / 100).toLocaleString()}</span>
                                  
                                  <span className="text-muted-foreground">Monthly payment:</span>
                                  <span className="font-medium text-primary">
                                    GHS {(
                                      ((formValues.pricePerPlot * (1 + pkg.interestRate / 100)) - (formValues.pricePerPlot * pkg.initialDepositPercent / 100)) / pkg.durationMonths
                                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seller Financial Summary with all packages */}
                  {formValues.pricePerPlot && formValues.totalPlots && formValues.allowInstallments && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Seller Revenue Summary (If All Plots Sold)
                      </p>
                      <div className="space-y-4">
                        {sellerFinancials.packageFinancials.map((pkg, index) => (
                          <div key={pkg.id} className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-xs font-medium text-foreground mb-2">
                              {pkg.durationMonths} Month Plan ({pkg.interestRate}% interest)
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <span className="text-muted-foreground">Total initial deposits:</span>
                              <span className="font-medium">GHS {pkg.totalInitialAllPlots.toLocaleString()}</span>
                              
                              <span className="text-muted-foreground">Monthly income:</span>
                              <span className="font-medium">GHS {pkg.monthlyAllPlots.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              
                              <span className="text-muted-foreground">Total revenue:</span>
                              <span className="font-medium text-primary">GHS {pkg.totalAllPlots.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Conditions */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                      Set the conditions for when buyers can access land and receive documents based on their payment progress.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Land Access - At what % payment can buyer access the land?
                    </label>
                    <div className="flex items-center gap-4">
                      <Input
                        {...register('landAccessPercentage', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">% of total payment</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Buyer can start using/developing the land after paying this percentage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Site Plan - At what % payment does buyer receive site plan?
                    </label>
                    <div className="flex items-center gap-4">
                      <Input
                        {...register('sitePlanAccessPercentage', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">% of total payment</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Document Transfer - At what % payment are documents transferred?
                    </label>
                    <div className="flex items-center gap-4">
                      <Input
                        {...register('documentTransferPercentage', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">% of total payment</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full ownership documents (indenture, title deed) transferred after this payment
                    </p>
                  </div>

                  {/* Visual timeline */}
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <p className="text-sm font-medium text-foreground mb-4">Buyer Journey Preview</p>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-6">
                        <TimelineItem
                          percentage={formValues.landAccessPercentage || 0}
                          label="Land Access"
                          description="Buyer can access and use the land"
                        />
                        <TimelineItem
                          percentage={formValues.sitePlanAccessPercentage || 0}
                          label="Site Plan Released"
                          description="Site plan document provided to buyer"
                        />
                        <TimelineItem
                          percentage={formValues.documentTransferPercentage || 0}
                          label="Full Document Transfer"
                          description="Indenture and title transferred to buyer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Media */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  {/* Images */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Photos <span className="text-muted-foreground">(up to 10 images)</span>
                    </label>
                    
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        {images.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-full h-24 object-cover rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {images.length < 10 && (
                      <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload photos or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB each
                        </p>
                      </label>
                    )}
                  </div>

                  {/* Video */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Video <span className="text-muted-foreground">(optional, 1 video)</span>
                    </label>
                    
                    {video ? (
                      <div className="relative">
                        <video
                          src={video.url}
                          controls
                          className="w-full h-48 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                        <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a video tour of your land
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV up to 100MB
                        </p>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Step 8: Review */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border divide-y divide-border">
                    <ReviewSection title="Basic Information">
                      <ReviewItem label="Title" value={formValues.title} />
                      <ReviewItem label="Category" value={formValues.category?.toLowerCase()} />
                      <ReviewItem label="Land Type" value={formValues.landType?.toLowerCase()} />
                      <ReviewItem label="Tenure" value={formValues.tenureType?.toLowerCase()} />
                    </ReviewSection>
                    
                    <ReviewSection title="Location">
                      <ReviewItem label="Region" value={formValues.region} />
                      <ReviewItem label="Constituency" value={formValues.constituency} />
                      <ReviewItem label="District" value={formValues.district} />
                      {formValues.town && <ReviewItem label="Town" value={formValues.town} />}
                      {formValues.latitude && formValues.longitude && (
                        <ReviewItem label="GPS" value={`${formValues.latitude.toFixed(6)}, ${formValues.longitude.toFixed(6)}`} />
                      )}
                    </ReviewSection>
                    
                    <ReviewSection title="Plot Details">
                      <ReviewItem 
                        label="Plot Size" 
                        value={`${formValues.plotLength} × ${formValues.plotWidth} ${formValues.plotDimensionUnit?.toLowerCase()}`} 
                      />
                      <ReviewItem label="Total Plots" value={formValues.totalPlots?.toLocaleString()} />
                      <ReviewItem 
                        label="Price per Plot" 
                        value={`GHS ${formValues.pricePerPlot?.toLocaleString()}`} 
                      />
                      <ReviewItem 
                        label="Total Value" 
                        value={`GHS ${((formValues.pricePerPlot || 0) * (formValues.totalPlots || 0)).toLocaleString()}`} 
                      />
                    </ReviewSection>
                    
                    <ReviewSection title="Payment Options">
                      <ReviewItem label="One-Time Payment" value={formValues.allowOneTimePayment ? 'Yes' : 'No'} />
                      <ReviewItem label="Installments" value={formValues.allowInstallments ? 'Yes' : 'No'} />
                      {formValues.allowInstallments && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-2">Installment Packages:</p>
                          {installmentPackages.map((pkg, i) => (
                            <p key={pkg.id} className="text-xs text-foreground">
                              • {pkg.durationMonths} months @ {pkg.interestRate}% interest, {pkg.initialDepositPercent}% deposit
                            </p>
                          ))}
                        </div>
                      )}
                    </ReviewSection>
                    
                    <ReviewSection title="Conditions">
                      <ReviewItem label="Land Access" value={`At ${formValues.landAccessPercentage}% payment`} />
                      <ReviewItem label="Site Plan" value={`At ${formValues.sitePlanAccessPercentage}% payment`} />
                      <ReviewItem label="Document Transfer" value={`At ${formValues.documentTransferPercentage}% payment`} />
                    </ReviewSection>
                    
                    <ReviewSection title="Media">
                      <ReviewItem label="Photos" value={`${images.length} uploaded`} />
                      <ReviewItem label="Video" value={video ? '1 uploaded' : 'None'} />
                    </ReviewSection>
                  </div>

                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <p className="text-sm text-warning-foreground">
                      Your listing will be saved as a <strong>draft</strong>. You can submit it for
                      review from your dashboard.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                {currentStep > 0 ? (
                  <Button type="button" variant="ghost" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <Link href="/dashboard/listings">
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </Link>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" variant="primary" onClick={nextStep}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create Listing
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TimelineItem({ percentage, label, description }: { percentage: number; label: string; description: string }) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary-foreground">{percentage}%</span>
      </div>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <p className="text-sm font-medium text-foreground mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value || '-'}</span>
    </div>
  );
}
