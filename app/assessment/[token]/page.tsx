"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { RESPONSE_OPTIONS } from "../../assessment-tools";

type Assessment = { instrument: string; title: string; period: string; questions: readonly string[] };

export default function AssessmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ severity: string; riskFlag: boolean } | null>(null);

  useEffect(() => {
    void fetch(`/api/assessments/${token}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Assessment unavailable.");
      setAssessment(body); setAnswers(Array(body.questions.length).fill(-1));
    }).catch((err) => setError(err instanceof Error ? err.message : "Assessment unavailable."));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch(`/api/assessments/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers, acknowledged }) });
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Could not submit assessment.");
    setResult(body);
  }

  return <main className="directory-page" id="main-content"><section className="test-hero"><nav className="site-nav"><Link className="brand" href="/"><span><strong>MindEase</strong><small>Clinical check-in</small></span></Link></nav>
    <div className="directory-copy"><span className="eyebrow">Private therapist-requested check-in</span><h1>{assessment?.title ?? "Clinical assessment"}</h1><p>{assessment?.period ?? "Loading…"}</p></div></section>
    <section className="section"><div className="admin-panel wide">
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {result ? <div className="empty-state"><h2>Submitted securely</h2><p>Your result was shared with your assigned therapist. This screening result is not a diagnosis.</p>
        {result.riskFlag ? <p className="admin-error"><strong>Your response indicates that prompt human support is important.</strong> Contact your therapist now. If you may act on thoughts of self-harm or are in immediate danger, contact local emergency services or go to the nearest emergency department.</p> : null}</div> : assessment ?
      <form className="admin-form-grid single" onSubmit={submit}>{assessment.questions.map((question, index) => <fieldset key={question}><legend>{index + 1}. {question}</legend>
        {RESPONSE_OPTIONS.map((option, score) => <label key={option}><input checked={answers[index] === score} name={`q-${index}`} onChange={() => setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? score : answer))} type="radio" /> {option}</label>)}</fieldset>)}
        <label><input checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} type="checkbox" /> I understand this is a screening tool, not a diagnosis, and the result will become part of my clinical record.</label>
        <button disabled={!acknowledged || answers.some((answer) => answer < 0)} type="submit">Submit securely</button></form> : null}
    </div></section></main>;
}
