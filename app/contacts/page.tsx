import Link from "next/link";
import { supabase } from "../lib/supabase";

type SupabaseRelation<T> = T | T[] | null;

type RelatedCompany = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  company_id: string | null;
  created_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archive_reason: string | null;
  companies: SupabaseRelation<RelatedCompany>;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    company_id?: string;
    title?: string;
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

function includesText(value: string | null | undefined, search: string) {
  if (!search) return true;

  return textValue(value).includes(search);
}

function fullName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

function matchesContactSearch(contact: Contact, search: string) {
  if (!search) return true;

  const searchable = [
    contact.first_name,
    contact.last_name,
    contact.email,
    contact.phone,
    contact.title,
    contact.notes,
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

function uniqueCompanies(contacts: Contact[]) {
  const companyMap = new Map<string, string>();

  for (const contact of contacts) {
    const company = singleRelation(contact.companies);

    if (company?.id && company.name) {
      companyMap.set(company.id, company.name);
    }
  }

  return Array.from(companyMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};

  const search = (params.q ?? "").trim().toLowerCase();
  const companyId = (params.company_id ?? "").trim();
  const titleSearch = (params.title ?? "").trim().toLowerCase();
  const archivedFilter = (params.archived ?? "active").trim();

  const { data, error } = await supabase
    .from("contacts")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      title,
      notes,
      company_id,
      created_at,
      is_archived,
      archived_at,
      archive_reason,
      companies (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  const allContacts = (data ?? []) as unknown as Contact[];

  const contacts = allContacts.filter((contact) => {
    const matchesArchive =
      archivedFilter === "all"
        ? true
        : archivedFilter === "archived"
          ? contact.is_archived
          : !contact.is_archived;

    return (
      matchesArchive &&
      matchesContactSearch(contact, search) &&
      (!companyId || contact.company_id === companyId) &&
      includesText(contact.title, titleSearch)
    );
  });

  const companies = uniqueCompanies(allContacts);

  const hasFilters =
    Boolean(search) ||
    Boolean(companyId) ||
    Boolean(titleSearch) ||
    archivedFilter !== "active";

  const resultCountLabel =
    archivedFilter === "all"
      ? `Showing ${contacts.length} contacts out of ${allContacts.length} total contacts${
          hasFilters ? " with current filters" : ""
        }`
      : archivedFilter === "archived"
        ? `Showing ${contacts.length} archived contacts out of ${allContacts.length} total contacts${
            hasFilters ? " with current filters" : ""
          }`
        : `Showing ${contacts.length} active contacts out of ${allContacts.length} total contacts${
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
          <h1>Contacts</h1>

          <p style={{ color: "#aaa" }}>
            People connected to this Sell It workspace.
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
      </div>

      <form
        action="/contacts"
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
              Company
            </span>
            <select
              name="company_id"
              defaultValue={companyId}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #555",
              }}
            >
              <option value="">All</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: "6px" }}>
              Title / Role
            </span>
            <input
              name="title"
              defaultValue={params.title ?? ""}
              placeholder="Owner, dispatcher..."
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
            href="/contacts"
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

      {!error && allContacts.length === 0 && <p>No contacts found.</p>}

      {!error && allContacts.length > 0 && contacts.length === 0 && (
        <p>No contacts match the current filters.</p>
      )}

      {contacts.map((contact) => {
        const company = singleRelation(contact.companies);

        return (
          <Link
            key={contact.id}
            href={`/contacts/${contact.id}`}
            style={{
              display: "block",
              border: contact.is_archived ? "1px solid #d6a400" : "1px solid #333",
              padding: "16px",
              marginBottom: "12px",
              borderRadius: "8px",
              backgroundColor: contact.is_archived ? "#211c0d" : "#1a1a1a",
              color: "white",
              textDecoration: "none",
            }}
          >
            {contact.is_archived && (
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

            <h2 style={{ marginTop: 0 }}>{fullName(contact)}</h2>

            {contact.title && <p>Title: {contact.title}</p>}
            {company?.name && <p>Company: {company.name}</p>}
            {contact.email && <p>Email: {contact.email}</p>}
            {contact.phone && <p>Phone: {contact.phone}</p>}

            {contact.notes && (
              <p style={{ color: "#aaa" }}>
                Notes:{" "}
                {contact.notes.length > 180
                  ? `${contact.notes.slice(0, 180)}...`
                  : contact.notes}
              </p>
            )}

            {contact.is_archived && (
              <>
                <p>Archived: {formatDateTime(contact.archived_at)}</p>
                {contact.archive_reason && <p>Reason: {contact.archive_reason}</p>}
              </>
            )}
          </Link>
        );
      })}
    </main>
  );
}
