"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { supabase } from "../lib/supabase";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../lib/actingUser";
import { createWorkLogEntry } from "../lib/workLog";

type EmailSourceType =
  | "Incoming Email"
  | "Outgoing Email"
  | "Shared Mailbox Email";

type EmailReview = {
  company: string;
  contact: string;
  opportunity: string;
  taskTitle: string;
  taskDescription: string;
  activitySubject: string;
  activitySummary: string;
  painPoints: string;
  urgency: string;
  followUpNeeded: boolean;
  suggestedNextAction: string;
};

const emptyReview: EmailReview = {
  company: "",
  contact: "",
  opportunity: "",
  taskTitle: "",
  taskDescription: "",
  activitySubject: "",
  activitySummary: "",
  painPoints: "",
  urgency: "",
  followUpNeeded: false,
  suggestedNextAction: "",
};

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type SavedRecords = {
  companyId: string;
  contactId: string;
  opportunityId: string;
  taskId: string;
  activityId: string;
  attachmentId: string;
  painPointIds: string[];
};

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function nullableText(value: string) {
  const cleaned = cleanText(value);

  return cleaned ? cleaned : null;
}

function isJsonLikeText(value: string) {
  const cleaned = value.trim();

  if (!cleaned) return false;

  if (
    (cleaned.startsWith("{") && cleaned.endsWith("}")) ||
    (cleaned.startsWith("[") && cleaned.endsWith("]"))
  ) {
    return true;
  }

  const lower = cleaned.toLowerCase();

  return (
    lower.includes("```json") ||
    (lower.includes('"company"') &&
      lower.includes('"contact"') &&
      lower.includes('"opportunity"'))
  );
}

function userSafeErrorMessage(value: string, fallback: string) {
  const cleaned = cleanText(value);

  if (!cleaned || isJsonLikeText(cleaned)) return fallback;

  return cleaned;
}

function isMeaningfulDetectedText(value: string) {
  const cleaned = cleanText(value);

  if (!cleaned || isJsonLikeText(cleaned)) return false;

  const lower = cleaned.toLowerCase();

  const exactUnknownValues = new Set([
    "unknown",
    "unknown company",
    "unknown contact",
    "unknown opportunity",
    "not detected",
    "not found",
    "not provided",
    "none",
    "no",
    "n/a",
    "na",
    "null",
    "undefined",
    "blank",
    "empty",
    "unsure",
    "unavailable",
    "no company",
    "no contact",
    "no opportunity",
    "company unknown",
    "contact unknown",
    "opportunity unknown",
  ]);

  if (exactUnknownValues.has(lower)) return false;

  return !(
    lower.includes("not detected") ||
    lower.includes("not provided") ||
    lower.includes("unable to determine") ||
    lower.includes("could not determine") ||
    lower.includes("no company detected") ||
    lower.includes("no contact detected") ||
    lower.includes("no opportunity detected")
  );
}

function safeHumanText(value: string) {
  const cleaned = value.trim();

  if (!cleaned || isJsonLikeText(cleaned)) return "";

  return cleaned;
}

function detectedText(value: string) {
  const cleaned = safeHumanText(value);

  return isMeaningfulDetectedText(cleaned) ? cleaned : "";
}

function extractEmailAddress(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return match ? match[0].toLowerCase() : "";
}

function getPrimaryContactSource(input: {
  sourceType: EmailSourceType;
  from: string;
  to: string;
}) {
  if (input.sourceType === "Outgoing Email") {
    return input.to || input.from;
  }

  return input.from || input.to;
}

function extractDisplayNameFromAddress(value: string) {
  const withoutEmail = value.replace(/<[^>]+>/g, "").trim();
  const cleaned = cleanText(withoutEmail);

  if (!cleaned) return "";

  const emailAddress = extractEmailAddress(cleaned);

  if (emailAddress && cleaned.toLowerCase() === emailAddress) return "";
  if (cleaned.includes("@")) return "";

  return detectedText(cleaned);
}

function titleCase(value: string) {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function deriveNameFromEmail(emailAddress: string) {
  if (!emailAddress) return "";

  const localPart = emailAddress.split("@")[0] || "";
  const withoutPlus = localPart.split("+")[0] || localPart;
  const normalized = withoutPlus.replace(/[._-]+/g, " ").trim();

  if (!normalized) return "";

  const genericNames = new Set([
    "admin",
    "billing",
    "contact",
    "hello",
    "info",
    "mail",
    "no reply",
    "noreply",
    "sales",
    "support",
    "team",
  ]);

  if (genericNames.has(normalized.toLowerCase())) return "";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map(titleCase)
    .join(" ");
}

function parseContactName(value: string) {
  const cleaned = cleanText(value);
  const parts = cleaned.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: "Unknown",
      lastName: "",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0] || "Unknown",
      lastName: "",
    };
  }

  return {
    firstName: parts[0] || "Unknown",
    lastName: parts.slice(1).join(" "),
  };
}

