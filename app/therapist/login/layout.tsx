import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Therapist sign in",
  robots: { index: false, follow: false, noarchive: true },
};

export default function TherapistLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

