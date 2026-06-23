"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { setSellItAuthCookie } from "../lib/authSessionCookie";
import { resolveRealUserIdentity } from "../lib/userIdentity";


function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value === "/login" || value.startsWith("/login?")) {
    return "/";
  }

  return value;
}

function nextPathFromBrowser() {
  if (typeof window === "undefined") {
    return "/";
  }

  const params = new URLSearchParams(window.location.search);
  return safeNextPath(params.get("next"));
}

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
    setSellItAuthCookie();
    window.location.replace(nextPathFromBrowser());
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
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Sell It / Real User Login</p>
        <h1 style={titleStyle}>Sign in</h1>
        <p style={descriptionStyle}>
          Sign in to access your Sell It workspace, sales tasks, activity history, opportunities, and team dashboard.
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

        <p style={footerStyle}>
          Use your team login email and password. If you do not know the password yet,
          click Send Password Reset Link and set a new one from your email.
        </p>
      </section>
    </main>
  );
}








