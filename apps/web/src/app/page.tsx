import Link from 'next/link';
import { MapPin, Shield, Banknote, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">
            Buy & Sell Land in Ghana
            <span className="block text-primary">With Confidence</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Secure escrow transactions, verified land titles, and professional services
            to make your land purchase safe and transparent.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/listings">
              <Button variant="primary" size="lg">
                Browse Listings
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="secondary" size="lg">
                List Your Land
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-foreground">
            Why Choose Ghana Lands?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Verified Listings"
              description="All listings undergo verification to ensure legitimacy and clear ownership."
            />
            <FeatureCard
              icon={<Banknote className="h-6 w-6" />}
              title="Secure Escrow"
              description="Your payment is held securely until all conditions are met."
            />
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="Accurate Maps"
              description="View exact parcel boundaries with GPS coordinates and surveys."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Professional Services"
              description="Connect with surveyors, lawyers, and agents for assistance."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground">
            Ready to find your perfect land?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Join thousands of buyers and sellers on Ghana&apos;s trusted land marketplace.
          </p>
          <Link href="/auth/register">
            <Button variant="secondary" size="lg" className="mt-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-bold text-foreground">Ghana Lands</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Secure land transactions in Ghana.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Platform</h4>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/listings" className="hover:text-foreground">Browse Listings</Link></li>
                <li><Link href="/professionals" className="hover:text-foreground">Find Professionals</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ghana Lands. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
