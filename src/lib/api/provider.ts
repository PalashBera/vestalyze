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
