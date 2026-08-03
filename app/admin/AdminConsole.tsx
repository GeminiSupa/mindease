"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type AdminSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {
    id?: string;
    email?: string;
  };
};

type AdminTherapist = {
  id: string;
  name: string;
  role: string;
  focus: string;
  status: string;
  approvalStatus: string;
  isActive: boolean;
  photo?: string;
};

type Overview = {
  user?: {
    email?: string;
    role?: string;
  };
  stats?: {
    appointmentsToday: number;
    pendingRequests: number;
    activeTherapists: number;
    pendingTherapists: number;
    openMessages: number;
    paidThisMonth: string;
  };
  appointments?: Array<{
    id: string;
    client: string;
    therapist: string;
    time: string;
    status: string;
    amount: string;
  }>;
  therapists?: AdminTherapist[];
  pendingTherapists?: AdminTherapist[];
  messages?: Array<{
    id: string;
    name: string;
    topic: string;
    status: string;
    contact: string;
    createdAt: string;
  }>;
  setupSteps?: string[];
};

const emptyOverview: Overview = {
  stats: {
    appointmentsToday: 0,
    pendingRequests: 0,
    activeTherapists: 0,
    pendingTherapists: 0,
    openMessages: 0,
    paidThisMonth: "PKR 0",
  },
  appointments: [],
  therapists: [],
  pendingTherapists: [],
  messages: [],
  setupSteps: [
    "Create therapist profiles from this admin panel.",
    "Therapists stay hidden until admin approval.",
    "Approved therapists become live on the public website.",
    "Contact form submissions appear in Client messages.",
  ],
};

type TherapistForm = {
  fullName: string;
  title: string;
  qualifications: string;
  specialization: string;
  languages: string;
  yearsExperience: string;
  sessionFee: string;
  profileImageUrl: string;
  bio: string;
};

const blankTherapistForm: TherapistForm = {
  fullName: "",
  title: "Clinical Psychologist",
  qualifications: "",
  specialization: "",
  languages: "Urdu, English",
  yearsExperience: "",
  sessionFee: "",
  profileImageUrl: "",
  bio: "",
};

