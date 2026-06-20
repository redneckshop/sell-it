"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import PageAssistant from "./PageAssistant";

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

const brandTitleStyle: CSSProperties = {
  fontWeight: 900,
  lineHeight: 1.05,
  fontSize: "18px",
};

const brandSubtitleStyle: CSSProperties = {
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
  fontWeight: 800,
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
  fontWeight: 900,
};

const quickAddWrapperStyle: CSSProperties = {
  position: "relative",
};

const quickAddButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid #7c3aed",
  backgroundColor: "#7c3aed",
  color: "white",
  padding: "0 16px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(124, 58, 237, 0.24)",
};

const quickAddMenuStyle: CSSProperties = {
  position: "absolute",
  top: "44px",
  right: 0,
  width: "230px",
  border: "1px solid #333",
  borderRadius: "16px",
  backgroundColor: "#171717",
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
  padding: "8px",
  zIndex: 100,
};

const quickAddMenuHeaderStyle: CSSProperties = {
  padding: "8px 10px 10px",
  borderBottom: "1px solid #2a2a2a",
  marginBottom: "6px",
};

const quickAddMenuTitleStyle: CSSProperties = {
  margin: 0,
  color: "#a78bfa",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1.4px",
  fontWeight: 900,
};

const quickAddLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "white",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  fontWeight: 850,
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
  fontWeight: 900,
  margin: "0 0 10px",
};

const contextDescriptionStyle: CSSProperties = {
  color: "#a3a3a3",
  fontSize: "13px",
  lineHeight: 1.4,
  margin: "0 0 16px",
};

const sidebarGroupStyle: CSSProperties = {
  marginTop: "16px",
};

const sidebarGroupTitleStyle: CSSProperties = {
  color: "#737373",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  fontSize: "10px",
  fontWeight: 900,
  margin: "0 0 8px",
};

const navLinkBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "10px 11px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: 850,
  marginBottom: "6px",
  fontSize: "14px",
};

const navDisabledStyle: CSSProperties = {
  ...navLinkBaseStyle,
  color: "#666",
  border: "1px solid #1f1f1f",
  backgroundColor: "rgba(31,31,31,0.34)",
  cursor: "not-allowed",
};

const navBadgeStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "3px 7px",
  backgroundColor: "rgba(124, 58, 237, 0.18)",
  border: "1px solid rgba(167, 139, 250, 0.22)",
  color: "#c4b5fd",
  fontSize: "10px",
  fontWeight: 900,
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

  if (pathname.startsWith("/merge")) {
    return "management";
  }

  if (pathname.startsWith("/capture") || pathname.startsWith("/import")) {
    return "capture";
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

function renderSidebarItem(
  item: SidebarItem,
  pathname: string,
  closeQuickAdd?: () => void
) {
  if (item.disabled || !item.href) {
    return (
      <div key={item.label} style={navDisabledStyle} title={item.description}>
        <span>{item.label}</span>
        {item.badge && <span style={navBadgeStyle}>{item.badge}</span>}
      </div>
    );
  }

  const active = isActivePath(pathname, item.href);

  return (
    <Link
      key={`${item.label}-${item.href}`}
      href={item.href}
      onClick={closeQuickAdd}
      title={item.description}
      style={{
        ...navLinkBaseStyle,
        color: active ? "#0b0b0b" : "white",
        backgroundColor: active ? "#f5f5f5" : "transparent",
        border: active ? "1px solid #f5f5f5" : "1px solid transparent",
      }}
    >
      <span>{item.label}</span>
      {item.badge ? (
        <span style={navBadgeStyle}>{item.badge}</span>
      ) : active ? (
        <span>â€º</span>
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
        <Link href="/" style={brandStyle} aria-label="Go to Dashboard">
          <span style={logoStyle}>S</span>
          <span>
            <span style={brandTitleStyle}>Sell It</span>
            <span style={brandSubtitleStyle}>Knotty Logistics</span>
          </span>
        </Link>

        <nav aria-label="Primary business areas" style={topNavStyle}>
          {topNavItems.map((item) => {
            const active = currentSection === item.section;

            return (
              <Link
                key={item.section}
                href={item.href}
                style={{
                  ...topNavLinkBaseStyle,
                  color: active ? "white" : "#cfcfcf",
                  backgroundColor: active
                    ? "rgba(124, 58, 237, 0.28)"
                    : "transparent",
                  borderColor: active ? "#7c3aed" : "transparent",
                  boxShadow: active
                    ? "0 0 22px rgba(124, 58, 237, 0.22)"
                    : "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={topUtilityStyle}>
          <Link href="/" style={iconButtonStyle} title="Search from Dashboard">
            ðŸ”Ž
          </Link>
          <span style={iconButtonStyle} title="Notifications are future work">
            ðŸ””
          </span>

          <div style={quickAddWrapperStyle}>
            <button
              type="button"
              onClick={() => setQuickAddOpen((value) => !value)}
              style={quickAddButtonStyle}
              aria-expanded={quickAddOpen}
              aria-haspopup="menu"
            >
              + New â–¾
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
                    <span>+</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <span style={iconButtonStyle} title="Charles Charlebois">
            CC
          </span>
        </div>
      </header>

      <div style={layoutStyle}>
        <aside style={sidebarStyle} aria-label="Context navigation">
          <p style={sectionLabelStyle}>{getSectionTitle(currentSection)}</p>
          <p style={contextDescriptionStyle}>{getSectionDescription(currentSection)}</p>

          {sidebarGroups.map((group) => (
            <div key={group.label} style={sidebarGroupStyle}>
              <p style={sidebarGroupTitleStyle}>{group.label}</p>
              {group.items.map((item) => renderSidebarItem(item, pathname))}
            </div>
          ))}

          <div style={sidebarFooterStyle}>
            <p style={sectionLabelStyle}>Area</p>
            <p style={contextDescriptionStyle}>
              Top navigation chooses the business area. This sidebar now shows the
              tools that belong to that area.
            </p>
          </div>
        </aside>

        <main style={contentStyle}>{children}</main>
      </div>

      <PageAssistant />
    </div>
  );
}
