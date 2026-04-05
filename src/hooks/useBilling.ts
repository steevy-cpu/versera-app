import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Plan, Transaction } from "@/lib/types";

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api.get<Plan[]>("/v1/billing/plans"),
    staleTime: Infinity, // plans never change at runtime
  });
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => api.get<Transaction[]>("/v1/billing/transactions"),
    staleTime: 30_000,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: string) =>
      api.post<{ checkoutUrl: string; plan: Plan; message: string }>(
        "/v1/billing/checkout",
        { plan }
      ),
    onSuccess: () => {
      // Refresh credit balance after checkout redirect
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
