import Link from "next/link";
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

function filterHref(overrides: Record<string, string>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `/companies?${query}` : "/companies";
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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Companies</h1>

          <p style={{ color: "#aaa" }}>
            Companies you are tracking for sales, outreach, and follow-up.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Home
          </Link>

          <Link
            href="/companies/new"
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Add Company
          </Link>
        </div>
      </div>

      <form
        action="/companies"
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
              Lead Temperature
            </span>
            <select
              name="lead_temperature"
              defaultValue={leadTemperature}
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

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Operating Region
            </span>
            <input
              name="region"
              defaultValue={params.region ?? ""}
              placeholder="Region..."
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
              Assets / Equipment
            </span>
            <input
              name="assets"
              defaultValue={params.assets ?? ""}
              placeholder="Truck, belly dump..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            />
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
            href="/companies"
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

      {!error && allCompanies.length === 0 && <p>No companies found.</p>}

      {!error && allCompanies.length > 0 && companies.length === 0 && (
        <p>No companies match the current filters.</p>
      )}

      {companies.map((company) => (
        <Link
          key={company.id}
          href={`/companies/${company.id}`}
          style={{
            display: "block",
            border: company.is_archived ? "1px solid #d6a400" : "1px solid #333",
            padding: "16px",
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: company.is_archived ? "#211c0d" : "#1a1a1a",
            color: "white",
            textDecoration: "none",
          }}
        >
          {company.is_archived && (
            <p
              style={{
                color: "#ffcc66",
                fontWeight: "bold",
                marginTop: 0,
              }}
            >
              Archived
            </p>
          )}

          <h2 style={{ marginTop: 0 }}>{company.name}</h2>

          {company.lead_temperature && (
            <p>Lead Temperature: {company.lead_temperature}</p>
          )}

          {company.website && <p>Website: {company.website}</p>}
          {company.phone && <p>Phone: {company.phone}</p>}
          {company.email && <p>Email: {company.email}</p>}

          {company.operating_regions && (
            <p>Operating Regions: {company.operating_regions}</p>
          )}

          {company.assets_equipment && (
            <p>Assets / Equipment: {company.assets_equipment}</p>
          )}

          {company.is_archived && (
            <div style={{ color: "#ffcc66" }}>
              <p>Archived: {formatDateTime(company.archived_at)}</p>
              {company.archive_reason && <p>Reason: {company.archive_reason}</p>}
            </div>
          )}
        </Link>
      ))}
    </main>
  );
}
