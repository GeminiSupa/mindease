import {
  getRows,
  json,
  requireAdmin,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  writeAuditLog,
} from "../../_utils/mindease";

function sanitizeChanges(input: unknown) {
  const requested = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const allowed = [
    "title",
    "qualifications",
    "bio",
    "specialization",
    "languages",
    "profile_image_url",
    "session_fee",
    "availability_status",
  ];

  return Object.fromEntries(
    Object.entries(requested).filter(([key]) => allowed.includes(key)),
  );
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to review changes." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

  if (!id || !["approve", "decline"].includes(action)) {
    return json({ error: "Valid change request id and action are required." }, 400);
  }

  const requests = await getRows(
    "therapist_profile_change_requests",
    `id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  const changeRequest = requests[0];

  if (!changeRequest) {
    return json({ error: "Change request not found." }, 404);
  }

  let changes: Record<string, unknown> = {};

  if (action === "approve") {
    const therapistId =
      typeof changeRequest.therapist_id === "string" ? changeRequest.therapist_id : "";
    changes = sanitizeChanges(body.editedChanges ?? changeRequest.requested_changes);

    const therapistResponse = await serviceFetch(
      `/rest/v1/therapists?id=eq.${encodeURIComponent(therapistId)}`,
      {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify(changes),
      },
    );

    if (!therapistResponse.ok) {
      const result = await therapistResponse.json();
      return json({ error: result?.message ?? "Could not publish profile changes." }, therapistResponse.status);
    }
  }

  const response = await serviceFetch(
    `/rest/v1/therapist_profile_change_requests?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        status: action === "approve" ? "approved" : "declined",
        admin_note: adminNote,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      }),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update change request." }, response.status);
  }

  await writeAuditLog({
    actorId: admin.id,
    action: `profile_change_${action}`,
    subjectTable: "therapist_profile_change_requests",
    subjectId: id,
    details: {
      therapistId: changeRequest.therapist_id,
      changes,
      adminNote,
    },
  });

  return json({ changeRequest: Array.isArray(result) ? result[0] : result });
}
