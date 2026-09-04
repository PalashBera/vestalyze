import type {
  CreateInvestmentRequest,
  CreateTransactionRequest,
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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapDataSource,
  mapFund,
  mapHolding,
  mapInvestment,
  mapLog,
  mapSecurity,
  mapTransaction,
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

  await supabase.rpc("clone_sample_portfolio");
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

async function catalog() {
  const supabase = await client();
  const [funds, holdings, securities] = await Promise.all([
    supabase.from("funds").select("*"),
    supabase.from("fund_holdings").select("*"),
    supabase.from("securities").select("*"),
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

async function fxRate() {
  const supabase = await client();
  const { data } = await supabase
    .from("fx_rates")
    .select("*")
    .eq("base", "USD")
    .eq("quote", "INR")
    .maybeSingle();
  if (!data) {
    return getFxRate();
  }
  return getFxRate({ rate: Number(data.rate), asOf: data.as_of });
}

async function exposuresFor(userId: string) {
  const [{ funds, holdings, securities }, investments] = await Promise.all([
    catalog(),
    listInvestments(userId),
  ]);
  return {
    investments,
    funds,
    holdings,
    securities,
    exposures: calculateExposures(investments, holdings, securities, funds),
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
  const { funds, holdings, securities } = await catalog();
  const { data: transactions } = await supabase
    .from("investment_transactions")
    .select("*")
    .eq("investment_id", id)
    .order("transaction_date");

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
    transactions: (transactions ?? []).map(mapTransaction),
  };
}

export async function supabaseCreateInvestment(userId: string, input: CreateInvestmentRequest) {
  if (!input.name?.trim()) {
    throwQueryError("Investment name is required.", 400);
  }
  if (!["mutual_fund", "etf", "stock"].includes(input.type)) {
    throwQueryError("Invalid investment type.", 400);
  }
  if (!["IN", "US"].includes(input.country) || !["INR", "USD"].includes(input.currency)) {
    throwQueryError("Invalid country or currency.", 400);
  }
  if (!Number.isFinite(input.investedAmount) || input.investedAmount <= 0) {
    throwQueryError("Invested amount must be greater than zero.", 400);
  }

  const supabase = await client();
  const { data, error } = await supabase
    .from("investments")
    .insert({
      user_id: userId,
      fund_id: input.fundId ?? null,
      security_id: input.securityId ?? null,
      name: input.name.trim(),
      type: input.type,
      country: input.country,
      currency: input.currency,
      invested_amount: input.investedAmount,
      current_value: input.currentValue > 0 ? input.currentValue : input.investedAmount,
      units: input.units ?? null,
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
  const patch: {
    name?: string;
    invested_amount?: number;
    current_value?: number;
    units?: number;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (input.name) {
    patch.name = input.name.trim();
  }
  if (input.investedAmount !== undefined) {
    patch.invested_amount = input.investedAmount;
  }
  if (input.currentValue !== undefined) {
    patch.current_value = input.currentValue;
  }
  if (input.units !== undefined) {
    patch.units = input.units;
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

export async function supabaseCreateTransaction(
  userId: string,
  investmentId: string,
  input: CreateTransactionRequest,
) {
  if (!input.transactionDate || input.investedAmount <= 0) {
    throwQueryError("A valid date and amount are required.", 400);
  }
  const detail = await supabaseGetInvestment(userId, investmentId);
  const supabase = await client();
  const { data, error } = await supabase
    .from("investment_transactions")
    .insert({
      investment_id: investmentId,
      transaction_date: input.transactionDate,
      invested_amount: input.investedAmount,
      units: input.units ?? null,
      purchase_price: input.purchasePrice ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throwQueryError("Unable to add transaction.", 400);
  }
  await supabase
    .from("investments")
    .update({
      invested_amount: detail.investment.investedAmount + input.investedAmount,
      units: (detail.investment.units ?? 0) + (input.units ?? 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", investmentId)
    .eq("user_id", userId);
  return mapTransaction(data);
}

export async function supabaseDeleteTransaction(userId: string, id: string) {
  const supabase = await client();
  const { data: transaction } = await supabase
    .from("investment_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!transaction) {
    throwQueryError("Transaction not found", 404);
  }
  await supabaseGetInvestment(userId, transaction.investment_id);
  const { error } = await supabase.from("investment_transactions").delete().eq("id", id);
  if (error) {
    throwQueryError("Transaction not found", 404);
  }
  return { ok: true };
}

export async function supabaseListFunds() {
  return (await catalog()).funds;
}

export async function supabaseGetFund(id: string) {
  const { funds, holdings, securities } = await catalog();
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

export async function supabaseRefreshFund(id: string) {
  const supabase = await client();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("funds")
    .update({ last_scraped_at: now, data_status: "fresh" })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Fund not found", 404);
  }
  const { holdings } = await catalog();
  return {
    fundId: id,
    status: "success" as const,
    recordsProcessed: holdings.filter((item) => item.fundId === id).length,
    lastScrapedAt: now,
    message: "Holdings refresh recorded. Connect a scraper job to replace this stub.",
  };
}

export async function supabaseListSecurities() {
  return (await catalog()).securities;
}

export async function supabaseGetSecurity(id: string) {
  const security = (await catalog()).securities.find((item) => item.id === id);
  if (!security) {
    throwQueryError("Security not found", 404);
  }
  return security;
}

export async function supabaseOverview(userId: string) {
  const { investments, exposures } = await exposuresFor(userId);
  return buildOverview(investments, exposures);
}

export async function supabaseMarket(userId: string, country: "IN" | "US") {
  const { investments, exposures } = await exposuresFor(userId);
  return buildMarketDashboard(country, investments, exposures);
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
  const rate = (await fxRate()).rate;
  return {
    market: overview.marketAllocation,
    type: overview.typeAllocation,
    sector: overview.sectorAllocation,
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

export async function supabaseDataSources() {
  const supabase = await client();
  const { data, error } = await supabase.from("data_sources").select("*").order("name");
  if (error) {
    throwQueryError("Unable to load data sources.", 500);
  }
  return (data ?? []).map(mapDataSource);
}

export async function supabaseRefreshSource(id: string) {
  const supabase = await client();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("data_sources")
    .update({ last_scraped_at: now, last_successful_at: now, status: "fresh" })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throwQueryError("Data source not found", 404);
  }
  await supabase.from("scraping_logs").insert({
    data_source_id: id,
    started_at: now,
    completed_at: now,
    status: "success",
    records_processed: 0,
  });
  return mapDataSource(data);
}

export async function supabaseScrapingLogs() {
  const supabase = await client();
  const { data, error } = await supabase
    .from("scraping_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) {
    throwQueryError("Unable to load scraping logs.", 500);
  }
  return (data ?? []).map(mapLog);
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

export async function supabaseFxRate() {
  return fxRate();
}
