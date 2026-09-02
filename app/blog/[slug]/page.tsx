import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "../posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function BlogBody({ body }: { body: string }) {
  const blocks = body.trim().split(/\n\n+/);

  return (
    <div className="blog-article-body">
      {blocks.map((block, index) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return <h2 key={index}>{trimmed.slice(2, -2)}</h2>;
        }

        const lines = trimmed.split("\n");

        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\d+\.\s/.test(line))) {
          return (
            <ol key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.replace(/^\d+\.\s/, "")}</li>
              ))}
            </ol>
          );
        }

        return <p key={index}>{trimmed}</p>;
      })}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Article not found | MindEase" };
  }

  return {
    title: `${post.title} | MindEase`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.image_url ? [{ url: post.image_url }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="blog-page" id="main-content">
      <section className="blog-hero">
        <nav className="site-nav" aria-label="Blog navigation">
          <Link className="brand" href="/">
            <Image
              src="/brand/mindease-app-icon.png"
              alt=""
              width={42}
              height={42}
              className="brand-icon"
            />
            <span>
              <strong>MindEase</strong>
              <small>Wellbeing journal</small>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/therapists">Therapists</Link>
            <Link href="/self-tests">Self-checks</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </nav>

        <div className="blog-article-shell">
          <Link className="blog-back-link" href="/#blog">
            Back to latest reads
          </Link>
          <span className="blog-article-date">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Wellbeing journal"}
          </span>
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="blog-article-excerpt">{post.excerpt}</p> : null}
        </div>
      </section>

      <section className="section blog-article-section">
        <article className="blog-article">
          <Image
            src={
              post.image_url ||
              "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=1200&h=720"
            }
            alt=""
            width={1200}
            height={720}
            className="blog-article-image"
            priority
            unoptimized
          />
          <BlogBody body={post.body ?? ""} />
          <div className="blog-article-actions">
            <Link className="primary-btn" href="/#contact">
              Talk to the care coordinator
            </Link>
            <Link className="ghost-btn" href="/self-tests">
              Try a self-check
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
