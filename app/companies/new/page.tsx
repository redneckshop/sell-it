"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

const inputStyle = {
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

export default function NewCompanyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("companies").insert({
      workspace_id: WORKSPACE_ID,
      name,
      website: website || null,
      phone: phone || null,
      email: email || null,
      created_by: USER_ID,
      updated_by: USER_ID,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/companies");
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
      <h1>Add Company</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Create a new company inside Sell It.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "500px",
        }}
      >
        <label>
          Company Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Website
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
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
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
          {saving ? "Saving..." : "Save Company"}
        </button>
      </form>
    </main>
  );
}