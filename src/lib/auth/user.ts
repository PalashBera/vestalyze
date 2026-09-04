import { isSupabaseEnabled } from "@/lib/api/provider";
import { getAuthenticatedUserId as getMockUserId } from "@/lib/auth/session";
import { getSupabaseUserId } from "@/lib/supabase/server";

export async function requireUserId(): Promise<string> {
  const userId = isSupabaseEnabled() ? await getSupabaseUserId() : await getMockUserId();
  if (!userId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return userId;
}
