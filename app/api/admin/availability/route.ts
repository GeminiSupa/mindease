import {
  getRows,
  json,
  requireAdmin,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  value,
  writeAuditLog,
} from "../../_utils/mindease";

async function hasConflict(slotId: string, therapistId: string, startsAt: string, endsAt: string) {
  const existing = await getRows(
    "availability_slots",
    `therapist_id=eq.${encodeURIComponent(therapistId)}&id=neq.${encodeURIComponent(slotId)}&starts_at=lt.${encodeURIComponent(endsAt)}&ends_at=gt.${encodeURIComponent(startsAt)}&approval_status=neq.declined&select=id,starts_at,ends_at&limit=20`,
  );
  return existing.length > 0;
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update availability." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Admin access required." }, 403);

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const override = body.override === true;

  if (!id || !["approve", "decline"].includes(action)) {
    return json({ error: "Valid availability id and action are required." }, 400);
  }

  const slots = await getRows(
    "availability_slots",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  const slot = slots[0];
  if (!slot) return json({ error: "Availability slot not found." }, 404);

  const startsAt = value(slot, ["starts_at"], "");
  const endsAt = value(slot, ["ends_at"], "");
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  const durationMinutes = (ends.getTime() - starts.getTime()) / 60000;

  if (action === "approve") {
    if (starts.getTime() <= Date.now()) {
      return json({ error: "Cannot approve availability in the past." }, 400);
    }
    if (durationMinutes < 20 || durationMinutes > 180) {
      return json({ error: "Cannot approve implausible slot duration." }, 400);
    }
    if (!override && await hasConflict(id, value(slot, ["therapist_id"], ""), startsAt, endsAt)) {
      return json({ error: "Slot overlaps existing availability. Use override to approve intentionally." }, 409);
    }
  }

  const update = action === "approve"
    ? {
        approval_status: "approved",
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
      }
    : {
        approval_status: "declined",
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
      };

  const response = await serviceFetch(`/rest/v1/availability_slots?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(update),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update availability." }, response.status);
  }

  await writeAuditLog({
    actorId: admin.id,
    action: `availability_${action}`,
    subjectTable: "availability_slots",
    subjectId: id,
    details: {
      therapistId: slot.therapist_id,
      startsAt,
      endsAt,
      override,
    },
  });

  return json({ slot: Array.isArray(result) ? result[0] : result });
}