function splitPainPoints(value: string) {
  return value
    .split(/,|\n/)
    .map((item) => detectedText(item))
    .filter(Boolean)
    .slice(0, 12);
}

function emailActivityDate(value: string) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function mapUrgencyToLeadTemperature(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("dead") || lower.includes("lost")) return "Dead";
  if (lower.includes("active")) return "Active";
  if (
    lower.includes("urgent") ||
    lower.includes("high") ||
    lower.includes("hot")
  ) {
    return "Hot";
  }
  if (lower.includes("low") || lower.includes("cold")) return "Cold";

  return "Warm";
}

function mapUrgencyToTaskPriority(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("urgent")) return "Urgent";
  if (lower.includes("high") || lower.includes("hot")) return "High";
  if (lower.includes("low")) return "Low";

  return "Normal";
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const linkStyle: CSSProperties = {
  color: "#a78bfa",
  fontWeight: 800,
  textDecoration: "none",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  borderRadius: "22px",
  padding: "22px",
  marginBottom: "18px",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "8px",
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "14px",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  marginTop: "16px",
  padding: "12px 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
};

const headerStyle: CSSProperties = {
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 32%), linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.88))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "880px",
  lineHeight: 1.55,
};

const detectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
  marginTop: "16px",
  marginBottom: "18px",
};

const detectionCardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "16px",
  padding: "14px",
  backgroundColor: "rgba(15, 23, 42, 0.55)",
};

const detectionLabelStyle: CSSProperties = {
  margin: "0 0 6px",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const detectedValueStyle: CSSProperties = {
  margin: 0,
  color: "#f8fafc",
  fontWeight: 800,
  lineHeight: 1.35,
};

const missingValueStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  fontWeight: 800,
  lineHeight: 1.35,
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
  return "";
}

function firstText(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = safeHumanText(textValue(source[key]));

    if (value) return value;
  }

  return "";
}

function boolValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const lower = value.toLowerCase();

      if (["yes", "true", "needed", "required"].includes(lower)) return true;
      if (["no", "false", "none", "not needed"].includes(lower)) return false;
    }
  }

  return false;
}

function findNestedRecord(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const nested = asRecord(source[key]);

    if (Object.keys(nested).length > 0) return nested;
  }

  return {};
}

function buildEmailInputText(input: {
  sourceType: EmailSourceType;
  mailbox: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  emailDate: string;
  body: string;
}) {
  return [
    "SELL IT EMAIL INTELLIGENCE MANUAL CAPTURE",
    "",
    "This is manually pasted or uploaded email content.",
    "Analyze it as an email, not as a generic note.",
    "Extract company, contact, opportunity, task, activity, pain points, urgency, follow-up needed, summary, and suggested next action.",
    "If company, contact, or opportunity cannot be detected, leave that field blank instead of returning Unknown.",
    "",
    `Email Source Type: ${input.sourceType}`,
    `Mailbox: ${input.mailbox || "[not provided]"}`,
    `From: ${input.from || "[not provided]"}`,
    `To: ${input.to || "[not provided]"}`,
    `CC: ${input.cc || "[not provided]"}`,
    `Subject: ${input.subject || "[not provided]"}`,
    `Date: ${input.emailDate || "[not provided]"}`,
    "",
    "Email Body / Raw Content:",
    input.body || "[no body provided]",
  ].join("\n");
}

