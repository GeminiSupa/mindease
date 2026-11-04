"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { THERAPIST_COUNTRIES, countryFlag } from "../../countries";
import ClinicalWorkspace from "./ClinicalWorkspace";
import ReferralInbox from "./ReferralInbox";

type TherapistSession = {
  access_token?: string;
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
  country_of_origin?: string;
  country_code?: string;
};

type DashboardData = {
  user?: {
    email?: string;
  };
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
  countryOfOrigin: string;
  countryCode: string;
};

type TherapistSection =
  | "overview"
  | "profile"
  | "availability"
  | "appointments"
  | "referrals"
  | "reviews"
  | "clinical-records"
  | "security";

const therapistSections: Array<{ id: TherapistSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "availability", label: "Availability" },
  { id: "appointments", label: "Appointments" },
  { id: "referrals", label: "Referral inbox" },
  { id: "reviews", label: "Review queue" },
  { id: "clinical-records", label: "Clinical records" },
  { id: "security", label: "Security" },
];

function isTherapistSection(value: string): value is TherapistSection {
  return therapistSections.some((section) => section.id === value);
}

const blankForm: ProfileForm = {
  title: "",
  qualifications: "",
  bio: "",
  specialization: "",
  languages: "Urdu, English",
  profileImageUrl: "",
  sessionFee: "",
  countryOfOrigin: "Pakistan",
  countryCode: "PK",
};

const profileFieldNames: Record<string, string> = {
  title: "Professional title",
  qualifications: "Qualifications",
  bio: "Professional bio",
  specialization: "Focus areas",
  languages: "Languages",
  profile_image_url: "Profile photo",
  session_fee: "Session fee",
  country_of_origin: "Country of origin",
  country_code: "Country code",
};

function friendlyLabel(value: string) {
  const spaced = value.replace(/_/g, " ").trim();
  return spaced ? `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}` : "Not set";
}

