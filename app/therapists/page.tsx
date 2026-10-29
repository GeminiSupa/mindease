import { cookies } from 'next/headers';
import Link from 'next/link';
import LeadCaptureModal from '../components/LeadCaptureModal';

const mockTherapists = [
  {
    id: '1',
    full_name: 'Dr. Sarah Jenkins',
    title: 'Clinical Psychologist',
    qualifications: 'PhD Clinical Psychology',
    years_experience: 9,
    bio: 'Specializing in cognitive behavioural therapy for anxiety and depression. A calm, structured style with practical tools.',
    specialization: 'Anxiety, Depression, CBT',
    languages: ['English', 'Urdu'],
    session_fee: 4500,
    currency: 'PKR',
    availability_status: 'Evening slots available',
    profile_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
  },
  {
    id: '2',
    full_name: 'Michael Chen',
    title: 'Licensed Clinical Social Worker',
    qualifications: 'MSW, LCSW',
    years_experience: 7,
    bio: 'Helping individuals navigate life transitions, stress, and relationship issues with compassion and evidence-based care.',
    specialization: 'Relationships, Stress, Life Transitions',
    languages: ['English'],
    session_fee: 5000,
    currency: 'PKR',
    availability_status: 'Weekend intake available',
    profile_image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
  },
  {
    id: '3',
    full_name: 'Dr. Emily Parker',
    title: 'Couples Therapist',
    qualifications: 'MPhil Psychology',
    years_experience: 11,
    bio: 'Dedicated to fostering healthy communication and intimacy in relationships. Specialises in couples and family work.',
    specialization: 'Couples, Communication, Family',
    languages: ['English', 'Urdu'],
    session_fee: 5500,
    currency: 'PKR',
    availability_status: 'Limited weekday mornings',
    profile_image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
  },
];

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default async function TherapistsDirectoryPage() {
  const cookieStore = await cookies();
  const hasCaptured = cookieStore.get('lead_captured')?.value === 'true';

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

      <section className="section" id="browse" style={{ position: 'relative' }}>
        <div className="inline-heading section-heading">
          <div>
            <span>Our therapists</span>
            <h2>Meet our verified therapists</h2>
          </div>
          <Link className="text-link" href="/therapists/join">Join the network →</Link>
        </div>

        <div
          className="therapist-grid"
          style={!hasCaptured ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.6 } : {}}
          aria-hidden={!hasCaptured}
        >
          {mockTherapists.map((t) => (
            <article className="therapist-card" key={t.id}>
              <div className="therapist-top">
                {t.profile_image_url ? (
                  <img
                    src={t.profile_image_url}
                    alt={t.full_name}
                    className="therapist-photo"
                    loading="lazy"
                  />
                ) : (
                  <span className="avatar">{initials(t.full_name)}</span>
                )}
                <div>
                  <h3>{t.full_name}</h3>
                  <p>{t.title}</p>
                  <small>{t.qualifications} · {t.years_experience} yrs</small>
                </div>
              </div>

              <dl className="therapist-meta">
                <div>
                  <dt>Focus</dt>
                  <dd>{t.specialization}</dd>
                </div>
                <div>
                  <dt>Languages</dt>
                  <dd>{t.languages.join(', ')}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{t.availability_status}</dd>
                </div>
              </dl>

              {t.bio ? <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>{t.bio}</p> : null}

              <div className="card-footer">
                <div>
                  <span>Session fee</span>
                  <strong>{t.currency} {t.session_fee.toLocaleString()}</strong>
                </div>
                <a className="primary-btn" href="/#contact">Enquire</a>
              </div>
            </article>
          ))}
        </div>

        {!hasCaptured && <LeadCaptureModal />}
      </section>

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
