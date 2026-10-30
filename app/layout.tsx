import type { Metadata } from "next";
import "./globals.css";
import HelpChat from "./components/HelpChat";
import ScrollAnimations from "./components/ScrollAnimations";
import { getPublicContactSettings } from "./site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.CF_PAGES_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL;
const metadataBase = new URL(
  configuredSiteUrl
    ? configuredSiteUrl.startsWith("http")
      ? configuredSiteUrl
      : `https://${configuredSiteUrl}`
    : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: "MindEase Online Clinic",
  description:
    "Private online therapy sessions with qualified clinical psychologists and experienced therapists.",
  icons: {
    icon: "/brand/mindease-app-icon.svg",
    shortcut: "/brand/mindease-app-icon.svg",
    apple: "/brand/mindease-app-icon.svg",
  },
  openGraph: {
    title: "MindEase Online Clinic",
    description:
      "Book confidential online therapy with qualified psychologists and therapists.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contactSettings = await getPublicContactSettings();

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <HelpChat whatsappNumber={contactSettings.whatsappNumber} />
        <ScrollAnimations />
      </body>
    </html>
  );
}
