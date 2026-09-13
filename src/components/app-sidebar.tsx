"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRightIcon,
  ChartPieIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  TableIcon,
  TargetIcon,
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

// Trading is its own group because those pages are a journal and a watchlist.
// They deliberately do not feed the portfolio numbers above them.
const groups = [
  {
    label: "Portfolio",
    links: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
      { href: "/investments", label: "Investments", icon: WalletIcon },
      { href: "/exposure", label: "Stock Exposure", icon: LayersIcon },
      { href: "/india", label: "India Market", icon: LandmarkIcon },
      { href: "/us", label: "US Market", icon: ChartPieIcon },
      { href: "/overlap", label: "Fund Overlap", icon: TableIcon },
    ],
  },
  {
    label: "Trading",
    links: [
      { href: "/trades", label: "Stock Trades", icon: ArrowLeftRightIcon },
      { href: "/analysis", label: "Stock Analysis", icon: TargetIcon },
    ],
  },
  {
    label: "Account",
    links: [{ href: "/settings", label: "Settings", icon: SettingsIcon }],
  },
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
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.links.map((link) => (
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
        ))}
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
