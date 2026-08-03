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

  return json(body);
}
