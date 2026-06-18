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

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
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

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  completed_at: string | null;
  completed_by: string | null;
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

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "18px",
  backgroundColor: "#151515",
  maxWidth: "950px",
  marginBottom: "18px",
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

function todayDateInputValue() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatScheduleDisplayDate(value: string | null) {
  if (!value) return "No due date";

  const keyMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  const key = keyMatch?.[1] || "";

  if (key) {
    const [year, month, day] = key.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
}

function profileLabel(profile: Profile) {
  return profile.full_name || profile.email || "Unnamed user";
}

function contactLabel(contact: Contact) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function AssistantScheduleTaskClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [sourceTask, setSourceTask] = useState<Task | null>(null);
  const [sourceTaskId, setSourceTaskId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState(USER_ID);
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [savedTaskId, setSavedTaskId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const paramSourceTaskId = searchParams.get("source_task_id") || "";
      const paramTitle = searchParams.get("title") || "";
      const paramDescription = searchParams.get("description") || "";
      const paramDueDate = searchParams.get("due_date") || "";
      const paramPriority = searchParams.get("priority") || "Normal";
      const paramAssignedTo = searchParams.get("assigned_to") || USER_ID;
      const paramCompanyId = searchParams.get("company_id") || "";
      const paramContactId = searchParams.get("contact_id") || "";
      const paramOpportunityId = searchParams.get("opportunity_id") || "";

      setSourceTaskId(paramSourceTaskId);
      setTitle(paramTitle);
      setDescription(paramDescription);
      setDueDate(paramDueDate);
      setPriority(paramPriority);
      setAssignedTo(paramAssignedTo);
      setCompanyId(paramCompanyId);
      setContactId(paramContactId);
      setOpportunityId(paramOpportunityId);

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

      if (paramSourceTaskId) {
        const { data: taskRow, error: taskError } = await supabase
          .from("tasks")
          .select(
            "id, title, description, due_date, priority, status, assigned_to, company_id, contact_id, opportunity_id, completed_at, completed_by"
          )
          .eq("id", paramSourceTaskId)
          .single();

        if (taskError) {
          setLoading(false);
          setErrorMessage(taskError.message);
          return;
        }

        const loadedTask = taskRow as Task;

        setSourceTask(loadedTask);
        setTitle(paramTitle || loadedTask.title || "");
        setDescription(paramDescription || loadedTask.description || "");
        setDueDate(paramDueDate || loadedTask.due_date || "");
        setPriority(paramPriority || loadedTask.priority || "Normal");
        setStatus(
          loadedTask.status === "Completed" || loadedTask.status === "Cancelled"
            ? "Open"
            : loadedTask.status || "Open"
        );
        setAssignedTo(paramAssignedTo || loadedTask.assigned_to || USER_ID);
        setCompanyId(paramCompanyId || loadedTask.company_id || "");
        setContactId(paramContactId || loadedTask.contact_id || "");
        setOpportunityId(paramOpportunityId || loadedTask.opportunity_id || "");
      }

      setLoading(false);
    }

    loadPageData();
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmed) {
      setErrorMessage("Confirm the action before saving this scheduled task.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Task title is required.");
      return;
    }

    if (!dueDate) {
      setErrorMessage("A due date is required before this can appear on the Planner.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSavedTaskId("");

    const changedAt = new Date().toISOString();
    const nextStatus = status || "Open";
    const isCompleted = nextStatus === "Completed";
    const completionAt = isCompleted
      ? sourceTask?.completed_at || changedAt
      : null;
    const completionBy = isCompleted
      ? sourceTask?.completed_by || USER_ID
      : null;

    if (sourceTaskId) {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: title.trim(),
          description: description || null,
          due_date: dueDate,
          priority,
          status: nextStatus,
          assigned_to: assignedTo || null,
          company_id: companyId || null,
          contact_id: contactId || null,
          opportunity_id: opportunityId || null,
          completed_at: completionAt,
          completed_by: completionBy,
          updated_by: USER_ID,
          updated_at: changedAt,
        })
        .eq("id", sourceTaskId);

      setSaving(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSavedTaskId(sourceTaskId);
      setSuccessMessage("Existing task scheduled and saved. It should now appear on the Planner.");
      router.refresh();
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        workspace_id: WORKSPACE_ID,
        title: title.trim(),
        description: description || null,
        due_date: dueDate,
        priority,
        status: nextStatus,
        assigned_to: assignedTo || null,
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        completed_at: completionAt,
        completed_by: completionBy,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const createdId = (data as { id: string } | null)?.id || "";

    setSavedTaskId(createdId);
    setSuccessMessage("Scheduled task created. It should now appear on the Planner.");
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

  const displaySuccessMessage =
    successMessage ||
    (savedTaskId
      ? "Scheduled task saved. It should now appear on the Planner."
      : "");

  if (loading) {
    return (
      <main style={{ padding: "24px", color: "white" }}>
        <p>Loading schedule review...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", color: "white" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/assistant" style={{ color: "#8ab4ff" }}>
          Back to Assistant
        </Link>

        <Link href="/planner" style={{ color: "#8ab4ff" }}>
          Open Planner
        </Link>

        {savedTaskId && (
          <Link href={`/tasks/${savedTaskId}`} style={{ color: "#8ab4ff" }}>
            Open Saved Task
          </Link>
        )}
      </div>

      <h1>Assistant Action: Schedule Task</h1>

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
        Review the task details below. Sell It will not create or update a task
        until you confirm and press Save Scheduled Task.
      </div>

      {sourceTask && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Scheduling Existing Task</h2>
          <p>
            <strong>Current task:</strong> {sourceTask.title}
          </p>
          <p>
            <strong>Current due date:</strong>{" "}
            {formatScheduleDisplayDate(sourceTask.due_date)}
          </p>
          <p style={{ color: "#aaa", marginBottom: 0 }}>
            Saving will update this existing task instead of creating a duplicate.
          </p>
        </div>
      )}

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

      {displaySuccessMessage && (
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
          {displaySuccessMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={cardStyle}>
        <label>
          Title
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setConfirmed(false);
            }}
            style={inputStyle}
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setConfirmed(false);
            }}
            rows={6}
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <label>
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => {
                setDueDate(event.target.value);
                setConfirmed(false);
              }}
              min={todayDateInputValue()}
              style={inputStyle}
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setConfirmed(false);
              }}
              style={inputStyle}
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setConfirmed(false);
              }}
              style={inputStyle}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        <label>
          Assigned To
          <select
            value={assignedTo}
            onChange={(event) => {
              setAssignedTo(event.target.value);
              setConfirmed(false);
            }}
            style={inputStyle}
          >
            <option value="">Unassigned</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profileLabel(profile)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Related Company
          <select
            value={companyId}
            onChange={(event) => {
              setCompanyId(event.target.value);
              setContactId("");
              setOpportunityId("");
              setConfirmed(false);
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

        <label>
          Related Contact
          <select
            value={contactId}
            onChange={(event) => {
              setContactId(event.target.value);
              setConfirmed(false);
            }}
            style={inputStyle}
          >
            <option value="">No contact selected</option>
            {filteredContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contactLabel(contact)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Related Opportunity
          <select
            value={opportunityId}
            onChange={(event) => {
              setOpportunityId(event.target.value);
              setConfirmed(false);
            }}
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
            disabled={saving || Boolean(savedTaskId)}
          />
          <span>
            I confirm I want to {sourceTaskId ? "update" : "create"} this scheduled task.
          </span>
        </label>

        <button
          type="submit"
          disabled={!confirmed || saving || Boolean(savedTaskId)}
          style={!confirmed || saving || Boolean(savedTaskId) ? disabledButtonStyle : buttonStyle}
        >
          {savedTaskId ? "Saved" : saving ? "Saving..." : "Save Scheduled Task"}
        </button>
      </form>
    </main>
  );
}
export default function AssistantScheduleTaskPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: "24px", color: "white" }}>
          <p>Loading schedule review...</p>
        </main>
      }
    >
      <AssistantScheduleTaskClient />
    </Suspense>
  );
}
