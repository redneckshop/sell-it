"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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
  const [assignedTo, setAssignedTo] = useState(USER_ID);
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
    if (prefillAssignedTeamMemberId) setAssignedTeamMemberId(prefillAssignedTeamMemberId);

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
        (member) => member.profile_id === USER_ID
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

    const { error } = await supabase.from("tasks").insert({
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
      created_by: USER_ID,
      updated_by: USER_ID,
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
          Back to Tasks
        </Link>
      </div>

      <h1>Add Task</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Create a follow-up task connected to a company, contact, or opportunity.
      </p>

      {prefilledFromAssistant && (
        <div
          style={{
            border: "1px solid #f5d76e",
            backgroundColor: "#211c0d",
            color: "#ffcc66",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "900px",
          }}
        >
          This task was prefilled from an Assistant recommendation. Review it before saving.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "650px",
        }}
      >
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Example: Follow up with dispatcher"
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

            {contacts.map((contact) => (
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

        {errorMessage && (
          <p style={{ color: "red" }}>Error: {errorMessage}</p>
        )}

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
    </main>
  );
}