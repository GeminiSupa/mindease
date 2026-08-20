import type { Metadata } from "next";
import "./globals.css";
import HelpChat from "./components/HelpChat";
import { getPublicContactSettings } from "./site-settings";

export const metadata: Metadata = {
  title: "MindEase Online Clinic",
  description:
    "Private online therapy sessions with qualified clinical psychologists and experienced therapists.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
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
        {children}
        <HelpChat whatsappNumber={contactSettings.whatsappNumber} />
      </body>
    </html>
  );
}
