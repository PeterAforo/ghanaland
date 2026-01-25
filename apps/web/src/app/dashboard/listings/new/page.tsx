'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';

const STEPS = [
  { id: 'basics', title: 'Listing Basics', description: 'Title & category' },
  { id: 'location', title: 'Location', description: 'Region & district' },
  { id: 'pricing', title: 'Pricing', description: 'Price & size' },
  { id: 'documents', title: 'Documents', description: 'Photos & files' },
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

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
];

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(5000).optional(),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE']),
  landType: z.enum(['CUSTOMARY', 'TITLED', 'LEASEHOLD', 'FREEHOLD', 'GOVERNMENT']),
  tenureType: z.enum(['FREEHOLD', 'LEASEHOLD', 'CUSTOMARY']),
  leasePeriodYears: z.number().int().positive().optional(),
  region: z.string().min(1, 'Region is required'),
  district: z.string().min(1, 'District is required'),
  town: z.string().optional(),
  address: z.string().optional(),
  sizeAcres: z.number().positive('Size must be positive'),
  priceGhs: z.number().positive('Price must be positive'),
});

type ListingForm = z.infer<typeof listingSchema>;

export default function NewListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    },
  });

  const formValues = watch();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const validateStep = async () => {
    switch (currentStep) {
      case 0:
        return await trigger(['title', 'description', 'category', 'landType', 'tenureType']);
      case 1:
        return await trigger(['region', 'district', 'town', 'address']);
      case 2:
        return await trigger(['sizeAcres', 'priceGhs', 'leasePeriodYears']);
      case 3:
        return true; // Documents step - optional for now
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

  const onSubmit = async (data: ListingForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/v1/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
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
              {currentStep === 2 && 'Set your price and land size'}
              {currentStep === 3 && 'Upload photos and documents'}
              {currentStep === 4 && 'Review your listing before publishing'}
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
                      placeholder="e.g., 5 Acres of Prime Land in East Legon"
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Region</label>
                      <select
                        {...register('region')}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select region</option>
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {errors.region && (
                        <p className="text-xs text-destructive">{errors.region.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">District</label>
                      <Input {...register('district')} placeholder="e.g., Tema Metropolitan" />
                      {errors.district && (
                        <p className="text-xs text-destructive">{errors.district.message}</p>
                      )}
                    </div>
                  </div>

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

                  {/* Map placeholder */}
                  <div className="rounded-xl border border-border bg-muted/50 h-48 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Map view coming soon</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Size (Acres)</label>
                      <Input
                        {...register('sizeAcres', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 5.5"
                      />
                      {errors.sizeAcres && (
                        <p className="text-xs text-destructive">{errors.sizeAcres.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Price (GHS)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...register('priceGhs', { valueAsNumber: true })}
                          type="number"
                          placeholder="e.g., 500000"
                          className="pl-10"
                        />
                      </div>
                      {errors.priceGhs && (
                        <p className="text-xs text-destructive">{errors.priceGhs.message}</p>
                      )}
                    </div>
                  </div>

                  {formValues.tenureType === 'LEASEHOLD' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Lease Period (Years)
                      </label>
                      <Input
                        {...register('leasePeriodYears', { valueAsNumber: true })}
                        type="number"
                        placeholder="e.g., 50"
                      />
                    </div>
                  )}

                  {formValues.sizeAcres && formValues.priceGhs && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground">Price per acre</p>
                      <p className="text-2xl font-bold text-primary">
                        GHS {(formValues.priceGhs / formValues.sizeAcres).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Photos</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop photos here, or click to browse
                      </p>
                      <Button type="button" variant="secondary" size="sm">
                        Upload Photos
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Files are stored securely; access is controlled
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Documents <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload site plans, title deeds, or other documents
                      </p>
                      <Button type="button" variant="secondary" size="sm">
                        Upload Documents
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                    <ReviewItem label="Title" value={formValues.title} />
                    <ReviewItem label="Category" value={formValues.category?.toLowerCase()} />
                    <ReviewItem label="Land Type" value={formValues.landType?.toLowerCase()} />
                    <ReviewItem label="Tenure" value={formValues.tenureType?.toLowerCase()} />
                    <ReviewItem
                      label="Location"
                      value={`${formValues.district || ''}, ${formValues.region || ''}`}
                    />
                    <ReviewItem label="Size" value={`${formValues.sizeAcres} acres`} />
                    <ReviewItem
                      label="Price"
                      value={`GHS ${formValues.priceGhs?.toLocaleString()}`}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <p className="text-sm text-warning-foreground">
                      Your listing will be saved as a <strong>draft</strong>. You can submit it for
                      review after adding photos and documents.
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
                  <Link href="/dashboard">
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

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground capitalize">{value || '-'}</span>
    </div>
  );
}
