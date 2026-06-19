import Link from "next/link";
import type { CSSProperties } from "react";
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

function initialsFromContact(contact: Contact) {
  const firstInitial = contact.first_name?.trim()?.[0] ?? "";
  const lastInitial = contact.last_name?.trim()?.[0] ?? "";

  const initials = `${firstInitial}${lastInitial}`.trim();

  if (initials) return initials.toUpperCase();

  return fullName(contact).slice(0, 2).toUpperCase() || "?";
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

function statusBadgeStyle(value: "archived" | "active"): CSSProperties {
  const isArchived = value === "archived";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor: isArchived
      ? "rgba(245, 158, 11, 0.22)"
      : "rgba(34, 197, 94, 0.18)",
    color: isArchived ? "#fcd34d" : "#86efac",
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
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

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Contacts</h1>

            <p style={{ ...mutedTextStyle(), margin: 0, lineHeight: 1.5 }}>
              People connected to this Sell It workspace.
            </p>
          </div>

          <Link href="/contacts/new" style={primaryButtonStyle()}>
            + Add Contact
          </Link>
        </div>

        <form action="/contacts" style={{ ...panelStyle(), marginBottom: "18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <label>
              <span style={fieldLabelStyle()}>Search</span>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search contacts..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Company</span>
              <select name="company_id" defaultValue={companyId} style={inputStyle()}>
                <option value="">All</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabelStyle()}>Title / Role</span>
              <input
                name="title"
                defaultValue={params.title ?? ""}
                placeholder="Owner, dispatcher..."
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={fieldLabelStyle()}>Archived</span>
              <select name="archived" defaultValue={archivedFilter} style={inputStyle()}>
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

            <a href="/contacts" style={secondaryButtonStyle()}>
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

        {!error && allContacts.length === 0 && <p>No contacts found.</p>}

        {!error && allContacts.length > 0 && contacts.length === 0 && (
          <p>No contacts match the current filters.</p>
        )}

        <div style={{ display: "grid", gap: "10px" }}>
          {contacts.map((contact) => {
            const company = singleRelation(contact.companies);
            const name = fullName(contact);

            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "48px minmax(0, 1.25fr) minmax(170px, 0.9fr) 26px",
                  gap: "14px",
                  alignItems: "center",
                  border: contact.is_archived
                    ? "1px solid rgba(245, 158, 11, 0.65)"
                    : "1px solid #2f2f2f",
                  padding: "14px",
                  borderRadius: "14px",
                  background: contact.is_archived
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
                  {initialsFromContact(contact)}
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
                    <strong>{name || "Unnamed Contact"}</strong>

                    {contact.is_archived ? (
                      <span style={statusBadgeStyle("archived")}>Archived</span>
                    ) : (
                      <span style={statusBadgeStyle("active")}>Active</span>
                    )}
                  </div>

                  <p style={{ ...mutedTextStyle(), margin: "0 0 4px" }}>
                    {contact.title ? `Title: ${contact.title}` : "Title: Not listed"}
                  </p>

                  <p style={{ ...mutedTextStyle(), margin: 0 }}>
                    {company?.name ? `Company: ${company.name}` : "Company: Not linked"}
                  </p>

                  {contact.notes && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "8px 0 0",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      Notes:{" "}
                      {contact.notes.length > 140
                        ? `${contact.notes.slice(0, 140)}...`
                        : contact.notes}
                    </p>
                  )}

                  {contact.is_archived && (
                    <p style={{ color: "#ffcc66", margin: "8px 0 0" }}>
                      Archived: {formatDateTime(contact.archived_at)}
                      {contact.archive_reason
                        ? ` — Reason: ${contact.archive_reason}`
                        : ""}
                    </p>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  {contact.phone && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: "0 0 6px",
                        wordBreak: "break-word",
                      }}
                    >
                      Phone: {contact.phone}
                    </p>
                  )}

                  {contact.email && (
                    <p
                      style={{
                        ...mutedTextStyle(),
                        margin: 0,
                        wordBreak: "break-word",
                      }}
                    >
                      Email: {contact.email}
                    </p>
                  )}

                  {!contact.phone && !contact.email && (
                    <p style={{ ...mutedTextStyle(), margin: 0 }}>
                      No phone or email listed.
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
