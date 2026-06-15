"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type PainPoint = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
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

    const { error } = await supabase
      .from("pain_points")
      .update({
        name,
        description: description || null,
        category: category || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", painPointId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/pain-points/${painPointId}`);
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
          href={`/pain-points/${painPointId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Pain Point
        </Link>
      </div>

      <h1>Edit Pain Point</h1>

      {loading && <p>Loading pain point...</p>}

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
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
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
              rows={6}
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
            {saving ? "Saving..." : "Save Pain Point"}
          </button>
        </form>
      )}
    </main>
  );
}

