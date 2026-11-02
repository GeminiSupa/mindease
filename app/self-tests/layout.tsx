import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Mental Health Self-Checks",
  description: "Try private, informational mental health self-checks for anxiety, mood, stress, sleep, relationships, and general wellbeing.",
  alternates: { canonical: "/self-tests" },
  openGraph: {
    title: "Private Mental Health Self-Checks | MindEase",
    description: "Short, private self-checks that help you notice patterns and choose a useful next step.",
    url: "/self-tests",
    images: [{ url: "/og.png", alt: "MindEase mental health self-checks" }],
  },
};

export default function SelfTestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

