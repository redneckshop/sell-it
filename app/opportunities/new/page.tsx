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

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  company_id: string | null;
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

export default function NewOpportunityPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [primaryContactId, setPrimaryContactId] = useState("");
  const [opportunityType, setOpportunityType] = useState("Alpha Tester");
  const [stage, setStage] = useState("New Lead");
  const [leadTemperature, setLeadTemperature] = useState("Warm");
  const [estimatedDriverCount, setEstimatedDriverCount] = useState("");
  const [estimatedMonthlyValue, setEstimatedMonthlyValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOptions() {
      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (companyError) {
        setErrorMessage(companyError.message);
        return;
      }

      setCompanies(companyRows ?? []);

      const { data: contactRows, error: contactError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, company_id")
        .order("first_name", { ascending: true });

      if (contactError) {
        setErrorMessage(contactError.message);
        return;
      }

      setContacts(contactRows ?? []);
    }

    loadOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("opportunities").insert({
      workspace_id: WORKSPACE_ID,
      name,
      company_id: companyId,
      primary_contact_id: primaryContactId || null,
      opportunity_type: opportunityType,
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
      created_by: USER_ID,
      updated_by: USER_ID,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/opportunities");
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
          href="/opportunities"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Opportunities
        </Link>
      </div>

      <h1>Add Opportunity</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Create a sales pipeline opportunity for Sell It or Knotty Logistics.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "700px",
        }}
      >
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Example: Test Company Alpha Trial"
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
            required
            style={inputStyle}
          >
            <option value="">Select a company</option>

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
            min="0"
            value={estimatedDriverCount}
            onChange={(event) => setEstimatedDriverCount(event.target.value)}
            placeholder="Example: 10"
            style={inputStyle}
          />
        </label>

        <label>
          Estimated Monthly Value
          <input
            type="number"
            min="0"
            step="0.01"
            value={estimatedMonthlyValue}
            onChange={(event) => setEstimatedMonthlyValue(event.target.value)}
            placeholder="Example: 1500"
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
            rows={3}
            placeholder="Example: Schedule intro call"
            style={inputStyle}
          />
        </label>

        <label>
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
            placeholder="Pipeline notes..."
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
          {saving ? "Saving..." : "Save Opportunity"}
        </button>
      </form>
    </main>
  );
}