import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Plus, X, Loader2, Menu, Sun, Moon, Github, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/ThemeToggle";
import { VLogoFull } from "@/components/VLogo";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://api.versera.dev";

/* ------------------------------------------------------------------ */
/*  Nav structure                                                      */
/* ------------------------------------------------------------------ */
const NAV = [
  {
    label: "GETTING STARTED",
    items: [
      { title: "Quick start", id: "quick-start" },
      { title: "Authentication", id: "authentication" },
      { title: "Credits & limits", id: "credits-limits" },
      { title: "Node.js SDK", id: "nodejs-sdk" },
    ],
  },
  {
    label: "CORE API",
    items: [
      { title: "Resolve a prompt", id: "resolve" },
      { title: "Create a prompt", id: "create-prompt" },
      { title: "List prompts", id: "list-prompts" },
      { title: "Get a prompt", id: "get-prompt" },
      { title: "Save a version", id: "save-version" },
      { title: "Rollback a version", id: "rollback" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { title: "API keys", id: "api-keys" },
      { title: "Billing", id: "billing" },
      { title: "Change password", id: "change-password" },
      { title: "Delete account", id: "delete-account" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { title: "Submit testimonial", id: "submit-testimonial" },
      { title: "View testimonials", id: "view-testimonials" },
    ],
  },
  {
    label: "EXAMPLES",
    items: [
      { title: "Claude chatbot", id: "claude-chatbot" },
    ],
  },
  {
    label: "REFERENCE",
    items: [
      { title: "Error codes", id: "error-codes" },
      { title: "Environments", id: "environments" },
      { title: "Variable injection", id: "variable-injection" },
    ],
  },
];

const ALL_IDS = NAV.flatMap((s) => s.items.map((i) => i.id));

/* ------------------------------------------------------------------ */
/*  Reusable components                                                */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
    >
      {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  );
}

function CloneRepoButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors"
    >
      {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Clone repo</>}
    </button>
  );
}

function CodeBlock({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={`relative rounded-lg bg-[#111] overflow-hidden ${className}`}>
      <CopyButton text={code} />
      <pre className="overflow-x-auto p-4 pr-20 text-[13px] leading-6 font-mono text-zinc-300">
        {code}
      </pre>
    </div>
  );
}

