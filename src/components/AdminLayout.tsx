import { useState } from "react";
import { Outlet, NavLink, Link, Navigate } from "react-router-dom";
import { BarChart3, Users, DollarSign, ArrowLeft, LogOut, MessageSquare, Menu, X } from "lucide-react";
import { useMe } from "@/hooks/useAuth";
import { getUser, logout } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

const adminNav = [
  { title: "Overview", url: "/admin", icon: BarChart3, end: true },
  { title: "Users", url: "/admin/users", icon: Users, end: false },
  { title: "Revenue", url: "/admin/revenue", icon: DollarSign, end: true },
  { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquare, end: true },
];

export default function AdminLayout() {
  const { data: user, isLoading } = useMe();
  const cached = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait for user data before deciding
  if (isLoading && !cached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const currentUser = user ?? cached;

  // Redirect non-admins
  if (currentUser && !(currentUser as any).isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-5">
        <span className="text-xl font-bold tracking-tight" style={{ color: "#E24B4A" }}>
          Versera Admin
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {adminNav.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] px-4 py-4 space-y-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to app
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white/70">
            {currentUser?.avatar ?? "?"}
          </div>
          <p className="flex-1 truncate text-sm text-white/60">
            {currentUser?.email ?? "…"}
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile header */}
      <header className="fixed top-0 inset-x-0 z-50 flex h-12 items-center gap-3 border-b border-white/[0.06] px-4 md:hidden" style={{ backgroundColor: "#080808" }}>
        <button onClick={() => setSidebarOpen((v) => !v)} className="text-white/60 hover:text-white">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="text-sm font-bold" style={{ color: "#E24B4A" }}>Versera Admin</span>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - desktop always visible, mobile as overlay */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.06] transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#080808" }}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 pt-16 md:p-8 md:pt-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
