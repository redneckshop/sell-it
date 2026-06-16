"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

const MAX_ROWS_PER_TYPE = 150;
const MAX_CANDIDATES_PER_TYPE = 40;
const MAX_VISIBLE_CANDIDATES_PER_TYPE = 6;
const MERGE_SLIDE_COMPLETE_VALUE = 100;

type DuplicateType =
  | "opportunity"
  | "task"
  | "activity"
  | "note"
  | "community"
  | "post"
  | "pain_point";

type MergeableType = "note" | "task" | "pain_point";

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

type RecordMoveCounts = {
  attachments: number;
  companies: number;
  contacts: number;
  activities: number;
  posts: number;
};

type CandidateMoveCounts = {
  loaded: boolean;
  error: string;
  left: RecordMoveCounts;
  right: RecordMoveCounts;
};

type MergeState = {
  survivorId: string;
  slideValue: number;
  allowPermanentDelete: boolean;
  working: boolean;
  message: string;
  error: string;
};

const emptyMoveCounts: RecordMoveCounts = {
  attachments: 0,
  companies: 0,
  contacts: 0,
  activities: 0,
  posts: 0,
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

const smallButtonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  border: "none",
  borderRadius: "6px",
  padding: "8px 10px",
  fontWeight: "bold",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  ...smallButtonStyle,
  backgroundColor: "#ffdddd",
};

const mutedTextStyle: CSSProperties = {
  color: "#aaa",
  lineHeight: 1.5,
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

function isMergeableType(type: DuplicateType): type is MergeableType {
  return type === "note" || type === "task" || type === "pain_point";
}

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

function candidateKey(candidate: DuplicateCandidate) {
  return `${candidate.type}-${candidate.left.id}-${candidate.right.id}`;
}

function fieldPreviewValue(row: GenericRow, key: string) {
  const value = getValue(row, key);

  if (!value) {
    return "-";
  }

  return value.length > 180 ? `${value.slice(0, 180)}...` : value;
}

function fieldsForType(type: DuplicateType) {
  if (type === "note") {
    return [
      "title",
      "body",
      "source",
      "source_url",
      "tags",
      "company_id",
      "contact_id",
      "opportunity_id",
      "created_at",
    ];
  }

  if (type === "task") {
    return [
      "title",
      "description",
      "status",
      "priority",
      "due_date",
      "company_id",
      "contact_id",
      "opportunity_id",
      "created_at",
    ];
  }

  if (type === "pain_point") {
    return ["name", "description", "category", "created_at"];
  }

  return [
    "name",
    "title",
    "subject",
    "stage",
    "status",
    "category",
    "platform",
    "created_at",
  ];
}

async function countRows(tableName: string, columnName: string, id: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .eq(columnName, id);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }

  return (data ?? []).length;
}

async function loadRecordMoveCounts(type: DuplicateType, id: string) {
  const counts = { ...emptyMoveCounts };

  if (type === "note") {
    counts.attachments = await countRows("attachments", "related_note_id", id);
  }

  if (type === "task") {
    counts.attachments = await countRows("attachments", "related_task_id", id);
  }

  if (type === "pain_point") {
    const [companies, contacts, activities, posts] = await Promise.all([
      countRows("pain_point_companies", "pain_point_id", id),
      countRows("pain_point_contacts", "pain_point_id", id),
      countRows("pain_point_activities", "pain_point_id", id),
      countRows("pain_point_posts", "pain_point_id", id),
    ]);

    counts.companies = companies;
    counts.contacts = contacts;
    counts.activities = activities;
    counts.posts = posts;
  }

  return counts;
}

