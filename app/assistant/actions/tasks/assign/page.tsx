"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type SupabaseRelation<T> = T | T[] | null;

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type Opportunity = {
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
  assigned_team_member_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  companies: SupabaseRelation<Company>;
  contacts: SupabaseRelation<Contact>;
  opportunities: SupabaseRelation<Opportunity>;
  assigned_profile: SupabaseRelation<Profile>;
  assigned_team_member: SupabaseRelation<TeamMember>;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  maxWidth: "950px",
  marginBottom: "18px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  color: "white",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  borderRadius: "999px",
  padding: "12px 16px",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  textDecoration: "none",
  fontWeight: 800,
};

const secondaryLinkButtonStyle: CSSProperties = {
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
  background: "rgba(15, 23, 42, 0.74)",
};

const headerStyle: CSSProperties = {
  maxWidth: "950px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 32%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "850px",
  lineHeight: 1.65,
};

const noticeStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.32)",
  background: "rgba(88, 28, 135, 0.22)",
  color: "#ddd6fe",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "950px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "950px",
};

const successStyle: CSSProperties = {
  border: "1px solid rgba(34, 197, 94, 0.32)",
  background: "rgba(20, 83, 45, 0.22)",
  color: "#bbf7d0",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "950px",
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(value: string | null) {
  if (!value) return "No due date";

  const keyMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  const key = keyMatch?.[1] || "";

  if (key) {
    const [year, month, day] = key.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString();
  }

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function fullContactName(contact: Contact | null) {
  if (!contact) return "Not linked";

  return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
}

function teamMemberLabel(member: TeamMember | null) {
  if (!member) return "Unassigned";

  return (
    member.display_name ||
    member.email ||
    member.profile_id ||
    "Unnamed team member"
  );
}

function profileLabel(profile: Profile | null) {
  if (!profile) return "Unassigned";

  return profile.full_name || profile.email || "Unnamed profile";
}

function assignedLabel(
  teamMember: TeamMember | null,
  profile: Profile | null
) {
  return teamMemberLabel(teamMember) || profileLabel(profile) || "Unassigned";
}

function AssistantAssignTaskClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const taskId = searchParams.get("task_id") || "";
  const requestedTeamMemberId = searchParams.get("assigned_team_member_id") || "";
  const requestedAssigneeName = searchParams.get("assignee_name") || "";

  const [task, setTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newTeamMemberId, setNewTeamMemberId] = useState(requestedTeamMemberId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setErrorMessage("");
      setSaved(false);

      if (!taskId) {
        setLoading(false);
        setErrorMessage("No task was selected for assignment.");
        return;
      }

      const { data: teamMemberRows, error: teamMemberError } = await supabase
        .from("team_members")
        .select("id, profile_id, display_name, email, role_title, status")
        .eq("status", "Active")
        .order("display_name", { ascending: true });

      if (teamMemberError) {
        setLoading(false);
        setErrorMessage(teamMemberError.message);
        return;
      }

      const loadedTeamMembers = (teamMemberRows ?? []) as TeamMember[];
      setTeamMembers(loadedTeamMembers);

      const { data: taskRow, error: taskError } = await supabase
        .from("tasks")
        .select(
          `
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
        `
        )
        .eq("id", taskId)
        .single();

      if (taskError) {
        setLoading(false);
        setErrorMessage(taskError.message);
        return;
      }

      const loadedTask = taskRow as unknown as Task;
      setTask(loadedTask);

      const requestedMemberExists = loadedTeamMembers.some(
        (member) => member.id === requestedTeamMemberId
      );

      const normalizedRequestedName = requestedAssigneeName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const requestedMemberByName = normalizedRequestedName
        ? loadedTeamMembers.find((member) =>
            [member.display_name, member.email, member.role_title]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .includes(normalizedRequestedName)
          )
        : null;

      setNewTeamMemberId(
        requestedMemberExists
          ? requestedTeamMemberId
          : requestedMemberByName?.id || loadedTask.assigned_team_member_id || ""
      );

      setLoading(false);
    }

    loadPageData();
  }, [taskId, requestedTeamMemberId, requestedAssigneeName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      setErrorMessage("No task was loaded.");
      return;
    }

    if (!newTeamMemberId) {
      setErrorMessage("Choose the new assignee before confirming.");
      return;
    }

    if (!confirmed) {
      setErrorMessage("Confirm the assignment before saving.");
      return;
    }

    const selectedTeamMember = teamMembers.find(
      (member) => member.id === newTeamMemberId
    );

    if (!selectedTeamMember) {
      setErrorMessage("The selected team member could not be found.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({
        assigned_team_member_id: selectedTeamMember.id,
        assigned_to: selectedTeamMember.profile_id || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setTask({
      ...task,
      assigned_team_member_id: selectedTeamMember.id,
      assigned_to: selectedTeamMember.profile_id || null,
      assigned_team_member: selectedTeamMember,
      assigned_profile: null,
    });

    setSaved(true);
    setConfirmed(false);
    router.refresh();
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Loading assignment review...</p>
      </main>
    );
  }

  const company = singleRelation(task?.companies);
  const contact = singleRelation(task?.contacts);
  const opportunity = singleRelation(task?.opportunities);
  const currentTeamMember = singleRelation(task?.assigned_team_member);
  const currentProfile = singleRelation(task?.assigned_profile);
  const newTeamMember =
    teamMembers.find((member) => member.id === newTeamMemberId) || null;

  return (
    <main style={pageStyle}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
        <Link href="/assistant" style={linkStyle}>
          Back to Assistant
        </Link>

        <Link href="/planner" style={linkStyle}>
          Open Planner
        </Link>

        {task && (
          <Link href={`/tasks/${task.id}`} style={linkStyle}>
            Open Task
          </Link>
        )}
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Assistant Action</p>

        <h1 style={titleStyle}>Assign Task</h1>

        <p style={mutedTextStyle}>
          Review the assignment below. Sell It will not update the task until
          you confirm and press Confirm Assignment.
        </p>
      </header>

      <div style={noticeStyle}>
        Review-before-save is active. This page changes the task assignment only
        after the confirmation checkbox is selected and the button is pressed.
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {saved && task && (
        <div style={successStyle}>
          <p style={{ marginTop: 0, fontWeight: 800 }}>
            Assignment successful.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={`/tasks/${task.id}`} style={linkStyle}>
              Open Task
            </Link>

            <Link href="/planner" style={linkStyle}>
              Open Planner
            </Link>
          </div>
        </div>
      )}

      {task ? (
        <form onSubmit={handleSubmit} style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>{task.title}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <p>
              <strong>Current assignee:</strong>
              <br />
              {assignedLabel(currentTeamMember, currentProfile)}
            </p>

            <p>
              <strong>New assignee:</strong>
              <br />
              {teamMemberLabel(newTeamMember)}
            </p>

            <p>
              <strong>Due date:</strong>
              <br />
              {formatDate(task.due_date)}
            </p>

            <p>
              <strong>Priority:</strong>
              <br />
              {task.priority || "Not set"}
            </p>

            <p>
              <strong>Status:</strong>
              <br />
              {task.status || "Not set"}
            </p>

            <p>
              <strong>Related company:</strong>
              <br />
              {company?.name || "Not linked"}
            </p>

            <p>
              <strong>Related contact:</strong>
              <br />
              {fullContactName(contact)}
            </p>

            <p>
              <strong>Related opportunity:</strong>
              <br />
              {opportunity?.name || "Not linked"}
            </p>
          </div>

          <label>
            Change New Assignee
            <select
              value={newTeamMemberId}
              onChange={(event) => {
                setNewTeamMemberId(event.target.value);
                setConfirmed(false);
                setSaved(false);
              }}
              disabled={saving || saved}
              style={inputStyle}
            >
              <option value="">Choose team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {teamMemberLabel(member)}
                  {member.role_title ? ` - ${member.role_title}` : ""}
                  {member.profile_id ? "" : " (placeholder)"}
                </option>
              ))}
            </select>
          </label>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              marginTop: "16px",
              marginBottom: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={saving || saved}
            />
            <span>
              I confirm I want to assign this task to{" "}
              <strong>{teamMemberLabel(newTeamMember)}</strong>.
            </span>
          </label>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={!confirmed || saving || saved}
              style={!confirmed || saving || saved ? disabledButtonStyle : buttonStyle}
            >
              {saved ? "Assigned" : saving ? "Saving..." : "Confirm Assignment"}
            </button>

            <Link
              href="/assistant"
              style={{
                color: "white",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                padding: "12px 16px",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <div style={cardStyle}>
          <p>No task could be loaded for assignment.</p>
        </div>
      )}
    </main>
  );
}

export default function AssistantAssignTaskPage() {
  return (
    <Suspense
      fallback={
        <main style={pageStyle}>
          <p>Loading assignment review...</p>
        </main>
      }
    >
      <AssistantAssignTaskClient />
    </Suspense>
  );
}




