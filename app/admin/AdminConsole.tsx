"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminSession = {
  user?: { id?: string; email?: string };
};

type AdminTherapist = {
  id: string;
  name: string;
  role: string;
  focus: string;
  status: string;
  approvalStatus: string;
  isActive: boolean;
  qualifications?: string;
  email?: string;
};

type Appointment = {
  id: string;
  client: string;
  therapist: string;
  time: string;
  status: string;
  amount: string;
  contact: string;
};

type ClientMessage = {
  id: string;
  name: string;
  topic: string;
  message: string;
  status: string;
  contact: string;
  createdAt: string;
};

type Overview = {
  user?: { email?: string; role?: string };
  stats?: {
    appointmentsToday: number;
    pendingRequests: number;
    activeTherapists: number;
    pendingTherapists: number;
    openMessages: number;
    paidThisMonth: string;
  };
  appointments?: Appointment[];
  therapists?: AdminTherapist[];
  pendingTherapists?: AdminTherapist[];
  messages?: ClientMessage[];
  updatedAt?: string;
};

type TherapistForm = {
  fullName: string;
  email: string;
  title: string;
  qualifications: string;
  specialization: string;
  languages: string;
  yearsExperience: string;
  sessionFee: string;
  profileImageUrl: string;
  bio: string;
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
};

const blankTherapistForm: TherapistForm = {
  fullName: "",
  email: "",
  title: "Clinical Psychologist",
  qualifications: "",
  specialization: "",
  languages: "Urdu, English",
  yearsExperience: "",
  sessionFee: "",
  profileImageUrl: "",
  bio: "",
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string, includeTime = true) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Karachi",
  }).format(date);
}

