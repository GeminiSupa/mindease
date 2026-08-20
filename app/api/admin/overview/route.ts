import {
  getRequestAdminToken,
  getSupabaseUser,
  isMindEaseAdmin,
  type SupabaseUser,
} from "../auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type RecordLike = Record<string, unknown>;

type AdminTherapist = {
  id: string;
  name: string;
  role: string;
  focus: string;
  status: string;
  approvalStatus: string;
  isActive: boolean;
  photo?: string;
  qualifications?: string;
  email?: string;
};

type AdminOverview = {
  user: { email?: string; role: "admin" };
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
    contact: string;
  }>;
  therapists: AdminTherapist[];
  pendingTherapists: AdminTherapist[];
  messages: Array<{
    id: string;
    name: string;
    topic: string;
    message: string;
    status: string;
    contact: string;
    createdAt: string;
  }>;
  updatedAt: string;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function serviceHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    accept: "application/json",
    ...extra,
  };
}

async function getRows(table: string, query: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: serviceHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${table}: ${body || response.statusText}`);
  }

  return (await response.json()) as RecordLike[];
}

async function getCount(table: string, filters: string) {
  const query = filters ? `select=id&${filters}` : "select=id";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: serviceHeaders({ prefer: "count=exact", range: "0-0" }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${table} count: ${body || response.statusText}`);
  }

  const range = response.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
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
  const numeric = typeof amount === "number" ? amount : Number(amount);
  return `PKR ${(Number.isFinite(numeric) ? numeric : 0).toLocaleString("en-PK")}`;
}

function pakistanPeriod(now = new Date()) {
  const offsetMs = 5 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  const dayStart = new Date(Date.UTC(year, month, day) - offsetMs);
  const nextDay = new Date(Date.UTC(year, month, day + 1) - offsetMs);
  const monthStart = new Date(Date.UTC(year, month, 1) - offsetMs);
  return { dayStart, nextDay, monthStart };
}

function emptyOverview(user: SupabaseUser): AdminOverview {
  return {
    user: { email: user.email, role: "admin" },
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
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const token = getRequestAdminToken(request);
  if (!token) return json({ error: "Missing admin session." }, 401);

  const user = await getSupabaseUser(token);
  if (!user) return json({ error: "Your admin session has expired. Please sign in again." }, 401);
  if (!(await isMindEaseAdmin(user))) {
    return json({ error: "This account does not have MindEase admin access." }, 403);
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      { ...emptyOverview(user), error: "Clinic data service is not configured." },
      503,
    );
  }

  const { dayStart, nextDay, monthStart } = pakistanPeriod();
  const dayFilter = `scheduled_at=gte.${dayStart.toISOString()}&scheduled_at=lt.${nextDay.toISOString()}`;

  try {
    const [
      appointmentRows,
      therapistRows,
      paymentRows,
      messageRows,
      appointmentsToday,
      pendingRequests,
      activeTherapistsCount,
      pendingTherapistsCount,
      openMessages,
    ] = await Promise.all([
      getRows("appointments", "select=*&order=created_at.desc&limit=50"),
      getRows("therapists", "select=*&order=created_at.desc&limit=200"),
      getRows(
        "payments",
        `select=amount,status,paid_at&status=eq.paid&paid_at=gte.${monthStart.toISOString()}&limit=1000`,
      ),
      getRows("contact_messages", "select=*&order=created_at.desc&limit=100"),
      getCount("appointments", dayFilter),
      getCount("appointments", "status=in.(requested,payment_pending,reschedule_requested)"),
      getCount("therapists", "approval_status=eq.approved&is_active=eq.true"),
      getCount("therapists", "approval_status=eq.pending"),
      getCount("contact_messages", "status=in.(open,in_progress)"),
    ]);

    const appointments = appointmentRows.map((row, index) => ({
      id: value(row, ["id", "appointment_id"], `A-${index + 1}`),
      client: value(row, ["client_name", "patient_name", "name"], "Client"),
      therapist: value(row, ["therapist_name", "doctor_name", "provider_name"], "Unassigned"),
      time: value(row, ["scheduled_at", "appointment_time", "time"], "Not scheduled"),
      status: value(row, ["status"], "requested"),
      amount: money(row.amount ?? row.fee ?? row.price),
      contact: value(row, ["client_email", "client_phone"], ""),
    }));

    const therapistProfiles = therapistRows.map((row) => ({
      id: value(row, ["id"]),
      name: value(row, ["full_name", "name"], "Therapist"),
      role: value(row, ["title", "role"], "Clinical Psychologist"),
      focus: value(row, ["specialization", "focus", "specialty"], "Therapy and assessment"),
      status: value(row, ["availability_status", "status"], "Unavailable"),
      approvalStatus: value(row, ["approval_status"], "pending"),
      isActive: row.is_active === true,
      photo: value(row, ["profile_image_url", "photo_url"]),
      qualifications: value(row, ["qualifications"]),
      email: value(row, ["email"]),
    }));

    const messages = messageRows.map((row) => ({
      id: value(row, ["id"]),
      name: value(row, ["name", "full_name", "client_name"], "Website visitor"),
      topic: value(row, ["topic", "subject"], "Contact request"),
      message: value(row, ["message"], "No message supplied."),
      status: value(row, ["status"], "open"),
      contact: value(row, ["email", "phone"], ""),
      createdAt: value(row, ["created_at"], ""),
    }));

    const paidThisMonth = paymentRows.reduce((sum, row) => {
      const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    return json({
      user: { email: user.email, role: "admin" },
      stats: {
        appointmentsToday,
        pendingRequests,
        activeTherapists: activeTherapistsCount,
        pendingTherapists: pendingTherapistsCount,
        openMessages,
        paidThisMonth: money(paidThisMonth),
      },
      appointments,
      therapists: therapistProfiles.filter(
        (therapist) => therapist.approvalStatus === "approved" && therapist.isActive,
      ),
      pendingTherapists: therapistProfiles.filter(
        (therapist) => therapist.approvalStatus === "pending",
      ),
      messages,
      updatedAt: new Date().toISOString(),
    } satisfies AdminOverview);
  } catch {
    return json(
      {
        ...emptyOverview(user),
        error: "Live clinic data could not be loaded. No totals have been estimated.",
      },
      502,
    );
  }
}
