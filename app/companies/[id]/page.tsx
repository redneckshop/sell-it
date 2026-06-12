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

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
};

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
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

  const { data: contactRows, error: contactsError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, title")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const { data: taskRows, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const contacts: Contact[] = contactRows ?? [];
  const tasks: Task[] = taskRows ?? [];

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
    href="/companies"
    style={{
      color: "black",
      backgroundColor: "white",
      padding: "10px 14px",
      borderRadius: "6px",
      textDecoration: "none",
      fontWeight: "bold",
    }}
  >
    Back to Companies
  </Link>
</div>

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

          <section style={{ marginTop: "40px", maxWidth: "700px" }}>
            <h2>Related Contacts</h2>

            {contactsError && (
              <p style={{ color: "red" }}>
                Contacts error: {contactsError.message}
              </p>
            )}

            {!contactsError && contacts.length === 0 && (
              <p>No contacts linked to this company yet.</p>
            )}

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
                <h3 style={{ marginTop: 0 }}>
                  {contact.first_name} {contact.last_name || ""}
                </h3>

                {contact.title && <p>Title: {contact.title}</p>}
                {contact.email && <p>Email: {contact.email}</p>}
                {contact.phone && <p>Phone: {contact.phone}</p>}
              </Link>
            ))}
          </section>

          <section style={{ marginTop: "40px", maxWidth: "700px" }}>
            <h2>Related Tasks</h2>

            {tasksError && (
              <p style={{ color: "red" }}>
                Tasks error: {tasksError.message}
              </p>
            )}

            {!tasksError && tasks.length === 0 && (
              <p>No tasks linked to this company yet.</p>
            )}

            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
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
                <h3 style={{ marginTop: 0 }}>{task.title}</h3>
                <p>Status: {task.status}</p>
                <p>Priority: {task.priority}</p>
                {task.due_date && <p>Due: {task.due_date}</p>}
              </Link>
            ))}
          </section>
        </section>
      )}
    </main>
  );
}