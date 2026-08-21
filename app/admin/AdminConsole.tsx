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

type ContactSettingsForm = {
  whatsappNumber: string;
  displayPhone: string;
  contactEmail: string;
  emailIsPlaceholder: boolean;
};

const defaultContactSettings: ContactSettingsForm = {
  whatsappNumber: "923001234567",
  displayPhone: "+92 300 1234567",
  contactEmail: "hello@mindease.example",
  emailIsPlaceholder: true,
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
    lifecycleStage: string;
    confirmationStatus: string;
    paymentReference: string;
    paymentInstructions: string;
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
    suggestedTherapistId?: string;
    suggestedTherapistName?: string;
    coordinatorNote?: string;
    appointmentId?: string;
  }>;
  pendingProfileChanges?: Array<{
    id: string;
    therapistId: string;
    therapistName: string;
    status: string;
    createdAt: string;
    changes: Record<string, unknown>;
  }>;
  blogPosts?: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    excerpt: string;
    imageUrl: string;
    publishedAt: string;
  }>;
  availabilitySlots?: Array<{
    id: string;
    therapistId: string;
    therapistName: string;
    startsAt: string;
    endsAt: string;
    slotType: string;
    approvalStatus: string;
    isBooked: boolean;
  }>;
  auditLogs?: Array<{
    id: string;
    actorId: string;
    action: string;
    subject: string;
    createdAt: string;
  }>;
  contactSettings?: ContactSettingsForm;
  contactSettingsError?: string;
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
  pendingProfileChanges: [],
  blogPosts: [],
  availabilitySlots: [],
  auditLogs: [],
  contactSettings: defaultContactSettings,
  setupSteps: [
    "Create therapist profiles from this admin panel.",
    "Therapists stay hidden until admin approval.",
    "Approved therapists become live on the public website.",
    "Contact form submissions appear in Client messages.",
  ],
};

type TherapistForm = {
  fullName: string;
  email: string;
  password: string;
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
  email: "",
  password: "",
  title: "Clinical Psychologist",
  qualifications: "",
  specialization: "",
  languages: "Urdu, English",
  yearsExperience: "",
  sessionFee: "",
  profileImageUrl: "",
  bio: "",
};

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  status: "draft" | "published";
};

