"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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

function leadAddressText(lead: LeadDraft) {
  return lead.address || "No address returned";
}

function leadSourceNote(lead: LeadDraft) {
  const lines = [
    `Imported from Google Places search: ${lead.sourceQuery}`,
    lead.googleMapsUri ? `Google Maps: ${lead.googleMapsUri}` : "",
    lead.placeId ? `Google Place ID: ${lead.placeId}` : "",
  ].filter(Boolean);

  return lines.join("\n");
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

  const selectedCount = leads.filter((lead) => lead.selected && !lead.saved).length;
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
        leads?: Omit<LeadDraft, "selected" | "saved">[];
      };

      if (!response.ok) {
        throw new Error(data.error || "Lead search failed.");
      }

      setLeads(
        (data.leads ?? []).map((lead) => ({
          ...lead,
          selected: false,
          saved: false,
        }))
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

  async function saveSelectedLeads() {
    const selectedLeads = leads.filter((lead) => lead.selected && !lead.saved);

    if (selectedLeads.length === 0) {
      setErrorMessage("Select at least one lead to save.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const rows = selectedLeads.map((lead) => ({
      workspace_id: WORKSPACE_ID,
      name: lead.name,
      website: lead.website || null,
      phone: lead.phone || null,
      email: null,
      lead_temperature: leadTemperature,
      operating_regions: lead.address || null,
      assets_equipment: leadSourceNote(lead),
      created_by: USER_ID,
      updated_by: USER_ID,
    }));

    const { error } = await supabase.from("companies").insert(rows);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const savedKeys = new Set(selectedLeads.map((lead) => lead.resultKey));

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        savedKeys.has(lead.resultKey)
          ? { ...lead, selected: false, saved: true }
          : lead
      )
    );

    setSuccessMessage(`Saved ${selectedLeads.length} company lead(s).`);
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
        business results, show draft company leads, and let you choose which
        ones to save.
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
                {saving ? "Saving..." : "Save Selected"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {leads.map((lead, index) => (
              <article
                key={lead.resultKey}
                style={{
                  ...cardStyle,
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
                    </div>
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
