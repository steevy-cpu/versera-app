# versera-app

Official JavaScript/TypeScript SDK for [Versera](https://versera.dev) — prompt version control for LLM apps.

## Installation

```bash
npm install versera-app
```

## Quick start

```typescript
import { Versera } from 'versera-app'

const versera = new Versera({
  apiKey: process.env.VERSERA_API_KEY!
})

// Resolve a prompt at runtime
const { template } = await versera.resolve(
  'summarize-doc',
  {
    tone: 'professional',
    document: userDocument
  }
)

// Use with any LLM
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  messages: [{ role: 'user', content: template }]
})
```

## API Reference

### versera.resolve(slug, variables?, options?)
Resolves a prompt template with variables injected. Costs 1 credit per call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Your prompt name |
| variables | Record\<string, string\> | No | Variables to inject |
| options.environment | 'dev' \| 'staging' \| 'prod' | No | Default: prod |

Returns: `Promise<ResolveResponse>`
```typescript
{
  versionId: string
  template: string      // rendered with variables injected
  variables: string[]   // detected variable names in the template
  promptSlug: string
  environment: string
  resolvedAt: string
}
```

---

### versera.push(input)
Creates a new prompt or saves a new version. No credit cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | URL-safe prompt name |
| environment | 'dev' \| 'staging' \| 'prod' | Yes | Environment |
| template | string | Yes | Prompt template with \{\{variables\}\} |
| message | string | No | Version commit message |

Returns: `Promise<PromptResponse>`

---

### versera.list(options?)
Lists all your prompts. No credit cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Filter by name |
| environment | string | No | Filter by environment |

Returns: `Promise<PromptResponse[]>`

---

### versera.get(slug)
Gets a single prompt with full version history. No credit cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Prompt slug |

Returns: `Promise<PromptResponse>`

---

### versera.saveVersion(slug, input)
Saves a new version of an existing prompt. No credit cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Prompt slug |
| template | string | Yes | New template content |
| message | string | No | What changed and why |

Returns: `Promise<VersionResponse>`

---

### versera.rollback(slug, version)
Rolls back to a previous version instantly. No credit cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Prompt slug |
| version | number | Yes | Version number to rollback to |

Returns: `Promise<VersionResponse>`

---

### versera.log(input)
Logs a quality score for A/B testing analytics. No credit cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| versionId | string | Yes | Version ID from the resolve response |
| score | number | No | Quality score (0–1) |
| metadata | object | No | Any additional data |

Returns: `Promise<void>`

---

## Credits

| Operation | Cost |
|-----------|------|
| resolve() | 1 credit per call |
| push() | Free |
| list() | Free |
| get() | Free |
| saveVersion() | Free |
| rollback() | Free |
| log() | Free |

Credits never expire. Buy more at [versera.dev/billing](https://versera.dev/billing).

## Error handling

```typescript
import { Versera, VerseraError } from 'versera-app'

try {
  const { template } = await versera.resolve(
    'my-prompt'
  )
} catch (error) {
  if (error instanceof VerseraError) {
    if (error.status === 402) {
      console.log('Out of credits!')
    }
    if (error.status === 404) {
      console.log('Prompt not found')
    }
  }
}
```

## License
MIT
