import Image from "next/image";
import Link from "next/link";

export default function JoinTherapistsPage() {
  return (
    <main className="admin-page">
      <section className="admin-login">
        <div className="admin-login-copy">
          <Link className="admin-mini-brand" href="/">
            <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
            <span>MindEase</span>
          </Link>
          <p className="admin-kicker">Therapist network</p>
          <h1>Bring thoughtful care online.</h1>
          <p>
            Share your credentials and clinical focus. Our team reviews every
            application before inviting approved professionals to create a profile.
          </p>
        </div>

        <form className="admin-login-card" action="/api/contact" method="post">
          <div>
            <span>Professional application</span>
            <h2>Introduce yourself</h2>
            <p>This is an application, not immediate public listing.</p>
          </div>
          <input name="topic" type="hidden" value="Therapist network application" />
          <label>
            Full name
            <input autoComplete="name" name="name" required />
          </label>
          <label>
            Email or WhatsApp
            <input autoComplete="email" name="contact" required />
          </label>
          <label>
            Credentials, experience, and clinical focus
            <textarea name="message" required rows={7} />
          </label>
          <button type="submit">Submit for review</button>
          <Link className="admin-back-link" href="/">Return to clinic website</Link>
        </form>
      </section>
    </main>
  );
}
