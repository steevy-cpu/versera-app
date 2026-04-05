import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "Information we collect",
    body: (
      <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-400 leading-[1.8]">
        <li><strong className="text-zinc-300">Account info:</strong> name, email, password hash</li>
        <li><strong className="text-zinc-300">Usage data:</strong> API calls, credit usage, prompt content you create</li>
        <li><strong className="text-zinc-300">Payment info:</strong> processed by Stripe — we never see your card details</li>
      </ul>
    ),
  },
  {
    title: "How we use your information",
    body: (
      <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-400 leading-[1.8]">
        <li>To provide and improve the service</li>
        <li>To send transactional emails (account created, low credits warning)</li>
        <li>We never sell your data to third parties</li>
      </ul>
    ),
  },
  {
    title: "Data storage",
    body: (
      <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-400 leading-[1.8]">
        <li>Stored on Supabase (PostgreSQL) in US-East region</li>
        <li>Prompt templates are stored to provide version history — they are private to your account</li>
      </ul>
    ),
  },
  {
    title: "Third-party services",
    body: (
      <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-400 leading-[1.8]">
        <li>Stripe for payments</li>
        <li>Railway for API hosting</li>
        <li>Supabase for database</li>
        <li>Resend for transactional email</li>
      </ul>
    ),
  },
  {
    title: "Your rights",
    body: (
      <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-400 leading-[1.8]">
        <li>Access your data via the dashboard at any time</li>
        <li>Delete your account and all data from Settings</li>
        <li>Email privacy@versera.dev for data requests</li>
      </ul>
    ),
  },
  {
    title: "Cookies",
    body: "We use localStorage for session management. No third-party tracking cookies are used.",
  },
  {
    title: "Contact",
    body: "For privacy-related questions, email privacy@versera.dev.",
  },
];

export default function Privacy() {
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

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: April 5, 2026</p>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-3">
                <span className="text-[#7F77DD] font-bold">{i + 1}.</span>
                {s.title}
              </h2>
              {typeof s.body === "string" ? (
                <p className="text-sm text-zinc-400 leading-[1.8]">{s.body}</p>
              ) : (
                s.body
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
