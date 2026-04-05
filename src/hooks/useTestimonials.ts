import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function useTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ["testimonials"],
    queryFn: async () => {
      try {
        return await api.get<Testimonial[]>("/v1/testimonials");
      } catch {
        console.log("GET /v1/testimonials not available yet — returning empty");
        return [];
      }
    },
    staleTime: 60_000,
  });
}

export function useAdminTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      try {
        return await api.get<Testimonial[]>("/v1/testimonials/admin");
      } catch {
        console.log("GET /v1/testimonials/admin not available yet — returning empty");
        return [];
      }
    },
    staleTime: 30_000,
  });
}
