"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type TherapistSession = {
  access_token: string;
  user?: {
    email?: string;
  };
};

type TherapistProfile = {
  id: string;
  full_name: string;
  title?: string;
  qualifications?: string;
  bio?: string;
  specialization?: string;
  languages?: string[];
  profile_image_url?: string;
  session_fee?: number;
  availability_status?: string;
  approval_status?: string;
  is_active?: boolean;
};

type DashboardData = {
  therapist?: TherapistProfile;
  appointments?: Array<{
    id: string;
    client: string;
    time: string;
    status: string;
    concern: string;
  }>;
  slots?: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    isBooked: boolean;
    slotType: string;
    approvalStatus: string;
    recurrenceRule: string;
    notes: string;
  }>;
  changeRequests?: Array<{
    id: string;
    status: string;
    createdAt: string;
    adminNote?: string;
    requestedChanges?: Record<string, unknown>;
  }>;
};

type ProfileForm = {
  title: string;
  qualifications: string;
  bio: string;
  specialization: string;
  languages: string;
  profileImageUrl: string;
  sessionFee: string;
  availabilityStatus: string;
};

const blankForm: ProfileForm = {
  title: "",
  qualifications: "",
  bio: "",
  specialization: "",
  languages: "Urdu, English",
  profileImageUrl: "",
  sessionFee: "",
  availabilityStatus: "Available",
};

const profileFieldNames: Record<string, string> = {
  title: "Professional title",
  qualifications: "Qualifications",
  bio: "Professional bio",
  specialization: "Focus areas",
  languages: "Languages",
  profile_image_url: "Profile photo",
  session_fee: "Session fee",
  availability_status: "Availability",
};

function friendlyLabel(value: string) {
  const spaced = value.replace(/_/g, " ").trim();
  return spaced ? `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}` : "Not set";
}

