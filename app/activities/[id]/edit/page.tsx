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

type Task = {
  id: string;
  title: string;
  company_id: string | null;
};

type Opportunity = {
  id: string;
  name: string;
  company_id: string | null;
};

type Activity = {
  id: string;
  activity_type: string;
  activity_date: string;
  subject: string;
  summary: string | null;
  raw_notes: string | null;
  outcome: string | null;
  follow_up_needed: boolean;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  task_id: string | null;
  updated_at: string | null;
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

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();

  const activityId = params.id as string;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [activityType, setActivityType] = useState("Note");
  const [activityDate, setActivityDate] = useState("");
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptionsAndActivity() {
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

      const { data: taskRows, error: taskError } = await supabase
        .from("tasks")
        .select("id, title, company_id")
        .order("created_at", { ascending: false });

      if (taskError) {
        setLoading(false);
        setErrorMessage(taskError.message);
        return;
      }

      setTasks(taskRows ?? []);

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

      const { data, error } = await supabase
        .from("activities")
        .select(
          "id, activity_type, activity_date, subject, summary, raw_notes, outcome, follow_up_needed, company_id, contact_id, opportunity_id, task_id, updated_at"
        )
        .eq("id", activityId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const activity = data as Activity;

      setActivityType(activity.activity_type || "Note");
      setActivityDate(
        activity.activity_date ? toDateTimeLocal(activity.activity_date) : ""
      );
      setSubject(activity.subject || "");
      setSummary(activity.summary || "");
      setRawNotes(activity.raw_notes || "");
      setOutcome(activity.outcome || "");
      setFollowUpNeeded(activity.follow_up_needed || false);
      setCompanyId(activity.company_id || "");
      setContactId(activity.contact_id || "");
      setTaskId(activity.task_id || "");
      setOpportunityId(activity.opportunity_id || "");
      setLastUpdated(activity.updated_at);
    }

    if (activityId) {
      loadOptionsAndActivity();
    }
  }, [activityId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("activities")
      .update({
        activity_type: activityType,
        activity_date: activityDate || null,
        subject,
        summary: summary || null,
        raw_notes: rawNotes || null,
        outcome: outcome || null,
        follow_up_needed: followUpNeeded,
        company_id: companyId || null,
        contact_id: contactId || null,
        task_id: taskId || null,
        opportunity_id: opportunityId || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/activities/${activityId}`);
    router.refresh();
  }

  const filteredContacts = companyId
    ? contacts.filter(
        (contact) => contact.company_id === companyId || contact.company_id === null
      )
    : contacts;

  const filteredTasks = companyId
    ? tasks.filter((task) => task.company_id === companyId || task.company_id === null)
    : tasks;

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
          href={`/activities/${activityId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Activity
        </Link>
      </div>

      <h1>Edit Activity</h1>

      {loading && <p>Loading activity...</p>}

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
            maxWidth: "750px",
            marginTop: "32px",
          }}
        >
          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
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

          <label>
            Activity Date
            <input
              type="datetime-local"
              value={activityDate}
              onChange={(event) => setActivityDate(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Related Company
            <select
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setContactId("");
                setTaskId("");
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

          <label>
            Related Task
            <select
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              style={inputStyle}
            >
              <option value="">No task selected</option>

              {filteredTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>

          <label>
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

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={followUpNeeded}
              onChange={(event) => setFollowUpNeeded(event.target.checked)}
            />
            Follow Up Needed
          </label>

          <label>
            Summary
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              placeholder="Short summary of what happened."
              style={inputStyle}
            />
          </label>

          <label>
            Raw Notes
            <textarea
              value={rawNotes}
              onChange={(event) => setRawNotes(event.target.value)}
              rows={6}
              placeholder="Raw notes, transcript text, copied message, or call details."
              style={inputStyle}
            />
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
            {saving ? "Saving..." : "Save Activity"}
          </button>
        </form>
      )}
    </main>
  );
}