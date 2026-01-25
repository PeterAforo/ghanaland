'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';

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
  plotLength?: number;
  plotWidth?: number;
  plotDimensionUnit?: string;
  totalPlots?: number;
  pricePerPlot?: string;
  allowOneTimePayment?: boolean;
  allowInstallments?: boolean;
  installmentPackages?: any[];
  landAccessPercentage?: number;
  sitePlanAccessPercentage?: number;
  documentTransferPercentage?: number;
  listingStatus: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [landType, setLandType] = useState('');
  const [tenureType, setTenureType] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [plotLength, setPlotLength] = useState<number | ''>('');
  const [plotWidth, setPlotWidth] = useState<number | ''>('');
  const [totalPlots, setTotalPlots] = useState<number | ''>('');
  const [pricePerPlot, setPricePerPlot] = useState<number | ''>('');

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
        const data = result.data;
        setListing(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setLandType(data.landType || '');
        setTenureType(data.tenureType || '');
        setRegion(data.region || '');
        setDistrict(data.district || '');
        setTown(data.town || '');
        setPlotLength(data.plotLength || '');
        setPlotWidth(data.plotWidth || '');
        setTotalPlots(data.totalPlots || '');
        setPricePerPlot(data.pricePerPlot ? parseFloat(data.pricePerPlot) : '');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          landType,
          tenureType,
          region,
          district,
          town: town || undefined,
          plotLength: plotLength || undefined,
          plotWidth: plotWidth || undefined,
          totalPlots: totalPlots || undefined,
          pricePerPlot: pricePerPlot || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to update listing');
      }

      const result = await res.json();
      if (result.success) {
        setSuccess('Listing updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/listings');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setError(err.message || 'Failed to update listing');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/dashboard/listings">
                <Button variant="primary">Back to Listings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/listings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Listing</h1>
            <p className="text-sm text-muted-foreground">Update your listing details</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter listing title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your land..."
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="AGRICULTURAL">Agricultural</option>
                    <option value="MIXED_USE">Mixed Use</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Land Type</label>
                  <select
                    value={landType}
                    onChange={(e) => setLandType(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select</option>
                    <option value="CUSTOMARY">Customary</option>
                    <option value="TITLED">Titled</option>
                    <option value="LEASEHOLD">Leasehold</option>
                    <option value="FREEHOLD">Freehold</option>
                    <option value="GOVERNMENT">Government</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tenure Type</label>
                  <select
                    value={tenureType}
                    onChange={(e) => setTenureType(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    required
                  >
                    <option value="">Select</option>
                    <option value="FREEHOLD">Freehold</option>
                    <option value="LEASEHOLD">Leasehold</option>
                    <option value="CUSTOMARY">Customary</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Region</label>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., Greater Accra"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">District</label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g., Accra Metropolitan"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Town/Area</label>
                <Input
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  placeholder="e.g., East Legon"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Plot Details & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plot Length (ft)</label>
                  <Input
                    type="number"
                    value={plotLength}
                    onChange={(e) => setPlotLength(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plot Width (ft)</label>
                  <Input
                    type="number"
                    value={plotWidth}
                    onChange={(e) => setPlotWidth(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 70"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Total Plots</label>
                  <Input
                    type="number"
                    value={totalPlots}
                    onChange={(e) => setTotalPlots(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price Per Plot (GHS)</label>
                  <Input
                    type="number"
                    value={pricePerPlot}
                    onChange={(e) => setPricePerPlot(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/listings">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
