import {
  getRows,
  json,
  requireTherapist,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  value,
  writeAuditLog,
} from "../../_utils/mindease";

type SlotDraft = {
  starts: Date;
  ends: Date;
};

const MIN_SLOT_MINUTES = 20;
const MAX_SLOT_MINUTES = 180;
const MAX_RECURRENCE_COUNT = 12;

function normalizeProfileChanges(body: Record<string, unknown>) {
  const languages =
    typeof body.languages === "string"
      ? body.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

  const profileImageUrl =
    typeof body.profileImageUrl === "string" &&
    body.profileImageUrl.includes("/storage/v1/object/public/mindease-media/therapists/")
      ? body.profileImageUrl.trim()
      : undefined;

  return {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    qualifications:
      typeof body.qualifications === "string" ? body.qualifications.trim() : undefined,
    bio: typeof body.bio === "string" ? body.bio.trim() : undefined,
    specialization:
      typeof body.specialization === "string" ? body.specialization.trim() : undefined,
    languages,
    profile_image_url: profileImageUrl,
    session_fee: Number(body.sessionFee) || undefined,
    availability_status:
      typeof body.availabilityStatus === "string" ? body.availabilityStatus.trim() : undefined,
  };
}

function buildSlots(startRaw: string, endRaw: string, recurrence: string): SlotDraft[] {
  const starts = new Date(startRaw);
  const ends = new Date(endRaw);
  if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime())) return [];

  const count = recurrence === "weekly_4" ? 4 : recurrence === "weekly_8" ? 8 : recurrence === "weekly_12" ? 12 : 1;
  const slots: SlotDraft[] = [];
  for (let index = 0; index < Math.min(count, MAX_RECURRENCE_COUNT); index += 1) {
    const nextStarts = new Date(starts);
    const nextEnds = new Date(ends);
    nextStarts.setDate(starts.getDate() + index * 7);
    nextEnds.setDate(ends.getDate() + index * 7);
    slots.push({ starts: nextStarts, ends: nextEnds });
  }
  return slots;
}

function validateSlots(slots: SlotDraft[]) {
  const now = Date.now();
  for (const slot of slots) {
    const durationMinutes = (slot.ends.getTime() - slot.starts.getTime()) / 60000;
    if (slot.starts.getTime() <= now) return "Availability cannot be created in the past.";
    if (durationMinutes < MIN_SLOT_MINUTES || durationMinutes > MAX_SLOT_MINUTES) {
      return `Slots must be ${MIN_SLOT_MINUTES}-${MAX_SLOT_MINUTES} minutes.`;
    }
  }
  return "";
}

async function hasConflict(therapistId: string, slots: SlotDraft[]) {
  if (slots.length === 0) return false;

  const start = new Date(Math.min(...slots.map((slot) => slot.starts.getTime()))).toISOString();
  const end = new Date(Math.max(...slots.map((slot) => slot.ends.getTime()))).toISOString();
  const existing = await getRows(
    "availability_slots",
    `therapist_id=eq.${encodeURIComponent(therapistId)}&starts_at=lt.${encodeURIComponent(end)}&ends_at=gt.${encodeURIComponent(start)}&select=id,starts_at,ends_at,slot_type,approval_status,is_booked&limit=100`,
  );

  return slots.some((slot) =>
    existing.some((row) => {
      if (row.approval_status === "declined") return false;
      const existingStart = new Date(value(row, ["starts_at"])).getTime();
      const existingEnd = new Date(value(row, ["ends_at"])).getTime();
      return slot.starts.getTime() < existingEnd && slot.ends.getTime() > existingStart;
    }),
  );
}

