const therapists = [
  {
    name: "Dr. Ayesha Khan",
    role: "Clinical Psychologist",
    years: "11 years",
    focus: "Anxiety, panic, trauma recovery",
    languages: "English, Urdu",
    next: "Today, 7:30 PM",
    fee: "$45",
  },
  {
    name: "Sara Malik",
    role: "CBT Therapist",
    years: "8 years",
    focus: "Stress, depression, self-esteem",
    languages: "English, Urdu, Punjabi",
    next: "Tomorrow, 5:00 PM",
    fee: "$38",
  },
  {
    name: "Hamza Rauf",
    role: "Relationship Therapist",
    years: "9 years",
    focus: "Couples, grief, family conflict",
    languages: "English, Urdu",
    next: "Mon, 8:00 PM",
    fee: "$50",
  },
];

const services = [
  "Anxiety and panic support",
  "Depression counselling",
  "Stress and burnout",
  "Relationship therapy",
  "Grief and life transitions",
  "Self-esteem and confidence",
];

const stack = [
  ["Supabase", "Auth, profiles, therapist data, bookings, intake forms, RLS"],
  ["Stripe", "Secure session payments, packages, receipts, webhooks"],
  ["Resend", "Verification, booking confirmations, reminders, contact replies"],
  ["Calendar", "Therapist availability, client invites, reschedule sync"],
  ["Vercel", "Fast deployment, environment variables, production hosting"],
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell" id="top">
        <nav className="nav" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="MindEase Online Clinic home">
            <span className="brand-mark">ME</span>
            <span>
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
            <div className="eyebrow">Private online therapy platform</div>
            <h1>Qualified clinical psychologists, one calm place to begin.</h1>
            <p>
              MindEase Online Clinic connects clients with experienced therapists
              for confidential video sessions, clear scheduling, secure payment,
              and gentle support from first contact to follow-up.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="#booking">Book your first session</a>
              <a className="secondary-btn" href="#contact">Talk to coordinator</a>
            </div>
            <div className="trust-strip" aria-label="Clinic trust points">
              <span>Licensed professionals</span>
              <span>Secure intake</span>
              <span>Flexible timings</span>
            </div>
          </div>

          <aside className="booking-card" id="booking" aria-label="Book a session">
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
        </div>
      </section>

      <section className="image-band" aria-label="Online therapy preview">
        <div
          className="therapy-photo"
          role="img"
          aria-label="A calm online consultation setup with a laptop and notebook"
        />
        <div>
          <span>Designed for ease</span>
          <strong>Clients should know what happens next at every step.</strong>
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
          {services.map((service) => (
            <article className="service-card" key={service}>
              <span className="service-dot" />
              <h3>{service}</h3>
              <p>Match with a therapist based on concern, language, availability, and session type.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section muted" id="therapists">
        <div className="section-heading">
          <span>Therapist marketplace</span>
          <h2>Help clients choose with confidence.</h2>
          <p>
            Profiles should show qualification, experience, specialties, language,
            next available slot, and fee before registration.
          </p>
        </div>
        <div className="therapist-grid">
          {therapists.map((therapist) => (
            <article className="therapist-card" key={therapist.name}>
              <div className="avatar" aria-hidden="true">
                {therapist.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="therapist-copy">
                <h3>{therapist.name}</h3>
                <p>{therapist.role}</p>
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
                <strong>{therapist.fee}<span>/session</span></strong>
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
