import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  operating_regions: string | null;
  assets_equipment: string | null;
  lead_temperature: string | null;
  created_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archive_reason: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    lead_temperature?: string;
    archived?: string;
    region?: string;
    assets?: string;
  }>;
};

function textValue(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function includesText(value: string | null | undefined, search: string) {
  if (!search) return true;

  return textValue(value).includes(search);
}

function matchesCompanySearch(company: Company, search: string) {
  if (!search) return true;

  const searchable = [
    company.name,
    company.website,
    company.phone,
    company.email,
    company.operating_regions,
    company.assets_equipment,
  ]
    .map((value) => textValue(value))
    .join(" ");

  return searchable.includes(search);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
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

function pageStyle(): CSSProperties {
  return {
    minHeight: "calc(100vh - 64px)",
    backgroundColor: "#101010",
    color: "white",
    padding: "clamp(12px, 4vw, 38px)",
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
    alignItems: "start",
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
    alignItems: "start",
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

function temperatureBadgeStyle(value: string | null): CSSProperties {
  const normalized = (value ?? "").toLowerCase();

  const backgroundColor =
    normalized === "hot"
      ? "rgba(239, 68, 68, 0.22)"
      : normalized === "warm"
        ? "rgba(34, 197, 94, 0.22)"
        : normalized === "cold"
          ? "rgba(59, 130, 246, 0.22)"
          : "rgba(156, 163, 175, 0.18)";

  const color =
    normalized === "hot"
      ? "#fca5a5"
      : normalized === "warm"
        ? "#86efac"
        : normalized === "cold"
          ? "#93c5fd"
          : "#d1d5db";

  return {
    display: "inline-flex",
    alignItems: "start",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const leadTemperature = (params.lead_temperature ?? "").trim();
  const archivedFilter = (params.archived ?? "active").trim();
  const regionSearch = (params.region ?? "").trim().toLowerCase();
  const assetsSearch = (params.assets ?? "").trim().toLowerCase();

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, website, phone, email, operating_regions, assets_equipment, lead_temperature, created_at, is_archived, archived_at, archive_reason"
    )
    .order("created_at", { ascending: false });

  const companies = ((data ?? []) as Company[]).filter((company) => {
    const matchesArchive =
      archivedFilter === "all"
        ? true
        : archivedFilter === "archived"
          ? company.is_archived
          : !company.is_archived;

    return (
      matchesArchive &&
      matchesCompanySearch(company, search) &&
      (!leadTemperature || company.lead_temperature === leadTemperature) &&
      includesText(company.operating_regions, regionSearch) &&
      includesText(company.assets_equipment, assetsSearch)
    );
  });

  const allCompanies = (data ?? []) as Company[];
  const leadTemperatures = uniqueValues(
    allCompanies.map((company) => company.lead_temperature)
  );

  const hasFilters =
    Boolean(search) ||
    Boolean(leadTemperature) ||
    archivedFilter !== "active" ||
    Boolean(regionSearch) ||
    Boolean(assetsSearch);

  const resultCountLabel =
    archivedFilter === "all"
      ? `Showing ${companies.length} companies out of ${allCompanies.length} total companies${
          hasFilters ? " with current filters" : ""
        }`
      : archivedFilter === "archived"
        ? `Showing ${companies.length} archived companies out of ${allCompanies.length} total companies${
            hasFilters ? " with current filters" : ""
          }`
        : `Showing ${companies.length} active companies out of ${allCompanies.length} total companies${
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

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Companies</h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              Companies you are tracking for sales, outreach, and follow-up.
            </p>
          </div>

          <Link href="/companies/new" style={primaryButtonStyle()}>
            + Add Company
          </Link>
        </div>

        <form action="/companies" style={{ ...panelStyle(), marginBottom: "18px" }}>
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
                placeholder="Search companies..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Lead Temperature</span>
              <select
                name="lead_temperature"
                defaultValue={leadTemperature}
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
              <span style={fieldLabelStyle()}>Archived</span>
              <select name="archived" defaultValue={archivedFilter} style={inputStyle()}>
                <option value="active">Active only</option>
                <option value="archived">Archived only</option>
                <option value="all">All records</option>
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Operating Region</span>
              <input
                name="region"
                defaultValue={params.region ?? ""}
                placeholder="Region..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Assets / Equipment</span>
              <input
                name="assets"
                defaultValue={params.assets ?? ""}
                placeholder="Truck, belly dump..."
                style={inputStyle()}
              />
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

            <a href="/companies" style={secondaryButtonStyle()}>
              Clear Filters
            </a>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
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

        {!error && allCompanies.length === 0 && <p>No companies found.</p>}

        {!error && allCompanies.length > 0 && companies.length === 0 && (
          <p>No companies match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "48px minmax(0, 1fr) 26px",
                gap: "14px",
                alignItems: "start",
                border: company.is_archived
                  ? "1px solid rgba(245, 158, 11, 0.65)"
                  : "1px solid #2f2f2f",
                padding: "14px",
                borderRadius: "14px",
                background: company.is_archived
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
                  alignItems: "start",
                  justifyContent: "center",
                  backgroundColor: "#2b2b2b",
                  color: "white",
                  fontWeight: 900,
                  border: "1px solid #3d3d3d",
                }}
              >
                {initialsFromName(company.name)}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "start",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "5px",
                  }}
                >
                  <strong>{company.name}</strong>

                  {company.lead_temperature && (
                    <span style={temperatureBadgeStyle(company.lead_temperature)}>
                      {company.lead_temperature}
                    </span>
                  )}

                  {company.phone && (
                  <p style={{ ...mutedTextStyle(), margin: "6px 0 0", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Phone: {company.phone}
                  </p>
                )}

                {company.email && (
                  <p style={{ ...mutedTextStyle(), margin: "4px 0 0", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Email: {company.email}
                  </p>
                )}

                {company.website && (
                  <p style={{ ...mutedTextStyle(), margin: "4px 0 0", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Website: {company.website}
                  </p>
                )}

                {company.is_archived && (
                    <span style={temperatureBadgeStyle("archived")}>Archived</span>
                  )}
                </div>

                <p
                  style={{
                    ...mutedTextStyle(),
                    margin: "0 0 4px",
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}
                >
                  {company.operating_regions
                    ? `Operating Region: ${company.operating_regions}`
                    : "Operating Region: Not listed"}
                </p>

                <p
                  style={{
                    ...mutedTextStyle(),
                    margin: 0,
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}
                >
                  {company.assets_equipment
                    ? `Assets / Equipment: ${company.assets_equipment}`
                    : "Assets / Equipment: Not listed"}
                </p>

                {company.phone && (
                  <p style={{ ...mutedTextStyle(), margin: "6px 0 0", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Phone: {company.phone}
                  </p>
                )}

                {company.email && (
                  <p style={{ ...mutedTextStyle(), margin: "4px 0 0", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Email: {company.email}
                  </p>
                )}

                {company.website && (
                  <p style={{ ...mutedTextStyle(), margin: "4px 0 0", lineHeight: 1.4, wordBreak: "break-word" }}>
                    Website: {company.website}
                  </p>
                )}

                {company.is_archived && (
                  <p style={{ color: "#ffcc66", margin: "8px 0 0" }}>
                    Archived: {formatDateTime(company.archived_at)}
                    {company.archive_reason
                      ? ` — Reason: ${company.archive_reason}`
                      : ""}
                  </p>
                )}
              </div>

              <div style={{ display: "none" }} />

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
          ))}
        </div>
      </section>
    </main>
  );
}


