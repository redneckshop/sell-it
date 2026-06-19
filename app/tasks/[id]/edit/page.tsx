"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
    const isCompleted = status === "Completed";
    const nextCompletedAt = isCompleted ? completedAt || changedAt : null;
    const nextCompletedBy = isCompleted ? completedBy || USER_ID : null;

    const selectedTeamMember = teamMembers.find(
      (member) => member.id === assignedTeamMemberId
    );

    const { error } = await supabase
      .from("tasks")
      .update({
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
        status,
        assigned_to: selectedTeamMember?.profile_id || assignedTo || null,
        assigned_team_member_id: assignedTeamMemberId || null,
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        completed_at: nextCompletedAt,
        completed_by: nextCompletedBy,
        updated_by: USER_ID,
        updated_at: changedAt,
      })
      .eq("id", taskId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

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
          marginBottom: "32px",
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
          href={`/tasks/${taskId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Task
        </Link>
      </div>

      <h1>Edit Task</h1>

      {loading && <p>Loading task...</p>}

      {errorMessage && (
        <p style={{ color: "red", marginTop: "24px" }}>
          Error: {errorMessage}
        </p>
      )}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "700px",
            marginTop: "32px",
          }}
        >
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Task details..."
              style={inputStyle}
            />
          </label>

          <label>
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
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

          <label>
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
            <div
              style={{
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: "#151515",
                color: "#aaa",
              }}
            >
              Completion metadata will be saved when this task is saved.
              Completed At:{" "}
              {completedAt ? new Date(completedAt).toLocaleString() : "On save"}
            </div>
          )}

          {originalStatus === "Completed" && status !== "Completed" && (
            <div
              style={{
                border: "1px solid #f5d76e",
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: "#211c0d",
                color: "#ffcc66",
              }}
            >
              Saving this task as {status} will clear Completed At and Completed By.
            </div>
          )}

          <label>
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

          <label>
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

          <label>
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

          <label>
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

          <p style={{ color: "#aaa" }}>
            Last Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : "Not available"}
          </p>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              color: "black",
              fontSize: "16px",
            }}
          >
            {saving ? "Saving..." : "Save Task"}
          </button>
        </form>
      )}
    </main>
  );
}