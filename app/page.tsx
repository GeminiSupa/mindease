import Image from "next/image";

const therapists = [
  {
    name: "Aneela Mushtaq",
    role: "Clinical Psychologist & Senior Lecturer",
    credentials: "M.Phil Clinical Psychology, PMDCP, PhD Fellow",
    years: "9+ years",
    focus: "Psychological assessment, psychotherapy, grief, family counselling",
    languages: "Urdu, English",
    next: "Flexible online slots",
    fee: "Profile",
  },
  {
    name: "Saeed Anwar",
    role: "Clinical Psychologist & Relationship Counselor",
    credentials: "Master Clinical Psychology, PhD Scholar",
    years: "8+ years",
    focus: "OCD, anxiety, depression, trauma, marital and relationship concerns",
    languages: "Urdu, English, Chinese",
    next: "Online appointments",
    fee: "Profile",
  },
  {
    name: "Ishrat Noureen",
    role: "Clinical Psychologist",
    credentials: "MS Clinical Psychology",
    years: "9+ years",
    focus: "Addiction counselling, couple therapy, child and family therapy",
    languages: "English, Urdu",
    next: "Flexible timings",
    fee: "Profile",
    photo: "/team/ishrat-noureen.jpeg",
  },
  {
    name: "Mujahid Iqbal",
    role: "Clinical Psychologist & Online Therapist",
    credentials: "PhD Psychology, MS Clinical Psychology",
    years: "10+ years",
    focus: "Anxiety, depression, OCD, trauma, addiction, workplace distress",
    languages: "Urdu, English, Chinese",
    next: "Online counselling",
    fee: "Profile",
  },
  {
    name: "Romana Younas",
    role: "Clinical Psychologist & PhD Scholar",
    credentials: "M.Phil Clinical Psychology, Hypnotherapist, NLP Practitioner",
    years: "6+ years",
    focus: "Crisis support, psychodiagnostics, OCD, stress, anxiety, depression",
    languages: "Urdu, English",
    next: "Remote counselling",
    fee: "Profile",
  },
];

const services = [
  ["Anxiety and panic support", "Assessment-led care for worry, panic, phobias, and nervous-system overload."],
  ["Depression counselling", "Structured support for low mood, motivation, sleep, and daily functioning."],
  ["Stress and burnout", "Practical therapy for professionals, students, caregivers, and overwhelmed clients."],
  ["Relationship therapy", "Individual, couple, and family support for conflict, trust, and communication."],
  ["Grief and trauma support", "Confidential care for loss, trauma reactions, adjustment, and life transitions."],
  ["Child and family therapy", "Parent guidance, child concerns, academic stress, and family counselling."],
];

const stack = [
  ["Supabase", "Auth, profiles, therapist data, bookings, intake forms, RLS"],
  ["Stripe", "Secure session payments, packages, receipts, webhooks"],
  ["Resend", "Verification, booking confirmations, reminders, contact replies"],
  ["Calendar", "Therapist availability, client invites, reschedule sync"],
  ["Vercel", "Fast deployment, environment variables, production hosting"],
];

