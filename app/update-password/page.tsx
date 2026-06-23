"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { resolveRealUserIdentity } from "../lib/userIdentity";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "28px",
  color: "#f8fafc",
  background:
    "radial-gradient(circle at top left, rgba(34,197,94,0.22), transparent 35%), #020617",
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
  color: "#86efac",
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
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  boxShadow: "0 16px 40px rgba(34,197,94,0.25)",
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
  color: "#bbf7d0",
  fontWeight: 900,
  textDecoration: "none",
};

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 8) {
      setSaving(false);
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setSaving(false);
      setErrorMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setSaving(false);
      setErrorMessage(
        `${error.message} If you opened this page directly, go back to Login and send yourself a fresh reset link.`
      );
      return;
    }

    const identity = await resolveRealUserIdentity();

    setSaving(false);
    setSuccessMessage(
      identity.isAuthenticated
        ? `Password updated. Signed in as ${identity.displayName}.`
        : "Password updated. Please sign in."
    );

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 900);
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>Sell It / Set Password</p>
        <h1 style={titleStyle}>Set new password</h1>
        <p style={descriptionStyle}>
          Open this page from the password reset email, then choose your new
          Sell It login password.
        </p>

        {errorMessage ? <div style={errorStyle}>Error: {errorMessage}</div> : null}
        {successMessage ? <div style={successStyle}>{successMessage}</div> : null}

        <form onSubmit={handleUpdatePassword}>
          <label style={labelStyle}>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
              autoComplete="new-password"
              required
            />
          </label>

          <label style={labelStyle}>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              style={inputStyle}
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? "Updating password..." : "Set New Password"}
          </button>
        </form>

        <p style={footerStyle}>
          Need a fresh reset email? Go back to{" "}
          <Link href="/login" style={linkStyle}>
            Login
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
