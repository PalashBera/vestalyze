"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/api/types";
import { api } from "@/lib/api/client";

type SettingsContextValue = {
  user: User | null;
  setTradeTargets: (input: { targetProfitPercentage: number; targetLossPercentage: number }) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  async function refreshUser() {
    try {
      const { user: nextUser } = await api.auth.me();
      setUser(nextUser);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const { user: nextUser } = await api.auth.me();
        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function updateTradeTargets(input: { targetProfitPercentage: number; targetLossPercentage: number }) {
    const settings = await api.settings.updateTargets(input);
    setUser((current) =>
      current
        ? {
            ...current,
            targetProfitPercentage: settings.targetProfitPercentage,
            targetLossPercentage: settings.targetLossPercentage,
          }
        : current,
    );
  }

  const value = useMemo<SettingsContextValue>(
    () => ({
      user,
      setTradeTargets: updateTradeTargets,
      refreshUser,
    }),
    [user],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