function TabbedCode({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="rounded-lg bg-[#111] overflow-hidden">
      <div className="flex border-b border-white/10">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              i === active ? "text-[#10b981] border-b-2 border-[#10b981]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <CopyButton text={tabs[active].code} />
        <pre className="overflow-x-auto p-4 pr-20 text-[13px] leading-6 font-mono text-zinc-300">
          {tabs[active].code}
        </pre>
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" | "PUT" }) {
  const colors = {
    GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
    PUT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono ${colors[method]}`}>
      {method}
    </span>
  );
}

function EndpointBadge({ method, path }: { method: "GET" | "POST" | "DELETE" | "PUT"; path: string }) {
  return (
    <div className="flex items-center gap-2 mt-2 mb-4">
      <MethodBadge method={method} />
      <code className="text-sm font-mono text-zinc-600">{path}</code>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold border-l-4 border-[#10b981] pl-4 pt-12 pb-2 scroll-mt-6">
      {children}
    </h2>
  );
}

function ParamTable({ params }: { params: { name: string; loc: string; type: string; required: string; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">In</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Required</th>
            <th className="px-4 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs font-medium">{p.name}</td>
              <td className="px-4 py-2 text-xs text-zinc-500">{p.loc}</td>
              <td className="px-4 py-2 text-xs text-zinc-500">{p.type}</td>
              <td className="px-4 py-2 text-xs">{p.required}</td>
              <td className="px-4 py-2 text-xs text-zinc-600">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BodyTable({ params }: { params: { name: string; type: string; required: string; desc: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Required</th>
            <th className="px-4 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs font-medium">{p.name}</td>
              <td className="px-4 py-2 text-xs text-zinc-500">{p.type}</td>
              <td className="px-4 py-2 text-xs">{p.required}</td>
              <td className="px-4 py-2 text-xs text-zinc-600">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive API Tester                                             */
/* ------------------------------------------------------------------ */
function ApiTester() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("versera_docs_api_key") ?? "");
  const [slug, setSlug] = useState("");
  const [vars, setVars] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: number; body: string; time: number } | null>(null);

  useEffect(() => {
    if (apiKey) localStorage.setItem("versera_docs_api_key", apiKey);
  }, [apiKey]);

  const addVar = () => setVars([...vars, { key: "", value: "" }]);
  const removeVar = (i: number) => setVars(vars.filter((_, idx) => idx !== i));
  const updateVar = (i: number, field: "key" | "value", val: string) => {
    const copy = [...vars];
    copy[i][field] = val;
    setVars(copy);
  };

  const send = async () => {
    if (!slug || !apiKey) return;
    setLoading(true);
    setResult(null);
    const qs = vars
      .filter((v) => v.key)
      .map((v) => `${encodeURIComponent(v.key)}=${encodeURIComponent(v.value)}`)
      .join("&");
    const url = `${API_BASE}/v1/resolve/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
    const start = performance.now();
    try {
      const res = await fetch(url, { headers: { "x-api-key": apiKey } });
      const body = await res.text();
      const time = Math.round(performance.now() - start);
      let formatted: string;
      try {
        formatted = JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        formatted = body;
      }
      setResult({ status: res.status, body: formatted, time });
    } catch (e: any) {
      setResult({ status: 0, body: e.message ?? "Network error", time: Math.round(performance.now() - start) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-[#111] p-6 my-6">
      <h4 className="text-white font-semibold mb-4">Try it</h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">API Key</label>
          <input
            type="password"
            placeholder="vrs_live_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-md bg-[#1a1a1a] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#10b981]"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Prompt slug</label>
          <input
            type="text"
            placeholder="summarize-doc"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md bg-[#1a1a1a] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#10b981]"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Variables</label>
          {vars.map((v, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="key"
                value={v.key}
                onChange={(e) => updateVar(i, "key", e.target.value)}
                className="flex-1 rounded-md bg-[#1a1a1a] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#10b981]"
              />
              <input
                placeholder="value"
                value={v.value}
                onChange={(e) => updateVar(i, "value", e.target.value)}
                className="flex-1 rounded-md bg-[#1a1a1a] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 font-mono focus:outline-none focus:border-[#10b981]"
              />
              <button onClick={() => removeVar(i)} className="text-zinc-500 hover:text-red-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button onClick={addVar} className="flex items-center gap-1 text-xs text-[#10b981] hover:text-[#34d399] transition-colors">
            <Plus className="h-3 w-3" /> Add variable
          </button>
        </div>
        <button
          onClick={send}
          disabled={loading || !slug || !apiKey}
          className="rounded-md bg-[#10b981] px-5 py-2 text-sm font-medium text-white hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send request
        </button>
      </div>
      {result && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-mono font-semibold ${result.status >= 200 && result.status < 300 ? "text-emerald-400" : "text-red-400"}`}>
              {result.status || "ERR"}
            </span>
            <span className="text-xs text-zinc-500">{result.time}ms</span>
          </div>
          <pre className={`rounded-md bg-[#0a0a0a] p-4 text-[13px] leading-6 font-mono overflow-x-auto ${
            result.status >= 200 && result.status < 300 ? "text-zinc-300" : "text-red-400"
          }`}>
            {result.body}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Docs Page                                                     */
/* ------------------------------------------------------------------ */
export default function Docs() {
  const [activeId, setActiveId] = useState("quick-start");
  const [docsSidebarOpen, setDocsSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  // Intersection observer for active nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" }
    );
    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen font-sans antialiased">
      {/* Mobile docs header */}
      <header className="fixed top-0 inset-x-0 z-50 flex h-12 items-center gap-3 border-b border-white/[0.06] bg-[#0f0f0f] px-4 md:hidden">
        <button onClick={() => setDocsSidebarOpen((v) => !v)} className="text-zinc-400 hover:text-white">
          {docsSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="hover:opacity-80 transition-opacity"><VLogoFull size={20} /></Link>
      </header>

      {/* Overlay */}
      {docsSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setDocsSidebarOpen(false)} />
      )}

      {/* ====== SIDEBAR ====== */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[260px] bg-[#0f0f0f] border-r border-white/[0.06] overflow-y-auto z-50 transition-transform duration-200 md:translate-x-0 ${docsSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            <VLogoFull size={24} />
          </Link>
          {NAV.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">
                {section.label}
              </p>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { scrollTo(item.id); setDocsSidebarOpen(false); }}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors mb-0.5 ${
                    activeId === item.id
                      ? "text-[#10b981] border-l-2 border-[#10b981] bg-[#10b981]/5"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          ))}
          <button onClick={toggle} className="flex items-center gap-2 mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </aside>

      {/* ====== CONTENT ====== */}
      <div ref={contentRef} className="flex-1 md:ml-[260px] bg-white min-h-screen overflow-y-auto pt-12 md:pt-0">
        <div className="max-w-[780px] mx-auto px-4 sm:px-6 md:px-12 py-12" style={{ lineHeight: 1.8 }}>

          {/* ── QUICK START ── */}
          <SectionHeading id="quick-start">Quick start</SectionHeading>
          <p className="text-zinc-500 mb-6">Get your first prompt resolved in under 5 minutes</p>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981] text-xs text-white font-bold">1</span>
                Create an account
              </h3>
              <p className="text-zinc-600 mt-2">
                Sign up at <Link to="/signup" className="text-[#10b981] underline hover:text-[#059669] transition-colors">versera.dev/signup</Link>. You'll get 1,000 free credits — no credit card needed.
              </p>
              <Link to="/signup" className="inline-block mt-3 rounded-md bg-[#10b981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669] transition-colors">
                Create account →
              </Link>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981] text-xs text-white font-bold">2</span>
                Get your API key
              </h3>
              <p className="text-zinc-600 mt-2">
                After signing in, go to API Keys in your dashboard and generate a key. It starts with <code className="font-mono text-sm bg-zinc-100 px-1 rounded">vrs_live_</code> and is shown only once.
              </p>
              <CodeBlock code="vrs_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="mt-3" />
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981] text-xs text-white font-bold">3</span>
                Make your first resolve call
              </h3>
              <p className="text-zinc-600 mt-2">
                Call the resolve endpoint with your API key. Variables in your prompt template are injected from query parameters.
              </p>
              <div className="mt-3">
                <TabbedCode
                  tabs={[
                    {
                      label: "cURL",
                      code: `curl "https://api.versera.dev/v1/resolve/your-prompt-name\\
  ?variable1=value1&variable2=value2" \\
  -H "x-api-key: vrs_live_your_key_here"`,
                    },
                    {
                      label: "JavaScript",
                      code: `const response = await fetch(
  'https://api.versera.dev/v1/resolve/your-prompt-name' +
  '?variable1=value1&variable2=value2',
  {
    headers: {
      'x-api-key': 'vrs_live_your_key_here'
    }
  }
)
const { template } = await response.json()`,
                    },
                    {
                      label: "Node.js SDK",
                      code: `# Install the SDK
npm install versera-app

# Usage
import { Versera } from 'versera-app'

const versera = new Versera({
  apiKey: process.env.VERSERA_API_KEY
})

// Resolve your prompt
const { template } = await versera.resolve(
  'summarize-doc',
  {
    tone: 'professional',
    document: userDocument
  }
)

// Pass to any LLM
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: template }]
})`,
                    },
                    {
                      label: "Python",
                      code: `import requests

response = requests.get(
  'https://api.versera.dev/v1/resolve/your-prompt-name',
  params={'variable1': 'value1', 'variable2': 'value2'},
  headers={'x-api-key': 'vrs_live_your_key_here'}
)
template = response.json()['template']`,
                    },
                    {
                      label: "Node.js SDK",
                      code: `// npm install versera-app
import { Versera } from 'versera-app'

const versera = new Versera({
  apiKey: process.env.VERSERA_API_KEY
})

const { template } = await versera.resolve(
  'your-prompt-name',
  { variable1: 'value1', variable2: 'value2' }
)`,
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* ── AUTHENTICATION ── */}
          <SectionHeading id="authentication">Authentication</SectionHeading>

          <p className="text-zinc-600 mt-4 mb-3">
            Versera supports two authentication methods. <strong>API keys</strong> work for all prompt and version management endpoints — they're the recommended way to integrate with the SDK. <strong>JWT tokens</strong> are required for account, billing, and admin endpoints.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">API Key authentication</h3>
          <p className="text-zinc-600 mb-3">
            Pass your key in the <code className="font-mono text-sm bg-zinc-100 px-1 rounded">x-api-key</code> header. API keys start with <code className="font-mono text-sm bg-zinc-100 px-1 rounded">vrs_live_</code> and can be generated from your dashboard.
          </p>
          <CodeBlock code={`curl https://api.versera.dev/v1/resolve/my-prompt \\
  -H "x-api-key: vrs_live_your_key"`} />

          <h3 className="text-lg font-semibold mt-8 mb-2">JWT authentication</h3>
          <p className="text-zinc-600 mb-3">
            Required for account management, billing, and admin endpoints. Get a token by logging in.
          </p>
          <CodeBlock code={`# Login to get token
curl -X POST https://api.versera.dev/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword"}'

# Use the token
curl https://api.versera.dev/v1/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

          <h3 className="text-lg font-semibold mt-8 mb-2">Auth method by endpoint</h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-4 py-2 font-medium">Endpoint</th>
                  <th className="px-4 py-2 font-medium">Auth</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["GET /v1/resolve/:slug", "API Key"],
                  ["GET /v1/prompts", "API Key or JWT"],
                  ["POST /v1/prompts", "API Key or JWT"],
                  ["GET /v1/prompts/:slug", "API Key or JWT"],
                  ["PUT /v1/prompts/:slug", "API Key or JWT"],
                  ["DELETE /v1/prompts/:slug", "API Key or JWT"],
                  ["GET /v1/prompts/:slug/versions", "API Key or JWT"],
                  ["POST /v1/prompts/:slug/versions", "API Key or JWT"],
                  ["POST .../versions/:n/rollback", "API Key or JWT"],
                  ["GET /v1/me", "JWT only"],
                  ["PUT /v1/me/password", "JWT only"],
                  ["DELETE /v1/me", "JWT only"],
                  ["GET /v1/api-keys", "JWT only"],
                  ["All /v1/billing/*", "JWT only"],
                  ["All /v1/admin/*", "JWT only (admin)"],
                ].map(([endpoint, auth]) => (
                  <tr key={endpoint} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{endpoint}</td>
                    <td className="px-4 py-2 text-xs text-zinc-600">{auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-500 italic">
            API keys work for all prompt and version management endpoints. Account, billing, and admin endpoints require a JWT token obtained via login.
          </p>
          {/* ── CREDITS & LIMITS ── */}
          <SectionHeading id="credits-limits">Credits & limits</SectionHeading>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Credits</th>
                  <th className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Resolve call", "1 credit", "Per API call"],
                  ["A/B test assignment", "2 credits", "Per assignment"],
                  ["Analytics report", "5 credits", "Per generation"],
                  ["Push/update prompt", "Free", "No credit cost"],
                  ["List/read prompts", "Free", "No credit cost"],
                  ["Save new version", "Free", "No credit cost"],
                  ["Rollback version", "Free", "No credit cost"],
                  ["Generate API key", "Free", "No credit cost"],
                ].map(([action, credits, notes]) => (
                  <tr key={action} className="border-b last:border-0">
                    <td className="px-4 py-2 text-zinc-800">{action}</td>
                    <td className="px-4 py-2 font-mono text-xs">{credits}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600">Credits never expire. Purchase more at any time from your billing dashboard.</p>

          {/* ── NODE.JS SDK ── */}
          <SectionHeading id="nodejs-sdk">
            <span className="inline-flex items-center gap-3">
              Node.js SDK
              <span
                className="inline-flex items-center font-mono align-middle"
                style={{
                  backgroundColor: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  fontSize: "11px",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  fontWeight: 500,
                }}
              >
                v0.1.1
              </span>
            </span>
          </SectionHeading>
          <p className="text-zinc-500 mb-4">The official JavaScript and TypeScript SDK for Versera</p>

          <div className="flex items-center gap-3 mb-3">
            <CodeBlock code="npm install versera-app" className="flex-1" />
          </div>
          <a
            href="https://www.npmjs.com/package/versera-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#10b981] hover:text-[#059669] transition-colors"
          >
            View on npm →
          </a>

          <h3 className="text-lg font-semibold mt-8 mb-2">Quick start</h3>
          <p className="text-zinc-600 mb-3">
            One API key works for every method — resolve, push, list, get, saveVersion, and rollback. No JWT token needed for prompt management.
          </p>
          <CodeBlock code={`import { Versera } from 'versera-app'

const versera = new Versera({
  apiKey: process.env.VERSERA_API_KEY
})

// Every method works with just the API key:

// Resolve a prompt
const { template } = await versera.resolve(
  'my-prompt',
  { variable: 'value' }
)

// Create or update a prompt
await versera.push({
  name: 'my-prompt',
  environment: 'prod',
  template: 'Hello {{name}}',
  message: 'Initial version'
})

// List all prompts
const prompts = await versera.list()

// Get a prompt with history
const prompt = await versera.get('my-prompt')

// Save a new version
await versera.saveVersion('my-prompt', {
  template: 'Hi {{name}}!',
  message: 'Friendlier greeting'
})

// Rollback to previous version
await versera.rollback('my-prompt', 2)`} />

          <h3 className="text-lg font-semibold mt-8 mb-2">Methods</h3>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-4 py-2 font-medium">Method</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["resolve(slug, vars?, opts?)", "Resolve a prompt with variables", "1 credit"],
                  ["push(input)", "Create or update a prompt", "Free"],
                  ["list(options?)", "List all prompts", "Free"],
                  ["get(slug)", "Get a prompt with history", "Free"],
                  ["saveVersion(slug, input)", "Save a new version", "Free"],
                  ["rollback(slug, version)", "Rollback to previous version", "Free"],
                  ["log(input)", "Log quality score for A/B testing", "Free"],
                ].map(([method, desc, credits]) => (
                  <tr key={method} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs font-medium">{method}</td>
                    <td className="px-4 py-2 text-xs text-zinc-600">{desc}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-2">Error handling</h3>
          <CodeBlock code={`import { Versera, VerseraError } from 'versera-app'

try {
  const { template } = await versera.resolve(
    'my-prompt'
  )
} catch (error) {
  if (error instanceof VerseraError) {
    console.log(error.status)   // HTTP status
    console.log(error.message)  // Error message

    if (error.status === 402) {
      // Out of credits — redirect to billing
    }
    if (error.status === 404) {
      // Prompt not found
    }
    if (error.status === 401) {
      // Invalid or missing API key
    }
  }
}`} />

          {/* ── RESOLVE A PROMPT ── */}
          <SectionHeading id="resolve">Resolve a prompt</SectionHeading>
          <EndpointBadge method="GET" path="/v1/resolve/:promptSlug" />
          <p className="text-zinc-600 mb-2">
            Resolves a prompt template by name, injecting variables from query parameters. This is the core endpoint — the one your app calls at runtime before every LLM call.
          </p>
          <p className="text-sm text-zinc-500 mb-1"><strong>Authentication:</strong> API Key (<code className="font-mono bg-zinc-100 px-1 rounded">x-api-key</code> header)</p>
          <p className="text-sm text-zinc-500 mb-4"><strong>Cost:</strong> 1 credit per call</p>

          <ParamTable params={[
            { name: "promptSlug", loc: "path", type: "string", required: "Yes", desc: "The prompt slug" },
            { name: "env", loc: "query", type: "string", required: "No", desc: "dev/staging/prod (default: prod)" },
            { name: "[variables]", loc: "query", type: "string", required: "No", desc: "Any {{variable}} in your template" },
          ]} />

          <ApiTester />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`{
  "versionId": "clx1234...",
  "template": "Summarize this document in professional style.",
  "variables": ["document", "tone"],
  "promptSlug": "summarize-doc",
  "environment": "prod",
  "resolvedAt": "2026-04-05T03:00:00Z"
}`} />

          {/* ── CREATE A PROMPT ── */}
          <SectionHeading id="create-prompt">Create a prompt</SectionHeading>
          <EndpointBadge method="POST" path="/v1/prompts" />
          <p className="text-zinc-600 mb-4">Creates a new prompt with an initial version.</p>

          <h4 className="font-semibold mb-2">Request body</h4>
          <BodyTable params={[
            { name: "name", type: "string", required: "required", desc: "URL-safe prompt name" },
            { name: "environment", type: "string", required: "required", desc: "dev/staging/prod" },
            { name: "template", type: "string", required: "required", desc: "Template with {{variables}}" },
            { name: "message", type: "string", required: "optional", desc: "Version commit message" },
          ]} />

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl -X POST https://api.versera.dev/v1/prompts \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "summarize-doc",
    "environment": "prod",
    "template": "Summarize {{document}} in {{tone}} style.",
    "message": "Initial version"
  }'`} />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`{
  "id": "clx1234...",
  "slug": "summarize-doc",
  "name": "summarize-doc",
  "environment": "prod",
  "status": "DRAFT",
  "versions": [{
    "version": 1,
    "isCurrent": true,
    "message": "Initial version",
    "savedAt": "2026-04-05T03:00:00Z"
  }]
}`} />

          {/* ── LIST PROMPTS ── */}
          <SectionHeading id="list-prompts">List prompts</SectionHeading>
          <EndpointBadge method="GET" path="/v1/prompts" />
          <p className="text-zinc-600 mb-4">Returns all prompts for the authenticated user.</p>

          <h4 className="font-semibold mb-2">Query parameters</h4>
          <BodyTable params={[
            { name: "search", type: "string", required: "optional", desc: "Filter by name" },
            { name: "environment", type: "string", required: "optional", desc: "Filter by dev/staging/prod" },
          ]} />

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl https://api.versera.dev/v1/prompts?environment=prod \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`[
  {
    "id": "clx1234...",
    "slug": "summarize-doc",
    "name": "summarize-doc",
    "environment": "prod",
    "status": "ACTIVE",
    "currentVersion": 4,
    "updatedAt": "2026-04-05T03:00:00Z"
  }
]`} />

          {/* ── GET A PROMPT ── */}
          <SectionHeading id="get-prompt">Get a prompt</SectionHeading>
          <EndpointBadge method="GET" path="/v1/prompts/:slug" />
          <p className="text-zinc-600 mb-4">Returns a single prompt with its current version details.</p>

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl https://api.versera.dev/v1/prompts/summarize-doc \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`{
  "id": "clx1234...",
  "slug": "summarize-doc",
  "name": "summarize-doc",
  "environment": "prod",
  "template": "Summarize {{document}} in {{tone}} style.",
  "currentVersion": 4,
  "versions": [
    { "version": 4, "isCurrent": true, "message": "Improved tone", "savedAt": "..." },
    { "version": 3, "isCurrent": false, "message": "Added tone var", "savedAt": "..." }
  ]
}`} />

          {/* ── SAVE A VERSION ── */}
          <SectionHeading id="save-version">Save a version</SectionHeading>
          <EndpointBadge method="POST" path="/v1/prompts/:slug/versions" />
          <p className="text-zinc-600 mb-4">
            Saves a new version of the prompt template. The new version automatically becomes current. A diff is computed against the previous version.
          </p>

          <h4 className="font-semibold mb-2">Request body</h4>
          <BodyTable params={[
            { name: "template", type: "string", required: "required", desc: "New template content" },
            { name: "message", type: "string", required: "optional", desc: "Describe what changed" },
          ]} />

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl -X POST https://api.versera.dev/v1/prompts/summarize-doc/versions \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "Summarize {{document}} in a {{tone}} and {{length}} format.",
    "message": "Added length variable"
  }'`} />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`{
  "version": 5,
  "isCurrent": true,
  "template": "Summarize {{document}} in a {{tone}} and {{length}} format.",
  "message": "Added length variable",
  "savedAt": "2026-04-05T04:00:00Z"
}`} />

          {/* ── ROLLBACK ── */}
          <SectionHeading id="rollback">Rollback a version</SectionHeading>
          <EndpointBadge method="POST" path="/v1/prompts/:slug/versions/:version/rollback" />
          <p className="text-zinc-600 mb-4">
            Sets a previous version as the current active version. The resolve endpoint will immediately serve the rolled-back version.
          </p>

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl -X POST https://api.versera.dev/v1/prompts/summarize-doc/versions/3/rollback \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`{
  "version": 3,
  "isCurrent": true,
  "template": "Summarize {{document}} in {{tone}} style.",
  "message": "Added tone var",
  "savedAt": "2026-04-04T12:00:00Z"
}`} />

          {/* ── API KEYS ── */}
          <SectionHeading id="api-keys">API keys</SectionHeading>

          <EndpointBadge method="GET" path="/v1/api-keys" />
          <p className="text-zinc-600 mb-3">List all API keys for the authenticated user.</p>
          <CodeBlock code={`curl https://api.versera.dev/v1/api-keys \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          <EndpointBadge method="POST" path="/v1/api-keys" />
          <p className="text-zinc-600 mb-3">Create a new API key.</p>
          <CodeBlock code={`curl -X POST https://api.versera.dev/v1/api-keys \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "production-key"}'`} />

          <EndpointBadge method="DELETE" path="/v1/api-keys/:id" />
          <p className="text-zinc-600 mb-3">Revoke an API key.</p>
          <CodeBlock code={`curl -X DELETE https://api.versera.dev/v1/api-keys/KEY_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Note:</strong> Your full API key is only returned once on creation. Store it immediately — it cannot be retrieved again.
          </div>

          {/* ── BILLING ── */}
          <SectionHeading id="billing">Billing</SectionHeading>

          <EndpointBadge method="GET" path="/v1/billing/plans" />
          <p className="text-zinc-600 mb-3">List available credit plans.</p>
          <CodeBlock code={`curl https://api.versera.dev/v1/billing/plans \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          <h4 className="font-semibold mt-6 mb-2">Example response</h4>
          <CodeBlock code={`[
  { "id": "starter", "name": "Starter", "credits": 10000, "priceCents": 900 },
  { "id": "growth", "name": "Growth", "credits": 100000, "priceCents": 4900 },
  { "id": "scale", "name": "Scale", "credits": 500000, "priceCents": 19900 }
]`} />

          <EndpointBadge method="GET" path="/v1/billing/transactions" />
          <p className="text-zinc-600 mb-3">List credit transactions.</p>
          <CodeBlock code={`curl https://api.versera.dev/v1/billing/transactions \\
  -H "Authorization: Bearer YOUR_TOKEN"`} />

          {/* ── CHANGE PASSWORD ── */}
          <SectionHeading id="change-password">Change password</SectionHeading>
          <EndpointBadge method="PUT" path="/v1/me/password" />
          <p className="text-sm text-zinc-500 mb-1"><strong>Authentication:</strong> Bearer JWT</p>
          <p className="text-zinc-600 mb-4">Update your account password. Requires your current password for verification.</p>

          <h4 className="font-semibold mb-2">Request body</h4>
          <BodyTable params={[
            { name: "currentPassword", type: "string", required: "required", desc: "Your current password" },
            { name: "newPassword", type: "string", required: "required", desc: "New password (min 8 chars)" },
          ]} />

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl -X PUT https://api.versera.dev/v1/me/password \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }'`} />

          <h4 className="font-semibold mt-4 mb-2">Example response</h4>
          <CodeBlock code={`{ "message": "Password updated" }`} />

          <div className="mt-4 space-y-1 text-sm text-zinc-500">
            <p><strong>401</strong> — Current password is incorrect</p>
            <p><strong>400</strong> — New password must be at least 8 characters</p>
          </div>

          {/* ── DELETE ACCOUNT ── */}
          <SectionHeading id="delete-account">Delete account</SectionHeading>
          <EndpointBadge method="DELETE" path="/v1/me" />
          <p className="text-sm text-zinc-500 mb-1"><strong>Authentication:</strong> Bearer JWT</p>
          <p className="text-zinc-600 mb-4">Permanently delete your account and all associated data. This action cannot be undone. A confirmation email is sent before deletion.</p>

          <h4 className="font-semibold mb-2">Request body</h4>
          <BodyTable params={[
            { name: "confirmation", type: "string", required: "required", desc: 'Must be exactly "DELETE"' },
          ]} />

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl -X DELETE https://api.versera.dev/v1/me \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "confirmation": "DELETE" }'`} />

          <p className="text-sm text-zinc-500 mt-4 mb-2"><strong>Response:</strong> 204 No Content</p>

          <div className="mt-4 rounded-lg border-l-4 border-red-400 bg-red-50 p-4 text-sm text-red-800">
            <strong>Warning:</strong> This permanently deletes all your prompts, versions, API keys, and billing history. This cannot be undone.
          </div>

          {/* ── SUBMIT TESTIMONIAL ── */}
          <SectionHeading id="submit-testimonial">Submit a testimonial</SectionHeading>
          <EndpointBadge method="POST" path="/v1/testimonials" />
          <p className="text-sm text-zinc-500 mb-1"><strong>Authentication:</strong> Public — no authentication required</p>
          <p className="text-zinc-600 mb-4">Submit a testimonial about your experience with Versera. Testimonials are reviewed before being published on versera.dev</p>

          <h4 className="font-semibold mb-2">Request body</h4>
          <BodyTable params={[
            { name: "name", type: "string", required: "required", desc: "Your name" },
            { name: "role", type: "string", required: "required", desc: "Your role/title" },
            { name: "content", type: "string", required: "required", desc: "Your experience (max 500 chars)" },
            { name: "rating", type: "number", required: "required", desc: "Rating from 1 to 5" },
          ]} />

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl -X POST https://api.versera.dev/v1/testimonials \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Marcus T.",
    "role": "Senior ML Engineer",
    "content": "Versera solved our prompt versioning problem instantly.",
    "rating": 5
  }'`} />

          <h4 className="font-semibold mt-4 mb-2">Example response (201)</h4>
          <CodeBlock code={`{
  "id": "clx1234...",
  "name": "Marcus T.",
  "role": "Senior ML Engineer",
  "content": "Versera solved our prompt versioning problem instantly.",
  "rating": 5,
  "status": "PENDING",
  "createdAt": "2026-04-05T10:00:00Z"
}`} />

          {/* ── VIEW TESTIMONIALS ── */}
          <SectionHeading id="view-testimonials">View testimonials</SectionHeading>
          <EndpointBadge method="GET" path="/v1/testimonials" />
          <p className="text-sm text-zinc-500 mb-1"><strong>Authentication:</strong> Public — no authentication required</p>
          <p className="text-zinc-600 mb-4">Returns all approved testimonials. Pending and rejected testimonials are not included.</p>

          <h4 className="font-semibold mt-4 mb-2">Example request</h4>
          <CodeBlock code={`curl https://api.versera.dev/v1/testimonials`} />

          <h4 className="font-semibold mt-4 mb-2">Example response (200)</h4>
          <CodeBlock code={`[
  {
    "id": "clx1234...",
    "name": "Marcus T.",
    "role": "Senior ML Engineer",
    "content": "Versera solved our prompt versioning problem instantly.",
    "rating": 5,
    "status": "APPROVED",
    "createdAt": "2026-04-05T10:00:00Z"
  }
]`} />

          {/* ── CLAUDE CHATBOT EXAMPLE ── */}
          <SectionHeading id="claude-chatbot">Claude chatbot example</SectionHeading>
          <p className="text-zinc-500 mb-6">
            A complete working example of building a customer support chatbot with Versera and Claude in 20 lines of code.
          </p>

          <div className="rounded-lg bg-[#0a0a0a] border border-[#1f2937] p-6 my-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/5 border border-white/10">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold font-mono text-sm">versera-claude-example</h4>
                <p className="text-zinc-400 text-sm mt-1">Customer support chatbot using Versera + Claude</p>
                <a
                  href="https://github.com/steevy-cpu/versera-claude-example"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#10b981] hover:text-[#34d399] text-xs font-mono mt-2 inline-flex items-center gap-1 transition-colors"
                >
                  github.com/steevy-cpu/versera-claude-example
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <a
                href="https://github.com/steevy-cpu/versera-claude-example"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#10b981] px-4 py-2 text-xs font-medium text-white hover:bg-[#059669] transition-colors"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
              <CloneRepoButton command="git clone https://github.com/steevy-cpu/versera-claude-example.git" />
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-3">Quick start</h3>
          <CodeBlock code={`git clone https://github.com/steevy-cpu/versera-claude-example.git
cd versera-claude-example
cp .env.example .env
# Add your Versera and Anthropic keys
npm install
npm run setup
npm start`} />

          <p className="text-zinc-600 mt-6">
            This example creates a <code className="font-mono text-sm bg-zinc-100 px-1 rounded">support-bot</code> prompt in your Versera account, then uses Claude to respond to customer messages. Edit the prompt on <Link to="/" className="text-[#10b981] underline hover:text-[#059669] transition-colors">versera.dev</Link> and see changes instantly — no redeploy.
          </p>

          {/* ── ERROR CODES ── */}
          <SectionHeading id="error-codes">Error codes</SectionHeading>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["400", "Bad request", "Missing or invalid parameters"],
                  ["401", "Unauthorized", "Invalid or missing API key/token"],
                  ["402", "Payment required", "Insufficient credits"],
                  ["403", "Forbidden", "Admin access required"],
                  ["404", "Not found", "Prompt or resource not found"],
                  ["409", "Conflict", "Resource already exists (e.g. duplicate slug)"],
                  ["429", "Too many requests", "Rate limit exceeded"],
                  ["500", "Server error", "Internal server error"],
                ].map(([status, code, desc]) => (
                  <tr key={status} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs font-semibold">{status}</td>
                    <td className="px-4 py-2 text-zinc-800">{code}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 mb-2">All errors follow the format:</p>
          <CodeBlock code={`{ "error": "Human readable message" }`} />

          {/* ── ENVIRONMENTS ── */}
          <SectionHeading id="environments">Environments</SectionHeading>
          <p className="text-zinc-600 mb-4">
            Each prompt belongs to one environment. Use environment switching in the dashboard to promote a prompt from dev → staging → prod.
          </p>

          <div className="flex items-center justify-center gap-3 my-8 flex-wrap">
            {["dev", "staging", "prod"].map((env, i) => (
              <div key={env} className="flex items-center gap-3">
                <div className="rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 px-5 py-3 text-sm font-semibold text-[#10b981]">
                  {env}
                </div>
                {i < 2 && (
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <span>→</span>
                    <span className="text-[10px]">promote</span>
                    <span>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── VARIABLE INJECTION ── */}
          <SectionHeading id="variable-injection">Variable injection</SectionHeading>
          <p className="text-zinc-600 mb-4">
            Write <code className="font-mono text-sm bg-zinc-100 px-1 rounded">{"{{variable_name}}"}</code> in your template. Pass values as query params to the resolve endpoint. Variables not provided are left unreplaced. Variable names must be alphanumeric + underscores.
          </p>

          <h4 className="font-semibold mt-6 mb-2">Worked example</h4>
          <p className="text-sm text-zinc-500 mb-2">Template stored in Versera:</p>
          <CodeBlock code={`Write a {{tone}} email to {{recipient}} about {{topic}}.`} />

          <p className="text-sm text-zinc-500 mt-4 mb-2">Resolve call:</p>
          <CodeBlock code={`GET /v1/resolve/email-writer
  ?tone=professional
  &recipient=the+team
  &topic=the+product+launch`} />

          <p className="text-sm text-zinc-500 mt-4 mb-2">Result returned:</p>
          <CodeBlock code={`Write a professional email to the team about the product launch.`} />

          {/* ── NODE.JS SDK ── */}
          <SectionHeading id="nodejs-sdk">Node.js SDK</SectionHeading>
          <div className="flex items-center gap-2 mt-2 mb-4">
            <code className="rounded bg-zinc-100 px-3 py-1 text-sm font-mono text-zinc-700">npm install versera-app</code>
            <a href="https://www.npmjs.com/package/versera-app" target="_blank" rel="noopener noreferrer" className="text-xs text-[#10b981] underline hover:text-[#059669] transition-colors">View on npm →</a>
          </div>
          <p className="text-zinc-600 mb-6">
            The official TypeScript SDK wraps the Versera API with full type safety. Zero dependencies.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-3">Installation & initialization</h3>
          <CodeBlock code={`import { Versera } from 'versera-app'

const versera = new Versera({
  apiKey: process.env.VERSERA_API_KEY   // must start with vrs_
})`} />

          <h3 className="text-lg font-semibold mt-8 mb-3">Methods</h3>

          <div className="space-y-6">
            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.resolve(slug, variables?, options?)</p>
              <p className="text-sm text-zinc-500 mb-2">Resolves a prompt with variables injected. Costs 1 credit.</p>
              <CodeBlock code={`const { template } = await versera.resolve(
  'summarize-doc',
  { tone: 'professional', document: userDoc },
  { environment: 'prod' }
)`} />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.push(input)</p>
              <p className="text-sm text-zinc-500 mb-2">Creates a prompt or saves a new version. Free.</p>
              <CodeBlock code={`await versera.push({
  name: 'summarize-doc',
  environment: 'prod',
  template: 'Summarize {{document}} in {{tone}} style.',
  message: 'Initial version'
})`} />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.list(options?)</p>
              <p className="text-sm text-zinc-500 mb-2">Lists all prompts, optionally filtered. Free.</p>
              <CodeBlock code={`const prompts = await versera.list({ environment: 'prod' })`} />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.get(slug)</p>
              <p className="text-sm text-zinc-500 mb-2">Gets a prompt with full version history. Free.</p>
              <CodeBlock code={`const prompt = await versera.get('summarize-doc')`} />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.saveVersion(slug, input)</p>
              <p className="text-sm text-zinc-500 mb-2">Saves a new version of an existing prompt. Free.</p>
              <CodeBlock code={`await versera.saveVersion('summarize-doc', {
  template: 'Summarize {{document}} in {{tone}} and {{length}} style.',
  message: 'Added length variable'
})`} />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.rollback(slug, version)</p>
              <p className="text-sm text-zinc-500 mb-2">Rolls back to a previous version. Free.</p>
              <CodeBlock code={`await versera.rollback('summarize-doc', 3)`} />
            </div>

            <div>
              <p className="font-mono text-sm font-semibold text-zinc-800 mb-1">versera.log(input)</p>
              <p className="text-sm text-zinc-500 mb-2">Logs a quality score for A/B testing. Free.</p>
              <CodeBlock code={`await versera.log({
  versionId: result.versionId,
  score: 0.92,
  metadata: { model: 'claude-sonnet-4-6' }
})`} />
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-3">Error handling</h3>
          <CodeBlock code={`import { Versera, VerseraError } from 'versera-app'

try {
  const { template } = await versera.resolve('my-prompt')
} catch (error) {
  if (error instanceof VerseraError) {
    if (error.status === 402) console.log('Out of credits!')
    if (error.status === 404) console.log('Prompt not found')
  }
}`} />

          <div className="h-24" />
        </div>
      </div>
    </div>
  );
}
