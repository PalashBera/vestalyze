import type {
  AllocationSlice,
  CreateInvestmentRequest,
  DataSource,
  Fund,
  FundHolding,
  FundOverlap,
  FxRate,
  Investment,
  InvestmentTransaction,
  MarketDashboard,
  PortfolioOverview,
  ScrapingLog,
  Security,
  StockExposure,
  User,
  UserSettings,
} from "@/lib/api/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
    me: () => request<{ user: User }>("/auth/me"),
  },
  investments: {
    list: () => request<{ investments: Investment[] }>("/investments"),
    get: (id: string) =>
      request<{
        investment: Investment;
        fund?: Fund;
        security?: Security;
        holdings: Array<FundHolding & { security?: Security }>;
        transactions: InvestmentTransaction[];
      }>(`/investments/${id}`),
    create: (input: CreateInvestmentRequest) =>
      request<{ investment: Investment }>("/investments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Partial<CreateInvestmentRequest>) =>
      request<{ investment: Investment }>(`/investments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/investments/${id}`, { method: "DELETE" }),
  },
  portfolio: {
    overview: () => request<PortfolioOverview>("/portfolio/overview"),
    india: () => request<MarketDashboard>("/portfolio/markets/IN"),
    us: () => request<MarketDashboard>("/portfolio/markets/US"),
    exposure: () => request<{ exposures: StockExposure[] }>("/portfolio/exposure"),
    exposureDetail: (securityId: string) =>
      request<StockExposure>(`/portfolio/exposure/${securityId}`),
    allocation: () =>
      request<{
        market: AllocationSlice[];
        type: AllocationSlice[];
        sector: AllocationSlice[];
        stocks: AllocationSlice[];
      }>("/portfolio/allocation"),
    overlap: () => request<{ overlaps: FundOverlap[] }>("/portfolio/overlap"),
  },
  catalog: {
    funds: () => request<{ funds: Fund[] }>("/funds"),
    fund: (id: string) =>
      request<{ fund: Fund; holdings: Array<FundHolding & { security?: Security }> }>(`/funds/${id}`),
    refreshFund: (id: string) =>
      request(`/funds/${id}/refresh`, { method: "POST" }),
    securities: () => request<{ securities: Security[] }>("/securities"),
  },
  ops: {
    dataSources: () => request<{ dataSources: DataSource[] }>("/data-sources"),
    refreshSource: (id: string) =>
      request<DataSource>(`/data-sources/${id}/refresh`, { method: "POST" }),
    logs: () => request<{ logs: ScrapingLog[] }>("/scraping-logs"),
  },
  settings: {
    get: () => request<UserSettings>("/settings"),
    update: (displayCurrency: UserSettings["displayCurrency"]) =>
      request<UserSettings>("/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayCurrency }),
      }),
    fx: () => request<FxRate>("/fx/rate"),
  },
};
