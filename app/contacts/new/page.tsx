"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Company = {
  id: string;
  name: string;
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
  fontWeight: 800,
};

const helpCardStyle: CSSProperties = {
  border: "1px solid rgba(196, 181, 253, 0.22)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(124, 58, 237, 0.1)",
  color: "#cbd5e1",
  lineHeight: 1.55,
};

export default function NewContactPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCompanies() {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setCompanies(data ?? []);
    }

    loadCompanies();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("contacts").insert({
      workspace_id: WORKSPACE_ID,
      company_id: companyId || null,
      first_name: firstName,
      last_name: lastName || null,
      title: title || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      created_by: USER_ID,
      updated_by: USER_ID,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/contacts");
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Sales / Contacts</p>
            <h1 style={titleStyle}>Add Contact</h1>
            <p style={subtitleStyle}>
              Create a new person connected to a company, opportunity, sales
              follow-up, or business-memory record.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/contacts" style={secondaryButtonStyle}>
              Back to Contacts
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={formSectionStyle}>
            <div style={helpCardStyle}>
              <strong>Contact profile</strong>
              <br />
              Add the person first. Company, title, phone, email, and notes are
              optional, but they make the assistant more useful later.
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                First Name
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  placeholder="First name"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Last Name
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={formGridStyle}>
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
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Contact email"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Phone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Contact phone"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              Contact Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Mike is the owner but said I need to talk to Frank. Frank is the truck boss and is available Thursdays."
                rows={5}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "140px",
                  lineHeight: 1.5,
                }}
              />
            </label>

            {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

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

              <Link href="/contacts" style={secondaryButtonStyle}>
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
