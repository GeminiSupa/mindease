const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ryumrzlbaiccowxerpls.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dW1yemxiYWljY293eGVycGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MzI2NzUsImV4cCI6MjEwMDEwODY3NX0.0Tr9dGi0A4hkRwwb0mPgzchCg_F7mbRoJcooxVTgbiU";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type RecordLike = Record<string, unknown>;

const setupSteps = [
  "Create the admin user in Supabase Auth.",
  "Add that user to public.profiles with role = 'admin', or create public.admin_users with user_id.",
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
  if (email && ADMIN_EMAILS.includes(email)) return true;

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

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return json({ error: "Missing admin session.", setupSteps }, 401);
  }

  const user = await getUser(token);
  if (!user) {
    return json({ error: "Your admin session has expired. Please sign in again.", setupSteps }, 401);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      {
        error: "Server Supabase service key is not configured.",
        setupSteps,
      },
      500,
    );
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
    name: value(row, ["name", "full_name"], "Therapist"),
    role: value(row, ["role", "title"], "Clinical Psychologist"),
    focus: value(row, ["focus", "specialty", "specialization"], "Therapy and assessment"),
    status: value(row, ["status", "availability_status"], "Available"),
  }));

  const messages = messageRows.map((row) => ({
    name: value(row, ["name", "full_name", "client_name"], "Website visitor"),
    topic: value(row, ["topic", "subject", "message"], "Contact request"),
    status: value(row, ["status"], "Open"),
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
      activeTherapists: therapists.length,
      paidThisMonth: money(paidThisMonth),
    },
    appointments,
    therapists,
    messages,
    setupSteps,
  });
}
