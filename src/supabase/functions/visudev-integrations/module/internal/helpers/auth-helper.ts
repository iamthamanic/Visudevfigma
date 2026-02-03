/**
 * Extracts Supabase user id from request Bearer JWT.
 * Used by GitHub repos and set-project-github endpoints.
 */
import type { Context } from "hono";
import { UnauthorizedException } from "../exceptions/index.ts";

interface SupabaseAuthClient {
  getUser: (jwt: string) => Promise<{
    data: { user: { id: string } | null };
    error: { message: string } | null;
  }>;
}

export async function getAuthUserIdFromContext(
  c: Context,
  supabase: { auth?: SupabaseAuthClient },
): Promise<string> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Please sign in first");
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new UnauthorizedException("Please sign in first");
  }
  const auth = (supabase as { auth?: SupabaseAuthClient }).auth;
  if (!auth?.getUser) {
    throw new UnauthorizedException("Please sign in again");
  }
  const { data, error } = await auth.getUser(token);
  if (error) {
    throw new UnauthorizedException("Please sign in again");
  }
  if (!data?.user?.id) {
    throw new UnauthorizedException("Please sign in again");
  }
  return data.user.id;
}
