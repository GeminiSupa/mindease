import { getAuthorizedAdmin } from "../auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !["open", "in_progress", "closed", "spam"].includes(status)) {
    return json({ error: "Valid message id and status are required." }, 400);
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: headers({ prefer: "return=representation" }),
      body: JSON.stringify({ status, assigned_to: status === "in_progress" ? admin.id : undefined }),
    },
  );
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not update message." }, response.status);
  if (!Array.isArray(result) || !result[0]) return json({ error: "Message was not found." }, 404);

  await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_logs`, {
    method: "POST",
    headers: headers({ prefer: "return=minimal" }),
    body: JSON.stringify({
      actor_id: admin.id,
      action: `message.${status}`,
      entity_table: "contact_messages",
      entity_id: id,
    }),
  }).catch(() => undefined);

  return json({ message: result[0] });
}
