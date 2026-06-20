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
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
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

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "860px",
};

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const contactId = params.id;

  const [companies, setCompanies] = useState<Company[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadContact() {
      setLoading(true);
      setErrorMessage("");

      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (companyError) {
        setErrorMessage(companyError.message);
        setLoading(false);
        return;
      }

      setCompanies((companyRows ?? []) as Company[]);

      const { data, error } = await supabase
        .from("contacts")
        .select(
          "id, first_name, last_name, company_id, email, phone, title, notes, updated_at"
        )
        .eq("id", contactId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const contact = data as Contact;

      setFirstName(contact.first_name || "");
      setLastName(contact.last_name || "");
      setCompanyId(contact.company_id || "");
      setEmail(contact.email || "");
      setPhone(contact.phone || "");
      setTitle(contact.title || "");
      setNotes(contact.notes || "");
      setLastUpdated(contact.updated_at);
    }

    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("contacts")
      .update({
        first_name: firstName,
        last_name: lastName || null,
        company_id: companyId || null,
        email: email || null,
        phone: phone || null,
        title: title || null,
        notes: notes || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/contacts/${contactId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href={`/contacts/${contactId}`} style={secondaryButtonStyle}>
          Back to Contact
        </Link>

        <Link href="/contacts" style={secondaryButtonStyle}>
          Back to Contacts
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Contact Management</p>

        <h1 style={titleStyle}>Edit Contact</h1>

        <p style={mutedTextStyle}>
          Update this contact&apos;s company link, title, email, phone, and
          business-memory notes.
        </p>
      </header>

      {loading && (
        <div style={formStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading contact...</p>
        </div>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {!loading && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            First Name
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Last Name
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Company
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

          <label style={labelStyle}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Owner, dispatcher, truck boss, estimator, etc."
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Contact Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Important details, history, follow-up notes, decision makers, etc."
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "150px",
              }}
            />
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
              {saving ? "Saving..." : "Save Contact"}
            </button>

            <Link href={`/contacts/${contactId}`} style={secondaryButtonStyle}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}