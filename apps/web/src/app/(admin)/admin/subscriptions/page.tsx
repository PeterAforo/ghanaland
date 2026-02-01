'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api';

interface Feature {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  tierType: string;
  priceMonthlyGhs: number;
  priceYearlyGhs: number;
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
  sortOrder: number;
}

const TIER_TYPES = [
  { value: 'FREE', label: 'Free' },
  { value: 'BUYER_PRO', label: 'Buyer' },
  { value: 'SELLER_PRO', label: 'Seller' },
  { value: 'PROFESSIONAL_PRO', label: 'Professional' },
  { value: 'AGENT_PRO', label: 'Agent' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    tierType: 'FREE',
    priceMonthlyGhs: 0,
    priceYearlyGhs: 0,
    features: [] as string[],
    limits: {} as Record<string, number>,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchPlans();
    fetchFeatures();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/admin/plans`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/admin/features`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setFeatures(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      tierType: plan.tierType,
      priceMonthlyGhs: Number(plan.priceMonthlyGhs),
      priceYearlyGhs: Number(plan.priceYearlyGhs),
      features: plan.features,
      limits: plan.limits || {},
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      tierType: 'FREE',
      priceMonthlyGhs: 0,
      priceYearlyGhs: 0,
      features: [],
      limits: {},
      sortOrder: plans.length + 1,
      isActive: true,
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingPlan
        ? `${API_BASE_URL}/api/v1/subscriptions/admin/plans/${editingPlan.id}`
        : `${API_BASE_URL}/api/v1/subscriptions/admin/plans`;

      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        await fetchPlans();
        setEditingPlan(null);
        setIsCreating(false);
      } else {
        alert(data.error?.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        await fetchPlans();
      } else {
        alert(data.error?.message || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete plan');
    }
  };

  const toggleFeature = (featureKey: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(featureKey)
        ? prev.features.filter((f) => f !== featureKey)
        : [...prev.features, featureKey],
    }));
  };

  const updateLimit = (key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      limits: { ...prev.limits, [key]: value },
    }));
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage pricing plans and features</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Plan Editor */}
      {(isCreating || editingPlan) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Professional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., professional"
                  disabled={!!editingPlan}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tierType">Tier Type</Label>
                <select
                  id="tierType"
                  value={formData.tierType}
                  onChange={(e) => setFormData({ ...formData, tierType: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  {TIER_TYPES.map((tier) => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Monthly Price (GHS)</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  value={formData.priceMonthlyGhs}
                  onChange={(e) => setFormData({ ...formData, priceMonthlyGhs: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Yearly Price (GHS)</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  value={formData.priceYearlyGhs}
                  onChange={(e) => setFormData({ ...formData, priceYearlyGhs: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the plan"
              />
            </div>

            {/* Features Selection */}
            <div className="space-y-4">
              <Label>Features</Label>
              {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryFeatures.map((feature) => (
                      <label
                        key={feature.key}
                        className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                          formData.features.includes(feature.key)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature.key)}
                          onChange={() => toggleFeature(feature.key)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            formData.features.includes(feature.key)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input'
                          }`}
                        >
                          {formData.features.includes(feature.key) && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm">{feature.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Limits */}
            <div className="space-y-4">
              <Label>Limits (-1 for unlimited)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['maxListings', 'maxFavorites', 'maxSavedSearches', 'maxAlerts', 'maxFeatured', 'maxTeamMembers', 'maxServices', 'maxLeads'].map((limitKey) => (
                  <div key={limitKey} className="space-y-1">
                    <Label className="text-xs">{limitKey}</Label>
                    <Input
                      type="number"
                      value={formData.limits[limitKey] ?? ''}
                      onChange={(e) => updateLimit(limitKey, parseInt(e.target.value) || 0)}
                      placeholder="-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPlan(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{plan.tierType}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    GHS {Number(plan.priceMonthlyGhs).toLocaleString()}/mo
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                  >
                    {expandedPlan === plan.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            {expandedPlan === plan.id && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Features ({plan.features.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Limits</h4>
                    <div className="text-sm space-y-1">
                      {Object.entries(plan.limits || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{value === -1 ? 'Unlimited' : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