function apiHeaders(accessToken?: string, json = false) {
  return {
    ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    ...(json ? { "content-type": "application/json" } : {}),
  };
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
  const [timeZone, setTimeZone] = useState("your local timezone");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState<TherapistSection>("overview");

  const loadDashboard = useCallback(async (accessToken?: string) => {
    const response = await fetch("/api/therapist/me", {
      headers: apiHeaders(accessToken),
      cache: "no-store",
    });
    const body = (await response.json()) as DashboardData & { error?: string; status?: number };

    if (!response.ok) {
      const err = new Error(body.error ?? "Could not load therapist dashboard.") as Error & { status: number };
      err.status = response.status;
      throw err;
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
        countryOfOrigin: therapist.country_of_origin ?? "Pakistan",
        countryCode: therapist.country_code ?? "PK",
      });
    }
    return body;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetch("/api/therapist/session", { cache: "no-store" })
        .then(async (sessionResponse) => {
          if (sessionResponse.status === 401) {
            window.location.href = "/therapist/login";
            return null;
          }
          if (!sessionResponse.ok) {
            const sessionBody = (await sessionResponse.json().catch(() => ({}))) as { error?: string };
            throw new Error(sessionBody.error ?? "Session check failed.");
          }
          return loadDashboard();
        })
        .then((body) => {
          if (body) setSession({ user: body.user });
        })
        .catch((err: unknown) => {
          const status = (err as { status?: number }).status;
          if (status === 401) {
            window.location.href = "/therapist/login";
          } else {
            setError(
              err instanceof Error
                ? err.message
                : "Could not load dashboard. Please try again."
            );
          }
        })
        .finally(() => setLoading(false));
    });
  }, [loadDashboard]);

  useEffect(() => {
    queueMicrotask(() => {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "your local timezone");
    });
  }, []);

  useEffect(() => {
    const selectHashSection = () => {
      const nextSection = window.location.hash.slice(1);
      setActiveSection(isTherapistSection(nextSection) ? nextSection : "overview");
    };
    selectHashSection();
    window.addEventListener("hashchange", selectHashSection);
    return () => window.removeEventListener("hashchange", selectHashSection);
  }, []);

  function showSection(section: TherapistSection) {
    setActiveSection(section);
    setError("");
    setNotice("");
    window.history.pushState(null, "", `#${section}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitChanges(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/therapist/me", {
        method: "PATCH",
        headers: apiHeaders(session.access_token, true),
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
    if (!session) return;

    const starts = new Date(slotStartsAt);
    const ends = new Date(slotEndsAt);
    if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime())) {
      setError("Enter a valid start and end time.");
      return;
    }
    if (starts.getTime() <= Date.now()) {
      setError("Choose a start time in the future.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/therapist/me", {
        method: "PATCH",
        headers: apiHeaders(session.access_token, true),
        body: JSON.stringify({
          slotStartsAt: starts.toISOString(),
          slotEndsAt: ends.toISOString(),
          slotType,
          recurrenceRule,
          notes: slotNotes,
          timeZone,
        }),
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

  async function setAvailabilityStatus(availabilityStatus: string) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/therapist/me", {
        method: "PATCH",
        headers: apiHeaders(session?.access_token, true),
        body: JSON.stringify({ action: "set_availability_status", availabilityStatus }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not update your availability status.");
      await loadDashboard(session?.access_token);
      setNotice(availabilityStatus === "Unavailable" ? "You are now unavailable for new appointment requests." : `Your status is now ${availabilityStatus.toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update availability status.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(slotId: string) {
    if (!window.confirm("Remove this pending availability submission?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/therapist/me", {
        method: "DELETE",
        headers: apiHeaders(session?.access_token, true),
        body: JSON.stringify({ slotId }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not remove availability.");
      setNotice("Pending availability removed.");
      await loadDashboard(session?.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove availability.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/therapist/password", {
        method: "PATCH",
        headers: apiHeaders(session?.access_token, true),
        body: JSON.stringify({ password: newPassword }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not change password.");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password changed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    void fetch("/api/admin/logout", { method: "POST" }).finally(() => {
      window.location.href = "/therapist/login";
    });
  }

  async function uploadProfilePhoto(file: File) {
    if (!session) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "therapist-photo");
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: apiHeaders(session.access_token),
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
      <main className="admin-page" id="main-content">
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
  const activeSectionLabel =
    therapistSections.find((section) => section.id === activeSection)?.label ?? "Overview";
  const pendingReviewCount = changeRequests.filter((request) => request.status === "pending").length;
  const openSlotCount = slots.filter((slot) => !slot.isBooked && slot.slotType !== "blocked").length;

  return (
    <main className="admin-shell therapist-shell" id="main-content" aria-busy={saving} data-active-section={activeSection}>
      <aside className="admin-sidebar">
        <Link className="admin-mini-brand" href="/">
          <Image src="/brand/mindease-app-icon.svg" alt="" width={44} height={44} />
          <span>MindEase</span>
        </Link>
        <nav aria-label="Therapist dashboard sections">
          {therapistSections.map((section) => {
            const count = section.id === "reviews" ? pendingReviewCount : section.id === "appointments" ? appointments.length : 0;
            return (
              <button
                aria-pressed={activeSection === section.id}
                className="admin-nav-button"
                key={section.id}
                onClick={() => showSection(section.id)}
                type="button"
              >
                <span>{section.label}</span>
                {count > 0 ? <b>{count}</b> : null}
              </button>
            );
          })}
        </nav>
        <button className="admin-signout" onClick={signOut} type="button">Sign out</button>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div>
            <span>Therapist dashboard</span>
            <h1>{activeSection === "overview" ? therapist?.full_name ?? session?.user?.email ?? "Therapist" : activeSectionLabel}</h1>
          </div>
          <div className="admin-user-chip therapist-status-chip">
            <span>{therapist?.is_active ? "●" : "○"}</span>
            <div>
              <strong>{therapist?.availability_status ?? (therapist?.is_active ? "Available" : "Profile hidden")}</strong>
              <small>{therapist?.is_active ? "Public profile live" : friendlyLabel(therapist?.approval_status ?? "pending")}</small>
            </div>
          </div>
        </header>

        {error ? <p className="admin-error" role="alert">{error}</p> : null}
        {notice ? <p className="admin-notice inline" role="status">{notice}</p> : null}

        {activeSection === "overview" ? <section className="admin-kpis therapist-kpis" aria-label="Therapist metrics">
          <article>
            <span>Upcoming</span>
            <strong>{appointments.length}</strong>
            <p>scheduled sessions</p>
          </article>
          <article>
            <span>Open slots</span>
            <strong>{openSlotCount}</strong>
            <p>available times</p>
          </article>
          <article>
            <span>Pending edits</span>
            <strong>{pendingReviewCount}</strong>
            <p>waiting for review</p>
          </article>
          <article>
            <span>Profile</span>
            <strong>{therapist?.is_active ? "Live" : "Hidden"}</strong>
            <p>directory status</p>
          </article>
        </section> : null}

        <section className="admin-grid">
          <ReferralInbox token={session?.access_token} />
          <article className="admin-panel wide therapist-overview-panel" id="overview">
            <div className="admin-panel-head">
              <div>
                <span>Workspace</span>
                <h2>What would you like to do?</h2>
              </div>
            </div>
            <div className="therapist-quick-actions">
              <button onClick={() => showSection("availability")} type="button"><span>01</span><strong>Add availability</strong><small>Publish times clients can request</small></button>
              <button onClick={() => showSection("appointments")} type="button"><span>02</span><strong>View appointments</strong><small>{appointments.length} currently assigned</small></button>
              <button onClick={() => showSection("profile")} type="button"><span>03</span><strong>Update profile</strong><small>Submit public details for review</small></button>
              <button onClick={() => showSection("clinical-records")} type="button"><span>04</span><strong>Open clinical records</strong><small>Manage consented client cases</small></button>
            </div>
          </article>

          <ClinicalWorkspace appointments={appointments} />
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
                Country of origin
                <select value={form.countryCode} onChange={(event) => {
                  const code = event.target.value;
                  const name = THERAPIST_COUNTRIES.find(([itemCode]) => itemCode === code)?.[1] ?? "International";
                  setForm((current) => ({ ...current, countryCode: code, countryOfOrigin: name }));
                }}>{THERAPIST_COUNTRIES.map(([code, name]) => <option key={code} value={code}>{countryFlag(code)} {name}</option>)}</select>
              </label>
              <label>
                Session fee
                <input inputMode="numeric" value={form.sessionFee} onChange={(event) => updateField("sessionFee", event.target.value)} />
              </label>
              <label className="wide-field image-upload-field">
                <span>Profile photo from device</span>
                {form.profileImageUrl ? (
                  <Image
                    src={form.profileImageUrl}
                    alt={`${therapist?.full_name ?? "Therapist"} profile preview`}
                    width={124}
                    height={124}
                    unoptimized
                  />
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

          <article className="admin-panel wide" id="availability">
            <div className="admin-panel-head">
              <div>
                <span>Scheduling</span>
                <h2>Availability and working hours</h2>
              </div>
            </div>
            <section className="availability-presence" aria-labelledby="availability-status-title">
              <div>
                <span>Current status</span>
                <h3 id="availability-status-title">Are you accepting new appointments?</h3>
                <p>This changes immediately. It does not hide your approved profile or require admin review.</p>
              </div>
              <div className="availability-status-options" role="group" aria-label="Availability status">
                {["Available", "Limited availability", "Unavailable"].map((status) => (
                  <button
                    aria-pressed={(therapist?.availability_status ?? "Available") === status}
                    disabled={saving}
                    key={status}
                    onClick={() => void setAvailabilityStatus(status)}
                    type="button"
                  >{status}</button>
                ))}
              </div>
            </section>
            <div className="therapist-section-heading">
              <span>Working hours</span>
              <h3>Add a time slot</h3>
              <p>Slots are reviewed before they appear publicly. Blocked time keeps your calendar clear.</p>
            </div>
            <form className="admin-form-grid availability-slot-form" onSubmit={addSlot}>
              <label>
                Starts
                <input type="datetime-local" value={slotStartsAt} onChange={(event) => {
                  setSlotStartsAt(event.target.value);
                  if (!slotEndsAt && event.target.value) {
                    const suggestedEnd = new Date(new Date(event.target.value).getTime() + 50 * 60 * 1000);
                    const localEnd = new Date(suggestedEnd.getTime() - suggestedEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setSlotEndsAt(localEnd);
                  }
                }} required />
                <small>Shown in your device timezone: {timeZone}</small>
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
              <button disabled={saving} type="submit">{saving ? "Submitting..." : "Submit slot for approval"}</button>
            </form>
            <div className="therapist-section-heading slot-list-heading"><span>Submitted schedule</span><h3>Upcoming slots</h3></div>
            <div className="admin-list compact">
              {slots.slice(0, 5).map((slot) => (
                <div key={slot.id}>
                  <strong>{slot.startsAt ? new Date(slot.startsAt).toLocaleString("en-GB") : "Slot"}</strong>
                  <p>{slot.endsAt ? `Ends ${new Date(slot.endsAt).toLocaleString("en-GB")}` : "No end time"}</p>
                  <small>{friendlyLabel(slot.slotType)}{slot.recurrenceRule && slot.recurrenceRule !== "none" ? ` · ${friendlyLabel(slot.recurrenceRule)}` : ""}</small>
                  <em>{friendlyLabel(slot.approvalStatus)} · {slot.isBooked ? "Booked" : "Open"}</em>
                  {slot.approvalStatus === "pending" && !slot.isBooked ? (
                    <button disabled={saving} onClick={() => void removeSlot(slot.id)} type="button">Remove pending slot</button>
                  ) : null}
                </div>
              ))}
              {slots.length === 0 ? <div className="empty-state compact"><strong>No availability submitted.</strong><p>Add a future time above, or set yourself unavailable until you are ready.</p></div> : null}
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

          <article className="admin-panel" id="security">
            <div className="admin-panel-head">
              <div>
                <span>Account security</span>
                <h2>Change password</h2>
              </div>
            </div>
            <form className="admin-form-grid single" onSubmit={changePassword}>
              <label>
                New password
                <input autoComplete="new-password" minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
              </label>
              <label>
                Confirm password
                <input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
              </label>
              <button disabled={saving} type="submit">{saving ? "Saving..." : "Change password"}</button>
            </form>
          </article>
        </section>
      </section>
    </main>
  );
}
