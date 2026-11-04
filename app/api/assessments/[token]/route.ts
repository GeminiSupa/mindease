import { ASSESSMENTS } from "../../../assessment-tools";
import { getRows, json, serviceFetch, SUPABASE_SERVICE_ROLE_KEY, value, writeAuditLog } from "../../../api/_utils/mindease";

async function assignmentFor(token: string) {
  const rows = await getRows("assessment_assignments", `token=eq.${encodeURIComponent(token)}&select=id,instrument,status,expires_at,case_id,therapist_id&limit=1`);
  return rows[0];
}

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const assignment = await assignmentFor(token);
  if (!assignment) return json({ error: "Assessment link is invalid." }, 404);
  if (assignment.status !== "sent" || new Date(value(assignment, ["expires_at"])).getTime() <= Date.now()) {
    return json({ error: "This assessment link has expired or was already completed." }, 410);
  }
  const instrument = value(assignment, ["instrument"]) as keyof typeof ASSESSMENTS;
  const tool = ASSESSMENTS[instrument];
  if (!tool) return json({ error: "Assessment is unavailable." }, 404);
  return json({ instrument, title: tool.title, period: tool.period, questions: tool.questions });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Assessments are not configured." }, 500);
  const { token } = await context.params;
  const assignment = await assignmentFor(token);
  if (!assignment) return json({ error: "Assessment link is invalid." }, 404);
  if (assignment.status !== "sent" || new Date(value(assignment, ["expires_at"])).getTime() <= Date.now()) {
    return json({ error: "This assessment link has expired or was already completed." }, 410);
  }
  const instrument = value(assignment, ["instrument"]) as keyof typeof ASSESSMENTS;
  const tool = ASSESSMENTS[instrument];
  const body = (await request.json()) as { answers?: unknown; acknowledged?: unknown };
  const answers = Array.isArray(body.answers) ? body.answers.map(Number) : [];
  if (!tool || answers.length !== tool.questions.length || answers.some((answer) => !Number.isInteger(answer) || answer < 0 || answer > 3)) {
    return json({ error: "Please answer every question." }, 400);
  }
  if (body.acknowledged !== true) return json({ error: "Please acknowledge the assessment notice." }, 400);
  const total = answers.reduce((sum, answer) => sum + answer, 0);
  const riskFlag = tool.riskIndex >= 0 && (answers[tool.riskIndex] ?? 0) > 0;
  const response = await serviceFetch("/rest/v1/assessment_responses", { method: "POST", headers: { prefer: "return=representation" },
    body: JSON.stringify({ assignment_id: assignment.id, answers, total_score: total, severity: tool.severity(total), risk_flag: riskFlag, client_acknowledged_disclaimer: true }) });
  const result = await response.json();
  if (!response.ok) return json({ error: result?.message ?? "Could not save assessment." }, response.status);
  await serviceFetch(`/rest/v1/assessment_assignments?id=eq.${encodeURIComponent(value(assignment, ["id"]))}`, { method: "PATCH", headers: { prefer: "return=minimal" },
    body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }) });
  await writeAuditLog({ action: "client_assessment_completed", subjectTable: "assessment_assignments", subjectId: value(assignment, ["id"]), details: { instrument, riskFlag } });
  return json({ completed: true, total, severity: tool.severity(total), riskFlag });
}
