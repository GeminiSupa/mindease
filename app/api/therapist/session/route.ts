import { cookies } from "next/headers";
import {
  THERAPIST_ACCESS_COOKIE,
  THERAPIST_REFRESH_COOKIE,
} from "../../admin/auth";
import {
  getRows,
  getUser,
  json,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "../../_utils/mindease";

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(THERAPIST_ACCESS_COOKIE)?.value ?? "";
  let user = accessToken ? await getUser(accessToken) : null;

  // Try to refresh the access token if the current one is invalid/expired
  if (!user) {
    const refreshToken = cookieStore.get(THERAPIST_REFRESH_COOKIE)?.value;
    if (!refreshToken || !SUPABASE_ANON_KEY) {
      return json({ authenticated: false, error: "No valid session. Please log in again." }, 401);
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
      // Only delete cookies if the refresh token itself is invalid
      cookieStore.delete(THERAPIST_ACCESS_COOKIE);
      cookieStore.delete(THERAPIST_REFRESH_COOKIE);
      return json({ authenticated: false, error: "Session expired. Please log in again." }, 401);
    }

    accessToken = body.access_token;
    user = await getUser(accessToken);
    cookieStore.set(THERAPIST_ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      maxAge: Number(body?.expires_in) || 3600,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    if (typeof body?.refresh_token === "string") {
      cookieStore.set(THERAPIST_REFRESH_COOKIE, body.refresh_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  if (!user) {
    return json({ authenticated: false, error: "Could not verify your identity. Please log in again." }, 401);
  }

  // If service role key is missing we cannot look up the therapists table —
  // treat the session as authenticated (the /api/therapist/me route will also fail gracefully)
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({
      authenticated: true,
      user: { email: user.email },
      warning: "Server database key not configured. Some features may be unavailable.",
    });
  }

  const therapistRows = await getRows(
    "therapists",
    `user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`,
  );

  if (!therapistRows[0]) {
    // Do NOT delete cookies here — the user is authenticated in Supabase Auth,
    // they just don't have a therapist record yet. Deleting cookies causes the login loop.
    return json({
      authenticated: false,
      error: "No therapist profile is linked to your account. Please contact support.",
    }, 403);
  }

  return json({ authenticated: true, user: { email: user.email } });
}
