import { json, SUPABASE_ANON_KEY, SUPABASE_URL } from "../../_utils/mindease";

export async function POST(request: Request) {
  if (!SUPABASE_ANON_KEY) return json({ error: "Password recovery is not configured." }, 500);

  const body = (await request.json()) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return json({ error: "Email is required." }, 400);

  const origin = new URL(request.url).origin;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(`${origin}/therapist/login`)}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    return json({ error: result?.msg ?? result?.message ?? "Could not send password reset email." }, response.status);
  }

  return json({ sent: true });
}

export async function PATCH(request: Request) {
  if (!SUPABASE_ANON_KEY) return json({ error: "Password changes are not configured." }, 500);

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cookies = request.headers.get("cookie") ?? "";
  const cookieToken = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith("mindease-therapist-access="))?.split("=").slice(1).join("=");
  const token = bearer || (cookieToken ? decodeURIComponent(cookieToken) : "");
  if (!token) return json({ error: "Therapist access required." }, 403);

  const body = (await request.json()) as Record<string, unknown>;
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: result?.msg ?? result?.message ?? "Could not change password." }, response.status);
  return json({ changed: true });
}
