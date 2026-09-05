import type {
  AuthUser,
  CreateInvestmentRequest,
  Fund,
  FundHolding,
  Investment,
  InvestmentSync,
  LoginRequest,
  RegisterRequest,
  UpdateInvestmentRequest,
  User,
} from "@/lib/api/types";
import { createId, ensureDemoUser, getStore, userCatalog } from "@/lib/api/mock/store";
import { scrapeFundHoldings } from "@/lib/extract/holdings";
import { buildSecurityFromCompany, buildSecurityFromInput } from "@/lib/investments/security";
import { isFundVehicle, normalizeSourceUrl } from "@/lib/investments/fund-url";
import { hashPassword, isValidEmail, isValidPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionId, hashUserAgent } from "@/lib/auth/session";
import {
  buildMarketDashboard,
  buildOverlaps,
  buildOverview,
  calculateExposures,
} from "@/lib/finance/exposure";
import { FX_AS_OF, FX_USD_INR, getFxRate } from "@/lib/finance/currency";

const AUTH_ERROR = "Invalid username or password";

function toPublicUser(user: AuthUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayCurrency: user.displayCurrency,
    createdAt: user.createdAt,
  };
}

function userInvestments(userId: string): Investment[] {
  return getStore().investments.filter((item) => item.userId === userId);
}

function catalog(userId: string) {
  return userCatalog(userId);
}

function fxFor(userId: string) {
  const user = getStore().users.get(userId);
  return getFxRate(user ? { rate: user.fxUsdInr, asOf: user.fxAsOf } : undefined);
}

function exposuresFor(userId: string) {
  const { funds, holdings, securities } = catalog(userId);
  return calculateExposures(userInvestments(userId), holdings, securities, funds, fxFor(userId).rate);
}

function ensureMockFund(
  userId: string,
  input: { name: string; type: "mutual_fund" | "etf"; country: Investment["country"]; currency: Investment["currency"]; sourceUrl: string },
): Fund {
  const store = getStore();
  const existing = store.funds.find((item) => item.userId === userId && item.sourceUrl === input.sourceUrl);
  if (existing) {
    existing.name = input.name;
    return existing;
  }
  const now = new Date().toISOString();
  const fund: Fund = {
    id: createId("fund"),
    userId,
    name: input.name,
    symbol: input.name.slice(0, 12).toUpperCase(),
    type: input.type,
    fundHouse: new URL(input.sourceUrl).hostname,
    category: "Uncategorized",
    country: input.country,
    currency: input.currency,
    latestPortfolioDate: now.slice(0, 10),
    sourceWebsite: new URL(input.sourceUrl).hostname,
    sourceUrl: input.sourceUrl,
    lastScrapedAt: now,
    dataStatus: "pending",
  };
  store.funds.push(fund);
  return fund;
}

export async function mockLogin(input: LoginRequest, userAgent: string | null) {
  await ensureDemoUser();
  const email = input.email.trim().toLowerCase();
  const store = getStore();
  const userId = store.usersByEmail.get(email);
  const user = userId ? store.users.get(userId) : undefined;

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw Object.assign(new Error(AUTH_ERROR), { status: 401 });
  }

  const sessionId = createSessionId();
  store.sessions.set(sessionId, {
    id: sessionId,
    userId: user.id,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    userAgentHash: hashUserAgent(userAgent),
  });

  return { sessionId, user: toPublicUser(user) };
}

