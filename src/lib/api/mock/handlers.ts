import type {
  AuthUser,
  CreateInvestmentRequest,
  CreateTransactionRequest,
  Investment,
  LoginRequest,
  RegisterRequest,
  UpdateInvestmentRequest,
  User,
} from "@/lib/api/types";
import { createId, ensureDemoUser, getStore, publicCatalog } from "@/lib/api/mock/store";
import { extractPublicUrl } from "@/lib/extract/url";
import { hashPassword, isValidEmail, isValidPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionId, hashUserAgent } from "@/lib/auth/session";
import {
  buildMarketDashboard,
  buildOverlaps,
  buildOverview,
  calculateExposures,
} from "@/lib/finance/exposure";
import { getFxRate } from "@/lib/finance/currency";

const AUTH_ERROR = "Invalid username or password";

function cloneDemoPortfolio(userId: string) {
  const store = getStore();
  const originals = store.investments.filter((item) => item.userId === "user-demo");
  for (const item of originals) {
    const nextId = createId("inv");
    store.investments.push({
      ...item,
      id: nextId,
      userId,
    });
    for (const transaction of store.transactions.filter((row) => row.investmentId === item.id)) {
      store.transactions.push({
        ...transaction,
        id: createId("txn"),
        investmentId: nextId,
      });
    }
  }
}

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

function catalog() {
  return publicCatalog();
}

function exposuresFor(userId: string) {
  const { funds, holdings, securities } = catalog();
  return calculateExposures(userInvestments(userId), holdings, securities, funds);
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
    createdAt: new Date().toISOString(),
    passwordHash: await hashPassword(input.password),
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(email, user.id);
  cloneDemoPortfolio(user.id);

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
  const { funds, holdings, securities } = catalog();
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
    transactions: getStore().transactions.filter((item) => item.investmentId === id),
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

  const now = new Date().toISOString();
  const investment: Investment = {
    id: createId("inv"),
    userId,
    fundId: input.fundId,
    securityId: input.securityId,
    name: input.name.trim(),
    type: input.type,
    country: input.country,
    currency: input.currency,
    investedAmount: input.investedAmount,
    currentValue: input.currentValue > 0 ? input.currentValue : input.investedAmount,
    units: input.units,
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
  if (input.currentValue !== undefined) {
    investment.currentValue = input.currentValue;
  }
  if (input.units !== undefined) {
    investment.units = input.units;
  }
  investment.updatedAt = new Date().toISOString();
  return investment;
}

export function mockDeleteInvestment(userId: string, id: string) {
  const store = getStore();
  const index = store.investments.findIndex((item) => item.id === id && item.userId === userId);
  if (index === -1) {
    throw Object.assign(new Error("Investment not found"), { status: 404 });
  }
  store.investments.splice(index, 1);
  store.transactions = store.transactions.filter((item) => item.investmentId !== id);
  return { ok: true };
}

export function mockCreateTransaction(userId: string, investmentId: string, input: CreateTransactionRequest) {
  const investment = userInvestments(userId).find((item) => item.id === investmentId);
  if (!investment) {
    throw Object.assign(new Error("Investment not found"), { status: 404 });
  }
  if (!input.transactionDate || input.investedAmount <= 0) {
    throw Object.assign(new Error("A valid date and amount are required."), { status: 400 });
  }
  const transaction = {
    id: createId("txn"),
    investmentId,
    transactionDate: input.transactionDate,
    units: input.units,
    purchasePrice: input.purchasePrice,
    investedAmount: input.investedAmount,
  };
  getStore().transactions.push(transaction);
  investment.investedAmount += input.investedAmount;
  if (input.units) {
    investment.units = (investment.units ?? 0) + input.units;
  }
  investment.updatedAt = new Date().toISOString();
  return transaction;
}

export function mockDeleteTransaction(userId: string, id: string) {
  const store = getStore();
  const transaction = store.transactions.find((item) => item.id === id);
  if (!transaction) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }
  const investment = store.investments.find(
    (item) => item.id === transaction.investmentId && item.userId === userId,
  );
  if (!investment) {
    throw Object.assign(new Error("Transaction not found"), { status: 404 });
  }
  store.transactions = store.transactions.filter((item) => item.id !== id);
  return { ok: true };
}

export function mockListFunds() {
  return catalog().funds;
}

export function mockGetFund(id: string) {
  const { funds, holdings, securities } = catalog();
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

export function mockRefreshFund(id: string) {
  const fund = catalog().funds.find((item) => item.id === id);
  if (!fund) {
    throw Object.assign(new Error("Fund not found"), { status: 404 });
  }
  return {
    fundId: id,
    status: "success" as const,
    recordsProcessed: catalog().holdings.filter((item) => item.fundId === id).length,
    lastScrapedAt: new Date().toISOString(),
    message: "Mock refresh completed. Holdings were reloaded from the local catalog.",
  };
}

export function mockListSecurities() {
  return catalog().securities;
}

export function mockGetSecurity(id: string) {
  const security = catalog().securities.find((item) => item.id === id);
  if (!security) {
    throw Object.assign(new Error("Security not found"), { status: 404 });
  }
  return security;
}

export function mockOverview(userId: string) {
  return buildOverview(userInvestments(userId), exposuresFor(userId));
}

export function mockMarket(userId: string, country: "IN" | "US") {
  return buildMarketDashboard(country, userInvestments(userId), exposuresFor(userId));
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
  return {
    market: overview.marketAllocation,
    type: overview.typeAllocation,
    sector: overview.sectorAllocation,
    stocks: overview.topHoldings.map((item) => ({
      key: item.security.id,
      label: item.security.standardizedName,
      amountInr: item.totalInvestedInr,
      amountUsd: item.totalInvestedInr / getFxRate().rate,
      percentage: item.portfolioPercentage,
    })),
  };
}

export function mockOverlap(userId: string) {
  const { funds, holdings, securities } = catalog();
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

export function mockDataSources() {
  return catalog().dataSources;
}

export function mockRefreshSource(id: string) {
  const source = catalog().dataSources.find((item) => item.id === id);
  if (!source) {
    throw Object.assign(new Error("Data source not found"), { status: 404 });
  }
  return {
    ...source,
    lastScrapedAt: new Date().toISOString(),
    lastSuccessfulAt: new Date().toISOString(),
    status: "fresh" as const,
  };
}

export function mockScrapingLogs() {
  return catalog().scrapingLogs;
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

export function mockFxRate() {
  return getFxRate();
}

export async function mockExtractUrl(userId: string, rawUrl: string) {
  const extracted = await extractPublicUrl(rawUrl);
  const record = {
    id: createId("ext"),
    userId,
    url: extracted.url,
    finalUrl: extracted.finalUrl,
    title: extracted.title,
    description: extracted.description,
    text: extracted.text,
    contentType: extracted.contentType,
    statusCode: extracted.statusCode,
    extractedAt: extracted.extractedAt,
  };
  getStore().urlExtractions.unshift(record);
  return record;
}

export function mockListExtractions(userId: string) {
  return getStore().urlExtractions.filter((item) => item.userId === userId).slice(0, 20);
}