function extractReviewFromAnalysis(analysis: unknown, fallbackSubject: string) {
  const root = asRecord(analysis);
  const result = asRecord(root.result);
  const data = Object.keys(result).length > 0 ? result : root;

  const companyRecord = findNestedRecord(data, [
    "company",
    "detected_company",
    "suggested_company",
  ]);

  const contactRecord = findNestedRecord(data, [
    "contact",
    "detected_contact",
    "suggested_contact",
  ]);

  const opportunityRecord = findNestedRecord(data, [
    "opportunity",
    "detected_opportunity",
    "suggested_opportunity",
  ]);

  const taskRecord = findNestedRecord(data, [
    "task",
    "suggested_task",
    "suggested_tasks",
  ]);

  const activityRecord = findNestedRecord(data, [
    "activity",
    "suggested_activity",
  ]);

  const company =
    firstText(companyRecord, ["name", "company_name", "title"]) ||
    firstText(data, [
      "company",
      "company_name",
      "detected_company",
      "suggested_company",
    ]);

  const contact =
    firstText(contactRecord, ["name", "full_name", "contact_name"]) ||
    [
      firstText(contactRecord, ["first_name"]),
      firstText(contactRecord, ["last_name"]),
    ]
      .filter(Boolean)
      .join(" ") ||
    firstText(data, [
      "contact",
      "contact_name",
      "detected_contact",
      "suggested_contact",
    ]);

  const opportunity =
    firstText(opportunityRecord, ["name", "opportunity_name", "title"]) ||
    firstText(data, [
      "opportunity",
      "opportunity_name",
      "detected_opportunity",
      "suggested_opportunity",
    ]);

  const taskTitle =
    firstText(taskRecord, ["title", "task_title", "name"]) ||
    firstText(data, ["task_title", "suggested_task", "task"]);

  const taskDescription =
    firstText(taskRecord, ["description", "task_description", "notes"]) ||
    firstText(data, ["task_description"]);

  const activitySubject =
    firstText(activityRecord, ["subject", "activity_subject", "title"]) ||
    firstText(data, ["activity_subject", "subject"]) ||
    fallbackSubject;

  const activitySummary =
    firstText(activityRecord, ["summary", "activity_summary", "description"]) ||
    firstText(data, ["summary", "activity_summary", "email_summary"]);

  const painPoints = firstText(data, [
    "pain_points",
    "detected_pain_points",
    "pain_point",
    "painPoint",
  ]);

  const urgency = firstText(data, ["urgency", "priority", "lead_temperature"]);

  const suggestedNextAction = firstText(data, [
    "suggested_next_action",
    "next_action",
    "next_step",
    "suggested_action",
  ]);

  return {
    company: detectedText(company),
    contact: detectedText(contact),
    opportunity: detectedText(opportunity),
    taskTitle: safeHumanText(taskTitle),
    taskDescription: safeHumanText(taskDescription),
    activitySubject: safeHumanText(activitySubject || fallbackSubject),
    activitySummary: safeHumanText(activitySummary),
    painPoints: safeHumanText(painPoints),
    urgency: safeHumanText(urgency),
    followUpNeeded: boolValue(data, [
      "follow_up_needed",
      "followUpNeeded",
      "needs_follow_up",
    ]),
    suggestedNextAction: safeHumanText(suggestedNextAction),
  };
}

function normalizeReviewForEmailSource(
  extractedReview: EmailReview,
  input: {
    sourceType: EmailSourceType;
    from: string;
    to: string;
  }
) {
  if (input.sourceType !== "Outgoing Email") {
    return extractedReview;
  }

  const recipientSource = input.to || input.from;
  const recipientEmail = extractEmailAddress(recipientSource);
  const recipientDisplayName =
    extractDisplayNameFromAddress(recipientSource) ||
    deriveNameFromEmail(recipientEmail) ||
    recipientEmail;

  return {
    ...extractedReview,
    contact: recipientDisplayName || extractedReview.contact,
  };
}

function getFileDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsDataURL(file);
  });
}

function DetectionCard(props: {
  label: string;
  value: string;
  fallback: string;
  note?: string;
}) {
  const hasValue = isMeaningfulDetectedText(props.value);

  return (
    <div style={detectionCardStyle}>
      <p style={detectionLabelStyle}>{props.label}</p>
      <p style={hasValue ? detectedValueStyle : missingValueStyle}>
        {hasValue ? cleanText(props.value) : props.fallback}
      </p>
      {props.note && (
        <p
          style={{
            margin: "8px 0 0",
            color: "#cbd5e1",
            fontSize: "13px",
            lineHeight: 1.45,
          }}
        >
          {props.note}
        </p>
      )}
    </div>
  );
}

