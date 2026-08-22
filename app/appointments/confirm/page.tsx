"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";

function AppointmentConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(action: "confirm" | "decline") {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/appointments/confirm", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ token, action }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update appointment.");
      }

      setNotice(
        action === "confirm"
          ? "Your therapist match is confirmed. Please wait for the clinic's payment and session instructions."
          : "Your response has been recorded. The coordinator can suggest another therapist if needed.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update appointment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-login">
        <div className="admin-login-copy">
          <Link className="admin-mini-brand" href="/">
            <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
            <span>MindEase</span>
          </Link>
          <p className="admin-kicker">Client confirmation</p>
          <h1>Confirm or decline your suggested therapist match.</h1>
          <p>
            Let the care coordinator know whether this match works for you. Wait for a clinic message before
            sending any payment.
          </p>
          <div className="policy-note">
            MindEase is not emergency support. If there is immediate danger, contact local emergency services,
            go to the nearest emergency department, or ask a trusted person nearby for urgent help.
          </div>
        </div>

        <section className="admin-login-card">
          <div>
            <span>Appointment response</span>
            <h2>Review your decision</h2>
            <p>Choose one option below. If the link has expired, contact the coordinator for a new one.</p>
          </div>
          {!token ? <p className="admin-error">Missing confirmation token.</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}
          {notice ? <p className="admin-notice">{notice}</p> : null}
          <button disabled={loading || !token} onClick={() => void submit("confirm")} type="button">
            {loading ? "Saving..." : "Confirm suggested therapist"}
          </button>
          <button
            className="admin-link-button"
            disabled={loading || !token}
            onClick={() => void submit("decline")}
            type="button"
          >
            Decline and request alternatives
          </button>
        </section>
      </section>
    </main>
  );
}

export default function AppointmentConfirmPage() {
  return (
    <Suspense
      fallback={(
        <main className="admin-page">
          <section className="admin-login">
            <p className="admin-kicker">Loading appointment confirmation</p>
          </section>
        </main>
      )}
    >
      <AppointmentConfirmContent />
    </Suspense>
  );
}
