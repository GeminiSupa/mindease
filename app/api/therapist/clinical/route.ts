import {
  getRows,
  json,
  requireTherapist,
  serviceFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  value,
  writeAuditLog,
} from "../../_utils/mindease";

async function ownedAppointment(therapistId: string, appointmentId: string) {
  const rows = await getRows("appointments", `id=eq.${encodeURIComponent(appointmentId)}&therapist_id=eq.${encodeURIComponent(therapistId)}&select=id,therapist_id,client_id,client_name,client_email,concern&limit=1`);
  return rows[0];
}

async function ownedCase(therapistId: string, caseId: string) {
  const rows = await getRows("clinical_cases", `id=eq.${encodeURIComponent(caseId)}&therapist_id=eq.${encodeURIComponent(therapistId)}&select=*&limit=1`);
  return rows[0];
}

export async function GET(request: Request) {
  const session = await requireTherapist(request);
  if (!session) return json({ error: "Therapist access required." }, 403);
  const therapistId = value(session.therapist, ["id"]);
  const caseId = new URL(request.url).searchParams.get("caseId") ?? "";

  if (!caseId) {
    const cases = await getRows("clinical_cases", `therapist_id=eq.${encodeURIComponent(therapistId)}&select=*&order=updated_at.desc&limit=100`);
    return json({ cases });
  }
  const clinicalCase = await ownedCase(therapistId, caseId);
  if (!clinicalCase) return json({ error: "Clinical case not found." }, 404);

  const [intakes, notes, assignments, documents] = await Promise.all([
    getRows("clinical_intakes", `case_id=eq.${encodeURIComponent(caseId)}&select=*&limit=1`),
    getRows("clinical_notes", `case_id=eq.${encodeURIComponent(caseId)}&select=*&order=created_at.desc&limit=100`),
    getRows("assessment_assignments", `case_id=eq.${encodeURIComponent(caseId)}&select=*,assessment_responses(*)&order=created_at.desc&limit=100`),
    getRows("clinical_documents", `case_id=eq.${encodeURIComponent(caseId)}&select=id,file_name,mime_type,file_size,category,created_at&order=created_at.desc&limit=100`),
  ]);
  const visibleNotes = notes.filter((note) => note.note_type !== "psychotherapy" || note.author_id === session.user.id);
  return json({ clinicalCase, intake: intakes[0] ?? null, notes: visibleNotes, assessments: assignments, documents });
}

export async function POST(request: Request) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Clinical records are not configured." }, 500);
  const session = await requireTherapist(request);
  if (!session) return json({ error: "Therapist access required." }, 403);
  const therapistId = value(session.therapist, ["id"]);
  const body = (await request.json()) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";

  if (action === "create_case") {
    if (body.consent !== true) return json({ error: "Record client consent before opening a clinical case." }, 400);
    const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
    const appointment = await ownedAppointment(therapistId, appointmentId);
    if (!appointment) return json({ error: "Assigned appointment not found." }, 404);
    const response = await serviceFetch("/rest/v1/clinical_cases?on_conflict=appointment_id", {
      method: "POST", headers: { prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        appointment_id: appointmentId, therapist_id: therapistId, client_id: appointment.client_id ?? null,
        client_name: value(appointment, ["client_name"], "Client"), client_email: value(appointment, ["client_email"], "") || null,
        presenting_concerns: value(appointment, ["concern"], ""), consent_recorded_at: new Date().toISOString(),
        consent_scope: "clinical_record_assessments_documents",
      }),
    });
    const result = await response.json();
    if (!response.ok) return json({ error: result?.message ?? "Could not create case." }, response.status);
    return json({ clinicalCase: Array.isArray(result) ? result[0] : result }, 201);
  }

  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  const clinicalCase = await ownedCase(therapistId, caseId);
  if (!clinicalCase) return json({ error: "Clinical case not found." }, 404);
  let endpoint = "";
  let payload: Record<string, unknown> = {};

  if (action === "save_intake") {
    endpoint = "clinical_intakes";
    payload = {
      case_id: caseId, current_symptoms: body.currentSymptoms, symptom_onset: body.symptomOnset,
      previous_treatment: body.previousTreatment, medical_history: body.medicalHistory, medications: body.medications,
      substance_use: body.substanceUse, family_history: body.familyHistory, social_context: body.socialContext,
      strengths_resources: body.strengthsResources, risk_assessment: body.riskAssessment,
      protective_factors: body.protectiveFactors, created_by: session.user.id, updated_at: new Date().toISOString(),
    };
  } else if (action === "add_note") {
    const noteType = ["progress", "psychotherapy", "risk", "consultation", "discharge"].includes(String(body.noteType)) ? body.noteType : "progress";
    endpoint = "clinical_notes";
    payload = { case_id: caseId, appointment_id: clinicalCase.appointment_id, author_id: session.user.id, note_type: noteType,
      format: ["DAP", "SOAP", "BIRP", "free"].includes(String(body.format)) ? body.format : "DAP",
      subjective: body.subjective, objective: body.objective, assessment: body.assessment, plan: body.plan,
      interventions: body.interventions, client_response: body.clientResponse, risk_level: body.riskLevel || null,
      signed_at: body.sign === true ? new Date().toISOString() : null };
  } else if (action === "assign_assessment") {
    const instrument = body.instrument === "GAD-7" ? "GAD-7" : "PHQ-9";
    endpoint = "assessment_assignments";
    payload = { case_id: caseId, therapist_id: therapistId, instrument };
  } else if (action === "update_plan") {
    const response = await serviceFetch(`/rest/v1/clinical_cases?id=eq.${encodeURIComponent(caseId)}`, {
      method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify({ goals: body.goals, formulation: body.formulation,
        treatment_plan: body.treatmentPlan, risk_level: body.riskLevel || "not_assessed", risk_plan: body.riskPlan, updated_at: new Date().toISOString() }),
    });
    const result = await response.json();
    if (!response.ok) return json({ error: result?.message ?? "Could not update treatment plan." }, response.status);
    return json({ clinicalCase: Array.isArray(result) ? result[0] : result });
  } else return json({ error: "Valid clinical action is required." }, 400);

  const response = await serviceFetch(`/rest/v1/${endpoint}${action === "save_intake" ? "?on_conflict=case_id" : ""}`, {
    method: "POST", headers: { prefer: action === "save_intake" ? "resolution=merge-duplicates,return=representation" : "return=representation" }, body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not save clinical record." }, response.status);
  const record = Array.isArray(result) ? result[0] : result;
  await writeAuditLog({ actorId: session.user.id, action: `clinical_${action}`, subjectTable: endpoint, subjectId: record?.id, details: { caseId } });
  return json({ record, assessmentUrl: action === "assign_assessment" && record?.token ? `/assessment/${record.token}` : undefined }, 201);
}
