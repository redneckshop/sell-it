"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase"; import { createNotification } from "../../../lib/notifications";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../../../lib/actingUser";
import { createWorkLogEntry } from "../../../lib/workLog";
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
};

type Opportunity = {
  id: string;
  workspace_id: string;
  name: string;
  company_id: string | null;
  primary_contact_id: string | null;
  opportunity_type: string;
  opportunity_type_other_description: string | null;
  stage: string;
  lead_temperature: string;
  estimated_driver_count: number | null;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  notes: string | null;
  updated_at: string | null;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const headerStyle: CSSProperties = {
  maxWidth: "980px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "860px",
  lineHeight: 1.65,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  maxWidth: "860px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontWeight: 800,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  marginBottom: "18px",
  maxWidth: "860px",
};

function stagesAreDifferent(oldStage: string, newStage: string) {
  return oldStage.trim() !== newStage.trim();
}

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();

  const opportunityId = params.id as string;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [workspaceId, setWorkspaceId] = useState("");
  const [originalStage, setOriginalStage] = useState("");

  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [primaryContactId, setPrimaryContactId] = useState("");
  const [opportunityType, setOpportunityType] = useState("Alpha Tester");
  const [opportunityTypeOtherDescription, setOpportunityTypeOtherDescription] =
    useState("");
  const [stage, setStage] = useState("New Lead");
  const [leadTemperature, setLeadTemperature] = useState("Warm");
  const [estimatedDriverCount, setEstimatedDriverCount] = useState("");
  const [estimatedMonthlyValue, setEstimatedMonthlyValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [notes, setNotes] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptionsAndOpportunity() {
      setLoading(true);
      setErrorMessage("");

      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (companyError) {
        setLoading(false);
        setErrorMessage(companyError.message);
        return;
      }

      setCompanies(companyRows ?? []);

      const { data: contactRows, error: contactError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, company_id")
        .order("first_name", { ascending: true });

      if (contactError) {
        setLoading(false);
        setErrorMessage(contactError.message);
        return;
      }

      setContacts(contactRows ?? []);

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, workspace_id, name, company_id, primary_contact_id, opportunity_type, opportunity_type_other_description, stage, lead_temperature, estimated_driver_count, estimated_monthly_value, expected_close_date, next_step, notes, updated_at"
        )
        .eq("id", opportunityId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const opportunity = data as Opportunity;

      setWorkspaceId(opportunity.workspace_id || "");
      setOriginalStage(opportunity.stage || "New Lead");

      setName(opportunity.name || "");
      setCompanyId(opportunity.company_id || "");
      setPrimaryContactId(opportunity.primary_contact_id || "");
      setOpportunityType(opportunity.opportunity_type || "Alpha Tester");
      setOpportunityTypeOtherDescription(
        opportunity.opportunity_type_other_description || ""
      );
      setStage(opportunity.stage || "New Lead");
      setLeadTemperature(opportunity.lead_temperature || "Warm");
      setEstimatedDriverCount(
        opportunity.estimated_driver_count !== null
          ? String(opportunity.estimated_driver_count)
          : ""
      );
      setEstimatedMonthlyValue(
        opportunity.estimated_monthly_value !== null
          ? String(opportunity.estimated_monthly_value)
          : ""
      );
      setExpectedCloseDate(opportunity.expected_close_date || "");
      setNextStep(opportunity.next_step || "");
      setNotes(opportunity.notes || "");
      setLastUpdated(opportunity.updated_at);
    }

    if (opportunityId) {
      loadOptionsAndOpportunity();
    }
  }, [opportunityId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const changedAt = new Date().toISOString();
    const actingUser = getCurrentActingUserSnapshot();
    const databaseSafeUserId = getDatabaseSafeUserId(actingUser);
    const shouldRecordStageHistory =
      workspaceId && stagesAreDifferent(originalStage, stage);

    const updateResult = await updateRecordWithConcurrencyGuard({
      tableName: "opportunities",
      recordId: opportunityId,
      loadedUpdatedAt: lastUpdated,
      entityLabel: name || "Opportunity",
      values: {
        name,
        company_id: companyId || null,
        primary_contact_id: primaryContactId || null,
        opportunity_type: opportunityType,
        opportunity_type_other_description:
          opportunityType === "Other"
            ? opportunityTypeOtherDescription || null
            : null,
        stage,
        lead_temperature: leadTemperature,
        estimated_driver_count: estimatedDriverCount
          ? Number(estimatedDriverCount)
          : null,
        estimated_monthly_value: estimatedMonthlyValue
          ? Number(estimatedMonthlyValue)
          : null,
        expected_close_date: expectedCloseDate || null,
        next_step: nextStep || null,
        notes: notes || null,
        updated_by: databaseSafeUserId,
        updated_at: changedAt,
      },
    });

    // Opportunity Edit Concurrency Protection V1
    if (!updateResult.ok) {
      setSaving(false);
      setErrorMessage(updateResult.errorMessage);
      return;
    }

    if (shouldRecordStageHistory) {
      const { error: historyError } = await supabase
        .from("opportunity_stage_history")
        .insert({
          workspace_id: workspaceId,
          opportunity_id: opportunityId,
          old_stage: originalStage || null,
          new_stage: stage,
          changed_by: databaseSafeUserId,
          changed_at: changedAt,
          notes: null,
        });

      if (historyError) {
        setSaving(false);
        setErrorMessage(
          `Opportunity saved, but stage history failed: ${historyError.message}`
        );
        return;
      }

      await createWorkLogEntry({
        actingUser,
        actionType: "opportunity_stage_change",
        entityType: "opportunity",
        entityId: opportunityId,
        entityLabel: name,
        summary: `${actingUser.displayName} moved opportunity "${name}" from "${originalStage}" to "${stage}".`,
        details: "Opportunity stage changed from the opportunity edit page.",
        metadata: {
          source: "Opportunity Edit Stage Work Log V1",
          previous_stage: originalStage || null,
          new_stage: stage,
          changed_at: changedAt,
          changed_by: databaseSafeUserId,
        },
      });
    }

    setSaving(false);

    router.push(`/opportunities/${opportunityId}`);
    router.refresh();
  }

  const filteredContacts = companyId
    ? contacts.filter(
        (contact) =>
          contact.company_id === companyId || contact.company_id === null
      )
    : contacts;

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href={`/opportunities/${opportunityId}`} style={secondaryButtonStyle}>
          Back to Opportunity
        </Link>

        <Link href="/opportunities" style={secondaryButtonStyle}>
          Back to Opportunities
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Opportunity Management</p>

        <h1 style={titleStyle}>Edit Opportunity</h1>

        <p style={mutedTextStyle}>
          Update this pipeline opportunity. Stage changes are still recorded in
          opportunity history when the stage changes.
        </p>
      </header>

      {loading && (
        <div style={formStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading opportunity...</p>
        </div>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {!loading && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Opportunity Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <div style={twoColumnGridStyle}>
            <label style={labelStyle}>
              Company
              <select
                value={companyId}
                onChange={(event) => {
                  setCompanyId(event.target.value);
                  setPrimaryContactId("");
                }}
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
              Primary Contact
              <select
                value={primaryContactId}
                onChange={(event) => setPrimaryContactId(event.target.value)}
                style={inputStyle}
              >
                <option value="">No primary contact selected</option>

                {filteredContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name || ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={twoColumnGridStyle}>
            <label style={labelStyle}>
              Opportunity Type
              <select
                value={opportunityType}
                onChange={(event) => {
                  setOpportunityType(event.target.value);

                  if (event.target.value !== "Other") {
                    setOpportunityTypeOtherDescription("");
                  }
                }}
                style={inputStyle}
              >
                <option value="Alpha Tester">Alpha Tester</option>
                <option value="Beta Tester">Beta Tester</option>
                <option value="Paid Customer">Paid Customer</option>
                <option value="Broker Adoption">Broker Adoption</option>
                <option value="Contractor Adoption">Contractor Adoption</option>
                <option value="Partnership">Partnership</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label style={labelStyle}>
              Stage
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                style={inputStyle}
              >
                <option value="New Lead">New Lead</option>
                <option value="Contact Attempted">Contact Attempted</option>
                <option value="Contact Made">Contact Made</option>
                <option value="Discovery">Discovery</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Demo Scheduled">Demo Scheduled</option>
                <option value="Alpha Candidate">Alpha Candidate</option>
                <option value="Alpha Accepted">Alpha Accepted</option>
                <option value="Active Alpha">Active Alpha</option>
                <option value="Beta Candidate">Beta Candidate</option>
                <option value="Active Beta">Active Beta</option>
                <option value="Customer">Customer</option>
                <option value="Lost">Lost</option>
                <option value="Paused">Paused</option>
              </select>
            </label>
          </div>

          {opportunityType === "Other" && (
            <label style={labelStyle}>
              Other Type Description
              <textarea
                value={opportunityTypeOtherDescription}
                onChange={(event) =>
                  setOpportunityTypeOtherDescription(event.target.value)
                }
                rows={4}
                placeholder="Describe the opportunity type..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "110px",
                }}
              />
            </label>
          )}

          <div style={twoColumnGridStyle}>
            <label style={labelStyle}>
              Lead Temperature
              <select
                value={leadTemperature}
                onChange={(event) => setLeadTemperature(event.target.value)}
                style={inputStyle}
              >
                <option value="Cold">Cold</option>
                <option value="Warm">Warm</option>
                <option value="Hot">Hot</option>
                <option value="Active">Active</option>
                <option value="Dead">Dead</option>
              </select>
            </label>

            <label style={labelStyle}>
              Estimated Driver Count
              <input
                type="number"
                min="0"
                value={estimatedDriverCount}
                onChange={(event) => setEstimatedDriverCount(event.target.value)}
                placeholder="Example: 25"
                style={inputStyle}
              />
            </label>
          </div>

          <div style={twoColumnGridStyle}>
            <label style={labelStyle}>
              Estimated Monthly Value
              <input
                type="number"
                min="0"
                step="0.01"
                value={estimatedMonthlyValue}
                onChange={(event) => setEstimatedMonthlyValue(event.target.value)}
                placeholder="Example: 7500"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Expected Close Date
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(event) => setExpectedCloseDate(event.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Next Step
            <textarea
              value={nextStep}
              onChange={(event) => setNextStep(event.target.value)}
              rows={4}
              placeholder="What should happen next?"
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "110px",
              }}
            />
          </label>

          <label style={labelStyle}>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Internal notes..."
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "150px",
              }}
            />
          </label>

          <p style={{ color: "#94a3b8", margin: 0 }}>
            Last Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : "Not available"}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={saving}
              style={saving ? disabledButtonStyle : primaryButtonStyle}
            >
              {saving ? "Saving..." : "Save Opportunity"}
            </button>

            <Link
              href={`/opportunities/${opportunityId}`}
              style={secondaryButtonStyle}
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}









