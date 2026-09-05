"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartPieIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  TableIcon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SidebarBrand } from "@/components/brand-mark";
import { api } from "@/lib/api/client";
import { useSettings } from "@/components/settings-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <SidebarHeader className="p-3">
        <SidebarBrand />
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
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={() => void logout()}
                />
              }
            >
              <LogOutIcon />
              <span className="sr-only">Logout</span>
            </TooltipTrigger>
            <TooltipContent>Logout</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
