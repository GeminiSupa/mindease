import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Therapist dashboard",
  robots: { index: false, follow: false, noarchive: true },
};

export default function TherapistDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

