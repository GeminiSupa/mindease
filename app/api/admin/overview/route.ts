import {
  getRows,
  getUser,
  json,
  money,
  requireAdmin,
  SUPABASE_SERVICE_ROLE_KEY,
  type SupabaseUser,
  value,
} from "../../_utils/mindease";

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
    lifecycleStage: string;
    confirmationStatus: string;
    paymentReference: string;
    paymentInstructions: string;
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
    assignedTo?: string;
    suggestedTherapistId?: string;
    suggestedTherapistName?: string;
    coordinatorNote?: string;
    appointmentId?: string;
  }>;
  pendingProfileChanges: Array<{
    id: string;
    therapistId: string;
    therapistName: string;
    status: string;
    createdAt: string;
    changes: Record<string, unknown>;
  }>;
  blogPosts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    excerpt: string;
    imageUrl: string;
    publishedAt: string;
  }>;
  availabilitySlots: Array<{
    id: string;
    therapistId: string;
    therapistName: string;
    startsAt: string;
    endsAt: string;
    slotType: string;
    approvalStatus: string;
    isBooked: boolean;
  }>;
  auditLogs: Array<{
    id: string;
    actorId: string;
    action: string;
    subject: string;
    createdAt: string;
  }>;
  setupSteps: string[];
};

const setupSteps: string[] = [];

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
    pendingProfileChanges: [],
    blogPosts: [],
    availabilitySlots: [],
    auditLogs: [],
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

  const admin = await requireAdmin(request);
  if (!admin || admin.id !== user.id) {
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

  const [appointmentsRows, therapistRows, paymentRows, messageRows, changeRows, blogRows, slotRows, auditRows] =
    await Promise.all([
      getRows("appointments", "select=*&order=scheduled_at.asc&limit=20"),
      getRows("therapists", "select=*&order=created_at.desc&limit=50"),
      getRows("payments", "select=*&order=created_at.desc&limit=50"),
      getRows("contact_messages", "select=*&order=created_at.desc&limit=20"),
      getRows("therapist_profile_change_requests", "select=*&order=created_at.desc&limit=30"),
      getRows("blog_posts", "select=*&order=created_at.desc&limit=20"),
      getRows("availability_slots", "select=*&order=starts_at.asc&limit=50"),
      getRows("admin_audit_logs", "select=*&order=created_at.desc&limit=30"),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const appointments = appointmentsRows.map((row, index) => ({
    id: value(row, ["id", "appointment_id"], `A-${index + 1}`),
    client: value(row, ["client_name", "patient_name", "name"], "Client"),
    therapist: value(row, ["therapist_name", "doctor_name", "provider_name"], "Therapist"),
    time: value(row, ["scheduled_at", "appointment_time", "time"], "Not scheduled"),
    status: value(row, ["status", "payment_status"], "Pending"),
    lifecycleStage: value(row, ["lifecycle_stage"], "inquiry_received"),
    confirmationStatus: value(row, ["client_confirmation_status"], "pending"),
    paymentReference: value(row, ["payment_reference"], ""),
    paymentInstructions: value(row, ["payment_instructions"], ""),
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
  const therapistById = new Map(therapists.map((therapist) => [therapist.id, therapist]));

  const messages = messageRows.map((row) => ({
    id: value(row, ["id"]),
    name: value(row, ["name", "full_name", "client_name"], "Website visitor"),
    topic: value(row, ["topic", "subject", "message"], "Contact request"),
    status: value(row, ["status"], "Open"),
    contact: value(row, ["email", "phone"], ""),
    createdAt: value(row, ["created_at"], ""),
    assignedTo: value(row, ["assigned_to"], ""),
    suggestedTherapistId: value(row, ["suggested_therapist_id"], ""),
    suggestedTherapistName:
      therapistById.get(value(row, ["suggested_therapist_id"], ""))?.name ?? "",
    coordinatorNote: value(row, ["coordinator_note"], ""),
    appointmentId: value(row, ["appointment_id"], ""),
  }));

  const pendingProfileChanges = changeRows.map((row) => {
    const therapistId = value(row, ["therapist_id"], "");
    return {
      id: value(row, ["id"], ""),
      therapistId,
      therapistName: therapistById.get(therapistId)?.name ?? "Therapist",
      status: value(row, ["status"], "pending"),
      createdAt: value(row, ["created_at"], ""),
      changes:
        row.requested_changes && typeof row.requested_changes === "object"
          ? (row.requested_changes as Record<string, unknown>)
          : {},
    };
  });

  const blogPosts = blogRows.map((row) => ({
    id: value(row, ["id"], ""),
    title: value(row, ["title"], "Untitled post"),
    slug: value(row, ["slug"], ""),
    status: value(row, ["status"], "draft"),
    excerpt: value(row, ["excerpt"], ""),
    imageUrl: value(row, ["image_url"], ""),
    publishedAt: value(row, ["published_at"], ""),
  }));

  const availabilitySlots = slotRows.map((row) => {
    const therapistId = value(row, ["therapist_id"], "");
    return {
      id: value(row, ["id"], ""),
      therapistId,
      therapistName: therapistById.get(therapistId)?.name ?? "Therapist",
      startsAt: value(row, ["starts_at"], ""),
      endsAt: value(row, ["ends_at"], ""),
      slotType: value(row, ["slot_type"], "available"),
      approvalStatus: value(row, ["approval_status"], "approved"),
      isBooked: row.is_booked === true,
    };
  });

  const auditLogs = auditRows.map((row) => ({
    id: value(row, ["id"], ""),
    actorId: value(row, ["actor_id"], ""),
    action: value(row, ["action"], ""),
    subject:
      value(row, ["subject_table", "entity_table"], "") +
      (value(row, ["subject_id", "entity_id"], "") ? `:${value(row, ["subject_id", "entity_id"], "")}` : ""),
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
      pendingTherapists:
        pendingTherapists.length +
        pendingProfileChanges.filter((change) => change.status === "pending").length,
      openMessages: messages.filter((message) => message.status.toLowerCase() === "open").length,
      paidThisMonth: money(paidThisMonth),
    },
    appointments,
    therapists: activeTherapists,
    pendingTherapists,
    messages,
    pendingProfileChanges,
    blogPosts,
    availabilitySlots,
    auditLogs,
    setupSteps,
  });
}
