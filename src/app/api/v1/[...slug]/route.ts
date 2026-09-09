import { NextRequest } from "next/server";
import { errorFromUnknown, jsonError, jsonOk } from "@/lib/api/http";
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
import { requireUserId } from "@/lib/auth/user";
import { isValidEmail, isValidPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string[] }> };

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function dispatch(request: NextRequest, method: string, slug: string[]) {
  const path = slug.join("/");

  if (path === "auth/login" && method === "POST") {
    const limit = consumeAuthAttempt(`login:${clientKey(request)}`);
    if (!limit.allowed) {
      return jsonError("Too many attempts. Try again later.", 429);
    }
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password || !isValidEmail(body.email) || !isValidPassword(body.password)) {
      return jsonError("Invalid username or password", 401);
    }
    const result = await supabaseLogin({ email: body.email, password: body.password });
    return jsonOk({ user: result.user });
  }

  if (path === "auth/register" && method === "POST") {
    const limit = consumeAuthAttempt(`register:${clientKey(request)}`);
    if (!limit.allowed) {
      return jsonError("Too many attempts. Try again later.", 429);
    }
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const result = await supabaseRegister({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
    });
    return jsonOk({ user: result.user }, { status: 201 });
  }

  if (path === "auth/logout" && method === "POST") {
    await supabaseLogout();
    return jsonOk({ ok: true });
  }

  const userId = await requireUserId();

  if (path === "auth/me" && method === "GET") {
    return jsonOk({ user: await supabaseMe(userId) });
  }

  if (path === "investments" && method === "GET") {
    return jsonOk({ investments: await supabaseListInvestments(userId) });
  }

  if (path === "investments" && method === "POST") {
    const input = await request.json();
    return jsonOk({ investment: await supabaseCreateInvestment(userId, input) }, { status: 201 });
  }

  const investmentMatch = path.match(/^investments\/([^/]+)$/);
  if (investmentMatch && method === "GET") {
    return jsonOk(await supabaseGetInvestment(userId, investmentMatch[1]));
  }
  if (investmentMatch && method === "PATCH") {
    const input = await request.json();
    return jsonOk({
      investment: await supabaseUpdateInvestment(userId, investmentMatch[1], input),
    });
  }
  if (investmentMatch && method === "DELETE") {
    return jsonOk(await supabaseDeleteInvestment(userId, investmentMatch[1]));
  }

  const investmentSyncMatch = path.match(/^investments\/([^/]+)\/sync$/);
  if (investmentSyncMatch && method === "POST") {
    const limit = consumeExtractAttempt(`sync:${clientKey(request)}`);
    if (!limit.allowed) {
      return jsonError("Too many sync attempts. Try again later.", 429);
    }
    return jsonOk(await supabaseSyncInvestment(userId, investmentSyncMatch[1]));
  }
  const investmentSyncsMatch = path.match(/^investments\/([^/]+)\/syncs$/);
  if (investmentSyncsMatch && method === "GET") {
    return jsonOk({ syncs: await supabaseListSyncs(userId, investmentSyncsMatch[1]) });
  }

  if (path === "funds" && method === "GET") {
    return jsonOk({ funds: await supabaseListFunds(userId) });
  }

  const fundMatch = path.match(/^funds\/([^/]+)$/);
  if (fundMatch && method === "GET") {
    return jsonOk(await supabaseGetFund(userId, fundMatch[1]));
  }

  const fundHoldingsMatch = path.match(/^funds\/([^/]+)\/holdings$/);
  if (fundHoldingsMatch && method === "GET") {
    const detail = await supabaseGetFund(userId, fundHoldingsMatch[1]);
    return jsonOk({ holdings: detail.holdings });
  }

  const fundRefreshMatch = path.match(/^funds\/([^/]+)\/refresh$/);
  if (fundRefreshMatch && method === "POST") {
    return jsonOk(await supabaseRefreshFund(userId, fundRefreshMatch[1]));
  }

  if (path === "securities" && method === "GET") {
    return jsonOk({ securities: await supabaseListSecurities(userId) });
  }

  const securityMatch = path.match(/^securities\/([^/]+)$/);
  if (securityMatch && method === "GET") {
    return jsonOk({ security: await supabaseGetSecurity(userId, securityMatch[1]) });
  }

  if (path === "portfolio/overview" && method === "GET") {
    return jsonOk(await supabaseOverview(userId));
  }
  if (path === "portfolio/markets/IN" && method === "GET") {
    return jsonOk(await supabaseMarket(userId, "IN"));
  }
  if (path === "portfolio/markets/US" && method === "GET") {
    return jsonOk(await supabaseMarket(userId, "US"));
  }
  if (path === "portfolio/exposure" && method === "GET") {
    return jsonOk({ exposures: await supabaseExposure(userId) });
  }
  const exposureMatch = path.match(/^portfolio\/exposure\/([^/]+)$/);
  if (exposureMatch && method === "GET") {
    return jsonOk(await supabaseExposureDetail(userId, exposureMatch[1]));
  }
  if (path === "portfolio/allocation" && method === "GET") {
    return jsonOk(await supabaseAllocation(userId));
  }
  if (path === "portfolio/overlap" && method === "GET") {
    return jsonOk({ overlaps: await supabaseOverlap(userId) });
  }

  if (path === "settings" && method === "GET") {
    return jsonOk(await supabaseGetSettings(userId));
  }
  if (path === "settings" && method === "PATCH") {
    const body = (await request.json()) as { displayCurrency?: "INR" | "USD" };
    return jsonOk(await supabaseUpdateSettings(userId, body.displayCurrency ?? "INR"));
  }
  if (path === "fx/rate" && method === "GET") {
    return jsonOk(await supabaseFxRate(userId));
  }
  if (path === "fx/rate" && method === "PATCH") {
    const body = (await request.json()) as { rate?: number };
    return jsonOk(await supabaseUpdateFxRate(userId, Number(body.rate)));
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
