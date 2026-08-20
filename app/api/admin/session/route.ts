import { cookies } from "next/headers";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  getSupabaseUser,
  isMindEaseAdmin,
} from "../auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value ?? "";
  let user = accessToken ? await getSupabaseUser(accessToken) : null;

  if (!user) {
    const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE)?.value;
    if (!refreshToken || !SUPABASE_ANON_KEY) {
      return json({ authenticated: false }, 401);
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok || typeof body?.access_token !== "string") {
      cookieStore.delete(ADMIN_ACCESS_COOKIE);
      cookieStore.delete(ADMIN_REFRESH_COOKIE);
      return json({ authenticated: false }, 401);
    }

    accessToken = body.access_token;
    user = await getSupabaseUser(accessToken);
    cookieStore.set(ADMIN_ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      maxAge: Number(body?.expires_in) || 3600,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    if (typeof body?.refresh_token === "string") {
      cookieStore.set(ADMIN_REFRESH_COOKIE, body.refresh_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  if (!user || !(await isMindEaseAdmin(user))) {
    cookieStore.delete(ADMIN_ACCESS_COOKIE);
    cookieStore.delete(ADMIN_REFRESH_COOKIE);
    return json({ authenticated: false }, 403);
  }

  return json({
    authenticated: true,
    user: { id: user.id, email: user.email },
  });
}
