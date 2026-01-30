'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  Rocket,
  Loader2,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

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
  sortOrder: number;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  FREE: <Zap className="h-6 w-6" />,
  SELLER_PRO: <Rocket className="h-6 w-6" />,
  BUYER_PRO: <Crown className="h-6 w-6" />,
  PROFESSIONAL_PRO: <Briefcase className="h-6 w-6" />,
  AGENT_PRO: <Building2 className="h-6 w-6" />,
  ENTERPRISE: <Building2 className="h-6 w-6" />,
};

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-800',
  SELLER_PRO: 'bg-green-100 text-green-800',
  BUYER_PRO: 'bg-blue-100 text-blue-800',
  PROFESSIONAL_PRO: 'bg-orange-100 text-orange-800',
  AGENT_PRO: 'bg-purple-100 text-purple-800',
  ENTERPRISE: 'bg-amber-100 text-amber-800',
};

const FEATURE_LABELS: Record<string, string> = {
  browse_listings: 'Browse all listings',
  save_favorites: 'Save favorites',
  send_inquiries: 'Send inquiries',
  featured_listings: 'Featured listings',
  listing_analytics: 'Listing analytics dashboard',
  bulk_upload: 'Bulk listing upload',
  priority_verification: 'Priority verification (24-48h)',
  virtual_tours: '360° virtual tours',
  saved_search_alerts: 'Saved search alerts',
  price_drop_alerts: 'Price drop alerts',
  exclusive_listings: 'Early access to new listings',
  due_diligence_basic: 'Basic due diligence reports',
  due_diligence_comprehensive: 'Comprehensive due diligence',
  lead_generation: 'Lead generation',
  verified_badge: 'Verified professional badge',
  priority_placement: 'Priority in search results',
  professional_profile: 'Professional profile page',
  service_catalog: 'Service catalog listing',
  client_management: 'Client management tools',
  booking_calendar: 'Booking calendar',
  review_management: 'Review management',
  white_label: 'White-label portal',
  team_management: 'Team management',
  api_access: 'API access',
  dedicated_support: 'Dedicated support',
};

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchCurrentSubscription();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/plans`);
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

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/api/v1/subscriptions/my-subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentPlan(data.data.plan.slug);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'MONTHLY' ? plan.priceMonthlyGhs : plan.priceYearlyGhs;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.priceMonthlyGhs * 12;
    const yearlyPrice = plan.priceYearlyGhs;
    if (monthlyTotal <= 0) return 0;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features to buy, sell, and manage land more effectively.
            All plans include our core marketplace features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'MONTHLY'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'YEARLY'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save up to 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.slug;
            const isPopular = plan.tierType === 'AGENT_PRO';
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isPopular ? 'border-primary shadow-lg scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 rounded-full ${TIER_COLORS[plan.tierType]} flex items-center justify-center mx-auto mb-3`}>
                    {TIER_ICONS[plan.tierType]}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold">
                        {price === 0 ? 'Free' : `GHS ${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'YEARLY' && savings > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {savings}% vs monthly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.slice(0, 8).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{FEATURE_LABELS[feature] || feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 8 && (
                      <li className="text-sm text-muted-foreground">
                        +{plan.features.length - 8} more features
                      </li>
                    )}
                  </ul>

                  {/* Limits */}
                  {plan.limits && Object.keys(plan.limits).length > 0 && (
                    <div className="text-xs text-muted-foreground mb-4 space-y-1">
                      {plan.limits.maxListings && (
                        <p>
                          {plan.limits.maxListings === -1 ? 'Unlimited' : plan.limits.maxListings} listings
                        </p>
                      )}
                      {plan.limits.maxTeamMembers && (
                        <p>Up to {plan.limits.maxTeamMembers} team members</p>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  {isCurrentPlan ? (
                    <Button variant="secondary" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isAuthenticated ? (
                    <Link href={`/dashboard/subscription?plan=${plan.slug}&cycle=${billingCycle}`}>
                      <Button
                        variant={isPopular ? 'primary' : 'outline'}
                        className="w-full"
                      >
                        {price === 0 ? 'Get Started' : 'Upgrade'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/auth/register?plan=${plan.slug}`}>
                      <Button
                        variant={isPopular ? 'primary' : 'outline'}
                        className="w-full"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <tr key={key} className="border-b">
                    <td className="py-3 px-4 text-sm">{label}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.features.includes(key) ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your billing period.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept Mobile Money (MTN, Vodafone, AirtelTigo), bank cards via Flutterwave, and bank transfers for Enterprise plans.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                The Free plan is always available with basic features. For Pro plans, contact us for a 14-day trial for Enterprise customers.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="font-semibold mb-2">What happens when I cancel?</h3>
              <p className="text-muted-foreground text-sm">
                You'll retain access to Pro features until the end of your billing period. After that, your account reverts to the Free plan and your data is preserved.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-primary/5 rounded-2xl p-12">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            For large agencies, developers, or government organizations, we offer custom Enterprise plans with dedicated support and white-label options.
          </p>
          <Link href="/contact">
            <Button variant="primary" size="lg">
              Contact Sales
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
