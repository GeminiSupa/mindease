import {
  json,
  requireAdmin,
  serviceFetch,
  serviceHeaders,
  slugify,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  writeAuditLog,
} from "../../_utils/mindease";

type AuthUserResponse = { id?: string; user?: { id?: string }; message?: string };

async function createTherapistAuthUser(email: string, password: string, fullName: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
      app_metadata: {
        role: "therapist",
      },
    }),
  });
  const result = (await response.json()) as AuthUserResponse;

  if (!response.ok) {
    throw new Error(result?.message ?? "Could not create therapist login.");
  }

  return result.user?.id ?? result.id ?? "";
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to create therapists." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = await request.json();
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName) {
    return json({ error: "Therapist name is required." }, 400);
  }

  if (!email || !password) {
    return json({ error: "Therapist login email and temporary password are required." }, 400);
  }

  if (password.length < 8) {
    return json({ error: "Temporary password must be at least 8 characters." }, 400);
  }

  let userId = "";
  try {
    userId = await createTherapistAuthUser(email, password, fullName);

    const profileResponse = await serviceFetch("/rest/v1/profiles", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: userId,
        full_name: fullName,
        email,
        role: "therapist",
      }),
    });

    if (!profileResponse.ok) {
      const result = await profileResponse.json();
      throw new Error(result?.message ?? "Therapist login was created, but profile setup failed.");
    }

    await writeAuditLog({
      actorId: admin.id,
      action: "therapist_credentials_created",
      subjectTable: "profiles",
      subjectId: userId,
      details: { email, fullName },
    });

    const baseSlug = slugify(fullName) || crypto.randomUUID();
    const profileImageUrl =
      typeof body.profileImageUrl === "string" &&
      body.profileImageUrl.includes("/storage/v1/object/public/mindease-media/therapists/")
        ? body.profileImageUrl.trim()
        : "";

    const payload = {
      user_id: userId || null,
      slug: userId ? `${baseSlug}-${userId.slice(0, 6)}` : `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`,
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
      profile_image_url: profileImageUrl,
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

    const response = await serviceFetch("/rest/v1/therapists", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message ?? "Could not create therapist profile.");
    }

    const therapist = Array.isArray(result) ? result[0] : result;
    await writeAuditLog({
      actorId: admin.id,
      action: "therapist_profile_created",
      subjectTable: "therapists",
      subjectId: therapist?.id,
      details: { credentialsCreated: Boolean(userId), fullName },
    });

    return json(
      {
        therapist,
        credentialsCreated: true,
        loginUrl: "/therapist/login",
      },
      201,
    );
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not create therapist." }, 500);
  }
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update therapists." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!id || !["approve", "reject", "hide"].includes(action)) {
    return json({ error: "Valid therapist id and action are required." }, 400);
  }

  const update =
    action === "approve"
      ? {
          approval_status: "approved",
          is_active: true,
          availability_status: "Available",
          approved_at: new Date().toISOString(),
          approved_by: admin.id,
        }
      : action === "hide"
        ? {
            is_active: false,
            availability_status: "Hidden by admin",
          }
        : {
            approval_status: "rejected",
            is_active: false,
            availability_status: "Rejected by admin",
          };

  const response = await serviceFetch(`/rest/v1/therapists?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(update),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update therapist profile." }, response.status);
  }

  await writeAuditLog({
    actorId: admin.id,
    action: `therapist_${action}`,
    subjectTable: "therapists",
    subjectId: id,
    details: update,
  });

  return json({ therapist: Array.isArray(result) ? result[0] : result });
}
