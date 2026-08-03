const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_ADMIN_USER_IDS = ["1bcf8cbe-9716-4cde-91d8-3cb9f0c4fafe"];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_USER_IDS = [
  ...DEFAULT_ADMIN_USER_IDS,
  ...(process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
];

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type RecordLike = Record<string, unknown>;

type AdminOverview = {
  user: {
    email?: string;
    role: "admin";
  };
  stats: {
    appointmentsToday: number;
    pendingRequests: number;
    activeTherapists: number;
    pendingTherapists: number;
    openMessages: number;
    paidThisMonth: string;
  };
  appointments: Array<{
    id: string;
    client: string;
    therapist: string;
    time: string;
    status: string;
    amount: string;
  }>;
  therapists: Array<{
    id: string;
    name: string;
    role: string;
    focus: string;
    status: string;
    approvalStatus: string;
    isActive: boolean;
    photo?: string;
  }>;
  pendingTherapists: Array<{
    id: string;
    name: string;
    role: string;
    focus: string;
    status: string;
    approvalStatus: string;
    isActive: boolean;
    photo?: string;
  }>;
  messages: Array<{
    id: string;
    name: string;
    topic: string;
    status: string;
    contact: string;
    createdAt: string;
  }>;
  setupSteps: string[];
};

const setupSteps = [
  "Create the admin user in Supabase Auth.",
  "This build already allows the primary Supabase admin user id.",
  "Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel so the server can verify sessions.",
  "Keep SUPABASE_SERVICE_ROLE_KEY only in server/runtime environment variables.",
  "Enable Row Level Security on public client-facing tables before launch.",
];

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function getUser(token: string) {
  if (!SUPABASE_ANON_KEY) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SupabaseUser;
}

async function getRows(table: string, query: string) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as RecordLike[];
}

async function isAdmin(user: SupabaseUser) {
  const email = user.email?.toLowerCase();
  const metadataRole =
    user.app_metadata?.role ?? user.user_metadata?.role ?? user.app_metadata?.user_role;

  if (metadataRole === "admin") return true;
  if (ADMIN_USER_IDS.includes(user.id)) return true;
  if (email && ADMIN_EMAILS.includes(email)) return true;
  if (!SUPABASE_SERVICE_ROLE_KEY) return false;

  const profiles = await getRows(
    "profiles",
    `id=eq.${encodeURIComponent(user.id)}&select=id,email,role&limit=1`,
  );
  const profile = profiles[0];
  if (profile?.role === "admin") return true;

  const adminUsers = await getRows(
    "admin_users",
    `user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`,
  );
  return adminUsers.length > 0;
}

function value(row: RecordLike, keys: string[], fallback = "") {
  for (const key of keys) {
    const next = row[key];
    if (typeof next === "string" && next.trim()) return next;
    if (typeof next === "number") return String(next);
  }
  return fallback;
}

function money(amount: unknown) {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return `PKR ${amount.toLocaleString("en-PK")}`;
  }
  if (typeof amount === "string" && amount.trim()) return amount;
  return "PKR 0";
}

function emptyOverview(user: SupabaseUser): AdminOverview {
  return {
    user: {
      email: user.email,
      role: "admin",
    },
    stats: {
      appointmentsToday: 0,
      pendingRequests: 0,
      activeTherapists: 0,
      pendingTherapists: 0,
      openMessages: 0,
      paidThisMonth: "PKR 0",
    },
    appointments: [],
    therapists: [],
    pendingTherapists: [],
    messages: [],
    setupSteps,
  };
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return json({ error: "Missing admin session.", setupSteps }, 401);
  }

  const user = await getUser(token);
  if (!user) {
    return json({ error: "Your admin session has expired. Please sign in again.", setupSteps }, 401);
  }

  const allowed = await isAdmin(user);
  if (!allowed) {
    return json(
      {
        error: "Signed in, but this account is not marked as a MindEase admin yet.",
        setupSteps,
        user: {
          email: user.email,
          role: "not_admin",
        },
      },
      403,
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json(emptyOverview(user));
  }

  const [appointmentsRows, therapistRows, paymentRows, messageRows] =
    await Promise.all([
      getRows("appointments", "select=*&order=scheduled_at.asc&limit=20"),
      getRows("therapists", "select=*&order=created_at.desc&limit=50"),
      getRows("payments", "select=*&order=created_at.desc&limit=50"),
      getRows("contact_messages", "select=*&order=created_at.desc&limit=20"),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const appointments = appointmentsRows.map((row, index) => ({
    id: value(row, ["id", "appointment_id"], `A-${index + 1}`),
    client: value(row, ["client_name", "patient_name", "name"], "Client"),
    therapist: value(row, ["therapist_name", "doctor_name", "provider_name"], "Therapist"),
    time: value(row, ["scheduled_at", "appointment_time", "time"], "Not scheduled"),
    status: value(row, ["status", "payment_status"], "Pending"),
    amount: money(row.amount ?? row.fee ?? row.price),
  }));

  const therapists = therapistRows.map((row) => ({
    id: value(row, ["id"]),
    name: value(row, ["name", "full_name"], "Therapist"),
    role: value(row, ["role", "title"], "Clinical Psychologist"),
    focus: value(row, ["focus", "specialty", "specialization"], "Therapy and assessment"),
    status: value(row, ["status", "availability_status"], "Available"),
    approvalStatus: value(row, ["approval_status"], "approved"),
    isActive: row.is_active === true,
    photo: value(row, ["profile_image_url", "photo_url"]),
  }));
  const activeTherapists = therapists.filter((therapist) => therapist.isActive);
  const pendingTherapists = therapists.filter(
    (therapist) => therapist.approvalStatus !== "approved" || !therapist.isActive,
  );

  const messages = messageRows.map((row) => ({
    id: value(row, ["id"]),
    name: value(row, ["name", "full_name", "client_name"], "Website visitor"),
    topic: value(row, ["topic", "subject", "message"], "Contact request"),
    status: value(row, ["status"], "Open"),
    contact: value(row, ["email", "phone"], ""),
    createdAt: value(row, ["created_at"], ""),
  }));

  const paidThisMonth = paymentRows
    .filter((row) => value(row, ["status"], "paid").toLowerCase() !== "failed")
    .reduce((sum, row) => {
      const amount = row.amount;
      return sum + (typeof amount === "number" ? amount : Number(amount) || 0);
    }, 0);

  return json({
    user: {
      email: user.email,
      role: "admin",
    },
    stats: {
      appointmentsToday: appointmentsRows.filter((row) =>
        value(row, ["scheduled_at", "appointment_date"]).startsWith(today),
      ).length,
      pendingRequests: appointmentsRows.filter((row) =>
        ["pending", "requested", "payment pending", "needs review"].includes(
          value(row, ["status"], "pending").toLowerCase(),
        ),
      ).length,
      activeTherapists: activeTherapists.length,
      pendingTherapists: pendingTherapists.length,
      openMessages: messages.filter((message) => message.status.toLowerCase() === "open").length,
      paidThisMonth: money(paidThisMonth),
    },
    appointments,
    therapists: activeTherapists,
    pendingTherapists,
    messages,
    setupSteps,
  });
}
