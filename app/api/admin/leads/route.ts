import { getRows, json, requireAdmin } from "../../_utils/mindease";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const rows = await getRows(
    "leads",
    "select=id,contact_method,contact_value,source,created_at&order=created_at.desc&limit=100",
  );

  const leads = rows.map((row) => ({
    id: String(row.id ?? ""),
    contactMethod: String(row.contact_method ?? ""),
    contactValue: String(row.contact_value ?? ""),
    source: String(row.source ?? "directory_gate"),
    createdAt: String(row.created_at ?? ""),
  }));

  return json({ leads });
}
