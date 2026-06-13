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
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link
        href="/contacts"
        style={{
          color: "black",
          backgroundColor: "white",
          padding: "10px 14px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: "bold",
          display: "inline-block",
          marginBottom: "32px",
        }}
      >
        Back to Contacts
      </Link>

      <h1>Add Contact</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Create a new person connected to a company or sales follow-up.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "600px",
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
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Owner, dispatcher, truck boss, estimator, etc."
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
          Contact Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Example: Mike is the owner but said I need to talk to Frank. Frank is the truck boss and is available Thursdays."
            rows={5}
            style={inputStyle}
          />
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
          {saving ? "Saving..." : "Save Contact"}
        </button>
      </form>
    </main>
  );
}