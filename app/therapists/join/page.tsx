import Image from "next/image";
import Link from "next/link";

export default async function JoinTherapistsPage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string }>;
}) {
  const params = await searchParams;
  const applicationStatus =
    params.application === "sent" || params.application === "error" ? params.application : null;

  return (
    <main className="admin-page" id="main-content">
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

        <form className="admin-login-card" action="/api/therapist-applications" method="post">
          <div>
            <span>Professional application</span>
            <h2>Introduce yourself</h2>
            <p>This is an application, not immediate public listing.</p>
          </div>
          {applicationStatus === "sent" ? (
            <p className="admin-notice" role="status">
              Application received. The MindEase team will contact you after reviewing your details.
            </p>
          ) : null}
          {applicationStatus === "error" ? (
            <p className="admin-error" role="alert">
              The application could not be sent. Check every required field and try again.
            </p>
          ) : null}
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
          <label className="consent-check">
            <input name="consent" type="checkbox" required />
            <span>
              I consent to MindEase using my submitted professional and contact details to review this application.
            </span>
          </label>
          <button type="submit">Submit for review</button>
          <Link className="admin-back-link" href="/">Return to clinic website</Link>
        </form>
      </section>
    </main>
  );
}
