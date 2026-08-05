import {
  json,
  requireAdmin,
  requireTherapist,
  serviceHeaders,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  value,
  writeAuditLog,
} from "../_utils/mindease";

const BUCKET = "mindease-media";
const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function publicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function uploadObject(path: string, file: File) {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        ...serviceHeaders({
          "content-type": file.type,
          "x-upsert": "false",
        }),
      },
      body: await file.arrayBuffer(),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Upload failed.");
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for uploads." }, 500);
  }

  const admin = await requireAdmin(request);
  const therapistSession = admin ? null : await requireTherapist(request);
  if (!admin && !therapistSession) {
    return json({ error: "Authenticated admin or therapist access required." }, 403);
  }

  const formData = await request.formData();
  const purpose = String(formData.get("purpose") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return json({ error: "Image file is required." }, 400);
  }

  if (!["therapist-photo", "blog-image"].includes(purpose)) {
    return json({ error: "Valid upload purpose is required." }, 400);
  }

  if (!admin && purpose !== "therapist-photo") {
    return json({ error: "Therapists may upload therapist profile photos only." }, 403);
  }

  if (!MIME_TO_EXT[file.type]) {
    return json({ error: "Only JPEG, PNG, and WebP images are allowed." }, 400);
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return json({ error: "Image must be between 1 byte and 5 MB." }, 400);
  }

  let therapistId =
    typeof formData.get("therapistId") === "string"
      ? String(formData.get("therapistId"))
      : therapistSession
        ? value(therapistSession.therapist, ["id"])
        : "";

  if (admin && purpose === "therapist-photo" && (!therapistId || therapistId === "new-profile")) {
    therapistId = "admin-upload";
  }

  if (purpose === "therapist-photo" && !therapistId) {
    return json({ error: "Therapist id is required for therapist photo uploads." }, 400);
  }

  if (!admin && therapistSession && therapistId !== value(therapistSession.therapist, ["id"])) {
    return json({ error: "Therapists may only upload to their own profile folder." }, 403);
  }

  const ext = MIME_TO_EXT[file.type];
  const path =
    purpose === "therapist-photo"
      ? `therapists/${therapistId}/${crypto.randomUUID()}.${ext}`
      : `blog/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  try {
    await uploadObject(path, file);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Upload failed." }, 500);
  }

  await writeAuditLog({
    actorId: admin?.id ?? therapistSession?.user.id,
    action: "media_uploaded",
    subjectTable: purpose === "therapist-photo" ? "therapists" : "blog_posts",
    subjectId: purpose === "therapist-photo" ? therapistId : undefined,
    details: {
      purpose,
      path,
      mimeType: file.type,
      size: file.size,
    },
  });

  return json({
    bucket: BUCKET,
    path,
    url: publicUrl(path),
    maxBytes: MAX_BYTES,
    allowedMimeTypes: Object.keys(MIME_TO_EXT),
  });
}
