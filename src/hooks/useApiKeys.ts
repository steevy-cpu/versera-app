import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiKey, ApiKeyWithFull } from "@/lib/types";

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ["apiKeys"],
    queryFn: () => api.get<ApiKey[]>("/v1/api-keys"),
    staleTime: 60_000,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.post<ApiKeyWithFull>("/v1/api-keys", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/v1/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}
