const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_ADMIN_USER_IDS = ["1bcf8cbe-9716-4cde-91d8-3cb9f0c4fafe"];
const ADMIN_USER_IDS = [
  ...DEFAULT_ADMIN_USER_IDS,
  ...(process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
];

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

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

async function getUser(token: string) {
  if (!SUPABASE_ANON_KEY) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

async function isAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const user = await getUser(token);
  if (!user) return false;

  const metadataRole =
    user.app_metadata?.role ?? user.user_metadata?.role ?? user.app_metadata?.user_role;

  return metadataRole === "admin" || ADMIN_USER_IDS.includes(user.id);
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

  if (!(await isAdmin(request))) {
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

  if (!(await isAdmin(request))) {
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

  const response = await fetch(`${SUPABASE_URL}/rest/v1/therapists?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: serviceHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(update),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update therapist profile." }, response.status);
  }

  return json({ therapist: Array.isArray(result) ? result[0] : result });
}
