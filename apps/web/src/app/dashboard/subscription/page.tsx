'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  Check,
  CreditCard,
  Calendar,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  tierType: string;
  priceMonthlyGhs: number;
  priceYearlyGhs: number;
  features: string[];
}

interface UserSubscription {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

const FEATURE_LABELS: Record<string, string> = {
  browse_listings: 'Browse all listings',
  save_favorites: 'Save favorites',
  send_inquiries: 'Send inquiries',
  featured_listings: 'Featured listings',
  listing_analytics: 'Listing analytics dashboard',
  bulk_upload: 'Bulk listing upload',
  priority_verification: 'Priority verification',
  virtual_tours: '360° virtual tours',
  saved_search_alerts: 'Saved search alerts',
  price_drop_alerts: 'Price drop alerts',
  exclusive_listings: 'Early access to listings',
  due_diligence_basic: 'Basic due diligence',
  due_diligence_comprehensive: 'Comprehensive due diligence',
  lead_generation: 'Lead generation',
  verified_badge: 'Verified badge',
  priority_placement: 'Priority placement',
  white_label: 'White-label portal',
  team_management: 'Team management',
  api_access: 'API access',
  dedicated_support: 'Dedicated support',
};

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const planSlug = searchParams.get('plan');
  const cycleParam = searchParams.get('cycle');

  useEffect(() => {
    if (cycleParam === 'YEARLY') {
      setBillingCycle('YEARLY');
    }
    if (planSlug) {
      setSelectedPlan(planSlug);
    }
    fetchData();
  }, [planSlug, cycleParam]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const [subRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/subscriptions/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/subscriptions/plans`),
      ]);

      const [subData, plansData] = await Promise.all([subRes.json(), plansRes.json()]);

      if (subData.success) {
        setSubscription(subData.data);
      }
      if (plansData.success) {
        setPlans(plansData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planSlug: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planSlug, billingCycle }),
      });

      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
        setSelectedPlan(null);
      } else {
        alert(data.error?.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (immediate: boolean = false) => {
    if (!confirm(immediate 
      ? 'Are you sure you want to cancel immediately? You will lose access to Pro features right away.'
      : 'Are you sure you want to cancel? You will retain access until the end of your billing period.'
    )) {
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ immediate }),
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Current Subscription */}
      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
                <p className="text-muted-foreground">{subscription.plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  GHS {subscription.billingCycle === 'MONTHLY' 
                    ? subscription.plan.priceMonthlyGhs.toLocaleString()
                    : subscription.plan.priceYearlyGhs.toLocaleString()
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  per {subscription.billingCycle === 'MONTHLY' ? 'month' : 'year'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Current Period</p>
                  <p className="font-medium">
                    {format(new Date(subscription.currentPeriodStart), 'MMM d')} - {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Billing Cycle</p>
                  <p className="font-medium">{subscription.billingCycle}</p>
                </div>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">
                  Your subscription will end on {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                </p>
              </div>
            )}

            {/* Features */}
            <div>
              <h4 className="font-medium mb-3">Included Features</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {subscription.plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{FEATURE_LABELS[feature] || feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Link href="/pricing">
                <Button variant="outline">
                  Change Plan
                </Button>
              </Link>
              {!subscription.cancelAtPeriodEnd && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleCancel(false)}
                  disabled={isProcessing}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground mb-6">
              You're currently on the Free plan. Upgrade to unlock premium features.
            </p>
            <Link href="/pricing">
              <Button variant="primary">
                View Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Section (if plan selected from pricing page) */}
      {selectedPlan && !subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              const plan = plans.find(p => p.slug === selectedPlan);
              if (!plan) return null;

              const price = billingCycle === 'MONTHLY' ? plan.priceMonthlyGhs : plan.priceYearlyGhs;

              return (
                <>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">GHS {price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        per {billingCycle === 'MONTHLY' ? 'month' : 'year'}
                      </p>
                    </div>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Billing Cycle</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBillingCycle('MONTHLY')}
                        className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                          billingCycle === 'MONTHLY'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">Monthly</p>
                        <p className="text-sm text-muted-foreground">
                          GHS {plan.priceMonthlyGhs.toLocaleString()}/mo
                        </p>
                      </button>
                      <button
                        onClick={() => setBillingCycle('YEARLY')}
                        className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                          billingCycle === 'YEARLY'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">Yearly</p>
                        <p className="text-sm text-muted-foreground">
                          GHS {plan.priceYearlyGhs.toLocaleString()}/yr
                        </p>
                        <Badge variant="success" className="mt-1">Save 17%</Badge>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
                    <Shield className="h-5 w-5" />
                    <p className="text-sm">
                      Secure payment via Hubtel or Flutterwave. Cancel anytime.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe(selectedPlan)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {!selectedPlan && !subscription && plans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.filter(p => p.tierType !== 'FREE').map((plan) => (
              <Card key={plan.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <p className="text-2xl font-bold mb-4">
                    GHS {plan.priceMonthlyGhs.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPlan(plan.slug)}
                  >
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
