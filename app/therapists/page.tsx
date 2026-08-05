import Image from "next/image";
import Link from "next/link";
import { getPublicContactSettings } from "../site-settings";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type LiveTherapist = {
  id: string;
  full_name: string;
  title: string;
  qualifications?: string;
  years_experience?: number;
  bio?: string;
  specialization?: string;
  languages?: string[];
  session_fee?: number;
  currency?: string;
  availability_status?: string;
  profile_image_url?: string;
};

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

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function splitFocus(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

async function getApprovedTherapists() {
  if (!SUPABASE_ANON_KEY) return DEMO_MODE ? fallbackTherapists : [];

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
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 60 },
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
    <main>
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
          <a className="nav-cta" href={whatsappHref}>Ask for match</a>
        </nav>
        <div className="directory-copy">
          <span className="eyebrow">Admin-approved profiles</span>
          <h1>Choose with context, then confirm availability with the coordinator.</h1>
          <p>
            Public cards show live approved therapist information. If a preferred therapist is not available,
            the admin workflow can suggest alternatives before a booking is confirmed.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="therapist-grid directory-grid">
          {therapists.map((therapist) => {
            const focus = splitFocus(therapist.specialization);
            return (
              <article className="therapist-card directory-card" key={therapist.id}>
                <div className="therapist-top">
                  {therapist.profile_image_url ? (
                    <img className="therapist-photo" src={therapist.profile_image_url} alt={therapist.full_name} />
                  ) : (
                    <div className="avatar" aria-hidden="true">{initials(therapist.full_name)}</div>
                  )}
                  <div>
                    <h3>{therapist.full_name}</h3>
                    <p>{therapist.title}</p>
                    <small>{therapist.qualifications}</small>
                  </div>
                </div>
                <p>{therapist.bio}</p>
                <div className="pill-row">
                  {(focus.length ? focus : ["Online therapy"]).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <dl className="therapist-meta">
                  <div>
                    <dt>Experience</dt>
                    <dd>{therapist.years_experience ? `${therapist.years_experience}+ years` : "Reviewed profile"}</dd>
                  </div>
                  <div>
                    <dt>Languages</dt>
                    <dd>{therapist.languages?.join(", ") || "Urdu, English"}</dd>
                  </div>
                  <div>
                    <dt>Availability</dt>
                    <dd>{therapist.availability_status || "Ask coordinator"}</dd>
                  </div>
                </dl>
                <div className="card-footer">
                  <div>
                    <span>Session fee</span>
                    <strong>
                      {therapist.session_fee
                        ? `${therapist.currency ?? "PKR"} ${therapist.session_fee.toLocaleString("en-PK")}`
                        : "Ask admin"}
                    </strong>
                  </div>
                  <a href={whatsappHref}>Ask about fit</a>
                </div>
              </article>
            );
          })}
        </div>
        {therapists.length === 0 ? (
          <div className="empty-state">
            <strong>No approved therapists are live yet.</strong>
            <p>Admin-approved therapist profiles will appear here after Supabase is configured.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
