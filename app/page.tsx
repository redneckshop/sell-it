import Link from "next/link";
import type { CSSProperties } from "react";
import AssistantQuickLaunch from "./components/AssistantQuickLaunch";
import HomeSearch from "./components/HomeSearch";
import { supabase } from "./lib/supabase";
import { DashboardLoggedInUser, DashboardUserGreeting } from "./components/DashboardRealUserIdentity";

type SupabaseRelation<T> = T | T[] | null;

type ProfileWorkspace = {
  name: string | null;
};

type Profile = {
  full_name: string | null;
  email: string | null;
  workspaces: SupabaseRelation<ProfileWorkspace>;
};

type RelatedCompany = {
  id: string;
  name: string;
};

type RelatedContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type RelatedOpportunity = {
  id: string;
  name: string;
};

type TeamMember = {
  id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  role_title: string | null;
  status: string;
};

type Task = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  assigned_team_member_id: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  opportunities: SupabaseRelation<RelatedOpportunity>;
};

type Opportunity = {
  id: string;
  name: string;
  stage: string;
  lead_temperature: string;
  next_step: string | null;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  is_archived: boolean | null;
  updated_at: string | null;
  companies: SupabaseRelation<RelatedCompany>;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  outcome: string | null;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  tags: string | null;
  created_at: string | null;
};

type PainPoint = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string | null;
};

type IntelligenceItem = {
  id: string;
  href: string;
  label: string;
  title: string;
  detail: string;
  date: string | null;
};

