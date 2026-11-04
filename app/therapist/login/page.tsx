"use client";

import { useEffect, useState } from "react";
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
  const [notice, setNotice] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmation, setRecoveryConfirmation] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("type") === "recovery" && params.get("access_token")) {
      const token = params.get("access_token") ?? "";
      queueMicrotask(() => {
        setRecoveryToken(token);
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  }, []);
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

      window.location.href = "/therapist/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/therapist/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not send reset email.");
      setNotice("Password reset email sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  async function finishRecovery(event: React.FormEvent) {
    event.preventDefault();
    if (recoveryPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (recoveryPassword !== recoveryConfirmation) return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/therapist/password", {
        method: "PATCH",
        headers: { authorization: `Bearer ${recoveryToken}`, "content-type": "application/json" },
        body: JSON.stringify({ password: recoveryPassword }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not change password.");
      setRecoveryToken("");
      setRecoveryPassword("");
      setRecoveryConfirmation("");
      setNotice("Password changed. You can now sign in with your new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page" id="main-content">
      <section className="admin-login therapist-login">
        <div className="admin-login-copy">
          <Link className="admin-mini-brand" href="/">
            <Image src="/brand/mindease-app-icon.svg" alt="" width={44} height={44} />
            <span>MindEase Therapist Portal</span>
          </Link>
          <p className="admin-kicker">Therapist access</p>
          <h1>Manage your profile and availability in one place.</h1>
          <p>
            Update your professional details, share available times, and view assigned appointments.
            Profile changes are reviewed before they appear publicly.
          </p>
          <div className="admin-feature-list">
            <span>Update your profile</span>
            <span>Share available times</span>
            <span>View appointments</span>
          </div>
        </div>

        {recoveryToken ? (
        <form className="admin-login-card" onSubmit={finishRecovery}>
          <div>
            <span>Account recovery</span>
            <h2>Choose a new password</h2>
            <p>Use at least eight characters.</p>
          </div>
          <label>New password<input autoComplete="new-password" minLength={8} onChange={(event) => setRecoveryPassword(event.target.value)} required type="password" value={recoveryPassword} /></label>
          <label>Confirm password<input autoComplete="new-password" minLength={8} onChange={(event) => setRecoveryConfirmation(event.target.value)} required type="password" value={recoveryConfirmation} /></label>
          {error ? <p className="admin-error" role="alert">{error}</p> : null}
          <button disabled={loading} type="submit">{loading ? "Saving..." : "Set new password"}</button>
        </form>
        ) : (
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div>
            <span>Secure login</span>
            <h2>Therapist sign in</h2>
            <p>Use the email and password provided by MindEase.</p>
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
          {error ? <p className="admin-error" role="alert">{error}</p> : null}
          {notice ? <p className="admin-notice inline" role="status">{notice}</p> : null}
          <button disabled={loading || !email || !password} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button className="admin-secondary-button" disabled={loading || !email} onClick={resetPassword} type="button">
            Forgot password?
          </button>
        </form>
        )}
      </section>
    </main>
  );
}
