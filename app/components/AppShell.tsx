"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Home / Dashboard", href: "/" },
  { label: "Companies", href: "/companies" },
  { label: "Contacts", href: "/contacts" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Tasks", href: "/tasks" },
  { label: "Activities", href: "/activities" },
  { label: "Notes", href: "/notes" },
  { label: "Communities", href: "/communities" },
  { label: "Posts", href: "/posts" },
  { label: "Pain Points", href: "/pain-points" },
  { label: "Capture", href: "/capture" },
  { label: "Import", href: "/import" },
  { label: "Import Leads", href: "/import-leads" },
  { label: "Merge Manager", href: "/merge" },
  { label: "Assistant", href: "/assistant" },
];

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  backgroundColor: "#111",
  color: "white",
};

const sidebarStyle: CSSProperties = {
  width: "260px",
  minWidth: "260px",
  minHeight: "100vh",
  position: "sticky",
  top: 0,
  alignSelf: "flex-start",
  borderRight: "1px solid #333",
  backgroundColor: "#0b0b0b",
  padding: "24px 18px",
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
};

const brandStyle: CSSProperties = {
  marginBottom: "24px",
  paddingBottom: "18px",
  borderBottom: "1px solid #333",
};

const navLinkBaseStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  marginBottom: "6px",
};

const contentStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={brandStyle}>
          <Link
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "22px",
              fontWeight: "bold",
            }}
          >
            Sell It
          </Link>

          <p style={{ color: "#aaa", margin: "8px 0 0", lineHeight: 1.4 }}>
            Sales operating system
          </p>
        </div>

        <nav aria-label="Sell It navigation">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...navLinkBaseStyle,
                  backgroundColor: active ? "white" : "transparent",
                  color: active ? "black" : "#ddd",
                  border: active ? "1px solid white" : "1px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div style={contentStyle}>{children}</div>
    </div>
  );
}


