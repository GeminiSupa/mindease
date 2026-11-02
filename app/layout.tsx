import type { Metadata } from "next";
import "./globals.css";
import HelpChat from "./components/HelpChat";
import ScrollAnimations from "./components/ScrollAnimations";
import { getPublicContactSettings } from "./site-settings";
import { SITE_NAME, SITE_URL } from "./seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const metadataBase = new URL(SITE_URL);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Private online therapy sessions with qualified clinical psychologists and experienced therapists.",
  alternates: { canonical: "/" },
  applicationName: SITE_NAME,
  category: "health",
  keywords: [
    "online therapy Pakistan",
    "online psychologist Pakistan",
    "mental health therapist",
    "Urdu therapy online",
    "clinical psychologist online",
  ],
  verification: {
    google: "bKFKY0iWJq1rU7Yf6BRQ4_2WIh9L62O6fLYZtE5pXkg",
  },
  icons: {
    icon: "/brand/mindease-app-icon.svg",
    shortcut: "/brand/mindease-app-icon.svg",
    apple: "/brand/mindease-app-icon.svg",
  },
  openGraph: {
    title: SITE_NAME,
    description:
      "Book confidential online therapy with qualified psychologists and therapists.",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_PK",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MindEase Online Clinic" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Confidential online therapy with qualified psychologists and therapists.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contactSettings = await getPublicContactSettings();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/mindease-app-icon.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <HelpChat whatsappNumber={contactSettings.whatsappNumber} />
        <ScrollAnimations />
      </body>
    </html>
  );
}
