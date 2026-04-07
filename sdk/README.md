# versera

Official JavaScript/TypeScript SDK for [Versera](https://versera.dev) — prompt version control for LLM apps.

## Installation

```bash
npm install versera
```

## Quick start

```typescript
import { Versera } from 'versera'

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

## Methods

### versera.resolve(slug, variables?, options?)
Resolves a prompt template with variables. Costs 1 credit per call.

### versera.push(input)
Creates or updates a prompt.

### versera.list(options?)
Lists all your prompts.

### versera.get(slug)
Gets a single prompt with version history.

### versera.saveVersion(slug, input)
Saves a new version of a prompt.

### versera.rollback(slug, version)
Rolls back to a previous version.

### versera.log(input)
Logs a quality score for A/B testing.

## Error handling

```typescript
import { Versera, VerseraError } from 'versera'

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
