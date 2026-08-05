"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {
    id?: string;
    email?: string;
  };
};

export default function TherapistLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as AuthSession & { error?: string };

      if (!response.ok || !body.access_token) {
        throw new Error(body.error ?? "Login failed.");
      }

      window.localStorage.setItem("mindease-therapist-session", JSON.stringify(body));
      router.push("/therapist/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-login therapist-login">
        <div className="admin-login-copy">
          <Link className="admin-mini-brand" href="/">
            <Image src="/brand/mindease-app-icon.png" alt="" width={44} height={44} />
            <span>MindEase Therapist Portal</span>
          </Link>
          <p className="admin-kicker">Therapist access</p>
          <h1>Maintain your public profile without publishing changes directly.</h1>
          <p>
            Use credentials created by the admin. Profile updates are submitted for approval,
            while availability slots can be added for coordinator review and booking workflows.
          </p>
          <div className="admin-feature-list">
            <span>Profile approval queue</span>
            <span>Availability slots</span>
            <span>Appointment overview</span>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={handleLogin}>
          <div>
            <span>Secure login</span>
            <h2>Therapist sign in</h2>
            <p>Enter the email and temporary password provided by MindEase admin.</p>
          </div>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="therapist@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Temporary password"
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button disabled={loading || !email || !password} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
