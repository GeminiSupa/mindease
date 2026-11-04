import { getRows, json, requireTherapist, serviceFetch, value } from "../../_utils/mindease";

export const runtime = "nodejs";

async function addLog(referralId: string, actorId: string, event: string) {
  await serviceFetch("/rest/v1/referral_access_logs", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ referral_id: referralId, actor_id: actorId, actor_role: "therapist", event }) });
}

export async function GET(request: Request) {
  const session = await requireTherapist(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const therapistId = value(session.therapist, ["id"]);
  const referrals = await getRows("client_referrals", `therapist_id=eq.${encodeURIComponent(therapistId)}&status=not.in.(transferred,closed)&select=*&order=updated_at.desc&limit=100`);
  const messages = await getRows("referral_messages", `referral_id=in.(${referrals.map((item) => item.id).filter(Boolean).join(",") || "00000000-0000-0000-0000-000000000000"})&select=*&order=created_at.asc&limit=500`);
  const consentedLeadIds = referrals.filter((item) => ["client_consented", "ready_to_book", "booked"].includes(String(item.status))).map((item) => item.lead_id).filter(Boolean);
  const leads = consentedLeadIds.length ? await getRows("leads", `id=in.(${consentedLeadIds.join(",")})&select=id,name,contact_method,contact_value,city`) : [];
  return json({ referrals, messages, leads });
}

export async function PATCH(request: Request) {
  const session = await requireTherapist(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const therapistId = value(session.therapist, ["id"]);
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const [referral] = await getRows("client_referrals", `id=eq.${encodeURIComponent(id)}&therapist_id=eq.${encodeURIComponent(therapistId)}&select=id,status&limit=1`);
  if (!referral) return json({ error: "Referral is no longer available." }, 404);
  if (body.action === "message") {
    const message = String(body.message ?? "").trim().slice(0, 2000);
    if (!message) return json({ error: "Write a message first." }, 400);
    await serviceFetch("/rest/v1/referral_messages", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ referral_id: id, sender_id: session.user.id, sender_role: "therapist", message }) });
    await addLog(id, session.user.id, "secure_message_sent");
    return json({ ok: true });
  }
  if (String(referral.status) !== "therapist_review") return json({ error: "This referral has already been reviewed." }, 409);
  const accept = body.action === "accept";
  const decline = body.action === "decline";
  if (!accept && !decline) return json({ error: "Choose accept or decline." }, 400);
  const note = String(body.note ?? "").trim().slice(0, 1500);
  if (decline && !note) return json({ error: "Please add a brief decline reason so the coordinator can rematch safely." }, 400);
  const update = { status: accept ? "awaiting_client_consent" : "therapist_declined", therapist_response_note: note, decline_reason: decline ? note : null, therapist_responded_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const response = await serviceFetch(`/rest/v1/client_referrals?id=eq.${encodeURIComponent(id)}&therapist_id=eq.${encodeURIComponent(therapistId)}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(update) });
  if (!response.ok) return json({ error: "Could not save response." }, response.status);
  await addLog(id, session.user.id, accept ? "therapist_accepted" : "therapist_declined");
  return json({ ok: true });
}
