import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  GitBranch,
  ArrowUpRight,
  Braces,
  FlaskConical,
  Coins,
  Globe,
  Star,
  Menu,
  X as XIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeToggle";
import { VLogoFull } from "@/components/VLogo";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const painCards = [
  {
    title: "Prompts buried in source code",
    body: "Your best prompts live in .py files and string literals. Changing one means a full redeploy. Testing a variation means branching your entire codebase.",
  },
  {
    title: "No history, no rollback",
    body: "When a prompt change tanks your output quality, can you roll back in 30 seconds? Right now, probably not. You're digging through git blame hoping to find what changed.",
  },
  {
    title: "Zero visibility across environments",
    body: "Your dev prompt is different from staging which is different from prod — but nobody knows which version is running where, or why it's behaving differently.",
  },
];

const features = [
  { icon: GitBranch, title: "Version control", body: "Every save creates an immutable version. Tag releases, compare diffs, and rollback to any previous version instantly." },
  { icon: ArrowUpRight, title: "Environment promotion", body: "Separate dev, staging, and prod prompts. Promote a version when it's ready — just like a code deploy." },
  { icon: Braces, title: "Variable injection", body: "Write prompts with {{variables}}. Versera injects them at resolve time — no string concatenation in your app code." },
  { icon: FlaskConical, title: "A/B testing", body: "Split traffic between two prompt versions. Log quality scores and get statistical significance signals automatically." },
  { icon: Coins, title: "Credit-based pricing", body: "Pay only for what you use. 1 credit per resolve call. Credits never expire. Start free with 1,000 credits." },
  { icon: Globe, title: "Any LLM, any framework", body: "Works with Claude, GPT, Gemini, or any model. Plain HTTP API — integrate with Python, JS, Go, or anything else." },
];

const plans = [
  { name: "Starter", price: 9, credits: "10,000", resolves: "~10K resolves", featured: false },
  { name: "Growth", price: 49, credits: "100,000", resolves: "~100K resolves", featured: true },
  { name: "Scale", price: 199, credits: "500,000", resolves: "~500K resolves", featured: false },
];

/* ------------------------------------------------------------------ */
/*  Code block content                                                 */
/* ------------------------------------------------------------------ */
const codeLines: { text: string; type: "comment" | "code" | "string" | "keyword" | "blank" }[] = [
  { text: "// 1. Push your prompt (from CI or dashboard)", type: "comment" },
  { text: "const response = await fetch(", type: "code" },
  { text: "  'https://api.versera.dev/v1/prompts',", type: "string" },
  { text: "  {", type: "code" },
  { text: "    method: 'POST',", type: "code" },
  { text: "    headers: {", type: "code" },
  { text: "      'Authorization': 'Bearer YOUR_JWT',", type: "string" },
  { text: "      'Content-Type': 'application/json'", type: "string" },
  { text: "    },", type: "code" },
  { text: "    body: JSON.stringify({", type: "code" },
  { text: "      name: 'summarize-doc',", type: "string" },
  { text: "      environment: 'prod',", type: "string" },
  { text: "      template: 'Summarize {{document}} in {{tone}} style.',", type: "string" },
  { text: "      message: 'Improved tone handling'", type: "string" },
  { text: "    })", type: "code" },
  { text: "  }", type: "code" },
  { text: ")", type: "code" },
  { text: "", type: "blank" },
  { text: "// 2. Resolve at runtime (costs 1 credit)", type: "comment" },
  { text: "const { template } = await fetch(", type: "code" },
  { text: "  'https://api.versera.dev/v1/resolve/summarize-doc'", type: "string" },
  { text: "    + '?tone=professional&document=' + encodeURIComponent(doc),", type: "code" },
  { text: "  { headers: { 'x-api-key': 'vrs_live_••••' } }", type: "string" },
  { text: ").then(r => r.json())", type: "code" },
  { text: "", type: "blank" },
  { text: "// 3. Use it directly with your LLM", type: "comment" },
  { text: "const result = await anthropic.messages.create({", type: "code" },
  { text: "  model: 'claude-sonnet-4-6',", type: "string" },
  { text: "  messages: [{ role: 'user', content: template }]", type: "code" },
  { text: "})", type: "code" },
];

function colorLine(line: typeof codeLines[number]) {
  if (line.type === "comment") return "text-tertiary-foreground";
  if (line.type === "string") return "text-emerald-300 dark:text-emerald-300";
  return "text-foreground";
}

