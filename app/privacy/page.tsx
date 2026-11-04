import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Notice | MindEase", description: "How MindEase collects, uses, and protects website, inquiry, lead, and clinical information." };

export default function PrivacyPage() {
  return <main className="policy-page" id="main-content"><nav className="site-nav"><Link className="brand" href="/"><span><strong>MindEase</strong><small>Privacy notice</small></span></Link><Link href="/">Back home</Link></nav><article>
    <span className="eyebrow">Effective 4 November 2026</span><h1>Privacy notice</h1><p>MindEase aims to collect only the information needed to coordinate care, respond to inquiries, protect the service, and maintain clinical records where a client has consented.</p>
    <h2>Information we collect</h2><p>Inquiry and lead information may include your name, email or WhatsApp number, city, consent record, coarse network location, masked and hashed network identifier, campaign source, landing page, referrer, device category, language, and timezone. We do not attach self-check answers or selected self-check topics to marketing leads.</p>
    <h2>Clinical information</h2><p>When care begins, assigned clinicians may maintain intake information, treatment plans, progress notes, separately protected psychotherapy notes, assessment results, and documents. Access is limited to authorised staff and the assigned clinician according to their role.</p>
    <h2>How information is used</h2><p>We use information to respond to requests, coordinate matching and appointments, provide care, maintain continuity, prevent misuse, understand campaign performance, and improve the service. We do not sell clinical or self-check information.</p>
    <h2>Location and network data</h2><p>City may be provided directly by you. Hosting infrastructure may provide an approximate city, region, or country. This is not precise GPS location. Full IP addresses are not stored in the lead record; a masked network range and one-way hash may be retained for attribution, deduplication, and abuse prevention.</p>
    <h2>Your choices</h2><p>You may ask MindEase to correct or delete lead information, withdraw marketing follow-up consent, or ask how your information is handled. Clinical records may be subject to professional, safety, retention, and legal requirements that limit immediate deletion.</p>
    <h2>Security and third parties</h2><p>We use access controls, private document storage, audit records, and limited server-side access. No internet service can promise absolute security. External service providers should receive only information necessary for their role and must be reviewed before handling sensitive data.</p>
    <p className="policy-callout">This notice describes MindEase practices; it is not a claim of HIPAA certification. Applicable requirements depend on where clients, clinicians, and service providers are located.</p>
  </article></main>;
}
