import { getSupabaseUserId } from "@/lib/supabase/server";

export async function requireUserId(): Promise<string> {
  const userId = await getSupabaseUserId();
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return userId;
}
