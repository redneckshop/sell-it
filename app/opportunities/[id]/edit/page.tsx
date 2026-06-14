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
};

type Opportunity = {
  id: string;
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

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();

  const opportunityId = params.id as string;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          "id, name, company_id, primary_contact_id, opportunity_type, opportunity_type_other_description, stage, lead_temperature, estimated_driver_count, estimated_monthly_value, expected_close_date, next_step, notes, updated_at"
        )
        .eq("id", opportunityId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const opportunity = data as Opportunity;

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

    const { error } = await supabase
      .from("opportunities")
      .update({
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
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunityId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/opportunities/${opportunityId}`);
    router.refresh();
  }

  const filteredContacts = companyId
    ? contacts.filter(
        (contact) => contact.company_id === companyId || contact.company_id === null
      )
    : contacts;

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
          href={`/opportunities/${opportunityId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Opportunity
        </Link>
      </div>

      <h1>Edit Opportunity</h1>

      {loading && <p>Loading opportunity...</p>}

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
            Opportunity Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
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

          <label>
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

          <label>
            Opportunity Type
            <select
              value={opportunityType}
              onChange={(event) => setOpportunityType(event.target.value)}
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

          {opportunityType === "Other" && (
            <label>
              Other Type Description
              <textarea
                value={opportunityTypeOtherDescription}
                onChange={(event) =>
                  setOpportunityTypeOtherDescription(event.target.value)
                }
                rows={4}
                placeholder="Describe the opportunity type..."
                style={inputStyle}
              />
            </label>
          )}

          <label>
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

          <label>
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

          <label>
            Estimated Driver Count
            <input
              type="number"
              value={estimatedDriverCount}
              onChange={(event) => setEstimatedDriverCount(event.target.value)}
              placeholder="Example: 25"
              style={inputStyle}
            />
          </label>

          <label>
            Estimated Monthly Value
            <input
              type="number"
              value={estimatedMonthlyValue}
              onChange={(event) => setEstimatedMonthlyValue(event.target.value)}
              placeholder="Example: 7500"
              style={inputStyle}
            />
          </label>

          <label>
            Expected Close Date
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(event) => setExpectedCloseDate(event.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            Next Step
            <textarea
              value={nextStep}
              onChange={(event) => setNextStep(event.target.value)}
              rows={4}
              placeholder="What should happen next?"
              style={inputStyle}
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Internal notes..."
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
            {saving ? "Saving..." : "Save Opportunity"}
          </button>
        </form>
      )}
    </main>
  );
}