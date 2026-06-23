"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
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

const shellStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.55,
  maxWidth: "820px",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "22px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "14px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  padding: "12px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
  cursor: "pointer",
  fontSize: "15px",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  padding: "12px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  cursor: "pointer",
  fontSize: "15px",
};

const disabledStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const formSectionStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  fontWeight: 800,
};

const loadingStyle: CSSProperties = {
  ...cardStyle,
  color: "#cbd5e1",
};

const metaStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "16px",
  padding: "12px 14px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
  color: "#94a3b8",
  margin: 0,
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

    const changedAt = new Date().toISOString();

    const updateResult = await updateRecordWithConcurrencyGuard({
      tableName: "contacts",
      recordId: contactId,
      loadedUpdatedAt: lastUpdated,
      entityLabel: `${firstName} ${lastName}`.trim() || "Contact",
      values: {
        first_name: firstName,
        last_name: lastName || null,
        company_id: companyId || null,
        email: email || null,
        phone: phone || null,
        title: title || null,
        notes: notes || null,
        updated_by: USER_ID,
        updated_at: changedAt,
      },
    });

    setSaving(false);

    if (!updateResult.ok) {
      setErrorMessage(updateResult.errorMessage);
      return;
    }

    // Contact Edit Concurrency Protection V1

    router.push(`/contacts/${contactId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Sales / Contacts</p>
            <h1 style={titleStyle}>Edit Contact</h1>
            <p style={subtitleStyle}>
              Update this contact&apos;s company link, title, email, phone, and
              business-memory notes.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href={`/contacts/${contactId}`} style={secondaryButtonStyle}>
              Back to Contact
            </Link>

            <Link href="/contacts" style={secondaryButtonStyle}>
              Back to Contacts
            </Link>
          </div>
        </div>

        {loading && (
          <div style={loadingStyle}>
            <p style={{ margin: 0 }}>Loading contact...</p>
          </div>
        )}

        {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

        {!loading && (
          <form onSubmit={handleSubmit} style={cardStyle}>
            <div style={formSectionStyle}>
              <div style={formGridStyle}>
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
              </div>

              <div style={formGridStyle}>
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
                  Title
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Owner, dispatcher, truck boss, estimator, etc."
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={formGridStyle}>
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
              </div>

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
                    lineHeight: 1.5,
                  }}
                />
              </label>

              <p style={metaStyle}>
                Last Updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleString()
                  : "Not available"}
              </p>

              <div style={actionRowStyle}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButtonStyle,
                    ...(saving ? disabledStyle : {}),
                  }}
                >
                  {saving ? "Saving..." : "Save Contact"}
                </button>

                <Link href={`/contacts/${contactId}`} style={secondaryButtonStyle}>
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

