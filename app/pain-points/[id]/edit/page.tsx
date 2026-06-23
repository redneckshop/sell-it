"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { getDatabaseSafeUserId } from "../../../lib/actingUser";
import { updateRecordWithConcurrencyGuard } from "../../../lib/concurrency";

const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type PainPoint = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  updated_at: string | null;
};

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
  minHeight: "150px",
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
  margin: "0 0 18px",
};

const metaCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function EditPainPointPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const painPointId = params.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operations");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPainPoint() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("pain_points")
        .select("id, name, description, category, updated_at")
        .eq("id", painPointId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const painPoint = data as PainPoint;

      setName(painPoint.name || "");
      setDescription(painPoint.description || "");
      setCategory(painPoint.category || "Operations");
      setLastUpdated(painPoint.updated_at);
    }

    if (painPointId) {
      loadPainPoint();
    }
  }, [painPointId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const changedAt = new Date().toISOString();

    const updateResult = await updateRecordWithConcurrencyGuard({
      tableName: "pain_points",
      recordId: painPointId,
      loadedUpdatedAt: lastUpdated,
      entityLabel: name || "Pain Point",
      values: {
        name,
        description: description || null,
        category: category || null,
        updated_by: getDatabaseSafeUserId(),
        updated_at: changedAt,
      },
    });

    setSaving(false);

    if (!updateResult.ok) {
      setErrorMessage(updateResult.errorMessage);
      return;
    }

    // Pain Point Edit Concurrency Protection V1

    router.push(`/pain-points/${painPointId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Business Memory / Edit Pain Point</p>
            <h1 style={titleStyle}>Edit Pain Point</h1>
            <p style={subtitleStyle}>
              Update the name, category, and description for this recurring
              business problem without changing its existing relationships.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href={`/pain-points/${painPointId}`} style={secondaryLinkStyle}>
              Back to Pain Point
            </Link>
          </div>
        </div>

        {errorMessage && <p style={errorMessageStyle}>Error: {errorMessage}</p>}

        {loading && (
          <div style={cardStyle}>
            <p style={eyebrowStyle}>Loading</p>
            <h2 style={{ margin: 0 }}>Loading pain point...</h2>
            <p style={subtitleStyle}>
              Pulling the existing record before opening the edit form.
            </p>
          </div>
        )}

        {!loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                  style={inputStyle}
                />
                <span style={helpTextStyle}>
                  Use a clear reusable name so this pain point is easy to link
                  across companies, contacts, activities, and posts.
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
                  rows={6}
                  style={textareaStyle}
                />
              </label>

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

                <Link
                  href={`/pain-points/${painPointId}`}
                  style={secondaryLinkStyle}
                >
                  Cancel
                </Link>
              </div>
            </form>

            <aside style={cardStyle}>
              <p style={eyebrowStyle}>Record Info</p>

              <div style={metaCardStyle}>
                <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                  Last Updated
                </h2>
                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                  {formatDateTime(lastUpdated)}
                </p>
              </div>

              <div style={{ ...metaCardStyle, marginTop: "12px" }}>
                <h2 style={{ margin: "0 0 8px", fontSize: "18px" }}>
                  Relationship-safe edit
                </h2>
                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
                  Saving here updates the pain point itself. Existing company,
                  contact, activity, and post links stay attached.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

