const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_READ_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  image_url?: string;
  published_at?: string;
};

export const fallbackPosts: BlogPost[] = [
  {
    id: "family-counselling-divorce-pakistan",
    slug: "family-counselling-divorce-rate-pakistan",
    title: "Divorce in Pakistan: how family counselling can help",
    excerpt:
      "What Pakistan’s latest official divorce figures actually show—and how family counsellors can help couples communicate, make safer decisions, and protect family wellbeing.",
    body: `Conversations about divorce in Pakistan are often filled with alarming headlines, but the clearest nationwide picture comes from the Pakistan Bureau of Statistics (PBS). Understanding that data—and what it does not measure—can help families respond with care instead of fear or blame.

**What is the current divorce ratio in Pakistan?**

Pakistan’s 2023 Population and Housing Census recorded 499,017 divorced people among 142,924,350 people aged 15 and above. That is about 0.35% of the population in this age group. The census also recorded 210,895 people as separated, roughly 0.15%.

Among women aged 15 and above, 0.48% were recorded as divorced and 0.16% as separated. Among men, the figures were 0.23% divorced and 0.13% separated. Punjab had the highest provincial share recorded as divorced at 0.47%, followed by Sindh at 0.28%, Islamabad at 0.27%, Khyber Pakhtunkhwa at 0.12%, and Balochistan at 0.11%.

These are population shares, not the percentage of marriages that end in divorce each year. They also describe marital status at the time of the census—not every divorce that has ever occurred. For that reason, claims such as “one in three marriages ends in divorce in Pakistan” should not be treated as a national fact unless they are supported by a clear, representative dataset.

**Why the numbers need context**

Official figures can understate the full experience of marital breakdown. Some couples live apart without a formal divorce, some cases are not registered consistently, and social stigma can affect reporting. Court filings reported in individual cities may show local pressure on families, but they cannot be converted into a national divorce rate.

The most responsible conclusion is simple: divorce is still a small recorded share of Pakistan’s adult population, while many couples and families are experiencing serious conflict, separation, financial stress, and emotional strain that deserve timely support.

**When should a couple consider family counselling?**

Family or marriage counselling can be useful before conflict reaches a breaking point, and it can also support families who have already decided to separate. Consider speaking with a qualified counsellor when you notice:

- The same argument repeats without resolution
- Communication has become hostile, silent, or unsafe
- Trust has been damaged by secrecy, betrayal, or broken promises
- Financial pressure or extended-family boundaries are creating constant tension
- Parenting disagreements are affecting children
- One or both partners feel emotionally disconnected
- A major transition, loss, illness, or relocation has changed the relationship

**How family counsellors can help**

A family counsellor provides a structured, neutral space where each person can speak and listen more safely. Counselling is not about deciding who is “right,” and it does not guarantee reconciliation. Its purpose is to help people understand patterns, make informed choices, and reduce harm.

1. Slow down escalating conversations and establish respectful ground rules.
2. Identify the emotions and unmet needs underneath repeated arguments.
3. Teach practical communication, listening, and problem-solving skills.
4. Help couples set healthier boundaries with relatives, work, money, and technology.
5. Support cooperative parenting so children are not placed in the middle of adult conflict.
6. Explore whether rebuilding the relationship is safe and realistic.
7. If separation is chosen, support a calmer transition and clearer co-parenting plan.

**What family counselling should never do**

Counselling should not pressure someone to remain in an abusive or dangerous relationship. When there is violence, coercive control, stalking, threats, or fear for personal safety, individual safety planning and specialist support should come first. Joint sessions may not be appropriate.

**How to choose a family counsellor in Pakistan**

- Check the counsellor’s qualifications and experience with couples or family systems
- Ask which languages they offer and whether sessions are online or in person
- Discuss confidentiality, fees, session length, and cancellation rules before starting
- Look for a counsellor who remains neutral and explains their approach clearly
- Expect an initial assessment before goals and a session plan are agreed

Online family counselling can make support more accessible for couples living in different cities, Pakistanis overseas, or families who need greater privacy. A stable connection and a private room help sessions work better.

**A constructive next step**

You do not have to wait until divorce feels inevitable. Early counselling can help a couple understand whether the relationship can be repaired and what both people would need to change. If the marriage cannot or should not continue, counselling can still help family members move forward with greater clarity, dignity, and care for children.

Data note: Figures in this article are calculated from Pakistan Bureau of Statistics, Population and Housing Census 2023, Table 6: Population (15 Years and Above) by Sex, Age Group, Marital Status and Rural/Urban.`,
    image_url: "/blog/family-counselling-divorce-pakistan.webp",
    published_at: "2026-11-03T00:00:00.000Z",
  },
  {
    id: "sample-blog-sleep",
    slug: "sleep-and-stress",
    title: "When stress starts showing up in your sleep",
    excerpt: "Small signs that your nervous system may need steadier support, and what to discuss in therapy.",
    body: `Stress often shows up in the body before we can name it clearly. Sleep is one of the first places people notice that something needs attention.

**Signs stress may be affecting sleep**
- Trouble falling asleep even when you feel tired
- Waking frequently or waking too early
- Restless sleep, vivid dreams, or waking unrefreshed
- Racing thoughts at bedtime or during the night

**What can help before therapy**
- Keep wake and sleep times as steady as possible
- Reduce screens and heavy conversations right before bed
- Use one short calming routine you repeat each night
- Notice whether caffeine, workload, or conflict is spiking late in the day

**When therapy may be useful**
If sleep disruption continues for weeks, starts affecting mood or focus, or comes with persistent worry or panic, a therapist can help you map triggers and build a steadier plan. At MindEase, sessions are fully online and matched to your language, concern, and schedule.`,
    image_url:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=900&h=540",
    published_at: "2026-08-15T00:00:00.000Z",
  },
  {
    id: "sample-blog-first-session",
    slug: "first-therapy-session",
    title: "What happens in a first therapy session?",
    excerpt: "A simple overview of intake, confidentiality, goals, and how matching decisions are made.",
    body: `A first therapy session can feel uncertain if you have never done it before. Online sessions follow the same core steps, with a little extra attention to privacy and connection.

**Before the session**
- You share your concern, language preference, and timing with the care coordinator
- MindEase suggests therapists whose focus, fee, and availability fit your situation
- You receive session details, including how to join by video and what to prepare

**What usually happens in session one**
1. The therapist explains confidentiality and how online sessions work
2. You describe what brought you in and what you hope might change
3. The therapist asks clarifying questions about history, stressors, and current support
4. You agree on an initial focus for the next few sessions

**What you do not need to have ready**
You do not need a perfect explanation, a diagnosis, or a long story prepared. Many people begin with one sentence about what feels hardest right now.

**After the first session**
If the fit feels right, you can book follow-ups through the same care contact. If not, MindEase can suggest another therapist without you needing to start from scratch.`,
    image_url:
      "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&q=80&w=900&h=540",
    published_at: "2026-08-22T00:00:00.000Z",
  },
  {
    id: "sample-blog-family-therapy-online",
    slug: "family-therapy-online-eft-approach",
    title: "Family therapy online: how an EFT-informed approach works",
    excerpt:
      "How couples and families work through conflict, trust, and communication patterns in secure video sessions—with structured EFT-informed support and clear care coordination.",
    body: `Family therapy can help when communication breaks down, trust feels fragile, or the same arguments keep returning. At MindEase, this work happens fully online through secure video sessions.

**What family therapy focuses on**
- Recurring conflict, distance, or emotional disconnection
- Parenting stress, academic pressure, or family transitions
- Rebuilding trust after hurt, betrayal, or major life change
- Creating clearer boundaries and safer ways to talk

**An EFT-informed approach**
Emotionally Focused Therapy (EFT) looks at the emotional patterns beneath arguments. Instead of only solving the latest disagreement, therapy helps family members understand what each person is needing, fearing, or trying to protect. That often makes conversations feel less blaming and more workable.

**How online sessions work at MindEase**
1. You share your concern privately with the care coordinator.
2. We match you with a therapist whose focus, language, and fee fit your situation.
3. Sessions take place by video, with guidance on privacy, timing, and who joins each session.
4. Follow-ups and rescheduling stay simple through one care contact.

Online family therapy can work well when everyone has a private space, a stable connection, and clear expectations before the session begins. If you are unsure whether family therapy is the right next step, you can also start with a self-check or send a short message to the care coordinator.`,
    image_url:
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&q=80&w=900&h=540",
    published_at: "2026-09-02T00:00:00.000Z",
  },
];

