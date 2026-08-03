import Image from "next/image";

const therapists = [
  {
    name: "Aneela Mushtaq",
    role: "Clinical Psychologist",
    credentials: "M.Phil Clinical Psychology, PMDCP, PhD Fellow",
    years: "9+ years",
    focus: ["Assessment", "Grief", "Family counselling"],
    languages: "Urdu, English",
    next: "Today 8:00 PM",
    fee: "PKR 4,500",
  },
  {
    name: "Saeed Anwar",
    role: "Clinical Psychologist",
    credentials: "Master Clinical Psychology, PhD Scholar",
    years: "8+ years",
    focus: ["OCD", "Trauma", "Relationships"],
    languages: "Urdu, English, Chinese",
    next: "Tomorrow 6:30 PM",
    fee: "PKR 5,000",
  },
  {
    name: "Ishrat Noureen",
    role: "Clinical Psychologist",
    credentials: "MS Clinical Psychology",
    years: "9+ years",
    focus: ["Addiction", "Couple therapy", "Family therapy"],
    languages: "English, Urdu",
    next: "Today 9:00 PM",
    fee: "PKR 4,500",
    photo: "/team/ishrat-noureen.jpeg",
  },
  {
    name: "Mujahid Iqbal",
    role: "Clinical Psychologist",
    credentials: "PhD Psychology, MS Clinical Psychology",
    years: "10+ years",
    focus: ["Anxiety", "Depression", "Work stress"],
    languages: "Urdu, English, Chinese",
    next: "Sat 7:00 PM",
    fee: "PKR 5,500",
  },
  {
    name: "Romana Younas",
    role: "Clinical Psychologist",
    credentials: "M.Phil Clinical Psychology, Hypnotherapist, NLP Practitioner",
    years: "6+ years",
    focus: ["Crisis support", "OCD", "Stress"],
    languages: "Urdu, English",
    next: "Weekend slots",
    fee: "PKR 4,500",
  },
];

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
  ["Register", "Create a secure profile, verify email, and complete consent."],
  ["Pay", "Confirm the slot with online payment and receive a receipt."],
  ["Join", "Get email reminders, calendar invite, and the session link."],
];

