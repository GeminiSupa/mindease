"use client";

import { useEffect, useState } from "react";

type Appointment = { id: string; client: string; time: string; concern: string };
type CaseSummary = { id: string; appointment_id: string; client_name: string; status: string; risk_level: string; goals?: string; formulation?: string; treatment_plan?: string; risk_plan?: string };
type CaseDetail = { clinicalCase: CaseSummary; intake?: Record<string, string> | null; notes?: Array<Record<string, string>>; assessments?: Array<Record<string, unknown>>; documents?: Array<Record<string, unknown>> };

const emptyIntake = { currentSymptoms: "", symptomOnset: "", previousTreatment: "", medicalHistory: "", medications: "", substanceUse: "", familyHistory: "", socialContext: "", strengthsResources: "", riskAssessment: "", protectiveFactors: "" };
const emptyNote = { noteType: "progress", format: "DAP", subjective: "", objective: "", assessment: "", plan: "", interventions: "", clientResponse: "", riskLevel: "low" };

export default function ClinicalWorkspace({ appointments }: { appointments: Appointment[] }) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [caseId, setCaseId] = useState("");
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [intake, setIntake] = useState(emptyIntake);
  const [note, setNote] = useState(emptyNote);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [plan, setPlan] = useState({ goals: "", formulation: "", treatmentPlan: "", riskLevel: "not_assessed", riskPlan: "" });

  async function request(body: Record<string, unknown>) {
    const response = await fetch("/api/therapist/clinical", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Could not save clinical record.");
    return result;
  }
  async function loadCases() {
    const response = await fetch("/api/therapist/clinical", { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json(); setCases(body.cases ?? []);
  }
  async function loadCase(id: string) {
    setCaseId(id); if (!id) return setDetail(null);
    const response = await fetch(`/api/therapist/clinical?caseId=${encodeURIComponent(id)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Could not load case.");
    setDetail(body);
    setPlan({ goals: body.clinicalCase.goals ?? "", formulation: body.clinicalCase.formulation ?? "", treatmentPlan: body.clinicalCase.treatment_plan ?? "", riskLevel: body.clinicalCase.risk_level ?? "not_assessed", riskPlan: body.clinicalCase.risk_plan ?? "" });
    if (body.intake) setIntake((current) => Object.fromEntries(Object.keys(current).map((key) => [key, body.intake[key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`)] ?? ""])) as typeof emptyIntake);
  }
  useEffect(() => { queueMicrotask(() => void loadCases()); }, []);

  async function createCase(appointmentId: string) {
    if (!appointmentId) return;
    setBusy(true); setError("");
    try { const result = await request({ action: "create_case", appointmentId, consent: consentConfirmed }); await loadCases(); await loadCase(result.clinicalCase.id); setConsentConfirmed(false); setNotice("Clinical case opened with consent recorded."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not open case."); } finally { setBusy(false); }
  }
  async function save(action: string, payload: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try { const result = await request({ action, caseId, ...payload }); setNotice(action === "assign_assessment" ? `Secure link created: ${window.location.origin}${result.assessmentUrl}` : "Clinical record saved."); await loadCase(caseId); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save record."); } finally { setBusy(false); }
  }
  async function upload(file: File, category: string) {
    setBusy(true); setError("");
    const form = new FormData(); form.set("file", file); form.set("caseId", caseId); form.set("category", category);
    try { const response = await fetch("/api/therapist/clinical-documents", { method: "POST", body: form }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setNotice("Private document uploaded."); await loadCase(caseId); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); } finally { setBusy(false); }
  }
  async function openDocument(id: string) {
    const response = await fetch(`/api/therapist/clinical-documents?id=${encodeURIComponent(id)}`); const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Could not open document."); window.open(body.url, "_blank", "noopener,noreferrer");
  }

  const unlinked = appointments.filter((appointment) => !cases.some((item) => item.appointment_id === appointment.id));
  return <article className="admin-panel wide" id="clinical-records"><div className="admin-panel-head"><div><span>Clinical workspace</span><h2>Case history, measures and notes</h2></div></div>
    <p>Only assigned cases appear here. Progress records and private psychotherapy notes are kept separately and every change is audited.</p>
    {error ? <p className="admin-error" role="alert">{error}</p> : null}{notice ? <p className="admin-notice inline" role="status">{notice}</p> : null}
    <div className="admin-form-grid">
      <label><span>Open case from appointment</span><span><input checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} type="checkbox" /> Client consent for clinical records, assessments and documents has been confirmed.</span><select disabled={busy || !consentConfirmed} defaultValue="" onChange={(event) => void createCase(event.target.value)}><option value="">Choose appointment…</option>{unlinked.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.client} — {appointment.time}</option>)}</select></label>
      <label>Current case<select value={caseId} onChange={(event) => void loadCase(event.target.value)}><option value="">Choose case…</option>{cases.map((item) => <option key={item.id} value={item.id}>{item.client_name} — {item.status}</option>)}</select></label>
    </div>
    {detail ? <div className="admin-grid clinical-case-grid">
      <section className="admin-panel"><h3>Initial history</h3><form className="admin-form-grid single" onSubmit={(event) => { event.preventDefault(); void save("save_intake", intake); }}>
        {Object.entries(intake).map(([key, value]) => <label key={key}>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}<textarea value={value} onChange={(event) => setIntake((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
        <button disabled={busy} type="submit">Save intake history</button></form></section>
      <section className="admin-panel"><h3>Formal clinical note</h3><form className="admin-form-grid single" onSubmit={(event) => { event.preventDefault(); void save("add_note", { ...note, sign: true }); }}>
        <label>Record type<select value={note.noteType} onChange={(event) => setNote((current) => ({ ...current, noteType: event.target.value }))}><option value="progress">Progress note</option><option value="psychotherapy">Private psychotherapy note</option><option value="risk">Risk review</option><option value="consultation">Consultation</option><option value="discharge">Discharge summary</option></select></label>
        <label>Format<select value={note.format} onChange={(event) => setNote((current) => ({ ...current, format: event.target.value }))}><option>DAP</option><option>SOAP</option><option>BIRP</option><option value="free">Free form</option></select></label>
        {(["subjective", "objective", "assessment", "plan", "interventions", "clientResponse"] as const).map((key) => <label key={key}>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}<textarea value={note[key]} onChange={(event) => setNote((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
        <label>Risk level<select value={note.riskLevel} onChange={(event) => setNote((current) => ({ ...current, riskLevel: event.target.value }))}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="imminent">Imminent</option></select></label>
        <button disabled={busy} type="submit">Sign and save note</button></form></section>
      <section className="admin-panel"><h3>Formulation and treatment plan</h3><form className="admin-form-grid single" onSubmit={(event) => { event.preventDefault(); void save("update_plan", plan); }}>
        <label>Collaborative goals<textarea value={plan.goals} onChange={(event) => setPlan((current) => ({ ...current, goals: event.target.value }))} /></label>
        <label>Clinical formulation<textarea value={plan.formulation} onChange={(event) => setPlan((current) => ({ ...current, formulation: event.target.value }))} /></label>
        <label>Treatment plan<textarea value={plan.treatmentPlan} onChange={(event) => setPlan((current) => ({ ...current, treatmentPlan: event.target.value }))} /></label>
        <label>Current risk level<select value={plan.riskLevel} onChange={(event) => setPlan((current) => ({ ...current, riskLevel: event.target.value }))}><option value="not_assessed">Not assessed</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="imminent">Imminent</option></select></label>
        <label>Safety/risk plan<textarea value={plan.riskPlan} onChange={(event) => setPlan((current) => ({ ...current, riskPlan: event.target.value }))} /></label>
        <button disabled={busy} type="submit">Save treatment plan</button></form></section>
      <section className="admin-panel"><h3>Measurement-based care</h3><p>Send validated screeners as decision-support, never as a stand-alone diagnosis.</p><div className="admin-form-grid single"><button disabled={busy} onClick={() => void save("assign_assessment", { instrument: "PHQ-9" })} type="button">Create PHQ-9 link</button><button disabled={busy} onClick={() => void save("assign_assessment", { instrument: "GAD-7" })} type="button">Create GAD-7 link</button></div>
        <div className="admin-list compact">{(detail.assessments ?? []).map((item) => <div key={String(item.id)}><strong>{String(item.instrument)}</strong><p>{String(item.status)} · {item.completed_at ? new Date(String(item.completed_at)).toLocaleString("en-GB") : "Awaiting client"}</p>{Array.isArray(item.assessment_responses) && item.assessment_responses[0] ? <small>Score {String((item.assessment_responses[0] as Record<string, unknown>).total_score)} · {String((item.assessment_responses[0] as Record<string, unknown>).severity)}{(item.assessment_responses[0] as Record<string, unknown>).risk_flag ? " · RISK FLAG—review promptly" : ""}</small> : null}</div>)}</div></section>
      <section className="admin-panel"><h3>Private documents</h3><label>Upload PDF, DOCX or image<input accept="application/pdf,.docx,image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, "other"); }} type="file" /></label><div className="admin-list compact">{(detail.documents ?? []).map((item) => <div key={String(item.id)}><strong>{String(item.file_name)}</strong><small>{String(item.category)} · {Math.ceil(Number(item.file_size) / 1024)} KB</small><button onClick={() => void openDocument(String(item.id))} type="button">Open securely</button></div>)}</div></section>
      <section className="admin-panel wide"><h3>Case timeline</h3><div className="admin-list">{(detail.notes ?? []).map((item) => <div key={item.id}><strong>{item.note_type} · {item.format}</strong><p>{item.assessment || item.subjective || "Clinical note"}</p><small>{new Date(item.created_at).toLocaleString("en-GB")} · {item.signed_at ? "Signed" : "Draft"}</small></div>)}</div></section>
    </div> : <div className="empty-state compact"><strong>Select or open a case.</strong><p>Consent should be confirmed before creating the clinical record.</p></div>}
  </article>;
}
