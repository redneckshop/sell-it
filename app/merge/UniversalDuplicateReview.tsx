"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

const MAX_ROWS_PER_TYPE = 150;
const MAX_CANDIDATES_PER_TYPE = 40;
const MAX_VISIBLE_CANDIDATES_PER_TYPE = 6;

type DuplicateType =
  | "opportunity"
  | "task"
  | "activity"
  | "note"
  | "community"
  | "post"
  | "pain_point";

type GenericRow = {
  id: string;
  [key: string]: unknown;
};

type MatchField = {
  key: string;
  label: string;
  score: number;
  kind: "exact" | "url" | "text";
  identity?: boolean;
};

type DuplicateDefinition = {
  type: DuplicateType;
  title: string;
  description: string;
  tableName: string;
  selectColumns: string;
  fallbackSelectColumns: string;
  orderColumn: string;
  routePrefix: string;
  labelKeys: string[];
  matchFields: MatchField[];
};

type DuplicateCandidate = {
  type: DuplicateType;
  left: GenericRow;
  right: GenericRow;
  leftLabel: string;
  rightLabel: string;
  score: number;
  reasons: string[];
};

type SectionResult = {
  definition: DuplicateDefinition;
  candidates: DuplicateCandidate[];
  error: string;
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

const candidateCardStyle: CSSProperties = {
  ...cardStyle,
  backgroundColor: "#151515",
  padding: "14px",
};

const sectionDefinitions: DuplicateDefinition[] = [
  {
    type: "opportunity",
    title: "Possible Duplicate Opportunities",
    description: "Similar opportunity names, next steps, notes, company links, and contact links.",
    tableName: "opportunities",
    selectColumns: "id, name, company_id, primary_contact_id, opportunity_type, stage, lead_temperature, next_step, notes, is_archived, created_at",
    fallbackSelectColumns: "id, name, company_id, primary_contact_id, opportunity_type, stage, lead_temperature, next_step, notes, created_at",
    orderColumn: "name",
    routePrefix: "/opportunities",
    labelKeys: ["name"],
    matchFields: [
      { key: "company_id", label: "Same company", score: 12, kind: "exact" },
      { key: "primary_contact_id", label: "Same primary contact", score: 12, kind: "exact" },
      { key: "next_step", label: "Similar next step", score: 18, kind: "text", identity: true },
      { key: "notes", label: "Similar notes", score: 18, kind: "text", identity: true },
    ],
  },
  {
    type: "task",
    title: "Possible Duplicate Tasks",
    description: "Similar task titles, due dates, status, company links, contact links, and opportunity links.",
    tableName: "tasks",
    selectColumns: "id, title, description, status, priority, due_date, company_id, contact_id, opportunity_id, is_archived, created_at",
    fallbackSelectColumns: "id, title, description, status, priority, due_date, company_id, contact_id, opportunity_id, created_at",
    orderColumn: "title",
    routePrefix: "/tasks",
    labelKeys: ["title"],
    matchFields: [
      { key: "opportunity_id", label: "Same opportunity", score: 16, kind: "exact" },
      { key: "company_id", label: "Same company", score: 10, kind: "exact" },
      { key: "contact_id", label: "Same contact", score: 10, kind: "exact" },
      { key: "due_date", label: "Same due date", score: 10, kind: "exact" },
      { key: "description", label: "Similar description", score: 16, kind: "text", identity: true },
    ],
  },
  {
    type: "activity",
    title: "Possible Duplicate Activities",
    description: "Similar activity subjects, outcomes, types, task links, opportunity links, company links, and contact links.",
    tableName: "activities",
    selectColumns: "id, subject, activity_type, activity_date, outcome, follow_up_needed, company_id, contact_id, task_id, opportunity_id, is_archived, created_at",
    fallbackSelectColumns: "id, subject, activity_type, activity_date, outcome, follow_up_needed, company_id, contact_id, task_id, opportunity_id, created_at",
    orderColumn: "subject",
    routePrefix: "/activities",
    labelKeys: ["subject"],
    matchFields: [
      { key: "activity_type", label: "Same activity type", score: 8, kind: "exact" },
      { key: "outcome", label: "Same outcome", score: 8, kind: "exact" },
      { key: "task_id", label: "Same task", score: 14, kind: "exact" },
      { key: "opportunity_id", label: "Same opportunity", score: 16, kind: "exact" },
      { key: "company_id", label: "Same company", score: 10, kind: "exact" },
      { key: "contact_id", label: "Same contact", score: 10, kind: "exact" },
    ],
  },
  {
    type: "note",
    title: "Possible Duplicate Notes",
    description: "Similar note titles, bodies, source URLs, company links, contact links, and opportunity links.",
    tableName: "notes",
    selectColumns: "id, title, body, source, source_url, tags, company_id, contact_id, opportunity_id, is_archived, created_at",
    fallbackSelectColumns: "id, title, body, source, source_url, tags, company_id, contact_id, opportunity_id, created_at",
    orderColumn: "title",
    routePrefix: "/notes",
    labelKeys: ["title", "body"],
    matchFields: [
      { key: "source_url", label: "Same source URL", score: 45, kind: "url", identity: true },
      { key: "body", label: "Similar note body", score: 30, kind: "text", identity: true },
      { key: "company_id", label: "Same company", score: 10, kind: "exact" },
      { key: "contact_id", label: "Same contact", score: 10, kind: "exact" },
      { key: "opportunity_id", label: "Same opportunity", score: 14, kind: "exact" },
    ],
  },
  {
    type: "community",
    title: "Possible Duplicate Communities",
    description: "Similar community names, same URLs, platform matches, industry matches, and location-focus matches.",
    tableName: "communities",
    selectColumns: "id, name, platform, url, description, member_count, industry, location_focus, status, tags, is_archived, created_at",
    fallbackSelectColumns: "id, name, platform, url, description, member_count, industry, location_focus, status, tags, created_at",
    orderColumn: "name",
    routePrefix: "/communities",
    labelKeys: ["name"],
    matchFields: [
      { key: "url", label: "Same URL", score: 50, kind: "url", identity: true },
      { key: "platform", label: "Same platform", score: 8, kind: "exact" },
      { key: "industry", label: "Same industry", score: 8, kind: "exact" },
      { key: "location_focus", label: "Similar location focus", score: 8, kind: "text" },
      { key: "description", label: "Similar description", score: 16, kind: "text", identity: true },
    ],
  },
  {
    type: "post",
    title: "Possible Duplicate Posts",
    description: "Similar post titles, same post URLs, same communities, same platforms, and similar original post text.",
    tableName: "posts",
    selectColumns: "id, title, platform, post_type, post_url, post_date, original_post_text, comment_count, reaction_count, share_count, follow_up_needed, tags, community_id, is_archived, created_at",
    fallbackSelectColumns: "id, title, platform, post_type, post_url, post_date, original_post_text, comment_count, reaction_count, share_count, follow_up_needed, tags, community_id, created_at",
    orderColumn: "title",
    routePrefix: "/posts",
    labelKeys: ["title", "original_post_text"],
    matchFields: [
      { key: "post_url", label: "Same post URL", score: 55, kind: "url", identity: true },
      { key: "original_post_text", label: "Similar original text", score: 30, kind: "text", identity: true },
      { key: "community_id", label: "Same community", score: 14, kind: "exact" },
      { key: "platform", label: "Same platform", score: 8, kind: "exact" },
    ],
  },
  {
    type: "pain_point",
    title: "Possible Duplicate Pain Points",
    description: "Similar pain point names, descriptions, and categories.",
    tableName: "pain_points",
    selectColumns: "id, name, description, category, is_archived, created_at",
    fallbackSelectColumns: "id, name, description, category, created_at",
    orderColumn: "name",
    routePrefix: "/pain-points",
    labelKeys: ["name"],
    matchFields: [
      { key: "description", label: "Similar description", score: 25, kind: "text", identity: true },
      { key: "category", label: "Same category", score: 10, kind: "exact" },
    ],
  },
];

function getValue(row: GenericRow, key: string) {
  const value = row[key];

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function isArchived(row: GenericRow) {
  return row.is_archived === true;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(llc|inc|incorporated|company|co|corp|corporation|ltd|limited)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeUrl(value: string | null | undefined) {
  const text = (value ?? "").trim().toLowerCase();

  if (!text) {
    return "";
  }

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

function textTokens(value: string | null | undefined) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2);
}

function similarText(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  if (
    normalizedLeft.length >= 6 &&
    normalizedRight.length >= 6 &&
    (normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft))
  ) {
    return true;
  }

  const leftTokens = new Set(textTokens(left));
  const rightTokens = new Set(textTokens(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return false;
  }

  let sharedCount = 0;

  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      sharedCount += 1;
    }
  });

  const containment = sharedCount / Math.min(leftTokens.size, rightTokens.size);
  const similarity = sharedCount / Math.max(leftTokens.size, rightTokens.size);

  return containment >= 0.72 || similarity >= 0.72;
}

