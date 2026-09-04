"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartPieIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  RefreshCwIcon,
  SettingsIcon,
  TableIcon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useSettings } from "@/components/settings-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/investments", label: "Investments", icon: WalletIcon },
  { href: "/exposure", label: "Stock Exposure", icon: LayersIcon },
  { href: "/india", label: "India Market", icon: LandmarkIcon },
  { href: "/us", label: "US Market", icon: ChartPieIcon },
  { href: "/overlap", label: "Fund Overlap", icon: TableIcon },
  { href: "/data-sources", label: "Data Sources", icon: RefreshCwIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSettings();

  async function logout() {
    await api.auth.logout();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex flex-col gap-1 px-2 py-1">
          <p className="font-heading text-sm font-medium">Look-Through</p>
          <p className="text-xs text-muted-foreground">Investment intelligence</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    isActive={pathname === link.href}
                    render={<Link href={link.href} />}
                    tooltip={link.label}
                  >
                    <link.icon />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <Avatar className="size-8">
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "IN"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{user?.name ?? "Investor"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => void logout()}>
            <LogOutIcon />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
