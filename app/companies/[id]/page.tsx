import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email, created_at")
    .eq("id", id)
    .single();

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
      <Link href="/companies" style={{ color: "white" }}>
        ← Back to Companies
      </Link>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {company && (
        <section style={{ marginTop: "32px" }}>
          <h1>{company.name}</h1>

          <div
            style={{
              border: "1px solid #333",
              padding: "20px",
              borderRadius: "8px",
              backgroundColor: "#1a1a1a",
              maxWidth: "600px",
            }}
          >
            <p>
              <strong>Website:</strong> {company.website || "Not provided"}
            </p>

            <p>
              <strong>Phone:</strong> {company.phone || "Not provided"}
            </p>

            <p>
              <strong>Email:</strong> {company.email || "Not provided"}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {company.created_at
                ? new Date(company.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}