function getLabel(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = getValue(row, key).trim();

    if (value) {
      return value.length > 90 ? `${value.slice(0, 90)}...` : value;
    }
  }

  return "Untitled record";
}

function compareField(left: GenericRow, right: GenericRow, field: MatchField) {
  const leftValue = getValue(left, field.key);
  const rightValue = getValue(right, field.key);

  if (!leftValue || !rightValue) {
    return false;
  }

  if (field.kind === "url") {
    const leftUrl = normalizeUrl(leftValue);
    const rightUrl = normalizeUrl(rightValue);

    return Boolean(leftUrl && rightUrl && leftUrl === rightUrl);
  }

  if (field.kind === "text") {
    return similarText(leftValue, rightValue);
  }

  return leftValue === rightValue;
}

function buildCandidates(definition: DuplicateDefinition, rows: GenericRow[]) {
  const activeRows = rows.filter((row) => !isArchived(row));
  const candidates: DuplicateCandidate[] = [];

  for (let i = 0; i < activeRows.length; i += 1) {
    for (let j = i + 1; j < activeRows.length; j += 1) {
      const left = activeRows[i];
      const right = activeRows[j];
      const leftLabel = getLabel(left, definition.labelKeys);
      const rightLabel = getLabel(right, definition.labelKeys);
      const reasons: string[] = [];
      let score = 0;
      let identityMatch = false;

      if (similarText(leftLabel, rightLabel)) {
        reasons.push("Similar name/title");
        score += normalizeText(leftLabel) === normalizeText(rightLabel) ? 50 : 30;
        identityMatch = true;
      }

      for (const field of definition.matchFields) {
        if (compareField(left, right, field)) {
          reasons.push(field.label);
          score += field.score;

          if (field.identity) {
            identityMatch = true;
          }
        }
      }

      if (identityMatch && score >= 35) {
        candidates.push({
          type: definition.type,
          left,
          right,
          leftLabel,
          rightLabel,
          score,
          reasons,
        });
      }
    }
  }

  return candidates
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_CANDIDATES_PER_TYPE);
}

