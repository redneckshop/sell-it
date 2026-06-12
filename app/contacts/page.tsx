import Link from "next/link";
import { supabase } from "../lib/supabase";

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

export default async function ContactsPage() {
  const { data, error } = await supabase
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
    .order("created_at", { ascending: false });

  const contacts: Contact[] = data ?? [];

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
          <h1>Contacts</h1>

          <p style={{ color: "#aaa" }}>
            People connected to this Sell It workspace.
          </p>
        </div>

        <Link
          href="/contacts/new"
          style={{
            backgroundColor: "white",
            color: "black",
            padding: "12px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Contact
        </Link>
      </div>

      {error && (
        <p style={{ color: "red" }}>Database error: {error.message}</p>
      )}

      {!error && contacts.length === 0 && <p>No contacts found.</p>}

      {contacts.map((contact) => (
        <Link
          key={contact.id}
          href={`/contacts/${contact.id}`}
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
          <h2 style={{ marginTop: 0 }}>
            {contact.first_name} {contact.last_name || ""}
          </h2>

          {contact.title && <p>Title: {contact.title}</p>}
          {contact.companies?.name && <p>Company: {contact.companies.name}</p>}
          {contact.email && <p>Email: {contact.email}</p>}
          {contact.phone && <p>Phone: {contact.phone}</p>}
        </Link>
      ))}
    </main>
  );
}