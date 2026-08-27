import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "../_utils/mindease";

const CONSENT_TEXT =
  "I consent to MindEase using my submitted professional and contact details to review my therapist network application.";

function redirectApplication(request: Request, status: "sent" | "error") {
  const url = new URL(request.url);
  url.pathname = "/therapists/join";
  url.search = `?application=${status}`;
  return Response.redirect(url, 303);
}

function trimLimit(value: FormDataEntryValue | null, limit: number) {
  return String(value ?? "").trim().slice(0, limit);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = trimLimit(formData.get("name"), 120);
  const contact = trimLimit(formData.get("contact"), 160);
  const message = trimLimit(formData.get("message"), 4000);
  const consentAccepted = formData.get("consent") === "on";
  const key = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

  if (!name || !contact || !message || !consentAccepted || !key) {
    return redirectApplication(request, "error");
  }

  const isEmail = contact.includes("@");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        name,
        email: isEmail ? contact : null,
        phone: isEmail ? null : contact,
        topic: "Therapist network application",
        message,
        source: "therapist_application",
        status: "open",
        consent_accepted: true,
        consent_text: CONSENT_TEXT,
      }),
    });

    return redirectApplication(request, response.ok ? "sent" : "error");
  } catch {
    return redirectApplication(request, "error");
  }
}
