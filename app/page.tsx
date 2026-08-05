import Image from "next/image";
import { getPublicContactSettings, phoneHref } from "./site-settings";

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

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  image_url?: string;
  published_at?: string;
};

const services = [
  {
    title: "Anxiety & panic",
    description: "Structured therapy for worry, panic attacks, fears, and overthinking.",
    assessment: "anxiety-patterns",
    check: "Check anxiety patterns",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=85&w=900&h=620",
  },
  {
    title: "Depression",
    description: "Support for low mood, motivation, sleep, energy, and daily functioning.",
    assessment: "low-mood-functioning",
    check: "Check mood and functioning",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=85&w=900&h=620",
  },
  {
    title: "Relationship issues",
    description: "Individual, couple, and family counselling for conflict and trust.",
    assessment: "relationship-adjustment",
    check: "Check relationship adjustment",
    image: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=85&w=900&h=620",
  },
  {
    title: "Stress & burnout",
    description: "Practical support for professionals, students, caregivers, and parents.",
    assessment: "stress-load",
    check: "Check current stress load",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=85&w=900&h=620",
  },
  {
    title: "Trauma & grief",
    description: "Confidential care for loss, adjustment, traumatic stress, and transitions.",
    assessment: "grounding-recovery",
    check: "Check grounding and recovery",
    image: "https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&q=85&w=900&h=620",
  },
  {
    title: "Child & family",
    description: "Parent guidance, child concerns, academic stress, and family therapy.",
    assessment: "family-support",
    check: "Check family support patterns",
    image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&q=85&w=900&h=620",
  },
];

const journey = [
  ["Reach out", "Message us on WhatsApp or send a private inquiry with your concern and preferred timing."],
  ["Get matched", "The coordinator checks therapist focus, language, fee, and availability before suggesting options."],
  ["Confirm slot", "Choose the therapist and slot that fits, then receive payment and session instructions."],
  ["Continue care", "Follow-ups, rescheduling, and availability changes stay coordinated through the clinic workflow."],
];

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