export async function GET(request: Request) {
  const session = await requireTherapist(request);

  if (!session) {
    return json({ error: "Therapist access required." }, 403);
  }

  const therapistId = value(session.therapist, ["id"]);
  const [appointmentsRows, slotRows, changeRows] = await Promise.all([
    getRows(
      "appointments",
      `therapist_id=eq.${encodeURIComponent(therapistId)}&select=id,client_name,scheduled_at,status,concern,lifecycle_stage,client_confirmation_status,payment_reference&order=scheduled_at.asc&limit=20`,
    ),
    getRows(
      "availability_slots",
      `therapist_id=eq.${encodeURIComponent(therapistId)}&select=id,starts_at,ends_at,is_booked,slot_type,approval_status,recurrence_rule,notes&order=starts_at.asc&limit=40`,
    ),
    getRows(
      "therapist_profile_change_requests",
      `therapist_id=eq.${encodeURIComponent(therapistId)}&select=id,status,created_at,admin_note,requested_changes&order=created_at.desc&limit=10`,
    ),
  ]);

  return json({
    user: {
      email: session.user.email,
    },
    therapist: session.therapist,
    appointments: appointmentsRows.map((row) => ({
      id: value(row, ["id"]),
      client: value(row, ["client_name"], "Client"),
      time: value(row, ["scheduled_at"], "Not scheduled"),
      status: value(row, ["status"], "requested"),
      lifecycleStage: value(row, ["lifecycle_stage"], "inquiry_received"),
      confirmationStatus: value(row, ["client_confirmation_status"], "pending"),
      concern: value(row, ["concern"], "Intake pending"),
    })),
    slots: slotRows.map((row) => ({
      id: value(row, ["id"]),
      startsAt: value(row, ["starts_at"], ""),
      endsAt: value(row, ["ends_at"], ""),
      isBooked: row.is_booked === true,
      slotType: value(row, ["slot_type"], "available"),
      approvalStatus: value(row, ["approval_status"], "pending"),
      recurrenceRule: value(row, ["recurrence_rule"], ""),
      notes: value(row, ["notes"], ""),
    })),
    changeRequests: changeRows.map((row) => ({
      id: value(row, ["id"]),
      status: value(row, ["status"], "pending"),
      createdAt: value(row, ["created_at"], ""),
      adminNote: value(row, ["admin_note"], ""),
      requestedChanges:
        row.requested_changes && typeof row.requested_changes === "object"
          ? row.requested_changes
          : {},
    })),
  });
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update therapist data." }, 500);
  }

  const session = await requireTherapist(request);
  if (!session) {
    return json({ error: "Therapist access required." }, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const therapistId = value(session.therapist, ["id"]);
  const profileChanges = Object.fromEntries(
    Object.entries(normalizeProfileChanges(body)).filter(([, next]) => next !== undefined),
  );

  const slotStartsAt = typeof body.slotStartsAt === "string" ? body.slotStartsAt : "";
  const slotEndsAt = typeof body.slotEndsAt === "string" ? body.slotEndsAt : "";
  const slotType = body.slotType === "blocked" ? "blocked" : "available";
  const recurrenceRule =
    typeof body.recurrenceRule === "string" && ["none", "weekly_4", "weekly_8", "weekly_12"].includes(body.recurrenceRule)
      ? body.recurrenceRule
      : "none";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

  const results: Record<string, unknown> = {};

  if (Object.keys(profileChanges).length > 0) {
    const response = await serviceFetch("/rest/v1/therapist_profile_change_requests", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        therapist_id: therapistId,
        user_id: session.user.id,
        requested_changes: profileChanges,
        status: "pending",
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      return json({ error: result?.message ?? "Could not submit profile changes." }, response.status);
    }
    results.profileChangeRequest = Array.isArray(result) ? result[0] : result;
  }

  if (slotStartsAt && slotEndsAt) {
    const slots = buildSlots(slotStartsAt, slotEndsAt, recurrenceRule);
    const validationError = validateSlots(slots);
    if (validationError) return json({ error: validationError }, 400);

    if (await hasConflict(therapistId, slots)) {
      return json({ error: "Requested availability overlaps an existing slot or blocked time." }, 409);
    }

    const recurrenceGroupId = slots.length > 1 ? crypto.randomUUID() : null;
    const payload = slots.map((slot) => ({
      therapist_id: therapistId,
      starts_at: slot.starts.toISOString(),
      ends_at: slot.ends.toISOString(),
      is_booked: false,
      slot_type: slotType,
      approval_status: "pending",
      recurrence_rule: recurrenceRule === "none" ? null : recurrenceRule,
      recurrence_group_id: recurrenceGroupId,
      notes,
      created_by: session.user.id,
    }));

    const response = await serviceFetch("/rest/v1/availability_slots", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      return json({ error: result?.message ?? "Could not add availability." }, response.status);
    }
    results.slots = Array.isArray(result) ? result : [result];
  }

  if (Object.keys(results).length === 0) {
    return json({ error: "No profile changes or availability were provided." }, 400);
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "therapist_dashboard_update_submitted",
    subjectTable: "therapists",
    subjectId: therapistId,
    details: {
      profileFields: Object.keys(profileChanges),
      availabilityCount: Array.isArray(results.slots) ? results.slots.length : 0,
      slotType,
      recurrenceRule,
    },
  });

  return json(results);
}
