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

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "18px",
  backgroundColor: "#151515",
  maxWidth: "950px",
  marginBottom: "18px",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#f5d76e",
  color: "black",
  border: "none",
  borderRadius: "8px",
  padding: "12px 16px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
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
      <main style={{ padding: "24px", color: "white" }}>
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
    <main style={{ padding: "24px", color: "white" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/assistant" style={{ color: "#8ab4ff" }}>
          Back to Assistant
        </Link>

        <Link href="/planner" style={{ color: "#8ab4ff" }}>
          Open Planner
        </Link>

        {task && (
          <Link href={`/tasks/${task.id}`} style={{ color: "#8ab4ff" }}>
            Open Task
          </Link>
        )}
      </div>

      <h1>Assistant Action: Assign Task</h1>

      <div
        style={{
          border: "1px solid #f5d76e",
          backgroundColor: "#211c0d",
          color: "#ffcc66",
          padding: "14px",
          borderRadius: "8px",
          marginBottom: "18px",
          maxWidth: "950px",
        }}
      >
        Review the assignment below. Sell It will not update the task until you
        confirm and press Confirm Assignment.
      </div>

      {errorMessage && (
        <div
          style={{
            border: "1px solid #ff6b6b",
            backgroundColor: "#2a1111",
            color: "#ff9999",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "950px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {saved && task && (
        <div
          style={{
            border: "1px solid #46d369",
            backgroundColor: "#102414",
            color: "#8ff0a4",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "950px",
          }}
        >
          <p style={{ marginTop: 0, fontWeight: "bold" }}>
            Assignment successful.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={`/tasks/${task.id}`} style={{ color: "#8ab4ff" }}>
              Open Task
            </Link>

            <Link href="/planner" style={{ color: "#8ab4ff" }}>
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
                border: "1px solid #555",
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
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
        <main style={{ padding: "24px", color: "white" }}>
          <p>Loading assignment review...</p>
        </main>
      }
    >
      <AssistantAssignTaskClient />
    </Suspense>
  );
}


