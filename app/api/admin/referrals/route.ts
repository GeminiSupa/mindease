import { getRows, json, requireAdmin, serviceFetch, SUPABASE_SERVICE_ROLE_KEY, value, writeAuditLog } from "../../_utils/mindease";

export const runtime = "nodejs";

const activeStatuses = ["therapist_review", "therapist_accepted", "awaiting_client_consent", "client_consented", "ready_to_book", "booked"];

async function logReferral(referralId: string, actorId: string, event: string, details: Record<string, unknown> = {}) {
  await serviceFetch("/rest/v1/referral_access_logs", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ referral_id: referralId, actor_id: actorId, actor_role: "admin", event, details }) });
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const [referrals, therapists, leads, messages] = await Promise.all([
    getRows("client_referrals", "select=*&order=updated_at.desc&limit=300"),
    getRows("therapists", "select=id,full_name,title,specialization,languages,session_fee,availability_status,approval_status,is_active&order=full_name.asc"),
    getRows("leads", "select=id,name,contact_method,contact_value,city,lead_status&limit=500"),
    getRows("referral_messages", "select=*&order=created_at.asc&limit=1000"),
  ]);
  return json({ referrals, therapists, leads, messages });
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Referral management is not configured." }, 500);
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const body = await request.json();
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const therapistId = typeof body.therapistId === "string" ? body.therapistId : "";
  const summary = typeof body.limitedSummary === "string" ? body.limitedSummary.trim().slice(0, 3000) : "";
  const concern = typeof body.presentingConcern === "string" ? body.presentingConcern.trim().slice(0, 200) : "";
  if (!leadId || !therapistId || !summary || !concern) return json({ error: "Lead, therapist, concern and limited summary are required." }, 400);
  const riskLevel = ["not_assessed", "low", "moderate", "high", "imminent"].includes(body.riskLevel) ? body.riskLevel : "not_assessed";
  if (["high", "imminent"].includes(riskLevel)) return json({ error: "High or imminent risk cannot use routine matching. Complete the clinic escalation process first." }, 400);
  const [lead] = await getRows("leads", `id=eq.${encodeURIComponent(leadId)}&select=id,name,lead_status&limit=1`);
  const [therapist] = await getRows("therapists", `id=eq.${encodeURIComponent(therapistId)}&select=id,is_active,approval_status&limit=1`);
  if (!lead) return json({ error: "Lead not found." }, 404);
  if (!therapist || therapist.is_active !== true || therapist.approval_status !== "approved") return json({ error: "Choose an active, approved therapist." }, 400);
  const existing = await getRows("client_referrals", `lead_id=eq.${encodeURIComponent(leadId)}&status=in.(${activeStatuses.join(",")})&select=id&limit=1`);
  if (existing.length) return json({ error: "This lead already has an active referral." }, 409);
  const payload = {
    lead_id: leadId, therapist_id: therapistId, created_by: admin.id, client_display_name: value(lead, ["name"], "New client"),
    presenting_concern: concern, limited_summary: summary,
    urgency: ["routine", "priority", "urgent"].includes(body.urgency) ? body.urgency : "routine", risk_level: riskLevel,
    preferred_language: String(body.preferredLanguage ?? "").slice(0, 100), preferred_format: String(body.preferredFormat ?? "").slice(0, 100),
    preferred_times: String(body.preferredTimes ?? "").slice(0, 300), budget_range: String(body.budgetRange ?? "").slice(0, 100),
    match_reason: String(body.matchReason ?? "").slice(0, 1000), coordinator_note: String(body.coordinatorNote ?? "").slice(0, 2000),
  };
  const response = await serviceFetch("/rest/v1/client_referrals", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(payload) });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not create referral." }, response.status);
  const referral = Array.isArray(result) ? result[0] : result;
  await logReferral(String(referral.id), admin.id, "referral_created", { therapistId, riskLevel });
  await writeAuditLog({ actorId: admin.id, action: "referral_created", subjectTable: "client_referrals", subjectId: String(referral.id), details: { therapistId, leadId } });
  return json({ referral }, 201);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return json({ error: "Referral is required." }, 400);
  if (body.action === "message") {
    const message = String(body.message ?? "").trim().slice(0, 2000);
    if (!message) return json({ error: "Write a message first." }, 400);
    const response = await serviceFetch("/rest/v1/referral_messages", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ referral_id: id, sender_id: admin.id, sender_role: "admin", message }) });
    if (!response.ok) return json({ error: "Could not send message." }, response.status);
    await logReferral(id, admin.id, "secure_message_sent");
    return json({ ok: true });
  }
  const status = ["ready_to_book", "booked", "closed"].includes(body.status) ? body.status : "";
  const therapistId = typeof body.therapistId === "string" ? body.therapistId : "";
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let event = "referral_updated";
  if (therapistId) {
    const reason = String(body.transferReason ?? "").trim().slice(0, 1000);
    if (!reason) return json({ error: "Add a reason before reassigning." }, 400);
    update.therapist_id = therapistId; update.status = "therapist_review"; update.transfer_reason = reason;
    update.therapist_response_note = null; update.therapist_responded_at = null; update.client_consent_at = null;
    update.client_consent_token = crypto.randomUUID(); update.client_consent_expires_at = new Date(Date.now() + 7 * 86400000).toISOString();
    event = "referral_reassigned";
  } else if (status) { update.status = status; event = `referral_${status}`; }
  else return json({ error: "Choose a valid update." }, 400);
  const response = await serviceFetch(`/rest/v1/client_referrals?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(update) });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not update referral." }, response.status);
  await logReferral(id, admin.id, event, update);
  return json({ referral: Array.isArray(result) ? result[0] : result });
}
