import { useAdminTestimonials, type Testimonial } from "@/hooks/useTestimonials";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

const statusBadge = (status: Testimonial["status"]) => {
  if (status === "approved")
    return "bg-emerald-500/15 text-emerald-400";
  if (status === "rejected")
    return "bg-zinc-500/15 text-zinc-400";
  return "bg-amber-500/15 text-amber-400";
};

export default function AdminTestimonials() {
  const { data: testimonials, isLoading } = useAdminTestimonials();
  const qc = useQueryClient();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const action = async (id: string, type: "approve" | "reject" | "delete") => {
    setLoading((p) => ({ ...p, [id]: true }));
    try {
      if (type === "delete") {
        await api.delete(`/v1/testimonials/admin/${id}`);
      } else {
        await api.put(`/v1/testimonials/admin/${id}/${type}`);
      }
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    } catch (err) {
      console.log(`${type} testimonial ${id} failed — endpoint may not exist yet`, err);
    } finally {
      setLoading((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !testimonials?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No testimonials submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Rating</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Content</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Submitted</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{t.role}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell max-w-[200px] truncate text-muted-foreground">
                    {t.content}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {t.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                          disabled={!!loading[t.id]}
                          onClick={() => action(t.id, "approve")}
                        >
                          Approve
                        </Button>
                      )}
                      {t.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={!!loading[t.id]}
                          onClick={() => action(t.id, "reject")}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                        disabled={!!loading[t.id]}
                        onClick={() => action(t.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
