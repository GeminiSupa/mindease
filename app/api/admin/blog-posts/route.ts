import {
  json,
  requireAdmin,
  serviceFetch,
  slugify,
  SUPABASE_SERVICE_ROLE_KEY,
  writeAuditLog,
} from "../../_utils/mindease";

function blogPayload(body: Record<string, unknown>, authorId: string) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : slugify(title);
  const status = body.status === "published" ? "published" : "draft";
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.includes("/storage/v1/object/public/mindease-media/")
      ? body.imageUrl.trim()
      : "";

  return {
    title,
    slug: slug || crypto.randomUUID(),
    excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
    body: typeof body.body === "string" ? body.body.trim() : "",
    image_url: imageUrl,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    author_id: authorId,
  };
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to create blog posts." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const payload = blogPayload(body, admin.id);

  if (!payload.title) {
    return json({ error: "Post title is required." }, 400);
  }

  const response = await serviceFetch("/rest/v1/blog_posts", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not create blog post." }, response.status);
  }

  const post = Array.isArray(result) ? result[0] : result;
  await writeAuditLog({
    actorId: admin.id,
    action: payload.status === "published" ? "blog_post_created_published" : "blog_post_created_draft",
    subjectTable: "blog_posts",
    subjectId: post?.id,
    details: { title: payload.title, slug: payload.slug, hasImage: Boolean(payload.image_url) },
  });

  return json({ post }, 201);
}

export async function PATCH(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to update blog posts." }, 500);
  }

  const admin = await requireAdmin(request);
  if (!admin) {
    return json({ error: "Admin access required." }, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (!id) {
    return json({ error: "Post id is required." }, 400);
  }

  const payload =
    action === "publish"
      ? { status: "published", published_at: new Date().toISOString() }
      : action === "draft"
        ? { status: "draft", published_at: null }
        : blogPayload(body, admin.id);

  const response = await serviceFetch(
    `/rest/v1/blog_posts?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    return json({ error: result?.message ?? "Could not update blog post." }, response.status);
  }

  await writeAuditLog({
    actorId: admin.id,
    action: action === "publish" ? "blog_post_published" : action === "draft" ? "blog_post_unpublished" : "blog_post_updated",
    subjectTable: "blog_posts",
    subjectId: id,
    details: payload,
  });

  return json({ post: Array.isArray(result) ? result[0] : result });
}
