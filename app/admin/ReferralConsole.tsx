"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Props = { token?: string; initialLeadId?: string };
type Row = Record<string, unknown>;
const label = (value: unknown) => String(value ?? "").replaceAll("_", " ");

export default function ReferralConsole({ token, initialLeadId = "" }: Props) {
  const [data, setData] = useState<{ referrals: Row[]; therapists: Row[]; leads: Row[]; messages: Row[] }>({ referrals: [], therapists: [], leads: [], messages: [] });
  const [form, setForm] = useState({ leadId: initialLeadId, therapistId: "", presentingConcern: "", limitedSummary: "", urgency: "routine", riskLevel: "not_assessed", preferredLanguage: "Urdu / English", preferredFormat: "Online", preferredTimes: "", budgetRange: "", matchReason: "", coordinatorNote: "" });
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  const headers = useMemo(() => ({ "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }), [token]);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const load = useCallback(async () => { const response = await fetch("/api/admin/referrals", { headers, cache: "no-store" }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); }, [headers]);
  // Initial server synchronization is intentionally performed after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load().catch((reason) => setError(reason.message)); }, [load]);

  const chosenLead = data.leads.find((item) => item.id === form.leadId);
  const suggestions = [...data.therapists].filter((item) => item.is_active && item.approval_status === "approved").sort((a, b) => {
    const term = form.presentingConcern.toLowerCase();
    return Number(String(b.specialization ?? "").toLowerCase().includes(term)) - Number(String(a.specialization ?? "").toLowerCase().includes(term));
  }).slice(0, 3);
  async function call(method: "POST" | "PATCH", payload: Row, success: string) {
    setBusy(true); setError(""); setNotice("");
    const response = await fetch("/api/admin/referrals", { method, headers, body: JSON.stringify(payload) }); const body = await response.json(); setBusy(false);
    if (!response.ok) return setError(body.error ?? "Could not save referral.");
    setNotice(success); await load();
  }
  async function create(event: React.FormEvent) { event.preventDefault(); await call("POST", form, "Referral sent for private therapist review."); }

  return <article className="admin-panel wide referral-workspace" id="referrals">
    <div className="admin-panel-head"><div><span>Controlled handover</span><h2>Client → therapist referrals</h2></div><b>{data.referrals.filter((item) => !["closed", "therapist_declined", "client_declined"].includes(String(item.status))).length} active</b></div>
    <div className="referral-steps"><span><b>1</b>Qualify</span><span><b>2</b>Therapist review</span><span><b>3</b>Client consent</span><span><b>4</b>Book safely</span></div>
    {error ? <p className="admin-error" role="alert">{error}</p> : null}{notice ? <p className="admin-notice inline" role="status">{notice}</p> : null}
    <form className="referral-form" onSubmit={create}>
      <div className="referral-form-intro"><span>New controlled referral</span><h3>Share only what the therapist needs to decide.</h3><p>Self-test answers and full clinical notes are never included here.</p></div>
      <label>Qualified lead<select required value={form.leadId} onChange={(event) => setForm({ ...form, leadId: event.target.value })}><option value="">Choose lead</option>{data.leads.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name || item.contact_value)} · {label(item.lead_status)}</option>)}</select></label>
      <label>Presenting concern<input required value={form.presentingConcern} onChange={(event) => setForm({ ...form, presentingConcern: event.target.value })} placeholder="e.g. anxiety, grief, relationship support" /></label>
      <label>Urgency<select value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value })}><option value="routine">Routine</option><option value="priority">Priority</option><option value="urgent">Urgent</option></select></label>
      <label>Safety triage<select value={form.riskLevel} onChange={(event) => setForm({ ...form, riskLevel: event.target.value })}><option value="not_assessed">Not assessed</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High — escalate, do not refer</option><option value="imminent">Imminent — emergency protocol</option></select></label>
      <label className="wide-field">Limited referral summary<textarea required value={form.limitedSummary} onChange={(event) => setForm({ ...form, limitedSummary: event.target.value })} placeholder="Brief context, goals, preferences and relevant access needs. Avoid unnecessary sensitive detail." /></label>
      <label>Language<input value={form.preferredLanguage} onChange={(event) => setForm({ ...form, preferredLanguage: event.target.value })} /></label><label>Format<select value={form.preferredFormat} onChange={(event) => setForm({ ...form, preferredFormat: event.target.value })}><option>Online</option><option>In-person</option><option>Either</option></select></label>
      <label>Preferred times<input value={form.preferredTimes} onChange={(event) => setForm({ ...form, preferredTimes: event.target.value })} placeholder="Evenings, weekends…" /></label><label>Budget range<input value={form.budgetRange} onChange={(event) => setForm({ ...form, budgetRange: event.target.value })} placeholder="PKR range" /></label>
      <div className="match-suggestions wide-field"><span>Suggested matches</span><div>{suggestions.map((item) => <button className={form.therapistId === item.id ? "selected" : ""} key={String(item.id)} onClick={() => setForm({ ...form, therapistId: String(item.id), matchReason: `Matched for ${form.presentingConcern || "the stated concern"}, language and availability.` })} type="button"><strong>{String(item.full_name)}</strong><small>{String(item.specialization || item.title || "General support")}</small><em>{String(item.availability_status || "Check availability")}</em></button>)}</div></div>
      <label className="wide-field">Why this match?<input required value={form.matchReason} onChange={(event) => setForm({ ...form, matchReason: event.target.value })} placeholder="Clinical fit, language, format and availability" /></label>
      <button disabled={busy || !form.therapistId || ["high", "imminent"].includes(form.riskLevel)} type="submit">{busy ? "Sending…" : "Send limited referral"}</button>
      {chosenLead ? <small className="form-context">Selected: {String(chosenLead.name || chosenLead.contact_value)}. Contact details remain hidden from the therapist until consent.</small> : null}
    </form>
    <section className="referral-card-list" aria-label="Referral pipeline">{data.referrals.map((item) => {
      const therapist = data.therapists.find((row) => row.id === item.therapist_id); const lead = data.leads.find((row) => row.id === item.lead_id); const thread = data.messages.filter((row) => row.referral_id === item.id);
      return <article className="referral-card" key={String(item.id)}><div className="referral-card-top"><div><span>{label(item.status)}</span><h3>{String(item.client_display_name || lead?.name || "Client")}</h3><p>{String(item.presenting_concern)}</p></div><div className={`risk-chip risk-${String(item.risk_level)}`}>{label(item.risk_level)}</div></div>
        <dl><div><dt>Therapist</dt><dd>{String(therapist?.full_name || "Not assigned")}</dd></div><div><dt>Urgency</dt><dd>{label(item.urgency)}</dd></div><div><dt>Language / format</dt><dd>{String(item.preferred_language || "—")} · {String(item.preferred_format || "—")}</dd></div></dl>
        <details><summary>Referral details and secure thread</summary><p>{String(item.limited_summary)}</p><p><strong>Match:</strong> {String(item.match_reason || "—")}</p>{thread.map((message) => <blockquote key={String(message.id)}><b>{label(message.sender_role)}</b> {String(message.message)}</blockquote>)}</details>
        {item.status === "awaiting_client_consent" ? <div className="consent-link"><span>Client consent link</span><code>{`${origin}/referral/consent/${item.client_consent_token}`}</code><button onClick={() => void navigator.clipboard.writeText(`${origin}/referral/consent/${item.client_consent_token}`)} type="button">Copy link</button></div> : null}
        <div className="referral-actions"><button disabled={busy} onClick={() => { const message = prompt("Secure message to therapist"); if (message) void call("PATCH", { id: item.id, action: "message", message }, "Message sent."); }} type="button">Message</button>{item.status === "client_consented" ? <button onClick={() => void call("PATCH", { id: item.id, status: "ready_to_book" }, "Referral is ready to book.")} type="button">Ready to book</button> : null}<button className="secondary" onClick={() => { const therapistId = prompt("New therapist ID"); const transferReason = therapistId ? prompt("Reason for reassignment") : ""; if (therapistId && transferReason) void call("PATCH", { id: item.id, therapistId, transferReason }, "Reassigned. Previous access removed and client consent reset."); }} type="button">Reassign</button></div>
      </article>;
    })}{data.referrals.length === 0 ? <div className="empty-state compact"><strong>No referrals yet.</strong><p>Qualify a lead, complete safety triage, then create the first controlled handover.</p></div> : null}</section>
  </article>;
}
