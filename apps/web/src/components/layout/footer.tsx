import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-bold text-foreground text-lg">Ghana Lands</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ghana's trusted platform for secure land transactions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/listings" className="hover:text-foreground transition-colors">Browse Listings</Link></li>
              <li><Link href="/listings/map" className="hover:text-foreground transition-colors">Map View</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/auth/register" className="hover:text-foreground transition-colors">Sell Land</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><a href="mailto:support@ghanalands.com" className="hover:text-foreground transition-colors">support@ghanalands.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ghana Lands. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>🇬🇭 Made in Ghana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
