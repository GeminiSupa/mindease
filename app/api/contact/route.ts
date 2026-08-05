import {
  json,
  serviceFetch,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "../_utils/mindease";

const CONSENT_TEXT =
  "I understand MindEase is not an emergency service, this form is for clinic coordination, and my submitted contact details may be used to respond to this inquiry.";

function redirectHome(request: Request, status: "sent" | "error") {
  const url = new URL(request.url);
  url.pathname = "/";
  url.search = `?contact=${status}`;
  url.hash = "contact";
  return Response.redirect(url, 303);
}

function trimLimit(value: FormDataEntryValue | null, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

async function insertWithAnon(payload: Record<string, unknown>) {
  const key = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;
  if (!key) return null;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return null;
  const result = await response.json();
  return Array.isArray(result) ? result[0] : result;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = trimLimit(formData.get("name"), 120);
  const contact = trimLimit(formData.get("contact"), 160);
  const message = trimLimit(formData.get("message"), 2000);
  const preferredLanguage = trimLimit(formData.get("preferredLanguage"), 80);
  const preferredTime = trimLimit(formData.get("preferredTime"), 120);
  const consentAccepted = formData.get("consent") === "on" || formData.get("consent") === "true";

  if (!name || !contact || !message || !SUPABASE_ANON_KEY || !consentAccepted) {
    return redirectHome(request, "error");
  }

  const isEmail = contact.includes("@");
  const contactMessage = await insertWithAnon({
    name,
    email: isEmail ? contact : null,
    phone: isEmail ? null : contact,
    topic: "Website therapy inquiry",
    message,
    source: "website",
    status: "open",
    preferred_language: preferredLanguage || null,
    preferred_time: preferredTime || null,
    consent_accepted: true,
    consent_text: CONSENT_TEXT,
  });

  if (!contactMessage) {
    return redirectHome(request, "error");
  }

  if (SUPABASE_SERVICE_ROLE_KEY) {
    const appointmentResponse = await serviceFetch("/rest/v1/appointments", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        contact_message_id: contactMessage.id,
        client_name: name,
        client_email: isEmail ? contact : null,
        client_phone: isEmail ? null : contact,
        concern: message,
        status: "requested",
        lifecycle_stage: "inquiry_received",
        client_confirmation_token: crypto.randomUUID(),
        client_confirmation_status: "pending",
        payment_provider: "manual_placeholder",
        payment_instructions:
          "Payment integration is not configured. Admin will share approved manual payment instructions if a session is confirmed.",
        notification_status: "not_configured",
      }),
    });

    if (appointmentResponse.ok) {
      const appointmentResult = await appointmentResponse.json();
      const appointment = Array.isArray(appointmentResult) ? appointmentResult[0] : appointmentResult;
      await serviceFetch(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(contactMessage.id)}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ appointment_id: appointment.id }),
      });
    }
  }

  return redirectHome(request, "sent");
}

export async function GET() {
  return json({ consentText: CONSENT_TEXT });
}
