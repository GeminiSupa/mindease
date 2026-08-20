const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function redirectHome(request: Request, status: "sent" | "error") {
  const url = new URL(request.url);
  url.pathname = "/";
  url.search = `?contact=${status}`;
  url.hash = "contact";
  return Response.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const topic = String(formData.get("topic") ?? "Website contact form").trim().slice(0, 120);

  if (!name || !contact || !message || !SUPABASE_ANON_KEY) {
    return redirectHome(request, "error");
  }

  const isEmail = contact.includes("@");
  const key = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

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
      topic: topic || "Website contact form",
      message,
      source: "website",
      status: "open",
    }),
  });

  return redirectHome(request, response.ok ? "sent" : "error");
}
