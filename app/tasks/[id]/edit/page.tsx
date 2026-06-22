"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { createNotificationOnce } from "../../../lib/notifications";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../../../lib/actingUser";
import { createWorkLogEntry } from "../../../lib/workLog";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  company_id: string | null;
};

type Opportunity = {
  id: string;
  name: string;
  company_id: string | null;
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
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_team_member_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  updated_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const headerStyle: CSSProperties = {
  maxWidth: "980px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
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
  maxWidth: "860px",
  lineHeight: 1.65,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  maxWidth: "860px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
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

const labelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontWeight: 800,
};

const noticeStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.32)",
  borderRadius: "16px",
  padding: "14px",
  background: "rgba(88, 28, 135, 0.22)",
  color: "#ddd6fe",
  lineHeight: 1.55,
};

const warningStyle: CSSProperties = {
  border: "1px solid rgba(245, 158, 11, 0.36)",
  borderRadius: "16px",
  padding: "14px",
  background: "rgba(120, 53, 15, 0.22)",
  color: "#fde68a",
  lineHeight: 1.55,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "860px",
};

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();

  const taskId = params.id as string;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Open");
  const [originalStatus, setOriginalStatus] = useState("Open");
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [completedBy, setCompletedBy] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedTeamMemberId, setAssignedTeamMemberId] = useState("");
  const [originalAssignedTo, setOriginalAssignedTo] = useState("");
  const [originalAssignedTeamMemberId, setOriginalAssignedTeamMemberId] =
    useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptionsAndTask() {
      setLoading(true);
      setErrorMessage("");

      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (companyError) {
        setLoading(false);
        setErrorMessage(companyError.message);
        return;
      }

      setCompanies(companyRows ?? []);

      const { data: contactRows, error: contactError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, company_id")
        .order("first_name", { ascending: true });

      if (contactError) {
        setLoading(false);
        setErrorMessage(contactError.message);
        return;
      }

      setContacts(contactRows ?? []);

      const { data: opportunityRows, error: opportunityError } = await supabase
        .from("opportunities")
        .select("id, name, company_id")
        .order("name", { ascending: true });

      if (opportunityError) {
        setLoading(false);
        setErrorMessage(opportunityError.message);
        return;
      }

      setOpportunities(opportunityRows ?? []);

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (profileError) {
        setLoading(false);
        setErrorMessage(profileError.message);
        return;
      }

      setProfiles(profileRows ?? []);

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

      setTeamMembers((teamMemberRows ?? []) as TeamMember[]);

      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, description, due_date, priority, status, assigned_to, assigned_team_member_id, company_id, contact_id, opportunity_id, updated_at, completed_at, completed_by"
        )
        .eq("id", taskId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const task = data as Task;

      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
      setPriority(task.priority || "Normal");
      setStatus(task.status || "Open");
      setOriginalStatus(task.status || "Open");
      setCompletedAt(task.completed_at);
      setCompletedBy(task.completed_by);
      setAssignedTo(task.assigned_to || "");
      setAssignedTeamMemberId(task.assigned_team_member_id || "");
      setCompanyId(task.company_id || "");
      setContactId(task.contact_id || "");
      setOpportunityId(task.opportunity_id || "");
      setLastUpdated(task.updated_at);
    }

    if (taskId) {
      loadOptionsAndTask();
    }
  }, [taskId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const changedAt = new Date().toISOString();
    const actingUser = getCurrentActingUserSnapshot();
    const databaseSafeUserId = getDatabaseSafeUserId(actingUser);

    const isCompleted = status === "Completed";
    const nextCompletedAt = isCompleted ? completedAt || changedAt : null;
    const nextCompletedBy = isCompleted
      ? completedBy || databaseSafeUserId
      : null;

    const { data: currentTaskBeforeSave, error: currentTaskLoadError } =
      await supabase
        .from("tasks")
        .select("assigned_to, assigned_team_member_id")
        .eq("id", taskId)
        .single();

    if (currentTaskLoadError) {
      setSaving(false);
      setErrorMessage(currentTaskLoadError.message);
      return;
    }

    const priorAssignedTo =
      currentTaskBeforeSave?.assigned_to || originalAssignedTo || "";
    const priorAssignedTeamMemberId =
      currentTaskBeforeSave?.assigned_team_member_id ||
      originalAssignedTeamMemberId ||
      "";

    const selectedTeamMember = teamMembers.find(
      (member) => member.id === assignedTeamMemberId
    );

    const previousTeamMember = teamMembers.find(
      (member) => member.id === priorAssignedTeamMemberId
    );

    const nextAssignedTo = selectedTeamMember?.profile_id || assignedTo || null;

    const previousRecipientId =
      previousTeamMember?.profile_id ||
      previousTeamMember?.id ||
      priorAssignedTo ||
      null;

    const newRecipientId =
      selectedTeamMember?.profile_id ||
      selectedTeamMember?.id ||
      nextAssignedTo ||
      null;

    const assignmentChanged =
      (priorAssignedTeamMemberId || "") !== (assignedTeamMemberId || "") ||
      (priorAssignedTo || "") !== (nextAssignedTo || "");

    const { error } = await supabase
      .from("tasks")
      .update({
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        status,
        assigned_to: nextAssignedTo,
        assigned_team_member_id: assignedTeamMemberId || null,
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        completed_at: nextCompletedAt,
        completed_by: nextCompletedBy,
        updated_by: databaseSafeUserId,
        updated_at: changedAt,
      })
      .eq("id", taskId);

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    const nextAssignedProfile = profiles.find(
      (profile) => profile.id === nextAssignedTo
    );

    const previousAssignedProfile = profiles.find(
      (profile) => profile.id === priorAssignedTo
    );

    const newAssigneeNameForLog =
      selectedTeamMember?.display_name ||
      selectedTeamMember?.email ||
      nextAssignedProfile?.full_name ||
      nextAssignedProfile?.email ||
      nextAssignedTo ||
      "Unassigned";

    const previousAssigneeNameForLog =
      previousTeamMember?.display_name ||
      previousTeamMember?.email ||
      previousAssignedProfile?.full_name ||
      previousAssignedProfile?.email ||
      priorAssignedTo ||
      "Unassigned";

    if (assignmentChanged) {
      const assignmentActionType =
        priorAssignedTeamMemberId || priorAssignedTo
          ? "task_reassignment"
          : "task_assignment";

      await createWorkLogEntry({
        actingUser,
        actionType: assignmentActionType,
        entityType: "task",
        entityId: taskId,
        entityLabel: title,
        summary:
          assignmentActionType === "task_assignment"
            ? `${actingUser.displayName} assigned task "${title}" to ${newAssigneeNameForLog}.`
            : `${actingUser.displayName} reassigned task "${title}" from ${previousAssigneeNameForLog} to ${newAssigneeNameForLog}.`,
        details: `Previous assignee: ${previousAssigneeNameForLog}. New assignee: ${newAssigneeNameForLog}.`,
        metadata: {
          source: "Task Edit Work Log V1",
          previous_assigned_to: priorAssignedTo || null,
          previous_assigned_team_member_id: priorAssignedTeamMemberId || null,
          new_assigned_to: nextAssignedTo,
          new_assigned_team_member_id: assignedTeamMemberId || null,
        },
      });
    }

    if (originalStatus !== "Completed" && status === "Completed") {
      await createWorkLogEntry({
        actingUser,
        actionType: "task_completion",
        entityType: "task",
        entityId: taskId,
        entityLabel: title,
        summary: `${actingUser.displayName} completed task "${title}".`,
        details: "Task status changed to Completed from the task edit page.",
        metadata: {
          source: "Task Edit Work Log V1",
          previous_status: originalStatus,
          new_status: status,
          completed_at: nextCompletedAt,
          completed_by: nextCompletedBy,
        },
      });
    }

    function actorMatchesRecipient(recipientId: string | null) {
      if (!recipientId) return false;

      return (
        recipientId === actingUser.actorUserId ||
        recipientId === actingUser.profileId ||
        recipientId === actingUser.teamMemberId
      );
    }

    if (assignmentChanged) {
      const newAssigneeName =
        selectedTeamMember?.display_name ||
        selectedTeamMember?.email ||
        "Unassigned";

      if (newRecipientId && !actorMatchesRecipient(newRecipientId)) {
        await createNotificationOnce({
          type: "Task Assigned",
          message: `Task assigned to you: ${title}`,
          relatedRecordType: "tasks",
          relatedRecordId: taskId,
          relatedUrl: `/tasks/${taskId}`,
          recipientUserId: newRecipientId,
          actorUserId: actingUser.actorUserId,
          dedupeKey: `task-assigned-to:${taskId}:${actingUser.actorUserId}:${newRecipientId}:${changedAt}`,
          metadata: {
            task_id: taskId,
            assigned_team_member_id: assignedTeamMemberId || null,
            actor_user_key: actingUser.key,
            source: "Task Edit Reassignment V1",
          },
        });
      }

      if (
        previousRecipientId &&
        previousRecipientId !== newRecipientId &&
        !actorMatchesRecipient(previousRecipientId)
      ) {
        await createNotificationOnce({
          type: "Task Assigned",
          message: `Task reassigned from you: ${title} is now assigned to ${newAssigneeName}`,
          relatedRecordType: "tasks",
          relatedRecordId: taskId,
          relatedUrl: `/tasks/${taskId}`,
          recipientUserId: previousRecipientId,
          actorUserId: actingUser.actorUserId,
          dedupeKey: `task-reassigned-from:${taskId}:${actingUser.actorUserId}:${previousRecipientId}:${newRecipientId || "unassigned"}:${changedAt}`,
          metadata: {
            task_id: taskId,
            previous_assigned_team_member_id:
              priorAssignedTeamMemberId || null,
            new_assigned_team_member_id: assignedTeamMemberId || null,
            actor_user_key: actingUser.key,
            source: "Task Edit Reassignment V1",
          },
        });
      }
    }

    setSaving(false);
    router.push(`/tasks/${taskId}`);
    router.refresh();
  }
  const filteredContacts = companyId
    ? contacts.filter(
        (contact) => contact.company_id === companyId || contact.company_id === null
      )
    : contacts;

  const filteredOpportunities = companyId
    ? opportunities.filter(
        (opportunity) =>
          opportunity.company_id === companyId || opportunity.company_id === null
      )
    : opportunities;

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href={`/tasks/${taskId}`} style={secondaryButtonStyle}>
          Back to Task
        </Link>

        <Link href="/tasks" style={secondaryButtonStyle}>
          Back to Tasks
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Task Management</p>

        <h1 style={titleStyle}>Edit Task</h1>

        <p style={mutedTextStyle}>
          Update task details, assignment, priority, status, due date, and sales
          record relationships.
        </p>
      </header>

      {loading && (
        <div style={formStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading task...</p>
        </div>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {!loading && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Task details..."
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "110px",
              }}
            />
          </label>

          <label style={labelStyle}>
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              style={inputStyle}
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </label>

          <label style={labelStyle}>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={inputStyle}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          {status === "Completed" && (
            <div style={noticeStyle}>
              Completion metadata will be saved when this task is saved.
              Completed At:{" "}
              {completedAt ? new Date(completedAt).toLocaleString() : "On save"}
            </div>
          )}

          {originalStatus === "Completed" && status !== "Completed" && (
            <div style={warningStyle}>
              Saving this task as {status} will clear Completed At and Completed
              By.
            </div>
          )}

          <label style={labelStyle}>
            Assigned To
            <select
              value={assignedTeamMemberId}
              onChange={(event) => {
                const nextTeamMemberId = event.target.value;
                const nextTeamMember = teamMembers.find(
                  (member) => member.id === nextTeamMemberId
                );

                setAssignedTeamMemberId(nextTeamMemberId);
                setAssignedTo(nextTeamMember?.profile_id || "");
              }}
              style={inputStyle}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name}
                  {member.role_title ? ` - ${member.role_title}` : ""}
                  {member.profile_id ? "" : " (placeholder)"}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Related Company
            <select
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setContactId("");
                setOpportunityId("");
              }}
              style={inputStyle}
            >
              <option value="">No company selected</option>

              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Related Contact
            <select
              value={contactId}
              onChange={(event) => setContactId(event.target.value)}
              style={inputStyle}
            >
              <option value="">No contact selected</option>

              {filteredContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name || ""}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Related Opportunity
            <select
              value={opportunityId}
              onChange={(event) => setOpportunityId(event.target.value)}
              style={inputStyle}
            >
              <option value="">No opportunity selected</option>

              {filteredOpportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.name}
                </option>
              ))}
            </select>
          </label>

          <p style={{ color: "#94a3b8", margin: 0 }}>
            Last Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : "Not available"}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={saving}
              style={saving ? disabledButtonStyle : primaryButtonStyle}
            >
              {saving ? "Saving..." : "Save Task"}
            </button>

            <Link href={`/tasks/${taskId}`} style={secondaryButtonStyle}>
              Cancel
            </Link>
          </div>

          <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
            Loaded profiles: {profiles.length}
          </p>
        </form>
      )}
    </main>
  );
}