export default function TherapistDashboard() {
  const [session, setSession] = useState<TherapistSession | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [form, setForm] = useState<ProfileForm>(blankForm);
  const [slotStartsAt, setSlotStartsAt] = useState("");
  const [slotEndsAt, setSlotEndsAt] = useState("");
  const [slotType, setSlotType] = useState("available");
  const [recurrenceRule, setRecurrenceRule] = useState("none");
  const [slotNotes, setSlotNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/therapist/me", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const body = (await response.json()) as DashboardData & { error?: string };

    if (!response.ok) {
      throw new Error(body.error ?? "Could not load therapist dashboard.");
    }

    const therapist = body.therapist;
    setDashboard(body);
    if (therapist) {
      setForm({
        title: therapist.title ?? "",
        qualifications: therapist.qualifications ?? "",
        bio: therapist.bio ?? "",
        specialization: therapist.specialization ?? "",
        languages: therapist.languages?.join(", ") ?? "Urdu, English",
        profileImageUrl: therapist.profile_image_url ?? "",
        sessionFee: therapist.session_fee ? String(therapist.session_fee) : "",
        availabilityStatus: therapist.availability_status ?? "Available",
      });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem("mindease-therapist-session");
        if (!raw) {
          window.location.href = "/therapist/login";
          return;
        }
        const stored = JSON.parse(raw) as TherapistSession;
        if (!stored.access_token) {
          window.location.href = "/therapist/login";
          return;
        }
        setSession(stored);
        void loadDashboard(stored.access_token)
          .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard."))
          .finally(() => setLoading(false));
      } catch {
        window.location.href = "/therapist/login";
      }
    });
  }, [loadDashboard]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitChanges(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/therapist/me", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not submit profile changes.");
      }

      setNotice("Profile changes submitted for admin approval. Public profile remains unchanged until approved.");
      await loadDashboard(session.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit changes.");
    } finally {
      setSaving(false);
    }
  }

  async function addSlot(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/therapist/me", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ slotStartsAt, slotEndsAt, slotType, recurrenceRule, notes: slotNotes }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not add availability slot.");
      }

      setSlotStartsAt("");
      setSlotEndsAt("");
      setSlotNotes("");
      setRecurrenceRule("none");
      setSlotType("available");
      setNotice("Availability submitted for admin approval.");
      await loadDashboard(session.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add slot.");
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    window.localStorage.removeItem("mindease-therapist-session");
    window.location.href = "/therapist/login";
  }

  async function uploadProfilePhoto(file: File) {
    if (!session?.access_token) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "therapist-photo");
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

      updateField("profileImageUrl", String(body.url ?? ""));
      setNotice("Photo uploaded. Submit profile edits to send it for admin approval.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-login">
          <p className="admin-kicker">Loading therapist dashboard</p>
        </section>
      </main>
    );
  }

  const therapist = dashboard.therapist;
  const appointments = dashboard.appointments ?? [];
  const slots = dashboard.slots ?? [];
  const changeRequests = dashboard.changeRequests ?? [];

  return (
    <main className="admin-shell therapist-shell">
      <aside className="admin-sidebar">
        <Link className="admin-mini-brand" href="/">
          <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
          <span>MindEase</span>
        </Link>
        <nav aria-label="Therapist dashboard sections">
          <a href="#overview">Overview</a>
          <a href="#profile">Profile</a>
          <a href="#availability">Availability</a>
          <a href="#appointments">Appointments</a>
          <a href="#reviews">Review queue</a>
        </nav>
        <button onClick={signOut} type="button">Sign out</button>
      </aside>

      <section className="admin-content" id="overview">
        <header className="admin-topbar">
          <div>
            <span>Therapist dashboard</span>
            <h1>{therapist?.full_name ?? session?.user?.email ?? "Therapist"}</h1>
          </div>
          <div className="admin-status-card">
            <span>Public profile</span>
            <strong>{therapist?.is_active ? "Live" : "Hidden"}</strong>
            <small>{friendlyLabel(therapist?.approval_status ?? "pending")}</small>
          </div>
        </header>

        {error ? <p className="admin-error">{error}</p> : null}
        {notice ? <p className="admin-notice inline">{notice}</p> : null}

        <section className="admin-kpis" aria-label="Therapist metrics">
          <article>
            <span>Upcoming</span>
            <strong>{appointments.length}</strong>
            <p>scheduled sessions</p>
          </article>
          <article>
            <span>Open slots</span>
            <strong>{slots.filter((slot) => !slot.isBooked).length}</strong>
            <p>available times</p>
          </article>
          <article>
            <span>Pending edits</span>
            <strong>{changeRequests.filter((request) => request.status === "pending").length}</strong>
            <p>waiting for review</p>
          </article>
          <article>
            <span>Profile</span>
            <strong>{therapist?.is_active ? "Live" : "Hidden"}</strong>
            <p>directory status</p>
          </article>
        </section>

        <section className="admin-grid">
          <article className="admin-panel wide" id="profile">
            <div className="admin-panel-head">
              <div>
                <span>Public profile</span>
                <h2>Update your public profile</h2>
              </div>
            </div>
            <form className="admin-form-grid" onSubmit={submitChanges}>
              <label>
                Professional title
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
              </label>
              <label>
                Qualifications
                <input value={form.qualifications} onChange={(event) => updateField("qualifications", event.target.value)} />
              </label>
              <label>
                Focus areas
                <input value={form.specialization} onChange={(event) => updateField("specialization", event.target.value)} />
              </label>
              <label>
                Languages
                <input value={form.languages} onChange={(event) => updateField("languages", event.target.value)} />
              </label>
              <label>
                Session fee
                <input inputMode="numeric" value={form.sessionFee} onChange={(event) => updateField("sessionFee", event.target.value)} />
              </label>
              <label>
                Availability note
                <input value={form.availabilityStatus} onChange={(event) => updateField("availabilityStatus", event.target.value)} />
              </label>
              <label className="wide-field image-upload-field">
                <span>Profile photo from device</span>
                {form.profileImageUrl ? (
                  <img src={form.profileImageUrl} alt={`${therapist?.full_name ?? "Therapist"} profile preview`} />
                ) : (
                  <span className="upload-placeholder">JPG, PNG or WebP / maximum 5 MB</span>
                )}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadProfilePhoto(file);
                  }}
                  type="file"
                />
                <strong>{saving ? "Uploading or saving..." : "Choose photo from device"}</strong>
                <small>After upload, submit the profile edits below. The new photo goes live only after admin approval.</small>
              </label>
              <label className="wide-field">
                Bio
                <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} />
              </label>
              <button disabled={saving} type="submit">{saving ? "Submitting..." : "Submit edits for approval"}</button>
            </form>
          </article>

          <article className="admin-panel" id="availability">
            <div className="admin-panel-head">
              <div>
                <span>Scheduling</span>
                <h2>Add appointment slot</h2>
              </div>
            </div>
            <form className="admin-form-grid single" onSubmit={addSlot}>
              <label>
                Starts
                <input type="datetime-local" value={slotStartsAt} onChange={(event) => setSlotStartsAt(event.target.value)} required />
              </label>
              <label>
                Ends
                <input type="datetime-local" value={slotEndsAt} onChange={(event) => setSlotEndsAt(event.target.value)} required />
              </label>
              <label>
                Type
                <select value={slotType} onChange={(event) => setSlotType(event.target.value)}>
                  <option value="available">Available</option>
                  <option value="blocked">Blocked/unavailable</option>
                </select>
              </label>
              <label>
                Repeat
                <select value={recurrenceRule} onChange={(event) => setRecurrenceRule(event.target.value)}>
                  <option value="none">Does not repeat</option>
                  <option value="weekly_4">Weekly for 4 weeks</option>
                  <option value="weekly_8">Weekly for 8 weeks</option>
                  <option value="weekly_12">Weekly for 12 weeks</option>
                </select>
              </label>
              <label className="wide-field">
                Notes
                <input value={slotNotes} onChange={(event) => setSlotNotes(event.target.value)} placeholder="Optional context for admin approval" />
              </label>
              <button disabled={saving} type="submit">Submit availability</button>
            </form>
            <div className="admin-list compact">
              {slots.slice(0, 5).map((slot) => (
                <div key={slot.id}>
                  <strong>{slot.startsAt ? new Date(slot.startsAt).toLocaleString("en-GB") : "Slot"}</strong>
                  <p>{slot.endsAt ? `Ends ${new Date(slot.endsAt).toLocaleString("en-GB")}` : "No end time"}</p>
                  <small>{friendlyLabel(slot.slotType)}{slot.recurrenceRule && slot.recurrenceRule !== "none" ? ` · ${friendlyLabel(slot.recurrenceRule)}` : ""}</small>
                  <em>{friendlyLabel(slot.approvalStatus)} · {slot.isBooked ? "Booked" : "Open"}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-panel" id="appointments">
            <div className="admin-panel-head">
              <div>
                <span>Caseload</span>
                <h2>Appointment overview</h2>
              </div>
            </div>
            <div className="admin-list compact">
              {appointments.map((appointment) => (
                <div key={appointment.id}>
                  <strong>{appointment.client}</strong>
                  <p>{appointment.concern}</p>
                  <small>{appointment.time}</small>
                  <em>{appointment.status}</em>
                </div>
              ))}
              {appointments.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No appointment records yet.</strong>
                  <p>Confirmed and requested sessions assigned to you will appear here.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-panel wide" id="reviews">
            <div className="admin-panel-head">
              <div>
                <span>Admin review</span>
                <h2>Submitted profile changes</h2>
              </div>
            </div>
            <div className="admin-list">
              {changeRequests.map((request) => (
                <div key={request.id}>
                  <strong>{friendlyLabel(request.status)}</strong>
                  <p>{request.createdAt ? new Date(request.createdAt).toLocaleString("en-GB") : "Submitted"}</p>
                  <small>
                    {Object.keys(request.requestedChanges ?? {})
                      .map((field) => profileFieldNames[field] ?? friendlyLabel(field))
                      .join(", ") || "No changes listed"}
                  </small>
                  {request.adminNote ? <small>{request.adminNote}</small> : null}
                </div>
              ))}
              {changeRequests.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No submitted changes.</strong>
                  <p>Profile edits you submit will wait here until admin approves or declines them.</p>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
