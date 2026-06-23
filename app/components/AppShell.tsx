"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import PageAssistant from "./PageAssistant";
import NotificationCenter from "./NotificationCenter";
import ActingUserSelector from "./ActingUserSelector";
import UserIdentityStatus from "./UserIdentityStatus";

type AppShellProps = {
  children: ReactNode;
};

type AppSection =
  | "dashboard"
  | "sales"
  | "intelligence"
  | "capture"
  | "management"
  | "assistant";

type TopNavItem = {
  label: string;
  href: string;
  section: AppSection;
};

type SidebarItem = {
  label: string;
  href?: string;
  badge?: string;
  description?: string;
  disabled?: boolean;
};

type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

type QuickAddItem = {
  label: string;
  href: string;
};

const topNavItems: TopNavItem[] = [
  { label: "Dashboard", href: "/", section: "dashboard" },
  { label: "Sales", href: "/companies", section: "sales" },
  { label: "Intelligence", href: "/communities", section: "intelligence" },
  { label: "Capture", href: "/capture", section: "capture" },
  { label: "Management", href: "/merge", section: "management" },
  { label: "Assistant", href: "/assistant", section: "assistant" },
];

const contextNavGroups: Record<AppSection, SidebarGroup[]> = {
  dashboard: [
    {
      label: "Command",
      items: [{ label: "Dashboard", href: "/" }],
    },
  ],
  sales: [
    {
      label: "Relationships",
      items: [
        { label: "Companies", href: "/companies" },
        { label: "Contacts", href: "/contacts" },
        { label: "Opportunities", href: "/opportunities" },
      ],
    },
    {
      label: "Work",
      items: [
        { label: "Activities", href: "/activities" },
        { label: "Tasks", href: "/tasks" },
        { label: "Planner", href: "/planner" },
      ],
    },
    {
      label: "People",
      items: [{ label: "Team", href: "/team" }],
    },
  ],
  intelligence: [
    {
      label: "Market Signals",
      items: [
        { label: "Communities", href: "/communities" },
        { label: "Posts", href: "/posts" },
      ],
    },
    {
      label: "Business Intelligence",
      items: [
        { label: "Pain Points", href: "/pain-points" },
        { label: "Email Intelligence", href: "/email-intelligence" },
        { label: "Import Leads", href: "/import-leads" },
      ],
    },
  ],
  capture: [
    {
      label: "Capture Tools",
      items: [
        { label: "AI Capture", href: "/capture" },
        { label: "Import CSV", href: "/import" },
        { label: "Email Capture", href: "/email-intelligence" },
      ],
    },
  ],
  management: [
    {
      label: "Operations",
      items: [
        { label: "Merge Manager", href: "/merge" },
        { label: "Work Log", href: "/work-log" },
        {
          label: "Archive Tools",
          href: "/merge",
          badge: "Tools",
          description: "Archive workflows live with the current management tools.",
        },
        { label: "Team", href: "/team" },
      ],
    },
    {
      label: "Future",
      items: [
        { label: "Permissions", badge: "Future", disabled: true },
        { label: "Notifications", badge: "Future", disabled: true },
        { label: "Automation", badge: "Future", disabled: true },
      ],
    },
  ],
  assistant: [
    {
      label: "Operating System",
      items: [
        { label: "Assistant", href: "/assistant" },
        { label: "Recommendations", href: "/assistant?view=recommendations" },
        { label: "Assignments", href: "/assistant/actions/tasks/assign" },
        { label: "Workload", href: "/assistant?view=workload" },
      ],
    },
    {
      label: "Future",
      items: [
        { label: "Memory", badge: "Future", disabled: true },
        { label: "Insights", badge: "Future", disabled: true },
      ],
    },
  ],
};

const quickAddItems: QuickAddItem[] = [
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
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.16), transparent 28%), #090909",
  color: "white",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
};

const topBarStyle: CSSProperties = {
  height: "64px",
  position: "sticky",
  top: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  gap: "18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(8, 8, 10, 0.94)",
  backdropFilter: "blur(14px)",
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
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #fde68a, #8b5cf6)",
  color: "black",
  fontWeight: 950,
  boxShadow: "0 0 30px rgba(139, 92, 246, 0.32)",
};

const brandTitleStyle: CSSProperties = {
  display: "block",
  fontWeight: 950,
  lineHeight: 1.05,
  fontSize: "18px",
  letterSpacing: "-0.02em",
};

const brandSubtitleStyle: CSSProperties = {
  display: "block",
  color: "#a3a3a3",
  fontSize: "11px",
  marginTop: "2px",
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
  fontWeight: 850,
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
  minWidth: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.1)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  color: "#e5e7eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "12px",
  padding: "0 9px",
  boxSizing: "border-box",
};

