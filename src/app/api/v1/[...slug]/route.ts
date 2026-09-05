import { NextRequest } from "next/server";
import { errorFromUnknown, jsonError, jsonOk } from "@/lib/api/http";
import { isSupabaseEnabled } from "@/lib/api/provider";
import {
  mockAllocation,
  mockCreateInvestment,
  mockDeleteInvestment,
  mockExposure,
  mockExposureDetail,
  mockFxRate,
  mockGetFund,
  mockGetInvestment,
  mockGetSecurity,
  mockGetSettings,
  mockListFunds,
  mockListInvestments,
  mockListSecurities,
  mockListSyncs,
  mockLogin,
  mockLogout,
  mockMarket,
  mockMe,
  mockOverlap,
  mockOverview,
  mockRefreshFund,
  mockRegister,
  mockSyncInvestment,
  mockUpdateFxRate,
  mockUpdateInvestment,
  mockUpdateSettings,
} from "@/lib/api/mock/handlers";
import {
  supabaseAllocation,
  supabaseCreateInvestment,
  supabaseDeleteInvestment,
  supabaseExposure,
  supabaseExposureDetail,
  supabaseFxRate,
  supabaseGetFund,
  supabaseGetInvestment,
  supabaseGetSecurity,
  supabaseGetSettings,
  supabaseListFunds,
  supabaseListInvestments,
  supabaseListSecurities,
  supabaseListSyncs,
  supabaseLogin,
  supabaseLogout,
  supabaseMarket,
  supabaseMe,
  supabaseOverlap,
  supabaseOverview,
  supabaseRefreshFund,
  supabaseRegister,
  supabaseSyncInvestment,
  supabaseUpdateFxRate,
  supabaseUpdateInvestment,
  supabaseUpdateSettings,
} from "@/lib/api/supabase/handlers";
import { consumeAuthAttempt, consumeExtractAttempt } from "@/lib/auth/rate-limit";
import {
  clearSessionCookie,
  getSessionIdFromCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { requireUserId } from "@/lib/auth/user";
import { isValidEmail, isValidPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string[] }> };

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function dispatch(request: NextRequest, method: string, slug: string[]) {
  const path = slug.join("/");
  const useSupabase = isSupabaseEnabled();

  if (path === "auth/login" && method === "POST") {
    const limit = consumeAuthAttempt(`login:${clientKey(request)}`);
    if (!limit.allowed) {
      return jsonError("Too many attempts. Try again later.", 429);
    }
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password || !isValidEmail(body.email) || !isValidPassword(body.password)) {
      return jsonError("Invalid username or password", 401);
    }
    if (useSupabase) {
      const result = await supabaseLogin({ email: body.email, password: body.password });
      return jsonOk({ user: result.user });
    }
    const result = await mockLogin(
      { email: body.email, password: body.password },
      request.headers.get("user-agent"),
    );
    await setSessionCookie(result.sessionId);
    return jsonOk({ user: result.user });
  }

  if (path === "auth/register" && method === "POST") {
    const limit = consumeAuthAttempt(`register:${clientKey(request)}`);
    if (!limit.allowed) {
      return jsonError("Too many attempts. Try again later.", 429);
    }
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const payload = {
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
    };
    if (useSupabase) {
      const result = await supabaseRegister(payload);
      return jsonOk({ user: result.user }, { status: 201 });
    }
    const result = await mockRegister(payload, request.headers.get("user-agent"));
    await setSessionCookie(result.sessionId);
    return jsonOk({ user: result.user }, { status: 201 });
  }

  if (path === "auth/logout" && method === "POST") {
    if (useSupabase) {
      await supabaseLogout();
    } else {
      mockLogout(await getSessionIdFromCookie());
      await clearSessionCookie();
    }
    return jsonOk({ ok: true });
  }

  const userId = await requireUserId();

  if (path === "auth/me" && method === "GET") {
    return jsonOk({ user: useSupabase ? await supabaseMe(userId) : await mockMe(userId) });
  }

  if (path === "investments" && method === "GET") {
    return jsonOk({
      investments: useSupabase ? await supabaseListInvestments(userId) : mockListInvestments(userId),
    });
  }

  if (path === "investments" && method === "POST") {
    const input = await request.json();
    const investment = useSupabase
      ? await supabaseCreateInvestment(userId, input)
      : mockCreateInvestment(userId, input);
    return jsonOk({ investment }, { status: 201 });
  }

  const investmentMatch = path.match(/^investments\/([^/]+)$/);
  if (investmentMatch && method === "GET") {
    return jsonOk(
      useSupabase
        ? await supabaseGetInvestment(userId, investmentMatch[1])
        : mockGetInvestment(userId, investmentMatch[1]),
    );
  }
  if (investmentMatch && method === "PATCH") {
    const input = await request.json();
    return jsonOk({
      investment: useSupabase
        ? await supabaseUpdateInvestment(userId, investmentMatch[1], input)
        : mockUpdateInvestment(userId, investmentMatch[1], input),
    });
  }
  if (investmentMatch && method === "DELETE") {
    return jsonOk(
      useSupabase
        ? await supabaseDeleteInvestment(userId, investmentMatch[1])
        : mockDeleteInvestment(userId, investmentMatch[1]),
    );
  }

  const investmentSyncMatch = path.match(/^investments\/([^/]+)\/sync$/);
  if (investmentSyncMatch && method === "POST") {
    const limit = consumeExtractAttempt(`sync:${clientKey(request)}`);
    if (!limit.allowed) {
      return jsonError("Too many sync attempts. Try again later.", 429);
    }
    return jsonOk(
      useSupabase
        ? await supabaseSyncInvestment(userId, investmentSyncMatch[1])
        : await mockSyncInvestment(userId, investmentSyncMatch[1]),
    );
  }
  const investmentSyncsMatch = path.match(/^investments\/([^/]+)\/syncs$/);
  if (investmentSyncsMatch && method === "GET") {
    return jsonOk({
      syncs: useSupabase
        ? await supabaseListSyncs(userId, investmentSyncsMatch[1])
        : mockListSyncs(userId, investmentSyncsMatch[1]),
    });
  }

  if (path === "funds" && method === "GET") {
    return jsonOk({ funds: useSupabase ? await supabaseListFunds(userId) : mockListFunds(userId) });
  }

  const fundMatch = path.match(/^funds\/([^/]+)$/);
  if (fundMatch && method === "GET") {
    return jsonOk(useSupabase ? await supabaseGetFund(userId, fundMatch[1]) : mockGetFund(userId, fundMatch[1]));
  }

  const fundHoldingsMatch = path.match(/^funds\/([^/]+)\/holdings$/);
  if (fundHoldingsMatch && method === "GET") {
    const detail = useSupabase
      ? await supabaseGetFund(userId, fundHoldingsMatch[1])
      : mockGetFund(userId, fundHoldingsMatch[1]);
    return jsonOk({ holdings: detail.holdings });
  }

  const fundRefreshMatch = path.match(/^funds\/([^/]+)\/refresh$/);
  if (fundRefreshMatch && method === "POST") {
    return jsonOk(
      useSupabase
        ? await supabaseRefreshFund(userId, fundRefreshMatch[1])
        : mockRefreshFund(userId, fundRefreshMatch[1]),
    );
  }

  if (path === "securities" && method === "GET") {
    return jsonOk({
      securities: useSupabase ? await supabaseListSecurities(userId) : mockListSecurities(userId),
    });
  }

  const securityMatch = path.match(/^securities\/([^/]+)$/);
  if (securityMatch && method === "GET") {
    return jsonOk({
      security: useSupabase
        ? await supabaseGetSecurity(userId, securityMatch[1])
        : mockGetSecurity(userId, securityMatch[1]),
    });
  }

  if (path === "portfolio/overview" && method === "GET") {
    return jsonOk(useSupabase ? await supabaseOverview(userId) : mockOverview(userId));
  }
  if (path === "portfolio/markets/IN" && method === "GET") {
    return jsonOk(useSupabase ? await supabaseMarket(userId, "IN") : mockMarket(userId, "IN"));
  }
  if (path === "portfolio/markets/US" && method === "GET") {
    return jsonOk(useSupabase ? await supabaseMarket(userId, "US") : mockMarket(userId, "US"));
  }
  if (path === "portfolio/exposure" && method === "GET") {
    return jsonOk({
      exposures: useSupabase ? await supabaseExposure(userId) : mockExposure(userId),
    });
  }
  const exposureMatch = path.match(/^portfolio\/exposure\/([^/]+)$/);
  if (exposureMatch && method === "GET") {
    return jsonOk(
      useSupabase
        ? await supabaseExposureDetail(userId, exposureMatch[1])
        : mockExposureDetail(userId, exposureMatch[1]),
    );
  }
  if (path === "portfolio/allocation" && method === "GET") {
    return jsonOk(useSupabase ? await supabaseAllocation(userId) : mockAllocation(userId));
  }
  if (path === "portfolio/overlap" && method === "GET") {
    return jsonOk({
      overlaps: useSupabase ? await supabaseOverlap(userId) : mockOverlap(userId),
    });
  }

  if (path === "settings" && method === "GET") {
    return jsonOk(useSupabase ? await supabaseGetSettings(userId) : await mockGetSettings(userId));
  }
  if (path === "settings" && method === "PATCH") {
    const body = (await request.json()) as { displayCurrency?: "INR" | "USD" };
    const currency = body.displayCurrency ?? "INR";
    return jsonOk(
      useSupabase ? await supabaseUpdateSettings(userId, currency) : await mockUpdateSettings(userId, currency),
    );
  }
  if (path === "fx/rate" && method === "GET") {
    return jsonOk(useSupabase ? await supabaseFxRate(userId) : mockFxRate(userId));
  }
  if (path === "fx/rate" && method === "PATCH") {
    const body = (await request.json()) as { rate?: number };
    const rate = Number(body.rate);
    return jsonOk(
      useSupabase ? await supabaseUpdateFxRate(userId, rate) : mockUpdateFxRate(userId, rate),
    );
  }

  return jsonError("Not found", 404);
}

async function handle(request: NextRequest, context: RouteContext, method: string) {
  try {
    const { slug } = await context.params;
    return await dispatch(request, method, slug);
  } catch (error) {
    return errorFromUnknown(error);
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context, "GET");
}

export function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context, "POST");
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context, "PATCH");
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context, "DELETE");
}
