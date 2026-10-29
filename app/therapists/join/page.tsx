import Link from 'next/link';

export default function JoinTherapistsPage() {
  return (
    <main className="admin-page" id="main-content">
      <section className="admin-login">
        <div className="admin-login-copy">
          <Link className="admin-mini-brand" href="/">
            <span>MindEase</span>
          </Link>
          <p className="admin-kicker">Grow your practice</p>
          <h1>Join our therapist network.</h1>
          <p>
            Reach more clients through a trusted, admin-verified directory. Submit your application
            and our team will review your profile before it goes live.
          </p>
          <div className="admin-feature-list">
            <span>Admin-reviewed profiles</span>
            <span>Secure client enquiries</span>
            <span>Your own dashboard</span>
            <span>Control your availability</span>
          </div>
        </div>

        <form
          className="admin-login-card"
          onSubmit={(e) => {
            e.preventDefault();
            alert('Application submitted! We will review your profile and be in touch shortly.');
          }}
        >
          <div>
            <span>New application</span>
            <h2>Tell us about yourself</h2>
            <p>Fill in your details below. Our admin team will create your login once reviewed.</p>
          </div>

          <div className="admin-form-grid">
            <label>
              Full name
              <input type="text" placeholder="Dr. Jane Doe" required />
            </label>
            <label>
              Email address
              <input type="email" placeholder="jane@example.com" required />
            </label>
            <label>
              Professional title
              <input type="text" placeholder="e.g. Clinical Psychologist" required />
            </label>
            <label>
              Qualifications
              <input type="text" placeholder="e.g. MPhil Psychology, LCSW" required />
            </label>
            <label>
              Session fee (PKR)
              <input type="number" placeholder="4500" min="0" />
            </label>
            <label>
              Years of experience
              <input type="number" placeholder="5" min="0" />
            </label>
            <label className="wide-field">
              Focus areas / specialisations
              <input type="text" placeholder="e.g. Anxiety, Depression, Family therapy" />
            </label>
            <label className="wide-field">
              Languages offered
              <input type="text" placeholder="e.g. Urdu, English" />
            </label>
            <label className="wide-field">
              Professional bio
              <textarea
                placeholder="Tell potential clients about your experience, approach, and what you specialise in..."
                style={{ minHeight: '130px' }}
              />
            </label>

            {/* Photo Upload */}
            <label className="wide-field image-upload-field">
              <span>Profile photo</span>
              <span className="upload-placeholder">JPG, PNG or WebP — up to 5 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
              <strong>Choose photo from your device</strong>
              <small>Your photo will go live only after admin approval.</small>
            </label>

            <button type="submit">Submit application</button>
          </div>
        </form>
      </section>
    </main>
  );
}
