import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

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

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
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
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  assigned_to: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  contacts: SupabaseRelation<RelatedContact>;
  opportunities: SupabaseRelation<RelatedOpportunity>;
  assigned_profile: SupabaseRelation<Profile>;
  assigned_team_member_id: string | null;
  assigned_team_member: SupabaseRelation<TeamMember>;
};

type PageProps = {
  searchParams?: Promise<{
    assigned_to?: string;
    status?: string;
    priority?: string;
    workload_member?: string;
    selected_day?: string;
  }>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysKey(startKey: string, days: number) {
  const [year, month, day] = startKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function dateKey(value: string | null) {
  if (!value) return "";

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match?.[1]) {
    return match[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null) {
  const key = dateKey(value);

  if (!key) return "No due date";

  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString();
}

function formatDateFromKey(key: string) {
  if (!key) return "No selected date";

  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function isCompleted(task: Task) {
  return task.status === "Completed";
}

function isCancelled(task: Task) {
  return task.status === "Cancelled";
}

function isActive(task: Task) {
  return !isCompleted(task) && !isCancelled(task);
}

function taskSortDateValue(task: Task) {
  const key = dateKey(task.due_date);

  return key || "9999-12-31";
}

function completedSortValue(task: Task) {
  return task.completed_at || task.updated_at || task.created_at || "";
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function profileLabel(profile: Profile | null) {
  return profile?.full_name || profile?.email || "Unassigned";
}

function teamMemberLabel(member: TeamMember | null) {
  return member?.display_name || member?.email || "Unassigned";
}

function assignedLabel(task: Task) {
  const teamMember = singleRelation(task.assigned_team_member);
  const profile = singleRelation(task.assigned_profile);

  if (teamMember) return teamMemberLabel(teamMember);
  if (profile) return profileLabel(profile);

  return "Unassigned";
}

function contactName(contact: RelatedContact | null) {
  if (!contact) return "Not linked";

  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function taskMatchesFilters(
  task: Task,
  assignedToFilter: string,
  statusFilter: string,
  priorityFilter: string
) {
  return (
    (!assignedToFilter || task.assigned_team_member_id === assignedToFilter) &&
    (!statusFilter || task.status === statusFilter) &&
    (!priorityFilter || task.priority === priorityFilter)
  );
}

function taskPillLabel(task: Task) {
  const priority = task.priority ? `${task.priority}: ` : "";

  return `${priority}${task.title}`;
}

function monthLabel(today: string) {
  const [year, month] = today.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function calendarDaysForMonth(today: string) {
  const [year, month] = today.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);

  const calendarStart = new Date(firstOfMonth);
  calendarStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const calendarEnd = new Date(lastOfMonth);
  calendarEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const days: Array<{
    key: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  const cursor = new Date(calendarStart);

  while (cursor <= calendarEnd) {
    const key = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, "0"),
      String(cursor.getDate()).padStart(2, "0"),
    ].join("-");

    days.push({
      key,
      dayNumber: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === month - 1,
      isToday: key === today,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildPlannerDayHref({
  day,
  assignedToFilter,
  statusFilter,
  priorityFilter,
}: {
  day: string;
  assignedToFilter: string;
  statusFilter: string;
  priorityFilter: string;
}) {
  const params = new URLSearchParams();

  params.set("selected_day", day);

  if (assignedToFilter) params.set("assigned_to", assignedToFilter);
  if (statusFilter) params.set("status", statusFilter);
  if (priorityFilter) params.set("priority", priorityFilter);

  return `/planner?${params.toString()}`;
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "38px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };
}

function panelStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function sectionStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    borderRadius: "16px",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    padding: "18px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function cardStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    borderRadius: "14px",
    padding: "14px",
    backgroundColor: "#151515",
    color: "white",
    textDecoration: "none",
    display: "block",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  };
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #3d3d3d",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#e5e5e5",
    fontSize: "13px",
    fontWeight: 800,
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
    minHeight: "42px",
    color: "white",
    border: "1px solid #3d3d3d",
    backgroundColor: "#151515",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
}

function priorityColor(priority: string | null) {
  if (priority === "Urgent") return "#fca5a5";
  if (priority === "High") return "#fcd34d";
  if (priority === "Low") return "#93c5fd";

  return "#d1d5db";
}

function badgeStyle(value: string | null): CSSProperties {
  const normalized = (value ?? "").toLowerCase();

  const backgroundColor =
    normalized === "urgent" || normalized === "overdue"
      ? "rgba(239, 68, 68, 0.18)"
      : normalized === "high" || normalized.includes("today")
        ? "rgba(245, 158, 11, 0.22)"
        : normalized === "completed"
          ? "rgba(34, 197, 94, 0.20)"
          : normalized === "in progress"
            ? "rgba(124, 58, 237, 0.22)"
            : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized === "urgent" || normalized === "overdue"
      ? "#fca5a5"
      : normalized === "high" || normalized.includes("today")
        ? "#fcd34d"
        : normalized === "completed"
          ? "#86efac"
          : normalized === "in progress"
            ? "#c4b5fd"
            : "#d1d5db";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function statCardStyle(): CSSProperties {
  return {
    ...panelStyle(),
    padding: "14px",
  };
}

function TaskCard({ task }: { task: Task }) {
  const company = singleRelation(task.companies);
  const contact = singleRelation(task.contacts);
  const opportunity = singleRelation(task.opportunities);

  const relatedLine = [
    `Company: ${company?.name || "Not linked"}`,
    `Contact: ${contactName(contact)}`,
    `Opportunity: ${opportunity?.name || "Not linked"}`,
  ].join(" | ");

  return (
    <Link
      href={`/tasks/${task.id}`}
      style={{
        ...cardStyle(),
        padding: "12px",
        maxHeight: "180px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "15px",
            lineHeight: "1.25",
            maxHeight: "38px",
            overflow: "hidden",
          }}
        >
          {task.title}
        </h3>

        {task.priority && (
          <span style={{ ...badgeStyle(task.priority), color: priorityColor(task.priority) }}>
            {task.priority}
          </span>
        )}
      </div>

      <p style={{ ...mutedTextStyle(), margin: "4px 0" }}>
        <strong style={{ color: "white" }}>Due:</strong> {formatDate(task.due_date)}
      </p>

      <p style={{ ...mutedTextStyle(), margin: "4px 0" }}>
        <strong style={{ color: "white" }}>Status:</strong>{" "}
        {task.status || "Not set"}{" "}
        <span style={{ color: "#666" }}>|</span>{" "}
        <strong style={{ color: "white" }}>Assigned:</strong> {assignedLabel(task)}
      </p>

      <p
        style={{
          ...mutedTextStyle(),
          margin: "4px 0",
          lineHeight: "1.3",
          maxHeight: "36px",
          overflow: "hidden",
        }}
      >
        <strong style={{ color: "white" }}>Related:</strong> {relatedLine}
      </p>

      {task.status === "Completed" && (
        <p style={{ margin: "8px 0 0 0", color: "#86efac" }}>
          <strong>Completed:</strong> {formatDateTime(task.completed_at)}
        </p>
      )}
    </Link>
  );
}

function CalendarMonth({
  today,
  tasks,
  selectedDay,
  assignedToFilter,
  statusFilter,
  priorityFilter,
}: {
  today: string;
  tasks: Task[];
  selectedDay: string;
  assignedToFilter: string;
  statusFilter: string;
  priorityFilter: string;
}) {
  const days = calendarDaysForMonth(today);
  const activeScheduledTasks = tasks
    .filter(isActive)
    .filter((task) => Boolean(dateKey(task.due_date)))
    .sort((left, right) =>
      taskSortDateValue(left).localeCompare(taskSortDateValue(right))
    );

  const tasksByDay = new Map<string, Task[]>();

  activeScheduledTasks.forEach((task) => {
    const key = dateKey(task.due_date);
    const existingTasks = tasksByDay.get(key) ?? [];

    tasksByDay.set(key, [...existingTasks, task]);
  });

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section style={{ ...sectionStyle(), marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{monthLabel(today)}</h2>
          <p style={{ ...mutedTextStyle(), margin: "6px 0 0 0", lineHeight: 1.5 }}>
            Month at a glance. Active scheduled tasks appear on their due dates.
            Click a date number to review every task for that day below.
          </p>
        </div>

        <Link href="/tasks/new" style={primaryButtonStyle()}>
          + Add Task
        </Link>
      </div>

      <div
        style={{
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(105px, 1fr))",
            gap: "8px",
            minWidth: "780px",
          }}
        >
          {weekDayLabels.map((label) => (
            <div
              key={label}
              style={{
                color: "#a7a7a7",
                fontWeight: 900,
                textAlign: "center",
                padding: "6px",
                fontSize: "13px",
              }}
            >
              {label}
            </div>
          ))}

          {days.map((day) => {
            const dayTasks = tasksByDay.get(day.key) ?? [];
            const visibleTasks = dayTasks.slice(0, 4);
            const hiddenCount = Math.max(dayTasks.length - visibleTasks.length, 0);
            const isSelected = day.key === selectedDay;

            return (
              <div
                key={day.key}
                style={{
                  minHeight: "128px",
                  border: isSelected
                    ? "2px solid #8b5cf6"
                    : day.isToday
                      ? "2px solid #fcd34d"
                      : "1px solid #2f2f2f",
                  borderRadius: "12px",
                  padding: "8px",
                  backgroundColor: day.isCurrentMonth ? "#151515" : "#0f0f0f",
                  opacity: day.isCurrentMonth ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <Link
                    href={buildPlannerDayHref({
                      day: day.key,
                      assignedToFilter,
                      statusFilter,
                      priorityFilter,
                    })}
                    style={{
                      color: isSelected
                        ? "#c4b5fd"
                        : day.isToday
                          ? "#fcd34d"
                          : "white",
                      fontSize: "16px",
                      fontWeight: 900,
                      textDecoration: "none",
                    }}
                  >
                    {day.dayNumber}
                  </Link>

                  {dayTasks.length > 0 && (
                    <span style={badgeStyle(String(dayTasks.length))}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gap: "6px" }}>
                  {visibleTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      title={task.title}
                      style={{
                        display: "block",
                        color: "white",
                        backgroundColor:
                          task.priority === "Urgent"
                            ? "rgba(239, 68, 68, 0.24)"
                            : task.priority === "High"
                              ? "rgba(245, 158, 11, 0.24)"
                              : "rgba(124, 58, 237, 0.22)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        padding: "5px 6px",
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {taskPillLabel(task)}
                    </Link>
                  ))}

                  {hiddenCount > 0 && (
                    <Link
                      href={buildPlannerDayHref({
                        day: day.key,
                        assignedToFilter,
                        statusFilter,
                        priorityFilter,
                      })}
                      style={{
                        color: "#c4b5fd",
                        fontSize: "12px",
                        textDecoration: "none",
                        fontWeight: 900,
                      }}
                    >
                      +{hiddenCount} more
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SelectedDaySection({
  selectedDay,
  tasks,
}: {
  selectedDay: string;
  tasks: Task[];
}) {
  return (
    <section style={{ ...sectionStyle(), marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Selected Day</h2>
          <p style={{ ...mutedTextStyle(), margin: "6px 0 0 0" }}>
            {formatDateFromKey(selectedDay)}
          </p>
        </div>

        <strong style={{ fontSize: "28px" }}>{tasks.length}</strong>
      </div>

      {tasks.length === 0 ? (
        <p style={mutedTextStyle()}>No active tasks scheduled for this day.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}

function PlannerSection({
  title,
  description,
  tasks,
}: {
  title: string;
  description: string;
  tasks: Task[];
}) {
  const sectionMaxHeight = title === "Needs Scheduling" ? "520px" : "460px";

  return (
    <section style={sectionStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={{ ...mutedTextStyle(), margin: "6px 0 0 0", lineHeight: 1.45 }}>
            {description}
          </p>
        </div>

        <strong style={{ fontSize: "28px" }}>{tasks.length}</strong>
      </div>

      {tasks.length > 4 && (
        <p style={{ ...mutedTextStyle(), fontSize: "13px", marginTop: 0 }}>
          Scroll inside this section to see more.
        </p>
      )}

      {tasks.length === 0 ? (
        <p style={mutedTextStyle()}>No tasks in this section.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "10px",
            maxHeight: sectionMaxHeight,
            overflowY: "auto",
            paddingRight: "6px",
          }}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}

type TeamWorkload = {
  member: TeamMember;
  assignedTasks: Task[];
  openTasks: Task[];
  overdueTasks: Task[];
  todayTasks: Task[];
  thisWeekTasks: Task[];
  completedThisWeekTasks: Task[];
  completedRecentlyTasks: Task[];
  statusLabel:
    | "No assigned work"
    | "Light workload"
    | "Normal workload"
    | "Heavy workload";
};

function taskMatchesTeamMember(task: Task, member: TeamMember) {
  return (
    task.assigned_team_member_id === member.id ||
    Boolean(member.profile_id && task.assigned_to === member.profile_id)
  );
}

function workloadStatusLabel(
  openCount: number,
  overdueCount: number
): TeamWorkload["statusLabel"] {
  if (openCount === 0) return "No assigned work";
  if (openCount >= 10 || overdueCount >= 3) return "Heavy workload";
  if (openCount <= 3 && overdueCount === 0) return "Light workload";

  return "Normal workload";
}

function buildTeamWorkloads(input: {
  teamMembers: TeamMember[];
  allTasks: Task[];
  today: string;
  weekEnd: string;
}) {
  const completedWeekStart = addDaysKey(input.today, -7);

  return input.teamMembers
    .map((member) => {
      const assignedTasks = input.allTasks.filter((task) =>
        taskMatchesTeamMember(task, member)
      );

      const openTasks = assignedTasks
        .filter(isActive)
        .sort((left, right) =>
          taskSortDateValue(left).localeCompare(taskSortDateValue(right))
        );

      const overdueTasks = openTasks.filter((task) => {
        const due = dateKey(task.due_date);

        return Boolean(due) && due < input.today;
      });

      const todayTasks = openTasks.filter(
        (task) => dateKey(task.due_date) === input.today
      );

      const thisWeekTasks = openTasks.filter((task) => {
        const due = dateKey(task.due_date);

        return Boolean(due) && due > input.today && due <= input.weekEnd;
      });

      const completedThisWeekTasks = assignedTasks
        .filter((task) => {
          if (task.status !== "Completed") return false;

          const completed = dateKey(task.completed_at || task.updated_at);

          return (
            Boolean(completed) &&
            completed >= completedWeekStart &&
            completed <= input.today
          );
        })
        .sort((left, right) =>
          completedSortValue(right).localeCompare(completedSortValue(left))
        );

      const completedRecentlyTasks = assignedTasks
        .filter((task) => task.status === "Completed")
        .sort((left, right) =>
          completedSortValue(right).localeCompare(completedSortValue(left))
        )
        .slice(0, 8);

      return {
        member,
        assignedTasks,
        openTasks,
        overdueTasks,
        todayTasks,
        thisWeekTasks,
        completedThisWeekTasks,
        completedRecentlyTasks,
        statusLabel: workloadStatusLabel(openTasks.length, overdueTasks.length),
      };
    })
    .sort((left, right) =>
      teamMemberLabel(left.member).localeCompare(teamMemberLabel(right.member))
    );
}

function buildPlannerWorkloadHref(memberId: string) {
  const params = new URLSearchParams();

  params.set("workload_member", memberId);

  return `/planner?${params.toString()}`;
}

function workloadStatusStyle(statusLabel: TeamWorkload["statusLabel"]) {
  if (statusLabel === "Heavy workload") {
    return {
      color: "#fca5a5",
      borderColor: "rgba(239, 68, 68, 0.35)",
      backgroundColor: "rgba(239, 68, 68, 0.14)",
    };
  }

  if (statusLabel === "Light workload" || statusLabel === "No assigned work") {
    return {
      color: "#86efac",
      borderColor: "rgba(34, 197, 94, 0.35)",
      backgroundColor: "rgba(34, 197, 94, 0.14)",
    };
  }

  return {
    color: "#fcd34d",
    borderColor: "rgba(245, 158, 11, 0.35)",
    backgroundColor: "rgba(245, 158, 11, 0.14)",
  };
}

function TeamWorkloadSection({
  workloads,
  selectedMemberId,
}: {
  workloads: TeamWorkload[];
  selectedMemberId: string;
}) {
  const selectedWorkload =
    workloads.find((workload) => workload.member.id === selectedMemberId) ||
    null;

  const lowestOpenWorkload = workloads.slice().sort((left, right) => {
    const openDiff = left.openTasks.length - right.openTasks.length;

    if (openDiff !== 0) return openDiff;

    return left.overdueTasks.length - right.overdueTasks.length;
  })[0];

  return (
    <section style={{ ...sectionStyle(), marginBottom: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Team Workload</h2>
          <p style={{ ...mutedTextStyle(), margin: "6px 0 0 0", lineHeight: 1.5 }}>
            Visibility only. This does not assign, rebalance, notify, or change
            task ownership.
          </p>
        </div>

        {lowestOpenWorkload && (
          <p style={{ ...mutedTextStyle(), margin: 0 }}>
            Suggested capacity:{" "}
            <strong style={{ color: "white" }}>
              {teamMemberLabel(lowestOpenWorkload.member)}
            </strong>
          </p>
        )}
      </div>

      {workloads.length === 0 ? (
        <p style={mutedTextStyle()}>No active team members were found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {workloads.map((workload) => {
            const statusStyle = workloadStatusStyle(workload.statusLabel);
            const isSelected = selectedMemberId === workload.member.id;

            return (
              <Link
                key={workload.member.id}
                href={buildPlannerWorkloadHref(workload.member.id)}
                style={{
                  display: "block",
                  border: isSelected
                    ? "2px solid #8b5cf6"
                    : "1px solid #2f2f2f",
                  borderRadius: "14px",
                  padding: "14px",
                  backgroundColor: "#151515",
                  color: "white",
                  textDecoration: "none",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {teamMemberLabel(workload.member)}
                    </h3>

                    {workload.member.role_title && (
                      <p style={{ ...mutedTextStyle(), margin: "4px 0 0 0" }}>
                        {workload.member.role_title}
                      </p>
                    )}
                  </div>

                  <span
                    style={{
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.borderColor}`,
                      backgroundColor: statusStyle.backgroundColor,
                      borderRadius: "999px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {workload.statusLabel}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#d1d5db",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: "white" }}>Open:</strong>{" "}
                    {workload.openTasks.length}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong style={{ color: "white" }}>Overdue:</strong>{" "}
                    {workload.overdueTasks.length}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong style={{ color: "white" }}>Today:</strong>{" "}
                    {workload.todayTasks.length}
                  </p>

                  <p style={{ margin: 0 }}>
                    <strong style={{ color: "white" }}>Week:</strong>{" "}
                    {workload.thisWeekTasks.length}
                  </p>

                  <p style={{ margin: 0, gridColumn: "1 / -1" }}>
                    <strong style={{ color: "white" }}>
                      Completed This Week:
                    </strong>{" "}
                    {workload.completedThisWeekTasks.length}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {selectedWorkload && (
        <div style={{ marginTop: "18px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>
                Workload Detail: {teamMemberLabel(selectedWorkload.member)}
              </h3>

              <p style={{ ...mutedTextStyle(), margin: "6px 0 0 0" }}>
                Assigned tasks grouped by timing and completion status.
              </p>
            </div>

            <Link href="/planner" style={secondaryButtonStyle()}>
              Clear workload detail
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            <PlannerSection
              title="Assigned Tasks"
              description="All open tasks assigned to this team member."
              tasks={selectedWorkload.openTasks}
            />

            <PlannerSection
              title="Overdue"
              description="Assigned open tasks with due dates before today."
              tasks={selectedWorkload.overdueTasks}
            />

            <PlannerSection
              title="Due Today"
              description="Assigned open tasks due today."
              tasks={selectedWorkload.todayTasks}
            />

            <PlannerSection
              title="Due This Week"
              description="Assigned open tasks due later this week."
              tasks={selectedWorkload.thisWeekTasks}
            />

            <PlannerSection
              title="Completed Recently"
              description="Assigned tasks completed recently."
              tasks={selectedWorkload.completedRecentlyTasks}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default async function PlannerPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const assignedToFilter = (params.assigned_to ?? "").trim();
  const statusFilter = (params.status ?? "").trim();
  const priorityFilter = (params.priority ?? "").trim();
  const selectedWorkloadMemberId = (params.workload_member ?? "").trim();

  const today = todayKey();
  const selectedDay = dateKey(params.selected_day ?? null) || today;

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      due_date,
      priority,
      status,
      assigned_to,
      assigned_team_member_id,
      company_id,
      contact_id,
      opportunity_id,
      completed_at,
      created_at,
      updated_at,
      companies (
        id,
        name
      ),
      contacts (
        id,
        first_name,
        last_name
      ),
      opportunities (
        id,
        name
      ),
      assigned_profile:profiles!tasks_assigned_to_fkey (
        id,
        full_name,
        email
      ),
      assigned_team_member:team_members!tasks_assigned_team_member_id_fkey (
        id,
        profile_id,
        display_name,
        email,
        role_title,
        status
      )
    `)
    .order("due_date", { ascending: true });

  const { data: teamMemberRows, error: teamMemberError } = await supabase
    .from("team_members")
    .select("id, profile_id, display_name, email, role_title, status")
    .eq("status", "Active")
    .order("display_name", { ascending: true });

  const teamMembers = (teamMemberRows ?? []) as TeamMember[];

  const allTasks = (data ?? []) as unknown as Task[];

  const filteredTasks = allTasks.filter((task) =>
    taskMatchesFilters(task, assignedToFilter, statusFilter, priorityFilter)
  );

  const weekEnd = addDaysKey(today, 7);

  const activeTasks = filteredTasks
    .filter(isActive)
    .sort((left, right) =>
      taskSortDateValue(left).localeCompare(taskSortDateValue(right))
    );

  const overdueTasks = activeTasks.filter((task) => {
    const due = dateKey(task.due_date);

    return Boolean(due) && due < today;
  });

  const todayTasks = activeTasks.filter((task) => dateKey(task.due_date) === today);

  const selectedDayTasks = activeTasks.filter(
    (task) => dateKey(task.due_date) === selectedDay
  );

  const thisWeekTasks = activeTasks.filter((task) => {
    const due = dateKey(task.due_date);

    return Boolean(due) && due > today && due <= weekEnd;
  });

  const needsSchedulingTasks = activeTasks.filter(
    (task) => !dateKey(task.due_date)
  );

  const completedRecentlyTasks = filteredTasks
    .filter((task) => task.status === "Completed")
    .sort((left, right) =>
      completedSortValue(right).localeCompare(completedSortValue(left))
    )
    .slice(0, 12);

  const statuses = uniqueValues(allTasks.map((task) => task.status));
  const priorities = uniqueValues(allTasks.map((task) => task.priority));

  const assignedOptions = teamMembers
    .map((member) => [member.id, teamMemberLabel(member)] as const)
    .sort((left, right) => left[1].localeCompare(right[1]));

  const teamWorkloads = buildTeamWorkloads({
    teamMembers,
    allTasks,
    today,
    weekEnd,
  });

  return (
    <main style={pageStyle()}>
      <section style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "22px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...mutedTextStyle(),
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                fontSize: "12px",
                fontWeight: 900,
                margin: "0 0 8px",
              }}
            >
              Sales
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Planner</h1>

            <p
              style={{
                ...mutedTextStyle(),
                maxWidth: "880px",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Calendar-style view of scheduled Sell It tasks using task due
              dates. Completed tasks stay out of active planner sections and
              appear only in Completed Recently.
            </p>
          </div>

          <Link href="/tasks/new" style={primaryButtonStyle()}>
            + Add Task
          </Link>
        </div>

        {error && (
          <p style={{ color: "#fca5a5" }}>Database error: {error.message}</p>
        )}

        {teamMemberError && (
          <p style={{ color: "#fca5a5" }}>
            Team member error: {teamMemberError.message}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={statCardStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>Today</p>
            <strong style={{ fontSize: "28px" }}>{todayTasks.length}</strong>
          </div>

          <div style={statCardStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>This Week</p>
            <strong style={{ fontSize: "28px" }}>{thisWeekTasks.length}</strong>
          </div>

          <div style={statCardStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>Overdue</p>
            <strong style={{ fontSize: "28px" }}>{overdueTasks.length}</strong>
          </div>

          <div style={statCardStyle()}>
            <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
              Needs Scheduling
            </p>
            <strong style={{ fontSize: "28px" }}>
              {needsSchedulingTasks.length}
            </strong>
          </div>
        </div>

        <form
          action="/planner"
          style={{ ...panelStyle(), marginBottom: "22px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Assigned To</span>
              <select
                name="assigned_to"
                defaultValue={assignedToFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                {assignedOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Status</span>
              <select
                name="status"
                defaultValue={statusFilter}
                style={inputStyle()}
              >
                <option value="">All active + completed recently</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Priority</span>
              <select
                name="priority"
                defaultValue={priorityFilter}
                style={inputStyle()}
              >
                <option value="">All</option>
                {priorities.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="submit"
              style={{
                ...primaryButtonStyle(),
                cursor: "pointer",
              }}
            >
              Apply Filters
            </button>

            <a href="/planner" style={secondaryButtonStyle()}>
              Clear Filters
            </a>
          </div>
        </form>

        <TeamWorkloadSection
          workloads={teamWorkloads}
          selectedMemberId={selectedWorkloadMemberId}
        />

        <details open style={{ marginBottom: "18px" }}>
          <summary
            style={{
              cursor: "pointer",
              color: "#c4b5fd",
              fontWeight: 900,
              marginBottom: "10px",
            }}
          >
            Monthly Calendar - click to collapse or expand
          </summary>

          <CalendarMonth
            today={today}
            tasks={filteredTasks}
            selectedDay={selectedDay}
            assignedToFilter={assignedToFilter}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
          />
        </details>

        <SelectedDaySection selectedDay={selectedDay} tasks={selectedDayTasks} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          <PlannerSection
            title="Today"
            description="Open tasks due today."
            tasks={todayTasks}
          />

          <PlannerSection
            title="This Week"
            description="Open tasks due later this week."
            tasks={thisWeekTasks}
          />

          <PlannerSection
            title="Overdue"
            description="Open tasks with due dates before today."
            tasks={overdueTasks}
          />

          <PlannerSection
            title="Needs Scheduling"
            description="Open tasks with no due date. These need a date before they can appear on the calendar."
            tasks={needsSchedulingTasks}
          />

          <PlannerSection
            title="Completed Recently"
            description="Recently completed tasks. Completed work stays out of the active sections."
            tasks={completedRecentlyTasks}
          />
        </div>
      </section>
    </main>
  );
}
