"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SettingsProvider } from "@/components/settings-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["light", "dark", "black"]}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <SettingsProvider>
          {children}
          <Toaster />
        </SettingsProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