const quickAddWrapperStyle: CSSProperties = {
  position: "relative",
};

const quickAddButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(167, 139, 250, 0.72)",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "white",
  padding: "0 17px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(124, 58, 237, 0.32)",
};

const quickAddMenuStyle: CSSProperties = {
  position: "absolute",
  top: "46px",
  right: 0,
  width: "238px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  background:
    "linear-gradient(180deg, rgba(23,23,23,0.98), rgba(12,12,14,0.98))",
  boxShadow: "0 22px 55px rgba(0,0,0,0.58)",
  padding: "9px",
  zIndex: 100,
};

const quickAddMenuHeaderStyle: CSSProperties = {
  padding: "8px 10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "6px",
};

const quickAddMenuTitleStyle: CSSProperties = {
  margin: 0,
  color: "#c4b5fd",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  fontWeight: 950,
};

const quickAddLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "white",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: "12px",
  fontWeight: 900,
};

const layoutStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  minHeight: "calc(100vh - 64px)",
};

const sidebarStyle: CSSProperties = {
  width: "265px",
  minWidth: "265px",
  borderRight: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(180deg, rgba(17, 17, 19, 0.98), rgba(8, 8, 10, 0.98))",
  padding: "18px 14px",
  boxSizing: "border-box",
  position: "sticky",
  top: "64px",
  alignSelf: "flex-start",
  height: "calc(100vh - 64px)",
  overflowY: "auto",
  boxShadow: "18px 0 45px rgba(0,0,0,0.22)",
};

const sectionLabelStyle: CSSProperties = {
  color: "#a78bfa",
  textTransform: "uppercase",
  letterSpacing: "2px",
  fontSize: "11px",
  fontWeight: 950,
  margin: "0 0 9px",
};

const contextDescriptionStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "12.5px",
  lineHeight: 1.45,
  margin: "0 0 15px",
};

const sidebarIntroCardStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.58), rgba(12, 12, 14, 0.7))",
  padding: "12px",
  marginBottom: "14px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
};

const sidebarGroupStyle: CSSProperties = {
  marginTop: "14px",
};

const sidebarGroupTitleStyle: CSSProperties = {
  color: "#8b8b94",
  textTransform: "uppercase",
  letterSpacing: "1.8px",
  fontSize: "10.5px",
  fontWeight: 950,
  margin: "0 0 8px 2px",
};

const navLinkBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "10px 11px",
  borderRadius: "13px",
  textDecoration: "none",
  fontWeight: 900,
  marginBottom: "7px",
  fontSize: "14px",
  border: "1px solid rgba(148, 163, 184, 0.11)",
  boxSizing: "border-box",
};

const navDisabledStyle: CSSProperties = {
  ...navLinkBaseStyle,
  color: "#6b7280",
  border: "1px solid rgba(255,255,255,0.06)",
  backgroundColor: "rgba(255,255,255,0.035)",
  cursor: "not-allowed",
};

const navBadgeStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "3px 7px",
  backgroundColor: "rgba(124, 58, 237, 0.22)",
  border: "1px solid rgba(167, 139, 250, 0.30)",
  color: "#ddd6fe",
  fontSize: "10px",
  fontWeight: 950,
};

const sidebarFooterStyle: CSSProperties = {
  marginTop: "18px",
  paddingTop: "14px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const pageAssistantSlotStyle: CSSProperties = {
  marginTop: "18px",
  paddingTop: "14px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const contentStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

function cleanHref(href: string) {
  return href.split("?")[0].split("#")[0] || "/";
}

function isActivePath(pathname: string, href: string) {
  const cleanPath = cleanHref(href);

  if (cleanPath === "/") {
    return pathname === "/";
  }

  return pathname === cleanPath || pathname.startsWith(`${cleanPath}/`);
}

function getCurrentSection(pathname: string): AppSection {
  if (pathname === "/") {
    return "dashboard";
  }

  if (pathname.startsWith("/assistant")) {
    return "assistant";
  }

  if (pathname.startsWith("/merge") || pathname.startsWith("/work-log")) {
    return "management";
  }

  if (
    pathname.startsWith("/communities") ||
    pathname.startsWith("/posts") ||
    pathname.startsWith("/pain-points") ||
    pathname.startsWith("/email-intelligence") ||
    pathname.startsWith("/import-leads")
  ) {
    return "intelligence";
  }

  if (pathname.startsWith("/capture") || pathname.startsWith("/import")) {
    return "capture";
  }

  if (
    pathname.startsWith("/companies") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/team")
  ) {
    return "sales";
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
      return "Capture";
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
      return "Relationships, opportunities, work, planner, and team workload.";
    case "intelligence":
      return "Communities, posts, pain points, email intelligence, and lead imports.";
    case "capture":
      return "AI capture, CSV import, and email capture tools.";
    case "management":
      return "Operational tools for merge, archive, and team management.";
    case "assistant":
      return "AI help for recommendations, assignments, workload, and decisions.";
    case "dashboard":
    default:
      return "Your executive command center.";
  }
}

function sidebarLinkStyle(active: boolean): CSSProperties {
  if (active) {
    return {
      ...navLinkBaseStyle,
      color: "white",
      background:
        "linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(59, 130, 246, 0.48))",
      border: "1px solid rgba(196, 181, 253, 0.42)",
      boxShadow: "0 14px 30px rgba(124, 58, 237, 0.23)",
    };
  }

  return {
    ...navLinkBaseStyle,
    color: "#f5f5f5",
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.58), rgba(12, 12, 14, 0.72))",
  };
}