function buildMergePlan(
  type: MergeableType,
  duplicateCounts: RecordMoveCounts,
  allowPermanentDelete: boolean
) {
  if (type === "note") {
    return [
      "Keep the selected note as the survivor.",
      "Copy useful duplicate note body content into the survivor only when it is not already contained there.",
      "Fill blank survivor fields from the duplicate where safe: title, source, source URL, tags, company, contact, and opportunity.",
      `Move ${duplicateCounts.attachments} attachment(s) from the duplicate note to the survivor note.`,
      allowPermanentDelete
        ? "If archive fields are missing, the duplicate note may be permanently deleted after this confirmation."
        : "Archive the duplicate note if archive fields exist. If archive fields are missing, stop instead of deleting.",
    ];
  }

  if (type === "task") {
    return [
      "Keep the selected task as the survivor.",
      "Copy useful duplicate task description content into the survivor only when it is not already contained there.",
      "Fill blank survivor fields from the duplicate where safe: title, status, priority, due date, company, contact, and opportunity.",
      `Move ${duplicateCounts.attachments} attachment(s) from the duplicate task to the survivor task.`,
      allowPermanentDelete
        ? "If archive fields are missing, the duplicate task may be permanently deleted after this confirmation."
        : "Archive the duplicate task if archive fields exist. If archive fields are missing, stop instead of deleting.",
    ];
  }

  return [
    "Keep the selected pain point as the survivor.",
    "Copy useful duplicate pain point description content into the survivor only when it is not already contained there.",
    "Fill blank survivor fields from the duplicate where safe: name and category.",
    `Move ${duplicateCounts.companies} company relationship(s), skipping duplicates.`,
    `Move ${duplicateCounts.contacts} contact relationship(s), skipping duplicates.`,
    `Move ${duplicateCounts.activities} activity relationship(s), skipping duplicates.`,
    `Move ${duplicateCounts.posts} post relationship(s), skipping duplicates.`,
    allowPermanentDelete
      ? "If archive fields are missing, the duplicate pain point may be permanently deleted after this confirmation."
      : "Archive the duplicate pain point if archive fields exist. If archive fields are missing, stop instead of deleting.",
  ];
}

