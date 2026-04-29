import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlaygroundDraft {
  promptId: string;
  template: string;
  updatedAt?: string;
}

export interface PlaygroundRunResponse {
  output: string;
  tokens?: number;
  durationMs?: number;
  durationSeconds?: number;
  model?: string;
}

export function usePlaygroundRun() {
  return useMutation({
    mutationFn: (data: {
      promptId: string;
      template: string;
      variables: Record<string, string>;
      model: string;
    }) => api.post<PlaygroundRunResponse>("/v1/playground/run", data),
  });
}

export function useDraft(promptId: string | undefined) {
  return useQuery<PlaygroundDraft | null>({
    queryKey: ["playgroundDraft", promptId],
    queryFn: () => api.get<PlaygroundDraft | null>(`/v1/playground/draft/${promptId}`),
    enabled: !!promptId,
    staleTime: 0,
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { promptId: string; template: string }) =>
      api.post<PlaygroundDraft>("/v1/playground/draft", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["playgroundDraft", variables.promptId],
      });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promptId: string) =>
      api.delete<void>(`/v1/playground/draft/${promptId}`),
    onSuccess: (_data, promptId) => {
      queryClient.invalidateQueries({ queryKey: ["playgroundDraft", promptId] });
    },
  });
}
