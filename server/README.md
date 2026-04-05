# Versera API

The backend for Versera — a prompt version control API for developers building on LLMs.

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma
- **Auth:** JWT (dashboard) + API key (resolve endpoint)
- **Payments:** Stripe (scaffold — not wired yet)

---

## Setup

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in the values — see Environment Variables below
```

### 3. Run database migrations

```bash
npm run db:generate   # generate Prisma client from schema
npm run db:migrate    # apply migrations to the database
```

### 4. Start the dev server

```bash
npm run dev           # ts-node-dev with hot reload on http://localhost:3001
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use the **Transaction mode pooler** URL from Supabase (port 6543) for serverless environments, or the direct URL (port 5432) for local dev. |
| `PORT` | No | Port the server listens on. Defaults to `3001`. |
| `NODE_ENV` | No | `development` or `production`. |
| `JWT_SECRET` | Yes | Long random string used to sign and verify session tokens. Generate one with: `openssl rand -hex 64` |
| `FRONTEND_URL` | No | CORS origin for the frontend. Defaults to `http://localhost:5173`. |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (`sk_test_...`). Required only when wiring up the billing checkout. |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret (`whsec_...`). Required only for the `/v1/billing/webhook` handler. |

---

## API Reference

All authenticated endpoints require an `Authorization: Bearer <token>` header unless noted.  
The resolve endpoint uses `x-api-key: <key>` instead.

Base URL (local): `http://localhost:3001`

---

### Auth

#### Register a new account

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex",
    "email": "alex@versera.dev",
    "password": "supersecret123"
  }'
```

**Response `201`**
```json
{
  "user": {
    "id": "clxyz...",
    "name": "Alex",
    "email": "alex@versera.dev",
    "credits": 1000,
    "totalCredits": 1000
  },
  "token": "eyJhbGci..."
}
```

---

#### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@versera.dev",
    "password": "supersecret123"
  }'
```

**Response `200`**
```json
{
  "user": { "id": "clxyz...", "email": "alex@versera.dev", "credits": 1000 },
  "token": "eyJhbGci..."
}
```

---

### User

#### Get profile

```bash
curl http://localhost:3001/v1/me \
  -H "Authorization: Bearer <token>"
```

#### Dashboard stats

```bash
curl http://localhost:3001/v1/me/stats \
  -H "Authorization: Bearer <token>"
```

```json
{
  "totalPrompts": 3,
  "apiCallsToday": 42,
  "creditsRemaining": 958,
  "activeVersions": 7
}
```

#### Monthly usage

```bash
curl http://localhost:3001/v1/me/usage \
  -H "Authorization: Bearer <token>"
```

---

### Prompts

#### List prompts

```bash
# All prompts
curl http://localhost:3001/v1/prompts \
  -H "Authorization: Bearer <token>"

# Filtered
curl "http://localhost:3001/v1/prompts?environment=prod&search=summarize" \
  -H "Authorization: Bearer <token>"
```

#### Create a prompt

```bash
curl -X POST http://localhost:3001/v1/prompts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "summarize-doc",
    "environment": "prod",
    "template": "Summarize the following document in {{tone}} style.\n\nFocus on: {{focus_areas}}\n\nDocument:\n{{document}}",
    "message": "Initial version"
  }'
```

**Response `201`**
```json
{
  "id": "clxyz...",
  "slug": "summarize-doc",
  "name": "summarize-doc",
  "environment": "prod",
  "status": "DRAFT",
  "versions": [{ "version": 1, "isCurrent": true, "message": "Initial version" }]
}
```

#### Get a prompt (with all versions)

```bash
curl http://localhost:3001/v1/prompts/summarize-doc \
  -H "Authorization: Bearer <token>"
```

#### Update a prompt

```bash
curl -X PUT http://localhost:3001/v1/prompts/summarize-doc \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "ACTIVE", "environment": "prod" }'
```

#### Delete a prompt (soft delete)

```bash
curl -X DELETE http://localhost:3001/v1/prompts/summarize-doc \
  -H "Authorization: Bearer <token>"
# 204 No Content
```

---

### Versions

#### List version history

```bash
curl http://localhost:3001/v1/prompts/summarize-doc/versions \
  -H "Authorization: Bearer <token>"
```

#### Save a new version

```bash
curl -X POST http://localhost:3001/v1/prompts/summarize-doc/versions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "Summarize the following document in {{tone}} style.\n\nFocus on: {{focus_areas}}\n\nMaximum length: {{max_words}} words\n\nDocument:\n{{document}}",
    "message": "Added max_words variable"
  }'
```

#### Rollback to a previous version

```bash
curl -X POST http://localhost:3001/v1/prompts/summarize-doc/versions/2/rollback \
  -H "Authorization: Bearer <token>"
```

---

### API Keys

#### List keys

```bash
curl http://localhost:3001/v1/api-keys \
  -H "Authorization: Bearer <token>"
```

#### Generate a new key

```bash
curl -X POST http://localhost:3001/v1/api-keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Production Key" }'
```

**Response `201`** — `fullKey` is returned **once only**. Store it immediately.
```json
{
  "id": "clxyz...",
  "name": "Production Key",
  "keyPrefix": "vrs_live_xxxxxxx••••abcd",
  "fullKey": "vrs_live_a1b2c3d4e5f6..."
}
```

#### Revoke a key

```bash
curl -X DELETE http://localhost:3001/v1/api-keys/<key-id> \
  -H "Authorization: Bearer <token>"
# 204 No Content
```

---

### Resolve (developer-facing API)

This is the endpoint your users call from their applications.  
Auth uses `x-api-key` header. Each call deducts **1 credit**.

#### Resolve a prompt with variable injection

```bash
curl "http://localhost:3001/v1/resolve/summarize-doc?tone=professional&focus_areas=key%20metrics&max_words=200&document=..." \
  -H "x-api-key: vrs_live_a1b2c3d4e5f6..."
```

**Response `200`**
```json
{
  "versionId": "clxyz...",
  "template": "Summarize the following document in professional style.\n\nFocus on: key metrics\n\nMaximum length: 200 words\n\nDocument:\n...",
  "variables": ["{{tone}}", "{{focus_areas}}", "{{max_words}}", "{{document}}"],
  "promptSlug": "summarize-doc",
  "environment": "prod",
  "resolvedAt": "2026-04-04T12:00:00.000Z"
}
```

Variables not supplied in query params are returned **unreplaced** (`{{variable}}`) — the API never errors on missing vars.

---

### Billing

#### List plans (public — no auth)

```bash
curl http://localhost:3001/v1/billing/plans
```

#### Transaction history

```bash
curl http://localhost:3001/v1/billing/transactions \
  -H "Authorization: Bearer <token>"
```

#### Create checkout session (scaffold)

```bash
curl -X POST http://localhost:3001/v1/billing/checkout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "plan": "growth" }'
```

---

## Error Responses

All errors follow the same shape:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| `400` | Validation error — check the `error` field |
| `401` | Missing, invalid, or expired token / API key |
| `402` | Insufficient credits |
| `404` | Resource not found or belongs to a different user |
| `409` | Conflict — e.g. duplicate prompt slug |
| `500` | Internal server error |