const blankBlogForm: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  status: "draft",
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
  const [blogForm, setBlogForm] = useState<BlogForm>(blankBlogForm);
  const [contactSettings, setContactSettings] = useState<ContactSettingsForm>(defaultContactSettings);
  const [uploading, setUploading] = useState(false);
  const [lastCreatedTherapist, setLastCreatedTherapist] = useState<{ email: string; loginUrl: string } | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, { therapistId: string; note: string; status: string; slotId: string; paymentInstructions: string }>>({});
  const [appointmentDrafts, setAppointmentDrafts] = useState<Record<string, { paymentReference: string; adminNotes: string }>>({});
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
    setContactSettings(body.contactSettings ?? defaultContactSettings);
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

      setLastCreatedTherapist({
        email: therapistForm.email,
        loginUrl: String(body?.loginUrl ?? "/therapist/login"),
      });
      setTherapistForm(blankTherapistForm);
      setNotice("Therapist login and pending profile created. Share the temporary password securely.");
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

  function updateBlogField(field: keyof BlogForm, value: string) {
    setBlogForm((current) => ({ ...current, [field]: value }));
  }

  function updateContactSetting(field: keyof ContactSettingsForm, value: string | boolean) {
    setContactSettings((current) => ({ ...current, [field]: value }));
  }

  function updateMessageDraft(id: string, field: "therapistId" | "note" | "status" | "slotId" | "paymentInstructions", value: string) {
    setMessageDrafts((current) => ({
      ...current,
      [id]: {
        therapistId: current[id]?.therapistId ?? "",
        note: current[id]?.note ?? "",
        status: current[id]?.status ?? "in_progress",
        slotId: current[id]?.slotId ?? "",
        paymentInstructions: current[id]?.paymentInstructions ?? "",
        [field]: value,
      },
    }));
  }

  function updateAppointmentDraft(id: string, field: "paymentReference" | "adminNotes", value: string) {
    setAppointmentDrafts((current) => ({
      ...current,
      [id]: {
        paymentReference: current[id]?.paymentReference ?? "",
        adminNotes: current[id]?.adminNotes ?? "",
        [field]: value,
      },
    }));
  }

  async function uploadImage(file: File, purpose: "therapist-photo" | "blog-image", therapistId = "") {
    if (!session?.access_token) return "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", purpose);
      if (therapistId) formData.set("therapistId", therapistId);

      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Upload failed.");
      }

      return String(body.url ?? "");
    } finally {
      setUploading(false);
    }
  }

  async function updateInquiry(id: string) {
    if (!session?.access_token) return;

    const draft = messageDrafts[id] ?? { therapistId: "", note: "", status: "in_progress" };
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: draft.status || "in_progress",
          suggestedTherapistId: draft.therapistId,
          coordinatorNote: draft.note,
          slotId: draft.slotId,
          paymentInstructions: draft.paymentInstructions,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update inquiry.");
      }

      setNotice("Inquiry updated with coordinator note and therapist suggestion.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update inquiry.");
    } finally {
      setSaving(false);
    }
  }

  async function reviewProfileChange(id: string, action: "approve" | "decline") {
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/profile-change-requests", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not review profile change.");
      }

      setNotice(action === "approve" ? "Profile changes approved and published." : "Profile changes declined.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not review profile change.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBlogPost(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/blog-posts", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(blogForm),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not save blog post.");
      }

      setBlogForm(blankBlogForm);
      setNotice(blogForm.status === "published" ? "Blog post published." : "Blog post saved as draft.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save blog post.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBlogPost(id: string, action: "publish" | "draft") {
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/blog-posts", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update blog post.");
      }

      setNotice(action === "publish" ? "Blog post published." : "Blog post moved to draft.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update blog post.");
    } finally {
      setSaving(false);
    }
  }

  async function updateAppointment(id: string, action: "mark_payment_pending" | "record_payment" | "confirm_session" | "complete" | "cancel") {
    if (!session?.access_token) return;

    const draft = appointmentDrafts[id] ?? { paymentReference: "", adminNotes: "" };
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id,
          action,
          paymentReference: draft.paymentReference,
          adminNotes: draft.adminNotes,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update appointment.");
      }

      setNotice("Appointment lifecycle updated. Notification record queued only; no external message was sent.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function reviewAvailability(id: string, action: "approve" | "decline", override = false) {
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/availability", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ id, action, override }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not review availability.");
      }

      setNotice(action === "approve" ? "Availability approved." : "Availability declined.");
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not review availability.");
    } finally {
      setSaving(false);
    }
  }

  async function saveContactSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(contactSettings),
      });
      const body = (await response.json()) as { error?: string; settings?: ContactSettingsForm };

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update public contact settings.");
      }

      const verifiedSettings = body.settings ?? contactSettings;
      setContactSettings(verifiedSettings);
      setOverview((current) => ({
        ...current,
        contactSettings: verifiedSettings,
        contactSettingsError: undefined,
      }));
      setNotice(
        `Published and verified: WhatsApp ${verifiedSettings.whatsappNumber}, ${verifiedSettings.contactEmail}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update public contact settings.");
    } finally {
      setSaving(false);
    }
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
  const pendingProfileChanges = overview.pendingProfileChanges ?? [];
  const blogPosts = overview.blogPosts ?? [];
  const availabilitySlots = overview.availabilitySlots ?? [];
  const auditLogs = overview.auditLogs ?? [];

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
          <a href="#profile-changes">Profile edits</a>
          <a href="#therapists">Live therapists</a>
          <a href="#messages">Messages</a>
          <a href="#availability">Availability</a>
          <a href="#site-settings">Site contact</a>
          <a href="#blog">Blog</a>
          <a href="#audit">Audit</a>
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
            <p>therapists and edits pending</p>
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
                <span>Account and profile</span>
                <h2>Create therapist login</h2>
              </div>
            </div>
            <div className="workflow-strip" aria-label="Therapist onboarding steps">
              <div><span>01</span><strong>Set login</strong><small>Email and temporary password</small></div>
              <div><span>02</span><strong>Add profile</strong><small>Details and device photo</small></div>
              <div><span>03</span><strong>Share portal</strong><small>/therapist/login</small></div>
            </div>
            {lastCreatedTherapist ? (
              <div className="credential-success">
                <div>
                  <span>Therapist account ready</span>
                  <strong>{lastCreatedTherapist.email}</strong>
                  <small>Share the temporary password separately. It cannot be viewed again.</small>
                </div>
                <Link href={lastCreatedTherapist.loginUrl}>Open therapist sign in</Link>
              </div>
            ) : null}
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
                  required
                  value={therapistForm.fullName}
                  onChange={(event) => updateTherapistField("fullName", event.target.value)}
                  placeholder="Therapist full name"
                />
              </label>
              <label>
                Therapist login email
                <input
                  required
                  type="email"
                  value={therapistForm.email}
                  onChange={(event) => updateTherapistField("email", event.target.value)}
                  placeholder="therapist@example.com"
                />
              </label>
              <label>
                Temporary password
                <input
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={therapistForm.password}
                  onChange={(event) => updateTherapistField("password", event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                />
                <small>The therapist uses this once at /therapist/login.</small>
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
              <label className="wide-field image-upload-field">
                <span>Profile photo from device</span>
                {therapistForm.profileImageUrl ? (
                  <img src={therapistForm.profileImageUrl} alt="New therapist profile preview" />
                ) : (
                  <span className="upload-placeholder">JPG, PNG or WebP / maximum 5 MB</span>
                )}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void uploadImage(file, "therapist-photo", therapistForm.fullName ? "new-profile" : "")
                      .then((url) => {
                        if (url) updateTherapistField("profileImageUrl", url);
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : "Upload failed."));
                  }}
                  type="file"
                />
                <strong>{uploading ? "Uploading photo..." : "Choose photo from device"}</strong>
              </label>
              <label className="wide-field">
                Bio
                <textarea
                  value={therapistForm.bio}
                  onChange={(event) => updateTherapistField("bio", event.target.value)}
                  placeholder="Short professional bio for admin review"
                />
              </label>
              <button
                disabled={saving || uploading || !therapistForm.fullName || !therapistForm.email || therapistForm.password.length < 8}
                type="submit"
              >
                {saving ? "Saving..." : "Create pending profile"}
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

          <article className="admin-panel wide" id="profile-changes">
            <div className="admin-panel-head">
              <div>
                <span>Therapist-originated edits</span>
                <h2>Pending public profile changes</h2>
              </div>
            </div>
            <div className="admin-list">
              {pendingProfileChanges
                .filter((change) => change.status === "pending")
                .map((change) => (
                  <div key={change.id}>
                    <strong>{change.therapistName}</strong>
                    <p>{change.createdAt ? new Date(change.createdAt).toLocaleString("en-GB") : "Submitted"}</p>
                    <small>{Object.keys(change.changes).join(", ") || "No field summary"}</small>
                    <pre className="admin-json-preview">{JSON.stringify(change.changes, null, 2)}</pre>
                    <div className="admin-actions">
                      <button disabled={saving} onClick={() => void reviewProfileChange(change.id, "approve")} type="button">
                        Approve and publish
                      </button>
                      <button disabled={saving} onClick={() => void reviewProfileChange(change.id, "decline")} type="button">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              {pendingProfileChanges.filter((change) => change.status === "pending").length === 0 ? (
                <div className="empty-state compact">
                  <strong>No therapist edits waiting.</strong>
                  <p>Therapist dashboard submissions will appear here before public publication.</p>
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
                  <p>
                    {appointment.time}
                    <br />
                    {appointment.lifecycleStage} / {appointment.confirmationStatus}
                  </p>
                  <em>{appointment.status}</em>
                  <b>{appointment.amount}</b>
                  <label>
                    Payment reference
                    <input
                      value={appointmentDrafts[appointment.id]?.paymentReference ?? appointment.paymentReference ?? ""}
                      onChange={(event) => updateAppointmentDraft(appointment.id, "paymentReference", event.target.value)}
                      placeholder="Manual receipt/reference"
                    />
                  </label>
                  <label>
                    Admin notes
                    <input
                      value={appointmentDrafts[appointment.id]?.adminNotes ?? ""}
                      onChange={(event) => updateAppointmentDraft(appointment.id, "adminNotes", event.target.value)}
                      placeholder="Internal note"
                    />
                  </label>
                  <div className="admin-actions">
                    <button disabled={saving} onClick={() => void updateAppointment(appointment.id, "mark_payment_pending")} type="button">
                      Payment pending
                    </button>
                    <button disabled={saving} onClick={() => void updateAppointment(appointment.id, "record_payment")} type="button">
                      Record payment
                    </button>
                    <button disabled={saving} onClick={() => void updateAppointment(appointment.id, "confirm_session")} type="button">
                      Confirm session
                    </button>
                    <button disabled={saving} onClick={() => void updateAppointment(appointment.id, "complete")} type="button">
                      Complete
                    </button>
                    <button disabled={saving} onClick={() => void updateAppointment(appointment.id, "cancel")} type="button">
                      Cancel
                    </button>
                  </div>
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
                <h2>Client inquiries</h2>
              </div>
            </div>
            <div className="admin-list compact">
              {messages.map((message) => (
                <div key={message.id}>
                  <strong>{message.name}</strong>
                  <p>{message.topic}</p>
                  <small>{message.contact}</small>
                  {message.suggestedTherapistName ? (
                    <small>Suggested: {message.suggestedTherapistName}</small>
                  ) : null}
                  {message.coordinatorNote ? <small>{message.coordinatorNote}</small> : null}
                  <em>{message.status}</em>
                  <label>
                    Suggest therapist
                    <select
                      value={messageDrafts[message.id]?.therapistId ?? message.suggestedTherapistId ?? ""}
                      onChange={(event) => updateMessageDraft(message.id, "therapistId", event.target.value)}
                    >
                      <option value="">No therapist selected</option>
                      {therapists.map((therapist) => (
                        <option key={therapist.id} value={therapist.id}>
                          {therapist.name} - {therapist.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Suggested slot
                    <select
                      value={messageDrafts[message.id]?.slotId ?? ""}
                      onChange={(event) => updateMessageDraft(message.id, "slotId", event.target.value)}
                    >
                      <option value="">No slot selected</option>
                      {availabilitySlots
                        .filter((slot) =>
                          slot.approvalStatus === "approved" &&
                          slot.slotType === "available" &&
                          !slot.isBooked &&
                          (!messageDrafts[message.id]?.therapistId || slot.therapistId === messageDrafts[message.id]?.therapistId)
                        )
                        .slice(0, 20)
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.therapistName} - {slot.startsAt ? new Date(slot.startsAt).toLocaleString("en-GB") : "slot"}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={messageDrafts[message.id]?.status ?? message.status ?? "in_progress"}
                      onChange={(event) => updateMessageDraft(message.id, "status", event.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="closed">Closed</option>
                      <option value="spam">Spam</option>
                    </select>
                  </label>
                  <label>
                    Coordinator note
                    <textarea
                      value={messageDrafts[message.id]?.note ?? message.coordinatorNote ?? ""}
                      onChange={(event) => updateMessageDraft(message.id, "note", event.target.value)}
                      placeholder="Preferred therapist unavailable; suggested another evening-slot option."
                    />
                  </label>
                  <label>
                    Payment instructions
                    <textarea
                      value={messageDrafts[message.id]?.paymentInstructions ?? ""}
                      onChange={(event) => updateMessageDraft(message.id, "paymentInstructions", event.target.value)}
                      placeholder="Manual placeholder only. Do not enter real payment gateway credentials here."
                    />
                  </label>
                  <div className="admin-actions">
                    <button disabled={saving} onClick={() => void updateInquiry(message.id)} type="button">
                      Save inquiry update
                    </button>
                  </div>
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

          <article className="admin-panel wide" id="availability">
            <div className="admin-panel-head">
              <div>
                <span>Availability approval</span>
                <h2>Recurring slots and blocked time</h2>
              </div>
            </div>
            <div className="admin-list">
              {availabilitySlots.map((slot) => (
                <div key={slot.id}>
                  <strong>{slot.therapistName}</strong>
                  <p>
                    {slot.startsAt ? new Date(slot.startsAt).toLocaleString("en-GB") : "No start"} -{" "}
                    {slot.endsAt ? new Date(slot.endsAt).toLocaleString("en-GB") : "No end"}
                  </p>
                  <small>{slot.slotType} / {slot.isBooked ? "booked" : "open"}</small>
                  <em>{slot.approvalStatus}</em>
                  <div className="admin-actions">
                    <button disabled={saving} onClick={() => void reviewAvailability(slot.id, "approve")} type="button">
                      Approve
                    </button>
                    <button disabled={saving} onClick={() => void reviewAvailability(slot.id, "approve", true)} type="button">
                      Override approve
                    </button>
                    <button disabled={saving} onClick={() => void reviewAvailability(slot.id, "decline")} type="button">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {availabilitySlots.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No availability submitted.</strong>
                  <p>Therapist recurring slots and blocked times will appear here for admin approval.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel wide" id="site-settings">
            <div className="admin-panel-head">
              <div>
                <span>Public website</span>
                <h2>WhatsApp, phone, and email</h2>
              </div>
            </div>
            <form className="admin-form-grid" onSubmit={saveContactSettings}>
              {overview.contactSettingsError ? (
                <p className="admin-error wide-field">{overview.contactSettingsError}</p>
              ) : null}
              <label>
                WhatsApp number
                <input
                  inputMode="tel"
                  onChange={(event) => updateContactSetting("whatsappNumber", event.target.value)}
                  placeholder="923001234567"
                  value={contactSettings.whatsappNumber}
                />
                <small>Include country code and digits only. This builds the wa.me link.</small>
              </label>
              <label>
                Public phone display
                <input
                  inputMode="tel"
                  onChange={(event) => updateContactSetting("displayPhone", event.target.value)}
                  placeholder="+92 300 1234567"
                  value={contactSettings.displayPhone}
                />
                <small>This formatted version is shown to visitors.</small>
              </label>
              <label className="wide-field">
                Contact email
                <input
                  onChange={(event) => updateContactSetting("contactEmail", event.target.value)}
                  placeholder="hello@example.com"
                  type="email"
                  value={contactSettings.contactEmail}
                />
              </label>
              <label className="wide-field consent-check">
                <input
                  checked={contactSettings.emailIsPlaceholder}
                  onChange={(event) => updateContactSetting("emailIsPlaceholder", event.target.checked)}
                  type="checkbox"
                />
                <span>
                  Mark this email as temporary. Temporary addresses are displayed as a notice and are not clickable.
                </span>
              </label>
              <button
                disabled={saving || !contactSettings.whatsappNumber || !contactSettings.displayPhone || !contactSettings.contactEmail}
                type="submit"
              >
                {saving ? "Saving..." : "Publish contact settings"}
              </button>
            </form>
          </article>

          <article className="admin-panel wide" id="blog">
            <div className="admin-panel-head">
              <div>
                <span>CMS</span>
                <h2>Create and publish blog posts</h2>
              </div>
            </div>
            <form className="admin-form-grid" onSubmit={saveBlogPost}>
              <label>
                Title
                <input
                  value={blogForm.title}
                  onChange={(event) => updateBlogField("title", event.target.value)}
                  placeholder="How therapy matching works"
                />
              </label>
              <label>
                Slug
                <input
                  value={blogForm.slug}
                  onChange={(event) => updateBlogField("slug", event.target.value)}
                  placeholder="therapy-matching"
                />
              </label>
              <label>
                Image URL
                <input
                  value={blogForm.imageUrl}
                  onChange={(event) => updateBlogField("imageUrl", event.target.value)}
                  placeholder="Upload through Supabase Storage below"
                />
              </label>
              <label>
                Upload image
                <input
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void uploadImage(file, "blog-image")
                      .then((url) => {
                        if (url) updateBlogField("imageUrl", url);
                      })
                      .catch((err) => setError(err instanceof Error ? err.message : "Upload failed."));
                  }}
                  type="file"
                />
              </label>
              <label>
                Status
                <select
                  value={blogForm.status}
                  onChange={(event) => updateBlogField("status", event.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="wide-field">
                Excerpt
                <textarea
                  value={blogForm.excerpt}
                  onChange={(event) => updateBlogField("excerpt", event.target.value)}
                  placeholder="Short summary shown on the landing page."
                />
              </label>
              <label className="wide-field">
                Body
                <textarea
                  value={blogForm.body}
                  onChange={(event) => updateBlogField("body", event.target.value)}
                  placeholder="Article body for the CMS record."
                />
              </label>
              <button disabled={saving || !blogForm.title} type="submit">
                {saving ? "Saving..." : "Save blog post"}
              </button>
            </form>
            <div className="admin-list">
              {blogPosts.map((post) => (
                <div key={post.id}>
                  <strong>{post.title}</strong>
                  <p>{post.excerpt}</p>
                  <small>{post.slug}</small>
                  <em>{post.status}</em>
                  <div className="admin-actions">
                    <button disabled={saving} onClick={() => void updateBlogPost(post.id, "publish")} type="button">
                      Publish
                    </button>
                    <button disabled={saving} onClick={() => void updateBlogPost(post.id, "draft")} type="button">
                      Move to draft
                    </button>
                  </div>
                </div>
              ))}
              {blogPosts.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No CMS posts yet.</strong>
                  <p>Create a draft or published wellbeing post with a relevant image.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel wide" id="audit">
            <div className="admin-panel-head">
              <div>
                <span>Audit trail</span>
                <h2>Recent admin and therapist actions</h2>
              </div>
            </div>
            <div className="admin-list">
              {auditLogs.map((log) => (
                <div key={log.id}>
                  <strong>{log.action}</strong>
                  <p>{log.subject || "No subject"}</p>
                  <small>{log.createdAt ? new Date(log.createdAt).toLocaleString("en-GB") : "No timestamp"}</small>
                  <em>{log.actorId || "system"}</em>
                </div>
              ))}
              {auditLogs.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No audit records yet.</strong>
                  <p>Approvals, assignments, uploads, CMS changes and appointment updates will be recorded here.</p>
                </div>
              ) : null}
            </div>
          </article>


        </section>
      </section>
    </main>
  );
}