async function fetchRows(definition: DuplicateDefinition) {
  async function runSelect(selectColumns: string, includeOrder: boolean) {
    let query = supabase
      .from(definition.tableName)
      .select(selectColumns)
      .limit(MAX_ROWS_PER_TYPE);

    if (includeOrder) {
      query = query.order(definition.orderColumn, { ascending: true });
    }

    return await query;
  }

  let result = await runSelect(definition.selectColumns, true);

  if (result.error) {
    result = await runSelect(definition.fallbackSelectColumns, true);
  }

  if (result.error) {
    result = await runSelect(definition.fallbackSelectColumns, false);
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []) as unknown as GenericRow[];
}

function formatSecondaryValue(key: string, value: string) {
  if (!value) {
    return "";
  }

  if (key === "created_at" || key === "updated_at" || key.endsWith("_date")) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  return value.length > 90 ? `${value.slice(0, 90)}...` : value;
}

function secondaryLine(row: GenericRow, keys: string[]) {
  return keys
    .map((key) => formatSecondaryValue(key, getValue(row, key)))
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");
}

export default function UniversalDuplicateReview() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SectionResult[]>([]);
  const [activeType, setActiveType] = useState<DuplicateType>("opportunity");

  useEffect(() => {
    let isMounted = true;

    async function loadUniversalDuplicates() {
      const nextResults: SectionResult[] = [];

      for (const definition of sectionDefinitions) {
        try {
          const rows = await fetchRows(definition);
          nextResults.push({
            definition,
            candidates: buildCandidates(definition, rows),
            error: "",
          });
        } catch (error) {
          nextResults.push({
            definition,
            candidates: [],
            error: error instanceof Error ? error.message : "Failed to load.",
          });
        }
      }

      if (isMounted) {
        setResults(nextResults);
        setLoading(false);
      }
    }

    void loadUniversalDuplicates();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCandidates = useMemo(
    () => results.reduce((total, section) => total + section.candidates.length, 0),
    [results]
  );

  const activeSection =
    results.find((section) => section.definition.type === activeType) ??
    results[0] ??
    null;

  return (
    <section style={{ marginTop: "24px", marginBottom: "28px" }}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Universal Duplicate Review</h2>

        <p style={{ color: "#aaa", lineHeight: 1.5 }}>
          Cleaner review-only duplicate detection for opportunities, tasks,
          activities, notes, communities, posts, and pain points. Company and
          contact merge actions remain below. Other record types will get merge
          actions after this review screen is verified.
        </p>

        <p style={{ color: "#aaa", marginBottom: 0 }}>
          {loading
            ? "Loading universal duplicate candidates..."
            : `${totalCandidates} candidate pair(s) found across ${sectionDefinitions.length} additional record types.`}
        </p>
      </div>

      {!loading && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {results.map((section) => {
              const isActive = section.definition.type === activeType;

              return (
                <button
                  key={section.definition.type}
                  type="button"
                  onClick={() => setActiveType(section.definition.type)}
                  style={{
                    ...cardStyle,
                    textAlign: "left",
                    color: "white",
                    cursor: "pointer",
                    borderColor: isActive ? "#f5d76e" : "#333",
                    backgroundColor: isActive ? "#222" : "#1a1a1a",
                  }}
                >
                  <strong>{section.definition.title.replace("Possible Duplicate ", "")}</strong>
                  <p style={{ color: "#aaa", margin: "8px 0 0" }}>
                    {section.error
                      ? "Error"
                      : `${section.candidates.length} candidate pair(s)`}
                  </p>
                </button>
              );
            })}
          </div>

          {activeSection && (
            <section style={{ ...cardStyle, marginTop: "18px" }}>
              <h3 style={{ marginTop: 0 }}>{activeSection.definition.title}</h3>

              <p style={{ color: "#aaa" }}>
                {activeSection.definition.description}
              </p>

              {activeSection.error && (
                <p style={{ color: "#ff7777" }}>
                  Could not load this section: {activeSection.error}
                </p>
              )}

              {!activeSection.error && (
                <>
                  <p style={{ color: "#aaa" }}>
                    {activeSection.candidates.length} candidate pair(s) found.
                  </p>

                  {activeSection.candidates.length > MAX_VISIBLE_CANDIDATES_PER_TYPE && (
                    <p style={{ color: "#f5d76e" }}>
                      Showing the top {MAX_VISIBLE_CANDIDATES_PER_TYPE}. More cleanup candidates exist.
                    </p>
                  )}
                </>
              )}

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  maxHeight: "560px",
                  overflowY: "auto",
                  paddingRight: "6px",
                }}
              >
                {activeSection.candidates.length > 0 ? (
                  activeSection.candidates
                    .slice(0, MAX_VISIBLE_CANDIDATES_PER_TYPE)
                    .map((candidate) => {
                      const leftSecondary = secondaryLine(candidate.left, [
                        "stage",
                        "status",
                        "outcome",
                        "category",
                        "platform",
                        "due_date",
                        "created_at",
                      ]);

                      const rightSecondary = secondaryLine(candidate.right, [
                        "stage",
                        "status",
                        "outcome",
                        "category",
                        "platform",
                        "due_date",
                        "created_at",
                      ]);

                      return (
                        <div
                          key={`${candidate.type}-${candidate.left.id}-${candidate.right.id}`}
                          style={candidateCardStyle}
                        >
                          <p style={{ color: "#aaa", marginTop: 0 }}>
                            Score: {candidate.score} | {candidate.reasons.join(", ")}
                          </p>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <strong>A</strong>
                              <h4 style={{ margin: "6px 0" }}>
                                <Link
                                  href={`${activeSection.definition.routePrefix}/${candidate.left.id}`}
                                  style={{ color: "white" }}
                                >
                                  {candidate.leftLabel}
                                </Link>
                              </h4>
                              {leftSecondary && (
                                <p style={{ color: "#777", marginBottom: 0 }}>
                                  {leftSecondary}
                                </p>
                              )}
                            </div>

                            <div>
                              <strong>B</strong>
                              <h4 style={{ margin: "6px 0" }}>
                                <Link
                                  href={`${activeSection.definition.routePrefix}/${candidate.right.id}`}
                                  style={{ color: "white" }}
                                >
                                  {candidate.rightLabel}
                                </Link>
                              </h4>
                              {rightSecondary && (
                                <p style={{ color: "#777", marginBottom: 0 }}>
                                  {rightSecondary}
                                </p>
                              )}
                            </div>
                          </div>

                          <p style={{ color: "#f5d76e", marginBottom: 0 }}>
                            Review-only for now. Merge action will be added after this screen is clean.
                          </p>
                        </div>
                      );
                    })
                ) : (
                  <p style={{ color: "#aaa" }}>No candidates found.</p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