type Recommendation = {
  title: string;
  detail: string;
  href: string;
  tone: "danger" | "warning" | "good" | "neutral";
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function getTodayString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function addDaysKey(startKey: string, days: number) {
  const [year, month, day] = startKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateKey(value: string | null) {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) return match[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string | null) {
  const key = dateKey(value);
  if (!key) return "No date";
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function formatDateTime(value: string | null) {
  if (!value) return "No date";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDisplayDate(today: string) {
  const [year, month, day] = today.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "Value not set";
  return `$${Number(value).toLocaleString()}/mo`;
}

function isActiveTask(task: Task) {
  return task.status !== "Completed" && task.status !== "Cancelled";
}

function isHighPriority(task: Task) {
  return task.priority === "High" || task.priority === "Urgent";
}

function priorityRank(task: Task) {
  if (task.priority === "Urgent") return 0;
  if (task.priority === "High") return 1;
  if (task.priority === "Normal") return 2;
  if (task.priority === "Low") return 3;
  return 4;
}

function taskSortValue(task: Task) {
  return dateKey(task.due_date) || "9999-12-31";
}

function sortPriorityTasks(tasks: Task[]) {
  return tasks
    .slice()
    .sort((left, right) => {
      const priorityDiff = priorityRank(left) - priorityRank(right);
      if (priorityDiff !== 0) return priorityDiff;
      return taskSortValue(left).localeCompare(taskSortValue(right));
    });
}

function contactName(contact: RelatedContact | null) {
  if (!contact) return "No contact";
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function taskContext(task: Task) {
  const company = singleRelation(task.companies);
  const contact = singleRelation(task.contacts);
  const opportunity = singleRelation(task.opportunities);
  return [company?.name, contactName(contact), opportunity?.name]
    .filter((value) => value && value !== "No contact")
    .join(" | ");
}

function isOpportunityActive(opportunity: Opportunity) {
  return !opportunity.is_archived;
}

function isHotOpportunity(opportunity: Opportunity) {
  return opportunity.lead_temperature === "Hot";
}

function isActiveOpportunity(opportunity: Opportunity) {
  const stage = (opportunity.stage || "").toLowerCase();
  return (
    opportunity.lead_temperature === "Active" ||
    stage.includes("active") ||
    stage.includes("accepted") ||
    stage.includes("scheduled")
  );
}

function isAtRiskOpportunity(opportunity: Opportunity, today: string) {
  const stage = (opportunity.stage || "").toLowerCase();
  const closeDate = dateKey(opportunity.expected_close_date);
  return (
    opportunity.lead_temperature === "Dead" ||
    stage.includes("paused") ||
    stage.includes("lost") ||
    (!opportunity.next_step && opportunity.stage !== "Customer") ||
    Boolean(closeDate && closeDate < today)
  );
}

function taskMatchesTeamMember(task: Task, member: TeamMember) {
  return (
    task.assigned_team_member_id === member.id ||
    Boolean(member.profile_id && task.assigned_to === member.profile_id)
  );
}

function findTeamMember(teamMembers: TeamMember[], targetName: string) {
  const normalizedTarget = targetName.toLowerCase();
  return (
    teamMembers.find((member) =>
      (member.display_name || "").toLowerCase().includes(normalizedTarget)
    ) ?? null
  );
}

function buildTeamWorkloadRows({
  teamMembers,
  openTasks,
  today,
  weekEnd,
}: {
  teamMembers: TeamMember[];
  openTasks: Task[];
  today: string;
  weekEnd: string;
}) {
  return ["Charles", "Trent", "Angel"].map((name) => {
    const member = findTeamMember(teamMembers, name);
    const assignedTasks = member
      ? openTasks.filter((task) => taskMatchesTeamMember(task, member))
      : [];
    const overdueTasks = assignedTasks.filter((task) => {
      const due = dateKey(task.due_date);
      return Boolean(due) && due < today;
    });
    const todayTasks = assignedTasks.filter(
      (task) => dateKey(task.due_date) === today
    );
    const thisWeekTasks = assignedTasks.filter((task) => {
      const due = dateKey(task.due_date);
      return Boolean(due) && due > today && due <= weekEnd;
    });

    return {
      name: member?.display_name || name,
      role: member?.role_title || null,
      href: member ? `/planner?workload_member=${member.id}` : "/planner",
      open: assignedTasks.length,
      overdue: overdueTasks.length,
      today: todayTasks.length,
      week: thisWeekTasks.length,
    };
  });
}

function buildIntelligenceFeed({
  activities,
  notes,
  painPoints,
}: {
  activities: Activity[];
  notes: Note[];
  painPoints: PainPoint[];
}) {
  const activityItems: IntelligenceItem[] = activities.map((activity) => {
    const isEmailIntelligence =
      activity.activity_type === "Email" ||
      activity.subject.toLowerCase().includes("email");
    return {
      id: `activity-${activity.id}`,
      href: `/activities/${activity.id}`,
      label: isEmailIntelligence ? "Email Intelligence" : "Activity",
      title: activity.subject,
      detail: `${activity.activity_type} | ${activity.outcome || "No outcome"}`,
      date: activity.activity_date,
    };
  });

  const noteItems: IntelligenceItem[] = notes.map((note) => ({
    id: `note-${note.id}`,
    href: `/notes/${note.id}`,
    label: "Note",
    title: note.title,
    detail:
      note.body && note.body.length > 120
        ? `${note.body.slice(0, 120)}...`
        : note.body || note.source || note.tags || "No note body",
    date: note.created_at,
  }));

  const painPointItems: IntelligenceItem[] = painPoints.map((painPoint) => ({
    id: `pain-point-${painPoint.id}`,
    href: `/pain-points/${painPoint.id}`,
    label: "Pain Point",
    title: painPoint.name,
    detail:
      painPoint.description && painPoint.description.length > 120
        ? `${painPoint.description.slice(0, 120)}...`
        : painPoint.description || painPoint.category || "No description yet",
    date: painPoint.created_at,
  }));

  return [...activityItems, ...noteItems, ...painPointItems]
    .sort((left, right) => (right.date || "").localeCompare(left.date || ""))
    .slice(0, 10);
}

function buildAssistantRecommendations({
  overdueTasks,
  tasksDueToday,
  highPriorityTasks,
  atRiskOpportunities,
  hotOpportunities,
}: {
  overdueTasks: Task[];
  tasksDueToday: Task[];
  highPriorityTasks: Task[];
  atRiskOpportunities: Opportunity[];
  hotOpportunities: Opportunity[];
}) {
  const recommendations: Recommendation[] = [];
  const topOverdue = sortPriorityTasks(overdueTasks)[0];
  const topToday = sortPriorityTasks(tasksDueToday)[0];
  const topHighPriority = sortPriorityTasks(highPriorityTasks)[0];
  const topRisk = atRiskOpportunities[0];
  const topHot = hotOpportunities[0];

  if (topOverdue) {
    recommendations.push({
      title: `Clear overdue task: ${topOverdue.title}`,
      detail: `Due ${formatDate(topOverdue.due_date)}. ${taskContext(topOverdue) || "No linked record"}.`,
      href: `/tasks/${topOverdue.id}`,
      tone: "danger",
    });
  }

  if (topRisk) {
    const company = singleRelation(topRisk.companies);
    recommendations.push({
      title: `Review at-risk opportunity: ${topRisk.name}`,
      detail: `${company?.name || "No company"} | ${topRisk.stage} | ${topRisk.next_step || "No next step saved"}`,
      href: `/opportunities/${topRisk.id}`,
      tone: "warning",
    });
  }

  if (topToday) {
    recommendations.push({
      title: `Work today's priority: ${topToday.title}`,
      detail: `${topToday.priority || "No priority"} | ${taskContext(topToday) || "No linked record"}.`,
      href: `/tasks/${topToday.id}`,
      tone: "warning",
    });
  }

  if (topHighPriority && topHighPriority.id !== topOverdue?.id && topHighPriority.id !== topToday?.id) {
    recommendations.push({
      title: `Handle high-priority task: ${topHighPriority.title}`,
      detail: `${topHighPriority.priority || "No priority"} | Due ${formatDate(topHighPriority.due_date)}.`,
      href: `/tasks/${topHighPriority.id}`,
      tone: "warning",
    });
  }

  if (topHot) {
    const company = singleRelation(topHot.companies);
    recommendations.push({
      title: `Advance hot opportunity: ${topHot.name}`,
      detail: `${company?.name || "No company"} | ${topHot.stage} | ${topHot.next_step || "Confirm next step"}.`,
      href: `/opportunities/${topHot.id}`,
      tone: "good",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Open Assistant for a full business scan",
      detail:
        "No urgent dashboard signals are standing out. Ask Assistant what needs attention next.",
      href: "/assistant",
      tone: "neutral",
    });
  }

  return recommendations.slice(0, 3);
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    background:
      "radial-gradient(circle at top left, rgba(124,58,237,0.20), transparent 30%), radial-gradient(circle at 85% 10%, rgba(59,130,246,0.12), transparent 26%), #101010",
    color: "white",
    fontFamily: "Arial, sans-serif",
    padding: "34px",
    boxSizing: "border-box",
  };
}

function shellStyle(): CSSProperties {
  return {
    maxWidth: "1320px",
    margin: "0 auto",
  };
}

function panelStyle(): CSSProperties {
  return {
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "20px",
    padding: "18px",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(18,18,18,0.96))",
    boxShadow: "0 18px 46px rgba(0,0,0,0.24)",
  };
}

function elevatedPanelStyle(): CSSProperties {
  return {
    ...panelStyle(),
    background:
      "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(17, 24, 39, 0.96))",
  };
}

function compactPanelStyle(): CSSProperties {
  return {
    ...panelStyle(),
    padding: "14px",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
}

function eyebrowStyle(): CSSProperties {
  return {
    ...mutedTextStyle(),
    textTransform: "uppercase",
    letterSpacing: "2px",
    margin: "0 0 8px",
    fontSize: "12px",
    fontWeight: 900,
  };
}

function sectionHeaderStyle(): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
  };
}

function gridStyle(minWidth: number): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    gap: "14px",
  };
}

