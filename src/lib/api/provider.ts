export type ApiProvider = "mock" | "supabase";

export function getApiProvider(): ApiProvider {
  const value = process.env.API_PROVIDER?.trim().toLowerCase();
  if (value === "supabase" || value === "mock") {
    return value;
  }
  return "mock";
}

export function isSupabaseEnabled(): boolean {
  return getApiProvider() === "supabase";
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw Object.assign(new Error("Supabase is not configured."), { status: 500 });
  }
  if (!url.startsWith("https://")) {
    throw Object.assign(new Error("Supabase is not configured."), { status: 500 });
  }
  return { url, anonKey };
}
