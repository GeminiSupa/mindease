import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicContactSettings } from "../site-settings";
import TherapistDirectory, { type TherapistProfile } from "./TherapistDirectory";

export const metadata: Metadata = {
  title: "Find a Therapist | MindEase",
  description: "Browse verified MindEase therapists by focus area and language, then ask our coordinator to help you choose.",
  openGraph: {
    title: "Find someone you can feel comfortable talking to | MindEase",
    description: "Browse verified therapists, compare fit, and ask for a personal match.",
    images: [{ url: "/therapists-og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find a therapist | MindEase",
    description: "Verified therapist profiles and personal matching support.",
    images: ["/therapists-og.png"],
  },
};

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_READ_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LiveTherapist = TherapistProfile;

const fallbackTherapists: LiveTherapist[] = [
  {
    id: "sample-ishrat",
    full_name: "Ishrat Noureen",
    title: "Clinical Psychologist",
    qualifications: "MS Clinical Psychology",
    years_experience: 6,
    specialization: "Anxiety, depression, relationship stress",
    languages: ["Urdu", "English"],
    session_fee: 4500,
    currency: "PKR",
    availability_status: "Evening slots by request",
    profile_image_url: "/team/ishrat-noureen.jpeg",
    bio: "A calm, structured therapy style for clients who want practical tools and reflective support.",
  },
  {
    id: "sample-aisha",
    full_name: "Aisha Rahman",
    title: "Counselling Psychologist",
    qualifications: "MPhil Psychology",
    years_experience: 5,
    specialization: "Stress, self-esteem, family transitions",
    languages: ["Urdu", "English", "Punjabi"],
    session_fee: 4000,
    currency: "PKR",
    availability_status: "Weekend intake available",
    profile_image_url:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=500&h=620",
    bio: "Focused on helping clients build steadier routines, boundaries, and emotional regulation.",
  },
  {
    id: "sample-hamza",
    full_name: "Hamza Ali",
    title: "Psychotherapist",
    qualifications: "Advanced Diploma in Counselling",
    years_experience: 7,
    specialization: "Burnout, sleep, life transitions",
    languages: ["Urdu", "English"],
    session_fee: 5000,
    currency: "PKR",
    availability_status: "Limited weekday mornings",
    profile_image_url:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=500&h=620",
    bio: "A collaborative approach for professionals and students managing overload and uncertainty.",
  },
];

async function getApprovedTherapists() {
  if (!PUBLIC_READ_KEY) return DEMO_MODE ? fallbackTherapists : [];

  const query = new URLSearchParams({
    select:
      "id,full_name,title,qualifications,years_experience,bio,specialization,languages,session_fee,currency,availability_status,profile_image_url",
    is_active: "eq.true",
    approval_status: "eq.approved",
    order: "is_featured.desc,created_at.desc",
    limit: "50",
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/therapists?${query}`, {
      headers: {
        apikey: PUBLIC_READ_KEY,
        authorization: `Bearer ${PUBLIC_READ_KEY}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return DEMO_MODE ? fallbackTherapists : [];
    const therapists = (await response.json()) as LiveTherapist[];
    return therapists.length ? therapists : DEMO_MODE ? fallbackTherapists : [];
  } catch {
    return DEMO_MODE ? fallbackTherapists : [];
  }
}

export default async function TherapistsPage() {
  const [therapists, contactSettings] = await Promise.all([
    getApprovedTherapists(),
    getPublicContactSettings(),
  ]);
  const whatsappHref = `https://wa.me/${contactSettings.whatsappNumber}?text=${encodeURIComponent(
    "Hello MindEase, I would like help choosing a therapist.",
  )}`;

  return (
    <main className="directory-page">
      <section className="directory-hero">
        <nav className="site-nav" aria-label="Therapist directory navigation">
          <Link className="brand" href="/">
            <Image src="/brand/mindease-app-icon.png" alt="" width={42} height={42} className="brand-icon" />
            <span>
              <strong>MindEase</strong>
              <small>Therapist Directory</small>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/self-tests">Self-checks</Link>
            <Link href="/therapist/login">Therapist portal</Link>
          </div>
          <a className="nav-cta" href={whatsappHref} target="_blank" rel="noreferrer">Get matched</a>
        </nav>
        <div className="directory-hero-layout">
          <div className="directory-copy">
            <span className="eyebrow">Verified online therapists</span>
            <h1>Find someone you can feel comfortable talking to.</h1>
            <p>
              Browse by the things that matter to you. Compare experience, focus areas, language, and fee—then ask
              our care coordinator to confirm the right fit.
            </p>
            <div className="directory-hero-actions">
              <a className="directory-primary" href="#browse">Browse therapists</a>
              <a className="directory-secondary" href={whatsappHref} target="_blank" rel="noreferrer">Help me choose</a>
            </div>
            <div className="directory-trust" aria-label="Directory assurances">
              <span><i aria-hidden="true" /> Admin-reviewed profiles</span>
              <span><i aria-hidden="true" /> Private inquiry</span>
              <span><i aria-hidden="true" /> No booking pressure</span>
            </div>
          </div>
          <aside className="directory-match-card" aria-label="How therapist matching works">
            <div className="directory-match-head">
              <span>Not sure where to begin?</span>
              <strong>A better match starts with a few simple details.</strong>
            </div>
            <ol>
              <li><span>1</span><div><strong>Browse at your pace</strong><small>Use filters or open any full profile.</small></div></li>
              <li><span>2</span><div><strong>Tell us what matters</strong><small>Share only what you feel comfortable sharing.</small></div></li>
              <li><span>3</span><div><strong>Confirm the fit</strong><small>We check availability before you decide.</small></div></li>
            </ol>
            <a href={whatsappHref} target="_blank" rel="noreferrer">Ask the care coordinator <span aria-hidden="true">→</span></a>
          </aside>
        </div>
      </section>

      {therapists.length ? (
        <TherapistDirectory therapists={therapists} whatsappNumber={contactSettings.whatsappNumber} />
      ) : (
        <section className="directory-workspace">
          <div className="empty-state">
            <strong>No approved therapists are live yet.</strong>
            <p>Ask the care coordinator for the latest available options.</p>
            <a className="directory-primary" href={whatsappHref}>Ask for a match</a>
          </div>
        </section>
      )}

      <a className="directory-floating-match" href={whatsappHref} target="_blank" rel="noreferrer">
        <span aria-hidden="true">✦</span>
        <span><small>Not sure who to choose?</small><strong>Get a personal match</strong></span>
        <b aria-hidden="true">→</b>
      </a>
    </main>
  );
}
