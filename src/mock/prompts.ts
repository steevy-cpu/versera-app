export interface Prompt {
  id: string;
  name: string;
  latestVersion: number;
  environment: "prod" | "staging" | "dev";
  status: "Active" | "Draft";
  lastUpdated: string;
  template: string;
}

export interface PromptVersion {
  version: number;
  isCurrent: boolean;
  savedAt: string;
  message: string;
  diff: string[];
}

export const prompts: Prompt[] = [
  {
    id: "summarize-doc",
    name: "summarize-doc",
    latestVersion: 4,
    environment: "prod",
    status: "Active",
    lastUpdated: "2 hours ago",
    template: `Summarize the following document in {{tone}} style.\n\nFocus on: {{focus_areas}}\n\nMaximum length: {{max_words}} words\n\nDocument:\n{{document}}`,
  },
  {
    id: "classify-intent",
    name: "classify-intent",
    latestVersion: 2,
    environment: "staging",
    status: "Active",
    lastUpdated: "5 hours ago",
    template: `Classify the intent of the following message:\n\n{{message}}\n\nCategories: {{categories}}`,
  },
  {
    id: "extract-entities",
    name: "extract-entities",
    latestVersion: 7,
    environment: "prod",
    status: "Active",
    lastUpdated: "1 day ago",
    template: `Extract named entities from:\n\n{{text}}\n\nReturn as JSON.`,
  },
  {
    id: "generate-reply",
    name: "generate-reply",
    latestVersion: 1,
    environment: "dev",
    status: "Draft",
    lastUpdated: "2 days ago",
    template: `Generate a reply to:\n\n{{message}}\n\nTone: {{tone}}`,
  },
  {
    id: "score-sentiment",
    name: "score-sentiment",
    latestVersion: 3,
    environment: "prod",
    status: "Active",
    lastUpdated: "3 days ago",
    template: `Score the sentiment of:\n\n{{text}}\n\nScale: -1 to 1`,
  },
];

export const promptVersions: PromptVersion[] = [
  {
    version: 4,
    isCurrent: true,
    savedAt: "Apr 2, 2026, 2:14pm",
    message: "Added max_words variable",
    diff: [
      "+ Maximum length: {{max_words}} words",
      "  Document:",
      "  {{document}}",
    ],
  },
  {
    version: 3,
    isCurrent: false,
    savedAt: "Mar 28, 2026, 10:02am",
    message: "Changed tone handling",
    diff: [
      "- Summarize in a {{style}} way.",
      "+ Summarize the following document in {{tone}} style.",
      "  Focus on: {{focus_areas}}",
    ],
  },
  {
    version: 2,
    isCurrent: false,
    savedAt: "Mar 21, 2026, 4:45pm",
    message: "Fixed focus_areas injection",
    diff: [
      "- Focus: {{focus}}",
      "+ Focus on: {{focus_areas}}",
      "  Document:",
    ],
  },
  {
    version: 1,
    isCurrent: false,
    savedAt: "Mar 14, 2026, 9:00am",
    message: "Initial version",
    diff: [
      "+ Summarize the following document.",
      "+ Focus: {{focus}}",
      "+ Document: {{document}}",
    ],
  },
];
