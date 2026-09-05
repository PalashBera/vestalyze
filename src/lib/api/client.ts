import type {
  AllocationSlice,
  CreateInvestmentRequest,
  Fund,
  FundHolding,
  FundOverlap,
  FxRate,
  Investment,
  InvestmentSync,
  MarketDashboard,
  PortfolioOverview,
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
      "Cache-Control": "no-cache",
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
        syncs: InvestmentSync[];
      }>(`/investments/${id}?t=${Date.now()}`),
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
    sync: (id: string) =>
      request<{
        investment: Investment;
        sync: InvestmentSync;
        recordsProcessed: number;
      }>(`/investments/${id}/sync`, { method: "POST" }),
    syncs: (id: string) =>
      request<{ syncs: InvestmentSync[] }>(`/investments/${id}/syncs`),
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
        stocks: AllocationSlice[];
      }>("/portfolio/allocation"),
    overlap: () => request<{ overlaps: FundOverlap[] }>("/portfolio/overlap"),
  },
  catalog: {
    funds: () => request<{ funds: Fund[] }>("/funds"),
    fund: (id: string) =>
      request<{ fund: Fund; holdings: Array<FundHolding & { security?: Security }> }>(`/funds/${id}`),
    securities: () => request<{ securities: Security[] }>("/securities"),
  },
  settings: {
    get: () => request<UserSettings>("/settings"),
    update: (displayCurrency: UserSettings["displayCurrency"]) =>
      request<UserSettings>("/settings", {
        method: "PATCH",
        body: JSON.stringify({ displayCurrency }),
      }),
    fx: () => request<FxRate>("/fx/rate"),
    updateFx: (rate: number) =>
      request<FxRate>("/fx/rate", {
        method: "PATCH",
        body: JSON.stringify({ rate }),
      }),
  },
};
