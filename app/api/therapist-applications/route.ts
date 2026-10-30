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
  const email = trimLimit(formData.get("email"), 160);
  const phone = trimLimit(formData.get("phone"), 80);
  const professionalTitle = trimLimit(formData.get("professionalTitle"), 120);
  const countryCode = trimLimit(formData.get("countryCode"), 2).toUpperCase();
  const countryOfOrigin = trimLimit(formData.get("countryOfOrigin"), 100);
  const qualifications = trimLimit(formData.get("qualifications"), 400);
  const licenseNumber = trimLimit(formData.get("licenseNumber"), 200);
  const yearsExperience = trimLimit(formData.get("yearsExperience"), 3);
  const sessionFee = trimLimit(formData.get("sessionFee"), 20);
  const currency = trimLimit(formData.get("currency"), 5);
  const languages = trimLimit(formData.get("languages"), 300);
  const specialization = trimLimit(formData.get("specialization"), 500);
  const profileUrl = trimLimit(formData.get("profileUrl"), 1000);
  const bio = trimLimit(formData.get("bio"), 2500);
  const consentAccepted = formData.get("consent") === "on";
  const key = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

  if (!name || !email || !phone || !professionalTitle || !qualifications || !licenseNumber || !languages || !specialization || !bio || !consentAccepted || !key) {
    return redirectApplication(request, "error");
  }

  const message = [
    `Professional title: ${professionalTitle}`,
    `Country: ${countryOfOrigin || countryCode || "Pakistan"} (${countryCode || "PK"})`,
    `Qualifications: ${qualifications}`,
    `Licence / registration: ${licenseNumber}`,
    `Experience: ${yearsExperience || "Not provided"} years`,
    `Expected fee: ${sessionFee ? `${currency || "PKR"} ${sessionFee}` : "Not provided"}`,
    `Languages: ${languages}`,
    `Focus areas: ${specialization}`,
    `Professional profile: ${profileUrl || "Not provided"}`,
    `Bio: ${bio}`,
  ].join("\n");
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
        email,
        phone,
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