function renderSidebarItem(item: SidebarItem, pathname: string) {
  const key = `${item.label}-${item.href ?? item.badge ?? "disabled"}`;

  if (item.disabled || !item.href) {
    return (
      <div key={key} title={item.description} style={navDisabledStyle}>
        <span>{item.label}</span>
        {item.badge && <span style={navBadgeStyle}>{item.badge}</span>}
      </div>
    );
  }

  const active = isActivePath(pathname, item.href);

  return (
    <Link key={key} href={item.href} title={item.description} style={sidebarLinkStyle(active)}>
      <span>{item.label}</span>
      {item.badge ? (
        <span style={navBadgeStyle}>{item.badge}</span>
      ) : active ? (
        <span aria-hidden="true">&gt;</span>
      ) : null}
    </Link>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const currentSection = getCurrentSection(pathname);
  const sidebarGroups = contextNavGroups[currentSection];

  return (
    <div style={shellStyle}>
      <header style={topBarStyle}>
        <Link href="/" style={brandStyle}>
          <span style={logoStyle}>S</span>
          <span>
            <span style={brandTitleStyle}>Sell It</span>
            <span style={brandSubtitleStyle}>Knotty Logistics</span>
          </span>
        </Link>

        <nav aria-label="Main sections" style={topNavStyle}>
          {topNavItems.map((item) => {
            const active = currentSection === item.section;

            return (
              <Link
                key={item.section}
                href={item.href}
                style={{
                  ...topNavLinkBaseStyle,
                  color: active ? "white" : "#d1d5db",
                  background: active
                    ? "linear-gradient(135deg, rgba(124, 58, 237, 0.85), rgba(76, 29, 149, 0.6))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(196, 181, 253, 0.45)"
                    : "1px solid transparent",
                  boxShadow: active
                    ? "0 10px 24px rgba(124, 58, 237, 0.20)"
                    : "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={topUtilityStyle}>
          <Link href="/assistant" style={iconButtonStyle}>
            AI
          </Link>
          <Link href="/planner" style={iconButtonStyle}>
            Plan
          </Link>

          <UserIdentityStatus /> <ActingUserSelector /> <NotificationCenter /> <div style={quickAddWrapperStyle}>
            <button
              type="button"
              onClick={() => setQuickAddOpen((value) => !value)}
              style={quickAddButtonStyle}
              aria-expanded={quickAddOpen}
              aria-haspopup="menu"
            >
              + New 
            </button>

            {quickAddOpen && (
              <div style={quickAddMenuStyle} role="menu">
                <div style={quickAddMenuHeaderStyle}>
                  <p style={quickAddMenuTitleStyle}>Create New Record</p>
                </div>

                {quickAddItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setQuickAddOpen(false)}
                    style={quickAddLinkStyle}
                    role="menuitem"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">+</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <span style={iconButtonStyle}>CC</span>
        </div>
      </header>

      <div style={layoutStyle}>
        <aside style={sidebarStyle}>
          <div style={sidebarIntroCardStyle}>
            <p style={sectionLabelStyle}>{getSectionTitle(currentSection)}</p>
            <p style={contextDescriptionStyle}>{getSectionDescription(currentSection)}</p>
          </div>

          {sidebarGroups.map((group) => (
            <div key={group.label} style={sidebarGroupStyle}>
              <p style={sidebarGroupTitleStyle}>{group.label}</p>
              <div>{group.items.map((item) => renderSidebarItem(item, pathname))}</div>
            </div>
          ))}

          <div style={sidebarFooterStyle}>
            <p style={sidebarGroupTitleStyle}>Area</p>
            <p style={contextDescriptionStyle}>
              Top navigation chooses the business area. This sidebar shows the tools that
              belong to that area.
            </p>
          </div>

          <div style={pageAssistantSlotStyle}>
            <p style={sidebarGroupTitleStyle}>Page Assistant</p>
            <PageAssistant />
          </div>
        </aside>

        <main style={contentStyle}>{children}</main>
      </div>
    </div>
  );
}








