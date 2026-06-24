"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; import { createNotification } from "../../lib/notifications";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../../lib/actingUser";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "980px",
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
  fontWeight: 800,
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
  maxWidth: "720px",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 15px",
  borderRadius: "999px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(148, 163, 184, 0.28)",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "22px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: 800,
};

const helpTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.45,
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "14px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "140px",
  resize: "vertical",
  lineHeight: 1.55,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  padding: "12px 18px",
  borderRadius: "999px",
  fontWeight: 900,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  cursor: "pointer",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.65,
  cursor: "not-allowed",
};

const errorMessageStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.32)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "16px",
  margin: 0,
};

const previewCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
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
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
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
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Business Memory / New Pain Point</p>
            <h1 style={titleStyle}>Add Pain Point</h1>
            <p style={subtitleStyle}>
              Add a recurring business problem that Sell It can connect to
              companies, contacts, activities, posts, and future AI analysis.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/pain-points" style={secondaryLinkStyle}>
              Back to Pain Points
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "18px",
            alignItems: "start",
          }}
        >
          <form onSubmit={handleSubmit} style={{ ...cardStyle, ...formStyle }}>
            <label style={labelStyle}>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Example: Need Trucks"
                style={inputStyle}
              />
              <span style={helpTextStyle}>
                Keep this short and reusable so it can be linked across records.
              </span>
            </label>

            <label style={labelStyle}>
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

            <label style={labelStyle}>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                placeholder="Describe the recurring problem and why it matters."
                style={textareaStyle}
              />
            </label>

            {errorMessage && (
              <p style={errorMessageStyle}>Error: {errorMessage}</p>
            )}

            <div style={actionRowStyle}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...primaryButtonStyle,
                  ...(saving ? disabledButtonStyle : {}),
                }}
              >
                {saving ? "Saving..." : "Save Pain Point"}
              </button>

              <Link href="/pain-points" style={secondaryLinkStyle}>
                Cancel
              </Link>
            </div>
          </form>

          <aside style={cardStyle}>
            <p style={eyebrowStyle}>How this gets used</p>

            <div style={previewCardStyle}>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                Relationship tracking
              </h2>
              <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                After saving, you can link this pain point to companies,
                contacts, activities, and posts from the detail page.
              </p>
            </div>

            <div style={{ ...previewCardStyle, marginTop: "12px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                AI memory
              </h2>
              <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                Clean pain point names help the assistant recognize repeated
                problems and surface better follow-up ideas later.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}







