"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import PageAssistant from "./PageAssistant";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
};

type TopNavItem = {
  label: string;
  href: string;
  section: AppSection;
};

type AppSection =
  | "dashboard"
  | "sales"
  | "intelligence"
  | "capture"
  | "management"
  | "assistant";

const topNavItems: TopNavItem[] = [
  { label: "Dashboard", href: "/", section: "dashboard" },
  { label: "Sales", href: "/companies", section: "sales" },
  { label: "Intelligence", href: "/communities", section: "intelligence" },
  { label: "Capture", href: "/capture", section: "capture" },
  { label: "Management", href: "/team", section: "management" },
  { label: "Assistant", href: "/assistant", section: "assistant" },
];

const contextNavItems: Record<AppSection, NavItem[]> = {
  dashboard: [
    { label: "Dashboard", href: "/" },
    { label: "Companies", href: "/companies" },
    { label: "Contacts", href: "/contacts" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "Tasks", href: "/tasks" },
    { label: "Planner", href: "/planner" },
    { label: "Team", href: "/team" },
    { label: "Activities", href: "/activities" },
    { label: "Notes", href: "/notes" },
  ],
  sales: [
    { label: "Companies", href: "/companies" },
    { label: "Contacts", href: "/contacts" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "Tasks", href: "/tasks" },
    { label: "Planner", href: "/planner" },
    { label: "Activities", href: "/activities" },
    { label: "Notes", href: "/notes" },
  ],
  intelligence: [
    { label: "Communities", href: "/communities" },
    { label: "Posts", href: "/posts" },
    { label: "Pain Points", href: "/pain-points" },
    { label: "Import Leads", href: "/import-leads" },
  ],
  capture: [
    { label: "Capture", href: "/capture" },
    { label: "Email Intelligence", href: "/email-intelligence" },
    { label: "Import", href: "/import" },
  ],
  management: [
    { label: "Team", href: "/team" },
    { label: "Merge Manager", href: "/merge" },
  ],
  assistant: [{ label: "Assistant", href: "/assistant" }],
};

const quickAddItems: NavItem[] = [
  { label: "Company", href: "/companies/new" },
  { label: "Contact", href: "/contacts/new" },
  { label: "Opportunity", href: "/opportunities/new" },
  { label: "Task", href: "/tasks/new" },
  { label: "Activity", href: "/activities/new" },
  { label: "Note", href: "/notes/new" },
  { label: "Community", href: "/communities/new" },
  { label: "Post", href: "/posts/new" },
  { label: "Pain Point", href: "/pain-points/new" },
];

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#101010",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const topBarStyle: CSSProperties = {
  height: "64px",
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  gap: "18px",
  borderBottom: "1px solid #262626",
  backgroundColor: "rgba(12, 12, 12, 0.96)",
  backdropFilter: "blur(10px)",
  padding: "0 22px",
  boxSizing: "border-box",
};

const brandStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: "165px",
  color: "white",
  textDecoration: "none",
};

const logoStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f4c95d, #8b5cf6)",
  color: "black",
  fontWeight: 900,
  boxShadow: "0 0 24px rgba(139, 92, 246, 0.28)",
};

const topNavStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flex: 1,
  minWidth: 0,
  overflowX: "auto",
};

const topNavLinkBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  color: "#cfcfcf",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 700,
  whiteSpace: "nowrap",
  border: "1px solid transparent",
};

const topUtilityStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexShrink: 0,
};

const iconButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid #303030",
  backgroundColor: "#171717",
  color: "#ddd",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontWeight: 800,
};

const quickAddButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid #7c3aed",
  backgroundColor: "#7c3aed",
  color: "white",
  padding: "0 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const quickAddMenuStyle: CSSProperties = {
  position: "absolute",
  top: "44px",
  right: 0,
  width: "210px",
  border: "1px solid #333",
  borderRadius: "14px",
  backgroundColor: "#171717",
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
  padding: "8px",
  zIndex: 100,
};

const layoutStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  minHeight: "calc(100vh - 64px)",
};

const sidebarStyle: CSSProperties = {
  width: "235px",
  minWidth: "235px",
  borderRight: "1px solid #262626",
  backgroundColor: "#0c0c0c",
  padding: "18px 14px",
  boxSizing: "border-box",
  position: "sticky",
  top: "64px",
  alignSelf: "flex-start",
  height: "calc(100vh - 64px)",
  overflowY: "auto",
};

const sectionLabelStyle: CSSProperties = {
  color: "#858585",
  textTransform: "uppercase",
  letterSpacing: "1.6px",
  fontSize: "11px",
  fontWeight: 800,
  margin: "0 0 10px",
};