export async function mockRegister(input: RegisterRequest, userAgent: string | null) {
  await ensureDemoUser();
  if (!input.name.trim() || input.name.trim().length > 80) {
    throw Object.assign(new Error("Name is required."), { status: 400 });
  }
  if (!isValidEmail(input.email)) {
    throw Object.assign(new Error("Enter a valid email address."), { status: 400 });
  }
  if (!isValidPassword(input.password)) {
    throw Object.assign(new Error("Password must be between 8 and 128 characters."), { status: 400 });
  }

  const store = getStore();
  const email = input.email.trim().toLowerCase();
  if (store.usersByEmail.has(email)) {
    throw Object.assign(new Error("Unable to create account."), { status: 400 });
  }

  const user: AuthUser = {
    id: createId("user"),
    email,
    name: input.name.trim(),
    displayCurrency: "INR",
    fxUsdInr: FX_USD_INR,
    fxAsOf: FX_AS_OF,
    createdAt: new Date().toISOString(),
    passwordHash: await hashPassword(input.password),
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(email, user.id);

  const sessionId = createSessionId();
  store.sessions.set(sessionId, {
    id: sessionId,
    userId: user.id,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    userAgentHash: hashUserAgent(userAgent),
  });

  return { sessionId, user: toPublicUser(user) };
}

export function mockLogout(sessionId: string | null) {
  if (sessionId) {
    getStore().sessions.delete(sessionId);
  }
}

export async function mockMe(userId: string) {
  await ensureDemoUser();
  const user = getStore().users.get(userId);
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return toPublicUser(user);
}

export function mockListInvestments(userId: string) {
  return userInvestments(userId);
}

export function mockGetInvestment(userId: string, id: string) {
  const investment = userInvestments(userId).find((item) => item.id === id);
  if (!investment) {
    throw Object.assign(new Error("Investment not found"), { status: 404 });
  }
  const { funds, holdings, securities } = catalog(userId);
  return {
    investment,
    fund: investment.fundId ? funds.find((item) => item.id === investment.fundId) : undefined,
    security: investment.securityId
      ? securities.find((item) => item.id === investment.securityId)
      : undefined,
    holdings: investment.fundId
      ? holdings
          .filter((item) => item.fundId === investment.fundId)
          .map((item) => ({
            ...item,
            security: securities.find((security) => security.id === item.securityId),
          }))
      : [],
    syncs: getStore()
      .syncs.filter((item) => item.investmentId === id && item.userId === userId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 20),
  };
}

export function mockCreateInvestment(userId: string, input: CreateInvestmentRequest) {
  if (!input.name?.trim()) {
    throw Object.assign(new Error("Investment name is required."), { status: 400 });
  }
  if (!["mutual_fund", "etf", "stock"].includes(input.type)) {
    throw Object.assign(new Error("Invalid investment type."), { status: 400 });
  }
  if (!["IN", "US"].includes(input.country) || !["INR", "USD"].includes(input.currency)) {
    throw Object.assign(new Error("Invalid country or currency."), { status: 400 });
  }
  if (!Number.isFinite(input.investedAmount) || input.investedAmount <= 0) {
    throw Object.assign(new Error("Invested amount must be greater than zero."), { status: 400 });
  }

  const sourceUrl = normalizeSourceUrl(input.sourceUrl);
  if (isFundVehicle(input.type) && !sourceUrl) {
    throw Object.assign(new Error("Fund URL is required for mutual funds and ETFs."), { status: 400 });
  }

  const now = new Date().toISOString();
  let fundId = input.fundId;
  if (input.fundId) {
    const ownedFund = getStore().funds.find((item) => item.id === input.fundId && item.userId === userId);
    if (!ownedFund) {
      throw Object.assign(new Error("Fund not found"), { status: 404 });
    }
  }
  if (isFundVehicle(input.type) && sourceUrl) {
    fundId = ensureMockFund(userId, {
      name: input.name.trim(),
      type: input.type,
      country: input.country,
      currency: input.currency,
      sourceUrl,
    }).id;
  }
  const security = buildSecurityFromInput(input, userId);
  if (security) {
    const store = getStore();
    const existing = store.securities.find(
      (item) =>
        item.userId === userId && item.ticker === security.ticker && item.country === security.country,
    );
    if (existing) {
      security.id = existing.id;
    } else {
      store.securities.push(security);
    }
  } else if (input.securityId) {
    const owned = getStore().securities.find((item) => item.id === input.securityId && item.userId === userId);
    if (!owned) {
      throw Object.assign(new Error("Security not found"), { status: 404 });
    }
  }
  const investment: Investment = {
    id: createId("inv"),
    userId,
    fundId,
    securityId: security?.id ?? input.securityId,
    name: input.name.trim(),
    type: input.type,
    country: input.country,
    currency: input.currency,
    investedAmount: input.investedAmount,
    units: input.units,
    sourceUrl: sourceUrl || undefined,
    createdAt: now,
    updatedAt: now,
  };
  getStore().investments.push(investment);
  return investment;
}

export function mockUpdateInvestment(userId: string, id: string, input: UpdateInvestmentRequest) {
  const store = getStore();
  const investment = store.investments.find((item) => item.id === id && item.userId === userId);
  if (!investment) {
    throw Object.assign(new Error("Investment not found"), { status: 404 });
  }
  if (input.name) {
    investment.name = input.name.trim();
  }
  if (input.investedAmount !== undefined) {
    if (input.investedAmount <= 0) {
      throw Object.assign(new Error("Invested amount must be greater than zero."), { status: 400 });
    }
    investment.investedAmount = input.investedAmount;
  }
  if (input.units !== undefined) {
    investment.units = input.units;
  }
  if (input.sourceUrl !== undefined) {
    const sourceUrl = normalizeSourceUrl(input.sourceUrl);
    if (isFundVehicle(investment.type) && !sourceUrl) {
      throw Object.assign(new Error("Fund URL is required for mutual funds and ETFs."), { status: 400 });
    }
    investment.sourceUrl = sourceUrl || undefined;
    if (isFundVehicle(investment.type) && sourceUrl) {
      investment.fundId = ensureMockFund(userId, {
        name: investment.name,
        type: investment.type,
        country: investment.country,
        currency: investment.currency,
        sourceUrl,
      }).id;
    }
  }
  investment.updatedAt = new Date().toISOString();
  return investment;
}

export async function mockSyncInvestment(userId: string, id: string) {
  const store = getStore();
  const investment = store.investments.find((item) => item.id === id && item.userId === userId);
  if (!investment) {
    throw Object.assign(new Error("Investment not found"), { status: 404 });
  }
  if (!isFundVehicle(investment.type)) {
    throw Object.assign(new Error("Sync is only available for mutual funds and ETFs."), { status: 400 });
  }
  const sourceUrl = normalizeSourceUrl(investment.sourceUrl);
  if (!sourceUrl) {
    throw Object.assign(new Error("Add a fund URL before syncing holdings."), { status: 400 });
  }

  const startedAt = new Date().toISOString();
  const sync: InvestmentSync = {
    id: createId("sync"),
    userId,
    investmentId: id,
    startedAt,
    status: "running",
    recordsProcessed: 0,
  };
  store.syncs.unshift(sync);

  try {
    const scraped = await scrapeFundHoldings(sourceUrl);
    const fund = ensureMockFund(userId, {
      name: investment.name,
      type: investment.type,
      country: investment.country,
      currency: investment.currency,
      sourceUrl,
    });
    investment.fundId = fund.id;
    store.holdings = store.holdings.filter((item) => item.fundId !== fund.id);
    const holdings: FundHolding[] = scraped.holdings.map((item) => {
      const security = buildSecurityFromCompany(userId, item.name, investment.country);
      const existing = store.securities.find(
        (row) => row.userId === userId && row.ticker === security.ticker && row.country === security.country,
      );
      if (existing) {
        security.id = existing.id;
      } else {
        store.securities.push(security);
      }
      return {
        id: createId("hold"),
        userId,
        fundId: fund.id,
        securityId: security.id,
        allocationPercentage: item.allocationPercentage,
        holdingDate: scraped.holdingDate,
        sourceId: "indmoney-holdings",
      };
    });
    store.holdings.push(...holdings);
    fund.lastScrapedAt = new Date().toISOString();
    fund.latestPortfolioDate = scraped.holdingDate;
    fund.dataStatus = "fresh";
    const completedAt = new Date().toISOString();
    for (const row of store.investments.filter((item) => item.fundId === fund.id && item.userId === userId)) {
      row.lastSyncedAt = completedAt;
    }
    sync.status = "success";
    sync.recordsProcessed = holdings.length;
    return { investment, sync, recordsProcessed: holdings.length };
  } catch (error) {
    sync.status = "failed";
    sync.errorMessage = error instanceof Error ? error.message : "Sync failed";
    throw error;
  }
}

export function mockListSyncs(userId: string, investmentId: string) {
  mockGetInvestment(userId, investmentId);
  return getStore()
    .syncs.filter((item) => item.investmentId === investmentId && item.userId === userId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 50);
}

export function mockDeleteInvestment(userId: string, id: string) {
  const store = getStore();
  const index = store.investments.findIndex((item) => item.id === id && item.userId === userId);
  if (index === -1) {
    throw Object.assign(new Error("Investment not found"), { status: 404 });
  }
  store.investments.splice(index, 1);
  store.syncs = store.syncs.filter((item) => item.investmentId !== id);
  return { ok: true };
}

export function mockListFunds(userId: string) {
  return catalog(userId).funds;
}

export function mockGetFund(userId: string, id: string) {
  const { funds, holdings, securities } = catalog(userId);
  const fund = funds.find((item) => item.id === id);
  if (!fund) {
    throw Object.assign(new Error("Fund not found"), { status: 404 });
  }
  return {
    fund,
    holdings: holdings
      .filter((item) => item.fundId === id)
      .map((item) => ({
        ...item,
        security: securities.find((security) => security.id === item.securityId),
      })),
  };
}

export function mockRefreshFund(userId: string, id: string) {
  const { funds, holdings } = catalog(userId);
  const fund = funds.find((item) => item.id === id);
  if (!fund) {
    throw Object.assign(new Error("Fund not found"), { status: 404 });
  }
  return {
    fundId: id,
    status: "success" as const,
    recordsProcessed: holdings.filter((item) => item.fundId === id).length,
    lastScrapedAt: new Date().toISOString(),
    message: "Holdings refresh completed from your catalog.",
  };
}

export function mockListSecurities(userId: string) {
  return catalog(userId).securities;
}

export function mockGetSecurity(userId: string, id: string) {
  const security = catalog(userId).securities.find((item) => item.id === id);
  if (!security) {
    throw Object.assign(new Error("Security not found"), { status: 404 });
  }
  return security;
}

export function mockOverview(userId: string) {
  return buildOverview(userInvestments(userId), exposuresFor(userId), fxFor(userId));
}

export function mockMarket(userId: string, country: "IN" | "US") {
  return buildMarketDashboard(country, userInvestments(userId), exposuresFor(userId), fxFor(userId).rate);
}

export function mockExposure(userId: string) {
  return exposuresFor(userId);
}

export function mockExposureDetail(userId: string, securityId: string) {
  const row = exposuresFor(userId).find((item) => item.security.id === securityId);
  if (!row) {
    throw Object.assign(new Error("Exposure not found"), { status: 404 });
  }
  return row;
}

export function mockAllocation(userId: string) {
  const overview = mockOverview(userId);
  const rate = fxFor(userId).rate;
  return {
    market: overview.marketAllocation,
    type: overview.typeAllocation,
    stocks: overview.topHoldings.map((item) => ({
      key: item.security.id,
      label: item.security.standardizedName,
      amountInr: item.totalInvestedInr,
      amountUsd: item.totalInvestedInr / rate,
      percentage: item.portfolioPercentage,
    })),
  };
}

export function mockOverlap(userId: string) {
  const { funds, holdings, securities } = catalog(userId);
  const overlaps = buildOverlaps(userInvestments(userId), holdings, funds);
  return overlaps.map((item) => ({
    ...item,
    overlappingSecurities: item.overlappingSecurities.map((overlap) => {
      const security = securities.find((row) => row.id === overlap.securityId);
      return {
        ...overlap,
        name: security?.standardizedName ?? overlap.name,
        ticker: security?.ticker ?? overlap.ticker,
      };
    }),
  }));
}

export async function mockGetSettings(userId: string) {
  const user = await mockMe(userId);
  return { displayCurrency: user.displayCurrency };
}

export async function mockUpdateSettings(userId: string, displayCurrency: "INR" | "USD") {
  if (displayCurrency !== "INR" && displayCurrency !== "USD") {
    throw Object.assign(new Error("Unsupported display currency."), { status: 400 });
  }
  const user = getStore().users.get(userId);
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  user.displayCurrency = displayCurrency;
  return { displayCurrency };
}

export function mockFxRate(userId: string) {
  return fxFor(userId);
}

export function mockUpdateFxRate(userId: string, rate: number) {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 500) {
    throw Object.assign(new Error("Enter a USD/INR rate between 0 and 500."), { status: 400 });
  }
  const user = getStore().users.get(userId);
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  user.fxUsdInr = rate;
  user.fxAsOf = new Date().toISOString().slice(0, 10);
  return fxFor(userId);
}
