import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import LeadCaptureModal from '../../components/LeadCaptureModal';

const selfTests = [
  {
    id: 'anxiety',
    category: 'Anxiety & panic',
    title: 'Anxiety Pattern Check',
    description: 'A brief reflection on how manageable anxiety-related experiences have felt during the past two weeks.',
    time: '~2 minutes',
    href: '/self-tests#anxiety-patterns',
  },
  {
    id: 'depression',
    category: 'Depression',
    title: 'Mood & Daily Function Check',
    description: 'A non-diagnostic snapshot of how supported and manageable daily life has felt recently.',
    time: '~2 minutes',
    href: '/self-tests#low-mood-functioning',
  },
  {
    id: 'stress',
    category: 'Stress & burnout',
    title: 'Stress Load Check',
    description: 'Reviews tension, recovery, irritability, and your current sense of control.',
    time: '~2 minutes',
    href: '/self-tests#stress-load',
  },
  {
    id: 'relationship',
    category: 'Relationship issues',
    title: 'Relationship Adjustment Check',
    description: 'Looks at satisfaction, agreement, closeness, and repair after conflict.',
    time: '~2 minutes',
    href: '/self-tests#relationship-adjustment',
  },
  {
    id: 'sleep',
    category: 'Sleep & recovery',
    title: 'Sleep Quality Check',
    description: 'Looks at falling asleep, staying asleep, restfulness, and daytime effects.',
    time: '~2 minutes',
    href: '/self-tests#sleep-quality',
  },
  {
    id: 'wellbeing',
    category: 'General wellbeing',
    title: 'Quality of Life Snapshot',
    description: 'Reviews life satisfaction across routine, relationships, work or study, and meaning.',
    time: '~2 minutes',
    href: '/self-tests#quality-of-life',
  },
];

export default async function SelfTestsListingPage() {
  const cookieStore = await cookies();
  const hasCaptured = cookieStore.get('lead_captured')?.value === 'true';

  return (
    <main className="directory-page" id="main-content">
      <section className="test-hero">
        <nav className="site-nav" aria-label="Self-check navigation">
          <Link className="brand" href="/">
            <span>
              <strong>MindEase</strong>
              <small>Self-checks</small>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/therapists">Therapists</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </nav>

        <div className="test-hero-layout">
          <div className="directory-copy">
            <span className="eyebrow">Private, informational self-checks</span>
            <h1>Pause, notice a pattern, and find a useful next step.</h1>
            <p>Choose a quick check, answer five plain-language questions, and see your score immediately. Nothing is saved or sent to MindEase.</p>
            <div className="test-trust-row" aria-label="Self-check details">
              <span>About 2 minutes</span>
              <span>Results stay on this device</span>
              <span>Not a diagnosis</span>
            </div>
          </div>
          <div className="test-hero-media">
            <Image
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=85&w=900&h=700"
              alt="A person in a calm reflective moment"
              width={900}
              height={700}
              priority
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
            />
            <div>
              <strong>{selfTests.length} guided checks</strong>
              <span>Choose the one that fits today.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ position: 'relative' }}>
        <div className="section-heading">
          <span>Mental health self-checks</span>
          <h2>Choose a focus area</h2>
          <p>All checks are private and informational. Use them as a conversation starter with a therapist, not as a diagnosis.</p>
        </div>

        <div
          className="therapist-grid"
          style={!hasCaptured ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.6, marginTop: '28px' } : { marginTop: '28px' }}
          aria-hidden={!hasCaptured}
        >
          {selfTests.map((test) => (
            <article className="therapist-card" key={test.id}>
              <div>
                <span className="eyebrow" style={{ marginBottom: '6px', display: 'block' }}>{test.category}</span>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', lineHeight: 1.3 }}>{test.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>{test.description}</p>
              </div>
              <div className="card-footer" style={{ marginTop: 'auto' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 850 }}>{test.time}</span>
                <a className="primary-btn" href={test.href} style={{ minWidth: '100px' }}>Start check</a>
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
          <Link href="/therapists">Therapists</Link>
          <Link href="/#contact">Contact</Link>
          <Link href="/therapist/login">Therapist portal</Link>
        </nav>
      </footer>
    </main>
  );
}
