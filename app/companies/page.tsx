import Link from "next/link";
import { supabase } from "../lib/supabase";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archive_reason: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    archived?: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const showArchived = resolvedSearchParams?.archived === "true";

  let query = supabase
    .from("companies")
    .select(
      "id, name, website, phone, email, created_at, is_archived, archived_at, archive_reason"
    );

  if (!showArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  const companies: Company[] = data ?? [];

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
            Companies connected to this Sell It workspace.
          </p>

          <p style={{ color: "#aaa", marginTop: "8px" }}>
            {showArchived
              ? "Showing active and archived companies."
              : "Archived companies are hidden by default."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href={showArchived ? "/companies" : "/companies?archived=true"}
            style={{
              backgroundColor: showArchived ? "#dddddd" : "#f5d76e",
              color: "black",
              padding: "12px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
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

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && companies.length === 0 && (
        <p>{showArchived ? "No companies found." : "No active companies found."}</p>
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

          <h2 style={{ marginTop: 0 }}>{company.name}</h2>

          {company.website && <p>Website: {company.website}</p>}
          {company.phone && <p>Phone: {company.phone}</p>}
          {company.email && <p>Email: {company.email}</p>}

          {company.is_archived && (
            <>
              <p>Archived: {formatDateTime(company.archived_at)}</p>
              {company.archive_reason && <p>Reason: {company.archive_reason}</p>}
            </>
          )}
        </Link>
      ))}
    </main>
  );
}

