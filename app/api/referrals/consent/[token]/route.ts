import { getRows, json, serviceFetch, value } from "../../../_utils/mindease";

export const runtime = "nodejs";

async function findReferral(token: string) {
  const [referral] = await getRows("client_referrals", `client_consent_token=eq.${encodeURIComponent(token)}&select=*&limit=1`);
  return referral;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const referral = await findReferral(token);
  if (!referral) return json({ error: "This consent link is not valid." }, 404);
  const [therapist] = await getRows("therapists", `id=eq.${encodeURIComponent(value(referral, ["therapist_id"]))}&select=full_name,title,qualifications,profile_image_url,specialization,languages&limit=1`);
  return json({
    referral: { status: referral.status, expiresAt: referral.client_consent_expires_at, presentingConcern: referral.presenting_concern, preferredFormat: referral.preferred_format },
    therapist: therapist ? { name: therapist.full_name, title: therapist.title, qualifications: therapist.qualifications, photo: therapist.profile_image_url, specialization: therapist.specialization, languages: therapist.languages } : null,
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const referral = await findReferral(token);
  if (!referral) return json({ error: "This consent link is not valid." }, 404);
  if (String(referral.status) !== "awaiting_client_consent") return json({ error: "This consent request has already been completed or withdrawn." }, 409);
  if (new Date(String(referral.client_consent_expires_at)).getTime() < Date.now()) return json({ error: "This link has expired. Ask the coordinator for a new one." }, 410);
  const body = await request.json();
  const consent = body.action === "consent" && body.confirmed === true;
  const decline = body.action === "decline";
  if (!consent && !decline) return json({ error: "Please confirm your choice." }, 400);
  const update = consent
    ? { status: "client_consented", client_consent_at: new Date().toISOString(), client_consent_scope: "Contact details, care preferences and referral summary shared with the named therapist", updated_at: new Date().toISOString() }
    : { status: "client_declined", client_consent_at: null, client_consent_scope: null, updated_at: new Date().toISOString() };
  const response = await serviceFetch(`/rest/v1/client_referrals?id=eq.${encodeURIComponent(value(referral, ["id"]))}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(update) });
  if (!response.ok) return json({ error: "Could not record your choice." }, response.status);
  await serviceFetch("/rest/v1/referral_access_logs", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ referral_id: referral.id, actor_role: "client", event: consent ? "client_consented" : "client_declined" }) });
  return json({ ok: true, status: update.status });
}