function linkStyle(): CSSProperties {
  return {
    color: "white",
    textDecoration: "none",
  };
}

function smallLinkStyle(): CSSProperties {
  return {
    color: "#c4b5fd",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: "13px",
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    backgroundColor: "#7c3aed",
    color: "white",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #8b5cf6",
    boxShadow: "0 12px 24px rgba(124,58,237,0.24)",
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    color: "white",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    padding: "0 14px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: "13px",
  };
}

function badgeStyle(value: string | null, tone: "danger" | "warning" | "good" | "neutral" = "neutral"): CSSProperties {
  const normalized = (value ?? "").toLowerCase();
  const danger = tone === "danger" || normalized.includes("overdue") || normalized === "urgent" || normalized === "hot";
  const warning = tone === "warning" || normalized === "high" || normalized.includes("today") || normalized.includes("risk");
  const good = tone === "good" || normalized.includes("active") || normalized.includes("open");
  return {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: danger
      ? "rgba(239, 68, 68, 0.18)"
      : warning
        ? "rgba(245, 158, 11, 0.20)"
        : good
          ? "rgba(34, 197, 94, 0.16)"
          : "rgba(156, 163, 175, 0.16)",
    color: danger ? "#fca5a5" : warning ? "#fcd34d" : good ? "#86efac" : "#d1d5db",
  };
}

