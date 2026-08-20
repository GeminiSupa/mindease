import { getAuthorizedAdmin } from "../auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const transitions: Record<string, string> = {
  confirm: "confirmed",
  complete: "completed",
  cancel: "cancelled",
  no_show: "no_show",
};

const allowedCurrentStatuses: Record<string, string> = {
  confirm: "requested,payment_pending,reschedule_requested",
  complete: "confirmed",
  cancel: "requested,payment_pending,confirmed,reschedule_requested",
  no_show: "confirmed",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function headers(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "content-type": "application/json",
    ...extra,
  };
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Clinic data service is not configured." }, 503);
  const admin = await getAuthorizedAdmin(request);
  if (!admin) return json({ error: "Admin access required." }, 403);

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!id || !transitions[action]) {
    return json({ error: "Valid appointment id and action are required." }, 400);
  }
  if (action === "cancel" && !reason) {
    return json({ error: "A cancellation reason is required." }, 400);
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/appointments?id=eq.${encodeURIComponent(id)}&status=in.(${allowedCurrentStatuses[action]})`,
    {
      method: "PATCH",
      headers: headers({ prefer: "return=representation" }),
      body: JSON.stringify({ status: transitions[action], admin_notes: reason || null }),
    },
  );
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not update appointment." }, response.status);
  if (!Array.isArray(result) || !result[0]) {
    return json({ error: "The appointment changed or this action is no longer allowed. Refresh and try again." }, 409);
  }

  await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_logs`, {
    method: "POST",
    headers: headers({ prefer: "return=minimal" }),
    body: JSON.stringify({
      actor_id: admin.id,
      action: `appointment.${action}`,
      entity_table: "appointments",
      entity_id: id,
      metadata: { reason: reason || null },
    }),
  }).catch(() => undefined);

  return json({ appointment: result[0] });
}
