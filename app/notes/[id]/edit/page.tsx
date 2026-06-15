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

      const [
        companyResult,
        contactResult,
        opportunityResult,
        noteResult,
      ] = await Promise.all([
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

    const { error } = await supabase
      .from("notes")
      .update({
        title,
        body: body || null,
        source: source || null,
        source_url: sourceUrl || null,
        tags: tags || null,
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

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
          href={`/notes/${noteId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Note
        </Link>
      </div>

      <h1>Edit Note</h1>

      {loading && <p>Loading note...</p>}

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
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Body
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={8}
              style={inputStyle}
            />
          </label>

          <label>
            Source
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Phone call, Facebook, website, email, etc."
              style={inputStyle}
            />
          </label>

          <label>
            Source URL
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </label>

          <label>
            Tags
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="hot lead, follow up, pricing, etc."
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
            {saving ? "Saving..." : "Save Note"}
          </button>
        </form>
      )}
    </main>
  );
}

