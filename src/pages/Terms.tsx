import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "Acceptance of terms",
    body: "By using Versera you agree to these terms. If you do not agree, please do not use the service.",
  },
  {
    title: "Description of service",
    body: "Versera provides prompt version control infrastructure for developers building on large language models. The service includes a REST API, web dashboard, and credit-based billing system.",
  },
  {
    title: "Account registration",
    body: "You must provide accurate information when creating an account. You are responsible for your account security and API keys. Do not share your credentials with unauthorized parties.",
  },
  {
    title: "Credits and billing",
    body: "Credits are purchased as one-time payments and never expire. All sales are final. Refunds are considered on a case-by-case basis within 7 days of purchase.",
  },
  {
    title: "Acceptable use",
    body: "You may not use Versera to generate harmful, illegal, or abusive content. Rate limits apply to all accounts. We reserve the right to suspend accounts that violate this policy.",
  },
  {
    title: "Data and privacy",
    body: "See our Privacy Policy for details on how we handle your data. We store your prompts and version history to provide the service.",
  },
  {
    title: "Termination",
    body: "You may delete your account at any time from Settings. We may terminate accounts that violate these terms with or without prior notice.",
  },
  {
    title: "Limitation of liability",
    body: 'Versera is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from the use of our service.',
  },
  {
    title: "Changes to terms",
    body: "We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.",
  },
  {
    title: "Contact",
    body: "Questions about these terms? Email legal@versera.dev and we'll get back to you promptly.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased">
      <div className="mx-auto max-w-[760px] px-5 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: April 5, 2026</p>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
                <span className="text-[#7F77DD] font-bold">{i + 1}.</span>
                {s.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-[1.8]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
