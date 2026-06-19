import Link from "next/link";
import type { CSSProperties } from "react";
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
    new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))
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

function initialsFromName(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function contactName(contact: RelatedContact | null) {
  if (!contact) return "Not linked";

  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "38px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };
}

function panelStyle(): CSSProperties {
  return {
    border: "1px solid #2f2f2f",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
    padding: "16px",
    borderRadius: "14px",
    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
  };
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #3d3d3d",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    display: "block",
    marginBottom: "7px",
    color: "#e5e5e5",
    fontSize: "13px",
    fontWeight: 800,
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    backgroundColor: "#7c3aed",
    color: "white",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #8b5cf6",
    boxShadow: "0 12px 24px rgba(124,58,237,0.24)",
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    color: "white",
    border: "1px solid #3d3d3d",
    backgroundColor: "#151515",
    padding: "0 16px",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 900,
  };
}

function badgeStyle(value: string | null): CSSProperties {
  const normalized = (value ?? "").toLowerCase();

  const backgroundColor =
    normalized === "hot"
      ? "rgba(239, 68, 68, 0.22)"
      : normalized === "warm"
        ? "rgba(34, 197, 94, 0.22)"
        : normalized === "cold"
          ? "rgba(59, 130, 246, 0.22)"
          : normalized.includes("customer") || normalized.includes("active")
            ? "rgba(34, 197, 94, 0.18)"
            : normalized.includes("lost") || normalized.includes("dead")
              ? "rgba(239, 68, 68, 0.18)"
              : normalized.includes("demo") || normalized.includes("scheduled")
                ? "rgba(124, 58, 237, 0.22)"
                : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized === "hot"
      ? "#fca5a5"
      : normalized === "warm"
        ? "#86efac"
        : normalized === "cold"
          ? "#93c5fd"
          : normalized.includes("customer") || normalized.includes("active")
            ? "#86efac"
            : normalized.includes("lost") || normalized.includes("dead")
              ? "#fca5a5"
              : normalized.includes("demo") || normalized.includes("scheduled")
                ? "#c4b5fd"
                : "#d1d5db";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function archivedBadgeStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor: "rgba(245, 158, 11, 0.22)",
    color: "#fcd34d",
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
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
    <main style={pageStyle()}>
      <section style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "22px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                ...mutedTextStyle(),
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                fontSize: "12px",
                fontWeight: 900,
                margin: "0 0 8px",
              }}
            >
              Sales
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>
              Opportunities
            </h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Sales pipeline for Sell It and Knotty Logistics.
            </p>
          </div>

          <Link href="/opportunities/new" style={primaryButtonStyle()}>
            + Add Opportunity
          </Link>
        </div>

        <form
          action="/opportunities"
          style={{ ...panelStyle(), marginBottom: "18px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Search</span>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search opportunities..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Stage</span>
              <select name="stage" defaultValue={stageFilter} style={inputStyle()}>
                <option value="">All</option>
                {stages.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Lead Temperature</span>
              <select
                name="lead_temperature"
                defaultValue={leadTemperatureFilter}
                style={inputStyle()}
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
              <span style={fieldLabelStyle()}>Opportunity Type</span>
              <select
                name="opportunity_type"
                defaultValue={opportunityTypeFilter}
                style={inputStyle()}
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
              <span style={fieldLabelStyle()}>Archived</span>
              <select
                name="archived"
                defaultValue={archivedFilter}
                style={inputStyle()}
              >
                <option value="active">Active only</option>
                <option value="archived">Archived only</option>
                <option value="all">All records</option>
              </select>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
            }}
          >
            <button
              type="submit"
              style={{
                ...primaryButtonStyle(),
                cursor: "pointer",
              }}
            >
              Apply Filters
            </button>

            <a href="/opportunities" style={secondaryButtonStyle()}>
              Clear Filters
            </a>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <p style={{ ...mutedTextStyle(), margin: 0 }}>{resultCountLabel}</p>

          <p style={{ ...mutedTextStyle(), margin: 0, fontSize: "13px" }}>
            Sorted by newest first
          </p>
        </div>

        {error && (
          <p style={{ color: "red" }}>Database error: {error.message}</p>
        )}

        {!error && allOpportunities.length === 0 && (
          <p>No opportunities found.</p>
        )}

        {!error && allOpportunities.length > 0 && opportunities.length === 0 && (
          <p>No opportunities match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {opportunities.map((opportunity) => {
            const company = singleRelation(opportunity.companies);
            const primaryContact = singleRelation(opportunity.primary_contact);

            return (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1.25fr) minmax(190px, 0.85fr) 26px",
                  gap: "14px",
                  alignItems: "center",
                  border: opportunity.is_archived
                    ? "1px solid rgba(245, 158, 11, 0.65)"
                    : "1px solid #2f2f2f",
                  padding: "14px",
                  borderRadius: "14px",
                  background: opportunity.is_archived
                    ? "linear-gradient(180deg, rgba(49,39,14,0.96), rgba(27,24,14,0.96))"
                    : "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(22,22,22,0.96))",
                  color: "white",
                  textDecoration: "none",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#2b2b2b",
                    color: "white",
                    fontWeight: 900,
                    border: "1px solid #3d3d3d",
                  }}
                >
                  {initialsFromName(opportunity.name)}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "5px",
                    }}
                  >
                    <strong>{opportunity.name}</strong>

                    <span style={badgeStyle(opportunity.stage)}>
                      {opportunity.stage}
                    </span>

                    <span style={badgeStyle(opportunity.lead_temperature)}>
                      {opportunity.lead_temperature}
                    </span>

                    {opportunity.is_archived && (
                      <span style={archivedBadgeStyle()}>Archived</span>
                    )}
                  </div>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Company: {company?.name || "Not linked"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    Type: {opportunity.opportunity_type}
                  </p>

                  {opportunity.next_step && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      Next Step: {opportunity.next_step}
                    </p>
                  )}

                  {opportunity.notes && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      Notes:{" "}
                      {opportunity.notes.length > 140
                        ? `${opportunity.notes.slice(0, 140)}...`
                        : opportunity.notes}
                    </p>
                  )}

                  {opportunity.is_archived && (
                    <p style={{ color: "#ffcc66", margin: "8px 0 0" }}>
                      Archived: {formatDateTime(opportunity.archived_at)}
                      {opportunity.archive_reason
                        ? ` — Reason: ${opportunity.archive_reason}`
                        : ""}
                    </p>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Value: {formatMoney(opportunity.estimated_monthly_value)}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Drivers:{" "}
                    {opportunity.estimated_driver_count !== null
                      ? opportunity.estimated_driver_count
                      : "Not provided"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 6px" }}>
                    Contact: {contactName(primaryContact)}
                  </p>

                  {opportunity.expected_close_date && (
                    <p style={{ ...mutedTextStyle(), margin: 0 }}>
                      Expected Close: {opportunity.expected_close_date}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    color: "#a7a7a7",
                    fontSize: "26px",
                    textAlign: "right",
                  }}
                >
                  ›
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
