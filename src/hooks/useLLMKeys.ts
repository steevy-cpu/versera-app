import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type LLMProvider = "anthropic" | "openai" | "groq" | "gemini";

export interface LLMKey {
  provider: LLMProvider;
  connected: boolean;
}

export function useLLMKeys() {
  return useQuery<LLMKey[]>({
    queryKey: ["llmKeys"],
    queryFn: () => api.get<LLMKey[]>("/v1/me/llm-keys"),
    staleTime: 30_000,
  });
}

export function useSaveLLMKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { provider: LLMProvider; apiKey: string }) =>
      api.put<LLMKey>("/v1/me/llm-keys", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llmKeys"] });
    },
  });
}

export function useDeleteLLMKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: LLMProvider) =>
      api.delete<void>(`/v1/me/llm-keys/${provider}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llmKeys"] });
    },
  });
}
