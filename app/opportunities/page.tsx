import Link from "next/link";
import { supabase } from "../lib/supabase";

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string;
  stage: string;
  lead_temperature: string;
  estimated_driver_count: number | null;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  company_id: string;
  primary_contact_id: string | null;
  created_at: string | null;
  companies: {
    id: string;
    name: string;
  } | null;
  primary_contact: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
};

export default async function OpportunitiesPage() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(`
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies (
        id,
        name
      ),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  const opportunities: Opportunity[] = data ?? [];

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
          href="/opportunities/new"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Opportunity
        </Link>
      </div>

      <h1>Opportunities</h1>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        Sales pipeline for Sell It and Knotty Logistics.
      </p>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && opportunities.length === 0 && (
        <p>No opportunities found.</p>
      )}

      {opportunities.map((opportunity) => (
        <Link
          key={opportunity.id}
          href={`/opportunities/${opportunity.id}`}
          style={{
            display: "block",
            border: "1px solid #333",
            padding: "18px",
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: "#1a1a1a",
            color: "white",
            textDecoration: "none",
            maxWidth: "900px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{opportunity.name}</h2>

          <p>Company: {opportunity.companies?.name || "Not linked"}</p>

          {opportunity.primary_contact && (
            <p>
              Primary Contact: {opportunity.primary_contact.first_name}{" "}
              {opportunity.primary_contact.last_name || ""}
            </p>
          )}

          <p>Type: {opportunity.opportunity_type}</p>
          <p>Stage: {opportunity.stage}</p>
          <p>Lead Temperature: {opportunity.lead_temperature}</p>

          {opportunity.estimated_driver_count !== null && (
            <p>Estimated Driver Count: {opportunity.estimated_driver_count}</p>
          )}

          {opportunity.estimated_monthly_value !== null && (
            <p>
              Estimated Monthly Value: $
              {Number(opportunity.estimated_monthly_value).toLocaleString()}
            </p>
          )}

          {opportunity.expected_close_date && (
            <p>Expected Close Date: {opportunity.expected_close_date}</p>
          )}

          {opportunity.next_step && <p>Next Step: {opportunity.next_step}</p>}
        </Link>
      ))}
    </main>
  );
}