const workflow = [
  ["Search", "Choose concern, language, therapist type, and preferred time."],
  ["Compare", "See credentials, experience, focus areas, and next available slots."],
  ["Book", "Hold a slot, register securely, complete consent, and pay online."],
  ["Care", "Receive reminders, join the session, and track follow-ups."],
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell" id="top">
        <nav className="nav" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="MindEase Online Clinic home">
            <Image
              src="/brand/mindease-app-icon.png"
              alt=""
              width={44}
              height={44}
              className="brand-icon"
              priority
            />
            <span className="brand-text">
              <strong>MindEase</strong>
              <small>Online Clinic</small>
            </span>
          </a>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#therapists">Therapists</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </div>
          <a className="nav-cta" href="#booking">Book session</a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">MindEase Online Clinic</div>
            <h1>Online therapy with qualified clinical psychologists.</h1>
            <p>
              A single platform for experienced therapists offering confidential
              video sessions, guided registration, secure payment, and simple
              scheduling for clients in Pakistan and abroad.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#booking">Book your first session</a>
              <a className="secondary-btn" href="#contact">Talk to coordinator</a>
            </div>
            <div className="trust-strip" aria-label="Clinic trust points">
              <span>Qualified psychologists</span>
              <span>Secure intake</span>
              <span>Flexible timings</span>
            </div>
          </div>

          <aside className="hero-visual" aria-label="MindEase clinic preview">
            <div className="hero-logo-panel">
              <Image
                src="/brand/mindease-wordmark.png"
                alt="MindEase Online Clinic"
                width={520}
                height={184}
                priority
              />
            </div>
            <div className="hero-portrait-card">
              <Image
                src="/team/ishrat-noureen.jpeg"
                alt="Clinical psychologist Ishrat Noureen"
                width={280}
                height={360}
                priority
              />
              <div>
                <span>Featured clinician</span>
                <strong>Ishrat Noureen</strong>
                <p>Clinical Psychologist, 9+ years experience</p>
              </div>
            </div>
            <div className="hero-stat-card">
              <span>Online clinic</span>
              <strong>5</strong>
              <p>verified therapists ready for scheduling</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <div className="booking-copy">
          <span>Book like Oladoc, but for therapy</span>
          <h2>Find the right therapist, then confirm the session.</h2>
          <p>
            Clients should compare therapists, pick an available time, register,
            complete intake, pay, and receive reminders without calling multiple
            numbers or waiting for manual replies.
          </p>
          <div className="workflow-grid">
            {workflow.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="booking-card" aria-label="Book a session">
            <div className="booking-head">
              <span>Session booking</span>
              <strong>4 simple steps</strong>
            </div>
            <ol className="booking-steps">
              <li>
                <span>01</span>
                <div>
                  <strong>Choose your concern</strong>
                  <p>Anxiety, stress, relationship, grief, depression, or other.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Register securely</strong>
                  <p>Email OTP, phone number, consent, and short intake form.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Pay and confirm</strong>
                  <p>Stripe checkout confirms the slot after payment succeeds.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Join online session</strong>
                  <p>Email reminder, calendar invite, and dashboard session link.</p>
                </div>
              </li>
            </ol>
            <form className="quick-form" aria-label="Quick booking interest form">
              <label>
                I need help with
                <select name="concern" defaultValue="Anxiety or panic">
                  <option>Anxiety or panic</option>
                  <option>Depression</option>
                  <option>Stress and burnout</option>
                  <option>Relationship support</option>
                  <option>Not sure yet</option>
                </select>
              </label>
              <label>
                Preferred time
                <select name="time" defaultValue="Evening">
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Weekend</option>
                </select>
              </label>
              <button type="button">Check therapist availability</button>
            </form>
          </aside>
      </section>

      <section className="image-band" aria-label="Online therapy preview">
        <Image
          src="/brand/mindease-glow-wordmark.png"
          alt="MindEase Online Clinic brand visual"
          width={1600}
          height={900}
          className="therapy-photo"
        />
        <div className="image-band-copy">
          <span>Designed for ease</span>
          <strong>Clients should know what happens next at every step.</strong>
        </div>
      </section>

      <section className="section clinic-proof">
        <div className="section-heading">
          <span>Why clients trust it</span>
          <h2>Clinical credibility should be visible before signup.</h2>
          <p>
            The page now prioritizes real credentials, privacy, scheduling ease,
            and clear next steps instead of generic wellness messaging.
          </p>
        </div>
        <div className="proof-grid">
          <article>
            <Image
              src="/brand/mindease-app-icon.png"
              alt=""
              width={104}
              height={104}
            />
            <h3>Professional brand signal</h3>
            <p>Consistent logo, favicon, and app-style icon build recognition across web and mobile.</p>
          </article>
          <article>
            <Image
              src="/team/ishrat-noureen.jpeg"
              alt="MindEase clinical psychologist profile visual"
              width={240}
              height={240}
            />
            <h3>Real therapist presence</h3>
            <p>Provider photos and verified CV details make therapist choice feel human and safer.</p>
          </article>
          <article>
            <div className="interface-shot" aria-hidden="true">
              <span>08</span>
              <strong>Today&apos;s sessions</strong>
              <p>Payment pending, confirmed, and reschedule requests in one admin queue.</p>
            </div>
            <h3>Operations-ready</h3>
            <p>Admin views are planned for appointment requests, payments, contact messages, and therapist slots.</p>
          </article>
        </div>
      </section>

      <section className="section" id="services">
        <div className="section-heading">
          <span>Care areas</span>
          <h2>Support that is easy to understand and easy to start.</h2>
          <p>
            Keep the public pages simple. Detailed clinical information should
            be collected only after login and consent.
          </p>
        </div>
        <div className="service-grid">
          {services.map(([service, description]) => (
            <article className="service-card" key={service}>
              <span className="service-dot" />
              <h3>{service}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section muted" id="therapists">
        <div className="section-heading">
          <span>Therapist marketplace</span>
          <h2>Help clients choose with confidence.</h2>
          <p>
            These public cards use verified CV details only. Full documents,
            phone numbers, and private records should stay in the admin system.
          </p>
        </div>
        <div className="therapist-grid">
          {therapists.map((therapist) => (
            <article className="therapist-card" key={therapist.name}>
              {therapist.photo ? (
                <Image
                  src={therapist.photo}
                  alt={`${therapist.name}, ${therapist.role}`}
                  width={160}
                  height={160}
                  className="therapist-photo"
                />
              ) : (
                <div className="avatar" aria-hidden="true">
                  {therapist.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              )}
              <div className="therapist-copy">
                <h3>{therapist.name}</h3>
                <p>{therapist.role}</p>
                <small>{therapist.credentials}</small>
              </div>
              <dl>
                <div>
                  <dt>Experience</dt>
                  <dd>{therapist.years}</dd>
                </div>
                <div>
                  <dt>Focus</dt>
                  <dd>{therapist.focus}</dd>
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
              <div className="card-action">
                <strong>{therapist.fee}</strong>
                <a href="#booking">Book</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="journey">
        <div className="journey-copy">
          <span>Client journey</span>
          <h2>Approach, register, pay, schedule, join.</h2>
          <p>
            The best flow keeps the client moving forward without confusion,
            while protecting private information and preventing unpaid bookings.
          </p>
        </div>
        <div className="timeline">
          {["Approach", "Register", "Intake", "Pay", "Schedule", "Session"].map(
            (item, index) => (
              <div className="timeline-item" key={item}>
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="section-heading">
          <span>Pricing model</span>
          <h2>Transparent prices reduce anxiety before booking.</h2>
        </div>
        <div className="pricing-grid">
          <article>
            <h3>First consultation</h3>
            <p>Short fit-check call with coordinator or therapist.</p>
            <strong>Free or low fee</strong>
          </article>
          <article>
            <h3>Single therapy session</h3>
            <p>50-minute secure online session with selected therapist.</p>
            <strong>$38-$55</strong>
          </article>
          <article>
            <h3>Care package</h3>
            <p>Four booked sessions with reminders and follow-up support.</p>
            <strong>Bundle discount</strong>
          </article>
        </div>
      </section>

      <section className="section muted">
        <div className="section-heading">
          <span>API integrations</span>
          <h2>Built for Supabase, Vercel, secure payments, and email.</h2>
        </div>
        <div className="stack-grid">
          {stack.map(([name, description]) => (
            <article key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div>
          <span>Contact</span>
          <h2>Let clients ask for help without oversharing publicly.</h2>
          <p>
            Use this form for general questions. Sensitive details belong inside
            the secure intake after login and consent.
          </p>
          <div className="policy-note">
            MindEase is not an emergency service. If someone is at immediate
            risk, they should contact local emergency support.
          </div>
        </div>
        <form className="contact-form" aria-label="Contact MindEase">
          <label>
            Full name
            <input name="name" placeholder="Your name" />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea name="message" placeholder="How can our coordinator help?" />
          </label>
          <button type="button">Send message</button>
        </form>
      </section>

      <footer>
        <div>
          <strong>MindEase Online Clinic</strong>
          <p>Confidential online therapy with qualified professionals.</p>
        </div>
        <div className="footer-links">
          <a href="#top">Home</a>
          <a href="#booking">Booking</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </main>
  );
}
