export const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type RecordLike = Record<string, unknown>;

export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export function serviceHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "content-type": "application/json",
    ...extra,
  };
}

export function value(row: RecordLike, keys: string[], fallback = "") {
  for (const key of keys) {
    const next = row[key];
    if (typeof next === "string" && next.trim()) return next;
    if (typeof next === "number") return String(next);
  }
  return fallback;
}

export async function getUser(token: string) {
  if (!SUPABASE_ANON_KEY) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

export async function getRows(table: string, query: string) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      accept: "application/json",
    },
  });

  if (!response.ok) return [];
  return (await response.json()) as RecordLike[];
}

export async function getRowsResult(table: string, query: string): Promise<{
  rows: RecordLike[];
  error?: string;
}> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return { rows: [], error: "The server database key is not configured." };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      return {
        rows: [],
        error: body?.message ?? `The ${table} table could not be read (${response.status}).`,
      };
    }

    return { rows: (await response.json()) as RecordLike[] };
  } catch {
    return { rows: [], error: `The ${table} table could not be reached.` };
  }
}

export async function serviceFetch(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      ...serviceHeaders(),
      ...(init.headers ?? {}),
    },
  });
}

export async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const user = await getUser(token);
  if (!user) return null;

  const email = user.email?.toLowerCase();
  const appRole = user.app_metadata?.role ?? user.app_metadata?.user_role;

  if (appRole === "admin") return user;
  if (ADMIN_USER_IDS.includes(user.id)) return user;
  if (email && ADMIN_EMAILS.includes(email)) return user;

  const adminUsers = await getRows(
    "admin_users",
    `user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`,
  );
  return adminUsers.length > 0 ? user : null;
}

export async function requireTherapist(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const user = await getUser(token);
  if (!user || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const therapists = await getRows(
    "therapists",
    `user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,full_name,title,qualifications,years_experience,bio,specialization,languages,therapy_methods,profile_image_url,session_fee,currency,availability_status,approval_status,is_active&limit=1`,
  );

  return therapists[0] ? { user, therapist: therapists[0] } : null;
}

export async function writeAuditLog(input: {
  actorId?: string;
  action: string;
  subjectTable?: string;
  subjectId?: string;
  details?: Record<string, unknown>;
}) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return;

  await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_logs`, {
    method: "POST",
    headers: serviceHeaders({ prefer: "return=minimal" }),
    body: JSON.stringify({
      actor_id: input.actorId ?? null,
      action: input.action,
      entity_table: input.subjectTable ?? null,
      entity_id: input.subjectId ?? null,
      metadata: input.details ?? {},
      subject_table: input.subjectTable ?? null,
      subject_id: input.subjectId ?? null,
      details: input.details ?? {},
    }),
  }).catch(() => undefined);
}

export function slugify(valueToSlug: string) {
  return valueToSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function money(amount: unknown) {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return `PKR ${amount.toLocaleString("en-PK")}`;
  }
  if (typeof amount === "string" && amount.trim()) return amount;
  return "PKR 0";
}
