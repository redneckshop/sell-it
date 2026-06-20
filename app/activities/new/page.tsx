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
  phone: string | null;
  email: string | null;
};

type Task = {
  id: string;
  title: string;
};

type Opportunity = {
  id: string;
  name: string;
  company_id: string | null;
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
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  border: "1px solid rgba(168, 85, 247, 0.55)",
  padding: "13px 18px",
  borderRadius: "999px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(124, 58, 237, 0.28)",
};

const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const headerStyle: CSSProperties = {
  maxWidth: "1080px",
  marginBottom: "24px",
  border: "1px solid rgba(124, 58, 237, 0.22)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
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
  maxWidth: "900px",
  lineHeight: 1.65,
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  marginBottom: "16px",
  maxWidth: "1080px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.22)",
};

const noticeCardStyle: CSSProperties = {
  ...cardStyle,
  borderColor: "rgba(245, 158, 11, 0.36)",
  background:
    "linear-gradient(180deg, rgba(120, 53, 15, 0.35), rgba(15, 23, 42, 0.72))",
};

const formStyle: CSSProperties = {
  ...cardStyle,
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#cbd5e1",
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "13px 14px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: "12px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#cbd5e1",
  fontWeight: 800,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  fontWeight: 800,
};

function getCurrentDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function NewActivityPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [activityType, setActivityType] = useState("Note");
  const [activityDate, setActivityDate] = useState(getCurrentDateTimeLocal());
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prefilledFromAssistant, setPrefilledFromAssistant] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("assistant_prefill") !== "true") return;

    const prefillActivityType = params.get("activity_type");
    const prefillSubject = params.get("subject");
    const prefillSummary = params.get("summary");
    const prefillRawNotes = params.get("raw_notes");
    const prefillOutcome = params.get("outcome");
    const prefillFollowUpNeeded = params.get("follow_up_needed");
    const prefillCompanyId = params.get("company_id");
    const prefillContactId = params.get("contact_id");
    const prefillTaskId = params.get("task_id");
    const prefillOpportunityId = params.get("opportunity_id");

    if (prefillActivityType) setActivityType(prefillActivityType);
    if (prefillSubject) setSubject(prefillSubject);
    if (prefillSummary) setSummary(prefillSummary);
    if (prefillRawNotes) setRawNotes(prefillRawNotes);
    if (prefillOutcome) setOutcome(prefillOutcome);
    if (prefillFollowUpNeeded === "true") setFollowUpNeeded(true);
    if (prefillFollowUpNeeded === "false") setFollowUpNeeded(false);
    if (prefillCompanyId) setCompanyId(prefillCompanyId);
    if (prefillContactId) setContactId(prefillContactId);
    if (prefillTaskId) setTaskId(prefillTaskId);
    if (prefillOpportunityId) setOpportunityId(prefillOpportunityId);

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
        .select("id, first_name, last_name, phone, email")
        .order("first_name", { ascending: true });

      if (contactError) {
        setErrorMessage(contactError.message);
        return;
      }

      setContacts(contactRows ?? []);

      const { data: taskRows, error: taskError } = await supabase
        .from("tasks")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (taskError) {
        setErrorMessage(taskError.message);
        return;
      }

      setTasks(taskRows ?? []);

      const { data: opportunityRows, error: opportunityError } = await supabase
        .from("opportunities")
        .select("id, name, company_id")
        .order("name", { ascending: true });

      if (opportunityError) {
        setErrorMessage(opportunityError.message);
        return;
      }

      setOpportunities(opportunityRows ?? []);
    }

    loadOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("activities").insert({
      workspace_id: WORKSPACE_ID,
      activity_type: activityType,
      activity_date: activityDate,
      subject,
      summary: summary || null,
      raw_notes: rawNotes || null,
      outcome: outcome || null,
      follow_up_needed: followUpNeeded,
      company_id: companyId || null,
      contact_id: contactId || null,
      task_id: taskId || null,
      opportunity_id: opportunityId || null,
      created_by: USER_ID,
      updated_by: USER_ID,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/activities");
    router.refresh();
  }

  const filteredOpportunities = companyId
    ? opportunities.filter(
        (opportunity) =>
          opportunity.company_id === companyId || opportunity.company_id === null
      )
    : opportunities;

  const selectedContact =
    contacts.find((contact) => contact.id === contactId) ?? null;
  const selectedContactName = selectedContact
    ? `${selectedContact.first_name} ${selectedContact.last_name || ""}`.trim()
    : "";

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/activities" style={secondaryButtonStyle}>
          Back to Activities
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Activity Management</p>

        <h1 style={titleStyle}>Add Activity</h1>

        <p style={mutedTextStyle}>
          Record a call, message, meeting, note, transcript, or follow-up
          activity. Link it to the right company, contact, task, or opportunity
          so the sales memory stays connected.
        </p>
      </header>

      {prefilledFromAssistant && (
        <section style={noticeCardStyle}>
          <strong>Assistant Prefill</strong>
          <p style={{ color: "#fde68a", lineHeight: 1.6, marginBottom: 0 }}>
            This activity was prefilled from an Assistant recommendation. Review
            it before saving.
          </p>
        </section>
      )}

      {prefilledFromAssistant && selectedContact && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Communication Details</h2>

          <p style={{ marginTop: 0 }}>
            <strong>Contact:</strong>{" "}
            {selectedContactName || "Selected contact"}
          </p>

          <p>
            <strong>Phone:</strong>{" "}
            {selectedContact.phone ? (
              <a
                href={`tel:${selectedContact.phone}`}
                style={{ color: "#93c5fd", fontWeight: 900 }}
              >
                {selectedContact.phone}
              </a>
            ) : (
              <span style={{ color: "#fde68a" }}>No phone number saved.</span>
            )}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {selectedContact.email ? (
              <a
                href={`mailto:${selectedContact.email}`}
                style={{ color: "#93c5fd", fontWeight: 900 }}
              >
                {selectedContact.email}
              </a>
            ) : (
              <span style={{ color: "#fde68a" }}>No email address saved.</span>
            )}
          </p>

          <p style={{ color: "#94a3b8", marginBottom: 0, lineHeight: 1.6 }}>
            Current version prepares the call, text, or email draft only. It does
            not send, call, or text automatically yet.
          </p>
        </section>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
            placeholder="Example: Intro call with dispatcher"
            style={inputStyle}
          />
        </label>

        <div style={twoColumnGridStyle}>
          <label style={labelStyle}>
            Activity Type
            <select
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
              style={inputStyle}
            >
              <option value="Call">Call</option>
              <option value="Voicemail">Voicemail</option>
              <option value="Text Message">Text Message</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Lunch">Lunch</option>
              <option value="Website Research">Website Research</option>
              <option value="Facebook Comment">Facebook Comment</option>
              <option value="Facebook Message">Facebook Message</option>
              <option value="Note">Note</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label style={labelStyle}>
            Activity Date
            <input
              type="datetime-local"
              value={activityDate}
              onChange={(event) => setActivityDate(event.target.value)}
              required
              style={inputStyle}
            />
          </label>
        </div>

        <div style={twoColumnGridStyle}>
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
        </div>

        <div style={twoColumnGridStyle}>
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

          <label style={labelStyle}>
            Related Task
            <select
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              style={inputStyle}
            >
              <option value="">No task selected</option>

              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={twoColumnGridStyle}>
          <label style={labelStyle}>
            Outcome
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              style={inputStyle}
            >
              <option value="">No outcome selected</option>
              <option value="No Answer">No Answer</option>
              <option value="Left Voicemail">Left Voicemail</option>
              <option value="Spoke">Spoke</option>
              <option value="Texted">Texted</option>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Meeting Booked">Meeting Booked</option>
              <option value="Follow-Up Needed">Follow-Up Needed</option>
              <option value="Converted">Converted</option>
              <option value="Bad Fit">Bad Fit</option>
            </select>
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={followUpNeeded}
              onChange={(event) => setFollowUpNeeded(event.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />
            Follow Up Needed
          </label>
        </div>

        <label style={labelStyle}>
          Summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            placeholder="Short summary of what happened."
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Raw Notes
          <textarea
            value={rawNotes}
            onChange={(event) => setRawNotes(event.target.value)}
            rows={6}
            placeholder="Raw notes, transcript text, copied message, or call details."
            style={inputStyle}
          />
        </label>

        {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

        <div style={actionRowStyle}>
          <button
            type="submit"
            disabled={saving}
            style={saving ? disabledButtonStyle : primaryButtonStyle}
          >
            {saving ? "Saving..." : "Save Activity"}
          </button>

          <Link href="/activities" style={secondaryButtonStyle}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}