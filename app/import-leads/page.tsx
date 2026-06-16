"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type EnrichmentResult = {
  title: string | null;
  description: string | null;
  emails: string[];
  phones: string[];
  keywords: string[];
  notes: string[];
  fetchedUrl: string;
};

type ExistingCompanyMatch = {
  id: string;
  name: string;
  reason: string;
};

type SaveMode = "create" | "update" | "skip";

type LeadDraft = {
  resultKey: string;
  placeId: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  businessStatus: string | null;
  primaryType: string | null;
  sourceQuery: string;
  selected: boolean;
  saved: boolean;
  enriching: boolean;
  enrichment: EnrichmentResult | null;
  enrichmentError: string;
  existingCompany: ExistingCompanyMatch | null;
  saveMode: SaveMode;
};

type ExistingCompany = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  operating_regions: string | null;
  assets_equipment: string | null;
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
};

const buttonStyle: CSSProperties = {
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: "bold",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "white",
  color: "black",
  fontSize: "15px",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#333",
  color: "white",
  border: "1px solid #555",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "16px",
  backgroundColor: "#1a1a1a",
};

function extractPreviewSearchPhrase(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(trimmedValue);
    const queryValue =
      url.searchParams.get("q") ||
      url.searchParams.get("query") ||
      url.searchParams.get("textQuery");

    if (queryValue) {
      return queryValue.trim();
    }
  } catch {
    // Not a URL. Treat the value as a raw search phrase.
  }

  return trimmedValue.replace(/\+/g, " ").trim();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeWebsite(value: string | null | undefined) {
  const text = (value ?? "").trim().toLowerCase();

  if (!text) return "";

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return text
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }
}

function phoneDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

function findExistingCompanyMatch(
  lead: Omit<
    LeadDraft,
    | "selected"
    | "saved"
    | "enriching"
    | "enrichment"
    | "enrichmentError"
    | "existingCompany"
    | "saveMode"
  >,
  companies: ExistingCompany[]
): ExistingCompanyMatch | null {
  const leadName = normalizeText(lead.name);
  const leadWebsite = normalizeWebsite(lead.website);
  const leadPhone = phoneDigits(lead.phone);

  for (const company of companies) {
    const companyName = normalizeText(company.name);
    const companyWebsite = normalizeWebsite(company.website);
    const companyPhone = phoneDigits(company.phone);
    const companySourceText = company.assets_equipment ?? "";

    if (lead.placeId && companySourceText.includes(lead.placeId)) {
      return {
        id: company.id,
        name: company.name,
        reason: "Same Google Place ID",
      };
    }

    if (leadWebsite && companyWebsite && leadWebsite === companyWebsite) {
      return {
        id: company.id,
        name: company.name,
        reason: "Same website",
      };
    }

    if (leadPhone && companyPhone && leadPhone === companyPhone) {
      return {
        id: company.id,
        name: company.name,
        reason: "Same phone number",
      };
    }

    if (leadName && companyName && leadName === companyName) {
      return {
        id: company.id,
        name: company.name,
        reason: "Same company name",
      };
    }
  }

  return null;
}

async function loadExistingCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email, operating_regions, assets_equipment");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExistingCompany[];
}

function leadAddressText(lead: LeadDraft) {
  return lead.address || "No address returned";
}

function enrichmentSummary(lead: LeadDraft) {
  if (!lead.enrichment) {
    return [];
  }

  return [
    `Website enrichment URL: ${lead.enrichment.fetchedUrl}`,
    ...lead.enrichment.notes,
  ];
}

function leadSourceNote(lead: LeadDraft) {
  const lines = [
    `Imported from Google Places search: ${lead.sourceQuery}`,
    lead.googleMapsUri ? `Google Maps: ${lead.googleMapsUri}` : "",
    lead.placeId ? `Google Place ID: ${lead.placeId}` : "",
    ...enrichmentSummary(lead),
  ].filter(Boolean);

  return lines.join("\n");
}

function bestPhone(lead: LeadDraft) {
  return lead.phone || lead.enrichment?.phones[0] || null;
}

function bestEmail(lead: LeadDraft) {
  return lead.enrichment?.emails[0] || null;
}

