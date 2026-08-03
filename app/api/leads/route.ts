import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { leads } from "../../../db/schema";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactMethod, contactValue } = body;

    if (!contactMethod || !contactValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a real scenario we'd get the DB binding from context or middleware.
    // For now we simulate success and set a cookie.
    
    // Set a cookie to indicate the user has provided their info
    const cookieStore = await cookies();
    cookieStore.set('lead_captured', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
