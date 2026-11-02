import type { MetadataRoute } from "next";
import { getPublishedBlogPosts } from "./blog/posts";
import { SITE_URL } from "./seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedBlogPosts();
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/therapists`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/self-tests`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/self-tests/listing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/therapists/join`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

