import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="mx-auto max-w-[760px] px-5 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 5, 2026</p>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
              <span className="text-primary font-bold">1.</span>
              What we use
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.8]">
              Versera uses <strong className="text-foreground">localStorage</strong> (a browser storage mechanism) to manage your session — specifically your authentication token and basic user information. This keeps you logged in between visits.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
              <span className="text-primary font-bold">2.</span>
              No tracking cookies
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.8]">
              We do not use any third-party tracking cookies, analytics cookies, or advertising cookies. There are no cookie consent banners because there are no cookies to consent to.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
              <span className="text-primary font-bold">3.</span>
              Third-party services
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.8]">
              Stripe (our payment processor) may set its own cookies during the checkout process. These are governed by Stripe's own cookie policy.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
              <span className="text-primary font-bold">4.</span>
              Contact
            </h2>
            <p className="text-sm text-muted-foreground leading-[1.8]">
              Questions? Email privacy@versera.dev.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
