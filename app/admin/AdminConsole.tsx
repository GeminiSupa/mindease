"use client";

import { useEffect, useMemo, useState } from "react";
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

type Overview = {
  user?: {
    email?: string;
    role?: string;
  };
  stats?: {
    appointmentsToday: number;
    pendingRequests: number;
    activeTherapists: number;
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
  therapists?: Array<{
    name: string;
    role: string;
    focus: string;
    status: string;
  }>;
  messages?: Array<{
    name: string;
    topic: string;
    status: string;
  }>;
  setupSteps?: string[];
};

const sampleOverview: Overview = {
  stats: {
    appointmentsToday: 8,
    pendingRequests: 14,
    activeTherapists: 5,
    paidThisMonth: "PKR 428k",
  },
  appointments: [
    {
      id: "A-1042",
      client: "New intake",
      therapist: "Aneela Mushtaq",
      time: "Today, 7:30 PM",
      status: "Payment pending",
      amount: "PKR 4,500",
    },
    {
      id: "A-1043",
      client: "Follow-up",
      therapist: "Saeed Anwar",
      time: "Tomorrow, 6:00 PM",
      status: "Confirmed",
      amount: "PKR 5,000",
    },
    {
      id: "A-1044",
      client: "Couple session",
      therapist: "Ishrat Noureen",
      time: "Sat, 8:00 PM",
      status: "Needs review",
      amount: "PKR 6,000",
    },
  ],
  therapists: [
    {
      name: "Aneela Mushtaq",
      role: "Clinical Psychologist",
      focus: "Assessment, psychotherapy, family counselling",
      status: "Available",
    },
    {
      name: "Mujahid Iqbal",
      role: "Online Therapist",
      focus: "OCD, trauma, addiction, workplace distress",
      status: "Online",
    },
    {
      name: "Romana Younas",
      role: "Clinical Psychologist",
      focus: "Crisis support, psychodiagnostics, stress",
      status: "Limited slots",
    },
  ],
  messages: [
    { name: "Website visitor", topic: "First session pricing", status: "Open" },
    { name: "Returning client", topic: "Reschedule request", status: "Open" },
    { name: "Therapist", topic: "Availability update", status: "Done" },
  ],
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
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const firstName = useMemo(() => {
    return session?.user?.email?.split("@")[0] ?? "Admin";
  }, [session?.user?.email]);

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
      setNotice("Signed in. Checking admin access...");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.access_token) return;

    let cancelled = false;

    async function run() {
      const response = await fetch("/api/admin/overview", {
        headers: {
          authorization: `Bearer ${session?.access_token}`,
        },
      });
      const body = (await response.json()) as Overview & { error?: string };

      if (cancelled) return;

      if (!response.ok) {
        setOverview({ ...sampleOverview, setupSteps: body.setupSteps });
        setError(body.error ?? "Admin access is not configured for this account.");
        return;
      }

      setError("");
      setOverview(body);
      setNotice("Admin access confirmed.");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  function signOut() {
    setSession(null);
    setOverview(null);
    setError("");
    setNotice("");
    window.localStorage.removeItem("mindease-admin-session");
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
            <h1>Manage bookings like a modern healthcare marketplace.</h1>
            <p>
              Inspired by Oladoc-style workflows: therapist availability,
              appointment requests, intake status, payments, and client messages
              in one protected admin space.
            </p>
            <div className="admin-feature-list">
              <span>Supabase Auth</span>
              <span>Admin-only server data</span>
              <span>Payments and scheduling ready</span>
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
              <p>Use the confirmed Supabase Auth email and password. No magic link or email SMTP is required.</p>
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

  const current = overview ?? sampleOverview;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-mini-brand" href="/">
          <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
          <span>MindEase</span>
        </Link>
        <nav aria-label="Admin sections">
          <a href="#overview">Overview</a>
          <a href="#appointments">Appointments</a>
          <a href="#therapists">Therapists</a>
          <a href="#messages">Messages</a>
          <a href="#setup">Setup</a>
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
            Search clients, therapists, slots
          </div>
        </header>

        {error ? (
          <section className="admin-warning">
            <strong>{error}</strong>
            <p>
              The dashboard preview is visible, but live admin data requires one
              admin rule in Supabase.
            </p>
          </section>
        ) : null}
        {notice ? <p className="admin-notice inline">{notice}</p> : null}

        <section className="admin-kpis" aria-label="Clinic metrics">
          <article>
            <span>Today</span>
            <strong>{current.stats?.appointmentsToday ?? 0}</strong>
            <p>appointments</p>
          </article>
          <article>
            <span>Queue</span>
            <strong>{current.stats?.pendingRequests ?? 0}</strong>
            <p>pending requests</p>
          </article>
          <article>
            <span>Team</span>
            <strong>{current.stats?.activeTherapists ?? 0}</strong>
            <p>active therapists</p>
          </article>
          <article>
            <span>Revenue</span>
            <strong>{current.stats?.paidThisMonth ?? "PKR 0"}</strong>
            <p>this month</p>
          </article>
        </section>

        <section className="admin-grid">
          <article className="admin-panel wide" id="appointments">
            <div className="admin-panel-head">
              <div>
                <span>Scheduling</span>
                <h2>Appointment requests</h2>
              </div>
              <button type="button">New booking</button>
            </div>
            <div className="admin-table">
              {(current.appointments ?? []).map((appointment) => (
                <div className="admin-row" key={appointment.id}>
                  <span>{appointment.id}</span>
                  <strong>{appointment.client}</strong>
                  <p>{appointment.therapist}</p>
                  <p>{appointment.time}</p>
                  <em>{appointment.status}</em>
                  <b>{appointment.amount}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel" id="therapists">
            <div className="admin-panel-head">
              <div>
                <span>Provider network</span>
                <h2>Therapists</h2>
              </div>
            </div>
            <div className="admin-list">
              {(current.therapists ?? []).map((therapist) => (
                <div key={therapist.name}>
                  <strong>{therapist.name}</strong>
                  <p>{therapist.role}</p>
                  <small>{therapist.focus}</small>
                  <em>{therapist.status}</em>
                </div>
              ))}
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
              {(current.messages ?? []).map((message) => (
                <div key={`${message.name}-${message.topic}`}>
                  <strong>{message.name}</strong>
                  <p>{message.topic}</p>
                  <em>{message.status}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel wide" id="setup">
            <div className="admin-panel-head">
              <div>
                <span>Supabase setup</span>
                <h2>Admin access rules</h2>
              </div>
            </div>
            <div className="setup-list">
              {(current.setupSteps ?? [
                "Create Supabase Auth users for admin staff.",
                "Add admins to profiles.role = 'admin' or admin_users.",
                "Store service-role key only in server environment variables.",
                "Keep RLS enabled on client-facing tables.",
              ]).map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