function emptyState(text: string) {
  return <p style={{ ...mutedTextStyle(), margin: 0 }}>{text}</p>;
}

function TaskList({ tasks, emptyText }: { tasks: Task[]; emptyText: string }) {
  if (tasks.length === 0) return emptyState(emptyText);

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/tasks/${task.id}`}
          style={{
            ...linkStyle(),
            display: "block",
            border: "1px solid rgba(148, 163, 184, 0.16)",
            borderRadius: "14px",
            padding: "12px",
            backgroundColor: "rgba(15, 23, 42, 0.44)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <strong>{task.title}</strong>
            <span style={badgeStyle(task.priority)}>{task.priority || "No priority"}</span>
          </div>
          <p style={{ ...mutedTextStyle(), margin: "7px 0 0", fontSize: "13px" }}>
            Due {formatDate(task.due_date)} | {task.status || "No status"}
            {taskContext(task) ? ` | ${taskContext(task)}` : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}

function OpportunityRows({
  title,
  opportunities,
  emptyText,
  tone,
}: {
  title: string;
  opportunities: Opportunity[];
  emptyText: string;
  tone: "danger" | "warning" | "good" | "neutral";
}) {
  return (
    <div style={compactPanelStyle()}>
      <div style={sectionHeaderStyle()}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>{title}</h3>
        <span style={badgeStyle(String(opportunities.length), tone)}>{opportunities.length}</span>
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        {opportunities.length === 0 && emptyState(emptyText)}
        {opportunities.map((opportunity) => {
          const company = singleRelation(opportunity.companies);
          return (
            <Link
              key={`${title}-${opportunity.id}`}
              href={`/opportunities/${opportunity.id}`}
              style={{
                ...linkStyle(),
                border: "1px solid rgba(148, 163, 184, 0.16)",
                borderRadius: "14px",
                padding: "12px",
                backgroundColor: "rgba(15, 23, 42, 0.38)",
              }}
            >
              <strong>{opportunity.name}</strong>
              <p style={{ ...mutedTextStyle(), margin: "7px 0 0", fontSize: "13px" }}>
                {company?.name || "No company"} | {opportunity.stage} | {formatMoney(opportunity.estimated_monthly_value)}
              </p>
              <p style={{ margin: "7px 0 0", fontSize: "13px", color: "#e5e7eb" }}>
                Next: {opportunity.next_step || "No next step saved"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function Home() {
  const today = getTodayString();
  const weekEnd = addDaysKey(today, 7);

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(`
      full_name,
      email,
      workspaces (
        name
      )
    `)
    .limit(1);

  const profile = profiles?.[0] as unknown as Profile | undefined;
  const workspace = singleRelation(profile?.workspaces);
  const workspaceName = workspace?.name ?? "No workspace found";
  const fullName = profile?.full_name ?? "No profile found";

  const { count: companyCount, error: companyCountError } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true });

  const { count: contactCount, error: contactCountError } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });

  const { count: opportunityCount, error: opportunityCountError } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true });

  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      assigned_to,
      assigned_team_member_id,
      companies ( id, name ),
      contacts ( id, first_name, last_name ),
      opportunities ( id, name )
    `)
    .order("due_date", { ascending: true });

  const { data: teamMemberRows, error: teamMemberError } = await supabase
    .from("team_members")
    .select("id, profile_id, display_name, email, role_title, status")
    .eq("status", "Active")
    .order("display_name", { ascending: true });

  const { data: opportunityRows, error: opportunityError } = await supabase
    .from("opportunities")
    .select(`
      id,
      name,
      stage,
      lead_temperature,
      next_step,
      estimated_monthly_value,
      expected_close_date,
      is_archived,
      updated_at,
      companies ( id, name )
    `)
    .order("updated_at", { ascending: false })
    .limit(50);

  const { data: activityRows, error: activityError } = await supabase
    .from("activities")
    .select("id, activity_type, activity_date, subject, outcome")
    .order("activity_date", { ascending: false })
    .limit(12);

  const { data: noteRows, error: noteError } = await supabase
    .from("notes")
    .select("id, title, body, source, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: painPointRows, error: painPointError } = await supabase
    .from("pain_points")
    .select("id, name, description, category, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  const allTasks = (taskRows ?? []) as unknown as Task[];
  const teamMembers = (teamMemberRows ?? []) as TeamMember[];
  const allOpportunities = (opportunityRows ?? []) as unknown as Opportunity[];
  const recentActivities = (activityRows ?? []) as Activity[];
  const recentNotes = (noteRows ?? []) as Note[];
  const recentPainPoints = (painPointRows ?? []) as PainPoint[];

  const openTasks = allTasks.filter(isActiveTask);
  const tasksDueToday = openTasks.filter((task) => dateKey(task.due_date) === today);
  const overdueTasks = openTasks.filter((task) => {
    const due = dateKey(task.due_date);
    return Boolean(due) && due < today;
  });
  const highPriorityTasks = openTasks.filter(isHighPriority);

  const activeOpportunities = allOpportunities.filter(isOpportunityActive);
  const hotOpportunities = activeOpportunities.filter(isHotOpportunity).slice(0, 5);
  const activePipelineOpportunities = activeOpportunities
    .filter(isActiveOpportunity)
    .slice(0, 5);
  const atRiskOpportunities = activeOpportunities
    .filter((opportunity) => isAtRiskOpportunity(opportunity, today))
    .slice(0, 5);

  const teamWorkloads = buildTeamWorkloadRows({
    teamMembers,
    openTasks,
    today,
    weekEnd,
  });

  const intelligenceFeed = buildIntelligenceFeed({
    activities: recentActivities,
    notes: recentNotes,
    painPoints: recentPainPoints,
  });

  const assistantRecommendations = buildAssistantRecommendations({
    overdueTasks,
    tasksDueToday,
    highPriorityTasks,
    atRiskOpportunities,
    hotOpportunities,
  });

  const topPriorityTasks = sortPriorityTasks([
    ...overdueTasks,
    ...tasksDueToday.filter(
      (task) => !overdueTasks.some((overdueTask) => overdueTask.id === task.id)
    ),
    ...highPriorityTasks.filter(
      (task) =>
        !overdueTasks.some((overdueTask) => overdueTask.id === task.id) &&
        !tasksDueToday.some((todayTask) => todayTask.id === task.id)
    ),
  ]).slice(0, 6);

  const quickActionGroups = [
    {
      title: "Create",
      actions: [
        ["Add Company", "/companies/new"],
        ["Add Contact", "/contacts/new"],
        ["Add Opportunity", "/opportunities/new"],
        ["Add Task", "/tasks/new"],
      ],
    },
    {
      title: "Intelligence",
      actions: [
        ["Capture Intelligence", "/capture"],
        ["Import Leads", "/import-leads"],
        ["Email Intelligence", "/email-intelligence"],
      ],
    },
  ];

  return (
    <main style={pageStyle()}>
      <section style={shellStyle()}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.8fr)",
            gap: "16px",
            alignItems: "stretch",
            marginBottom: "16px",
          }}
        >
          <div style={elevatedPanelStyle()}>
            <p style={eyebrowStyle()}>Executive Command Center</p>
            <DashboardUserGreeting fallbackName={fullName} />
            <p style={{ ...mutedTextStyle(), fontSize: "16px", lineHeight: 1.55, margin: "0 0 18px" }}>
              Open Sell It and immediately see what needs attention, who needs direction, which opportunities are at risk, and what should happen next.
            </p>

            <div style={gridStyle(150)}>
              <div style={compactPanelStyle()}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 7px", fontSize: "12px" }}>Workspace</p>
                <strong>{workspaceName}</strong>
              </div>
              <div style={compactPanelStyle()}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 7px", fontSize: "12px" }}>Logged In User</p>
                <DashboardLoggedInUser fallbackName={fullName} />
              </div>
              <div style={compactPanelStyle()}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 7px", fontSize: "12px" }}>Date</p>
                <strong>{formatDisplayDate(today)}</strong>
              </div>
              <Link href="/planner" style={{ ...compactPanelStyle(), ...linkStyle() }}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 7px", fontSize: "12px" }}>Planner Today</p>
                <strong style={{ fontSize: "28px" }}>{tasksDueToday.length}</strong>
              </Link>
              <Link href="/planner" style={{ ...compactPanelStyle(), ...linkStyle() }}>
                <p style={{ ...mutedTextStyle(), margin: "0 0 7px", fontSize: "12px" }}>Overdue</p>
                <strong style={{ color: overdueTasks.length > 0 ? "#fca5a5" : "#86efac", fontSize: "28px" }}>
                  {overdueTasks.length}
                </strong>
              </Link>
            </div>
          </div>

          <AssistantQuickLaunch />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <HomeSearch />
        </div>

        <section style={{ ...panelStyle(), marginBottom: "16px" }}>
          <div style={sectionHeaderStyle()}>
            <div>
              <p style={eyebrowStyle()}>Today&apos;s Priorities</p>
              <h2 style={{ margin: 0 }}>Highest-priority work</h2>
            </div>
            <Link href="/planner" style={smallLinkStyle()}>
              View Planner
            </Link>
          </div>

          <div style={gridStyle(230)}>
            <Link href="/tasks" style={{ ...compactPanelStyle(), ...linkStyle() }}>
              <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>Overdue Tasks</p>
              <strong style={{ fontSize: "34px", color: overdueTasks.length > 0 ? "#fca5a5" : "#86efac" }}>
                {overdueTasks.length}
              </strong>
            </Link>
            <Link href="/planner" style={{ ...compactPanelStyle(), ...linkStyle() }}>
              <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>Tasks Due Today</p>
              <strong style={{ fontSize: "34px" }}>{tasksDueToday.length}</strong>
            </Link>
            <Link href="/tasks" style={{ ...compactPanelStyle(), ...linkStyle() }}>
              <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>High Priority Tasks</p>
              <strong style={{ fontSize: "34px", color: highPriorityTasks.length > 0 ? "#fcd34d" : "white" }}>
                {highPriorityTasks.length}
              </strong>
            </Link>
            <Link href="/opportunities" style={{ ...compactPanelStyle(), ...linkStyle() }}>
              <p style={{ ...mutedTextStyle(), margin: "0 0 8px" }}>Hot Opportunities</p>
              <strong style={{ fontSize: "34px", color: hotOpportunities.length > 0 ? "#fca5a5" : "white" }}>
                {hotOpportunities.length}
              </strong>
            </Link>
          </div>

          <div style={{ marginTop: "14px" }}>
            <TaskList tasks={topPriorityTasks} emptyText="No overdue, due-today, or high-priority tasks found." />
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.05fr)", gap: "16px", marginBottom: "16px" }}>
          <section style={panelStyle()}>
            <div style={sectionHeaderStyle()}>
              <div>
                <p style={eyebrowStyle()}>Team Workload</p>
                <h2 style={{ margin: 0 }}>Charles, Trent, Angel</h2>
              </div>
              <Link href="/planner" style={smallLinkStyle()}>
                View Planner
              </Link>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {teamWorkloads.map((workload) => (
                <Link key={workload.name} href={workload.href} style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                    <div>
                      <strong>{workload.name}</strong>
                      {workload.role && (
                        <p style={{ ...mutedTextStyle(), margin: "4px 0 0", fontSize: "12px" }}>{workload.role}</p>
                      )}
                    </div>
                    <span style={badgeStyle(workload.overdue > 0 ? "Overdue" : "Open", workload.overdue > 0 ? "danger" : "good")}>
                      {workload.overdue > 0 ? "Needs attention" : "On track"}
                    </span>
                  </div>
                  <div style={{ ...gridStyle(78), marginTop: "12px" }}>
                    <span><strong>{workload.open}</strong><br /><span style={mutedTextStyle()}>Open</span></span>
                    <span><strong>{workload.overdue}</strong><br /><span style={mutedTextStyle()}>Overdue</span></span>
                    <span><strong>{workload.today}</strong><br /><span style={mutedTextStyle()}>Today</span></span>
                    <span><strong>{workload.week}</strong><br /><span style={mutedTextStyle()}>Week</span></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section style={panelStyle()}>
            <div style={sectionHeaderStyle()}>
              <div>
                <p style={eyebrowStyle()}>Assistant Recommendations</p>
                <h2 style={{ margin: 0 }}>Top 3 next moves</h2>
              </div>
              <Link href="/assistant" style={primaryButtonStyle()}>
                Open Assistant
              </Link>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {assistantRecommendations.map((recommendation) => (
                <Link key={recommendation.title} href={recommendation.href} style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <span style={badgeStyle(recommendation.tone, recommendation.tone)}>{recommendation.tone === "danger" ? "Urgent" : recommendation.tone === "warning" ? "Review" : recommendation.tone === "good" ? "Advance" : "Assistant"}</span>
                  <h3 style={{ margin: "10px 0 6px", fontSize: "16px" }}>{recommendation.title}</h3>
                  <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.45 }}>{recommendation.detail}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section style={{ ...panelStyle(), marginBottom: "16px" }}>
          <div style={sectionHeaderStyle()}>
            <div>
              <p style={eyebrowStyle()}>Hot Opportunities</p>
              <h2 style={{ margin: 0 }}>Pipeline command view</h2>
            </div>
            <Link href="/opportunities" style={smallLinkStyle()}>
              View Opportunities
            </Link>
          </div>

          <div style={gridStyle(280)}>
            <OpportunityRows title="Hot" opportunities={hotOpportunities} emptyText="No hot opportunities yet." tone="danger" />
            <OpportunityRows title="Active" opportunities={activePipelineOpportunities} emptyText="No active opportunities yet." tone="good" />
            <OpportunityRows title="At Risk" opportunities={atRiskOpportunities} emptyText="No at-risk opportunities found." tone="warning" />
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.85fr)", gap: "16px" }}>
          <section style={panelStyle()}>
            <div style={sectionHeaderStyle()}>
              <div>
                <p style={eyebrowStyle()}>New Intelligence</p>
                <h2 style={{ margin: 0 }}>Newest business signals</h2>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link href="/activities" style={smallLinkStyle()}>Activities</Link>
                <Link href="/notes" style={smallLinkStyle()}>Notes</Link>
                <Link href="/pain-points" style={smallLinkStyle()}>Pain Points</Link>
              </div>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {intelligenceFeed.length === 0 && emptyState("No new intelligence found yet.")}
              {intelligenceFeed.map((item) => (
                <Link key={item.id} href={item.href} style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
                    <div>
                      <span style={badgeStyle(item.label)}>{item.label}</span>
                      <h3 style={{ margin: "10px 0 6px", fontSize: "16px" }}>{item.title}</h3>
                      <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.45 }}>{item.detail}</p>
                    </div>
                    <span style={{ ...mutedTextStyle(), fontSize: "12px", whiteSpace: "nowrap" }}>{formatDateTime(item.date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <aside style={{ display: "grid", gap: "16px", alignContent: "start" }}>
            <section style={panelStyle()}>
              <p style={eyebrowStyle()}>Quick Actions</p>
              <h2 style={{ margin: "0 0 14px" }}>Clean action groups</h2>
              <div style={{ display: "grid", gap: "14px" }}>
                {quickActionGroups.map((group) => (
                  <div key={group.title}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "15px" }}>{group.title}</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {group.actions.map(([label, href]) => (
                        <Link key={href} href={href} style={secondaryButtonStyle()}>
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle()}>
              <p style={eyebrowStyle()}>Snapshot</p>
              <div style={gridStyle(120)}>
                <Link href="/companies" style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <span style={mutedTextStyle()}>Companies</span><br />
                  <strong style={{ fontSize: "26px" }}>{companyCount ?? 0}</strong>
                </Link>
                <Link href="/contacts" style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <span style={mutedTextStyle()}>Contacts</span><br />
                  <strong style={{ fontSize: "26px" }}>{contactCount ?? 0}</strong>
                </Link>
                <Link href="/opportunities" style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <span style={mutedTextStyle()}>Opportunities</span><br />
                  <strong style={{ fontSize: "26px" }}>{opportunityCount ?? 0}</strong>
                </Link>
                <Link href="/tasks" style={{ ...compactPanelStyle(), ...linkStyle() }}>
                  <span style={mutedTextStyle()}>Open Tasks</span><br />
                  <strong style={{ fontSize: "26px" }}>{openTasks.length}</strong>
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <div style={{ marginTop: "18px" }}>
          {profileError && <p style={{ color: "#fca5a5" }}>Profile error: {profileError.message}</p>}
          {companyCountError && <p style={{ color: "#fca5a5" }}>Company count error: {companyCountError.message}</p>}
          {contactCountError && <p style={{ color: "#fca5a5" }}>Contact count error: {contactCountError.message}</p>}
          {opportunityCountError && <p style={{ color: "#fca5a5" }}>Opportunity count error: {opportunityCountError.message}</p>}
          {taskError && <p style={{ color: "#fca5a5" }}>Task error: {taskError.message}</p>}
          {teamMemberError && <p style={{ color: "#fca5a5" }}>Team member error: {teamMemberError.message}</p>}
          {opportunityError && <p style={{ color: "#fca5a5" }}>Opportunity error: {opportunityError.message}</p>}
          {activityError && <p style={{ color: "#fca5a5" }}>Activity error: {activityError.message}</p>}
          {noteError && <p style={{ color: "#fca5a5" }}>Note error: {noteError.message}</p>}
          {painPointError && <p style={{ color: "#fca5a5" }}>Pain point error: {painPointError.message}</p>}
        </div>
      </section>
    </main>
  );
}


