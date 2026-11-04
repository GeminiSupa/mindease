import { getRows, json, requireAdmin, serviceFetch, SUPABASE_SERVICE_ROLE_KEY, writeAuditLog } from "../../_utils/mindease";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const rows = await getRows(
    "leads",
    "select=*&order=created_at.desc&limit=500",
  );

  const leads = rows.map((row) => ({
    id: String(row.id ?? ""),
    contactMethod: String(row.contact_method ?? ""),
    contactValue: String(row.contact_value ?? ""),
    source: String(row.source ?? "directory_gate"),
    createdAt: String(row.created_at ?? ""),
    name: String(row.name ?? ""), city: String(row.city ?? ""), inferredCity: String(row.inferred_city ?? ""), region: String(row.region ?? ""), countryCode: String(row.country_code ?? ""),
    ipPrefix: String(row.ip_prefix ?? ""), ipHash: String(row.ip_hash ?? ""), referrer: String(row.referrer ?? ""), landingPage: String(row.landing_page ?? row.page_url ?? ""),
    utmSource: String(row.utm_source ?? ""), utmMedium: String(row.utm_medium ?? ""), utmCampaign: String(row.utm_campaign ?? ""),
    browserLanguage: String(row.browser_language ?? ""), timezone: String(row.timezone ?? ""), deviceType: String(row.device_type ?? ""),
    consentAccepted: row.consent_accepted === true, leadStatus: String(row.lead_status ?? "new"), leadScore: Number(row.lead_score) || 0,
    notes: String(row.notes ?? ""), converted: row.converted === true,
  }));

  return json({ leads });
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Lead management is not configured." }, 500);
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const leadStatus = typeof body.leadStatus === "string" && ["new", "contacted", "qualified", "booked", "not_interested"].includes(body.leadStatus) ? body.leadStatus : "";
  if (!id || !leadStatus) return json({ error: "Lead and status are required." }, 400);
  const converted = leadStatus === "booked" || body.converted === true;
  const update = { lead_status: leadStatus, notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "", converted,
    converted_at: converted ? new Date().toISOString() : null, last_contacted_at: ["contacted", "qualified", "booked"].includes(leadStatus) ? new Date().toISOString() : null };
  const response = await serviceFetch(`/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(update) });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not update lead." }, response.status);
  await writeAuditLog({ actorId: admin.id, action: "lead_status_updated", subjectTable: "leads", subjectId: id, details: { leadStatus, converted } });
  return json({ lead: Array.isArray(result) ? result[0] : result });
}
