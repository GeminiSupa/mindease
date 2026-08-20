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
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!SUPABASE_ANON_KEY) {
    return json(
      {
        error:
          "Supabase anon key is missing. Add SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
      },
      500,
    );
  }

  let credentials: { email?: unknown; password?: unknown };

  try {
    credentials = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return json({ error: "Invalid login request." }, 400);
  }

  const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
  const password =
    typeof credentials.password === "string" ? credentials.password : "";

  if (!email || !password) {
    return json({ error: "Email and password are required." }, 400);
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();

  if (!response.ok) {
    return json(
      {
        error:
          body?.error_description ??
          body?.msg ??
          body?.error ??
          "Supabase login failed.",
      },
      response.status,
    );
  }

  const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
  const refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token : "";
  const user = accessToken ? await getSupabaseUser(accessToken) : null;

  if (!user || !(await isMindEaseAdmin(user))) {
    return json({ error: "This account does not have MindEase admin access." }, 403);
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(ADMIN_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    maxAge: Number(body?.expires_in) || 3600,
    path: "/",
    sameSite: "lax",
    secure,
  });
  if (refreshToken) {
    cookieStore.set(ADMIN_REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure,
    });
  }

  return json({
    expires_at: body?.expires_at,
    user: { id: user.id, email: user.email },
  });
}
