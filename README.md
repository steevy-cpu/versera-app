# Versera

Versera is a prompt version control API for developers building on LLMs. It lets you store, version, and retrieve prompt templates via a simple REST API — so you can iterate on prompts without redeploying your application. Each prompt belongs to an environment (prod / staging / dev), maintains a full version history with diffs, and is fetched at runtime by calling a single resolve endpoint with your variable values as query parameters.

---

## Repo Structure

```
versera-app/
├── src/                   # React frontend (Vite + Tailwind + shadcn/ui)
│   ├── pages/             # Dashboard, Prompts, PromptEditor, Versions, ApiKeys, Billing
│   ├── components/        # UI components
│   └── mock/              # Mock data (replaced by real API calls)
├── public/
├── index.html
├── package.json           # Frontend dependencies
├── vite.config.ts
│
└── server/                # Express backend
    ├── src/
    │   ├── routes/        # auth, user, prompts, versions, resolve, apiKeys, billing
    │   ├── middleware/     # requireAuth, requireApiKey, deductCredits
    │   └── lib/           # prisma client, safeUser helper
    ├── prisma/
    │   └── schema.prisma  # Database schema
    ├── .env.example       # Environment variable template
    └── README.md          # Full API docs + curl examples
```

---

## Running Locally

You'll need Node.js 18+, and a PostgreSQL database (a free Supabase project works).

### 1. Frontend

```bash
# From the repo root
npm install
npm run dev
# Runs on http://localhost:5173
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
npm run db:generate
npm run db:migrate
npm run dev
# Runs on http://localhost:3001
```

Both can run simultaneously. The frontend dev server proxies nothing by default — API calls from the frontend will need to point to `http://localhost:3001`.

---

## API Documentation

See **[server/README.md](./server/README.md)** for the full API reference including all endpoints and example curl commands.