function mergeBlogPosts(dbPosts: BlogPost[]) {
  const seen = new Set<string>();
  const merged: BlogPost[] = [];

  for (const post of dbPosts) {
    if (seen.has(post.slug)) continue;
    seen.add(post.slug);
    merged.push(post);
  }

  for (const post of fallbackPosts) {
    if (seen.has(post.slug)) continue;
    seen.add(post.slug);
    merged.push(post);
  }

  return merged
    .sort((a, b) => {
      const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);
}

function enrichPost(post: BlogPost): BlogPost {
  const fallback = fallbackPosts.find((item) => item.slug === post.slug);

  return {
    ...fallback,
    ...post,
    body: post.body?.trim() || fallback?.body || post.excerpt || "",
  };
}

async function fetchPublishedPosts(limit = "10") {
  if (!PUBLIC_READ_KEY) return [];

  const query = new URLSearchParams({
    select: "id,title,slug,excerpt,body,image_url,published_at",
    status: "eq.published",
    order: "published_at.desc",
    limit,
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query}`, {
    headers: {
      apikey: PUBLIC_READ_KEY,
      authorization: `Bearer ${PUBLIC_READ_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return (await response.json()) as BlogPost[];
}

export async function getPublishedBlogPosts() {
  try {
    const posts = await fetchPublishedPosts();
    return mergeBlogPosts(posts);
  } catch {
    return mergeBlogPosts([]);
  }
}

export async function getBlogPostBySlug(slug: string) {
  const fallback = fallbackPosts.find((post) => post.slug === slug);

  try {
    if (PUBLIC_READ_KEY) {
      const query = new URLSearchParams({
        select: "id,title,slug,excerpt,body,image_url,published_at",
        slug: `eq.${slug}`,
        status: "eq.published",
        limit: "1",
      });

      const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query}`, {
        headers: {
          apikey: PUBLIC_READ_KEY,
          authorization: `Bearer ${PUBLIC_READ_KEY}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const posts = (await response.json()) as BlogPost[];
        if (posts[0]) return enrichPost(posts[0]);
      }
    }
  } catch {
    // Fall back to built-in article content below.
  }

  return fallback ? enrichPost(fallback) : null;
}
