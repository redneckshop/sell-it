import Link from "next/link";
import { supabase } from "../lib/supabase";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
};

export default async function CompaniesPage() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email, created_at")
    .order("created_at", { ascending: false });

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
        }}
      >
        <div>
          <h1>Companies</h1>

          <p style={{ color: "#aaa" }}>
            Companies connected to this Sell It workspace.
          </p>
        </div>

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

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && companies.length === 0 && <p>No companies found.</p>}

      {companies.map((company) => (
        <Link
          key={company.id}
          href={`/companies/${company.id}`}
          style={{
            display: "block",
            border: "1px solid #333",
            padding: "16px",
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: "#1a1a1a",
            color: "white",
            textDecoration: "none",
          }}
        >
          <h2 style={{ marginTop: 0 }}>{company.name}</h2>

          {company.website && <p>Website: {company.website}</p>}
          {company.phone && <p>Phone: {company.phone}</p>}
          {company.email && <p>Email: {company.email}</p>}
        </Link>
      ))}
    </main>
  );
}