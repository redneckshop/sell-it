"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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

export default function NewPainPointPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operations");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("pain_points")
      .insert({
        workspace_id: WORKSPACE_ID,
        name,
        description: description || null,
        category: category || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/pain-points/${data.id}`);
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
          href="/pain-points"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Pain Points
        </Link>
      </div>

      <h1>Add Pain Point</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Add a recurring business problem that Sell It can connect to companies,
        contacts, activities, posts, and future AI analysis.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "750px",
        }}
      >
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Example: Need Trucks"
            style={inputStyle}
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={inputStyle}
          >
            <option value="Operations">Operations</option>
            <option value="Trucking Capacity">Trucking Capacity</option>
            <option value="Labor">Labor</option>
            <option value="Work Pipeline">Work Pipeline</option>
            <option value="Paperwork">Paperwork</option>
            <option value="Billing">Billing</option>
            <option value="Dispatch">Dispatch</option>
            <option value="Accountability">Accountability</option>
            <option value="Communication">Communication</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Describe the recurring problem and why it matters."
            style={inputStyle}
          />
        </label>

        {errorMessage && <p style={{ color: "red" }}>Error: {errorMessage}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "12px 18px",
            borderRadius: "6px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            maxWidth: "220px",
          }}
        >
          {saving ? "Saving..." : "Save Pain Point"}
        </button>
      </form>
    </main>
  );
}