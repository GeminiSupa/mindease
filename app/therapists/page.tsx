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
    availability_status: "Limited weekday mornings",
    profile_image_url:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400",
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

    if (!response.ok) return [];
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
    <main className="directory-page" id="main-content">
      <section className="directory-hero">
        <nav className="site-nav" aria-label="Therapist directory navigation">
          <Link className="brand" href="/">
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
          <Link className="nav-cta" href="/#contact">Get matched</Link>
        </nav>

        <div className="directory-hero-layout">
          <div className="directory-copy">
            <span className="eyebrow">Verified online therapists</span>
            <h1>Find someone you can feel comfortable talking to.</h1>
            <p>Browse by the things that matter to you — experience, focus areas, language, and fee — then ask our care coordinator to confirm the right fit.</p>
            <div className="directory-hero-actions">
              <a className="directory-primary" href="#browse">Browse therapists</a>
              <a className="directory-secondary" href="/#contact">Help me choose</a>
            </div>
            <div className="directory-trust" aria-label="Directory assurances">
              <span>Admin-reviewed profiles</span>
              <span>Private inquiry</span>
              <span>No booking pressure</span>
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
            <a href="/#contact">Ask the care coordinator <span aria-hidden="true">→</span></a>
          </aside>
        </div>
      </section>

      {therapists.length === 0 ? (
        <section className="section" id="browse">
          <div className="inline-heading section-heading">
            <div>
              <span>Our therapists</span>
              <h2>Meet our verified therapists</h2>
            </div>
            <Link className="text-link" href="/therapists/join">Join the network →</Link>
          </div>
          <div className="empty-state">
            <strong>No therapist profiles are available right now.</strong>
            <p>Message the care coordinator and we will help you find a suitable option.</p>
            <a className="primary-btn" href="/#contact">Contact the clinic</a>
          </div>
        </section>
      ) : (
        <TherapistDirectory therapists={therapists} whatsappNumber={whatsappNumber} />
      )}

      <footer className="simple-footer" aria-label="MindEase links">
        <strong>MindEase Online Clinic</strong>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/self-tests">Self-checks</Link>
          <Link href="/therapists/join">Join the network</Link>
          <Link href="/therapist/login">Therapist portal</Link>
        </nav>
      </footer>
    </main>
  );
}