function mergeText(existing: string | null, addition: string) {
  const existingText = existing?.trim() ?? "";
  const additionText = addition.trim();

  if (!existingText) return additionText || null;
  if (!additionText) return existingText;
  if (existingText.includes(additionText)) return existingText;

  return `${existingText}\n\n--- Import Leads Update ---\n${additionText}`;
}

export default function ImportLeadsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [maxResults, setMaxResults] = useState("10");
  const [leadTemperature, setLeadTemperature] = useState("Cold");
  const [leads, setLeads] = useState<LeadDraft[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const previewSearchPhrase = useMemo(
    () => extractPreviewSearchPhrase(searchInput),
    [searchInput]
  );

  const selectedCount = leads.filter(
    (lead) => lead.selected && !lead.saved && lead.saveMode !== "skip"
  ).length;
  const unsavedCount = leads.filter((lead) => !lead.saved).length;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSearching(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/import-leads/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchText: searchInput,
          maxResults: Number(maxResults) || 10,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        leads?: Omit<
          LeadDraft,
          | "selected"
          | "saved"
          | "enriching"
          | "enrichment"
          | "enrichmentError"
          | "existingCompany"
          | "saveMode"
        >[];
      };

      if (!response.ok) {
        throw new Error(data.error || "Lead search failed.");
      }

      const existingCompanies = await loadExistingCompanies();

      setLeads(
        (data.leads ?? []).map((lead) => {
          const existingCompany = findExistingCompanyMatch(
            lead,
            existingCompanies
          );

          return {
            ...lead,
            selected: false,
            saved: false,
            enriching: false,
            enrichment: null,
            enrichmentError: "",
            existingCompany,
            saveMode: existingCompany ? "update" : "create",
          };
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lead search failed.";

      setErrorMessage(message);
      setLeads([]);
    } finally {
      setSearching(false);
    }
  }

  function toggleLead(resultKey: string) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.resultKey === resultKey
          ? { ...lead, selected: !lead.selected }
          : lead
      )
    );
  }

  function changeSaveMode(resultKey: string, saveMode: SaveMode) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.resultKey === resultKey ? { ...lead, saveMode } : lead
      )
    );
  }

  function selectAllUnsaved() {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.saved ? lead : { ...lead, selected: true }
      )
    );
  }

  function clearSelections() {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => ({ ...lead, selected: false }))
    );
  }

  async function enrichLead(resultKey: string) {
    const lead = leads.find((item) => item.resultKey === resultKey);

    if (!lead) return;

    if (!lead.website) {
      setLeads((currentLeads) =>
        currentLeads.map((item) =>
          item.resultKey === resultKey
            ? { ...item, enrichmentError: "No website was returned for this lead." }
            : item
        )
      );
      return;
    }

    setLeads((currentLeads) =>
      currentLeads.map((item) =>
        item.resultKey === resultKey
          ? { ...item, enriching: true, enrichmentError: "" }
          : item
      )
    );

    try {
      const response = await fetch("/api/import-leads/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website: lead.website }),
      });

      const data = (await response.json()) as {
        error?: string;
        enrichment?: EnrichmentResult;
      };

      if (!response.ok || !data.enrichment) {
        throw new Error(data.error || "Website enrichment failed.");
      }

      setLeads((currentLeads) =>
        currentLeads.map((item) =>
          item.resultKey === resultKey
            ? {
                ...item,
                enriching: false,
                enrichment: data.enrichment ?? null,
                enrichmentError: "",
              }
            : item
        )
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Website enrichment failed.";

      setLeads((currentLeads) =>
        currentLeads.map((item) =>
          item.resultKey === resultKey
            ? { ...item, enriching: false, enrichmentError: message }
            : item
        )
      );
    }
  }

  async function saveSelectedLeads() {
    const selectedLeads = leads.filter(
      (lead) => lead.selected && !lead.saved && lead.saveMode !== "skip"
    );

    if (selectedLeads.length === 0) {
      setErrorMessage("Select at least one lead to save or update.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const existingCompanies = await loadExistingCompanies();
      let createdCount = 0;
      let updatedCount = 0;

      for (const lead of selectedLeads) {
        const sourceNote = leadSourceNote(lead);

        if (lead.saveMode === "update" && lead.existingCompany) {
          const existingCompany = existingCompanies.find(
            (company) => company.id === lead.existingCompany?.id
          );

          const { error } = await supabase
            .from("companies")
            .update({
              website: existingCompany?.website || lead.website || null,
              phone: existingCompany?.phone || bestPhone(lead),
              email: existingCompany?.email || bestEmail(lead),
              lead_temperature: leadTemperature,
              operating_regions:
                existingCompany?.operating_regions || lead.address || null,
              assets_equipment: mergeText(
                existingCompany?.assets_equipment ?? null,
                sourceNote
              ),
              updated_by: USER_ID,
            })
            .eq("id", lead.existingCompany.id);

          if (error) throw new Error(error.message);

          updatedCount += 1;
          continue;
        }

        const { error } = await supabase.from("companies").insert({
          workspace_id: WORKSPACE_ID,
          name: lead.name,
          website: lead.website || null,
          phone: bestPhone(lead),
          email: bestEmail(lead),
          lead_temperature: leadTemperature,
          operating_regions: lead.address || null,
          assets_equipment: sourceNote,
          created_by: USER_ID,
          updated_by: USER_ID,
        });

        if (error) throw new Error(error.message);

        createdCount += 1;
      }

      const savedKeys = new Set(selectedLeads.map((lead) => lead.resultKey));

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          savedKeys.has(lead.resultKey)
            ? { ...lead, selected: false, saved: true }
            : lead
        )
      );

      setSuccessMessage(
        `Created ${createdCount} company lead(s). Updated ${updatedCount} existing company record(s).`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Save selected leads failed."
      );
    } finally {
      setSaving(false);
    }
  }

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
      <div style={{ marginBottom: "24px" }}>
        <Link href="/" style={{ color: "white" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <h1>Import Leads</h1>

      <p style={{ color: "#aaa", marginBottom: "28px", maxWidth: "950px" }}>
        Paste a Google search URL or type a search phrase. Sell It will search
        business results, flag possible existing companies, let you enrich
        websites, and let you choose whether to update or create records.
      </p>

      <section style={{ ...cardStyle, maxWidth: "1000px", marginBottom: "24px" }}>
        <form onSubmit={handleSearch}>
          <label>
            Google search URL or search phrase
            <textarea
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Example: dirt haulers dickinson nd"
              rows={5}
              required
              style={inputStyle}
            />
          </label>

          {previewSearchPhrase && (
            <p style={{ color: "#aaa", marginTop: "10px" }}>
              Search phrase detected:{" "}
              <strong style={{ color: "white" }}>{previewSearchPhrase}</strong>
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginTop: "18px",
            }}
          >
            <label>
              Max Results
              <select
                value={maxResults}
                onChange={(event) => setMaxResults(event.target.value)}
                style={inputStyle}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </label>

            <label>
              Saved Lead Temperature
              <select
                value={leadTemperature}
                onChange={(event) => setLeadTemperature(event.target.value)}
                style={inputStyle}
              >
                <option value="Cold">Cold</option>
                <option value="Warm">Warm</option>
                <option value="Hot">Hot</option>
                <option value="Active">Active</option>
                <option value="Dead">Dead</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={searching}
            style={{ ...buttonStyle, marginTop: "18px" }}
          >
            {searching ? "Searching..." : "Find Leads"}
          </button>
        </form>
      </section>

      {errorMessage && (
        <p style={{ color: "#ff7777", maxWidth: "1000px" }}>
          Error: {errorMessage}
        </p>
      )}

      {successMessage && (
        <p style={{ color: "#72e072", maxWidth: "1000px" }}>
          {successMessage}
        </p>
      )}

      {leads.length > 0 && (
        <section style={{ maxWidth: "1000px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ marginBottom: "6px" }}>Review Results</h2>
              <p style={{ color: "#aaa", marginTop: 0 }}>
                {leads.length} result(s) found. {selectedCount} selected.{" "}
                {unsavedCount} not saved yet.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button type="button" onClick={selectAllUnsaved} style={secondaryButtonStyle}>
                Select All
              </button>
              <button type="button" onClick={clearSelections} style={secondaryButtonStyle}>
                Clear Selections
              </button>
              <button
                type="button"
                onClick={saveSelectedLeads}
                disabled={saving || selectedCount === 0}
                style={buttonStyle}
              >
                {saving ? "Saving..." : "Save / Update Selected"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {leads.map((lead, index) => (
              <article
                key={lead.resultKey}
                style={{
                  ...cardStyle,
                  borderColor: lead.existingCompany ? "#d1a938" : "#333",
                  opacity: lead.saved ? 0.65 : 1,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    cursor: lead.saved ? "default" : "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={lead.selected}
                    disabled={lead.saved}
                    onChange={() => toggleLead(lead.resultKey)}
                    style={{ marginTop: "6px", transform: "scale(1.2)" }}
                  />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                        #{index + 1} {lead.name}
                      </h3>

                      {lead.saved && (
                        <strong style={{ color: "#72e072" }}>Saved</strong>
                      )}
                    </div>

                    {lead.existingCompany && (
                      <div
                        style={{
                          border: "1px solid #d1a938",
                          borderRadius: "8px",
                          padding: "10px",
                          backgroundColor: "#2a2412",
                          marginBottom: "12px",
                        }}
                      >
                        <strong>Possible existing company found</strong>
                        <p style={{ margin: "6px 0" }}>
                          Match:{" "}
                          <Link
                            href={`/companies/${lead.existingCompany.id}`}
                            style={{ color: "white" }}
                          >
                            {lead.existingCompany.name}
                          </Link>
                        </p>
                        <p style={{ margin: "6px 0" }}>
                          Reason: {lead.existingCompany.reason}
                        </p>

                        <label>
                          Save choice
                          <select
                            value={lead.saveMode}
                            onChange={(event) =>
                              changeSaveMode(
                                lead.resultKey,
                                event.target.value as SaveMode
                              )
                            }
                            disabled={lead.saved}
                            style={inputStyle}
                          >
                            <option value="update">Update existing company</option>
                            <option value="skip">Skip this result</option>
                            <option value="create">Create new anyway</option>
                          </select>
                        </label>
                      </div>
                    )}

                    <p style={{ color: "#ddd", marginTop: 0 }}>
                      {leadAddressText(lead)}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "8px",
                        color: "#bbb",
                        fontSize: "14px",
                      }}
                    >
                      <div>Phone: {lead.phone || "Not returned"}</div>
                      <div>Type: {lead.primaryType || "Not returned"}</div>
                      <div>Status: {lead.businessStatus || "Not returned"}</div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "12px",
                      }}
                    >
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "white" }}
                        >
                          Website
                        </a>
                      )}

                      {lead.googleMapsUri && (
                        <a
                          href={lead.googleMapsUri}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "white" }}
                        >
                          Google Maps
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => enrichLead(lead.resultKey)}
                        disabled={lead.saved || lead.enriching || !lead.website}
                        style={{
                          ...secondaryButtonStyle,
                          padding: "8px 10px",
                          opacity: lead.saved || lead.enriching || !lead.website ? 0.55 : 1,
                        }}
                      >
                        {lead.enriching ? "Enriching..." : "Enrich Website"}
                      </button>
                    </div>

                    {lead.enrichmentError && (
                      <p style={{ color: "#ff7777", marginBottom: 0 }}>
                        Enrichment error: {lead.enrichmentError}
                      </p>
                    )}

                    {lead.enrichment && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "12px",
                          border: "1px solid #444",
                          borderRadius: "8px",
                          backgroundColor: "#111",
                        }}
                      >
                        <strong>Website Enrichment</strong>

                        {lead.enrichment.title && (
                          <p style={{ marginBottom: "6px" }}>
                            Title: {lead.enrichment.title}
                          </p>
                        )}

                        {lead.enrichment.description && (
                          <p style={{ marginBottom: "6px" }}>
                            Description: {lead.enrichment.description}
                          </p>
                        )}

                        <p style={{ marginBottom: "6px" }}>
                          Emails:{" "}
                          {lead.enrichment.emails.length > 0
                            ? lead.enrichment.emails.join(", ")
                            : "None found"}
                        </p>

                        <p style={{ marginBottom: "6px" }}>
                          Phones:{" "}
                          {lead.enrichment.phones.length > 0
                            ? lead.enrichment.phones.join(", ")
                            : "None found"}
                        </p>

                        <p style={{ marginBottom: 0 }}>
                          Keywords:{" "}
                          {lead.enrichment.keywords.length > 0
                            ? lead.enrichment.keywords.join(", ")
                            : "None found"}
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
