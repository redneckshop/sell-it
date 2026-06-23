"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  clearSellItAuthCookie,
  SELL_IT_AUTH_COOKIE,
} from "../lib/authSessionCookie";

const publicPaths = new Set(["/login", "/update-password"]);

const loadingShellStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.16), transparent 28%), #090909",
  color: "white",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
};

const loadingCardStyle = {
  width: "min(420px, calc(100vw - 40px))",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "22px",
  background:
    "linear-gradient(180deg, rgba(23,23,23,0.98), rgba(12,12,14,0.98))",
  boxShadow: "0 24px 70px rgba(0,0,0,0.44)",
  padding: "24px",
  textAlign: "center" as const,
};

function isPublicPath(pathname: string) {
  return publicPaths.has(pathname);
}

function replaceToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

function hasSellItAuthCookie() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${SELL_IT_AUTH_COOKIE}=true`);
}

function sessionCheckTimeout(milliseconds = 2500) {
  return new Promise<"timeout">((resolve) => {
    window.setTimeout(() => resolve("timeout"), milliseconds);
  });
}

export default function AuthRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);

  // Hydration-safe default:
  // Server and first browser render both show the page. The proxy handles
  // direct signed-out requests before the page loads. This client guard only
  // redirects after mount if the browser cookie/session is missing.
  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useLayoutEffect(() => {
    setMounted(true);

    if (!isPublic && !hasSellItAuthCookie()) {
      setAllowed(false);
      replaceToLogin();
      return;
    }

    setAllowed(true);
  }, [isPublic, pathname]);

  useEffect(() => {
    let active = true;

    async function verifySessionInBackground() {
      if (isPublic) {
        setAllowed(true);
        return;
      }

      if (!hasSellItAuthCookie()) {
        setAllowed(false);
        replaceToLogin();
        return;
      }

      setAllowed(true);

      const result = await Promise.race([
        supabase.auth.getSession(),
        sessionCheckTimeout(),
      ]);

      if (!active) {
        return;
      }

      if (result === "timeout") {
        return;
      }

      if (!result.data.session?.user) {
        clearSellItAuthCookie();
        setAllowed(false);
        replaceToLogin();
      }
    }

    void verifySessionInBackground();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isPublic) {
          setAllowed(true);
          return;
        }

        if (session?.user || hasSellItAuthCookie()) {
          setAllowed(true);
          return;
        }

        clearSellItAuthCookie();
        setAllowed(false);
        replaceToLogin();
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [isPublic, pathname]);

  if (mounted && !isPublic && !allowed) {
    return (
      <div style={loadingShellStyle}>
        <div style={loadingCardStyle}>
          <p
            style={{
              margin: "0 0 8px",
              color: "#a78bfa",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1.8px",
              fontWeight: 950,
            }}
          >
            Sell It
          </p>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Opening login...</h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
