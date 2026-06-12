import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  created_at: string | null;
  companies: {
    id: string;
    name: string;
  } | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: contact, error } = await supabase
    .from("contacts")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      title,
      company_id,
      created_at,
      companies (
        id,
        name
      )
    `)
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
      <Link href="/contacts" style={{ color: "white" }}>
        ← Back to Contacts
      </Link>

      {error && (
        <p style={{ color: "red", marginTop: "32px" }}>
          Database error: {error.message}
        </p>
      )}

      {contact && (
        <section style={{ marginTop: "32px" }}>
          <h1>
            {contact.first_name} {contact.last_name || ""}
          </h1>

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
              <strong>Title:</strong> {contact.title || "Not provided"}
            </p>

            <p>
              <strong>Company:</strong>{" "}
              {contact.companies ? (
                <Link
                  href={`/companies/${contact.companies.id}`}
                  style={{ color: "white" }}
                >
                  {contact.companies.name}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>

            <p>
              <strong>Email:</strong> {contact.email || "Not provided"}
            </p>

            <p>
              <strong>Phone:</strong> {contact.phone || "Not provided"}
            </p>

            <p>
              <strong>Created:</strong>{" "}
              {contact.created_at
                ? new Date(contact.created_at).toLocaleString()
                : "Not available"}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}