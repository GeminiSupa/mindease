const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type PublicContactSettings = {
  whatsappNumber: string;
  displayPhone: string;
  contactEmail: string;
  emailIsPlaceholder: boolean;
};

export const defaultContactSettings: PublicContactSettings = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567",
  displayPhone: process.env.NEXT_PUBLIC_DISPLAY_PHONE ?? "+92 300 1234567",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@mindease.example",
  emailIsPlaceholder: process.env.NEXT_PUBLIC_CONTACT_EMAIL_IS_PLACEHOLDER !== "false",
};

type SettingsRow = {
  whatsapp_number?: string;
  display_phone?: string;
  contact_email?: string;
  email_is_placeholder?: boolean;
};

export async function getPublicContactSettings(): Promise<PublicContactSettings> {
  if (!SUPABASE_ANON_KEY) return defaultContactSettings;

  const query = new URLSearchParams({
    id: "eq.clinic",
    select: "whatsapp_number,display_phone,contact_email,email_is_placeholder",
    limit: "1",
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return defaultContactSettings;
    const rows = (await response.json()) as SettingsRow[];
    const row = rows[0];
    if (!row) return defaultContactSettings;

    return {
      whatsappNumber: row.whatsapp_number || defaultContactSettings.whatsappNumber,
      displayPhone: row.display_phone || defaultContactSettings.displayPhone,
      contactEmail: row.contact_email || defaultContactSettings.contactEmail,
      emailIsPlaceholder: row.email_is_placeholder ?? defaultContactSettings.emailIsPlaceholder,
    };
  } catch {
    return defaultContactSettings;
  }
}

export function phoneHref(displayPhone: string) {
  return `tel:${displayPhone.replace(/[^+\d]/g, "")}`;
}