function contactHref(contact: string) {
  if (!contact) return "";
  return contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, "")}`;
}

export function AdminConsole() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [activeAction, setActiveAction] = useState("");
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [therapistForm, setTherapistForm] = useState<TherapistForm>(blankTherapistForm);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const firstName = useMemo(() => {
    return session?.user?.email?.split("@")[0] ?? "Admin";
  }, [session?.user?.email]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const body = (await response.json()) as Overview & { error?: string };
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) setSession(null);
        setOverview(body.stats ? body : emptyOverview);
        throw new Error(body.error ?? "We could not load live clinic data.");
      }
      setError("");
      setOverview(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not load live clinic data.");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as AdminSession;
      })
      .then((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setCheckingSession(false);
        if (nextSession) void loadOverview();
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [loadOverview]);

  async function signIn() {
    setLoginLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Login failed");
      setSession(body as AdminSession);
      setPassword("");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setSession(null);
    setOverview(emptyOverview);
    setError("");
    setNotice("");
  }

  async function runAction(key: string, url: string, body: Record<string, unknown>, success: string) {
    setActiveAction(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "The update could not be saved.");
      setNotice(success);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The update could not be saved.");
    } finally {
      setActiveAction("");
    }
  }

  async function inviteTherapist() {
    const key = "invite";
    setActiveAction(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/create-therapist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(therapistForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "The invitation could not be sent.");
      setTherapistForm(blankTherapistForm);
      setShowInvite(false);
      setNotice("Invitation sent. The profile is pending review and remains unpublished.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The invitation could not be sent.");
    } finally {
      setActiveAction("");
    }
  }

  function reviewTherapist(therapist: AdminTherapist, action: "approve" | "reject" | "hide") {
    let reason = "";
    if (action === "approve") {
      if (!window.confirm(`Publish ${therapist.name} on the public website?`)) return;
    } else {
      reason = window.prompt(
        action === "reject" ? "Reason for rejection (required):" : "Reason for hiding this profile:",
      )?.trim() ?? "";
      if (!reason) return;
    }
    void runAction(
      `therapist-${therapist.id}`,
      "/api/admin/therapists",
      { id: therapist.id, action, reason },
      action === "approve" ? `${therapist.name} is now published.` : `${therapist.name} was updated.`,
    );
  }

  function updateAppointment(appointment: Appointment, action: "confirm" | "complete" | "cancel" | "no_show") {
    let reason = "";
    if (action === "cancel") {
      reason = window.prompt("Cancellation reason (required):")?.trim() ?? "";
      if (!reason) return;
    } else if (!window.confirm(`${formatStatus(action)} this appointment for ${appointment.client}?`)) {
      return;
    }
    void runAction(
      `appointment-${appointment.id}`,
      "/api/admin/appointments",
      { id: appointment.id, action, reason },
      `Appointment marked ${formatStatus(action).toLowerCase()}.`,
    );
  }

  function updateMessage(message: ClientMessage, status: "open" | "in_progress" | "closed" | "spam") {
    void runAction(
      `message-${message.id}`,
      "/api/admin/messages",
      { id: message.id, status },
      `Message marked ${formatStatus(status).toLowerCase()}.`,
    );
  }

  function updateTherapistField(field: keyof TherapistForm, value: string) {
    setTherapistForm((current) => ({ ...current, [field]: value }));
  }

  const query = search.trim().toLowerCase();
  const appointments = (overview.appointments ?? []).filter((item) =>
    [item.client, item.therapist, item.status, item.contact].some((value) => value.toLowerCase().includes(query)),
  );
  const pendingTherapists = (overview.pendingTherapists ?? []).filter((item) =>
    [item.name, item.role, item.focus].some((value) => value.toLowerCase().includes(query)),
  );
  const therapists = (overview.therapists ?? []).filter((item) =>
    [item.name, item.role, item.focus].some((value) => value.toLowerCase().includes(query)),
  );
  const messages = (overview.messages ?? []).filter((item) =>
    [item.name, item.contact, item.message, item.status].some((value) => value.toLowerCase().includes(query)),
  );
  const stats = overview.stats ?? emptyOverview.stats!;

  if (checkingSession) {
    return (
      <main className="admin-page admin-session-check" aria-live="polite">
        <Image src="/brand/mindease-app-icon.png" alt="" width={48} height={48} />
        <strong>Opening clinic operations…</strong>
      </main>
    );
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
            <h1>Keep care moving.</h1>
            <p>Review requests, coordinate appointments, and manage the clinical team from one secure workspace.</p>
          </div>

          <form className="admin-login-card" onSubmit={(event) => { event.preventDefault(); void signIn(); }}>
            <div>
              <span>Authorized staff only</span>
              <h2>Sign in</h2>
              <p>Use your MindEase administrator account.</p>
            </div>
            <label>
              Email
              <input autoComplete="email" inputMode="email" onChange={(event) => setEmail(event.target.value)} placeholder="admin@mindease.pk" required type="email" value={email} />
            </label>
            <label>
              Password
              <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required type="password" value={password} />
            </label>
            {error ? <p className="admin-error" role="alert">{error}</p> : null}
            <button disabled={loginLoading || !email || !password} type="submit">
              {loginLoading ? "Signing in…" : "Sign in securely"}
            </button>
            <Link className="admin-back-link" href="/">Return to clinic website</Link>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-mini-brand" href="/">
          <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
          <span>MindEase</span>
        </Link>
        <nav aria-label="Admin sections">
          <a href="#overview">Today</a>
          <a href="#messages">Inbox <span>{stats.openMessages}</span></a>
          <a href="#appointments">Bookings <span>{stats.pendingRequests}</span></a>
          <a href="#therapists">Therapists <span>{stats.pendingTherapists}</span></a>
          <a href="#payments">Payments</a>
        </nav>
        <div className="admin-sidebar-foot">
          <small>{session.user?.email}</small>
          <button onClick={() => void signOut()} type="button">Sign out</button>
        </div>
      </aside>

      <section className="admin-content" id="overview">
        <header className="admin-topbar">
          <div>
            <span>Clinic operations</span>
            <h1>Good day, {firstName}</h1>
            <p>{overview.updatedAt ? `Live data updated ${formatDate(overview.updatedAt)}` : "Preparing live clinic data"}</p>
          </div>
          <div className="admin-topbar-actions">
            <label className="admin-search">
              <span className="sr-only">Search dashboard</span>
              <input onChange={(event) => setSearch(event.target.value)} placeholder="Search people or status" type="search" value={search} />
            </label>
            <button className="admin-secondary-button" disabled={overviewLoading} onClick={() => void loadOverview()} type="button">
              {overviewLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        <div className="admin-feedback" aria-live="polite">
          {error ? <p className="admin-error" role="alert">{error}</p> : null}
          {notice ? <p className="admin-notice">{notice}</p> : null}
        </div>

        <section className="admin-attention" aria-labelledby="attention-title">
          <div>
            <span>Needs attention</span>
            <h2 id="attention-title">
              {stats.pendingRequests + stats.pendingTherapists + stats.openMessages} items need a decision
            </h2>
          </div>
          <div className="admin-attention-links">
            <a href="#appointments"><strong>{stats.pendingRequests}</strong> booking requests</a>
            <a href="#therapists"><strong>{stats.pendingTherapists}</strong> therapist reviews</a>
            <a href="#messages"><strong>{stats.openMessages}</strong> open conversations</a>
          </div>
        </section>

        <section className="admin-kpis" aria-label="Clinic metrics">
          <article><span>Today</span><strong>{stats.appointmentsToday}</strong><p>appointments in PKT</p></article>
          <article><span>Live team</span><strong>{stats.activeTherapists}</strong><p>published therapists</p></article>
          <article id="payments"><span>Paid this month</span><strong className="money">{stats.paidThisMonth}</strong><p>successful payments only</p></article>
        </section>

        <section className="admin-panel wide" id="messages">
          <div className="admin-panel-head">
            <div><span>Inbox</span><h2>Client conversations</h2><p>Assign, follow up, and close every request.</p></div>
            <small>{messages.length} shown</small>
          </div>
          <div className="admin-card-list">
            {messages.map((message) => (
              <article className="admin-message-card" key={message.id}>
                <div className="admin-card-main">
                  <div className="admin-card-title"><strong>{message.name}</strong><em data-status={message.status}>{formatStatus(message.status)}</em></div>
                  <p>{message.message}</p>
                  <small>{formatDate(message.createdAt)} · {message.topic}</small>
                </div>
                <div className="admin-card-side">
                  {message.contact ? <a href={contactHref(message.contact)}>{message.contact}</a> : <span>No contact supplied</span>}
                  <div className="admin-actions">
                    {message.status === "open" ? <button disabled={activeAction === `message-${message.id}`} onClick={() => updateMessage(message, "in_progress")} type="button">Take ownership</button> : null}
                    {message.status !== "closed" ? <button className="secondary" disabled={activeAction === `message-${message.id}`} onClick={() => updateMessage(message, "closed")} type="button">Mark closed</button> : <button disabled={activeAction === `message-${message.id}`} onClick={() => updateMessage(message, "open")} type="button">Reopen</button>}
                  </div>
                </div>
              </article>
            ))}
            {messages.length === 0 ? <div className="empty-state compact"><strong>Inbox is clear.</strong><p>New website requests will appear here with their full message and contact details.</p></div> : null}
          </div>
        </section>

        <section className="admin-panel wide" id="appointments">
          <div className="admin-panel-head">
            <div><span>Bookings</span><h2>Appointment workflow</h2><p>Confirm requests and record session outcomes.</p></div>
            <small>{appointments.length} shown</small>
          </div>
          <div className="admin-table" role="table" aria-label="Appointments">
            <div className="admin-row admin-row-head" role="row">
              <span role="columnheader">Client</span><span role="columnheader">Therapist</span><span role="columnheader">Schedule</span><span role="columnheader">Status</span><span role="columnheader">Amount</span><span role="columnheader">Actions</span>
            </div>
            {appointments.map((appointment) => (
              <article className="admin-row" key={appointment.id} role="row">
                <div role="cell"><strong>{appointment.client}</strong><small>{appointment.contact || `ID ${appointment.id.slice(0, 8)}`}</small></div>
                <p role="cell">{appointment.therapist}</p>
                <p role="cell">{formatDate(appointment.time)}</p>
                <em data-status={appointment.status} role="cell">{formatStatus(appointment.status)}</em>
                <b role="cell">{appointment.amount}</b>
                <div className="admin-actions" role="cell">
                  {["requested", "payment_pending", "reschedule_requested"].includes(appointment.status) ? <button disabled={activeAction === `appointment-${appointment.id}`} onClick={() => updateAppointment(appointment, "confirm")} type="button">Confirm</button> : null}
                  {appointment.status === "confirmed" ? <><button disabled={activeAction === `appointment-${appointment.id}`} onClick={() => updateAppointment(appointment, "complete")} type="button">Complete</button><button className="secondary" disabled={activeAction === `appointment-${appointment.id}`} onClick={() => updateAppointment(appointment, "no_show")} type="button">No-show</button></> : null}
                  {!['completed', 'cancelled', 'no_show'].includes(appointment.status) ? <button className="danger-link" disabled={activeAction === `appointment-${appointment.id}`} onClick={() => updateAppointment(appointment, "cancel")} type="button">Cancel</button> : null}
                </div>
              </article>
            ))}
            {appointments.length === 0 ? <div className="empty-state compact"><strong>No appointments match.</strong><p>Confirmed bookings and new requests will appear here.</p></div> : null}
          </div>
        </section>

        <section className="admin-panel wide" id="therapists">
          <div className="admin-panel-head">
            <div><span>Clinical team</span><h2>Therapist review and publishing</h2><p>Review profile quality before making a therapist public.</p></div>
            <button onClick={() => setShowInvite((value) => !value)} type="button">{showInvite ? "Close form" : "Invite therapist"}</button>
          </div>

          {showInvite ? (
            <form className="admin-form-grid admin-invite-form" onSubmit={(event) => { event.preventDefault(); void inviteTherapist(); }}>
              <div className="wide-field admin-form-intro"><strong>Invite and create a private draft</strong><p>The therapist receives a secure account invitation. Nothing is published until approval.</p></div>
              <label>Full name<input required value={therapistForm.fullName} onChange={(event) => updateTherapistField("fullName", event.target.value)} /></label>
              <label>Email<input required type="email" value={therapistForm.email} onChange={(event) => updateTherapistField("email", event.target.value)} /></label>
              <label>Professional title<input value={therapistForm.title} onChange={(event) => updateTherapistField("title", event.target.value)} /></label>
              <label>Qualifications<input required value={therapistForm.qualifications} onChange={(event) => updateTherapistField("qualifications", event.target.value)} placeholder="MS Clinical Psychology" /></label>
              <label>Languages<input value={therapistForm.languages} onChange={(event) => updateTherapistField("languages", event.target.value)} /></label>
              <label>Experience years<input inputMode="numeric" min="0" type="number" value={therapistForm.yearsExperience} onChange={(event) => updateTherapistField("yearsExperience", event.target.value)} /></label>
              <label>Session fee (PKR)<input inputMode="numeric" min="0" type="number" value={therapistForm.sessionFee} onChange={(event) => updateTherapistField("sessionFee", event.target.value)} /></label>
              <label>Focus areas<input required value={therapistForm.specialization} onChange={(event) => updateTherapistField("specialization", event.target.value)} placeholder="Anxiety, trauma, relationships" /></label>
              <label className="wide-field">Photo URL<input type="url" value={therapistForm.profileImageUrl} onChange={(event) => updateTherapistField("profileImageUrl", event.target.value)} placeholder="https://…" /></label>
              <label className="wide-field">Professional bio<textarea required value={therapistForm.bio} onChange={(event) => updateTherapistField("bio", event.target.value)} /></label>
              <button disabled={activeAction === "invite"} type="submit">{activeAction === "invite" ? "Sending invitation…" : "Send invitation and create draft"}</button>
            </form>
          ) : null}

          <div className="admin-subsection">
            <div className="admin-subsection-head"><h3>Waiting for review</h3><span>{pendingTherapists.length}</span></div>
            <div className="admin-card-grid">
              {pendingTherapists.map((therapist) => (
                <article className="admin-therapist-card" key={therapist.id}>
                  <div className="admin-card-title"><strong>{therapist.name}</strong><em data-status="pending">Pending</em></div>
                  <p>{therapist.role}</p>
                  <small>{therapist.qualifications || "Qualifications not supplied"}</small>
                  <p className="admin-card-detail">{therapist.focus}</p>
                  <div className="admin-review-checks"><span className={therapist.qualifications ? "complete" : ""}>Qualifications</span><span className={therapist.focus ? "complete" : ""}>Focus areas</span></div>
                  <div className="admin-actions"><button disabled={activeAction === `therapist-${therapist.id}`} onClick={() => reviewTherapist(therapist, "approve")} type="button">Approve and publish</button><button className="danger-link" disabled={activeAction === `therapist-${therapist.id}`} onClick={() => reviewTherapist(therapist, "reject")} type="button">Reject</button></div>
                </article>
              ))}
              {pendingTherapists.length === 0 ? <div className="empty-state compact"><strong>No profiles are waiting.</strong><p>New invitations will enter this review queue.</p></div> : null}
            </div>
          </div>

          <div className="admin-subsection">
            <div className="admin-subsection-head"><h3>Published therapists</h3><span>{therapists.length}</span></div>
            <div className="admin-card-grid">
              {therapists.map((therapist) => (
                <article className="admin-therapist-card" key={therapist.id}>
                  <div className="admin-card-title"><strong>{therapist.name}</strong><em data-status="approved">Live</em></div>
                  <p>{therapist.role}</p><small>{therapist.focus}</small><p className="admin-card-detail">Availability: {therapist.status}</p>
                  <div className="admin-actions"><a className="admin-action-link" href="/#therapists" target="_blank">View public site</a><button className="danger-link" disabled={activeAction === `therapist-${therapist.id}`} onClick={() => reviewTherapist(therapist, "hide")} type="button">Hide profile</button></div>
                </article>
              ))}
              {therapists.length === 0 ? <div className="empty-state compact"><strong>No therapists are published.</strong><p>Approved profiles will appear here and on the public website.</p></div> : null}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
