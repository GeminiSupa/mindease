import {
  json,
  requireAdmin,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  writeAuditLog,
} from "../../_utils/mindease";

function normalizePayload(body: Record<string, unknown>) {
  const whatsappNumber = typeof body.whatsappNumber === "string"
    ? body.whatsappNumber.replace(/\D/g, "")
    : "";
  const displayPhone = typeof body.displayPhone === "string" ? body.displayPhone.trim() : "";
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const emailIsPlaceholder = body.emailIsPlaceholder === true;

  if (!/^\d{8,15}$/.test(whatsappNumber)) {
    return { error: "WhatsApp number must contain 8 to 15 digits, including country code." };
  }
  if (displayPhone.length < 8 || displayPhone.length > 30) {
    return { error: "Display phone must be between 8 and 30 characters." };
  }
  if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: "Enter a valid contact email address." };
  }

  return {
    payload: {
      id: "clinic",
      whatsapp_number: whatsappNumber,
      display_phone: displayPhone,
      contact_email: contactEmail,
      email_is_placeholder: emailIsPlaceholder,
      updated_at: new Date().toISOString(),
    },
  };
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Admin access required." }, 403);

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update site settings." }, 500);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const normalized = normalizePayload(body);
  if (normalized.error || !normalized.payload) return json({ error: normalized.error }, 400);

  const payload = { ...normalized.payload, updated_by: admin.id };
  const response = await serviceFetch("/rest/v1/site_settings?on_conflict=id", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update public contact settings." }, response.status);
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "site_contact_settings_updated",
    subjectTable: "site_settings",
    details: {
      whatsappNumber: payload.whatsapp_number,
      displayPhone: payload.display_phone,
      contactEmail: payload.contact_email,
      emailIsPlaceholder: payload.email_is_placeholder,
    },
  });

  return json({ settings: Array.isArray(result) ? result[0] : result });
}
