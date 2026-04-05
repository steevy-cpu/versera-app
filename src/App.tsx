import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Prompts from "@/pages/Prompts";
import PromptEditor from "@/pages/PromptEditor";
import Versions from "@/pages/Versions";
import ApiKeys from "@/pages/ApiKeys";
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import Docs from "@/pages/Docs";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import CookiesPage from "@/pages/CookiesPage";
import NotFound from "@/pages/NotFound";
import AdminLayout from "@/components/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminUserDetail from "@/pages/admin/AdminUserDetail";
import AdminRevenue from "@/pages/admin/AdminRevenue";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import { isAuthenticated } from "@/lib/auth";

const queryClient = new QueryClient();

/** Redirects unauthenticated users to /login */
function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<CookiesPage />} />

          {/* Redirect logged-in users away from /login */}
          <Route
            path="/login"
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Signup />}
          />

          {/* All dashboard routes require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prompts" element={<Prompts />} />
              <Route path="/prompts/:id" element={<PromptEditor />} />
              <Route path="/prompts/:id/versions" element={<Versions />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Admin routes — AdminLayout handles its own isAdmin check */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetail />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
