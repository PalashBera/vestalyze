import type {
  CreateInvestmentRequest,
  CreateStockAnalysisRequest,
  CreateStockTradeRequest,
  Currency,
  LoginRequest,
  RegisterRequest,
  UpdateInvestmentRequest,
  User,
} from "@/lib/api/types";
import { isValidEmail, isValidPassword } from "@/lib/auth/password";
import {
  buildMarketDashboard,
  buildOverlaps,
  buildOverview,
  calculateExposures,
} from "@/lib/finance/exposure";
import { getFxRate } from "@/lib/finance/currency";
import { buildSecurityFromCompany, buildSecurityFromInput, normalizeTicker } from "@/lib/investments/security";
import { isFundVehicle, normalizeSourceUrl } from "@/lib/investments/fund-url";
import { scrapeFundHoldings } from "@/lib/extract/holdings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapAnalysis,
  mapFund,
  mapHolding,
  mapInvestment,
  mapSecurity,
  mapSync,
  mapTrade,
  mapUser,
  throwQueryError,
} from "@/lib/api/supabase/mappers";

const AUTH_ERROR = "Invalid username or password";

async function client() {
  return createSupabaseServerClient();
}

async function loadProfile(userId: string, email: string): Promise<User> {
  const supabase = await client();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) {
    throwQueryError("Unauthorized", 401);
  }
  return mapUser(userId, email, data);
}

export async function supabaseLogin(input: LoginRequest) {
  const email = input.email.trim().toLowerCase();
  const supabase = await client();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error || !data.user || !data.session) {
    throwQueryError(AUTH_ERROR, 401);
  }
  return { user: await loadProfile(data.user.id, data.user.email ?? email) };
}

export async function supabaseRegister(input: RegisterRequest) {
  if (!input.name.trim() || input.name.trim().length > 80) {
    throwQueryError("Name is required.", 400);
  }
  if (!isValidEmail(input.email)) {
    throwQueryError("Enter a valid email address.", 400);
  }
  if (!isValidPassword(input.password)) {
    throwQueryError("Password must be between 8 and 128 characters.", 400);
  }

  const email = input.email.trim().toLowerCase();
  const supabase = await client();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { name: input.name.trim() } },
  });

  if (error || !data.user) {
    throwQueryError("Unable to create account.", 400);
  }
  if (!data.session) {
    throwQueryError("Account created. Confirm the email before signing in.", 400);
  }

  return { user: await loadProfile(data.user.id, data.user.email ?? email) };
}

export async function supabaseLogout() {
  const supabase = await client();
  await supabase.auth.signOut();
}

export async function supabaseMe(userId: string) {
  const supabase = await client();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) {
    throwQueryError("Unauthorized", 401);
  }
  return loadProfile(userId, data.user.email ?? "");
}

async function listInvestments(userId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) {
    throwQueryError("Unable to load investments.", 500);
  }
  return (data ?? []).map(mapInvestment);
}

async function catalog(userId: string) {
  const supabase = await client();
  const [funds, holdings, securities] = await Promise.all([
    supabase.from("funds").select("*").eq("user_id", userId),
    supabase.from("fund_holdings").select("*").eq("user_id", userId),
    supabase.from("securities").select("*").eq("user_id", userId),
  ]);
  if (funds.error || holdings.error || securities.error) {
    throwQueryError("Unable to load catalog.", 500);
  }
  return {
    funds: (funds.data ?? []).map(mapFund),
    holdings: (holdings.data ?? []).map(mapHolding),
    securities: (securities.data ?? []).map(mapSecurity),
  };
}

