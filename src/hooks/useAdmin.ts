import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminStats {
  totalUsers: number;
  totalPrompts: number;
  totalResolves: number;
  totalRevenueCents: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersThisWeek: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  credits: number;
  totalCredits: number;
  promptCount: number;
  totalSpentCents: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  name: string;
  avatar: string;
  credits: number;
  totalCredits: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  prompts: {
    id: string;
    slug: string;
    name: string;
    environment: string;
    status: string;
    createdAt: string;
    _count: { versions: number };
  }[];
  transactions: {
    id: string;
    description: string;
    credits: number;
    amountCents: number;
    createdAt: string;
  }[];
  apiKeys: {
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
  }[];
}

export interface AdminRevenue {
  totalRevenueCents: number;
  thisMonthCents: number;
  lastMonthCents: number;
  byPlan: Record<string, { count: number; revenueCents: number }>;
  recentTransactions: {
    id: string;
    description: string;
    credits: number;
    amountCents: number;
    createdAt: string;
  }[];
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/v1/admin/stats"),
    staleTime: 30_000,
  });
}

export function useAdminUsers(page: number, limit = 20) {
  return useQuery<AdminUsersResponse>({
    queryKey: ["admin", "users", page, limit],
    queryFn: () => api.get<AdminUsersResponse>(`/v1/admin/users?page=${page}&limit=${limit}`),
    staleTime: 30_000,
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery<AdminUserDetail>({
    queryKey: ["admin", "users", id],
    queryFn: () => api.get<AdminUserDetail>(`/v1/admin/users/${id}`),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useAdminRevenue() {
  return useQuery<AdminRevenue>({
    queryKey: ["admin", "revenue"],
    queryFn: () => api.get<AdminRevenue>("/v1/admin/revenue"),
    staleTime: 30_000,
  });
}
