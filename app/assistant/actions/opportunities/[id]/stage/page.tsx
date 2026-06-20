"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase"; import { createNotification } from "../../../../../lib/notifications";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

const STAGE_OPTIONS = [
  "New Lead",
  "Contact Attempted",
  "Contact Made",
  "Discovery",
  "Meeting Scheduled",
  "Demo Scheduled",
  "Alpha Candidate",
  "Alpha Accepted",
  "Active Alpha",
  "Beta Candidate",
  "Active Beta",
  "Customer",
  "Lost",
  "Paused",
];

type Opportunity = {
  id: string;
  workspace_id: string;
  name: string;
  stage: string;
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

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "18px",
  backgroundColor: "#151515",
  maxWidth: "900px",
  marginBottom: "18px",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#f5d76e",
  color: "black",
  border: "none",
  borderRadius: "8px",
  padding: "12px 16px",
  fontWeight: "bold",
  fontSize: "15px",
  cursor: "pointer",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

function stagesAreDifferent(oldStage: string, newStage: string) {
  return oldStage.trim() !== newStage.trim();
}

export default function AssistantMoveOpportunityStagePage() {
  const params = useParams();
  const router = useRouter();

  const opportunityId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [selectedStage, setSelectedStage] = useState("New Lead");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadOpportunity() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data, error } = await supabase
        .from("opportunities")
        .select("id, workspace_id, name, stage, updated_at")
        .eq("id", opportunityId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const loadedOpportunity = data as Opportunity;

      setOpportunity(loadedOpportunity);
      setSelectedStage(loadedOpportunity.stage || "New Lead");
    }

    if (opportunityId) {
      loadOpportunity();
    }
  }, [opportunityId]);

  async function handleMoveStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!opportunity) return;

    if (!confirmed) {
      setErrorMessage("Confirm the action before updating the opportunity stage.");
      return;
    }

    const oldStage = opportunity.stage || "New Lead";
    const newStage = selectedStage || "New Lead";

    if (!stagesAreDifferent(oldStage, newStage)) {
      setErrorMessage("");
      setSuccessMessage(
        "Stage was unchanged. No opportunity update and no stage history row were created."
      );
      return;
    }

    if (!opportunity.workspace_id) {
      setErrorMessage(
        "Cannot move this opportunity stage because the opportunity is missing a workspace_id."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const changedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("opportunities")
      .update({
        stage: newStage,
        updated_by: USER_ID,
        updated_at: changedAt,
      })
      .eq("id", opportunityId);

    if (updateError) {
      setSaving(false);
      setErrorMessage(updateError.message);
      return;
    }

    const { error: historyError } = await supabase
      .from("opportunity_stage_history")
      .insert({
        workspace_id: opportunity.workspace_id,
        opportunity_id: opportunityId,
        old_stage: oldStage || null,
        new_stage: newStage,
        changed_by: USER_ID,
        changed_at: changedAt,
        notes: "Stage moved from Assistant Action Center.",
      });

    if (historyError) {
      setSaving(false);
      setErrorMessage(
        `Opportunity stage was updated, but stage history failed: ${historyError.message}`
      );
      router.refresh();
      return;
    }

    setOpportunity({
      ...opportunity,
      stage: newStage,
      updated_at: changedAt,
    });
    setConfirmed(false);
    setSaving(false);
    setSuccessMessage(
      `Opportunity stage moved from "${oldStage}" to "${newStage}". Stage history was created.`
    );

    router.refresh();
  }

  if (loading) {
    return (
      <main style={{ padding: "24px", color: "white" }}>
        <p>Loading opportunity...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", color: "white" }}>
      <Link href="/assistant" style={{ color: "#8ab4ff" }}>
        â† Back to Assistant
      </Link>

      <h1>Assistant Action: Move Opportunity Stage</h1>

      <div
        style={{
          border: "1px solid #f5d76e",
          backgroundColor: "#211c0d",
          color: "#ffcc66",
          padding: "14px",
          borderRadius: "8px",
          marginBottom: "18px",
          maxWidth: "900px",
        }}
      >
        This action will update the opportunity only after you choose a stage, confirm, and press the button below.
      </div>

      {errorMessage && (
        <div
          style={{
            border: "1px solid #ff6b6b",
            backgroundColor: "#2a1111",
            color: "#ff9999",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "900px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            border: "1px solid #46d369",
            backgroundColor: "#102414",
            color: "#8ff0a4",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
            maxWidth: "900px",
          }}
        >
          {successMessage}
        </div>
      )}

      {!opportunity ? (
        <div style={cardStyle}>Opportunity not found.</div>
      ) : (
        <>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{opportunity.name}</h2>

            <p>
              <strong>Current Stage:</strong> {opportunity.stage}
            </p>

            <p style={{ color: "#aaa", marginBottom: 0 }}>
              Changing the stage will also create an opportunity stage history record.
            </p>
          </div>

          <form onSubmit={handleMoveStage} style={cardStyle}>
            <label>
              New Stage
              <select
                value={selectedStage}
                onChange={(event) => {
                  setSelectedStage(event.target.value);
                  setConfirmed(false);
                }}
                style={inputStyle}
                disabled={saving}
              >
                {STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                marginTop: "16px",
                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={saving}
              />
              <span>
                I confirm I want to move this opportunity from "{opportunity.stage}" to "{selectedStage}".
              </span>
            </label>

            <button
              type="submit"
              disabled={!confirmed || saving}
              style={!confirmed || saving ? disabledButtonStyle : buttonStyle}
            >
              {saving ? "Moving Stage..." : "Move Stage"}
            </button>
          </form>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href={`/opportunities/${opportunityId}`}
              style={{ color: "#8ab4ff" }}
            >
              Open Opportunity
            </Link>
            <Link href="/assistant" style={{ color: "#8ab4ff" }}>
              Back to Assistant
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

