import { randomUUID } from "node:crypto";
import type { AuthUser, Fund, FundHolding, Investment, InvestmentSync, Security, Session } from "@/lib/api/types";
import { hashPassword } from "@/lib/auth/password";
import { DEMO_USER_ID } from "@/lib/api/mock/data";
import { FX_AS_OF, FX_USD_INR } from "@/lib/finance/currency";

type Store = {
  users: Map<string, AuthUser>;
  usersByEmail: Map<string, string>;
  sessions: Map<string, Session>;
  investments: Investment[];
  securities: Security[];
  funds: Fund[];
  holdings: FundHolding[];
  syncs: InvestmentSync[];
  seeded: boolean;
};

const globalStore = globalThis as typeof globalThis & { __portfolioStore?: Store };

function createStore(): Store {
  return {
    users: new Map(),
    usersByEmail: new Map(),
    sessions: new Map(),
    investments: [],
    securities: [],
    funds: [],
    holdings: [],
    syncs: [],
    seeded: false,
  };
}

export function getStore(): Store {
  if (!globalStore.__portfolioStore) {
    globalStore.__portfolioStore = createStore();
  }
  return globalStore.__portfolioStore;
}

export function getSessionStore(): Map<string, Session> {
  return getStore().sessions;
}

export async function ensureDemoUser(): Promise<void> {
  const store = getStore();
  if (store.seeded) {
    return;
  }
  store.seeded = true;

  const email = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD;
  if (!email || !password) {
    return;
  }

  const user: AuthUser = {
    id: DEMO_USER_ID,
    email,
    name: "Investor",
    displayCurrency: "INR",
    fxUsdInr: FX_USD_INR,
    fxAsOf: FX_AS_OF,
    createdAt: "2023-01-01T00:00:00.000Z",
    passwordHash: await hashPassword(password),
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(email, user.id);
}

export function userCatalog(userId: string) {
  const store = getStore();
  return {
    funds: structuredClone(store.funds.filter((item) => item.userId === userId)),
    holdings: structuredClone(store.holdings.filter((item) => item.userId === userId)),
    securities: structuredClone(store.securities.filter((item) => item.userId === userId)),
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}
