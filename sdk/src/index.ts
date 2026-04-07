export interface VerseraConfig {
  apiKey: string
  baseUrl?: string
}

export interface ResolveOptions {
  environment?: 'dev' | 'staging' | 'prod'
  [key: string]: string | undefined
}

export interface ResolveResponse {
  versionId: string
  template: string
  variables: string[]
  promptSlug: string
  environment: string
  resolvedAt: string
}

export interface PromptInput {
  name: string
  environment: 'dev' | 'staging' | 'prod'
  template: string
  message?: string
}

export interface PromptResponse {
  id: string
  slug: string
  name: string
  environment: string
  status: string
  versions: VersionResponse[]
}

export interface VersionResponse {
  id: string
  version: number
  isCurrent: boolean
  message: string
  template: string
  diff: string[]
  savedAt: string
}

export class VerseraError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'VerseraError'
  }
}

export class Versera {
  private apiKey: string
  private baseUrl: string

  constructor(config: VerseraConfig) {
    if (!config.apiKey) {
      throw new VerseraError(
        'API key is required',
        400
      )
    }
    if (!config.apiKey.startsWith('vrs_')) {
      throw new VerseraError(
        'Invalid API key format. ' +
        'Key must start with vrs_',
        400
      )
    }
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ??
      'https://api.versera.dev'
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json()
        .catch(() => ({
          error: 'Unknown error'
        }))
      throw new VerseraError(
        error.error ?? 'Request failed',
        response.status
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async resolve(
    promptSlug: string,
    variables?: Record<string, string>,
    options?: {
      environment?:
        'dev' | 'staging' | 'prod'
    }
  ): Promise<ResolveResponse> {
    const params = new URLSearchParams()

    if (options?.environment) {
      params.set('env', options.environment)
    }

    if (variables) {
      Object.entries(variables).forEach(
        ([key, value]) => {
          params.set(key, value)
        }
      )
    }

    const query = params.toString()
    const path = `/v1/resolve/${promptSlug}` +
      (query ? `?${query}` : '')

    return this.request<ResolveResponse>(path)
  }

  async push(
    input: PromptInput
  ): Promise<PromptResponse> {
    return this.request<PromptResponse>(
      '/v1/prompts',
      {
        method: 'POST',
        body: JSON.stringify(input)
      }
    )
  }

  async list(options?: {
    search?: string
    environment?: string
  }): Promise<PromptResponse[]> {
    const params = new URLSearchParams()
    if (options?.search) {
      params.set('search', options.search)
    }
    if (options?.environment) {
      params.set(
        'environment',
        options.environment
      )
    }
    const query = params.toString()
    const path = '/v1/prompts' +
      (query ? `?${query}` : '')
    return this.request<PromptResponse[]>(path)
  }

  async get(
    slug: string
  ): Promise<PromptResponse> {
    return this.request<PromptResponse>(
      `/v1/prompts/${slug}`
    )
  }

  async saveVersion(
    slug: string,
    input: {
      template: string
      message?: string
    }
  ): Promise<VersionResponse> {
    return this.request<VersionResponse>(
      `/v1/prompts/${slug}/versions`,
      {
        method: 'POST',
        body: JSON.stringify(input)
      }
    )
  }

  async rollback(
    slug: string,
    version: number
  ): Promise<VersionResponse> {
    return this.request<VersionResponse>(
      `/v1/prompts/${slug}/versions/${version}/rollback`,
      { method: 'POST' }
    )
  }

  async log(input: {
    versionId: string
    score?: number
    metadata?: Record<string, unknown>
  }): Promise<void> {
    return this.request<void>(
      '/v1/prompts/log',
      {
        method: 'POST',
        body: JSON.stringify(input)
      }
    )
  }
}

export default Versera
