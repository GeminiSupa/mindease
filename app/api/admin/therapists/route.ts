import { getAuthorizedAdmin } from "../auth";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function serviceHeaders(extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
    "content-type": "application/json",
    ...extra,
  };
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to create therapists." }, 500);
  }

  if (!(await getAuthorizedAdmin(request))) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = await request.json();
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!fullName) {
    return json({ error: "Therapist name is required." }, 400);
  }

  const payload = {
    slug: slugify(fullName) || crypto.randomUUID(),
    full_name: fullName,
    title:
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Clinical Psychologist",
    qualifications:
      typeof body.qualifications === "string" ? body.qualifications.trim() : "",
    specialization:
      typeof body.specialization === "string" ? body.specialization.trim() : "",
    bio: typeof body.bio === "string" ? body.bio.trim() : "",
    profile_image_url:
      typeof body.profileImageUrl === "string" ? body.profileImageUrl.trim() : "",
    years_experience: Number(body.yearsExperience) || 0,
    session_fee: Number(body.sessionFee) || 0,
    languages:
      typeof body.languages === "string"
        ? body.languages
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        : ["Urdu", "English"],
    is_active: false,
    approval_status: "pending",
    availability_status: "Pending admin approval",
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/therapists`, {
    method: "POST",
    headers: serviceHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not create therapist profile." }, response.status);
  }

  return json({ therapist: Array.isArray(result) ? result[0] : result }, 201);
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update therapists." }, 500);
  }

  const admin = await getAuthorizedAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!id || !["approve", "reject", "hide"].includes(action)) {
    return json({ error: "Valid therapist id and action are required." }, 400);
  }
  if (action === "reject" && !reason) {
    return json({ error: "A rejection reason is required." }, 400);
  }

  const update =
    action === "approve"
      ? {
          approval_status: "approved",
          is_active: true,
          availability_status: "Available",
          approved_at: new Date().toISOString(),
          approved_by: admin.id,
          admin_notes: reason || null,
        }
      : action === "hide"
        ? {
            is_active: false,
            availability_status: "Hidden by admin",
            admin_notes: reason || null,
          }
        : {
            approval_status: "rejected",
            is_active: false,
            availability_status: "Rejected by admin",
            admin_notes: reason,
          };

  const stateFilter =
    action === "hide"
      ? "approval_status=eq.approved&is_active=eq.true"
      : "approval_status=eq.pending";

  const response = await fetch(`${SUPABASE_URL}/rest/v1/therapists?id=eq.${encodeURIComponent(id)}&${stateFilter}`, {
    method: "PATCH",
    headers: serviceHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(update),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update therapist profile." }, response.status);
  }

  const therapist = Array.isArray(result) ? result[0] : result;
  if (!therapist) {
    return json({ error: "The therapist profile changed or this action is no longer allowed. Refresh and try again." }, 409);
  }

  await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_logs`, {
    method: "POST",
    headers: serviceHeaders({ prefer: "return=minimal" }),
    body: JSON.stringify({
      actor_id: admin.id,
      action: `therapist.${action}`,
      entity_table: "therapists",
      entity_id: id,
      metadata: { reason: reason || null },
    }),
  }).catch(() => undefined);

  return json({ therapist });
}