async function ensureSupabaseFund(
  userId: string,
  input: {
    name: string;
    type: "mutual_fund" | "etf";
    country: "IN" | "US";
    sourceUrl: string;
  },
) {
  const supabase = await client();
  const { data: existing } = await supabase
    .from("funds")
    .select("*")
    .eq("user_id", userId)
    .eq("source_url", input.sourceUrl)
    .maybeSingle();
  if (existing) {
    return mapFund(existing);
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("funds")
    .insert({
      id: `fund-${crypto.randomUUID()}`,
      user_id: userId,
      name: input.name,
      type: input.type,
      country: input.country,
      latest_portfolio_date: now.slice(0, 10),
      source_url: input.sourceUrl,
    })
    .select("*")
    .single();
  if (error || !data) {
    throwQueryError("Unable to save the fund source.", 400);
  }
  return mapFund(data);
}

async function fxRate(userId: string) {
  const supabase = await client();
  const { data } = await supabase
    .from("profiles")
    .select("fx_usd_inr, fx_as_of")
    .eq("id", userId)
    .maybeSingle();
  if (!data) {
    return getFxRate();
  }
  return getFxRate({ rate: Number(data.fx_usd_inr), asOf: data.fx_as_of });
}

async function exposuresFor(userId: string) {
  const [{ funds, holdings, securities }, investments, fx] = await Promise.all([
    catalog(userId),
    listInvestments(userId),
    fxRate(userId),
  ]);
  return {
    investments,
    funds,
    holdings,
    securities,
    fx,
    exposures: calculateExposures(investments, holdings, securities, funds, fx.rate),
  };
}

export async function supabaseListInvestments(userId: string) {
  return listInvestments(userId);
}

export async function supabaseGetInvestment(userId: string, id: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Investment not found", 404);
  }

  const investment = mapInvestment(data);
  const { funds, holdings, securities } = await catalog(userId);
  const { data: syncs } = await supabase
    .from("investment_syncs")
    .select("*")
    .eq("investment_id", id)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(20);

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
    syncs: (syncs ?? []).map(mapSync),
  };
}

export async function supabaseCreateInvestment(userId: string, input: CreateInvestmentRequest) {
  if (!input.name?.trim()) {
    throwQueryError("Investment name is required.", 400);
  }
  if (!["mutual_fund", "etf", "stock"].includes(input.type)) {
    throwQueryError("Invalid investment type.", 400);
  }
  if (!["IN", "US"].includes(input.country)) {
    throwQueryError("Invalid country.", 400);
  }
  if (!Number.isFinite(input.investedAmount) || input.investedAmount <= 0) {
    throwQueryError("Invested amount must be greater than zero.", 400);
  }

  const sourceUrl = normalizeSourceUrl(input.sourceUrl);
  if (isFundVehicle(input.type) && !sourceUrl) {
    throwQueryError("Fund URL is required for mutual funds and ETFs.", 400);
  }

  const supabase = await client();
  let fundId = input.fundId ?? null;
  if (input.fundId) {
    const { data: ownedFund } = await supabase
      .from("funds")
      .select("id")
      .eq("id", input.fundId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ownedFund) {
      throwQueryError("Fund not found", 404);
    }
  }
  if (isFundVehicle(input.type) && sourceUrl) {
    fundId = (
      await ensureSupabaseFund(userId, {
        name: input.name.trim(),
        type: input.type,
        country: input.country,
        sourceUrl,
      })
    ).id;
  }
  const security = buildSecurityFromInput(input, userId);
  if (security) {
    const { data: existing } = await supabase
      .from("securities")
      .select("id")
      .eq("user_id", userId)
      .eq("ticker", security.ticker)
      .eq("country", security.country)
      .maybeSingle();
    if (existing) {
      security.id = existing.id;
    } else {
      const { error: securityError } = await supabase.from("securities").insert({
        id: security.id,
        user_id: userId,
        standardized_name: security.standardizedName,
        ticker: security.ticker,
        country: security.country,
      });
      if (securityError) {
        throwQueryError("Unable to save the stock details.", 400);
      }
    }
  } else if (input.securityId) {
    const { data: ownedSecurity } = await supabase
      .from("securities")
      .select("id")
      .eq("id", input.securityId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ownedSecurity) {
      throwQueryError("Security not found", 404);
    }
  }
  const { data, error } = await supabase
    .from("investments")
    .insert({
      user_id: userId,
      fund_id: fundId,
      security_id: security?.id ?? input.securityId ?? null,
      name: input.name.trim(),
      type: input.type,
      country: input.country,
      invested_amount: input.investedAmount,
      source_url: sourceUrl || null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throwQueryError("Unable to create investment.", 400);
  }
  return mapInvestment(data);
}

export async function supabaseUpdateInvestment(
  userId: string,
  id: string,
  input: UpdateInvestmentRequest,
) {
  if (input.investedAmount !== undefined && input.investedAmount <= 0) {
    throwQueryError("Invested amount must be greater than zero.", 400);
  }
  const supabase = await client();
  const current = await supabaseGetInvestment(userId, id);
  const patch: {
    name?: string;
    invested_amount?: number;
    source_url?: string | null;
    fund_id?: string | null;
  } = {};
  if (input.name) {
    patch.name = input.name.trim();
  }
  if (input.investedAmount !== undefined) {
    patch.invested_amount = input.investedAmount;
  }
  if (input.sourceUrl !== undefined) {
    const sourceUrl = normalizeSourceUrl(input.sourceUrl);
    if (isFundVehicle(current.investment.type) && !sourceUrl) {
      throwQueryError("Fund URL is required for mutual funds and ETFs.", 400);
    }
    patch.source_url = sourceUrl || null;
    if (isFundVehicle(current.investment.type) && sourceUrl) {
      patch.fund_id = (
        await ensureSupabaseFund(userId, {
          name: patch.name ?? current.investment.name,
          type: current.investment.type,
          country: current.investment.country,
          sourceUrl,
        })
      ).id;
    }
  }
  const { data, error } = await supabase
    .from("investments")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Investment not found", 404);
  }
  return mapInvestment(data);
}

