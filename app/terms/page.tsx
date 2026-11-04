import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms & Clinical Safety | MindEase", description: "Important terms, self-check limitations, emergencies, payments, and clinical safety information." };

export default function TermsPage() {
  return <main className="policy-page" id="main-content"><nav className="site-nav"><Link className="brand" href="/"><span><strong>MindEase</strong><small>Terms & safety</small></span></Link><Link href="/">Back home</Link></nav><article>
    <span className="eyebrow">Effective 4 November 2026</span><h1>Terms and clinical safety</h1>
    <h2>Not an emergency service</h2><p>MindEase does not provide emergency response. If someone may be in immediate danger, contact local emergency services or go to the nearest hospital emergency department.</p>
    <h2>Self-checks</h2><p>Website self-checks are informational conversation starters. They are not diagnoses, clinical assessments, or substitutes for evaluation by a qualified professional. Public self-check answers remain on the visitor’s device and are not added to marketing lead records.</p>
    <h2>Therapist matching</h2><p>Matching considers information such as focus area, language, fee, format, and availability. Clients remain responsible for deciding whether a clinician is suitable and should ask about credentials, scope of practice, confidentiality, and emergency arrangements.</p>
    <h2>Clinical records and assessments</h2><p>Clinical tools are intended for qualified professionals. Screening scores support—not replace—clinical judgment. Risk flags require prompt human review and must not be treated as automated diagnosis or emergency monitoring.</p>
    <h2>Payments</h2><p>Send payment only after the therapist and appointment time are confirmed and approved instructions are provided. Never share a PIN, password, or one-time code with MindEase staff.</p>
    <h2>Availability and jurisdiction</h2><p>Services, professional requirements, privacy rules, and record obligations vary by clinician and jurisdiction. MindEase may update these terms as the service and applicable requirements develop.</p>
  </article></main>;
}