const integrations = [
  ["Supabase", "Auth, profiles, therapists, intake forms, appointments, payments, RLS."],
  ["Stripe", "Checkout, receipts, refunds, packages, and payment webhooks."],
  ["Resend", "OTP, booking confirmations, reminders, and contact replies."],
  ["Calendar", "Therapist slots, rescheduling, and session invites."],
  ["Vercel", "Fast deployment, secrets, analytics, and production hosting."],
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export default function Home() {
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
            <a href="#therapists">Therapists</a>
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
            <a href="/admin">Admin</a>
          </div>

          <a className="nav-cta" href="#booking">Book session</a>
        </nav>

        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Qualified clinical psychologists online</p>
            <h1>Online therapy in Pakistan, booked in minutes.</h1>
            <p className="hero-lede">
              MindEase Online Clinic helps clients compare experienced therapists,
              register securely, pay online, and schedule confidential video sessions
              without waiting on manual follow-ups.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#booking">Book your first session</a>
              <a className="ghost-btn" href="#therapists">View therapists</a>
            </div>
            <div className="trust-row" aria-label="MindEase trust highlights">
              <span>Verified CVs</span>
              <span>Private intake</span>
              <span>Flexible timings</span>
            </div>
          </div>

          <aside className="booking-widget" id="booking" aria-label="Find a therapist">
            <div className="widget-head">
              <div>
                <span>Find care</span>
                <strong>Check availability</strong>
              </div>
              <p>Avg. response under 2 hours</p>
            </div>

            <form className="search-form" aria-label="Quick booking form">
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
              <button type="button">Show available therapists</button>
            </form>

            <div className="quick-slots" aria-label="Available slots">
              <span>Today 8:00 PM</span>
              <span>Today 9:00 PM</span>
              <span>Tomorrow 6:30 PM</span>
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
              <span>Featured clinician</span>
              <strong>Ishrat Noureen</strong>
              <p>Clinical Psychologist, 9+ years experience</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="metrics-band" aria-label="Clinic highlights">
        <div>
          <strong>5</strong>
          <span>verified therapists</span>
        </div>
        <div>
          <strong>6</strong>
          <span>major care areas</span>
        </div>
        <div>
          <strong>50 min</strong>
          <span>standard session</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>online scheduling</span>
        </div>
      </section>

      <section className="section intro-section">
        <div className="section-heading">
          <span>Client flow</span>
          <h2>Clear steps reduce anxiety before therapy begins.</h2>
          <p>
            The landing page now works like a healthcare booking product: choose
            a concern, compare clinicians, confirm payment, then receive reminders
            and the session link.
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
          <span>Trust before signup</span>
          <h2>Clients see real credentials before sharing sensitive details.</h2>
          <p>
            Public pages show verified names, qualifications, experience, focus
            areas, languages, pricing, and next slot. Intake details stay private
            inside Supabase after login and consent.
          </p>
          <div className="proof-list">
            <span>Confidential online consultation</span>
            <span>Clinical assessment and therapy</span>
            <span>Admin dashboard for requests and payments</span>
          </div>
        </div>
      </section>

      <section className="section" id="therapists">
        <div className="section-heading inline-heading">
          <div>
            <span>Therapists</span>
            <h2>Compare providers the way clients expect.</h2>
          </div>
          <a className="text-link" href="#booking">Check all slots</a>
        </div>

        <div className="therapist-grid">
          {therapists.map((therapist) => (
            <article className="therapist-card" key={therapist.name}>
              <div className="therapist-top">
                {therapist.photo ? (
                  <Image
                    src={therapist.photo}
                    alt={`${therapist.name}, ${therapist.role}`}
                    width={76}
                    height={76}
                    className="therapist-photo"
                  />
                ) : (
                  <div className="avatar" aria-hidden="true">{initials(therapist.name)}</div>
                )}
                <div>
                  <h3>{therapist.name}</h3>
                  <p>{therapist.role}</p>
                  <small>{therapist.credentials}</small>
                </div>
              </div>

              <div className="pill-row">
                {therapist.focus.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <dl className="therapist-meta">
                <div>
                  <dt>Experience</dt>
                  <dd>{therapist.years}</dd>
                </div>
                <div>
                  <dt>Languages</dt>
                  <dd>{therapist.languages}</dd>
                </div>
                <div>
                  <dt>Next slot</dt>
                  <dd>{therapist.next}</dd>
                </div>
              </dl>

              <div className="card-footer">
                <div>
                  <span>Session fee</span>
                  <strong>{therapist.fee}</strong>
                </div>
                <a href="#booking">Book</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section soft-section" id="services">
        <div className="section-heading">
          <span>Care areas</span>
          <h2>Simple labels, clinical depth after registration.</h2>
          <p>
            The page avoids overwhelming clients with diagnostic language. Once
            logged in, Supabase intake forms can collect fuller clinical history.
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
          <span>Pricing & payment</span>
          <h2>Transparent payment keeps bookings serious.</h2>
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
            <p>Multiple booked sessions with reminders and admin follow-up.</p>
            <strong>Bundle pricing</strong>
          </article>
        </div>
      </section>

      <section className="section integration-section">
        <div className="section-heading inline-heading">
          <div>
            <span>API integrations</span>
            <h2>Ready for Supabase, Vercel, email, payment, and scheduling.</h2>
          </div>
          <a className="text-link" href="/admin">Admin login</a>
        </div>
        <div className="integration-grid">
          {integrations.map(([name, description]) => (
            <article key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy">
          <span>Contact</span>
          <h2>Let clients ask questions without oversharing.</h2>
          <p>
            Public contact forms should collect only basic information. Sensitive
            clinical details belong in the secure intake form after registration.
          </p>
          <div className="policy-note">
            MindEase is not an emergency service. If someone is at immediate risk,
            they should contact local emergency support.
          </div>
        </div>
        <form className="contact-form" aria-label="Contact MindEase">
          <label>
            Full name
            <input name="name" placeholder="Your name" />
          </label>
          <label>
            Email or WhatsApp
            <input name="contact" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea name="message" placeholder="How can our coordinator help?" />
          </label>
          <button type="button">Send message</button>
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
          <a href="#booking">Book</a>
          <a href="#therapists">Therapists</a>
          <a href="/admin">Admin</a>
        </div>
      </footer>
    </main>
  );
}