export default function UniversalDuplicateReview() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SectionResult[]>([]);
  const [activeType, setActiveType] = useState<DuplicateType>("opportunity");
  const [mergeStates, setMergeStates] = useState<Record<string, MergeState>>({});
  const [moveCounts, setMoveCounts] = useState<Record<string, CandidateMoveCounts>>({});

  async function loadUniversalDuplicates() {
    setLoading(true);

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

    setResults(nextResults);
    setLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      await loadUniversalDuplicates();

      if (!isMounted) {
        return;
      }
    }

    void loadInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCountsForVisibleMergeCandidates() {
      const nextCounts: Record<string, CandidateMoveCounts> = {};

      const visibleMergeCandidates = results.flatMap((section) =>
        isMergeableType(section.definition.type)
          ? section.candidates.slice(0, MAX_VISIBLE_CANDIDATES_PER_TYPE)
          : []
      );

      await Promise.all(
        visibleMergeCandidates.map(async (candidate) => {
          const key = candidateKey(candidate);

          try {
            const [leftCounts, rightCounts] = await Promise.all([
              loadRecordMoveCounts(candidate.type, candidate.left.id),
              loadRecordMoveCounts(candidate.type, candidate.right.id),
            ]);

            nextCounts[key] = {
              loaded: true,
              error: "",
              left: leftCounts,
              right: rightCounts,
            };
          } catch (error) {
            nextCounts[key] = {
              loaded: true,
              error:
                error instanceof Error
                  ? error.message
                  : "Could not load move counts.",
              left: { ...emptyMoveCounts },
              right: { ...emptyMoveCounts },
            };
          }
        })
      );

      if (isMounted) {
        setMoveCounts(nextCounts);
      }
    }

    if (!loading) {
      void loadCountsForVisibleMergeCandidates();
    }

    return () => {
      isMounted = false;
    };
  }, [loading, results]);

  const totalCandidates = useMemo(
    () => results.reduce((total, section) => total + section.candidates.length, 0),
    [results]
  );

  const activeSection =
    results.find((section) => section.definition.type === activeType) ??
    results[0] ??
    null;

  function getMergeState(candidate: DuplicateCandidate) {
    const key = candidateKey(candidate);

    return (
      mergeStates[key] ?? {
        survivorId: candidate.left.id,
        slideValue: 0,
        allowPermanentDelete: false,
        working: false,
        message: "",
        error: "",
      }
    );
  }

  function updateMergeState(
    candidate: DuplicateCandidate,
    values: Partial<MergeState>
  ) {
    const key = candidateKey(candidate);
    const currentState = getMergeState(candidate);

    setMergeStates((current) => ({
      ...current,
      [key]: {
        ...currentState,
        ...values,
      },
    }));
  }

  async function handleSafeMerge(candidate: DuplicateCandidate) {
    if (!isMergeableType(candidate.type)) {
      return;
    }

    const state = getMergeState(candidate);
    const survivorId = state.survivorId;
    const duplicateId =
      survivorId === candidate.left.id ? candidate.right.id : candidate.left.id;

    if (state.slideValue < MERGE_SLIDE_COMPLETE_VALUE) {
      updateMergeState(candidate, {
        error: "Slide all the way to confirm before merging.",
        message: "",
      });
      return;
    }

    updateMergeState(candidate, {
      working: true,
      error: "",
      message: "",
    });

    try {
      const response = await fetch("/api/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: candidate.type,
          survivorId,
          duplicateId,
          allowPermanentDelete: state.allowPermanentDelete,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Merge failed.");
      }

      updateMergeState(candidate, {
        working: false,
        slideValue: 0,
        message: `Merged successfully. Duplicate disposition: ${
          result.duplicateDisposition || "handled safely"
        }.`,
        error: "",
      });

      await loadUniversalDuplicates();
    } catch (error) {
      updateMergeState(candidate, {
        working: false,
        slideValue: 0,
        message: "",
        error: error instanceof Error ? error.message : "Merge failed.",
      });
    }
  }

  return (
    <section style={{ marginTop: "24px", marginBottom: "28px" }}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Universal Duplicate Review</h2>

        <p style={mutedTextStyle}>
          Cleaner duplicate detection for opportunities, tasks, activities,
          notes, communities, posts, and pain points. Safe merge actions are now
          enabled only for notes, tasks, and pain points.
        </p>

        <p style={{ color: "#f5d76e", marginBottom: 0 }}>
          Merge-enabled: Notes, Tasks, Pain Points. Review-only:
          Opportunities, Activities, Communities, Posts.
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
              const mergeEnabled = isMergeableType(section.definition.type);

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
                  <p
                    style={{
                      color: mergeEnabled ? "#9cff9c" : "#777",
                      margin: "8px 0 0",
                      fontSize: "13px",
                    }}
                  >
                    {mergeEnabled ? "Safe merge enabled" : "Review-only"}
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
                  maxHeight: "760px",
                  overflowY: "auto",
                  paddingRight: "6px",
                }}
              >
                {activeSection.candidates.length > 0 ? (
                  activeSection.candidates
                    .slice(0, MAX_VISIBLE_CANDIDATES_PER_TYPE)
                    .map((candidate) => {
                      const key = candidateKey(candidate);
                      const mergeState = getMergeState(candidate);
                      const counts = moveCounts[key] ?? {
                        loaded: false,
                        error: "",
                        left: { ...emptyMoveCounts },
                        right: { ...emptyMoveCounts },
                      };

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

                      const mergeEnabled = isMergeableType(candidate.type);
                      const survivorIsLeft = mergeState.survivorId === candidate.left.id;
                      const survivorLabel = survivorIsLeft
                        ? candidate.leftLabel
                        : candidate.rightLabel;
                      const duplicateLabel = survivorIsLeft
                        ? candidate.rightLabel
                        : candidate.leftLabel;
                      const duplicateCounts = survivorIsLeft
                        ? counts.right
                        : counts.left;

                      return (
                        <div
                          key={key}
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
                            <div
                              style={{
                                border: survivorIsLeft && mergeEnabled ? "1px solid #9cff9c" : "1px solid #333",
                                borderRadius: "8px",
                                padding: "12px",
                              }}
                            >
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
                                <p style={{ color: "#777" }}>
                                  {leftSecondary}
                                </p>
                              )}

                              {mergeEnabled && (
                                <label style={{ color: "#9cff9c", fontWeight: "bold" }}>
                                  <input
                                    type="radio"
                                    name={`${key}-survivor`}
                                    checked={survivorIsLeft}
                                    onChange={() =>
                                      updateMergeState(candidate, {
                                        survivorId: candidate.left.id,
                                        slideValue: 0,
                                        message: "",
                                        error: "",
                                      })
                                    }
                                    style={{ marginRight: "8px" }}
                                  />
                                  Keep A
                                </label>
                              )}

                              <div style={{ marginTop: "12px" }}>
                                {fieldsForType(candidate.type).map((field) => (
                                  <p key={field} style={{ color: "#aaa", margin: "6px 0" }}>
                                    <strong style={{ color: "#ddd" }}>{field}:</strong>{" "}
                                    {fieldPreviewValue(candidate.left, field)}
                                  </p>
                                ))}
                              </div>

                              {mergeEnabled && (
                                <p style={{ color: "#aaa" }}>
                                  Move counts: {counts.loaded ? (
                                    <>
                                      {candidate.type === "pain_point"
                                        ? `${counts.left.companies} companies, ${counts.left.contacts} contacts, ${counts.left.activities} activities, ${counts.left.posts} posts`
                                        : `${counts.left.attachments} attachments`}
                                    </>
                                  ) : (
                                    "loading..."
                                  )}
                                </p>
                              )}
                            </div>

                            <div
                              style={{
                                border: !survivorIsLeft && mergeEnabled ? "1px solid #9cff9c" : "1px solid #333",
                                borderRadius: "8px",
                                padding: "12px",
                              }}
                            >
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
                                <p style={{ color: "#777" }}>
                                  {rightSecondary}
                                </p>
                              )}

                              {mergeEnabled && (
                                <label style={{ color: "#9cff9c", fontWeight: "bold" }}>
                                  <input
                                    type="radio"
                                    name={`${key}-survivor`}
                                    checked={!survivorIsLeft}
                                    onChange={() =>
                                      updateMergeState(candidate, {
                                        survivorId: candidate.right.id,
                                        slideValue: 0,
                                        message: "",
                                        error: "",
                                      })
                                    }
                                    style={{ marginRight: "8px" }}
                                  />
                                  Keep B
                                </label>
                              )}

                              <div style={{ marginTop: "12px" }}>
                                {fieldsForType(candidate.type).map((field) => (
                                  <p key={field} style={{ color: "#aaa", margin: "6px 0" }}>
                                    <strong style={{ color: "#ddd" }}>{field}:</strong>{" "}
                                    {fieldPreviewValue(candidate.right, field)}
                                  </p>
                                ))}
                              </div>

                              {mergeEnabled && (
                                <p style={{ color: "#aaa" }}>
                                  Move counts: {counts.loaded ? (
                                    <>
                                      {candidate.type === "pain_point"
                                        ? `${counts.right.companies} companies, ${counts.right.contacts} contacts, ${counts.right.activities} activities, ${counts.right.posts} posts`
                                        : `${counts.right.attachments} attachments`}
                                    </>
                                  ) : (
                                    "loading..."
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          {mergeEnabled ? (
                            <div
                              style={{
                                border: "1px solid #333",
                                borderRadius: "8px",
                                padding: "12px",
                                marginTop: "14px",
                                backgroundColor: "#101010",
                              }}
                            >
                              <h4 style={{ marginTop: 0 }}>Safe Merge Plan</h4>

                              <p style={{ color: "#aaa" }}>
                                Survivor: <strong style={{ color: "#9cff9c" }}>{survivorLabel}</strong>
                                <br />
                                Duplicate to archive/remove safely:{" "}
                                <strong style={{ color: "#ffdddd" }}>{duplicateLabel}</strong>
                              </p>

                              {counts.error && (
                                <p style={{ color: "#ff7777" }}>
                                  Move count warning: {counts.error}
                                </p>
                              )}

                              <ul style={{ color: "#aaa", lineHeight: 1.5 }}>
                                {buildMergePlan(
                                  candidate.type as MergeableType,
                                  duplicateCounts,
                                  mergeState.allowPermanentDelete
                                ).map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>

                              <label
                                style={{
                                  display: "block",
                                  color: "#ffdddd",
                                  marginTop: "12px",
                                  lineHeight: 1.5,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={mergeState.allowPermanentDelete}
                                  onChange={(event) =>
                                    updateMergeState(candidate, {
                                      allowPermanentDelete: event.target.checked,
                                      slideValue: 0,
                                      message: "",
                                      error: "",
                                    })
                                  }
                                  style={{ marginRight: "8px" }}
                                />
                                Allow permanent delete only if archive fields are missing.
                              </label>

                              <div style={{ marginTop: "14px" }}>
                                <label style={{ color: "#f5d76e", fontWeight: "bold" }}>
                                  Slide to confirm merge
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max={MERGE_SLIDE_COMPLETE_VALUE}
                                  value={mergeState.slideValue}
                                  onChange={(event) =>
                                    updateMergeState(candidate, {
                                      slideValue: Number(event.target.value),
                                      message: "",
                                      error: "",
                                    })
                                  }
                                  style={{ display: "block", width: "25%", minWidth: "180px", marginTop: "8px" }}
                                />
                                <p style={{ color: "#aaa", marginBottom: 0 }}>
                                  Confirmation: {mergeState.slideValue}%
                                </p>
                              </div>

                              {mergeState.error && (
                                <p style={{ color: "#ff7777" }}>{mergeState.error}</p>
                              )}

                              {mergeState.message && (
                                <p style={{ color: "#9cff9c" }}>{mergeState.message}</p>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSafeMerge(candidate)}
                                disabled={
                                  mergeState.working ||
                                  mergeState.slideValue < MERGE_SLIDE_COMPLETE_VALUE
                                }
                                style={{
                                  ...dangerButtonStyle,
                                  marginTop: "14px",
                                  opacity:
                                    mergeState.working ||
                                    mergeState.slideValue < MERGE_SLIDE_COMPLETE_VALUE
                                      ? 0.5
                                      : 1,
                                }}
                              >
                                {mergeState.working ? "Merging..." : "Merge Selected Records"}
                              </button>
                            </div>
                          ) : (
                            <p style={{ color: "#f5d76e", marginBottom: 0 }}>
                              Review-only for now. Merge actions are intentionally disabled for this record type.
                            </p>
                          )}
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
