"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import {
  getCachedRealUserIdentity,
  REAL_USER_IDENTITY_CHANGED_EVENT,
  resolveRealUserIdentity,
  type RealUserIdentitySnapshot,
} from "../lib/userIdentity";

const wrapperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "44px",
  padding: "8px 12px",
  borderRadius: "999px",
  border: "1px solid rgba(34, 197, 94, 0.35)",
  background: "rgba(15, 23, 42, 0.78)",
  color: "#f8fafc",
  whiteSpace: "nowrap",
};

const textBlockStyle: CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "2px",
};

const labelStyle: CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#86efac",
  fontWeight: 800,
  lineHeight: 1,
};

const nameStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: 1.15,
};

const metaStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  color: "#cbd5e1",
  lineHeight: 1.15,
};

const actionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "28px",
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.24)",
  background: "rgba(2,6,23,0.5)",
  color: "#e9d5ff",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
};

function identityMeta(identity: RealUserIdentitySnapshot | null) {
  if (!identity) return "Checking login...";

  if (!identity.isAuthenticated) {
    return "Development fallback active";
  }

  const pieces = [
    identity.workspaceName,
    identity.roleTitle || "Role not set",
  ].filter(Boolean);

  return pieces.join(" · ");
}

export default function UserIdentityStatus() {
  const [identity, setIdentity] = useState<RealUserIdentitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadIdentity() {
      setLoading(true);

      const resolved = await resolveRealUserIdentity();

      if (active) {
        setIdentity(resolved);
        setLoading(false);
      }
    }

    loadIdentity();

    const handleIdentityChange = () => {
      setIdentity(getCachedRealUserIdentity());
    };

    window.addEventListener(
      REAL_USER_IDENTITY_CHANGED_EVENT,
      handleIdentityChange
    );

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadIdentity();
    });

    return () => {
      active = false;
      window.removeEventListener(
        REAL_USER_IDENTITY_CHANGED_EVENT,
        handleIdentityChange
      );
      authListener.subscription.unsubscribe();
    };
  }, []);


  const isRealLogin = Boolean(identity?.isAuthenticated && identity.profileId);

  return (
    <div
      style={{
        ...wrapperStyle,
        borderColor: isRealLogin
          ? "rgba(34, 197, 94, 0.42)"
          : "rgba(245, 158, 11, 0.45)",
      }}
      title={
        isRealLogin
          ? "Real Supabase login identity detected."
          : "No real login identity detected. Development fallback remains available."
      }
    >
      <span style={textBlockStyle}>
        <span style={labelStyle}>{isRealLogin ? "Real Login" : "Login Check"}</span>
        <span style={nameStyle}>
          {loading
            ? "Checking..."
            : identity?.isAuthenticated
              ? identity.displayName
              : "No real login"}
        </span>
        <span style={metaStyle}>{identityMeta(identity)}</span>
      </span>


    </div>
  );
}