export async function supabaseSyncInvestment(userId: string, id: string) {
  const detail = await supabaseGetInvestment(userId, id);
  const investment = detail.investment;
  if (!isFundVehicle(investment.type)) {
    throwQueryError("Sync is only available for mutual funds and ETFs.", 400);
  }
  const sourceUrl = normalizeSourceUrl(investment.sourceUrl);
  if (!sourceUrl) {
    throwQueryError("Add a fund URL before syncing holdings.", 400);
  }

  const supabase = await client();
  const startedAt = new Date().toISOString();
  const { data: syncRow, error: syncError } = await supabase
    .from("investment_syncs")
    .insert({
      user_id: userId,
      investment_id: id,
      started_at: startedAt,
      status: "running",
      records_processed: 0,
    })
    .select("*")
    .single();
  if (syncError || !syncRow) {
    throwQueryError("Unable to start sync.", 500);
  }

  try {
    const scraped = await scrapeFundHoldings(sourceUrl);
    const fund = await ensureSupabaseFund(userId, {
      name: investment.name,
      type: investment.type,
      country: investment.country,
      sourceUrl,
    });

    await supabase.from("fund_holdings").delete().eq("fund_id", fund.id).eq("user_id", userId);

    const holdingRows = [];
    for (const item of scraped.holdings) {
      const security = buildSecurityFromCompany(userId, item.name, investment.country);
      const { data: existing } = await supabase
        .from("securities")
        .select("id")
        .eq("user_id", userId)
        .eq("ticker", security.ticker)
        .eq("country", security.country)
        .maybeSingle();
      const securityId = existing?.id ?? security.id;
      if (!existing) {
        const { error: securityError } = await supabase.from("securities").insert({
          id: security.id,
          user_id: userId,
          standardized_name: security.standardizedName,
          ticker: security.ticker,
          country: security.country,
        });
        if (securityError) {
          throwQueryError("Unable to save a holding company.", 400);
        }
      }
      holdingRows.push({
        id: `hold-${crypto.randomUUID()}`,
        user_id: userId,
        fund_id: fund.id,
        security_id: securityId,
        allocation_percentage: item.allocationPercentage,
      });
    }

    if (holdingRows.length > 0) {
      const { error: holdingsError } = await supabase.from("fund_holdings").insert(holdingRows);
      if (holdingsError) {
        throwQueryError("Unable to save fund holdings.", 400);
      }
    }

    const completedAt = new Date().toISOString();
    await supabase
      .from("funds")
      .update({
        latest_portfolio_date: scraped.holdingDate,
        source_url: sourceUrl,
      })
      .eq("id", fund.id)
      .eq("user_id", userId);
    await supabase
      .from("investments")
      .update({ fund_id: fund.id, last_synced_at: completedAt, source_url: sourceUrl })
      .eq("fund_id", fund.id)
      .eq("user_id", userId);
    await supabase
      .from("investments")
      .update({ fund_id: fund.id, last_synced_at: completedAt, source_url: sourceUrl })
      .eq("id", id)
      .eq("user_id", userId);

    const { data: finished } = await supabase
      .from("investment_syncs")
      .update({
        status: "success",
        records_processed: holdingRows.length,
      })
      .eq("id", syncRow.id)
      .select("*")
      .single();

    return {
      investment: (await supabaseGetInvestment(userId, id)).investment,
      sync: mapSync(finished ?? { ...syncRow, status: "success", records_processed: holdingRows.length }),
      recordsProcessed: holdingRows.length,
    };
  } catch (error) {
    await supabase
      .from("investment_syncs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Sync failed",
      })
      .eq("id", syncRow.id);
    throw error;
  }
}

