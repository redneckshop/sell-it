"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { updateRecordWithConcurrencyGuard } from "../../../lib/concurrency";

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
  primary_contact_id: string | null;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  source_url: string | null;
  tags: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  updated_at: string | null;
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

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "1080px",
  fontWeight: 800,
};

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const noteId = params.id;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadNote() {
      setLoading(true);
      setErrorMessage("");

      const [companyResult, contactResult, opportunityResult, noteResult] =
        await Promise.all([
          supabase
            .from("companies")
            .select("id, name")
            .order("name", { ascending: true }),

          supabase
            .from("contacts")
            .select("id, first_name, last_name, company_id")
            .order("first_name", { ascending: true }),

          supabase
            .from("opportunities")
            .select("id, name, company_id, primary_contact_id")
            .order("created_at", { ascending: false }),

          supabase
            .from("notes")
            .select(
              "id, title, body, source, source_url, tags, company_id, contact_id, opportunity_id, updated_at"
            )
            .eq("id", noteId)
            .single(),
        ]);

      const firstError =
        companyResult.error ||
        contactResult.error ||
        opportunityResult.error ||
        noteResult.error;

      setLoading(false);

      if (firstError) {
        setErrorMessage(firstError.message);
        return;
      }

      setCompanies((companyResult.data ?? []) as Company[]);
      setContacts((contactResult.data ?? []) as Contact[]);
      setOpportunities((opportunityResult.data ?? []) as Opportunity[]);

      const note = noteResult.data as Note;

      setTitle(note.title || "");
      setBody(note.body || "");
      setSource(note.source || "");
      setSourceUrl(note.source_url || "");
      setTags(note.tags || "");
      setCompanyId(note.company_id || "");
      setContactId(note.contact_id || "");
      setOpportunityId(note.opportunity_id || "");
      setLastUpdated(note.updated_at);
    }

    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const changedAt = new Date().toISOString();

    const updateResult = await updateRecordWithConcurrencyGuard({
      tableName: "notes",
      recordId: noteId,
      loadedUpdatedAt: lastUpdated,
      entityLabel: title || "Note",
      values: {
        title,
        body: body || null,
        source: source || null,
        source_url: sourceUrl || null,
        tags: tags || null,
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        updated_by: USER_ID,
        updated_at: changedAt,
      },
    });

    setSaving(false);

    if (!updateResult.ok) {
      setErrorMessage(updateResult.errorMessage);
      return;
    }

    // Note Edit Concurrency Protection V1

    router.push(`/notes/${noteId}`);
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
          opportunity.company_id === companyId ||
          opportunity.company_id === null
      )
    : opportunities;

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href={`/notes/${noteId}`} style={secondaryButtonStyle}>
          Back to Note
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Sales Memory</p>

        <h1 style={titleStyle}>Edit Note</h1>

        <p style={mutedTextStyle}>
          Update the note body, source details, tags, and related company,
          contact, or opportunity while keeping the sales memory connected.
        </p>
      </header>

      {loading && (
        <section style={cardStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading note...</p>
        </section>
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
            Body
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={8}
              style={inputStyle}
            />
          </label>

          <div style={twoColumnGridStyle}>
            <label style={labelStyle}>
              Source
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="Phone call, Facebook, website, email, etc."
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Source URL
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="hot lead, follow up, pricing, etc."
              style={inputStyle}
            />
          </label>

          <div style={twoColumnGridStyle}>
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
          </div>

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
            {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not available"}
          </p>

          <div style={actionRowStyle}>
            <button
              type="submit"
              disabled={saving}
              style={saving ? disabledButtonStyle : primaryButtonStyle}
            >
              {saving ? "Saving..." : "Save Note"}
            </button>

            <Link href={`/notes/${noteId}`} style={secondaryButtonStyle}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
