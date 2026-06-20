"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type CompanyResult = {
  id: string;
  name: string;
  lead_temperature: string | null;
};

type ContactResult = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
};

const sectionStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  marginBottom: "32px",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  fontSize: "16px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const resultCardStyle: CSSProperties = {
  display: "block",
  color: "#f8fafc",
  textDecoration: "none",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "14px",
  padding: "12px 14px",
  marginBottom: "10px",
  backgroundColor: "rgba(15, 23, 42, 0.72)",
};

const errorStyle: CSSProperties = {
  color: "#fecaca",
  border: "1px solid rgba(248, 113, 113, 0.36)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  padding: "12px 14px",
  borderRadius: "14px",
};

export default function HomeSearch() {
  const [searchText, setSearchText] = useState("");
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function runSearch() {
      const cleanedSearch = searchText.trim();

      if (cleanedSearch.length < 2) {
        setCompanies([]);
        setContacts([]);
        setErrorMessage("");
        return;
      }

      setSearching(true);
      setErrorMessage("");

      const searchParts = cleanedSearch
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean);

      const companyFilter = `name.ilike.%${cleanedSearch}%`;

      const contactFilters = [
        `first_name.ilike.%${cleanedSearch}%`,
        `last_name.ilike.%${cleanedSearch}%`,
        `email.ilike.%${cleanedSearch}%`,
        ...searchParts.flatMap((part) => [
          `first_name.ilike.%${part}%`,
          `last_name.ilike.%${part}%`,
          `email.ilike.%${part}%`,
        ]),
      ].join(",");

      const { data: companyRows, error: companyError } = await supabase
        .from("companies")
        .select("id, name, lead_temperature")
        .or(companyFilter)
        .order("name", { ascending: true })
        .limit(5);

      if (companyError) {
        setSearching(false);
        setErrorMessage(companyError.message);
        return;
      }

      const { data: contactRows, error: contactError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email")
        .or(contactFilters)
        .order("first_name", { ascending: true })
        .limit(5);

      setSearching(false);

      if (contactError) {
        setErrorMessage(contactError.message);
        return;
      }

      setCompanies(companyRows ?? []);
      setContacts(contactRows ?? []);
    }

    const timeoutId = window.setTimeout(runSearch, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  const hasResults = companies.length > 0 || contacts.length > 0;

  return (
    <section style={sectionStyle}>
      <h2 style={{ marginTop: 0 }}>Search</h2>

      <p style={mutedTextStyle}>
        Search companies and contacts first. Try typing a name like John Test.
      </p>

      <input
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Find a company or contact..."
        style={inputStyle}
      />

      {searching && <p style={mutedTextStyle}>Searching...</p>}

      {errorMessage && <p style={errorStyle}>Error: {errorMessage}</p>}

      {searchText.trim().length >= 2 && !searching && !hasResults && (
        <p style={mutedTextStyle}>No companies or contacts found.</p>
      )}

      {companies.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Companies</h3>

          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              style={resultCardStyle}
            >
              <strong>{company.name}</strong>

              {company.lead_temperature && (
                <span style={{ color: "#94a3b8" }}>
                  {" "}
                  — {company.lead_temperature} Lead
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Contacts</h3>

          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              style={resultCardStyle}
            >
              <strong>
                {contact.first_name} {contact.last_name || ""}
              </strong>

              {contact.email && (
                <span style={{ color: "#94a3b8" }}> — {contact.email}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