export async function supabaseListSyncs(userId: string, investmentId: string) {
  await supabaseGetInvestment(userId, investmentId);
  const supabase = await client();
  const { data, error } = await supabase
    .from("investment_syncs")
    .select("*")
    .eq("user_id", userId)
    .eq("investment_id", investmentId)
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) {
    throwQueryError("Unable to load sync history.", 500);
  }
  return (data ?? []).map(mapSync);
}

export async function supabaseDeleteInvestment(userId: string, id: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("investments")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Investment not found", 404);
  }
  return { ok: true };
}

export async function supabaseListFunds(userId: string) {
  return (await catalog(userId)).funds;
}

export async function supabaseGetFund(userId: string, id: string) {
  const { funds, holdings, securities } = await catalog(userId);
  const fund = funds.find((item) => item.id === id);
  if (!fund) {
    throwQueryError("Fund not found", 404);
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

export async function supabaseListSecurities(userId: string) {
  return (await catalog(userId)).securities;
}

export async function supabaseGetSecurity(userId: string, id: string) {
  const security = (await catalog(userId)).securities.find((item) => item.id === id);
  if (!security) {
    throwQueryError("Security not found", 404);
  }
  return security;
}

export async function supabaseOverview(userId: string) {
  const { investments, exposures, fx } = await exposuresFor(userId);
  return buildOverview(investments, exposures, fx);
}

export async function supabaseMarket(userId: string, country: "IN" | "US") {
  const { investments, exposures, fx } = await exposuresFor(userId);
  return buildMarketDashboard(country, investments, exposures, fx.rate);
}

export async function supabaseExposure(userId: string) {
  return (await exposuresFor(userId)).exposures;
}

export async function supabaseExposureDetail(userId: string, securityId: string) {
  const row = (await exposuresFor(userId)).exposures.find((item) => item.security.id === securityId);
  if (!row) {
    throwQueryError("Exposure not found", 404);
  }
  return row;
}

export async function supabaseAllocation(userId: string) {
  const overview = await supabaseOverview(userId);
  const rate = overview.fxRate.rate;
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

export async function supabaseOverlap(userId: string) {
  const { investments, funds, holdings, securities } = await exposuresFor(userId);
  return buildOverlaps(investments, holdings, funds).map((item) => ({
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

export async function supabaseUpdateProfile(userId: string, input: { name?: string; email?: string }) {
  const nextName = input.name?.trim();
  const nextEmail = input.email?.trim().toLowerCase();
  if (nextName === undefined && nextEmail === undefined) {
    throwQueryError("Nothing to update.", 400);
  }
  if (nextName !== undefined && (!nextName || nextName.length > 80)) {
    throwQueryError("Name is required.", 400);
  }
  if (nextEmail !== undefined && !isValidEmail(nextEmail)) {
    throwQueryError("Enter a valid email address.", 400);
  }

  const supabase = await client();
  if (nextName) {
    const { error } = await supabase.from("profiles").update({ name: nextName }).eq("id", userId);
    if (error) {
      throwQueryError("Unable to update name.", 400);
    }
    const { error: metaError } = await supabase.auth.updateUser({ data: { name: nextName } });
    if (metaError) {
      throwQueryError("Unable to update name.", 400);
    }
  }

  let emailConfirmationRequired = false;
  if (nextEmail) {
    const { data, error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error || !data.user) {
      throwQueryError("Unable to update email.", 400);
    }
    emailConfirmationRequired = (data.user.email ?? "").toLowerCase() !== nextEmail;
  }

  return { user: await supabaseMe(userId), emailConfirmationRequired };
}

export async function supabaseUpdatePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  if (!isValidPassword(input.currentPassword) || !isValidPassword(input.newPassword)) {
    throwQueryError("Password must be between 8 and 128 characters.", 400);
  }
  if (input.currentPassword === input.newPassword) {
    throwQueryError("Choose a different new password.", 400);
  }

  const supabase = await client();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email || auth.user.id !== userId) {
    throwQueryError("Unauthorized", 401);
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: input.currentPassword,
  });
  if (verifyError) {
    throwQueryError("Current password is incorrect.", 400);
  }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) {
    throwQueryError("Unable to update password.", 400);
  }
  return { ok: true as const };
}

export async function supabaseDeleteAccount(userId: string, password: string) {
  if (!isValidPassword(password)) {
    throwQueryError("Password must be between 8 and 128 characters.", 400);
  }

  const supabase = await client();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email || auth.user.id !== userId) {
    throwQueryError("Unauthorized", 401);
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password,
  });
  if (verifyError) {
    throwQueryError("Current password is incorrect.", 400);
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    throwQueryError("Unable to delete account.", 400);
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Session is already invalid after the auth user is removed.
  }
  return { ok: true as const };
}

export async function supabaseGetSettings(userId: string) {
  const user = await supabaseMe(userId);
  return { displayCurrency: user.displayCurrency };
}

export async function supabaseUpdateSettings(userId: string, displayCurrency: Currency) {
  if (displayCurrency !== "INR" && displayCurrency !== "USD") {
    throwQueryError("Unsupported display currency.", 400);
  }
  const supabase = await client();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_currency: displayCurrency })
    .eq("id", userId)
    .select("display_currency")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Unauthorized", 401);
  }
  return { displayCurrency: data.display_currency };
}

