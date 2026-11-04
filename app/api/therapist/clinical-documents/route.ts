import { getRows, json, requireTherapist, serviceFetch, serviceHeaders, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, value, writeAuditLog } from "../../_utils/mindease";

const BUCKET = "mindease-clinical";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

async function ownsCase(therapistId: string, caseId: string) {
  const rows = await getRows("clinical_cases", `id=eq.${encodeURIComponent(caseId)}&therapist_id=eq.${encodeURIComponent(therapistId)}&select=id&limit=1`);
  return Boolean(rows[0]);
}

export async function GET(request: Request) {
  const session = await requireTherapist(request);
  if (!session) return json({ error: "Therapist access required." }, 403);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const rows = await getRows("clinical_documents", `id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  const document = rows[0];
  if (!document || !(await ownsCase(value(session.therapist, ["id"]), value(document, ["case_id"])))) return json({ error: "Document not found." }, 404);
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${encodeURI(value(document, ["storage_path"]))}`, {
    method: "POST", headers: { ...serviceHeaders(), "content-type": "application/json" }, body: JSON.stringify({ expiresIn: 300 }),
  });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not open document." }, response.status);
  const signed = String(result.signedURL ?? result.signedUrl ?? "");
  return json({ url: signed.startsWith("http") ? signed : `${SUPABASE_URL}/storage/v1${signed}`, expiresIn: 300 });
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Clinical documents are not configured." }, 500);
  const session = await requireTherapist(request);
  if (!session) return json({ error: "Therapist access required." }, 403);
  const form = await request.formData();
  const file = form.get("file");
  const caseId = String(form.get("caseId") ?? "");
  const category = ["intake", "assessment", "referral", "medical", "consent", "homework", "other"].includes(String(form.get("category"))) ? String(form.get("category")) : "other";
  if (!(file instanceof File) || !caseId) return json({ error: "Case and document are required." }, 400);
  if (!(await ownsCase(value(session.therapist, ["id"]), caseId))) return json({ error: "Clinical case not found." }, 404);
  if (!ALLOWED.has(file.type) || file.size <= 0 || file.size > MAX_BYTES) return json({ error: "Use PDF, DOCX, JPG, PNG or WebP up to 10 MB." }, 400);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "document";
  const path = `${caseId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`, { method: "POST", headers: { ...serviceHeaders(), "content-type": file.type, "x-upsert": "false" }, body: await file.arrayBuffer() });
  if (!upload.ok) return json({ error: "Private document upload failed. Ensure the clinical migration has been applied." }, upload.status);
  const response = await serviceFetch("/rest/v1/clinical_documents", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ case_id: caseId, uploaded_by: session.user.id, file_name: file.name.slice(0, 255), storage_path: path, mime_type: file.type, file_size: file.size, category }) });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not save document record." }, response.status);
  const document = Array.isArray(result) ? result[0] : result;
  await writeAuditLog({ actorId: session.user.id, action: "clinical_document_uploaded", subjectTable: "clinical_documents", subjectId: document?.id, details: { caseId, category } });
  return json({ document }, 201);
}
