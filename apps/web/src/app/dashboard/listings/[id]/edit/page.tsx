'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Save, Loader2, MapPin, Plus, Trash2, Image as ImageIcon, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/feedback/loading-skeleton';

interface InstallmentPackage {
  id: string;
  durationMonths: number;
  interestRate: number;
  initialDepositPercent: number;
}

interface MediaFile {
  id: string;
  url: string;
  type: string;
  isExisting?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  file?: File;
  isExisting?: boolean;
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
  media?: MediaFile[];
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

  // Form state - Basic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [landType, setLandType] = useState('');
  const [tenureType, setTenureType] = useState('');
  const [leasePeriodYears, setLeasePeriodYears] = useState<number | ''>('');
  
  // Location
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [constituency, setConstituency] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  
  // Plot Details
  const [plotLength, setPlotLength] = useState<number | ''>('');
  const [plotWidth, setPlotWidth] = useState<number | ''>('');
  const [plotDimensionUnit, setPlotDimensionUnit] = useState('FEET');
  const [totalPlots, setTotalPlots] = useState<number | ''>('');
  const [availablePlots, setAvailablePlots] = useState<number | ''>('');
  const [pricePerPlot, setPricePerPlot] = useState<number | ''>('');
  
  // Payment Options
  const [allowOneTimePayment, setAllowOneTimePayment] = useState(true);
  const [allowInstallments, setAllowInstallments] = useState(false);
  const [installmentPackages, setInstallmentPackages] = useState<InstallmentPackage[]>([]);
  
  // Conditions
  const [landAccessPercentage, setLandAccessPercentage] = useState<number | ''>('');
  const [sitePlanAccessPercentage, setSitePlanAccessPercentage] = useState<number | ''>('');
  const [documentTransferPercentage, setDocumentTransferPercentage] = useState<number | ''>('');
  
  // Media
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [video, setVideo] = useState<UploadedFile | null>(null);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

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
        
        // Basic
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setLandType(data.landType || '');
        setTenureType(data.tenureType || '');
        setLeasePeriodYears(data.leasePeriodYears || '');
        
        // Location
        setRegion(data.region || '');
        setDistrict(data.district || '');
        setConstituency(data.constituency || '');
        setTown(data.town || '');
        setAddress(data.address || '');
        setLatitude(data.latitude || '');
        setLongitude(data.longitude || '');
        
        // Plot Details
        setPlotLength(data.plotLength || '');
        setPlotWidth(data.plotWidth || '');
        setPlotDimensionUnit(data.plotDimensionUnit || 'FEET');
        setTotalPlots(data.totalPlots || '');
        setAvailablePlots(data.availablePlots || data.totalPlots || '');
        setPricePerPlot(data.pricePerPlot ? parseFloat(data.pricePerPlot) : '');
        
        // Payment Options
        setAllowOneTimePayment(data.allowOneTimePayment ?? true);
        setAllowInstallments(data.allowInstallments ?? false);
        setInstallmentPackages(data.installmentPackages || []);
        
        // Conditions
        setLandAccessPercentage(data.landAccessPercentage || '');
        setSitePlanAccessPercentage(data.sitePlanAccessPercentage || '');
        setDocumentTransferPercentage(data.documentTransferPercentage || '');
        
