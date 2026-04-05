import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Prompt, PromptVersion } from "@/lib/types";

export function usePrompts(search?: string, environment?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (environment && environment !== "all")
    params.set("environment", environment);
  const qs = params.toString();

  return useQuery<Prompt[]>({
    queryKey: ["prompts", search ?? "", environment ?? ""],
    queryFn: () => api.get<Prompt[]>(`/v1/prompts${qs ? `?${qs}` : ""}`),
    staleTime: 30_000,
  });
}

export function usePrompt(slug: string | undefined) {
  return useQuery<Prompt>({
    queryKey: ["prompt", slug],
    queryFn: () => api.get<Prompt>(`/v1/prompts/${slug}`),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      environment: string;
      template: string;
      message?: string;
    }) => api.post<Prompt>("/v1/prompts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useSaveVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      template,
      message,
    }: {
      slug: string;
      template: string;
      message?: string;
    }) =>
      api.post<PromptVersion>(`/v1/prompts/${slug}/versions`, {
        template,
        message,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prompt", variables.slug] });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useRollback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, version }: { slug: string; version: number }) =>
      api.post<PromptVersion>(
        `/v1/prompts/${slug}/versions/${version}/rollback`,
        {}
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prompt", variables.slug] });
    },
  });
}
