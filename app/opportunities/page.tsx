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
  notes: string | null;
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
    q?: string;
    stage?: string;
    lead_temperature?: string;
    opportunity_type?: string;
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

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function matchesOpportunitySearch(opportunity: Opportunity, search: string) {
  if (!search) return true;

  const searchable = [
    opportunity.name,
    opportunity.stage,
    opportunity.opportunity_type,
    opportunity.next_step,
    opportunity.notes,
  ]
    .map((value) => textValue(value))
    .join(" ");

  return searchable.includes(search);
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
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
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const stageFilter = (params.stage ?? "").trim();
  const leadTemperatureFilter = (params.lead_temperature ?? "").trim();
  const opportunityTypeFilter = (params.opportunity_type ?? "").trim();
  const archivedFilter = (params.archived ?? "active").trim();

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
      notes,
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
    `)
    .order("created_at", { ascending: false });

  const allOpportunities = (data ?? []) as unknown as Opportunity[];

  const opportunities = allOpportunities.filter((opportunity) => {
    const matchesArchive =
      archivedFilter === "all"
        ? true
        : archivedFilter === "archived"
          ? opportunity.is_archived
          : !opportunity.is_archived;

    return (
      matchesArchive &&
      matchesOpportunitySearch(opportunity, search) &&
      (!stageFilter || opportunity.stage === stageFilter) &&
      (!leadTemperatureFilter ||
        opportunity.lead_temperature === leadTemperatureFilter) &&
      (!opportunityTypeFilter ||
        opportunity.opportunity_type === opportunityTypeFilter)
    );
  });

  const stages = uniqueValues(
    allOpportunities.map((opportunity) => opportunity.stage)
  );

  const leadTemperatures = uniqueValues(
    allOpportunities.map((opportunity) => opportunity.lead_temperature)
  );

  const opportunityTypes = uniqueValues(
    allOpportunities.map((opportunity) => opportunity.opportunity_type)
  );

  const hasFilters =
    Boolean(search) ||
    Boolean(stageFilter) ||
    Boolean(leadTemperatureFilter) ||
    Boolean(opportunityTypeFilter) ||
    archivedFilter !== "active";

  const resultCountLabel =
    archivedFilter === "all"
      ? `Showing ${opportunities.length} opportunities out of ${allOpportunities.length} total opportunities${
          hasFilters ? " with current filters" : ""
        }`
      : archivedFilter === "archived"
        ? `Showing ${opportunities.length} archived opportunities out of ${allOpportunities.length} total opportunities${
            hasFilters ? " with current filters" : ""
          }`
        : `Showing ${opportunities.length} active opportunities out of ${allOpportunities.length} total opportunities${
            hasFilters ? " with current filters" : ""
          }`;

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

      <p style={{ color: "#aaa", marginBottom: "24px" }}>
        Sales pipeline for Sell It and Knotty Logistics.
      </p>

      <form
        action="/opportunities"
        style={{
          border: "1px solid #333",
          backgroundColor: "#181818",
          padding: "16px",
          borderRadius: "10px",
          marginBottom: "18px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Search
            </span>
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Keyword"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Stage
            </span>
            <select
              name="stage"
              defaultValue={stageFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {stages.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Lead Temperature
            </span>
            <select
              name="lead_temperature"
              defaultValue={leadTemperatureFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {leadTemperatures.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Opportunity Type
            </span>
            <select
              name="opportunity_type"
              defaultValue={opportunityTypeFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {opportunityTypes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Archived
            </span>
            <select
              name="archived"
              defaultValue={archivedFilter}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
              <option value="all">All records</option>
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#f5d76e",
              color: "black",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>

          <a
            href="/opportunities"
            style={{
              color: "white",
              border: "1px solid #555",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Clear Filters
          </a>
        </div>
      </form>

      <p style={{ color: "#aaa", marginBottom: "18px" }}>
        {resultCountLabel}
      </p>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && allOpportunities.length === 0 && <p>No opportunities found.</p>}

      {!error && allOpportunities.length > 0 && opportunities.length === 0 && (
        <p>No opportunities match the current filters.</p>
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

            {opportunity.notes && (
              <p style={{ color: "#aaa" }}>
                Notes:{" "}
                {opportunity.notes.length > 180
                  ? `${opportunity.notes.slice(0, 180)}...`
                  : opportunity.notes}
              </p>
            )}

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