        // Media
        if (data.media && data.media.length > 0) {
          const existingImages: UploadedFile[] = [];
          let existingVideo: UploadedFile | null = null;
          
          data.media.forEach((m: MediaFile) => {
            if (m.type === 'VIDEO') {
              existingVideo = {
                id: m.id,
                name: 'Existing video',
                type: 'video',
                url: m.url,
                isExisting: true,
              };
            } else {
              existingImages.push({
                id: m.id,
                name: 'Existing image',
                type: 'image',
                url: m.url,
                isExisting: true,
              });
            }
          });
          
          setImages(existingImages);
          setVideo(existingVideo);
        }
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  };

  // Media handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const newImage: UploadedFile = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'image',
        url: URL.createObjectURL(file),
        file: file,
        isExisting: false,
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
      file: file,
      isExisting: false,
    };
    setVideo(newVideo);
  };

  const removeImage = (img: UploadedFile) => {
    if (img.isExisting) {
      setDeletedMediaIds((prev) => [...prev, img.id]);
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const removeVideo = () => {
    if (video?.isExisting) {
      setDeletedMediaIds((prev) => [...prev, video.id]);
    }
    setVideo(null);
  };

  const uploadNewMedia = async (token: string): Promise<boolean> => {
    const filesToUpload: File[] = [];
    
    // Collect new images (not existing ones)
    images.forEach((img) => {
      if (img.file && !img.isExisting) {
        filesToUpload.push(img.file);
      }
    });
    
    // Collect new video
    if (video?.file && !video.isExisting) {
      filesToUpload.push(video.file);
    }

    if (filesToUpload.length === 0) return true;

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch(`/api/v1/listings/${id}/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        console.error('Media upload failed:', await res.text());
        return false;
      }

      const result = await res.json();
      return result.success;
    } catch (err) {
      console.error('Media upload error:', err);
      return false;
    }
  };

  const deleteRemovedMedia = async (token: string): Promise<boolean> => {
    if (deletedMediaIds.length === 0) return true;

    try {
      for (const mediaId of deletedMediaIds) {
        await fetch(`/api/v1/listings/${id}/media/${mediaId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      return true;
    } catch (err) {
      console.error('Media delete error:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('You are not logged in. Please log in again.');
        router.push('/auth/login');
        return;
      }
      
      // Step 1: Update listing data
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
          leasePeriodYears: leasePeriodYears || undefined,
          region,
          district,
          constituency: constituency || undefined,
          town: town || undefined,
          address: address || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          plotLength: plotLength || undefined,
          plotWidth: plotWidth || undefined,
          plotDimensionUnit,
          totalPlots: totalPlots || undefined,
          availablePlots: availablePlots || undefined,
          pricePerPlot: pricePerPlot || undefined,
          allowOneTimePayment,
          allowInstallments,
          installmentPackages: allowInstallments ? installmentPackages : [],
          landAccessPercentage: landAccessPercentage || undefined,
          sitePlanAccessPercentage: sitePlanAccessPercentage || undefined,
          documentTransferPercentage: documentTransferPercentage || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('accessToken');
          router.push('/auth/login');
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || 'Failed to update listing');
      }

      const result = await res.json();
      if (result.success) {
        // Step 2: Delete removed media
        await deleteRemovedMedia(token);
        
        // Step 3: Upload new media
        const mediaUploaded = await uploadNewMedia(token);
        if (!mediaUploaded) {
          setSuccess('Listing updated, but some media failed to upload.');
        } else {
          setSuccess('Listing updated successfully!');
        }
        
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
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Constituency</label>
                  <Input
                    value={constituency}
                    onChange={(e) => setConstituency(e.target.value)}
                    placeholder="e.g., Ningo Prampram"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Town/Area</label>
                  <Input
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    placeholder="e.g., East Legon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Specific address or landmark"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 5.6037"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., -0.1870"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Plot Details & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plot Length</label>
                  <Input
                    type="number"
                    value={plotLength}
                    onChange={(e) => setPlotLength(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Plot Width</label>
                  <Input
                    type="number"
                    value={plotWidth}
                    onChange={(e) => setPlotWidth(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Unit</label>
                  <select
                    value={plotDimensionUnit}
                    onChange={(e) => setPlotDimensionUnit(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="FEET">Feet</option>
                    <option value="METERS">Meters</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-foreground mb-1">Available Plots</label>
                  <Input
                    type="number"
                    value={availablePlots}
                    onChange={(e) => setAvailablePlots(e.target.value ? Number(e.target.value) : '')}
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

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOneTimePayment}
                    onChange={(e) => setAllowOneTimePayment(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm font-medium">Allow One-Time Payment</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowInstallments}
                    onChange={(e) => setAllowInstallments(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm font-medium">Allow Installments</span>
                </label>
              </div>
              
              {allowInstallments && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Installment Packages</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setInstallmentPackages([...installmentPackages, {
                        id: Date.now().toString(),
                        durationMonths: 12,
                        interestRate: 0,
                        initialDepositPercent: 25,
                      }])}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Package
                    </Button>
                  </div>
                  {installmentPackages.map((pkg, index) => (
                    <div key={pkg.id} className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Duration (months)</label>
                        <Input
                          type="number"
                          value={pkg.durationMonths}
                          onChange={(e) => {
                            const updated = [...installmentPackages];
                            updated[index].durationMonths = Number(e.target.value);
                            setInstallmentPackages(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Interest Rate (%)</label>
                        <Input
                          type="number"
                          value={pkg.interestRate}
                          onChange={(e) => {
                            const updated = [...installmentPackages];
                            updated[index].interestRate = Number(e.target.value);
                            setInstallmentPackages(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Initial Deposit (%)</label>
                        <Input
                          type="number"
                          value={pkg.initialDepositPercent}
                          onChange={(e) => {
                            const updated = [...installmentPackages];
                            updated[index].initialDepositPercent = Number(e.target.value);
                            setInstallmentPackages(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setInstallmentPackages(installmentPackages.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the percentage of payment required at each milestone
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Land Access (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={landAccessPercentage}
                    onChange={(e) => setLandAccessPercentage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Site Plan Access (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={sitePlanAccessPercentage}
                    onChange={(e) => setSitePlanAccessPercentage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Document Transfer (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={documentTransferPercentage}
                    onChange={(e) => setDocumentTransferPercentage(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Photos & Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                          onClick={() => removeImage(img)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {img.isExisting && (
                          <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                            Existing
                          </span>
                        )}
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
                    {video.isExisting && (
                      <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                        Existing video
                      </span>
                    )}
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
                      Click to upload a video
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP4, MOV up to 50MB
                    </p>
                  </label>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Note: Media upload functionality requires file storage to be configured. Currently showing preview only.
              </p>
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
