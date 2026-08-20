import Image from "next/image";

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://lhcjubkyyikirliafwfd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type LiveTherapist = {
  id: string;
  full_name: string;
  title: string;
  qualifications?: string;
  years_experience?: number;
  specialization?: string;
  languages?: string[];
  session_fee?: number;
  currency?: string;
  availability_status?: string;
};

const services = [
  ["Anxiety & panic", "Structured therapy for worry, panic attacks, fears, and overthinking."],
  ["Depression", "Support for low mood, motivation, sleep, energy, and daily functioning."],
  ["Relationship issues", "Individual, couple, and family counselling for conflict and trust."],
  ["Stress & burnout", "Practical support for professionals, students, caregivers, and parents."],
  ["Trauma & grief", "Confidential care for loss, adjustment, traumatic stress, and transitions."],
  ["Child & family", "Parent guidance, child concerns, academic stress, and family therapy."],
];

const journey = [
  ["Search", "Choose your concern, language, time, and therapist preference."],
  ["Request", "Send your contact details and preferred session time privately."],
  ["Confirm", "A care coordinator confirms the therapist, fee, and available slot."],
  ["Join", "Receive the confirmed session details and join your online appointment."],
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
  if (!SUPABASE_ANON_KEY) return [];

  const query = new URLSearchParams({
    select:
      "id,full_name,title,qualifications,years_experience,specialization,languages,session_fee,currency,availability_status",
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

    if (!response.ok) return [];
    return (await response.json()) as LiveTherapist[];
  } catch {
    return [];
  }
}

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const therapists = await getApprovedTherapists();
  const params = (await searchParams) ?? {};
  const contactStatus = firstParam(params.contact);
  const concern = firstParam(params.concern);
  const session = firstParam(params.session);
  const time = firstParam(params.time);
  const careRequest = [
    concern ? `Concern: ${concern}` : "",
    session ? `Preferred session: ${session}` : "",
    time ? `Best time: ${time}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <main>
      <section className="hero-shell" id="top">
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
            {therapists.length > 0 ? <a href="#therapists">Therapists</a> : null}
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="nav-cta" href="#booking">Request session</a>
        </nav>

        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Qualified clinical psychologists online</p>
            <h1>Request online therapy with confidence.</h1>
            <p className="hero-lede">
              MindEase Online Clinic helps clients compare experienced therapists and
              send a private care request. A coordinator then confirms the right
              clinician, fee, and available online session time.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#booking">Request your first session</a>
              <a className="ghost-btn" href={therapists.length > 0 ? "#therapists" : "#services"}>
                {therapists.length > 0 ? "View therapists" : "Explore services"}
              </a>
            </div>
            <div className="trust-row" aria-label="MindEase trust highlights">
              <span>Carefully reviewed</span>
              <span>Private intake</span>
              <span>Flexible timings</span>
            </div>
          </div>

          <aside className="booking-widget" id="booking" aria-label="Find a therapist">
            <div className="widget-head">
              <div>
                <span>Find care</span>
                <strong>Tell us what you need</strong>
              </div>
              <p>Private and confidential</p>
            </div>

            <form className="search-form" aria-label="Quick care request" action="/#contact" method="get">
              <label>
                I need help with
                <select name="concern" defaultValue="Anxiety & panic">
                  <option>Anxiety & panic</option>
                  <option>Depression</option>
                  <option>Relationship support</option>
                  <option>Stress and burnout</option>
                  <option>Child or family concern</option>
                  <option>Not sure yet</option>
                </select>
              </label>
              <label>
                Preferred session
                <select name="session" defaultValue="Video consultation">
                  <option>Video consultation</option>
                  <option>Couple session</option>
                  <option>Family counselling</option>
                  <option>Assessment review</option>
                </select>
              </label>
              <label>
                Best time
                <select name="time" defaultValue="Evening">
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Weekend</option>
                </select>
              </label>
              <button type="submit">Continue to contact</button>
            </form>

            <div className="quick-slots" aria-label="Available slots">
              <span>Our care team will confirm the best therapist and available time.</span>
            </div>
          </aside>

          <aside className="hero-media" aria-label="Featured clinician">
            <Image
              src="/team/ishrat-noureen.jpeg"
              alt="MindEase clinical psychologist Ishrat Noureen"
              width={520}
              height={690}
              priority
            />
            <div className="clinician-badge">
              <span>Professional online care</span>
              <strong>Qualified clinical support</strong>
              <p>Thoughtful therapist matching in a private, supportive setting.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="metrics-band" aria-label="Clinic highlights">
        <div>
          <strong>Qualified</strong>
          <span>clinical professionals</span>
        </div>
        <div>
          <strong>Private</strong>
          <span>confidential sessions</span>
        </div>
        <div>
          <strong>Flexible</strong>
          <span>online appointments</span>
        </div>
        <div>
          <strong>Personal</strong>
          <span>care matching</span>
        </div>
      </section>

      <section className="section intro-section">
        <div className="section-heading">
          <span>Your Journey</span>
          <h2>Clear steps to start your healing process.</h2>
          <p>
            Choose your concern and preferred time, then send a private request. Our care coordinator will confirm the right therapist, fee, and available session.
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

      <section className="section split-proof">
        <div className="brand-panel">
          <Image
            src="/brand/mindease-wordmark.png"
            alt="MindEase Online Clinic"
            width={700}
            height={250}
          />
        </div>
        <div className="proof-copy">
          <span>Verified Professionals</span>
          <h2>Qualified experts you can trust.</h2>
          <p>
            All our therapists are fully licensed and carefully vetted. We maintain strict confidentiality and secure your private information at every step of your journey.
          </p>
          <div className="proof-list">
            <span>Confidential online consultation</span>
            <span>Clinical assessment and therapy</span>
            <span>Clear guidance before your first session</span>
          </div>
        </div>
      </section>

      {therapists.length > 0 ? <section className="section" id="therapists">
        <div className="section-heading inline-heading">
          <div>
            <span>Our Therapists</span>
            <h2>Find the right professional for you.</h2>
          </div>
          <a className="text-link" href="#booking">Request a match</a>
        </div>

        <div className="therapist-grid">
          {therapists.map((therapist) => {
            const focus = splitFocus(therapist.specialization);

            return (
            <article className="therapist-card" key={therapist.id}>
              <div className="therapist-top">
                <div className="avatar" aria-hidden="true">{initials(therapist.full_name)}</div>
                <div>
                  <h3>{therapist.full_name}</h3>
                  <p>{therapist.title}</p>
                  <small>{therapist.qualifications}</small>
                </div>
              </div>

              <div className="pill-row">
                {(focus.length ? focus : ["Online therapy"]).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <dl className="therapist-meta">
                <div>
                  <dt>Experience</dt>
                  <dd>{therapist.years_experience ? `${therapist.years_experience}+ years` : "Profile review complete"}</dd>
                </div>
                <div>
                  <dt>Languages</dt>
                  <dd>{therapist.languages?.join(", ") || "Urdu, English"}</dd>
                </div>
                <div>
                  <dt>Next slot</dt>
                  <dd>{therapist.availability_status || "Contact our care team"}</dd>
                </div>
              </dl>

              <div className="card-footer">
                <div>
                  <span>Session fee</span>
                  <strong>
                    {therapist.session_fee
                      ? `${therapist.currency ?? "PKR"} ${therapist.session_fee.toLocaleString("en-PK")}`
                      : "Contact for fee"}
                  </strong>
                </div>
                <a href="#booking">Request</a>
              </div>
            </article>
          )})}
        </div>
      </section> : null}

      <section className="section soft-section" id="services">
        <div className="section-heading">
          <span>Care areas</span>
          <h2>Specialized care for your unique needs.</h2>
          <p>
            We offer focused support across a variety of areas. Our experienced professionals will help you navigate your challenges with compassion and expertise.
          </p>
        </div>
        <div className="service-grid">
          {services.map(([title, description]) => (
            <article className="service-card" key={title}>
              <span className="service-marker" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricing-section" id="pricing">
        <div className="section-heading">
          <span>Session pricing</span>
          <h2>Clear guidance before you confirm.</h2>
        </div>
        <div className="pricing-grid">
          <article>
            <span>Intro</span>
            <h3>Coordinator fit check</h3>
            <p>Short guidance call to route the client to the right therapist.</p>
            <strong>Free / low fee</strong>
          </article>
          <article className="featured-price">
            <span>Most common</span>
            <h3>Online therapy session</h3>
            <p>50-minute secure video session with confirmed therapist.</p>
            <strong>PKR 4,500+</strong>
          </article>
          <article>
            <span>Continuity</span>
            <h3>Follow-up package</h3>
            <p>Discuss a continuity plan and multiple sessions with the care coordinator.</p>
            <strong>Bundle pricing</strong>
          </article>
        </div>
      </section>



      <section className="contact-section" id="contact">
        <div className="contact-copy">
          <span>Contact Us</span>
          <h2>We&apos;re here to help you get started.</h2>
          <p>
            Have questions about our services or need help finding the right therapist? Reach out to our care coordinators for guidance.
          </p>
          <div className="policy-note">
            MindEase is not an emergency service. If someone is at immediate risk,
            they should contact local emergency support.
          </div>
        </div>
        <form className="contact-form" aria-label="Contact MindEase" action="/api/contact" method="post">
          {contactStatus === "sent" ? (
            <p className="contact-status success" role="status">
              Thank you. Your message has been sent, and our care team will contact you soon.
            </p>
          ) : null}
          {contactStatus === "error" ? (
            <p className="contact-status error" role="alert">
              We could not send your message. Please check every field and try again.
            </p>
          ) : null}
          <label>
            Full name
            <input name="name" autoComplete="name" placeholder="Your name" required />
          </label>
          <label>
            Email or WhatsApp
            <input name="contact" autoComplete="email" placeholder="you@example.com or +92..." required />
          </label>
          <label>
            Message
            <textarea
              name="message"
              defaultValue={careRequest}
              placeholder="How can our coordinator help?"
              required
            />
          </label>
          <button type="submit">Send message</button>
        </form>
      </section>

      <footer>
        <a className="footer-brand" href="#top">
          <Image src="/brand/mindease-app-icon.png" alt="" width={36} height={36} />
          <span>
            <strong>MindEase Online Clinic</strong>
            <small>Confidential care from qualified professionals.</small>
          </span>
        </a>
        <div className="footer-links">
          <a href="#booking">Request care</a>
          {therapists.length > 0 ? <a href="#therapists">Therapists</a> : null}
          <a href="#services">Services</a>
        </div>
      </footer>
    </main>
  );
}
