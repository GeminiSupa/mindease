import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "MindEase Online Clinic",
    description:
      "Private online therapy sessions with qualified clinical psychologists and experienced therapists.",
    metadataBase: new URL(origin),
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: "MindEase Online Clinic",
      description: "Private care. Thoughtful matching.",
      type: "website",
      images: [{ url: "/og.png", width: 1731, height: 909, alt: "MindEase Online Clinic" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "MindEase Online Clinic",
      description: "Private care. Thoughtful matching.",
      images: ["/og.png"],
    },
  };
}

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
