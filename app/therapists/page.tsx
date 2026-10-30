import Link from "next/link";
import TherapistDirectory, { TherapistProfile } from "./TherapistDirectory";
import { getPublicContactSettings } from "../site-settings";

const fallbackTherapists: TherapistProfile[] = [
  {
    id: "sample-emily",
    full_name: "Dr. Emily Parker",
    title: "Couples Therapist",
    qualifications: "MPhil Psychology",
    years_experience: 11,
    bio: "Dedicated to fostering healthy communication and intimacy in relationships. Specialises in couples and family work.",
    specialization: "Couples, Communication, Family",
    languages: ["English", "Urdu"],
    session_fee: 5500,
    currency: "PKR",
    availability_status: "Available",
    profile_image_url:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400",
    rating: 4.8,
    review_count: 12,
    country_of_origin: "Pakistan",
    country_code: "PK",
  },
];

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_READ_KEY = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getApprovedTherapists(): Promise<TherapistProfile[]> {
  if (!PUBLIC_READ_KEY) return fallbackTherapists;

  try {
    const fields = "id,full_name,title,qualifications,years_experience,bio,specialization,languages,session_fee,currency,availability_status,profile_image_url,rating,review_count";
    const load = (select: string) => {
      const query = new URLSearchParams({ select, is_active: "eq.true", approval_status: "eq.approved", order: "is_featured.desc,created_at.desc", limit: "50" });
      return fetch(`${SUPABASE_URL}/rest/v1/therapists?${query}`, { headers: { apikey: PUBLIC_READ_KEY, authorization: `Bearer ${PUBLIC_READ_KEY}` }, cache: "no-store" });
    };
    let response = await load(`${fields},country_of_origin,country_code`);
    if (!response.ok) response = await load(fields);

    if (!response.ok) return fallbackTherapists;
    const therapists = (await response.json()) as TherapistProfile[];
    return therapists.length ? therapists : fallbackTherapists;
  } catch {
    return fallbackTherapists;
  }
}

export default async function TherapistsDirectoryPage() {
  const [therapists, contactSettings] = await Promise.all([
    getApprovedTherapists(),
    getPublicContactSettings(),
  ]);

  const whatsappNumber = contactSettings.whatsappNumber ?? "";

  return (
    <main className="dir-page" id="main-content">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="dir-nav site-nav" aria-label="MindEase navigation">
        <Link className="brand" href="/">
          <span>
            <strong>MindEase</strong>
            <small>Online Therapy</small>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/self-tests">Self-checks</Link>
          <Link href="/therapist/login">Therapist Portal</Link>
        </div>
        <Link className="nav-cta" href="/#contact">Get Matched</Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="dir-hero">
        <div className="dir-hero-inner" data-animate="fade-up">
          <span className="eyebrow">Online Mental Health Platform</span>
          <h1>Find Your Specialist</h1>
          <p>
            Browse verified psychiatrists, psychologists, and therapists.
            Book a confidential online session in minutes.
          </p>
          <div className="dir-hero-pills">
            <span>✓ Verified profiles</span>
            <span>✓ Online sessions</span>
            <span>✓ No commitment</span>
          </div>
        </div>
      </div>

      {/* ── Stats band ──────────────────────────────────────────── */}
      <div className="dir-stats-band">
        <div data-animate="fade-up"><strong>{therapists.length}+</strong><span>Verified Specialists</span></div>
        <div data-animate="fade-up" data-delay="100"><strong>4</strong><span>Matching Factors</span></div>
        <div data-animate="fade-up" data-delay="200"><strong>100%</strong><span>Online Sessions</span></div>
        <div data-animate="fade-up" data-delay="300"><strong>1:1</strong><span>Coordinator Support</span></div>
      </div>

      {/* ── Directory ───────────────────────────────────────────── */}
      <div className="dir-body">
        <TherapistDirectory therapists={therapists} whatsappNumber={whatsappNumber} />
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="dir-footer">
        <strong>MindEase Online Clinic</strong>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/self-tests">Self-checks</Link>
          <Link href="/therapists/join">Join the network</Link>
          <Link href="/therapist/login">Therapist portal</Link>
        </nav>
        <p>© {new Date().getFullYear()} MindEase. All rights reserved.</p>
      </footer>
    </main>
  );
}
