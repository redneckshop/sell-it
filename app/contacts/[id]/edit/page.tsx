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
          href={`/contacts/${contactId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Contact
        </Link>
      </div>

      <h1>Edit Contact</h1>

      {loading && <p>Loading contact...</p>}

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
            maxWidth: "700px",
            marginTop: "32px",
          }}
        >
          <label>
            First Name
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Last Name
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
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

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Owner, dispatcher, truck boss, estimator, etc."
              style={inputStyle}
            />
          </label>

          <label>
            Contact Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Important details, history, follow-up notes, decision makers, etc."
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
            {saving ? "Saving..." : "Save Contact"}
          </button>
        </form>
      )}
    </main>
  );
}

