"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    <section
      style={{
        border: "1px solid #333",
        borderRadius: "12px",
        padding: "24px",
        backgroundColor: "#1a1a1a",
        marginBottom: "32px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Search</h2>

      <p style={{ color: "#aaa" }}>
        Search companies and contacts first. Try typing a name like John Test.
      </p>

      <input
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Find a company or contact..."
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "8px",
          border: "1px solid #555",
          fontSize: "18px",
          backgroundColor: "white",
          color: "black",
          boxSizing: "border-box",
        }}
      />

      {searching && <p style={{ color: "#aaa" }}>Searching...</p>}

      {errorMessage && <p style={{ color: "red" }}>Error: {errorMessage}</p>}

      {searchText.trim().length >= 2 && !searching && !hasResults && (
        <p style={{ color: "#aaa" }}>No companies or contacts found.</p>
      )}

      {companies.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Companies</h3>

          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              style={{
                display: "block",
                color: "white",
                textDecoration: "none",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
                backgroundColor: "#111",
              }}
            >
              <strong>{company.name}</strong>

              {company.lead_temperature && (
                <span style={{ color: "#aaa" }}>
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
              style={{
                display: "block",
                color: "white",
                textDecoration: "none",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
                backgroundColor: "#111",
              }}
            >
              <strong>
                {contact.first_name} {contact.last_name || ""}
              </strong>

              {contact.email && (
                <span style={{ color: "#aaa" }}> — {contact.email}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}