export async function supabaseFxRate(userId: string) {
  return fxRate(userId);
}

export async function supabaseUpdateFxRate(userId: string, rate: number) {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 500) {
    throwQueryError("Enter a USD/INR rate between 0 and 500.", 400);
  }
  const supabase = await client();
  const asOf = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("profiles")
    .update({ fx_usd_inr: rate, fx_as_of: asOf })
    .eq("id", userId)
    .select("fx_usd_inr, fx_as_of")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Unauthorized", 401);
  }
  return getFxRate({ rate: Number(data.fx_usd_inr), asOf: data.fx_as_of });
}

// Stock Trades and Stock Analysis ------------------------------------------
// A standalone journal and watchlist. Neither touches the portfolio tables,
// and both store INR amounts only.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function cleanDate(value: unknown, label: string): string {
  const text = String(value ?? "").trim();
  if (!DATE_PATTERN.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throwQueryError(`${label} must be a valid date.`, 400);
  }
  return text;
}

function cleanText(value: unknown, label: string, max: number): string {
  const text = String(value ?? "").trim();
  if (!text || text.length > max) {
    throwQueryError(`${label} must be between 1 and ${max} characters.`, 400);
  }
  return text;
}

function cleanAmount(value: unknown, label: string, { allowZero = false } = {}): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount <= 0)) {
    throwQueryError(`${label} must be a positive number.`, 400);
  }
  return amount;
}

