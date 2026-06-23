"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; import { createNotification } from "../../lib/notifications";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../../lib/actingUser";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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
  maxWidth: "860px",
  marginBottom: "18px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
};

export default function NewTaskPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState(getDatabaseSafeUserId());
  const [assignedTeamMemberId, setAssignedTeamMemberId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prefilledFromAssistant, setPrefilledFromAssistant] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("assistant_prefill") !== "true") return;

    const prefillTitle = params.get("title");
    const prefillDescription = params.get("description");
    const prefillDueDate = params.get("due_date");
    const prefillPriority = params.get("priority");
    const prefillStatus = params.get("status");
    const prefillCompanyId = params.get("company_id");
    const prefillContactId = params.get("contact_id");
    const prefillOpportunityId = params.get("opportunity_id");
    const prefillAssignedTeamMemberId = params.get("assigned_team_member_id");

    if (prefillTitle) setTitle(prefillTitle);
    if (prefillDescription) setDescription(prefillDescription);
    if (prefillDueDate) setDueDate(prefillDueDate);
    if (prefillPriority) setPriority(prefillPriority);
    if (prefillStatus) setStatus(prefillStatus);
    if (prefillCompanyId) setCompanyId(prefillCompanyId);
    if (prefillContactId) setContactId(prefillContactId);
    if (prefillOpportunityId) setOpportunityId(prefillOpportunityId);
    if (prefillAssignedTeamMemberId) {
      setAssignedTeamMemberId(prefillAssignedTeamMemberId);
    }

    setPrefilledFromAssistant(true);
  }, []);

  useEffect(() => {
    async function loadOptions() {
      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (companyError) {
        setErrorMessage(companyError.message);
        return;
      }

      setCompanies(companyRows ?? []);

      const { data: contactRows, error: contactError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true });

      if (contactError) {
        setErrorMessage(contactError.message);
        return;
      }

      setContacts(contactRows ?? []);

      const { data: opportunityRows, error: opportunityError } = await supabase
        .from("opportunities")
        .select("id, name, company_id")
        .order("name", { ascending: true });

      if (opportunityError) {
        setErrorMessage(opportunityError.message);
        return;
      }

      setOpportunities(opportunityRows ?? []);

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (profileError) {
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

      const loadedTeamMembers = (teamMemberRows ?? []) as TeamMember[];

      setTeamMembers(loadedTeamMembers);

      const currentUserTeamMember = loadedTeamMembers.find(
        (member) => member.profile_id === getDatabaseSafeUserId()
      );

      if (currentUserTeamMember) {
        setAssignedTeamMemberId(currentUserTeamMember.id);
      }
    }

    loadOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const selectedTeamMember = teamMembers.find(
      (member) => member.id === assignedTeamMemberId
    );

    const actingUser = getCurrentActingUserSnapshot();
    const databaseSafeUserId = getDatabaseSafeUserId(actingUser);

    // Task New Real User Auth V1
    const { data: createdTask, error } = await supabase.from("tasks").insert({
      workspace_id: WORKSPACE_ID,
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
      created_by: databaseSafeUserId,
      updated_by: databaseSafeUserId,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/tasks");
    router.refresh();
  }

  const filteredOpportunities = companyId
    ? opportunities.filter(
        (opportunity) =>
          opportunity.company_id === companyId || opportunity.company_id === null
      )
    : opportunities;

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/tasks" style={secondaryButtonStyle}>
          Back to Tasks
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Task Management</p>

        <h1 style={titleStyle}>Add Task</h1>

        <p style={mutedTextStyle}>
          Create a follow-up task connected to a company, contact, or
          opportunity.
        </p>
      </header>

      {prefilledFromAssistant && (
        <div style={noticeStyle}>
          This task was prefilled from an Assistant recommendation. Review it
          before saving.
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Example: Follow up with dispatcher"
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

            {contacts.map((contact) => (
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

        {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={saving}
            style={saving ? disabledButtonStyle : primaryButtonStyle}
          >
            {saving ? "Saving..." : "Save Task"}
          </button>

          <Link href="/tasks" style={secondaryButtonStyle}>
            Cancel
          </Link>
        </div>

        <p style={{ color: "#64748b", margin: 0, fontSize: "13px" }}>
          Loaded profiles: {profiles.length}
        </p>
      </form>
    </main>
  );
}








