'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  DollarSign,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/feedback/loading-skeleton';
import { EmptyState } from '@/components/feedback/empty-state';
import { API_BASE_URL } from '@/lib/api';

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceGhs: number;
  priceType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
  durationDays: number | null;
  catalogId: string | null;
}

interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string | null;
  priceGhs: number;
  durationDays: number | null;
  professionalType: string;
}

interface ProfessionalProfile {
  id: string;
  type: string;
  services: Service[];
}

const PRICE_TYPES = [
  { value: 'FIXED', label: 'Fixed Price', description: 'One-time fee for the service' },
  { value: 'HOURLY', label: 'Hourly Rate', description: 'Charged per hour of work' },
  { value: 'NEGOTIABLE', label: 'Negotiable', description: 'Price discussed with client' },
];

export default function ServicesManagementPage() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [catalogItems, setCatalogItems] = useState<ServiceCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [formData, setFormData] = useState({
    priceGhs: '',
    priceType: 'FIXED' as 'FIXED' | 'HOURLY' | 'NEGOTIABLE',
    durationDays: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.type) {
      fetchCatalog(profile.type);
    }
  }, [profile?.type]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalog = async (type: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/service-catalog/by-type/${type}`);
      const data = await res.json();
      if (data.success) {
        setCatalogItems(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch service catalog:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      priceGhs: '',
      priceType: 'FIXED',
      durationDays: '',
    });
    setSelectedCatalogId('');
    setShowForm(false);
  };

  const handleCatalogSelect = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const item = catalogItems.find(c => c.id === catalogId);
    if (item) {
      setFormData({
        priceGhs: item.priceGhs.toString(),
        priceType: 'FIXED',
        durationDays: item.durationDays?.toString() || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCatalogId) {
      setError('Please select a service from the catalog');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      const selectedCatalog = catalogItems.find(c => c.id === selectedCatalogId);
      
      const body = {
        catalogId: selectedCatalogId,
        name: selectedCatalog?.name || '',
        description: selectedCatalog?.description || undefined,
        priceGhs: parseFloat(formData.priceGhs),
        priceType: formData.priceType,
        durationDays: formData.durationDays ? parseInt(formData.durationDays) : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/me/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess('Service added successfully!');
        resetForm();
        fetchProfile();
      } else {
        setError(data.error?.message || 'Failed to save service');
      }
    } catch (err) {
      setError('Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/professionals/me/services/${serviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess('Service deleted successfully!');
        fetchProfile();
      } else {
        setError(data.error?.message || 'Failed to delete service');
      }
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  const formatPrice = (price: number, priceType: string) => {
    const formatted = `GHS ${price.toLocaleString()}`;
    if (priceType === 'HOURLY') return `${formatted}/hr`;
    if (priceType === 'NEGOTIABLE') return `From ${formatted}`;
    return formatted;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-6 w-6" />}
              title="No Professional Profile"
              description="You need to create a professional profile first before adding services."
            />
            <div className="mt-4 flex justify-center">
              <Link href="/dashboard/professional">
                <Button variant="primary">Go to Professional Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/professional">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Services</h1>
            <p className="text-sm text-muted-foreground">
              Add and manage the services you offer to clients
            </p>
          </div>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Add Service Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Selection from Catalog */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Select Service *
                </label>
                {catalogItems.length === 0 ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      No services available for your professional type yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please contact admin to add services to the catalog.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => handleCatalogSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground"
                    required
                  >
                    <option value="">-- Select a service --</option>
                    {catalogItems
                      .filter(item => !profile?.services.some(s => s.catalogId === item.id))
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Suggested: GHS {Number(item.priceGhs).toLocaleString()})
                        </option>
                      ))}
                  </select>
                )}
                {selectedCatalogId && (
                  <p className="text-xs text-muted-foreground">
                    {catalogItems.find(c => c.id === selectedCatalogId)?.description}
                  </p>
                )}
              </div>

              {selectedCatalogId && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Your Price (GHS) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.priceGhs}
                        onChange={(e) => setFormData({ ...formData, priceGhs: e.target.value })}
                        placeholder="500"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Set your own price for this service
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Price Type
                      </label>
                      <select
                        value={formData.priceType}
                        onChange={(e) => setFormData({ ...formData, priceType: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground"
                      >
                        {PRICE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {PRICE_TYPES.find(t => t.value === formData.priceType)?.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Estimated Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      placeholder="e.g., 3"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingService ? 'Update Service' : 'Add Service'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      {profile.services.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<DollarSign className="h-6 w-6" />}
              title="No Services Yet"
              description="Add your first service to start receiving client requests."
            />
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profile.services.map((service) => (
            <Card key={service.id} className="relative group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{service.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {PRICE_TYPES.find(t => t.value === service.priceType)?.label}
                  </Badge>
                </div>
                
                {service.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {formatPrice(service.priceGhs, service.priceType)}
                  </div>
                  {service.durationDays && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {service.durationDays} day{service.durationDays > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Tips for Setting Service Prices</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Research market rates for similar services in your area</li>
            <li>• Consider your experience level and certifications</li>
            <li>• Factor in travel costs if you serve multiple regions</li>
            <li>• Use "Negotiable" for complex projects that vary in scope</li>
            <li>• Update your prices regularly to stay competitive</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
