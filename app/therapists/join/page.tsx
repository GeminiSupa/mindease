import Link from "next/link";
import { THERAPIST_COUNTRIES } from "../../countries";

const steps = [
  ["01", "Apply online", "Share your professional details, licence information, country, languages, and focus areas."],
  ["02", "Credential review", "The MindEase team verifies qualifications, professional registration, identity, and experience."],
  ["03", "Profile setup", "Approved clinicians receive a secure portal login and review their public profile before launch."],
  ["04", "Join the panel", "Set availability, receive suitable enquiries, and coordinate confirmed online sessions."],
];

export default async function JoinTherapistsPage({ searchParams }: { searchParams: Promise<{ application?: string }> }) {
  const { application } = await searchParams;
  return (
    <main className="join-page" id="main-content">
      <nav className="join-nav">
        <Link className="admin-mini-brand" href="/">MindEase <small>Online Therapy</small></Link>
        <div><Link href="/therapists">Meet the team</Link><Link href="/therapist/login">Therapist portal</Link></div>
      </nav>
      <section className="join-hero">
        <div className="join-hero-copy">
          <p className="admin-kicker">International clinician network</p>
          <h1>Bring trusted mental healthcare closer.</h1>
          <p>MindEase welcomes qualified psychiatrists, clinical psychologists, counsellors, and therapists who can support clients in Pakistan and Pakistanis worldwide.</p>
          <div className="admin-feature-list"><span>Credential-reviewed profiles</span><span>International country badge</span><span>Secure client enquiries</span><span>Control your availability</span></div>
        </div>
        <div className="join-steps" aria-label="How therapist applications work">
          {steps.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></article>)}
        </div>
      </section>
      <section className="join-application" aria-labelledby="apply-title">
        <div className="join-application-copy">
          <p className="admin-kicker">Professional application</p><h2 id="apply-title">Apply to join MindEase</h2>
          <p>Complete this first-stage application. We request supporting documents through a secure channel after initial review—please do not submit sensitive identity documents here.</p>
          <div className="join-review-note"><strong>What we review</strong><span>Qualification and registration</span><span>Clinical experience and scope</span><span>Languages and online availability</span><span>Professional references, where required</span></div>
        </div>
        <form className="admin-login-card join-form" action="/api/therapist-applications" method="post">
          {application === "sent" && <p className="form-status is-success" role="status">Application received. Our team will review it and contact you using the details provided.</p>}
          {application === "error" && <p className="form-status is-error" role="alert">The application could not be sent. Check all required fields and try again.</p>}
          <div><span>New application</span><h2>Professional details</h2><p>Fields marked required help us complete the first review.</p></div>
          <div className="admin-form-grid">
            <label>Full name<input name="name" type="text" placeholder="Dr. Jane Doe" required /></label>
            <label>Email address<input name="email" type="email" placeholder="jane@example.com" required /></label>
            <label>WhatsApp / phone<input name="phone" type="tel" placeholder="+92 3XX XXXXXXX" required /></label>
            <label>Professional title<select name="professionalTitle" required defaultValue=""><option value="" disabled>Select title</option><option>Psychiatrist</option><option>Clinical Psychologist</option><option>Counselling Psychologist</option><option>Psychotherapist</option><option>Marriage & Family Therapist</option><option>Child & Teen Specialist</option><option>Counsellor</option><option>Other qualified clinician</option></select></label>
            <label>Country of origin<select name="countryCode" defaultValue="PK" required>{THERAPIST_COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}<option value="XX">Other country</option></select></label>
            <label>Country name (if other)<input name="countryOfOrigin" placeholder="Optional" /></label>
            <label>Qualifications<input name="qualifications" placeholder="MPhil Clinical Psychology" required /></label>
            <label>Licence / registration<input name="licenseNumber" placeholder="PMDC or relevant registration" required /></label>
            <label>Years of experience<input name="yearsExperience" type="number" min="0" max="80" placeholder="5" required /></label>
            <label>Expected session fee<input name="sessionFee" type="number" min="0" placeholder="4500" /></label>
            <label>Fee currency<select name="currency" defaultValue="PKR"><option>PKR</option><option>USD</option><option>GBP</option><option>AED</option><option>SAR</option></select></label>
            <label>Languages<input name="languages" placeholder="Urdu, English" required /></label>
            <label className="wide-field">Focus areas<input name="specialization" placeholder="Anxiety, relationships, child wellbeing" required /></label>
            <label className="wide-field">Professional profile or LinkedIn URL<input name="profileUrl" type="url" placeholder="https://" /></label>
            <label className="wide-field">Professional bio<textarea name="bio" placeholder="Describe your experience, approach, and the clients you support." required /></label>
            <label className="wide-field consent-check"><input name="consent" type="checkbox" required /><span>I confirm these details are accurate and consent to MindEase using them to review my application and contact me about credential verification.</span></label>
            <button type="submit">Submit professional application</button>
          </div>
        </form>
      </section>
      <footer className="simple-footer"><strong>MindEase Online Clinic</strong><span>Applications are reviewed before any profile is published.</span><Link href="/">Return home</Link></footer>
    </main>
  );
}
