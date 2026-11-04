"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";

type ConsentData = { referral: { status: string; expiresAt: string; presentingConcern: string; preferredFormat: string }; therapist: { name: string; title: string; qualifications: string; photo?: string; specialization?: string; languages?: string[] } | null };

export default function ReferralConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ConsentData | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void fetch(`/api/referrals/consent/${token}`, { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); }).catch((reason) => setError(reason.message)); }, [token]);
  async function decide(action: "consent" | "decline") {
    setSaving(true); setError("");
    const response = await fetch(`/api/referrals/consent/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, confirmed }) });
    const body = await response.json(); setSaving(false);
    if (!response.ok) return setError(body.error ?? "Could not record your choice.");
    setDone(action);
  }

  return <main className="consent-page" id="main-content">
    <header><Link href="/" aria-label="MindEase home"><Image src="/brand/mindease-app-icon.svg" alt="" width={44} height={44} /><strong>MindEase</strong></Link><span>Private referral</span></header>
    <section className="consent-card">
      {error ? <div className="consent-state"><span>Link unavailable</span><h1>We could not open this request.</h1><p>{error}</p><Link href="/contact">Contact the coordinator</Link></div> : done ? <div className="consent-state"><span>Choice recorded</span><h1>{done === "consent" ? "Your care handover is approved." : "Your preference has been respected."}</h1><p>{done === "consent" ? "The named therapist can now see your contact details and relevant referral information. The coordinator can help you choose a time." : "No contact details were shared with this therapist. The coordinator can offer another match."}</p><Link href="/">Return to MindEase</Link></div> : !data ? <div className="consent-state"><span>Secure check</span><h1>Loading your referral…</h1></div> : <>
        <div className="consent-progress"><span className="complete">1 · Matched</span><span className="complete">2 · Therapist accepted</span><span>3 · Your consent</span></div>
        <div className="consent-copy"><span>Your choice, before sharing</span><h1>Meet the therapist suggested for you.</h1><p>Review the match below. Nothing further is shared until you give explicit consent.</p></div>
        <article className="consent-therapist">
          {data.therapist?.photo ? <Image src={data.therapist.photo} alt="" width={76} height={76} unoptimized /> : <div className="consent-avatar">{data.therapist?.name?.slice(0, 1) ?? "M"}</div>}
          <div><span>Suggested therapist</span><h2>{data.therapist?.name ?? "MindEase therapist"}</h2><p>{data.therapist?.title}</p><small>{data.therapist?.qualifications}</small></div>
        </article>
        <dl className="consent-details"><div><dt>Reason for match</dt><dd>{data.referral.presentingConcern}</dd></div><div><dt>Session preference</dt><dd>{data.referral.preferredFormat || "To be confirmed"}</dd></div><div><dt>Languages</dt><dd>{data.therapist?.languages?.join(", ") || "Ask the coordinator"}</dd></div></dl>
        <div className="consent-share"><strong>If you agree, the therapist will receive:</strong><ul><li>Your name and contact details</li><li>Your care preferences and limited referral summary</li><li>No self-test answers or clinical notes unless separately consented</li></ul></div>
        <label className="consent-check"><input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /><span>I understand and consent to this information being shared with the therapist named above.</span></label>
        <div className="consent-actions"><button disabled={!confirmed || saving} onClick={() => void decide("consent")} type="button">{saving ? "Saving…" : "Approve and continue"}</button><button className="secondary" disabled={saving} onClick={() => void decide("decline")} type="button">Decline this match</button></div>
        <p className="consent-footnote">You can ask the coordinator to change therapists. This is not emergency care.</p>
      </>}
    </section>
  </main>;
}
