"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type HelpTopic = "match" | "booking" | "checks" | "privacy" | "urgent";

const topicContent: Record<HelpTopic, { title: string; body: string }> = {
  match: {
    title: "Find the right therapist",
    body: "Compare admin-approved profiles by focus area, language, fee, and availability. If no profile feels right, the care coordinator can suggest alternatives.",
  },
  booking: {
    title: "Appointments and fees",
    body: "Fees and available session times appear on each published therapist profile. MindEase confirms the therapist and timing before payment is requested.",
  },
  checks: {
    title: "Try a private self-check",
    body: "The short wellbeing checks give an immediate informational result. Answers are not saved and the checks are not a diagnosis.",
  },
  privacy: {
    title: "Privacy and contact",
    body: "This assistant does not collect or store messages. Contact details are shared only when you choose WhatsApp, phone, or the private inquiry form.",
  },
  urgent: {
    title: "Need urgent help?",
    body: "MindEase is not an emergency service. If you or someone else may be in immediate danger, contact local emergency services, go to the nearest hospital emergency department, or ask a trusted person nearby for urgent help.",
  },
};

export default function HelpChat({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname();
  const panelId = useId();
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/therapist") ||
    pathname.startsWith("/appointments")
  ) {
    return null;
  }

  const normalizedNumber = whatsappNumber.replace(/\D/g, "");
  const hasWhatsApp = /^\d{8,15}$/.test(normalizedNumber);
  const whatsappHref = hasWhatsApp
    ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(
        "Hello MindEase, I would like help finding the right therapist.",
      )}`
    : "/#contact";
  const activeTopic = topic ? topicContent[topic] : null;

  return (
    <aside className="help-chat" aria-label="MindEase help assistant">
      {isOpen ? (
        <section
          className="help-chat-panel"
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          ref={panelRef}
          tabIndex={-1}
        >
          <header className="help-chat-head">
            <div className="help-chat-brand" aria-hidden="true">ME</div>
            <div>
              <strong id={titleId}>MindEase help</strong>
              <span>Automated guidance</span>
            </div>
            <button
              className="help-chat-close"
              type="button"
              aria-label="Close help assistant"
              onClick={() => {
                setIsOpen(false);
                window.requestAnimationFrame(() => launcherRef.current?.focus());
              }}
            >
              &times;
            </button>
          </header>

          <div className="help-chat-body">
            <div className="help-chat-message">
              <strong>How can we guide you?</strong>
              <p>Choose a topic. No answers or personal details are stored here.</p>
            </div>

            {activeTopic ? (
              <div className={`help-chat-answer${topic === "urgent" ? " is-urgent" : ""}`}>
                <button type="button" onClick={() => setTopic(null)}>Back to topics</button>
                <strong>{activeTopic.title}</strong>
                <p>{activeTopic.body}</p>
                {topic === "match" && <a href="/therapists">View therapists</a>}
                {topic === "checks" && <a href="/self-tests">Open self-checks</a>}
                {topic === "booking" && <a href="/therapists">Check profiles and fees</a>}
              </div>
            ) : (
              <div className="help-chat-topics" aria-label="Help topics">
                <button type="button" onClick={() => setTopic("match")}>Find a therapist</button>
                <button type="button" onClick={() => setTopic("booking")}>Appointments and fees</button>
                <button type="button" onClick={() => setTopic("checks")}>Self-checks</button>
                <button type="button" onClick={() => setTopic("privacy")}>Privacy</button>
                <button className="urgent" type="button" onClick={() => setTopic("urgent")}>I need urgent help</button>
              </div>
            )}
          </div>

          <footer className="help-chat-footer">
            <a href={whatsappHref}>
              {hasWhatsApp ? "Continue on WhatsApp" : "Contact MindEase"}
            </a>
            <small>Replies depend on coordinator availability</small>
          </footer>
        </section>
      ) : null}

      <button
        className="help-chat-launcher"
        type="button"
        aria-label="Open MindEase help assistant"
        aria-expanded={isOpen}
        aria-controls={panelId}
        ref={launcherRef}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="help-chat-icon" aria-hidden="true"><i /><i /><i /></span>
        <span>Need help?</span>
      </button>
    </aside>
  );
}