export default function EmailIntelligencePage() {
  const router = useRouter();

  const [sourceType, setSourceType] = useState<EmailSourceType>("Incoming Email");
  const [mailbox, setMailbox] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [emailDate, setEmailDate] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileMimeType, setFileMimeType] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewReady, setReviewReady] = useState(false);
  const [review, setReview] = useState<EmailReview>(emptyReview);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedRecords, setSavedRecords] = useState<SavedRecords | null>(null);

  const primaryContactSource = getPrimaryContactSource({ sourceType, from, to });
  const primaryContactEmail = extractEmailAddress(primaryContactSource);
  const detectedContactNote =
    !review.contact && primaryContactEmail
      ? `No contact name was detected. Save can still create or link a contact using ${primaryContactEmail}.`
      : "";

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setSelectedFile(null);
    setFileName("");
    setFileMimeType("");
    setFileDataUrl("");
    setImageDataUrl("");
    setErrorMessage("");

    if (!file) return;

    try {
      const dataUrl = await getFileDataUrl(file);

      setSelectedFile(file);
      setFileName(file.name);
      setFileMimeType(file.type);

      if (file.type.startsWith("image/")) {
        setImageDataUrl(dataUrl);
      } else {
        setFileDataUrl(dataUrl);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not read selected file.";

      setErrorMessage(
        userSafeErrorMessage(message, "Could not read selected file.")
      );
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAnalyzing(true);
    setErrorMessage("");
    setSaveMessage("");
    setSavedRecords(null);
    setReviewReady(false);
    setReview(emptyReview);

    const inputText = buildEmailInputText({
      sourceType,
      mailbox,
      from,
      to,
      cc,
      subject,
      emailDate,
      body,
    });

    try {
      const response = await fetch("/api/capture/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText,
          text: inputText,
          rawText: inputText,
          content: inputText,
          captureText: inputText,
          pastedText: inputText,
          imageDataUrl,
          fileDataUrl,
          fileName,
          fileMimeType,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          userSafeErrorMessage(textValue(asRecord(json).error), "Email analysis failed.")
        );
      }

      setReview(
  normalizeReviewForEmailSource(extractReviewFromAnalysis(json, subject), {
    sourceType,
    from,
    to,
  })
);
      setReviewReady(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email analysis failed.";

      setErrorMessage(userSafeErrorMessage(message, "Email analysis failed."));
    } finally {
      setAnalyzing(false);
    }
  }

  async function findOrCreateCompany(companyName: string) {
    const name = detectedText(companyName);

    if (!name) return "";

    const existing = await supabase
      .from("companies")
      .select("id, name")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("name", name)
      .limit(1)
      .maybeSingle();

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.id) return existing.data.id as string;

    const created = await supabase
      .from("companies")
      .insert({
        workspace_id: WORKSPACE_ID,
        name,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function findOrCreateContact(contactName: string, companyId: string) {
    const contactSource = getPrimaryContactSource({ sourceType, from, to });
    const emailAddress =
      extractEmailAddress(contactSource) ||
      extractEmailAddress(from) ||
      extractEmailAddress(to);

    const explicitName = detectedText(contactName);
    const sourceDisplayName = extractDisplayNameFromAddress(contactSource);
    const derivedEmailName = deriveNameFromEmail(emailAddress);
    const displayName = explicitName || sourceDisplayName || derivedEmailName;

    if (!displayName && !emailAddress) return "";

    if (emailAddress) {
      const existingByEmail = await supabase
        .from("contacts")
        .select("id")
        .eq("workspace_id", WORKSPACE_ID)
        .eq("email", emailAddress)
        .limit(1)
        .maybeSingle();

      if (existingByEmail.error) throw new Error(existingByEmail.error.message);
      if (existingByEmail.data?.id) return existingByEmail.data.id as string;
    }

    const parsedName = parseContactName(displayName || "Unknown");

    const created = await supabase
      .from("contacts")
      .insert({
        workspace_id: WORKSPACE_ID,
        first_name: parsedName.firstName,
        last_name: parsedName.lastName || null,
        email: emailAddress || null,
        company_id: companyId || null,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function findOrCreateOpportunity(
    opportunityName: string,
    companyId: string,
    contactId: string
  ) {
    const name = detectedText(opportunityName);

    if (!name || !companyId) return "";

    let query = supabase
      .from("opportunities")
      .select("id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("name", name)
      .limit(1);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const existing = await query.maybeSingle();

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.id) return existing.data.id as string;

    const created = await supabase
      .from("opportunities")
      .insert({
        workspace_id: WORKSPACE_ID,
        name,
        company_id: companyId || null,
        primary_contact_id: contactId || null,
        opportunity_type: "Other",
        stage: "New Lead",
        lead_temperature: mapUrgencyToLeadTemperature(review.urgency),
        next_step: nullableText(review.suggestedNextAction),
        notes: nullableText(
          [
            "Created from Email Intelligence manual capture.",
            review.activitySummary,
          ]
            .filter(Boolean)
            .join("\n\n")
        ),
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function createTask(
    companyId: string,
    contactId: string,
    opportunityId: string
  ) {
    const title = safeHumanText(review.taskTitle);

    if (!title) return "";

    const existing = await supabase
      .from("tasks")
      .select("id, company_id, contact_id, opportunity_id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("title", title)
      .limit(20);

    if (existing.error) throw new Error(existing.error.message);

    const existingTask = (existing.data ?? []).find((task) => {
      return (
        (task.company_id || "") === (companyId || "") &&
        (task.contact_id || "") === (contactId || "") &&
        (task.opportunity_id || "") === (opportunityId || "")
      );
    });

    if (existingTask?.id) return existingTask.id as string;

    const created = await supabase
      .from("tasks")
      .insert({
        workspace_id: WORKSPACE_ID,
        title,
        description: nullableText(
          [
            safeHumanText(review.taskDescription),
            safeHumanText(review.suggestedNextAction)
              ? `Suggested next action: ${safeHumanText(review.suggestedNextAction)}`
              : "",
            "Source: Email Intelligence",
          ]
            .filter(Boolean)
            .join("\n\n")
        ),
        priority: mapUrgencyToTaskPriority(review.urgency),
        status: "Open",
        assigned_to: getDatabaseSafeUserId(),
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function createActivity(
    companyId: string,
    contactId: string,
    opportunityId: string,
    taskId: string
  ) {
    const rawNotes = [
      "Source: Email Intelligence",
      `Email Source Type: ${sourceType}`,
      `Mailbox: ${mailbox || "Not provided"}`,
      `From: ${from || "Not provided"}`,
      `To: ${to || "Not provided"}`,
      `CC: ${cc || "Not provided"}`,
      `Subject: ${subject || "Not provided"}`,
      `Date: ${emailDate || "Not provided"}`,
      "",
      "Raw Email Content:",
      body || "No pasted body provided.",
      fileName ? `\nUploaded file analyzed: ${fileName}` : "",
    ]
      .filter((item) => item !== "")
      .join("\n");

    const created = await supabase
      .from("activities")
      .insert({
        workspace_id: WORKSPACE_ID,
        activity_type: "Email",
        activity_date: emailActivityDate(emailDate),
        subject:
          cleanText(safeHumanText(review.activitySubject)) ||
          cleanText(subject) ||
          "Email Intelligence Capture",
        summary: nullableText(safeHumanText(review.activitySummary)),
        raw_notes: rawNotes,
        outcome: review.followUpNeeded ? "Follow-Up Needed" : null,
        follow_up_needed: review.followUpNeeded,
        company_id: companyId || null,
        contact_id: contactId || null,
        task_id: taskId || null,
        opportunity_id: opportunityId || null,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function findOrCreatePainPoint(name: string) {
    const cleanName = detectedText(name);

    if (!cleanName) return "";

    const existing = await supabase
      .from("pain_points")
      .select("id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("name", cleanName)
      .limit(1)
      .maybeSingle();

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.id) return existing.data.id as string;

    const created = await supabase
      .from("pain_points")
      .insert({
        workspace_id: WORKSPACE_ID,
        name: cleanName,
        category: "Email Intelligence",
        description: "Detected from manually captured email.",
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function linkPainPoint(
    painPointId: string,
    companyId: string,
    contactId: string,
    activityId: string
  ) {
    if (!painPointId) return;

    const linkAttempts = [];

    if (companyId) {
      linkAttempts.push(
        supabase.from("pain_point_companies").insert({
          workspace_id: WORKSPACE_ID,
          pain_point_id: painPointId,
          company_id: companyId,
        })
      );
    }

    if (contactId) {
      linkAttempts.push(
        supabase.from("pain_point_contacts").insert({
          workspace_id: WORKSPACE_ID,
          pain_point_id: painPointId,
          contact_id: contactId,
        })
      );
    }

    if (activityId) {
      linkAttempts.push(
        supabase.from("pain_point_activities").insert({
          workspace_id: WORKSPACE_ID,
          pain_point_id: painPointId,
          activity_id: activityId,
        })
      );
    }

    const results = await Promise.all(linkAttempts);

    for (const result of results) {
      if (
        result.error &&
        !result.error.message.toLowerCase().includes("duplicate")
      ) {
        throw new Error(result.error.message);
      }
    }
  }

  async function saveSelectedFileAttachment(activityId: string) {
    if (!selectedFile || !activityId) return "";

    const existing = await supabase
      .from("attachments")
      .select("id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("related_activity_id", activityId)
      .eq("file_name", selectedFile.name)
      .limit(1);

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.[0]?.id) return existing.data[0].id as string;

    const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${WORKSPACE_ID}/related_activity_id/${activityId}/${Date.now()}-${safeFileName}`;

    const uploadResult = await supabase.storage
      .from("sell-it-attachments")
      .upload(storagePath, selectedFile, {
        contentType: selectedFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const signedUrlResult = await supabase.storage
      .from("sell-it-attachments")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signedUrlResult.error) {
      throw new Error(signedUrlResult.error.message);
    }

    const candidateFileTypes = Array.from(
      new Set(
        [
          selectedFile.type.startsWith("image/") ? "Image" : "",
          selectedFile.type.startsWith("image/") ? "Screenshot" : "",
          selectedFile.type === "application/pdf" ? "PDF" : "",
          selectedFile.type === "application/pdf" ? "Document" : "",
          selectedFile.type.includes("spreadsheet") ? "Spreadsheet" : "",
          selectedFile.type.includes("word") ? "Document" : "",
          selectedFile.type.startsWith("text/") ? "Document" : "",
          "Other",
          "Document",
        ].filter(Boolean)
      )
    );

    let lastInsertError = "";

    for (const fileType of candidateFileTypes) {
      const insertResult = await supabase
        .from("attachments")
        .insert({
          workspace_id: WORKSPACE_ID,
          related_activity_id: activityId,
          file_name: selectedFile.name,
          file_type: fileType,
          file_url: signedUrlResult.data.signedUrl,
          storage_path: storagePath,
          file_path: storagePath,
          description: "Uploaded through Email Intelligence manual capture.",
          uploaded_by: null,
        })
        .select("id")
        .single();

      if (!insertResult.error) {
        return insertResult.data.id as string;
      }

      lastInsertError = insertResult.error.message;

      if (
        !insertResult.error.message
          .toLowerCase()
          .includes("attachments_file_type_check")
      ) {
        throw new Error(insertResult.error.message);
      }
    }

    throw new Error(lastInsertError || "Attachment database save failed.");
  }

  async function handleSaveReviewedEmail() {
    setSaving(true);
    setErrorMessage("");
    setSaveMessage("");
    setSavedRecords(null);

    try {
      const companyId = await findOrCreateCompany(review.company);
      const contactId = await findOrCreateContact(review.contact, companyId);
      const opportunityId = await findOrCreateOpportunity(
        review.opportunity,
        companyId,
        contactId
      );
      const taskId = await createTask(companyId, contactId, opportunityId);
      const activityId = await createActivity(
        companyId,
        contactId,
        opportunityId,
        taskId
      );

      const attachmentId = await saveSelectedFileAttachment(activityId);

      const painPointIds: string[] = [];

      for (const painPointName of splitPainPoints(review.painPoints)) {
        const painPointId = await findOrCreatePainPoint(painPointName);

        if (painPointId) {
          painPointIds.push(painPointId);
          await linkPainPoint(painPointId, companyId, contactId, activityId);
        }
      }

      const actingUser = getCurrentActingUserSnapshot();

      await createWorkLogEntry({
        actingUser,
        actionType: "email_intelligence_save",
        entityType: activityId ? "activity" : "email_intelligence",
        entityId: activityId || null,
        entityLabel:
          cleanText(subject) ||
          cleanText(review.activitySubject) ||
          "Email Intelligence Save",
        relatedEntityType: opportunityId
          ? "opportunity"
          : companyId
            ? "company"
            : contactId
              ? "contact"
              : taskId
                ? "task"
                : null,
        relatedEntityId:
          opportunityId || companyId || contactId || taskId || null,
        summary: `${actingUser.displayName} saved Email Intelligence item${
          cleanText(subject) ? `: "${cleanText(subject)}"` : ""
        }.`,
        details:
          "Reviewed Email Intelligence item saved to Sell It records after manual review.",
        metadata: {
          source: "Email Intelligence Save Work Log V1",
          email_source_type: sourceType,
          mailbox: mailbox || null,
          from: from || null,
          to: to || null,
          cc: cc || null,
          subject: subject || null,
          company_id: companyId || null,
          contact_id: contactId || null,
          opportunity_id: opportunityId || null,
          task_id: taskId || null,
          activity_id: activityId || null,
          attachment_id: attachmentId || null,
          pain_point_ids: painPointIds,
        },
      });

      setSavedRecords({
        companyId,
        contactId,
        opportunityId,
        taskId,
        activityId,
        attachmentId,
        painPointIds,
      });

      setSaveMessage("Email Intelligence save complete.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save reviewed email.";

      setErrorMessage(
        userSafeErrorMessage(message, "Could not save reviewed email.")
      );
    } finally {
      setSaving(false);
    }
  }

  function updateReview<K extends keyof EmailReview>(
    key: K,
    value: EmailReview[K]
  ) {
    setReview((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <header style={headerStyle}>
          <p style={eyebrowStyle}>Capture</p>

          <h1 style={titleStyle}>Email Intelligence</h1>

          <p style={mutedTextStyle}>
            Manual email capture for Sell It. Paste email content, review AI
            suggestions, and save only after confirmation. This version does not
            connect to Bluehost, IMAP, SMTP, polling, or email sending.
          </p>
        </header>

        <form onSubmit={handleAnalyze} style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Manual Email Capture</h2>

          <div style={gridStyle}>
            <label>
              Email Source Type
              <select
                value={sourceType}
                onChange={(event) =>
                  setSourceType(event.target.value as EmailSourceType)
                }
                style={inputStyle}
              >
                <option>Incoming Email</option>
                <option>Outgoing Email</option>
                <option>Shared Mailbox Email</option>
              </select>
            </label>

            <label>
              Mailbox
              <input
                value={mailbox}
                onChange={(event) => setMailbox(event.target.value)}
                placeholder="Example: sales@knottylogistics.com"
                style={inputStyle}
              />
            </label>

            <label>
              From
              <input
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                placeholder="sender@example.com"
                style={inputStyle}
              />
            </label>

            <label>
              To
              <input
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="recipient@example.com"
                style={inputStyle}
              />
            </label>

            <label>
              CC
              <input
                value={cc}
                onChange={(event) => setCc(event.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>

            <label>
              Date
              <input
                type="datetime-local"
                value={emailDate}
                onChange={(event) => setEmailDate(event.target.value)}
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: "block", marginTop: "14px" }}>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Email subject"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginTop: "14px" }}>
            Body / Email Content
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={12}
              placeholder="Paste the email body, forwarded email, or raw email content here."
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginTop: "14px" }}>
            Optional Screenshot, PDF, or Email File
            <input
              type="file"
              accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              style={inputStyle}
            />
          </label>

          {fileName && (
            <p style={{ color: "#aaa" }}>
              Selected file: {fileName} ({fileMimeType || "unknown type"})
            </p>
          )}

          {errorMessage && <p style={{ color: "#fca5a5" }}>Error: {errorMessage}</p>}

          <button
            type="submit"
            disabled={analyzing}
            style={{
              ...buttonStyle,
              opacity: analyzing ? 0.6 : 1,
              cursor: analyzing ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? "Analyzing Email..." : "Analyze Email"}
          </button>
        </form>

        {reviewReady && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Review AI Email Analysis</h2>

            <p style={{ color: "#aaa", lineHeight: 1.55 }}>
              Review and edit these fields before saving. Blank or unknown
              company, contact, and opportunity fields are allowed. No records
              have been written yet.
            </p>

            <div style={detectionGridStyle}>
              <DetectionCard
                label="Company"
                value={review.company}
                fallback="Company unknown"
              />

              <DetectionCard
                label="Contact"
                value={review.contact}
                fallback={primaryContactEmail ? "Contact name unknown" : "Contact unknown"}
                note={detectedContactNote}
              />

              <DetectionCard
                label="Opportunity"
                value={review.opportunity}
                fallback="Opportunity unknown"
              />

              <DetectionCard
                label="Activity"
                value={review.activitySubject || subject}
                fallback="Email activity will still be created"
              />

              <DetectionCard
                label="Task"
                value={review.taskTitle}
                fallback="No task suggested"
              />

              <DetectionCard
                label="Pain Points"
                value={review.painPoints}
                fallback="No pain points detected"
              />
            </div>

            <div style={gridStyle}>
              <label>
                Company
                <input
                  value={review.company}
                  onChange={(event) => updateReview("company", event.target.value)}
                  placeholder="Optional. Leave blank if unknown."
                  style={inputStyle}
                />
              </label>

              <label>
                Contact
                <input
                  value={review.contact}
                  onChange={(event) => updateReview("contact", event.target.value)}
                  placeholder="Optional. Email address can still be used."
                  style={inputStyle}
                />
              </label>

              <label>
                Opportunity
                <input
                  value={review.opportunity}
                  onChange={(event) =>
                    updateReview("opportunity", event.target.value)
                  }
                  placeholder="Optional. Leave blank if unknown."
                  style={inputStyle}
                />
              </label>

              <label>
                Urgency
                <input
                  value={review.urgency}
                  onChange={(event) => updateReview("urgency", event.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={{ display: "block", marginTop: "14px" }}>
              Activity Subject
              <input
                value={review.activitySubject}
                onChange={(event) =>
                  updateReview("activitySubject", event.target.value)
                }
                placeholder="Optional. Falls back to email subject."
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              Activity Summary
              <textarea
                value={review.activitySummary}
                onChange={(event) =>
                  updateReview("activitySummary", event.target.value)
                }
                rows={4}
                placeholder="Human-readable summary only."
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              Suggested Task Title
              <input
                value={review.taskTitle}
                onChange={(event) => updateReview("taskTitle", event.target.value)}
                placeholder="Optional. Leave blank to skip task creation."
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              Suggested Task Description
              <textarea
                value={review.taskDescription}
                onChange={(event) =>
                  updateReview("taskDescription", event.target.value)
                }
                rows={4}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              Pain Points
              <textarea
                value={review.painPoints}
                onChange={(event) => updateReview("painPoints", event.target.value)}
                rows={3}
                placeholder="Optional. Separate multiple pain points with commas or new lines."
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "14px" }}>
              Suggested Next Action
              <textarea
                value={review.suggestedNextAction}
                onChange={(event) =>
                  updateReview("suggestedNextAction", event.target.value)
                }
                rows={3}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={review.followUpNeeded}
                onChange={(event) =>
                  updateReview("followUpNeeded", event.target.checked)
                }
              />
              Follow-up needed
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveReviewedEmail}
              style={{
                ...buttonStyle,
                opacity: saving ? 0.6 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving Reviewed Email..." : "Save Reviewed Email"}
            </button>

            {saveMessage && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(34, 197, 94, 0.35)",
                  backgroundColor: "rgba(20, 83, 45, 0.22)",
                  color: "#bbf7d0",
                }}
              >
                <strong>{saveMessage}</strong>

                {savedRecords && (
                  <ul style={{ lineHeight: 1.8, marginBottom: 0 }}>
                    {savedRecords.companyId ? (
                      <li>
                        <Link
                          href={`/companies/${savedRecords.companyId}`}
                          style={linkStyle}
                        >
                          Open Company
                        </Link>
                      </li>
                    ) : (
                      <li>Company not detected — skipped safely.</li>
                    )}

                    {savedRecords.contactId ? (
                      <li>
                        <Link
                          href={`/contacts/${savedRecords.contactId}`}
                          style={linkStyle}
                        >
                          Open Contact
                        </Link>
                      </li>
                    ) : (
                      <li>Contact not detected — skipped safely.</li>
                    )}

                    {savedRecords.opportunityId ? (
                      <li>
                        <Link
                          href={`/opportunities/${savedRecords.opportunityId}`}
                          style={linkStyle}
                        >
                          Open Opportunity
                        </Link>
                      </li>
                    ) : (
                      <li>Opportunity not detected — skipped safely.</li>
                    )}

                    {savedRecords.taskId ? (
                      <li>
                        <Link href={`/tasks/${savedRecords.taskId}`} style={linkStyle}>
                          Open Task
                        </Link>
                      </li>
                    ) : (
                      <li>No task suggested — skipped safely.</li>
                    )}

                    {savedRecords.activityId && (
                      <li>
                        <Link
                          href={`/activities/${savedRecords.activityId}`}
                          style={linkStyle}
                        >
                          Open Activity
                        </Link>
                      </li>
                    )}

                    {savedRecords.attachmentId && (
                      <li>Attachment linked to Activity</li>
                    )}

                    {savedRecords.painPointIds.length > 0 ? (
                      <li>
                        Pain point links created: {savedRecords.painPointIds.length}
                      </li>
                    ) : (
                      <li>No pain points detected — skipped safely.</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Safety Rules</h2>

          <ul style={{ color: "#ddd", lineHeight: 1.7 }}>
            <li>No Bluehost connection.</li>
            <li>No IMAP or SMTP credentials.</li>
            <li>No email sending.</li>
            <li>No inbox polling.</li>
            <li>No silent writes.</li>
            <li>Review before save.</li>
            <li>No raw AI JSON shown to normal users.</li>
            <li>Company, contact, and opportunity are optional.</li>
          </ul>
        </section>
      </section>
    </main>
  );
}


