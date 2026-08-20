const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const ADMIN_ACCESS_COOKIE = "mindease-admin-access";
export const ADMIN_REFRESH_COOKIE = "mindease-admin-refresh";

const ADMIN_EMAILS = new Set(
  [
    ...(process.env.ADMIN_EMAILS ?? "").split(","),
  ]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const ADMIN_USER_IDS = new Set(
  [
    ...(process.env.ADMIN_USER_IDS ?? "").split(","),
  ]
    .map((id) => id.trim())
    .filter(Boolean),
);

export type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
};

type RecordLike = Record<string, unknown>;

export async function getSupabaseUser(token: string) {
  if (!SUPABASE_ANON_KEY) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function getRequestAdminToken(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return bearer || cookieValue(request, ADMIN_ACCESS_COOKIE);
}

async function getAdminRows(table: string, query: string) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return (await response.json()) as RecordLike[];
}

export async function isMindEaseAdmin(user: SupabaseUser) {
  const email = user.email?.trim().toLowerCase();
  const appRole = user.app_metadata?.role ?? user.app_metadata?.user_role;

  if (appRole === "admin") return true;
  if (ADMIN_USER_IDS.has(user.id)) return true;
  if (email && ADMIN_EMAILS.has(email)) return true;

  const encodedId = encodeURIComponent(user.id);
  const [profiles, adminUsers] = await Promise.all([
    getAdminRows("profiles", `id=eq.${encodedId}&select=id,role&limit=1`),
    getAdminRows("admin_users", `user_id=eq.${encodedId}&select=user_id&limit=1`),
  ]);

  return profiles[0]?.role === "admin" || adminUsers.length > 0;
}

export async function getAuthorizedAdmin(request: Request) {
  const token = getRequestAdminToken(request);
  if (!token) return null;

  const user = await getSupabaseUser(token);
  if (!user || !(await isMindEaseAdmin(user))) return null;
  return user;
}
