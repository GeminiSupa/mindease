import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