/* ------------------------------------------------------------------ */
/*  Dashboard mockup rows                                              */
/* ------------------------------------------------------------------ */
const mockPrompts = [
  { name: "summarize-doc", ver: "v4", env: "prod", status: "Active", updated: "2 hours ago" },
  { name: "classify-intent", ver: "v2", env: "staging", status: "Active", updated: "5 hours ago" },
  { name: "extract-entities", ver: "v7", env: "prod", status: "Active", updated: "1 day ago" },
  { name: "generate-reply", ver: "v1", env: "dev", status: "Draft", updated: "2 days ago" },
];

function envBadgeClass(env: string) {
  if (env === "prod") return "bg-primary/15 text-primary";
  if (env === "staging") return "bg-amber-500/15 text-amber-500 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

/* ================================================================== */
/*  LANDING PAGE                                                       */
/* ================================================================== */
export default function Landing() {
  const codeRef = useRef<HTMLPreElement>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const { theme, toggle } = useTheme();

  const copyCode = () => {
    const text = codeLines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* ====== NAV ====== */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <VLogoFull size={28} />
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-sm">
            <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <button onClick={toggle} className="text-muted-foreground hover:text-foreground transition-colors">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started free
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:hidden">
            <button onClick={toggle} className="text-muted-foreground hover:text-foreground">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="text-muted-foreground hover:text-foreground" onClick={() => setMobileNav((v) => !v)}>
              {mobileNav ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileNav && (
          <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur-md px-5 py-4 space-y-3">
            <Link to="/docs" onClick={() => setMobileNav(false)} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
            <Link to="/login" onClick={() => setMobileNav(false)} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/signup" onClick={() => setMobileNav(false)} className="block rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-center">Get started free</Link>
          </div>
        )}
      </nav>

      {/* ====== HERO ====== */}
      <Section className="relative flex min-h-[85vh] flex-col items-center justify-center px-5 pt-14 text-center">
        <motion.div
          variants={fadeUp}
          className="mb-6 inline-flex items-center rounded border border-border bg-transparent px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          Prompt infrastructure for LLM apps
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-foreground"
        >
          Your prompts deserve
          <br />
          version control
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-[560px] text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          Stop hardcoding prompts in your source code. Versera gives you Git-style
          versioning, environment promotion, and a resolve API — so you can ship
          prompt changes without redeploying your app.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start for free
          </Link>
          <Link
            to="/docs"
            className="rounded-md border border-strong-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:border-tertiary-foreground hover:text-foreground transition-colors"
          >
            View docs
          </Link>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-5 text-xs text-tertiary-foreground">
          Free to start · No credit card required · 1,000 credits included
        </motion.p>
      </Section>

      {/* ====== PROBLEM ====== */}
      <Section className="mx-auto max-w-5xl px-5 py-24">
        <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-12">
          Sound familiar?
        </motion.h2>

        <div className="grid gap-5 md:grid-cols-3">
          {painCards.map((c) => (
            <motion.div
              key={c.title}
              variants={fadeUp}
              className="rounded-lg border border-border bg-card p-6 border-l-2 border-l-primary"
            >
              <h3 className="text-base font-semibold mb-2 text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ====== ELI5 SECTION ====== */}
      <Section className="mx-auto max-w-3xl px-5 py-24">
        <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-12">
          Wait... explain it like I'm 10
        </motion.h2>

        <motion.div variants={fadeUp} className="rounded-lg bg-card border border-border border-l-2 border-l-primary p-6 sm:p-8">
          <div className="space-y-4">
            {/* Child */}
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">K</div>
              <div>
                <div className="rounded-lg bg-muted px-4 py-2.5 text-sm text-foreground/80">So like... what IS Versera actually?</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 ml-1">12:01 PM</p>
              </div>
            </div>
            {/* Versera */}
            <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">V</div>
              <div>
                <div className="rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">You know how you save different versions of your homework? Like homework_v1, homework_v2, homework_FINAL? Versera does that for AI instructions.</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 mr-1 text-right">12:01 PM</p>
              </div>
            </div>
            {/* Child */}
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">K</div>
              <div>
                <div className="rounded-lg bg-muted px-4 py-2.5 text-sm text-foreground/80">Oh! And what's an AI instruction?</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 ml-1">12:02 PM</p>
              </div>
            </div>
            {/* Versera */}
            <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">V</div>
              <div>
                <div className="rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">When you tell an AI "summarize this in a funny way" — that instruction is called a prompt. Developers write thousands of these.</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 mr-1 text-right">12:02 PM</p>
              </div>
            </div>
            {/* Child */}
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">K</div>
              <div>
                <div className="rounded-lg bg-muted px-4 py-2.5 text-sm text-foreground/80">And they just... forget which one worked?</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 ml-1">12:03 PM</p>
              </div>
            </div>
            {/* Versera */}
            <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">V</div>
              <div>
                <div className="rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">Exactly! They change it, it breaks, and they can't remember what it said before. Versera saves every version so they can go back instantly.</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 mr-1 text-right">12:03 PM</p>
              </div>
            </div>
            {/* Child */}
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">K</div>
              <div>
                <div className="rounded-lg bg-muted px-4 py-2.5 text-sm text-foreground/80">That sounds really useful actually 😮</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 ml-1">12:04 PM</p>
              </div>
            </div>
            {/* Versera */}
            <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">V</div>
              <div>
                <div className="rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">Right? And it costs less than a cup of coffee to get started.</div>
                <p className="text-[10px] text-tertiary-foreground mt-1 mr-1 text-right">12:04 PM</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Makes sense now?</p>
            <Link
              to="/signup"
              className="inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started free →
            </Link>
          </div>
        </motion.div>
      </Section>

      {/* ====== CODE EXAMPLE ====== */}
      <Section className="mx-auto max-w-4xl px-5 py-24">
        <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-3">
          Fix it with three API calls
        </motion.h2>
        <motion.p variants={fadeUp} className="text-center text-muted-foreground mb-10">
          Integrate in minutes. Works with any LLM.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="relative rounded-lg border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <button
              onClick={copyCode}
              className="rounded px-2.5 py-1 text-xs text-tertiary-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Copy
            </button>
          </div>

          <pre
            ref={codeRef}
            className="overflow-x-auto p-5 text-[13px] leading-6 font-mono"
          >
            {codeLines.map((line, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-8 shrink-0 select-none text-right text-strong-border pr-4">
                  {line.type !== "blank" ? i + 1 : ""}
                </span>
                <span className={colorLine(line)}>{line.text}</span>
              </div>
            ))}
          </pre>
        </motion.div>
      </Section>

      {/* ====== FEATURES ====== */}
      <Section className="mx-auto max-w-5xl px-5 py-24">
        <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-12">
          Everything your prompts need
        </motion.h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="rounded-lg border border-border bg-card p-7"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ====== DASHBOARD PREVIEW ====== */}
      <Section className="mx-auto max-w-5xl px-5 py-24">
        <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-3">
          A dashboard built for developers
        </motion.h2>
        <motion.p variants={fadeUp} className="text-center text-muted-foreground mb-12">
          Manage all your prompts, versions, and API keys from one clean interface.
        </motion.p>

        <motion.div variants={fadeUp} className="relative">
          <div className="relative rounded-lg border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 text-xs text-tertiary-foreground">versera.dev/dashboard</span>
            </div>

            <div className="flex min-h-[420px]">
              <div className="hidden md:flex w-52 flex-col border-r border-border bg-background p-4">
                <VLogoFull size={20} className="mb-6" />
                {["Dashboard", "Prompts", "API Keys", "Billing"].map((item, idx) => (
                  <span
                    key={item}
                    className={`rounded-md px-3 py-1.5 text-sm mb-1 ${idx === 0 ? "bg-muted text-foreground" : "text-tertiary-foreground"}`}
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex-1 p-6">
                <p className="text-lg font-semibold mb-5">Good morning, Alex</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Total Prompts", value: "12" },
                    { label: "API Calls Today", value: "1,847" },
                    { label: "Credits", value: "8,420" },
                    { label: "Active Versions", value: "31" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-md border border-border bg-card p-4">
                      <p className="text-[11px] text-tertiary-foreground">{m.label}</p>
                      <p className="mt-1 text-xl font-semibold">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-tertiary-foreground">
                        <th className="px-4 py-2.5 font-medium">Name</th>
                        <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Version</th>
                        <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Env</th>
                        <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Status</th>
                        <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPrompts.map((p) => (
                        <tr key={p.name} className="border-b border-border last:border-0">
                          <td className="px-4 py-2.5 font-mono text-xs font-medium">{p.name}</td>
                          <td className="px-4 py-2.5 font-mono text-xs hidden sm:table-cell">{p.ver}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${envBadgeClass(p.env)}`}>
                              {p.env}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs hidden lg:table-cell text-muted-foreground">{p.status}</td>
                          <td className="px-4 py-2.5 text-xs hidden lg:table-cell text-tertiary-foreground">{p.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ====== TESTIMONIALS ====== */}
      <TestimonialsSection />

      {/* ====== PRICING ====== */}
      <Section className="mx-auto max-w-4xl px-5 py-24">
        <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-3">
          Simple, usage-based pricing
        </motion.h2>
        <motion.p variants={fadeUp} className="text-center text-muted-foreground mb-12">
          Buy credits once. Use them forever. No subscriptions, no surprises.
        </motion.p>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <motion.div
              key={p.name}
              variants={fadeUp}
              className={`rounded-lg border p-6 flex flex-col bg-card ${
                p.featured ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-full bg-primary/10 border border-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Most popular
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold mb-1">${p.price}</p>
              <p className="text-sm text-muted-foreground mb-1">{p.credits} credits</p>
              <p className="text-xs text-tertiary-foreground mb-6">{p.resolves}</p>
              <Link
                to="/signup"
                className={`mt-auto text-center rounded-md py-2.5 text-sm font-medium transition-colors ${
                  p.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground/80 hover:bg-muted/80"
                }`}
              >
                Get started
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p variants={fadeUp} className="mt-8 text-center text-xs text-tertiary-foreground">
          Every new account gets 1,000 free credits. No credit card required to start.
        </motion.p>
      </Section>

      {/* ====== CTA BANNER ====== */}
      <Section className="mx-auto max-w-6xl px-5 py-24">
        <motion.div
          variants={fadeUp}
          className="border-t border-b border-border bg-card px-8 py-16 text-center rounded-lg"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Ready to version your prompts?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join developers who've stopped hardcoding prompts and started shipping faster.
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started free
          </Link>
        </motion.div>
      </Section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-border bg-background px-5 py-14">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <VLogoFull size={20} />
            <p className="mt-2 text-sm text-tertiary-foreground">
              Prompt version control for LLM apps
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary-foreground mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-tertiary-foreground">
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/api-keys" className="hover:text-foreground transition-colors">API Keys</Link></li>
              <li><Link to="/billing" className="hover:text-foreground transition-colors">Billing</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary-foreground mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-tertiary-foreground">
              <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              <li><a href="https://github.com/steevy-cpu/versera-app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="https://x.com/CelestinSt29387" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Twitter / X</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-tertiary-foreground mb-3">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-tertiary-foreground">
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-strong-border">
          © 2026 Versera. Built for developers.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials Section                                               */
/* ------------------------------------------------------------------ */
function TestimonialsSection() {
  const { data: testimonials } = useTestimonials();
  const hasApproved = !!testimonials?.length;

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async () => {
    setFormError("");
    if (!name.trim() || !role.trim() || !content.trim()) {
      setFormError("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/v1/testimonials", { name: name.trim(), role: role.trim(), content: content.trim(), rating });
      setSubmitted(true);
    } catch (err) {
      console.log("POST /v1/testimonials failed — endpoint may not exist yet", err);
      setFormError("Submission failed. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section className="mx-auto max-w-5xl px-5 py-24">
      <motion.h2 variants={fadeUp} className="text-center text-3xl font-bold mb-4">
        Share your experience
      </motion.h2>
      <motion.p variants={fadeUp} className="text-center text-muted-foreground max-w-[500px] mx-auto mb-12">
        Used Versera? We'd love to hear from you. Real testimonials from real developers.
      </motion.p>

      {/* Approved testimonials */}
      {hasApproved && (
        <div className="grid gap-5 md:grid-cols-3 mb-12">
          {testimonials!.map((t) => (
            <motion.div
              key={t.id}
              variants={fadeUp}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-base ${i < t.rating ? "text-primary" : "text-strong-border"}`}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-tertiary-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Placeholder cards when no approved testimonials */}
      {!hasApproved && (
        <div className="grid gap-5 md:grid-cols-3 mb-12">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="rounded-lg border border-dashed border-strong-border bg-card p-10 flex items-center justify-center min-h-[160px]"
            >
              <p className="text-sm text-strong-border">Your review here</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Submission form */}
      <motion.div variants={fadeUp} className="mx-auto max-w-[640px]">
        {submitted ? (
          <div className="rounded-lg bg-card border border-border p-8 text-center">
            <p className="text-primary font-medium mb-2">Thank you!</p>
            <p className="text-sm text-muted-foreground">
              Your testimonial has been submitted for review. We'll feature it on the site once approved.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-card border border-border p-8 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-strong-border focus:outline-none focus:border-primary/50"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Engineer at Acme"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-strong-border focus:outline-none focus:border-primary/50"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="What problem did Versera solve for you? What's your favorite feature?"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-strong-border focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                    <Star className={`h-5 w-5 transition-colors ${s <= rating ? "fill-primary text-primary" : "text-strong-border hover:text-tertiary-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit testimonial"}
            </button>
          </div>
        )}
      </motion.div>
    </Section>
  );
}
