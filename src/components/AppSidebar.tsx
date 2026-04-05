import { LayoutDashboard, FileText, Key, CreditCard, Settings as SettingsIcon, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useMe } from "@/hooks/useAuth";
import { getUser, logout } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Prompts", url: "/prompts", icon: FileText },
  { title: "API Keys", url: "/api-keys", icon: Key },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Use cached user for instant render, React Query keeps it fresh
  const cached = getUser();
  const { data: user } = useMe();
  const display = user ?? cached;

  return (
    <Sidebar className="border-r-0">
      <div className="px-5 py-5">
        <span className="text-xl font-bold tracking-tight text-sidebar-primary">
          Versera
        </span>
      </div>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="h-9 gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                  >
                    <NavLink to={item.url} activeClassName="">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {display?.avatar ?? "?"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {display?.email ?? "…"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 flex items-center gap-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
