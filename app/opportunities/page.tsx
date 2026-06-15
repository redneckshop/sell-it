import Link from "next/link";
import { supabase } from "../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

type RelatedCompany = {
  id: string;
  name: string;
};

type RelatedContact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

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
  is_archived: boolean;
  archived_at: string | null;
  archive_reason: string | null;
  companies: SupabaseRelation<RelatedCompany>;
  primary_contact: SupabaseRelation<RelatedContact>;
};

type PageProps = {
  searchParams?: Promise<{
    archived?: string;
  }>;
};

function singleRelation<T>(value: SupabaseRelation<T> | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "Not provided";
  return `$${Number(value).toLocaleString()}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const showArchived = resolvedSearchParams?.archived === "true";

  let query = supabase
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
      is_archived,
      archived_at,
      archive_reason,
      companies (
        id,
        name
      ),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `);

  if (!showArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  const opportunities = (data ?? []) as unknown as Opportunity[];

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
          href={showArchived ? "/opportunities" : "/opportunities?archived=true"}
          style={{
            color: "black",
            backgroundColor: showArchived ? "#dddddd" : "#f5d76e",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
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

      <p style={{ color: "#aaa", marginBottom: "8px" }}>
        Sales pipeline for Sell It and Knotty Logistics.
      </p>

      <p style={{ color: "#aaa", marginBottom: "32px" }}>
        {showArchived
          ? "Showing active and archived opportunities."
          : "Archived opportunities are hidden by default."}
      </p>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && opportunities.length === 0 && (
        <p>
          {showArchived
            ? "No opportunities found."
            : "No active opportunities found."}
        </p>
      )}

      {opportunities.map((opportunity) => {
        const company = singleRelation(opportunity.companies);
        const primaryContact = singleRelation(opportunity.primary_contact);

        return (
          <Link
            key={opportunity.id}
            href={`/opportunities/${opportunity.id}`}
            style={{
              display: "block",
              border: opportunity.is_archived
                ? "1px solid #d6a400"
                : "1px solid #333",
              padding: "18px",
              marginBottom: "12px",
              borderRadius: "8px",
              backgroundColor: opportunity.is_archived ? "#211c0d" : "#1a1a1a",
              color: "white",
              textDecoration: "none",
              maxWidth: "900px",
            }}
          >
            {opportunity.is_archived && (
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "#f5d76e",
                  color: "black",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ARCHIVED
              </div>
            )}

            <h2 style={{ marginTop: 0 }}>{opportunity.name}</h2>

            <p>Company: {company?.name || "Not linked"}</p>

            {primaryContact && (
              <p>
                Primary Contact: {primaryContact.first_name}{" "}
                {primaryContact.last_name || ""}
              </p>
            )}

            <p>Type: {opportunity.opportunity_type}</p>
            <p>Stage: {opportunity.stage}</p>
            <p>Lead Temperature: {opportunity.lead_temperature}</p>

            <p>
              Estimated Driver Count:{" "}
              {opportunity.estimated_driver_count !== null
                ? opportunity.estimated_driver_count
                : "Not provided"}
            </p>

            <p>
              Estimated Monthly Value:{" "}
              {formatMoney(opportunity.estimated_monthly_value)}
            </p>

            {opportunity.expected_close_date && (
              <p>Expected Close Date: {opportunity.expected_close_date}</p>
            )}

            {opportunity.next_step && <p>Next Step: {opportunity.next_step}</p>}

            {opportunity.is_archived && (
              <>
                <p>Archived: {formatDateTime(opportunity.archived_at)}</p>
                {opportunity.archive_reason && (
                  <p>Reason: {opportunity.archive_reason}</p>
                )}
              </>
            )}
          </Link>
        );
      })}
    </main>
  );
}

