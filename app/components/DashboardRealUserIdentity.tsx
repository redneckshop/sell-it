"use client";

import { useEffect, useState } from "react";
import {
  getCachedRealUserIdentity,
  REAL_USER_IDENTITY_CHANGED_EVENT,
  resolveRealUserIdentity,
  type RealUserIdentitySnapshot,
} from "../lib/userIdentity";

function greetingForNow() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 22) return "Good Evening";

  return "Hello";
}

function firstName(value: string) {
  const clean = value.trim();

  if (!clean || clean === "No profile found") return "there";

  return clean.split(/\s+/)[0] || clean;
}

function displayNameFromIdentity(
  identity: RealUserIdentitySnapshot | null,
  fallbackName: string
) {
  if (identity?.isAuthenticated && identity.displayName) {
    return identity.displayName;
  }

  return fallbackName || "No profile found";
}

function useDashboardIdentity(fallbackName: string) {
  const [identity, setIdentity] = useState<RealUserIdentitySnapshot | null>(
    () => getCachedRealUserIdentity()
  );

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

    return () => {
      active = false;
      window.removeEventListener(
        REAL_USER_IDENTITY_CHANGED_EVENT,
        handleIdentityChange
      );
    };
  }, []);

  return displayNameFromIdentity(identity, fallbackName);
}

export function DashboardUserGreeting({
  fallbackName,
}: {
  fallbackName: string;
}) {
  const displayName = useDashboardIdentity(fallbackName);

  return (
    <h1
      style={{
        fontSize: "42px",
        lineHeight: 1.05,
        margin: "0 0 10px",
      }}
    >
      {greetingForNow()}, {firstName(displayName)}
    </h1>
  );
}

export function DashboardLoggedInUser({
  fallbackName,
}: {
  fallbackName: string;
}) {
  const displayName = useDashboardIdentity(fallbackName);

  return <strong>{displayName}</strong>;
}