export function AdminConsole() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem("mindease-admin-session");
      if (!raw) return null;
      const stored = JSON.parse(raw) as AdminSession;
      return stored.access_token ? stored : null;
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [therapistForm, setTherapistForm] = useState<TherapistForm>(blankTherapistForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const firstName = useMemo(() => {
    return session?.user?.email?.split("@")[0] ?? "Admin";
  }, [session?.user?.email]);

  const loadOverview = useCallback(async (accessToken = session?.access_token) => {
    if (!accessToken) return;

    const response = await fetch("/api/admin/overview", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const body = (await response.json()) as Overview & { error?: string };

    if (!response.ok) {
      setOverview({ ...emptyOverview, setupSteps: body.setupSteps ?? emptyOverview.setupSteps });
      setError(body.error ?? "Admin access or Supabase data is not configured yet.");
      return;
    }

    setError("");
    setOverview(body);
  }, [session?.access_token]);

  async function signIn() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Login failed");
      }

      const nextSession = body as AdminSession;
      setSession(nextSession);
      window.localStorage.setItem(
        "mindease-admin-session",
        JSON.stringify(nextSession),
      );
      setNotice("Signed in.");
      await loadOverview(nextSession.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function createTherapist() {
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/therapists", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(therapistForm),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not create therapist.");
      }

      setTherapistForm(blankTherapistForm);
      setNotice("Therapist profile created. It is pending approval and hidden from the website.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create therapist.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTherapist(id: string, action: "approve" | "reject" | "hide") {
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/therapists", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update therapist.");
      }

      setNotice(action === "approve" ? "Therapist approved and published." : "Therapist updated.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update therapist.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!session?.access_token) return;
    const timer = window.setTimeout(() => {
      void loadOverview(session.access_token);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOverview, session?.access_token]);

  function signOut() {
    setSession(null);
    setOverview(emptyOverview);
    setError("");
    setNotice("");
    window.localStorage.removeItem("mindease-admin-session");
  }

  function updateTherapistField(field: keyof TherapistForm, value: string) {
    setTherapistForm((current) => ({ ...current, [field]: value }));
  }

  if (!session) {
    return (
      <main className="admin-page">
        <section className="admin-login">
          <div className="admin-login-copy">
            <Link className="admin-mini-brand" href="/">
              <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
              <span>MindEase Admin</span>
            </Link>
            <p className="admin-kicker">Clinic operations</p>
            <h1>Manage therapist approvals, messages, and bookings.</h1>
            <p>
              Sign in with the Supabase Auth admin account. Therapist profiles
              remain hidden until admin approval publishes them to the website.
            </p>
            <div className="admin-feature-list">
              <span>Password login</span>
              <span>Therapist approval</span>
              <span>Live contact messages</span>
            </div>
          </div>

          <form
            className="admin-login-card"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn();
            }}
          >
            <div>
              <span>Secure login</span>
              <h2>Admin sign in</h2>
              <p>Use the confirmed Supabase Auth email and password.</p>
            </div>
            <label>
              Email
              <input
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@mindease.pk"
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                type="password"
                value={password}
              />
            </label>
            {error ? <p className="admin-error">{error}</p> : null}
            {notice ? <p className="admin-notice">{notice}</p> : null}
            <button disabled={loading || !email || !password} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const stats = overview.stats ?? emptyOverview.stats;
  const appointments = overview.appointments ?? [];
  const therapists = overview.therapists ?? [];
  const pendingTherapists = overview.pendingTherapists ?? [];
  const messages = overview.messages ?? [];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-mini-brand" href="/">
          <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
          <span>MindEase</span>
        </Link>
        <nav aria-label="Admin sections">
          <a href="#overview">Overview</a>
          <a href="#create-therapist">Create therapist</a>
          <a href="#approvals">Approvals</a>
          <a href="#therapists">Live therapists</a>
          <a href="#messages">Messages</a>
        </nav>
        <button onClick={signOut} type="button">
          Sign out
        </button>
      </aside>

      <section className="admin-content" id="overview">
        <header className="admin-topbar">
          <div>
            <span>Welcome back</span>
            <h1>{firstName}</h1>
          </div>
          <div className="admin-search" aria-label="Search placeholder">
            Search clients, therapists, messages
          </div>
        </header>

        {error ? (
          <section className="admin-warning">
            <strong>{error}</strong>
            <p>No demo data is shown. Configure Supabase tables to show live clinic records.</p>
          </section>
        ) : null}
        {notice ? <p className="admin-notice inline">{notice}</p> : null}

        <section className="admin-kpis" aria-label="Clinic metrics">
          <article>
            <span>Today</span>
            <strong>{stats?.appointmentsToday ?? 0}</strong>
            <p>appointments</p>
          </article>
          <article>
            <span>Approval queue</span>
            <strong>{stats?.pendingTherapists ?? 0}</strong>
            <p>therapists pending</p>
          </article>
          <article>
            <span>Live team</span>
            <strong>{stats?.activeTherapists ?? 0}</strong>
            <p>published therapists</p>
          </article>
          <article>
            <span>Messages</span>
            <strong>{stats?.openMessages ?? 0}</strong>
            <p>open messages</p>
          </article>
        </section>

        <section className="admin-grid">
          <article className="admin-panel wide" id="create-therapist">
            <div className="admin-panel-head">
              <div>
                <span>User management</span>
                <h2>Create therapist profile</h2>
              </div>
            </div>
            <form
              className="admin-form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void createTherapist();
              }}
            >
              <label>
                Full name
                <input
                  value={therapistForm.fullName}
                  onChange={(event) => updateTherapistField("fullName", event.target.value)}
                  placeholder="Therapist full name"
                />
              </label>
              <label>
                Title
                <input
                  value={therapistForm.title}
                  onChange={(event) => updateTherapistField("title", event.target.value)}
                  placeholder="Clinical Psychologist"
                />
              </label>
              <label>
                Qualifications
                <input
                  value={therapistForm.qualifications}
                  onChange={(event) => updateTherapistField("qualifications", event.target.value)}
                  placeholder="MS Clinical Psychology"
                />
              </label>
              <label>
                Languages
                <input
                  value={therapistForm.languages}
                  onChange={(event) => updateTherapistField("languages", event.target.value)}
                  placeholder="Urdu, English"
                />
              </label>
              <label>
                Experience years
                <input
                  inputMode="numeric"
                  value={therapistForm.yearsExperience}
                  onChange={(event) => updateTherapistField("yearsExperience", event.target.value)}
                  placeholder="5"
                />
              </label>
              <label>
                Session fee
                <input
                  inputMode="numeric"
                  value={therapistForm.sessionFee}
                  onChange={(event) => updateTherapistField("sessionFee", event.target.value)}
                  placeholder="4500"
                />
              </label>
              <label>
                Focus areas
                <input
                  value={therapistForm.specialization}
                  onChange={(event) => updateTherapistField("specialization", event.target.value)}
                  placeholder="Anxiety, depression, relationships"
                />
              </label>
              <label>
                Photo URL
                <input
                  value={therapistForm.profileImageUrl}
                  onChange={(event) => updateTherapistField("profileImageUrl", event.target.value)}
                  placeholder="Supabase Storage public URL"
                />
              </label>
              <label className="wide-field">
                Bio
                <textarea
                  value={therapistForm.bio}
                  onChange={(event) => updateTherapistField("bio", event.target.value)}
                  placeholder="Short professional bio for admin review"
                />
              </label>
              <button disabled={saving || !therapistForm.fullName} type="submit">
                {saving ? "Saving..." : "Create as pending"}
              </button>
            </form>
          </article>

          <article className="admin-panel wide" id="approvals">
            <div className="admin-panel-head">
              <div>
                <span>Approval queue</span>
                <h2>Therapist profiles waiting for admin</h2>
              </div>
            </div>
            <div className="admin-list">
              {pendingTherapists.map((therapist) => (
                <div key={therapist.id}>
                  <strong>{therapist.name}</strong>
                  <p>{therapist.role}</p>
                  <small>{therapist.focus}</small>
                  <em>{therapist.approvalStatus}</em>
                  <div className="admin-actions">
                    <button disabled={saving} onClick={() => void updateTherapist(therapist.id, "approve")} type="button">
                      Approve live
                    </button>
                    <button disabled={saving} onClick={() => void updateTherapist(therapist.id, "reject")} type="button">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {pendingTherapists.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No therapist approvals waiting.</strong>
                  <p>Created therapist profiles will appear here before going live.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel wide" id="appointments">
            <div className="admin-panel-head">
              <div>
                <span>Scheduling</span>
                <h2>Appointment requests</h2>
              </div>
            </div>
            <div className="admin-table">
              {appointments.map((appointment) => (
                <div className="admin-row" key={appointment.id}>
                  <span>{appointment.id}</span>
                  <strong>{appointment.client}</strong>
                  <p>{appointment.therapist}</p>
                  <p>{appointment.time}</p>
                  <em>{appointment.status}</em>
                  <b>{appointment.amount}</b>
                </div>
              ))}
              {appointments.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No live appointments yet.</strong>
                  <p>Booking requests from Supabase will appear here.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel" id="therapists">
            <div className="admin-panel-head">
              <div>
                <span>Live website</span>
                <h2>Published therapists</h2>
              </div>
            </div>
            <div className="admin-list">
              {therapists.map((therapist) => (
                <div key={therapist.id}>
                  <strong>{therapist.name}</strong>
                  <p>{therapist.role}</p>
                  <small>{therapist.focus}</small>
                  <em>{therapist.status}</em>
                  <div className="admin-actions">
                    <button disabled={saving} onClick={() => void updateTherapist(therapist.id, "hide")} type="button">
                      Hide from site
                    </button>
                  </div>
                </div>
              ))}
              {therapists.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No therapists are live.</strong>
                  <p>Approve a therapist profile to publish it on the landing page.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel" id="messages">
            <div className="admin-panel-head">
              <div>
                <span>Contact center</span>
                <h2>Client messages</h2>
              </div>
            </div>
            <div className="admin-list compact">
              {messages.map((message) => (
                <div key={message.id}>
                  <strong>{message.name}</strong>
                  <p>{message.topic}</p>
                  <small>{message.contact}</small>
                  <em>{message.status}</em>
                </div>
              ))}
              {messages.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No contact messages yet.</strong>
                  <p>Website contact form submissions will appear here.</p>
                </div>
              ) : null}
            </div>
          </article>


        </section>
      </section>
    </main>
  );
}
