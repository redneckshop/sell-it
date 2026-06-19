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
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    marginTop: "7px",
    borderRadius: "10px",
    border: "1px solid #3d3d3d",
    backgroundColor: "#111",
    color: "white",
    outline: "none",
    fontSize: "15px",
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    display: "block",
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
    cursor: "pointer",
    fontSize: "15px",
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
    cursor: "pointer",
    fontSize: "15px",
  };
}

function mutedTextStyle(): CSSProperties {
  return {
    color: "#a7a7a7",
  };
}

function badgeStyle(value: string): CSSProperties {
  const normalized = value.toLowerCase();

  const backgroundColor =
    normalized.includes("saved")
      ? "rgba(34, 197, 94, 0.20)"
      : normalized.includes("existing") || normalized.includes("update")
        ? "rgba(245, 158, 11, 0.22)"
        : normalized.includes("skip")
          ? "rgba(239, 68, 68, 0.18)"
          : "rgba(124, 58, 237, 0.22)";

  const color =
    normalized.includes("saved")
      ? "#86efac"
      : normalized.includes("existing") || normalized.includes("update")
        ? "#fcd34d"
        : normalized.includes("skip")
          ? "#fca5a5"
          : "#c4b5fd";

  return {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: "12px",
    fontWeight: 900,
    backgroundColor,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

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
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
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
    setNextPageToken(null);

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
        nextPageToken?: string | null;
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

      setNextPageToken(data.nextPageToken ?? null);

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

  async function loadNextPage() {
    if (!nextPageToken) {
      setErrorMessage("No additional Google results are available for this search.");
      return;
    }

    setLoadingNextPage(true);
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
          maxResults: 20,
          pageToken: nextPageToken,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        nextPageToken?: string | null;
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
        throw new Error(data.error || "Next page search failed.");
      }

      const existingCompanies = await loadExistingCompanies();
      const existingResultKeys = new Set(leads.map((lead) => lead.resultKey));
      const existingPlaceIds = new Set(
        leads.map((lead) => lead.placeId).filter(Boolean)
      );

      const nextLeads = (data.leads ?? [])
        .filter((lead) => {
          if (existingResultKeys.has(lead.resultKey)) return false;
          if (lead.placeId && existingPlaceIds.has(lead.placeId)) return false;

          return true;
        })
        .map((lead) => {
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
            saveMode: existingCompany ? "update" : "create" as SaveMode,
          };
        });

      setNextPageToken(data.nextPageToken ?? null);
      setLeads((currentLeads) => [...currentLeads, ...nextLeads]);

      if (nextLeads.length === 0) {
        setSuccessMessage("No new unique leads were found on the next page.");
      } else {
        setSuccessMessage(
          `Loaded ${nextLeads.length} new unique lead${
            nextLeads.length === 1 ? "" : "s"
          } from the next page.`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Next page search failed.";

      setErrorMessage(message);
    } finally {
      setLoadingNextPage(false);
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
    setNextPageToken(null);

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
    <main style={pageStyle()}>
      <section style={{ maxWidth: "1120px", margin: "0 auto" }}>
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
              Intelligence
            </p>

            <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>
              Import Leads
            </h1>

            <p
              style={{
                ...mutedTextStyle(),
                margin: 0,
                lineHeight: 1.5,
                maxWidth: "920px",
              }}
            >
              Paste a Google search URL or type a search phrase. Sell It will
              search business results, flag possible existing companies, enrich
              websites, and let you choose whether to update or create records.
            </p>
          </div>

          <Link href="/companies" style={secondaryButtonStyle()}>
            View Companies
          </Link>
        </div>

        <section style={{ ...panelStyle(), marginBottom: "18px" }}>
          <form onSubmit={handleSearch}>
            <label style={fieldLabelStyle()}>
              Google search URL or search phrase
              <textarea
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Example: dirt haulers dickinson nd"
                rows={5}
                required
                style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.4 }}
              />
            </label>

            {previewSearchPhrase && (
              <p style={{ ...mutedTextStyle(), marginTop: "10px" }}>
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
              <label style={fieldLabelStyle()}>
                Max Results
                <select
                  value={maxResults}
                  onChange={(event) => setMaxResults(event.target.value)}
                  style={inputStyle()}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                </select>
              </label>

              <label style={fieldLabelStyle()}>
                Saved Lead Temperature
                <select
                  value={leadTemperature}
                  onChange={(event) => setLeadTemperature(event.target.value)}
                  style={inputStyle()}
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
              style={{
                ...primaryButtonStyle(),
                marginTop: "18px",
                opacity: searching ? 0.65 : 1,
              }}
            >
              {searching ? "Searching..." : "Find Leads"}
            </button>
          </form>
        </section>

        {errorMessage && (
          <p style={{ color: "#fca5a5", maxWidth: "1000px" }}>
            Error: {errorMessage}
          </p>
        )}

        {successMessage && (
          <p style={{ color: "#86efac", maxWidth: "1000px" }}>
            {successMessage}
          </p>
        )}

        {leads.length > 0 && (
          <section>
            <div
              style={{
                ...panelStyle(),
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 6px" }}>Review Results</h2>
                <p style={{ ...mutedTextStyle(), margin: 0 }}>
                  {leads.length} result(s) found. {selectedCount} selected.{" "}
                  {unsavedCount} not saved yet.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <button
                  type="button"
                  onClick={selectAllUnsaved}
                  style={secondaryButtonStyle()}
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={clearSelections}
                  style={secondaryButtonStyle()}
                >
                  Clear Selections
                </button>

                {nextPageToken && (
                  <button
                    type="button"
                    onClick={loadNextPage}
                    disabled={loadingNextPage}
                    style={{
                      ...secondaryButtonStyle(),
                      opacity: loadingNextPage ? 0.65 : 1,
                    }}
                  >
                    {loadingNextPage ? "Loading..." : "Get Next 20"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={saveSelectedLeads}
                  disabled={saving || selectedCount === 0}
                  style={{
                    ...primaryButtonStyle(),
                    opacity: saving || selectedCount === 0 ? 0.65 : 1,
                  }}
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
                    ...panelStyle(),
                    borderColor: lead.existingCompany
                      ? "rgba(245, 158, 11, 0.55)"
                      : "#2f2f2f",
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: "0 0 6px" }}>
                            #{index + 1} {lead.name}
                          </h3>

                          <p style={{ ...mutedTextStyle(), margin: 0 }}>
                            {leadAddressText(lead)}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            alignItems: "flex-start",
                          }}
                        >
                          {lead.existingCompany && (
                            <span style={badgeStyle("Existing")}>
                              Existing Match
                            </span>
                          )}

                          {lead.saved && <span style={badgeStyle("Saved")}>Saved</span>}

                          {!lead.saved && (
                            <span style={badgeStyle(lead.saveMode)}>
                              {lead.saveMode === "update"
                                ? "Update"
                                : lead.saveMode === "skip"
                                  ? "Skip"
                                  : "Create"}
                            </span>
                          )}
                        </div>
                      </div>

                      {lead.existingCompany && (
                        <div
                          style={{
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            borderRadius: "12px",
                            padding: "12px",
                            backgroundColor: "rgba(245, 158, 11, 0.10)",
                            marginBottom: "12px",
                          }}
                        >
                          <strong>Possible existing company found</strong>

                          <p style={{ margin: "6px 0" }}>
                            Match:{" "}
                            <Link
                              href={`/companies/${lead.existingCompany.id}`}
                              style={{ color: "#fcd34d", fontWeight: 900 }}
                            >
                              {lead.existingCompany.name}
                            </Link>
                          </p>

                          <p style={{ margin: "6px 0" }}>
                            Reason: {lead.existingCompany.reason}
                          </p>

                          <label style={fieldLabelStyle()}>
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
                              style={inputStyle()}
                            >
                              <option value="update">Update existing company</option>
                              <option value="skip">Skip this result</option>
                              <option value="create">Create new anyway</option>
                            </select>
                          </label>
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "8px",
                          color: "#d1d5db",
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
                            style={{ color: "#c4b5fd", fontWeight: 900 }}
                          >
                            Website
                          </a>
                        )}

                        {lead.googleMapsUri && (
                          <a
                            href={lead.googleMapsUri}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#c4b5fd", fontWeight: 900 }}
                          >
                            Google Maps
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => enrichLead(lead.resultKey)}
                          disabled={lead.saved || lead.enriching || !lead.website}
                          style={{
                            ...secondaryButtonStyle(),
                            minHeight: "36px",
                            padding: "0 12px",
                            opacity:
                              lead.saved || lead.enriching || !lead.website
                                ? 0.55
                                : 1,
                          }}
                        >
                          {lead.enriching ? "Enriching..." : "Enrich Website"}
                        </button>
                      </div>

                      {lead.enrichmentError && (
                        <p style={{ color: "#fca5a5", marginBottom: 0 }}>
                          Enrichment error: {lead.enrichmentError}
                        </p>
                      )}

                      {lead.enrichment && (
                        <div
                          style={{
                            marginTop: "14px",
                            padding: "12px",
                            border: "1px solid #2f2f2f",
                            borderRadius: "12px",
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
      </section>
    </main>
  );
}