const contextDescriptionStyle: CSSProperties = {
  color: "#a3a3a3",
  fontSize: "13px",
  lineHeight: 1.4,
  margin: "0 0 16px",
};

const navLinkBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "10px 11px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: 800,
  marginBottom: "6px",
  fontSize: "14px",
};

const sidebarFooterStyle: CSSProperties = {
  marginTop: "20px",
  paddingTop: "16px",
  borderTop: "1px solid #262626",
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

function getCurrentSection(pathname: string): AppSection {
  if (
    pathname.startsWith("/companies") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/planner")
  ) {
    return "sales";
  }

  if (
    pathname.startsWith("/communities") ||
    pathname.startsWith("/posts") ||
    pathname.startsWith("/pain-points") ||
    pathname.startsWith("/import-leads")
  ) {
    return "intelligence";
  }

  if (
    pathname.startsWith("/capture") ||
    pathname.startsWith("/email-intelligence") ||
    pathname.startsWith("/import")
  ) {
    return "capture";
  }

  if (pathname.startsWith("/team") || pathname.startsWith("/merge")) {
    return "management";
  }

  if (pathname.startsWith("/assistant")) {
    return "assistant";
  }

  return "dashboard";
}

function getSectionTitle(section: AppSection) {
  switch (section) {
    case "sales":
      return "Sales";
    case "intelligence":
      return "Intelligence";
    case "capture":
      return "Capture & Import";
    case "management":
      return "Management";
    case "assistant":
      return "Assistant";
    case "dashboard":
    default:
      return "Dashboard";
  }
}

function getSectionDescription(section: AppSection) {
  switch (section) {
    case "sales":
      return "Companies, contacts, opportunities, tasks, activities, and notes.";
    case "intelligence":
      return "Communities, posts, pain points, and lead imports.";
    case "capture":
      return "Capture notes, emails, files, screenshots, and imports.";
    case "management":
      return "Team tools and merge management.";
    case "assistant":
      return "AI help for planning, follow-up, and sales decisions.";
    case "dashboard":
    default:
      return "Your command center and daily overview.";
  }
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [quickAddOpen, setQuickAddOpen] = useState(false);


  const currentSection = getCurrentSection(pathname);
  const sidebarItems = contextNavItems[currentSection];

  return (
    <div style={shellStyle}>
      <header style={topBarStyle}>
        <Link href="/" style={brandStyle}>
          <span style={logoStyle}>S</span>
          <span>
            <span style={{ display: "block", fontSize: "18px", fontWeight: 900 }}>
              Sell It
            </span>
            <span style={{ display: "block", color: "#9ca3af", fontSize: "12px" }}>
              Knotty Logistics
            </span>
          </span>
        </Link>

        <nav aria-label="Sell It top navigation" style={topNavStyle}>
          {topNavItems.map((item) => {
            const active =
              currentSection === item.section ||
              (item.href === "/" && pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...topNavLinkBaseStyle,
                  backgroundColor: active ? "#252038" : "transparent",
                  color: active ? "white" : "#cfcfcf",
                  borderColor: active ? "#7c3aed" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={topUtilityStyle}>
          <Link href="/" style={iconButtonStyle} title="Search">
            🔎
          </Link>

          <span style={iconButtonStyle} title="Notifications">
            🔔
          </span>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setQuickAddOpen((value) => !value)}
              style={quickAddButtonStyle}
            >
              + New ▾
            </button>

            {quickAddOpen && (
              <div style={quickAddMenuStyle}>
                {quickAddItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setQuickAddOpen(false)}
                    style={{
                      display: "block",
                      color: "white",
                      textDecoration: "none",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontWeight: 800,
                    }}
                  >
                    + {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <span
            style={{
              ...iconButtonStyle,
              backgroundColor: "#242424",
              color: "white",
            }}
            title="Charles Charlebois"
          >
            CC
          </span>
        </div>
      </header>

      <div style={layoutStyle}>
        <aside style={sidebarStyle}>
          <p style={sectionLabelStyle}>{getSectionTitle(currentSection)}</p>

          <p style={contextDescriptionStyle}>
            {getSectionDescription(currentSection)}
          </p>

          <nav aria-label="Sell It context navigation">
            {sidebarItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...navLinkBaseStyle,
                    backgroundColor: active ? "#f5f5f5" : "transparent",
                    color: active ? "black" : "#e5e5e5",
                    border: active
                      ? "1px solid #f5f5f5"
                      : "1px solid transparent",
                  }}
                >
                  <span>{item.label}</span>
                  {active && <span>›</span>}
                </Link>
              );
            })}
          </nav>

          <div style={sidebarFooterStyle}>
            <PageAssistant />
          </div>
        </aside>

        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  );
}




