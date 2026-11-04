import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } from "../_utils/mindease";

export const runtime = "nodejs";

const WRITE_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({ captured: cookieStore.get("lead_captured")?.value === "true" }, { headers: { "cache-control": "no-store" } });
}

function clean(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 254;
}

function normalizePhone(value: string) {
  const normalized = value.replace(/[\s().-]/g, "");
  return /^\+?[1-9]\d{9,14}$/.test(normalized) ? normalized : "";
}

function headerValue(request: Request, names: string[]) {
  for (const name of names) {
    const found = request.headers.get(name);
    if (found) return decodeURIComponent(found).slice(0, 160);
  }
  return "";
}

function maskIp(ip: string) {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return `${ip.split(".").slice(0, 3).join(".")}.0/24`;
  if (ip.includes(":")) return `${ip.split(":").slice(0, 4).join(":")}::/64`;
  return "";
}

async function hashIp(ip: string) {
  if (!ip) return "";
  const salt = SUPABASE_SERVICE_ROLE_KEY?.slice(-32) ?? "mindease-lead-abuse-control";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest)).slice(0, 12).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactMethod, contactValue } = body as {
      contactMethod?: string;
      contactValue?: string;
    };

    const method = contactMethod === "whatsapp" ? "whatsapp" : contactMethod === "email" ? "email" : "";
    const rawContact = clean(contactValue, 254);
    const normalizedContact = method === "email" ? rawContact.toLowerCase() : normalizePhone(rawContact);
    const consentAccepted = body.consentAccepted === true;
    const city = clean(body.city, 100);
    if (!method || !normalizedContact || (method === "email" && !validEmail(normalizedContact))) {
      return NextResponse.json({ error: method === "whatsapp" ? "Enter a valid WhatsApp number with country code." : "Enter a valid email address." }, { status: 400 });
    }
    if (!city) return NextResponse.json({ error: "City is required." }, { status: 400 });
    if (!consentAccepted) return NextResponse.json({ error: "Consent is required to continue." }, { status: 400 });
    if (!WRITE_KEY) return NextResponse.json({ error: "Lead capture is not configured." }, { status: 500 });

    const forwardedIp = headerValue(req, ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"]).split(",")[0].trim();
    const geoCity = headerValue(req, ["x-vercel-ip-city", "cf-ipcity"]);
    const region = headerValue(req, ["x-vercel-ip-country-region", "cf-region"]);
    const countryCode = headerValue(req, ["x-vercel-ip-country", "cf-ipcountry"]).toUpperCase().slice(0, 2);
    const source = clean(body.source, 80) || "self_test_gate";
    const utmSource = clean(body.utmSource, 120);
    const utmCampaign = clean(body.utmCampaign, 160);
    const leadScore = Math.min(100, 40 + (method === "whatsapp" ? 15 : 10) + (city ? 10 : 0) + (utmSource || utmCampaign ? 10 : 0));

    // Save lead to Supabase
      const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          apikey: WRITE_KEY,
          authorization: `Bearer ${WRITE_KEY}`,
          "content-type": "application/json",
          prefer: "return=minimal",
        },
        body: JSON.stringify({
          contact_method: method,
          contact_value: normalizedContact,
          name: clean(body.name, 120) || null,
          city,
          inferred_city: geoCity || null,
          region: region || null,
          country_code: countryCode || null,
          ip_prefix: maskIp(forwardedIp) || null,
          ip_hash: (await hashIp(forwardedIp)) || null,
          source,
          page_url: clean(body.pageUrl, 1000) || null,
          landing_page: clean(body.landingPage, 1000) || null,
          referrer: clean(body.referrer, 1000) || null,
          utm_source: utmSource || null,
          utm_medium: clean(body.utmMedium, 120) || null,
          utm_campaign: utmCampaign || null,
          utm_content: clean(body.utmContent, 160) || null,
          utm_term: clean(body.utmTerm, 160) || null,
          browser_language: clean(body.browserLanguage, 30) || null,
          timezone: clean(body.timezone, 80) || null,
          device_type: clean(body.deviceType, 30) || null,
          consent_accepted: true,
          consent_text: "Contact me about therapy matching. Store contact and coarse location/visit attribution for follow-up and service improvement.",
          privacy_version: "lead-gate-2026-11",
          lead_status: "new",
          lead_score: leadScore,
          created_at: new Date().toISOString(),
        }),
      });
      if (!saveResponse.ok) {
        const detail = await saveResponse.json().catch(() => ({}));
        return NextResponse.json({ error: detail?.message ?? "Could not save your details. Please try again." }, { status: 500 });
      }

    // Set cookie so the gate doesn't show again
    const cookieStore = await cookies();
    cookieStore.set("lead_captured", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
