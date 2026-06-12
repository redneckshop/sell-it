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

type Task = {
  id: string;
  title: string;
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

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

      const { data: taskRows, error: taskError } = await supabase
        .from("tasks")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (taskError) {
        setErrorMessage(taskError.message);
        return;
      }

      setTasks(taskRows ?? []);
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
      <Link href="/activities" style={{ color: "white" }}>
        ← Back to Activities
      </Link>

      <h1 style={{ marginTop: "32px" }}>Add Activity</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Record a sales conversation, note, message, call, meeting, or research item.
      </p>

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
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            style={inputStyle}
          />
        </label>

        <label>
          Raw Notes
          <textarea
            value={rawNotes}
            onChange={(event) => setRawNotes(event.target.value)}
            rows={6}
            style={inputStyle}
          />
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
          Related Company
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
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
          {saving ? "Saving..." : "Save Activity"}
        </button>
      </form>
    </main>
  );
}