function cleanSymbol(value: unknown): string {
  const symbol = normalizeTicker(String(value ?? ""));
  if (!symbol || symbol.length > 20) {
    throwQueryError("Symbol must be between 1 and 20 characters.", 400);
  }
  return symbol;
}

function tradeRowFromInput(input: CreateStockTradeRequest) {
  const buyDate = cleanDate(input.buyDate, "Buy date");
  const hasSellDate = Boolean(String(input.sellDate ?? "").trim());
  const hasSellPrice = input.sellPrice !== undefined && input.sellPrice !== null && String(input.sellPrice) !== "";

  if (hasSellDate !== hasSellPrice) {
    throwQueryError("Enter both a sell date and a selling price, or leave both empty.", 400);
  }

  const sellDate = hasSellDate ? cleanDate(input.sellDate, "Sell date") : null;
  if (sellDate && sellDate < buyDate) {
    throwQueryError("Sell date cannot be before the buy date.", 400);
  }

  return {
    name: cleanText(input.name, "Name", 120),
    symbol: cleanSymbol(input.symbol),
    buy_date: buyDate,
    buy_price: cleanAmount(input.buyPrice, "Buying price"),
    quantity: cleanAmount(input.quantity, "Quantity"),
    sell_date: sellDate,
    sell_price: hasSellPrice ? cleanAmount(input.sellPrice, "Selling price", { allowZero: true }) : null,
  };
}

export async function supabaseListTrades(userId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_trades")
    .select("*")
    .eq("user_id", userId)
    .order("buy_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    throwQueryError("Unable to load trades.", 500);
  }
  return (data ?? []).map(mapTrade);
}

export async function supabaseCreateTrade(userId: string, input: CreateStockTradeRequest) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_trades")
    .insert({ user_id: userId, ...tradeRowFromInput(input) })
    .select("*")
    .single();
  if (error || !data) {
    throwQueryError("Unable to save the trade.", 400);
  }
  return mapTrade(data);
}

export async function supabaseUpdateTrade(userId: string, id: string, input: CreateStockTradeRequest) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_trades")
    .update(tradeRowFromInput(input))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Trade not found", 404);
  }
  return mapTrade(data);
}

export async function supabaseDeleteTrade(userId: string, id: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_trades")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Trade not found", 404);
  }
  return { ok: true };
}

function analysisRowFromInput(input: CreateStockAnalysisRequest) {
  return {
    name: cleanText(input.name, "Name", 120),
    symbol: cleanSymbol(input.symbol),
    buy_date: cleanDate(input.buyDate, "Buy date"),
    buy_price: cleanAmount(input.buyPrice, "Buying price"),
    target_return_percentage: cleanAmount(input.targetReturnPercentage, "Target return"),
  };
}

export async function supabaseListAnalysis(userId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_analysis")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throwQueryError("Unable to load stock analysis.", 500);
  }
  return (data ?? []).map(mapAnalysis);
}

export async function supabaseCreateAnalysis(userId: string, input: CreateStockAnalysisRequest) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_analysis")
    .insert({ user_id: userId, ...analysisRowFromInput(input) })
    .select("*")
    .single();
  if (error || !data) {
    throwQueryError("Unable to save the analysis entry.", 400);
  }
  return mapAnalysis(data);
}

export async function supabaseUpdateAnalysis(userId: string, id: string, input: CreateStockAnalysisRequest) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_analysis")
    .update(analysisRowFromInput(input))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Analysis entry not found", 404);
  }
  return mapAnalysis(data);
}

export async function supabaseDeleteAnalysis(userId: string, id: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("stock_analysis")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Analysis entry not found", 404);
  }
  return { ok: true };
}
