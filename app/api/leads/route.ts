import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } from "../_utils/mindease";

export const runtime = "nodejs";

const WRITE_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactMethod, contactValue } = body as {
      contactMethod?: string;
      contactValue?: string;
    };

    if (!contactMethod || !contactValue?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save lead to Supabase
    if (WRITE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: {
          apikey: WRITE_KEY,
          authorization: `Bearer ${WRITE_KEY}`,
          "content-type": "application/json",
          prefer: "return=minimal",
        },
        body: JSON.stringify({
          contact_method: contactMethod,
          contact_value: contactValue.trim(),
          source: "directory_gate",
          created_at: new Date().toISOString(),
        }),
      });
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
