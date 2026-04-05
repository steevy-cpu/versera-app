// ─── Shared API response types ────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  credits: number;
  totalCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalPrompts: number;
  apiCallsToday: number;
  creditsRemaining: number;
  activeVersions: number;
}

export interface UsageStats {
  resolveCalls: number;
  abAssignments: number;
  logsSubmitted: number;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  template: string;
  message: string;
  isCurrent: boolean;
  diff: string[];
  savedAt: string;
}

export interface Prompt {
  id: string;
  slug: string;
  name: string;
  environment: "prod" | "staging" | "dev";
  status: "ACTIVE" | "DRAFT" | "DELETED";
  latestVersion?: number;
  template?: string;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
  versions?: PromptVersion[];
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface ApiKeyWithFull extends ApiKey {
  fullKey: string;
}

export interface Plan {
  name: string;
  key: string;
  price: number;
  credits: number;
  description: string;
  featured: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  credits: number;
  amountCents: number;
  createdAt: string;
}

export interface ApiError {
  message: string;
  status: number;
}
