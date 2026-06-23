"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import {
  clearCachedRealUserIdentity,
  resolveRealUserIdentity,
} from "../lib/userIdentity";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "28px",
  color: "#f8fafc",
  background:
    "radial-gradient(circle at top left, rgba(124,58,237,0.25), transparent 35%), #020617",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  width: "min(520px, 100%)",
  borderRadius: "28px",
  border: "1px solid rgba(148,163,184,0.22)",
  background: "rgba(15,23,42,0.86)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
  padding: "28px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "#a78bfa",
  fontSize: "12px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "38px",
  lineHeight: 1,
};

const descriptionStyle: CSSProperties = {
  margin: "0 0 22px",
  color: "#cbd5e1",
  lineHeight: 1.6,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginBottom: "14px",
  color: "#e2e8f0",
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "16px",
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#0f172a",
  color: "#f8fafc",
  padding: "14px 16px",
  fontSize: "16px",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: "16px",
  padding: "14px 18px",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
  color: "#ffffff",
  background: "linear-gradient(135deg, #7c3aed, #9333ea)",
  boxShadow: "0 16px 40px rgba(124,58,237,0.35)",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  marginTop: "10px",
  background: "#111827",
  border: "1px solid rgba(148,163,184,0.28)",
  boxShadow: "none",
};

const messageStyle: CSSProperties = {
  borderRadius: "16px",
  padding: "14px 16px",
  marginBottom: "16px",
  lineHeight: 1.5,
  fontWeight: 800,
};

const errorStyle: CSSProperties = {
  ...messageStyle,
  color: "#fecaca",
  background: "rgba(127,29,29,0.45)",
  border: "1px solid rgba(248,113,113,0.45)",
};

const successStyle: CSSProperties = {
  ...messageStyle,
  color: "#bbf7d0",
  background: "rgba(22,101,52,0.35)",
  border: "1px solid rgba(74,222,128,0.36)",
};

const footerStyle: CSSProperties = {
  marginTop: "18px",
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.5,
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
  textDecoration: "none",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("charlesjcharlebois@gmail.com");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    const identity = await resolveRealUserIdentity();

    setSaving(false);

    if (!identity.isAuthenticated || !identity.profileId) {
      setErrorMessage(
        identity.errorMessage ||
          "Login worked, but this user does not have a Sell It profile yet."
      );
      return;
    }

    setSuccessMessage(`Signed in as ${identity.displayName}.`);
    router.push("/");
    router.refresh();
  }

  async function handleSendPasswordReset() {
    const cleanEmail = email.trim();

    setChecking(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!cleanEmail) {
      setChecking(false);
      setErrorMessage("Enter your email address first.");
      return;
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/update-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    setChecking(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      `Password reset email sent to ${cleanEmail}. Open that email, click the reset link, then set your new password.`
    );
  }
  async function handleCheckCurrentSession() {
    setChecking(true);
    setErrorMessage("");
    setSuccessMessage("");

    const identity = await resolveRealUserIdentity();

    setChecking(false);

    if (!identity.isAuthenticated || !identity.profileId) {
      setErrorMessage(
        identity.errorMessage ||
          "No real Supabase login session was detected in this browser."
      );
      return;
    }

    setSuccessMessage(
      `Current session detected: ${identity.displayName} / ${identity.workspaceName}.`
    );
  }

  async function handleLogout() {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.auth.signOut();
    clearCachedRealUserIdentity();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Signed out. Development Acting As fallback remains available.");
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Sell It / Real User Login</p>
        <h1 style={titleStyle}>Sign in</h1>
        <p style={descriptionStyle}>
          This is the Real User Auth V1 login path. Acting User remains available
          only as a development/testing fallback.
        </p>

        {errorMessage ? <div style={errorStyle}>Error: {errorMessage}</div> : null}
        {successMessage ? <div style={successStyle}>{successMessage}</div> : null}

        <form onSubmit={handleLogin}>
          <label style={labelStyle}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
              autoComplete="email"
              required
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          disabled={checking || saving}
          onClick={handleSendPasswordReset}
          style={secondaryButtonStyle}
        >
          {checking ? "Working..." : "Send Password Reset Link"}
        </button>

        <button
          type="button"
          disabled={checking || saving}
          onClick={handleCheckCurrentSession}
          style={secondaryButtonStyle}
        >
          {checking ? "Checking..." : "Check Current Session"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleLogout}
          style={secondaryButtonStyle}
        >
          Sign Out
        </button>

        <p style={footerStyle}>
          Back to{" "}
          <Link href="/" style={linkStyle}>
            Dashboard
          </Link>
          . If you do not know the password yet, click Send Password Reset Link and set a new one from your email.
        </p>
      </section>
    </main>
  );
}

