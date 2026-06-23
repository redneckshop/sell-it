"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import { clearSellItAuthCookie } from "../lib/authSessionCookie";
import {
  clearCachedRealUserIdentity,
  getCachedRealUserIdentity,
  REAL_USER_IDENTITY_CHANGED_EVENT,
  resolveRealUserIdentity,
  type RealUserIdentitySnapshot,
} from "../lib/userIdentity";

const wrapperStyle: CSSProperties = {
  position: "relative",
  flexShrink: 0,
};

const avatarButtonStyle: CSSProperties = {
  minWidth: "38px",
  height: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(167, 139, 250, 0.44)",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(37, 99, 235, 0.75))",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(37, 99, 235, 0.22)",
};

const menuStyle: CSSProperties = {
  position: "absolute",
  top: "46px",
  right: 0,
  width: "286px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  background:
    "linear-gradient(180deg, rgba(23,23,23,0.99), rgba(12,12,14,0.99))",
  boxShadow: "0 24px 70px rgba(0,0,0,0.62)",
  padding: "12px",
  zIndex: 130,
};

const labelStyle: CSSProperties = {
  margin: "0 0 4px",
  color: "#a78bfa",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1.4px",
  fontWeight: 950,
};

const nameStyle: CSSProperties = {
  margin: 0,
  color: "white",
  fontSize: "16px",
  fontWeight: 950,
};

const metaStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#a3a3a3",
  fontSize: "12px",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const menuLinkStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "999px",
  padding: "9px 11px",
  backgroundColor: "rgba(255,255,255,0.04)",
  color: "#f8fafc",
  textDecoration: "none",
  cursor: "pointer",
  fontWeight: 850,
  textAlign: "center",
};

const signOutButtonStyle: CSSProperties = {
  ...menuLinkStyle,
  border: "1px solid rgba(248, 113, 113, 0.38)",
  color: "#fecaca",
};

function initialsForIdentity(identity: RealUserIdentitySnapshot | null) {
  const source =
    identity?.displayName ||
    identity?.email ||
    "User";

  const clean = source.trim();

  if (!clean) return "U";

  const emailName = clean.includes("@") ? clean.split("@")[0] : clean;
  const pieces = emailName
    .split(/[\s._-]+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  if (pieces.length >= 2) {
    return `${pieces[0][0]}${pieces[1][0]}`.toUpperCase();
  }

  return emailName.slice(0, 2).toUpperCase();
}

function accountMeta(identity: RealUserIdentitySnapshot | null) {
  if (!identity?.isAuthenticated) {
    return "Not logged in";
  }

  return [identity.workspaceName, identity.roleTitle || "Role not set"]
    .filter(Boolean)
    .join(" · ");
}

export default function UserAvatarMenu() {
  const [identity, setIdentity] = useState<RealUserIdentitySnapshot | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadIdentity() {
      const resolved = await resolveRealUserIdentity();

      if (active) {
        setIdentity(resolved);
      }
    }

    void loadIdentity();

    function handleIdentityChange() {
      setIdentity(getCachedRealUserIdentity());
    }

    window.addEventListener(
      REAL_USER_IDENTITY_CHANGED_EVENT,
      handleIdentityChange
    );

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadIdentity();
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearCachedRealUserIdentity();
    clearSellItAuthCookie();
    setOpen(false);
    window.location.href = "/login";
  }

  const isRealLogin = Boolean(identity?.isAuthenticated && identity.profileId);

  return (
    <div style={wrapperStyle}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={avatarButtonStyle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account menu"
      >
        {initialsForIdentity(identity)}
      </button>

      {open ? (
        <div style={menuStyle} role="menu">
          <p style={labelStyle}>Account</p>
          <p style={nameStyle}>
            {identity?.isAuthenticated
              ? identity.displayName
              : "No real login"}
          </p>

          <p style={metaStyle}>
            {identity?.email || "No email available"}
          </p>

          <p style={metaStyle}>{accountMeta(identity)}</p>

          <div style={actionRowStyle}>
            {isRealLogin ? (
              <button
                type="button"
                onClick={handleSignOut}
                style={signOutButtonStyle}
                role="menuitem"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/login" style={menuLinkStyle} role="menuitem">
                Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}



