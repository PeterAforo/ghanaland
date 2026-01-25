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
  { id: 'location', title: 'Location', description: 'Region, constituency & district' },
  { id: 'sizing', title: 'Land Size', description: 'Acres or plots with dimensions' },
  { id: 'pricing', title: 'Pricing & Payment', description: 'Price & payment options' },
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

const SIZE_UNITS = [
  { value: 'ACRES', label: 'Acres' },
  { value: 'PLOTS', label: 'Plots' },
];

const PAYMENT_TYPES = [
  { value: 'ONE_TIME', label: 'One-Time Payment', description: 'Full payment upfront' },
  { value: 'INSTALLMENT', label: 'Installment Plan', description: 'Pay over time' },
];

const INSTALLMENT_FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly', periodsPerYear: 52 },
  { value: 'MONTHLY', label: 'Monthly', periodsPerYear: 12 },
  { value: 'QUARTERLY', label: 'Quarterly', periodsPerYear: 4 },
  { value: 'YEARLY', label: 'Yearly', periodsPerYear: 1 },
];

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
  
  // Sizing
  sizeUnit: z.enum(['ACRES', 'PLOTS']),
  totalSize: z.number().positive('Size must be positive'),
  plotLength: z.number().positive().optional(),
  plotWidth: z.number().positive().optional(),
  plotDimensionUnit: z.enum(['FEET', 'METERS']).optional(),
  numberOfPlots: z.number().int().positive().optional(),
  
  // Pricing
  pricePerUnit: z.number().positive('Price must be positive'),
  totalPrice: z.number().positive().optional(),
  
  // Payment Options
  paymentType: z.enum(['ONE_TIME', 'INSTALLMENT']),
  installmentDurationMonths: z.number().int().positive().optional(),
  installmentFrequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  initialDeposit: z.number().min(0).optional(),
  
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
  
  // Media uploads
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [video, setVideo] = useState<UploadedFile | null>(null);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);

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
      sizeUnit: 'PLOTS',
      plotDimensionUnit: 'FEET',
      paymentType: 'ONE_TIME',
      installmentFrequency: 'MONTHLY',
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

  // Calculate installment details
  const installmentCalculation = useMemo(() => {
    if (formValues.paymentType !== 'INSTALLMENT') return null;
    
    const totalPrice = formValues.pricePerUnit * (formValues.totalSize || 1);
    const deposit = formValues.initialDeposit || 0;
    const remaining = totalPrice - deposit;
    const durationMonths = formValues.installmentDurationMonths || 12;
    
    const frequency = INSTALLMENT_FREQUENCIES.find(f => f.value === formValues.installmentFrequency);
    if (!frequency) return null;
    
    let numberOfPayments: number;
    switch (formValues.installmentFrequency) {
      case 'WEEKLY':
        numberOfPayments = Math.ceil((durationMonths / 12) * 52);
        break;
      case 'MONTHLY':
        numberOfPayments = durationMonths;
        break;
      case 'QUARTERLY':
        numberOfPayments = Math.ceil(durationMonths / 3);
        break;
      case 'YEARLY':
        numberOfPayments = Math.ceil(durationMonths / 12);
        break;
      default:
        numberOfPayments = durationMonths;
    }
    
    const paymentAmount = remaining / numberOfPayments;
    
    return {
      totalPrice,
      deposit,
      remaining,
      numberOfPayments,
      paymentAmount,
      frequency: frequency.label,
    };
  }, [formValues.paymentType, formValues.pricePerUnit, formValues.totalSize, formValues.initialDeposit, formValues.installmentDurationMonths, formValues.installmentFrequency]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const validateStep = async () => {
    switch (currentStep) {
      case 0:
        return await trigger(['title', 'description', 'category', 'landType', 'tenureType']);
      case 1:
        return await trigger(['region', 'constituency', 'district', 'town', 'address']);
      case 2:
        return await trigger(['sizeUnit', 'totalSize', 'plotLength', 'plotWidth', 'numberOfPlots']);
      case 3:
        return await trigger(['pricePerUnit', 'paymentType', 'installmentDurationMonths', 'installmentFrequency', 'initialDeposit']);
      case 4:
        return await trigger(['landAccessPercentage', 'sitePlanAccessPercentage', 'documentTransferPercentage']);
      case 5:
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
      
      // Calculate total price
      const totalPrice = data.pricePerUnit * data.totalSize;
      
      const payload = {
        ...data,
        totalPrice,
        priceGhs: totalPrice,
        sizeAcres: data.sizeUnit === 'ACRES' ? data.totalSize : data.totalSize * 0.1, // Approximate conversion
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
              {currentStep === 1 && 'Where is your land located?'}
              {currentStep === 2 && 'Specify the size of your land'}
              {currentStep === 3 && 'Set your price and payment options'}
              {currentStep === 4 && 'Define conditions for buyers'}
              {currentStep === 5 && 'Upload photos and video of your land'}
              {currentStep === 6 && 'Review your listing before publishing'}
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
                      placeholder="e.g., 5 Plots of Prime Land in East Legon"
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

              {/* Step 2: Location */}
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

                  {/* Map placeholder */}
                  <div className="rounded-xl border border-border bg-muted/50 h-48 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Map view coming soon</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Land Size */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Size Unit</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SIZE_UNITS.map((unit) => (
                        <button
                          key={unit.value}
                          type="button"
                          onClick={() => setValue('sizeUnit', unit.value as any)}
                          className={`p-4 rounded-xl border-2 text-center transition-colors ${
                            formValues.sizeUnit === unit.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium text-foreground">{unit.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formValues.sizeUnit === 'PLOTS' && (
                    <>
                      <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-sm font-medium text-foreground mb-3">Plot Dimensions</p>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Length</label>
                            <Input
                              {...register('plotLength', { valueAsNumber: true })}
                              type="number"
                              placeholder="e.g., 100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Width</label>
                            <Input
                              {...register('plotWidth', { valueAsNumber: true })}
                              type="number"
                              placeholder="e.g., 70"
                            />
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
                            Each plot: <span className="font-medium text-foreground">{formValues.plotLength} x {formValues.plotWidth} {formValues.plotDimensionUnit?.toLowerCase()}</span>
                            {' '}= <span className="font-medium text-foreground">{(formValues.plotLength * formValues.plotWidth).toLocaleString()} sq {formValues.plotDimensionUnit?.toLowerCase()}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Number of Plots Available</label>
                        <Input
                          {...register('totalSize', { valueAsNumber: true })}
                          type="number"
                          placeholder="e.g., 10"
                        />
                        {errors.totalSize && (
                          <p className="text-xs text-destructive">{errors.totalSize.message}</p>
                        )}
                      </div>
                    </>
                  )}

                  {formValues.sizeUnit === 'ACRES' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Total Acres</label>
                      <Input
                        {...register('totalSize', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 5.5"
                      />
                      {errors.totalSize && (
                        <p className="text-xs text-destructive">{errors.totalSize.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Pricing & Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Price per {formValues.sizeUnit === 'PLOTS' ? 'Plot' : 'Acre'} (GHS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">GHS</span>
                      <Input
                        {...register('pricePerUnit', { valueAsNumber: true })}
                        type="number"
                        placeholder="e.g., 40000"
                        className="pl-12"
                      />
                    </div>
                    {errors.pricePerUnit && (
                      <p className="text-xs text-destructive">{errors.pricePerUnit.message}</p>
                    )}
                  </div>

                  {formValues.pricePerUnit && formValues.totalSize && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Total Land Value</p>
                      <p className="text-2xl font-bold text-primary">
                        GHS {(formValues.pricePerUnit * formValues.totalSize).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formValues.totalSize} {formValues.sizeUnit === 'PLOTS' ? 'plots' : 'acres'} × GHS {formValues.pricePerUnit.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Payment Type</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {PAYMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setValue('paymentType', type.value as any)}
                          className={`p-4 rounded-xl border-2 text-left transition-colors ${
                            formValues.paymentType === type.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium text-foreground">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formValues.paymentType === 'INSTALLMENT' && (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Installment Plan Settings
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Payment Duration (months)</label>
                          <Input
                            {...register('installmentDurationMonths', { valueAsNumber: true })}
                            type="number"
                            placeholder="e.g., 12"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Payment Frequency</label>
                          <select
                            {...register('installmentFrequency')}
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                          >
                            {INSTALLMENT_FREQUENCIES.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Initial Deposit (GHS) - Optional</label>
                        <Input
                          {...register('initialDeposit', { valueAsNumber: true })}
                          type="number"
                          placeholder="e.g., 5000"
                        />
                      </div>

                      {installmentCalculation && (
                        <div className="p-4 rounded-xl bg-background border border-border">
                          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            Payment Schedule Preview
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Price:</span>
                              <span className="font-medium">GHS {installmentCalculation.totalPrice.toLocaleString()}</span>
                            </div>
                            {installmentCalculation.deposit > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Initial Deposit:</span>
                                <span className="font-medium">GHS {installmentCalculation.deposit.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Remaining Balance:</span>
                              <span className="font-medium">GHS {installmentCalculation.remaining.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-border pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Number of Payments:</span>
                                <span className="font-medium">{installmentCalculation.numberOfPayments} {installmentCalculation.frequency.toLowerCase()} payments</span>
                              </div>
                              <div className="flex justify-between text-primary">
                                <span className="font-medium">Each Payment:</span>
                                <span className="font-bold">GHS {installmentCalculation.paymentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Conditions */}
              {currentStep === 4 && (
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
                    <p className="text-xs text-muted-foreground">
                      Site plan document will be released to buyer after this payment milestone
                    </p>
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

              {/* Step 6: Media */}
              {currentStep === 5 && (
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

              {/* Step 7: Review */}
              {currentStep === 6 && (
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
                    </ReviewSection>
                    
                    <ReviewSection title="Size & Pricing">
                      <ReviewItem 
                        label="Size" 
                        value={`${formValues.totalSize} ${formValues.sizeUnit === 'PLOTS' ? 'plots' : 'acres'}`} 
                      />
                      {formValues.sizeUnit === 'PLOTS' && formValues.plotLength && formValues.plotWidth && (
                        <ReviewItem 
                          label="Plot Dimensions" 
                          value={`${formValues.plotLength} x ${formValues.plotWidth} ${formValues.plotDimensionUnit?.toLowerCase()}`} 
                        />
                      )}
                      <ReviewItem 
                        label={`Price per ${formValues.sizeUnit === 'PLOTS' ? 'Plot' : 'Acre'}`} 
                        value={`GHS ${formValues.pricePerUnit?.toLocaleString()}`} 
                      />
                      <ReviewItem 
                        label="Total Price" 
                        value={`GHS ${((formValues.pricePerUnit || 0) * (formValues.totalSize || 0)).toLocaleString()}`} 
                      />
                    </ReviewSection>
                    
                    <ReviewSection title="Payment">
                      <ReviewItem label="Payment Type" value={formValues.paymentType === 'ONE_TIME' ? 'One-Time Payment' : 'Installment Plan'} />
                      {formValues.paymentType === 'INSTALLMENT' && installmentCalculation && (
                        <>
                          <ReviewItem label="Duration" value={`${formValues.installmentDurationMonths} months`} />
                          <ReviewItem label="Frequency" value={installmentCalculation.frequency} />
                          {installmentCalculation.deposit > 0 && (
                            <ReviewItem label="Initial Deposit" value={`GHS ${installmentCalculation.deposit.toLocaleString()}`} />
                          )}
                          <ReviewItem label="Each Payment" value={`GHS ${installmentCalculation.paymentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                        </>
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
