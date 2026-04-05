import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User, Stats, UsageStats } from "@/lib/types";

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/v1/me"),
    staleTime: 60_000,
  });
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.get<Stats>("/v1/me/stats"),
    staleTime: 60_000,
  });
}

export function useUsage() {
  return useQuery<UsageStats>({
    queryKey: ["usage"],
    queryFn: () => api.get<UsageStats>("/v1/me/usage"),
    staleTime: 60_000,
  });
}
