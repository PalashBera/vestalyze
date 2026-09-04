import { randomUUID } from "node:crypto";
import type { AuthUser, Investment, InvestmentTransaction, Session } from "@/lib/api/types";
import { hashPassword } from "@/lib/auth/password";
import {
  DEMO_USER_ID,
  dataSources,
  funds,
  holdings,
  scrapingLogs,
  securities,
  seedInvestments,
  seedTransactions,
} from "@/lib/api/mock/data";

type Store = {
  users: Map<string, AuthUser>;
  usersByEmail: Map<string, string>;
  sessions: Map<string, Session>;
  investments: Investment[];
  transactions: InvestmentTransaction[];
  seeded: boolean;
};

const globalStore = globalThis as typeof globalThis & { __portfolioStore?: Store };

function createStore(): Store {
  return {
    users: new Map(),
    usersByEmail: new Map(),
    sessions: new Map(),
    investments: structuredClone(seedInvestments),
    transactions: structuredClone(seedTransactions),
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
    name: "Demo Investor",
    displayCurrency: "INR",
    createdAt: "2023-01-01T00:00:00.000Z",
    passwordHash: await hashPassword(password),
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(email, user.id);
}

export function publicCatalog() {
  return {
    funds: structuredClone(funds),
    holdings: structuredClone(holdings),
    securities: structuredClone(securities),
    dataSources: structuredClone(dataSources),
    scrapingLogs: structuredClone(scrapingLogs),
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}
