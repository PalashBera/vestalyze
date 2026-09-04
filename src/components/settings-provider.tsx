"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Currency, FxRate, User } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { convert } from "@/lib/finance/currency";
import { formatMoney } from "@/lib/format";

type SettingsContextValue = {
  user: User | null;
  currency: Currency;
  fxRate: FxRate | null;
  setCurrency: (currency: Currency) => Promise<void>;
  refreshUser: () => Promise<void>;
  money: (amountInr: number, compact?: boolean) => string;
  moneyNative: (amount: number, native: Currency, compact?: boolean) => string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [fxRate, setFxRate] = useState<FxRate | null>(null);

  async function refreshUser() {
    try {
      const [{ user: nextUser }, rate] = await Promise.all([api.auth.me(), api.settings.fx()]);
      setUser(nextUser);
      setFxRate(rate);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [{ user: nextUser }, rate] = await Promise.all([api.auth.me(), api.settings.fx()]);
        if (cancelled) {
          return;
        }
        setUser(nextUser);
        setFxRate(rate);
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

  async function setCurrency(currency: Currency) {
    const settings = await api.settings.update(currency);
    setUser((current) => (current ? { ...current, displayCurrency: settings.displayCurrency } : current));
  }

  const value = useMemo<SettingsContextValue>(() => {
    const displayCurrency = user?.displayCurrency ?? "INR";
    const rate = fxRate?.rate ?? 87.25;
    return {
      user,
      currency: displayCurrency,
      fxRate,
      setCurrency,
      refreshUser,
      money: (amountInr, compact) =>
        formatMoney(convert(amountInr, "INR", displayCurrency, rate), displayCurrency, compact),
      moneyNative: (amount, native, compact) => formatMoney(amount, native, compact),
    };
  }, [user, fxRate]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
