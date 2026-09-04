import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_URL_LENGTH = 2048;
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_TEXT = 20_000;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".arpa"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") {
    return true;
  }
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }
  if (lower.startsWith("::ffff:")) {
    return isPrivateIPv4(lower.replace("::ffff:", ""));
  }
  return false;
}

function looksLikeIPv4(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

function looksLikeIPv6(value: string): boolean {
  return value.includes(":");
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host.endsWith(".localhost")) {
    return true;
  }
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  if (looksLikeIPv4(host)) {
    return isPrivateIPv4(host);
  }
  if (looksLikeIPv6(host)) {
    return isPrivateIPv6(host);
  }
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  if (!raw || raw.length > MAX_URL_LENGTH) {
    throw Object.assign(new Error("Enter a valid http(s) URL."), { status: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw Object.assign(new Error("Enter a valid http(s) URL."), { status: 400 });
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol) || parsed.username || parsed.password) {
    throw Object.assign(new Error("Only public http(s) URLs are allowed."), { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    throw Object.assign(new Error("That host is not allowed."), { status: 400 });
  }
  try {
    const records = await Deno.resolveDns(parsed.hostname, "A");
    if (records.some((address) => isPrivateIPv4(address))) {
      throw new Error("blocked");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "blocked") {
      throw Object.assign(new Error("That host is not allowed."), { status: 400 });
    }
  }
  return parsed;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractFromHtml(html: string): { title: string; description: string; text: string } {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const titleMatch = withoutNoise.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    withoutNoise.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    withoutNoise.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const text = decodeHtml(withoutNoise.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).slice(0, MAX_TEXT);
  return {
    title: decodeHtml((titleMatch?.[1] ?? "").replace(/\s+/g, " ").trim()).slice(0, 300),
    description: decodeHtml((descMatch?.[1] ?? "").replace(/\s+/g, " ").trim()).slice(0, 500),
    text,
  };
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return (await response.text()).slice(0, MAX_BYTES);
  }
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    received += value.byteLength;
    if (received > MAX_BYTES) {
      await reader.cancel();
      throw Object.assign(new Error("The page is too large to extract."), { status: 400 });
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}

async function extractPublicUrl(rawUrl: string) {
  let current = await assertPublicUrl(rawUrl.trim());
  let statusCode = 0;
  let contentType = "";
  let body = "";
  let hops = 0;

  while (hops <= MAX_REDIRECTS) {
    const response = await fetch(current.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9",
        "User-Agent": "LookThroughPortfolio/0.1 (personal research extractor)",
      },
    });
    statusCode = response.status;
    contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw Object.assign(new Error("The page redirected without a destination."), { status: 400 });
      }
      hops += 1;
      if (hops > MAX_REDIRECTS) {
        throw Object.assign(new Error("Too many redirects."), { status: 400 });
      }
      current = await assertPublicUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw Object.assign(new Error("The page could not be fetched."), { status: 400 });
    }
    const allowedTypes = ["text/html", "application/xhtml+xml", "text/plain", "application/xml", "text/xml"];
    if (contentType && !allowedTypes.includes(contentType)) {
      throw Object.assign(new Error("Only HTML or text pages can be extracted."), { status: 400 });
    }
    body = await readLimited(response);
    break;
  }

  const parsed =
    contentType === "text/plain"
      ? { title: "", description: "", text: body.slice(0, MAX_TEXT) }
      : extractFromHtml(body);

  return {
    url: rawUrl.trim(),
    finalUrl: current.toString(),
    title: parsed.title,
    description: parsed.description,
    text: parsed.text,
    contentType: contentType || "text/html",
    statusCode,
    extractedAt: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = (await req.json()) as { url?: string };
    const extraction = await extractPublicUrl(payload.url ?? "");
    return json({ extraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to extract that URL.";
    const status = error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : 400;
    return json({ error: message }, status);
  }
});
