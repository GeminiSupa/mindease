import { cookies } from "next/headers";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE } from "../auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_ACCESS_COOKIE);
  cookieStore.delete(ADMIN_REFRESH_COOKIE);

  return Response.json(
    { success: true },
    { headers: { "cache-control": "no-store" } },
  );
}
