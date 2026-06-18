import Link from "next/link";
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
};

type PageProps = {
  searchParams?: Promise<{
    assigned_to?: string;
    status?: string;
    priority?: string;
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
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function profileLabel(profile: Profile | null) {
  return profile?.full_name || profile?.email || "Unassigned";
}

function taskMatchesFilters(
  task: Task,
  assignedToFilter: string,
  statusFilter: string,
  priorityFilter: string
) {
  return (
    (!assignedToFilter || task.assigned_to === assignedToFilter) &&
    (!statusFilter || task.status === statusFilter) &&
    (!priorityFilter || task.priority === priorityFilter)
  );
}

function taskPillLabel(task: Task) {
  const priority = task.priority ? `${task.priority}: ` : "";

  return `${priority}${task.title}`;
}

function monthLabel(today: string) {
  const [year, month, day] = today.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
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

function cardStyle() {
  return {
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "14px",
    backgroundColor: "#1a1a1a",
    color: "white",
    textDecoration: "none",
    display: "block",
  };
}

function sectionStyle() {
  return {
    border: "1px solid #333",
    borderRadius: "12px",
    backgroundColor: "#151515",
    padding: "18px",
  };
}

function TaskCard({ task }: { task: Task }) {
  const company = singleRelation(task.companies);
  const contact = singleRelation(task.contacts);
  const opportunity = singleRelation(task.opportunities);
  const assignedProfile = singleRelation(task.assigned_profile);

  const contactName = contact
    ? `${contact.first_name} ${contact.last_name || ""}`.trim()
    : "Not linked";

  const relatedLine = [
    `Company: ${company?.name || "Not linked"}`,
    `Contact: ${contactName}`,
    `Opportunity: ${opportunity?.name || "Not linked"}`,
  ].join(" | ");

  return (
    <Link
      href={`/tasks/${task.id}`}
      style={{
        ...cardStyle(),
        padding: "12px",
        maxHeight: "168px",
        overflowY: "auto",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "8px",
          fontSize: "15px",
          lineHeight: "1.25",
          maxHeight: "38px",
          overflow: "hidden",
        }}
      >
        {task.title}
      </h3>

      <p style={{ margin: "4px 0" }}>
        <strong>Due:</strong> {formatDate(task.due_date)}{" "}
        <span style={{ color: "#aaa" }}>|</span>{" "}
        <strong>Priority:</strong> {task.priority || "Not set"}
      </p>

      <p style={{ margin: "4px 0" }}>
        <strong>Status:</strong> {task.status || "Not set"}{" "}
        <span style={{ color: "#aaa" }}>|</span>{" "}
        <strong>Assigned:</strong> {profileLabel(assignedProfile)}
      </p>

      <p
        style={{
          margin: "4px 0",
          color: "#ddd",
          lineHeight: "1.3",
          maxHeight: "36px",
          overflow: "hidden",
        }}
      >
        <strong>Related:</strong> {relatedLine}
      </p>

      {task.status === "Completed" && (
        <p style={{ margin: "8px 0 0 0", color: "#8ff0a4" }}>
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
          alignItems: "baseline",
          gap: "12px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{monthLabel(today)}</h2>
          <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>
            Month at a glance. Active scheduled tasks appear on their due dates.
            Click a date number to review every task for that day below.
          </p>
        </div>

        <Link
          href="/tasks/new"
          style={{
            backgroundColor: "#f5d76e",
            color: "black",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Task
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(95px, 1fr))",
          gap: "8px",
          overflowX: "auto",
        }}
      >
        {weekDayLabels.map((label) => (
          <div
            key={label}
            style={{
              color: "#aaa",
              fontWeight: "bold",
              textAlign: "center",
              padding: "6px",
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
                  ? "2px solid #8ab4ff"
                  : day.isToday
                    ? "2px solid #f5d76e"
                    : "1px solid #333",
                borderRadius: "10px",
                padding: "8px",
                backgroundColor: day.isCurrentMonth ? "#181818" : "#101010",
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
                      ? "#8ab4ff"
                      : day.isToday
                        ? "#f5d76e"
                        : "white",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  {day.dayNumber}
                </Link>

                {dayTasks.length > 0 && (
                  <span style={{ color: "#aaa", fontSize: "12px" }}>
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
                      color: "black",
                      backgroundColor:
                        task.priority === "Urgent"
                          ? "#ffcc66"
                          : task.priority === "High"
                            ? "#f5d76e"
                            : "white",
                      borderRadius: "6px",
                      padding: "5px 6px",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: "bold",
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
                      color: "#8ab4ff",
                      fontSize: "12px",
                      textDecoration: "none",
                      fontWeight: "bold",
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
          alignItems: "baseline",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Selected Day</h2>
          <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>
            {formatDateFromKey(selectedDay)}
          </p>
        </div>

        <strong style={{ fontSize: "28px" }}>{tasks.length}</strong>
      </div>

      {tasks.length === 0 ? (
        <p style={{ color: "#aaa" }}>No active tasks scheduled for this day.</p>
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
  const sectionMaxHeight =
    title === "Needs Scheduling" ? "520px" : "460px";

  return (
    <section style={sectionStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "baseline",
          marginBottom: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>{description}</p>
        </div>

        <strong style={{ fontSize: "28px" }}>{tasks.length}</strong>
      </div>

      {tasks.length > 4 && (
        <p style={{ color: "#aaa", fontSize: "13px", marginTop: 0 }}>
          Scroll inside this section to see more.
        </p>
      )}

      {tasks.length === 0 ? (
        <p style={{ color: "#aaa" }}>No tasks in this section.</p>
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
export default async function PlannerPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const assignedToFilter = (params.assigned_to ?? "").trim();
  const statusFilter = (params.status ?? "").trim();
  const priorityFilter = (params.priority ?? "").trim();

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
      )
    `)
    .order("due_date", { ascending: true });

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

  const assignedOptions = Array.from(
    new Map(
      allTasks
        .map((task) => {
          const profile = singleRelation(task.assigned_profile);
          const label = profileLabel(profile);

          if (!task.assigned_to) return null;

          return [task.assigned_to, label] as const;
        })
        .filter(Boolean) as Array<readonly [string, string]>
    ).entries()
  ).sort((left, right) => left[1].localeCompare(right[1]));

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Home
        </Link>

        <Link
          href="/tasks"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Tasks
        </Link>

        <Link
          href="/tasks/new"
          style={{
            color: "black",
            backgroundColor: "#f5d76e",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Task
        </Link>
      </div>

      <h1>Planner</h1>

      <p style={{ color: "#aaa", maxWidth: "900px" }}>
        Calendar-style view of scheduled Sell It tasks using task due dates.
        Completed tasks stay out of the active planner sections and appear only
        in Completed Recently. Open tasks with no due date appear in Needs Scheduling.
      </p>

      {error && (
        <p style={{ color: "#ff9999" }}>Database error: {error.message}</p>
      )}

      <form
        action="/planner"
        style={{
          border: "1px solid #333",
          backgroundColor: "#181818",
          padding: "16px",
          borderRadius: "10px",
          marginBottom: "22px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Assigned To
            </span>
            <select
              name="assigned_to"
              defaultValue={assignedToFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
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
            <span style={{ display: "block", marginBottom: "6px" }}>
              Status
            </span>
            <select
              name="status"
              defaultValue={statusFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
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
            <span style={{ display: "block", marginBottom: "6px" }}>
              Priority
            </span>
            <select
              name="priority"
              defaultValue={priorityFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#f5d76e",
              color: "black",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>

          <a
            href="/planner"
            style={{
              color: "white",
              border: "1px solid #555",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Clear Filters
          </a>
        </div>
      </form>

      <details open style={{ marginBottom: "18px" }}>
        <summary
          style={{
            cursor: "pointer",
            color: "#f5d76e",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Monthly Calendar — click to collapse or expand
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
    </main>
  );
}