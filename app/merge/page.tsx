"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import UniversalDuplicateReview from "./UniversalDuplicateReview";

const MERGE_SLIDE_COMPLETE_VALUE = 100;

type MergeType = "company" | "contact";

type CompanyRow = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  lead_temperature: string | null;
  operating_regions: string | null;
  assets_equipment: string | null;
  is_archived: boolean | null;
};

type ContactCompany = {
  id: string;
  name: string;
};

type ContactRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  company_id: string | null;
  is_archived: boolean | null;
  companies?: ContactCompany | ContactCompany[] | null;
};

type MergeCandidate = {
  type: MergeType;
  leftId: string;
  rightId: string;
  leftName: string;
  rightName: string;
  reasons: string[];
  score: number;
};

type RelationCounts = {
  contacts: number;
  opportunities: number;
  tasks: number;
  activities: number;
  noteCount: number;
  attachments: number;
  painPointLinks: number;
};

type CompanyDetail = CompanyRow & RelationCounts;
type ContactDetail = ContactRow & RelationCounts;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#111",
  color: "white",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "10px",
  padding: "16px",
  backgroundColor: "#1a1a1a",
  boxSizing: "border-box",
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
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

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#ffcccc",
  color: "black",
};



function singleRelation<T>(value: T | T[] | null | undefined) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b(llc|inc|incorporated|company|co|corp|corporation|ltd|limited)\b/g, "")
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

function isMeaningfulWebsite(value: string) {
  const blockedDomains = new Set([
    "example.com",
    "test.com",
    "localhost",
    "127.0.0.1",
  ]);

  return Boolean(value) && !blockedDomains.has(value);
}

function phoneDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function fullContactName(contact: ContactRow) {
  return (
    [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() ||
    "Unnamed Contact"
  );
}

function similarEnough(left: string, right: string) {
  if (!left || !right) return false;
  if (left === right) return true;

  if (
    left.length >= 5 &&
    right.length >= 5 &&
    (left.includes(right) || right.includes(left))
  ) {
    return true;
  }

  const leftWords = new Set(left.split(" ").filter((word) => word.length > 2));
  const rightWords = right.split(" ").filter((word) => word.length > 2);

  if (leftWords.size === 0 || rightWords.length === 0) return false;

  const shared = rightWords.filter((word) => leftWords.has(word)).length;
  return shared >= Math.min(2, Math.min(leftWords.size, rightWords.length));
}

function buildCompanyCandidates(companies: CompanyRow[]) {
  const activeCompanies = companies.filter((company) => !company.is_archived);
  const candidates: MergeCandidate[] = [];

  for (let i = 0; i < activeCompanies.length; i += 1) {
    for (let j = i + 1; j < activeCompanies.length; j += 1) {
      const left = activeCompanies[i];
      const right = activeCompanies[j];
      const reasons: string[] = [];
      let score = 0;

      const leftName = normalizeName(left.name);
      const rightName = normalizeName(right.name);
      const leftWebsite = normalizeWebsite(left.website);
      const rightWebsite = normalizeWebsite(right.website);
      const leftPhone = phoneDigits(left.phone);
      const rightPhone = phoneDigits(right.phone);
      const leftEmail = normalizeEmail(left.email);
      const rightEmail = normalizeEmail(right.email);

      if (leftName && rightName && leftName === rightName) {
        reasons.push("Exact/simplified name match");
        score += 50;
      } else if (similarEnough(leftName, rightName)) {
        reasons.push("Similar company name");
        score += 25;
      }

      let hasHardMatch = false;

      if (
        leftWebsite &&
        rightWebsite &&
        leftWebsite === rightWebsite &&
        isMeaningfulWebsite(leftWebsite)
      ) {
        reasons.push("Same website");
        score += 45;
        hasHardMatch = true;
      }

      if (leftPhone && rightPhone && leftPhone === rightPhone) {
        reasons.push("Same phone");
        score += 40;
        hasHardMatch = true;
      }

      if (leftEmail && rightEmail && leftEmail === rightEmail) {
        reasons.push("Same email");
        score += 35;
        hasHardMatch = true;
      }

      if (hasHardMatch) {
        candidates.push({
          type: "company",
          leftId: left.id,
          rightId: right.id,
          leftName: left.name,
          rightName: right.name,
          reasons,
          score,
        });
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function buildContactCandidates(contacts: ContactRow[]) {
  const activeContacts = contacts.filter((contact) => !contact.is_archived);
  const candidates: MergeCandidate[] = [];

  for (let i = 0; i < activeContacts.length; i += 1) {
    for (let j = i + 1; j < activeContacts.length; j += 1) {
      const left = activeContacts[i];
      const right = activeContacts[j];
      const reasons: string[] = [];
      let score = 0;

      const leftName = normalizeName(fullContactName(left));
      const rightName = normalizeName(fullContactName(right));
      const leftPhone = phoneDigits(left.phone);
      const rightPhone = phoneDigits(right.phone);
      const leftEmail = normalizeEmail(left.email);
      const rightEmail = normalizeEmail(right.email);

      let hasHardMatch = false;

      if (leftEmail && rightEmail && leftEmail === rightEmail) {
        reasons.push("Same email");
        score += 60;
        hasHardMatch = true;
      }

      if (leftPhone && rightPhone && leftPhone === rightPhone) {
        reasons.push("Same phone");
        score += 45;
        hasHardMatch = true;
      }

      if (leftName && rightName && leftName === rightName) {
        reasons.push("Exact/simplified name match");
        score += 35;
      } else if (similarEnough(leftName, rightName)) {
        reasons.push("Similar contact name");
        score += 20;
      }

      if (hasHardMatch) {
        candidates.push({
          type: "contact",
          leftId: left.id,
          rightId: right.id,
          leftName: fullContactName(left),
          rightName: fullContactName(right),
          reasons,
          score,
        });
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

async function countRows(tableName: string, columnName: string, id: string) {
  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true })
    .eq(columnName, id);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function loadCompanyDetail(company: CompanyRow): Promise<CompanyDetail> {
  const [
    contacts,
    opportunities,
    tasks,
    activities,
    noteCount,
    attachments,
    painPointLinks,
  ] = await Promise.all([
    countRows("contacts", "company_id", company.id),
    countRows("opportunities", "company_id", company.id),
    countRows("tasks", "company_id", company.id),
    countRows("activities", "company_id", company.id),
    countRows("notes", "company_id", company.id),
    countRows("attachments", "related_company_id", company.id),
    countRows("pain_point_companies", "company_id", company.id),
  ]);

  return {
    ...company,
    contacts,
    opportunities,
    tasks,
    activities,
    noteCount,
    attachments,
    painPointLinks,
  };
}

async function loadContactDetail(contact: ContactRow): Promise<ContactDetail> {
  const [
    opportunities,
    tasks,
    activities,
    noteCount,
    attachments,
    painPointLinks,
  ] = await Promise.all([
    countRows("opportunities", "primary_contact_id", contact.id),
    countRows("tasks", "contact_id", contact.id),
    countRows("activities", "contact_id", contact.id),
    countRows("notes", "contact_id", contact.id),
    countRows("attachments", "related_contact_id", contact.id),
    countRows("pain_point_contacts", "contact_id", contact.id),
  ]);

  return {
    ...contact,
    contacts: 0,
    opportunities,
    tasks,
    activities,
    noteCount,
    attachments,
    painPointLinks,
  };
}

function relationCountRows(
  detail: CompanyDetail | ContactDetail,
  type: MergeType
) {
  return [
    type === "company" ? ["Contacts", detail.contacts] : null,
    ["Opportunities", detail.opportunities],
    ["Tasks", detail.tasks],
    ["Activities", detail.activities],
    ["Notes", detail.noteCount],
    ["Attachments", detail.attachments],
    ["Pain Point Links", detail.painPointLinks],
  ].filter(Boolean) as [string, number][];
}

function companyFieldRows(company: CompanyDetail) {
  return [
    ["Website", company.website || "Not saved"],
    ["Phone", company.phone || "Not saved"],
    ["Email", company.email || "Not saved"],
    ["Lead Temperature", company.lead_temperature || "Not saved"],
    ["Operating Regions", company.operating_regions || "Not saved"],
    ["Assets / Equipment", company.assets_equipment || "Not saved"],
  ];
}

function contactFieldRows(contact: ContactDetail) {
  const company = singleRelation(contact.companies);

  return [
    ["Company", company?.name || "Not linked"],
    ["Title", contact.title || "Not saved"],
    ["Email", contact.email || "Not saved"],
    ["Phone", contact.phone || "Not saved"],
    ["Notes", contact.notes || "Not saved"],
  ];
}

export default function MergeManagerPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] =
    useState<MergeCandidate | null>(null);
  const [leftDetail, setLeftDetail] = useState<
    CompanyDetail | ContactDetail | null
  >(null);
  const [rightDetail, setRightDetail] = useState<
    CompanyDetail | ContactDetail | null
  >(null);
  const [survivorSide, setSurvivorSide] = useState<"left" | "right">("left");
  const [mergeSlideValue, setMergeSlideValue] = useState(0);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const companyCandidates = useMemo(
    () => buildCompanyCandidates(companies),
    [companies]
  );
  const contactCandidates = useMemo(
    () => buildContactCandidates(contacts),
    [contacts]
  );

  async function loadData() {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const [companyResult, contactResult] = await Promise.all([
        supabase
          .from("companies")
          .select(
            "id, name, website, phone, email, lead_temperature, operating_regions, assets_equipment, is_archived"
          )
          .order("name", { ascending: true }),
        supabase
          .from("contacts")
          .select(
            "id, first_name, last_name, title, email, phone, notes, company_id, is_archived, companies(id, name)"
          )
          .order("first_name", { ascending: true }),
      ]);

      if (companyResult.error) throw new Error(companyResult.error.message);
      if (contactResult.error) throw new Error(contactResult.error.message);

      setCompanies((companyResult.data ?? []) as unknown as CompanyRow[]);
      setContacts((contactResult.data ?? []) as unknown as ContactRow[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load merge data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function selectCandidate(candidate: MergeCandidate) {
    setSelectedCandidate(candidate);
    setSurvivorSide("left");
    setMergeSlideValue(0);
    setErrorMessage("");
    setSuccessMessage("");
    setLeftDetail(null);
    setRightDetail(null);

    try {
      if (candidate.type === "company") {
        const left = companies.find((company) => company.id === candidate.leftId);
        const right = companies.find(
          (company) => company.id === candidate.rightId
        );

        if (!left || !right) {
          throw new Error("Could not load both company records.");
        }

        const [leftLoaded, rightLoaded] = await Promise.all([
          loadCompanyDetail(left),
          loadCompanyDetail(right),
        ]);

        setLeftDetail(leftLoaded);
        setRightDetail(rightLoaded);
      } else {
        const left = contacts.find((contact) => contact.id === candidate.leftId);
        const right = contacts.find(
          (contact) => contact.id === candidate.rightId
        );

        if (!left || !right) {
          throw new Error("Could not load both contact records.");
        }

        const [leftLoaded, rightLoaded] = await Promise.all([
          loadContactDetail(left),
          loadContactDetail(right),
        ]);

        setLeftDetail(leftLoaded);
        setRightDetail(rightLoaded);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load candidate details."
      );
    }
  }

      async function runMerge() {
    if (!selectedCandidate) return;
    if (mergeSlideValue < MERGE_SLIDE_COMPLETE_VALUE) return;

    const survivorId =
      survivorSide === "left"
        ? selectedCandidate.leftId
        : selectedCandidate.rightId;

    const duplicateId =
      survivorSide === "left"
        ? selectedCandidate.rightId
        : selectedCandidate.leftId;

    setWorking(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedCandidate.type,
          survivorId,
          duplicateId,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        survivorName?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Merge failed.");
      }

      const survivorName = result.survivorName || "the selected survivor";

      setSelectedCandidate(null);
      setSurvivorSide("left");
      setMergeSlideValue(0);

      await loadData();

      setSuccessMessage(
        `Merge complete. Archived duplicate and moved related records to ${survivorName}.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to merge records.";
      setErrorMessage(message);
    } finally {
      setWorking(false);
    }
  }

  function renderCandidate(candidate: MergeCandidate) {
    const selected =
      selectedCandidate?.type === candidate.type &&
      selectedCandidate.leftId === candidate.leftId &&
      selectedCandidate.rightId === candidate.rightId;

    return (
      <button
        key={`${candidate.type}-${candidate.leftId}-${candidate.rightId}`}
        type="button"
        onClick={() => void selectCandidate(candidate)}
        style={{
          ...cardStyle,
          width: "100%",
          textAlign: "left",
          color: "white",
          cursor: "pointer",
          borderColor: selected ? "#f5d76e" : "#333",
        }}
      >
        <strong>
          {candidate.leftName} ↔ {candidate.rightName}
        </strong>
        <p style={{ color: "#aaa", marginBottom: 0 }}>
          Score: {candidate.score} | {candidate.reasons.join(", ")}
        </p>
      </button>
    );
  }

  function renderDetailCard(
    label: string,
    detail: CompanyDetail | ContactDetail | null
  ) {
    if (!detail || !selectedCandidate) {
      return (
        <div style={cardStyle}>
          <strong>{label}</strong>
          <p style={{ color: "#aaa" }}>Select a candidate to review details.</p>
        </div>
      );
    }

    const title =
      selectedCandidate.type === "company"
        ? (detail as CompanyDetail).name
        : fullContactName(detail as ContactDetail);

    const fieldRows =
      selectedCandidate.type === "company"
        ? companyFieldRows(detail as CompanyDetail)
        : contactFieldRows(detail as ContactDetail);

    return (
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>
          {label}: {title}
        </h3>

        {fieldRows.map(([field, value]) => (
          <p key={field}>
            <strong>{field}:</strong> {value}
          </p>
        ))}

        <h4>Related Records</h4>
        {relationCountRows(detail, selectedCandidate.type).map(
          ([field, count]) => (
            <p key={field} style={{ margin: "6px 0" }}>
              <strong>{field}:</strong> {count}
            </p>
          )
        )}
      </div>
    );
  }

  const duplicateDetail = survivorSide === "left" ? rightDetail : leftDetail;

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/" style={{ color: "white" }}>
          ← Back to Dashboard
        </Link>
      </div>

      <h1>Merge Manager</h1>

      <p style={{ color: "#aaa", maxWidth: "950px", lineHeight: 1.5 }}>
        Find possible duplicate companies and contacts, review side-by-side,
        choose the surviving record, move related history, then archive the
        duplicate.
      </p>

      <UniversalDuplicateReview />

      {loading && <p>Loading merge candidates...</p>}

      {errorMessage && <p style={{ color: "#ff7777" }}>Error: {errorMessage}</p>}
      {successMessage && <p style={{ color: "#72e072" }}>{successMessage}</p>}

      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Possible Duplicate Companies</h2>
            <p style={{ color: "#aaa" }}>
              {companyCandidates.length} candidate pair(s) found.
            </p>

            <div style={{ display: "grid", gap: "10px" }}>
              {companyCandidates.length > 0 ? (
                companyCandidates.map(renderCandidate)
              ) : (
                <p style={{ color: "#aaa" }}>
                  No possible duplicate companies found.
                </p>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Possible Duplicate Contacts</h2>
            <p style={{ color: "#aaa" }}>
              {contactCandidates.length} candidate pair(s) found.
            </p>

            <div style={{ display: "grid", gap: "10px" }}>
              {contactCandidates.length > 0 ? (
                contactCandidates.map(renderCandidate)
              ) : (
                <p style={{ color: "#aaa" }}>
                  No possible duplicate contacts found.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {selectedCandidate && (
        <section style={{ marginTop: "28px" }}>
          <h2>Review Merge Candidate</h2>

          <p style={{ color: "#aaa" }}>
            Match reasons: {selectedCandidate.reasons.join(", ")}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {renderDetailCard(
              selectedCandidate.type === "company" ? "Company A" : "Contact A",
              leftDetail
            )}
            {renderDetailCard(
              selectedCandidate.type === "company" ? "Company B" : "Contact B",
              rightDetail
            )}
          </div>

          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <h3 style={{ marginTop: 0 }}>Merge Options</h3>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <button
                type="button"
                onClick={() => setSurvivorSide("left")}
                style={
                  survivorSide === "left" ? buttonStyle : secondaryButtonStyle
                }
              >
                Keep {selectedCandidate.type === "company" ? "Company A" : "Contact A"}
              </button>

              <button
                type="button"
                onClick={() => setSurvivorSide("right")}
                style={
                  survivorSide === "right" ? buttonStyle : secondaryButtonStyle
                }
              >
                Keep {selectedCandidate.type === "company" ? "Company B" : "Contact B"}
              </button>
            </div>

            {duplicateDetail && (
              <>
                <h4>Records To Move From Duplicate</h4>
                {relationCountRows(duplicateDetail, selectedCandidate.type).map(
                  ([field, count]) => (
                    <p key={field} style={{ margin: "6px 0" }}>
                      <strong>{field}:</strong> {count}
                    </p>
                  )
                )}
              </>
            )}

            <p style={{ color: "#f5d76e", marginTop: "18px" }}>
              The duplicate record will be archived, not permanently deleted.
            </p>

            <div style={{ marginTop: "14px" }}>
              <label
                htmlFor="merge-confirm-slider"
                style={{ display: "block", fontWeight: "bold" }}
              >
                Slide to confirm merge
              </label>

              <input
                id="merge-confirm-slider"
                type="range"
                min="0"
                max={MERGE_SLIDE_COMPLETE_VALUE}
                value={mergeSlideValue}
                onChange={(event) =>
                  setMergeSlideValue(Number(event.target.value))
                }
                style={{
                  width: "25%",
                  minWidth: "240px",
                  maxWidth: "320px",
                  marginTop: "12px",
                  cursor: "grab",
                  display: "block",
                }}
              />

              <p
                style={{
                  color:
                    mergeSlideValue >= MERGE_SLIDE_COMPLETE_VALUE
                      ? "#72e072"
                      : "#aaa",
                  marginTop: "8px",
                }}
              >
                {mergeSlideValue >= MERGE_SLIDE_COMPLETE_VALUE
                  ? "Merge unlocked."
                  : "Drag the slider all the way right to unlock the Merge button."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void runMerge()}
              disabled={working || mergeSlideValue < MERGE_SLIDE_COMPLETE_VALUE}
              style={{ ...dangerButtonStyle, marginTop: "14px" }}
            >
              {working ? "Merging..." : "Merge"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}