const fallbackPosts: BlogPost[] = [
  {
    id: "sample-blog-sleep",
    slug: "sleep-and-stress",
    title: "When stress starts showing up in your sleep",
    excerpt: "Small signs that your nervous system may need steadier support, and what to discuss in therapy.",
    image_url:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=900&h=540",
  },
  {
    id: "sample-blog-first-session",
    slug: "first-therapy-session",
    title: "What happens in a first therapy session?",
    excerpt: "A simple overview of intake, confidentiality, goals, and how matching decisions are made.",
    image_url:
      "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&q=80&w=900&h=540",
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
    .slice(0, 3);
}

async function getApprovedTherapists() {
  if (!SUPABASE_ANON_KEY) return DEMO_MODE ? fallbackTherapists : [];

  const query = new URLSearchParams({
    select:
      "id,full_name,title,qualifications,years_experience,bio,specialization,languages,session_fee,currency,availability_status,profile_image_url",
    is_active: "eq.true",
    approval_status: "eq.approved",
    order: "is_featured.desc,created_at.desc",
    limit: "12",
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

async function getPublishedBlogPosts() {
  if (!SUPABASE_ANON_KEY) return DEMO_MODE ? fallbackPosts : [];

  const query = new URLSearchParams({
    select: "id,title,slug,excerpt,image_url,published_at",
    status: "eq.published",
    order: "published_at.desc",
    limit: "3",
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 120 },
    });

    if (!response.ok) return DEMO_MODE ? fallbackPosts : [];
    const posts = (await response.json()) as BlogPost[];
    return posts.length ? posts : DEMO_MODE ? fallbackPosts : [];
  } catch {
    return DEMO_MODE ? fallbackPosts : [];
  }
}

export default async function Home() {
  const [therapists, posts, contactSettings] = await Promise.all([
    getApprovedTherapists(),
    getPublishedBlogPosts(),
    getPublicContactSettings(),
  ]);
  const featuredTherapists = therapists.slice(0, 3);
  const whatsappHref = `https://wa.me/${contactSettings.whatsappNumber}?text=${encodeURIComponent(
    "Hello MindEase, I would like help finding a therapist.",
  )}`;
  const callHref = phoneHref(contactSettings.displayPhone);

  return (
    <main>
      <section className="hero-shell therapy-hero" id="top">
        <nav className="site-nav" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="MindEase Online Clinic home">
            <Image
              src="/brand/mindease-app-icon.png"
              alt=""
              width={42}
              height={42}
              className="brand-icon"
              priority
            />
            <span>
              <strong>MindEase</strong>
              <small>Online Clinic</small>
            </span>
          </a>

          <div className="nav-links">
            <a href="/therapists">Therapists</a>
            <a href="/self-tests">Self-checks</a>
            <a href="#services">Care areas</a>
            <a href="#blog">Blog</a>
            <a href="#contact">Contact</a>
            <a href="/admin">Admin</a>
          </div>

          <a className="nav-cta" href={whatsappHref}>WhatsApp</a>
        </nav>

        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Confidential online therapy coordination</p>
            <h1>Find a therapist who fits your concern, language, and schedule.</h1>
            <p className="hero-lede">
              MindEase helps clients in Pakistan compare qualified practitioners, ask questions privately,
              and get matched with a suitable therapist before booking an online session.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href={whatsappHref}>Message on WhatsApp</a>
              <a className="ghost-btn" href="/therapists">View therapist directory</a>
            </div>
            <div className="trust-row" aria-label="MindEase trust highlights">
              <span>Admin-reviewed profiles</span>
              <span>Private intake</span>
              <span>Temporary email only</span>
            </div>
          </div>

          <aside className="booking-widget" id="booking" aria-label="Find a therapist">
            <div className="widget-head">
              <div>
                <span>Care coordinator</span>
                <strong>Request a therapist match</strong>
              </div>
              <p>WhatsApp is the fastest contact route</p>
            </div>

            <form className="search-form" aria-label="Quick booking form" action="/api/contact" method="post">
              <label>
                Full name
                <input name="name" placeholder="Your name" required />
              </label>
              <label>
                WhatsApp or phone
                <input name="contact" placeholder="+92 300 1234567" required />
              </label>
              <label>
                Preferred language
                <select name="preferredLanguage" defaultValue="Urdu">
                  <option>Urdu</option>
                  <option>English</option>
                  <option>Punjabi</option>
                  <option>Sindhi</option>
                  <option>Pashto</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Preferred time
                <input name="preferredTime" placeholder="Evening, weekend, or flexible" />
              </label>
              <label className="wide-field">
                What would you like help with?
                <textarea
                  name="message"
                  placeholder="Share your concern, preferred language, timing, and therapist preference."
                  required
                />
              </label>
              <label className="wide-field consent-check">
                <input name="consent" type="checkbox" required />
                <span>
                  I understand MindEase is not an emergency service. This form is for clinic coordination,
                  and my contact details may be used to respond to this inquiry.
                </span>
              </label>
              <button type="submit">Send private inquiry</button>
            </form>

            <div className="quick-slots" aria-label="Contact options">
              <a href={whatsappHref}>WhatsApp {contactSettings.displayPhone}</a>
              <a href={callHref}>Call {contactSettings.displayPhone}</a>
              {contactSettings.emailIsPlaceholder ? (
                <span>{contactSettings.contactEmail} temporary placeholder</span>
              ) : (
                <a href={`mailto:${contactSettings.contactEmail}`}>Email {contactSettings.contactEmail}</a>
              )}
            </div>
          </aside>

          <aside className="hero-media" aria-label="Calm therapy consultation setting">
            <img
              src="https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&q=80&w=900&h=1100"
              alt="Therapist consultation in a calm office setting"
            />
            <div className="clinician-badge">
              <span>Matching first</span>
              <strong>Therapist unavailable?</strong>
              <p>Admin can suggest alternatives based on focus areas, language, fee, and open slots.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="metrics-band" aria-label="Clinic workflow highlights">
        <div>
          <strong>Review</strong>
          <span>therapist profile changes</span>
        </div>
        <div>
          <strong>Assign</strong>
          <span>inquiries to available care</span>
        </div>
        <div>
          <strong>Publish</strong>
          <span>blog and directory content</span>
        </div>
        <div>
          <strong>Protect</strong>
          <span>privacy and consent expectations</span>
        </div>
      </section>

      <section className="section intro-section">
        <div className="section-heading">
          <span>Your Journey</span>
          <h2>A clearer way to start therapy without guessing alone.</h2>
          <p>
            The clinic coordinator helps turn an uncertain first message into a practical next step,
            while therapist profiles and public content stay controlled by admin approval.
          </p>
        </div>
        <div className="journey-grid">
          {journey.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="therapists">
        <div className="section-heading inline-heading">
          <div>
            <span>Therapist Directory</span>
            <h2>Compare practitioners before you inquire.</h2>
          </div>
          <a className="text-link" href="/therapists">Open full directory</a>
        </div>

        <div className="therapist-grid">
          {featuredTherapists.map((therapist) => {
            const focus = splitFocus(therapist.specialization);
            return (
              <article className="therapist-card" key={therapist.id}>
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
                  <a href={whatsappHref}>Inquire</a>
                </div>
              </article>
            );
          })}
        </div>
        {featuredTherapists.length === 0 ? (
          <div className="empty-state">
            <strong>No approved therapists are live yet.</strong>
            <p>Approved Supabase therapist profiles will appear here. Demo cards require NEXT_PUBLIC_DEMO_MODE=true.</p>
          </div>
        ) : null}
      </section>

      <section className="section soft-section" id="services">
        <div className="section-heading">
          <span>Care areas</span>
          <h2>Support for common therapy goals.</h2>
          <p>
            These are starting points for matching, not labels. A therapist will help clarify what is actually happening and what kind of support is appropriate.
          </p>
        </div>
        <div className="service-grid">
          {services.map((service, index) => (
            <a
              className="service-card"
              href={`/self-tests#${service.assessment}`}
              key={service.title}
              aria-label={`${service.title}: ${service.check}`}
            >
              <img src={service.image} alt="" loading="lazy" />
              <span className="service-number">0{index + 1}</span>
              <div className="service-card-copy">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <strong>{service.check}<span aria-hidden="true">&#8594;</span></strong>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="section self-check-band">
        <div className="section-heading">
          <span>Informational self-checks</span>
          <h2>Explore patterns before you contact the clinic.</h2>
          <p>
            Quick assessments cover relationship adjustment, personality style, quality of life, sleep quality,
            and stress. Results are immediate, non-diagnostic, and not saved to the database.
          </p>
        </div>
        <a className="primary-btn" href="/self-tests">Open self-checks</a>
      </section>

      <section className="section" id="blog">
        <div className="section-heading inline-heading">
          <div>
            <span>Clinic CMS</span>
            <h2>Latest wellbeing reads.</h2>
          </div>
          <a className="text-link" href="/admin">Manage posts in admin</a>
        </div>
        <div className="blog-grid">
          {posts.map((post) => (
            <article className="blog-card" key={post.id}>
              <img
                src={post.image_url || "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=900&h=540"}
                alt=""
              />
              <div>
                <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB") : "Sample"}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
        {posts.length === 0 ? (
          <div className="empty-state">
            <strong>No published posts yet.</strong>
            <p>Published CMS posts with controlled uploaded images will appear here.</p>
          </div>
        ) : null}
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy">
          <span>Contact Us</span>
          <h2>Start with a private message.</h2>
          <p>
            WhatsApp is the primary contact method. Email availability is maintained by the clinic admin.
            {contactSettings.emailIsPlaceholder
              ? " The displayed email is temporary and should not be treated as a configured inbox yet."
              : " You can also contact the clinic through the published email address."}
          </p>
          <div className="contact-cta-stack">
            <a className="primary-btn" href={whatsappHref}>WhatsApp {contactSettings.displayPhone}</a>
            <a className="ghost-btn" href={callHref}>Call {contactSettings.displayPhone}</a>
            {contactSettings.emailIsPlaceholder ? (
              <span>{contactSettings.contactEmail} temporary placeholder</span>
            ) : (
              <a className="ghost-btn" href={`mailto:${contactSettings.contactEmail}`}>
                Email {contactSettings.contactEmail}
              </a>
            )}
          </div>
          <div className="policy-note">
            MindEase is not an emergency service. If someone is in immediate danger in Pakistan,
            they should contact local emergency services, go to the nearest hospital emergency department,
            or ask a trusted person nearby for urgent support. Specific emergency numbers can vary by city
            and provider, so verify local options before relying on them.
          </div>
        </div>
        <form className="contact-form" aria-label="Contact MindEase" action="/api/contact" method="post">
          <label>
            Full name
            <input name="name" placeholder="Your name" required />
          </label>
          <label>
            WhatsApp, phone, or email
            <input name="contact" placeholder="+92 300 1234567" required />
          </label>
          <label>
            Preferred language
            <select name="preferredLanguage" defaultValue="Urdu">
              <option>Urdu</option>
              <option>English</option>
              <option>Punjabi</option>
              <option>Sindhi</option>
              <option>Pashto</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Preferred time
            <input name="preferredTime" placeholder="Evening, weekend, or flexible" />
          </label>
          <label>
            Message
            <textarea name="message" placeholder="How can our coordinator help?" required />
          </label>
          <label className="consent-check">
            <input name="consent" type="checkbox" required />
            <span>
              I understand this is not emergency support and consent to MindEase using my submitted contact
              details to respond to this inquiry.
            </span>
          </label>
          <button type="submit">Send inquiry</button>
        </form>
      </section>

      <footer>
        <a className="footer-brand" href="#top">
          <Image src="/brand/mindease-app-icon.png" alt="" width={36} height={36} />
          <span>
            <strong>MindEase Online Clinic</strong>
            <small>Confidential online therapy coordination.</small>
          </span>
        </a>
        <div className="footer-links">
          <a href={whatsappHref}>WhatsApp</a>
          <a href="/therapists">Therapists</a>
          <a href="/self-tests">Self-checks</a>
          <a href="/therapist/login">Therapist portal</a>
          <a href="/admin">Admin</a>
        </div>
      </footer>
    </main>
  );
}
