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
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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

function extractEmailAddress(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return match ? match[0].toLowerCase() : "";
}

function parseContactName(value: string) {
  const withoutEmail = value.replace(/<[^>]+>/g, "").trim();
  const cleaned = cleanText(withoutEmail);
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
    .map((item) => cleanText(item))
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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: CSSProperties = {
  display: "none",
};

const linkStyle: CSSProperties = {
  color: "#a78bfa",
  fontWeight: 800,
  textDecoration: "none",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  borderRadius: "20px",
  padding: "20px",
  marginBottom: "18px",
  maxWidth: "1120px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "8px",
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backgroundColor: "#0f172a",
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
  marginTop: "16px",
  padding: "12px 18px",
  borderRadius: "999px",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const headerStyle: CSSProperties = {
  maxWidth: "1120px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 32%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
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
  lineHeight: 1.65,
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
    const value = textValue(source[key]).trim();

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
    company,
    contact,
    opportunity,
    taskTitle,
    taskDescription,
    activitySubject,
    activitySummary,
    painPoints,
    urgency,
    followUpNeeded: boolValue(data, [
      "follow_up_needed",
      "followUpNeeded",
      "needs_follow_up",
    ]),
    suggestedNextAction,
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
  const [analysis, setAnalysis] = useState<unknown>(null);
  const [review, setReview] = useState<EmailReview>(emptyReview);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedRecords, setSavedRecords] = useState<SavedRecords | null>(null);

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

      setErrorMessage(message);
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAnalyzing(true);
    setErrorMessage("");
    setSaveMessage("");
    setSavedRecords(null);
    setAnalysis(null);

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
        throw new Error(textValue(json.error) || "Email analysis failed.");
      }

      setAnalysis(json);
      setReview(extractReviewFromAnalysis(json, subject));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Email analysis failed.";

      setErrorMessage(message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function findOrCreateCompany(companyName: string) {
    const name = cleanText(companyName);

    if (!name) return "";

    const existing = await supabase
      .from("companies")
      .select("id, name")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("name", name)
      .maybeSingle();

    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.id) return existing.data.id as string;

    const created = await supabase
      .from("companies")
      .insert({
        workspace_id: WORKSPACE_ID,
        name,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function findOrCreateContact(contactName: string, companyId: string) {
    const emailAddress = extractEmailAddress(from);
    const displayName = cleanText(contactName || from || emailAddress);

    if (!displayName && !emailAddress) return "";

    if (emailAddress) {
      const existingByEmail = await supabase
        .from("contacts")
        .select("id")
        .eq("workspace_id", WORKSPACE_ID)
        .eq("email", emailAddress)
        .maybeSingle();

      if (existingByEmail.error) throw new Error(existingByEmail.error.message);
      if (existingByEmail.data?.id) return existingByEmail.data.id as string;
    }

    const parsedName = parseContactName(displayName || emailAddress);

    const created = await supabase
      .from("contacts")
      .insert({
        workspace_id: WORKSPACE_ID,
        first_name: parsedName.firstName,
        last_name: parsedName.lastName || null,
        email: emailAddress || null,
        company_id: companyId || null,
        created_by: USER_ID,
        updated_by: USER_ID,
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
    const name = cleanText(opportunityName);

    if (!name) return "";

    let query = supabase
      .from("opportunities")
      .select("id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("name", name);

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
        lead_temperature: review.urgency || "Warm",
        next_step: nullableText(review.suggestedNextAction),
        notes: nullableText(
          [
            "Created from Email Intelligence manual capture.",
            review.activitySummary,
          ]
            .filter(Boolean)
            .join("\n\n")
        ),
        created_by: USER_ID,
        updated_by: USER_ID,
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
    const title = cleanText(review.taskTitle);

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
            review.taskDescription,
            review.suggestedNextAction
              ? `Suggested next action: ${review.suggestedNextAction}`
              : "",
            "Source: Email Intelligence",
          ]
            .filter(Boolean)
            .join("\n\n")
        ),
        priority: review.urgency.toLowerCase().includes("urgent")
          ? "Urgent"
          : review.urgency.toLowerCase().includes("high")
            ? "High"
            : "Normal",
        status: "Open",
        assigned_to: USER_ID,
        company_id: companyId || null,
        contact_id: contactId || null,
        opportunity_id: opportunityId || null,
        created_by: USER_ID,
        updated_by: USER_ID,
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
          cleanText(review.activitySubject) ||
          cleanText(subject) ||
          "Email Intelligence Capture",
        summary: nullableText(review.activitySummary),
        raw_notes: rawNotes,
        outcome: review.followUpNeeded ? "Follow-Up Needed" : null,
        follow_up_needed: review.followUpNeeded,
        company_id: companyId || null,
        contact_id: contactId || null,
        task_id: taskId || null,
        opportunity_id: opportunityId || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (created.error) throw new Error(created.error.message);

    return created.data.id as string;
  }

  async function findOrCreatePainPoint(name: string) {
    const cleanName = cleanText(name);

    if (!cleanName) return "";

    const existing = await supabase
      .from("pain_points")
      .select("id")
      .eq("name", cleanName)
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
      if (result.error && !result.error.message.toLowerCase().includes("duplicate")) {
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

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }
  function updateReview<K extends keyof EmailReview>(key: K, value: EmailReview[K]) {
    setReview((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <main style={pageStyle}>
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

        {errorMessage && <p style={{ color: "red" }}>Error: {errorMessage}</p>}

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

      {analysis !== null && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Review AI Email Analysis</h2>

          <p style={{ color: "#aaa" }}>
            Review and edit these fields before saving. No records have been
            written yet.
          </p>

          <div style={gridStyle}>
            <label>
              Company
              <input
                value={review.company}
                onChange={(event) => updateReview("company", event.target.value)}
                style={inputStyle}
              />
            </label>

            <label>
              Contact
              <input
                value={review.contact}
                onChange={(event) => updateReview("contact", event.target.value)}
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
                style={inputStyle}
              />
            </label>

            <label>
              Urgency
              <input
                value={review.urgency}
                onChange={(event) => updateReview("urgency", event.target.value)}
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
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginTop: "14px" }}>
            Suggested Task Title
            <input
              value={review.taskTitle}
              onChange={(event) =>
                updateReview("taskTitle", event.target.value)
              }
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
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginTop: "14px" }}>
            Pain Points
            <textarea
              value={review.painPoints}
              onChange={(event) =>
                updateReview("painPoints", event.target.value)
              }
              rows={3}
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
                  {savedRecords.companyId && (
                    <li>
                      <Link
                        href={`/companies/${savedRecords.companyId}`}
                        style={linkStyle}
                      >
                        Open Company
                      </Link>
                    </li>
                  )}

                  {savedRecords.contactId && (
                    <li>
                      <Link
                        href={`/contacts/${savedRecords.contactId}`}
                        style={linkStyle}
                      >
                        Open Contact
                      </Link>
                    </li>
                  )}

                  {savedRecords.opportunityId && (
                    <li>
                      <Link
                        href={`/opportunities/${savedRecords.opportunityId}`}
                        style={linkStyle}
                      >
                        Open Opportunity
                      </Link>
                    </li>
                  )}

                  {savedRecords.taskId && (
                    <li>
                      <Link href={`/tasks/${savedRecords.taskId}`} style={linkStyle}>
                        Open Task
                      </Link>
                    </li>
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

                  {savedRecords.painPointIds.length > 0 && (
                    <li>
                      Pain point links created:{" "}
                      {savedRecords.painPointIds.length}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <details style={{ marginTop: "18px" }}>
            <summary style={{ cursor: "pointer", color: "#8ab4ff" }}>
              Raw AI result
            </summary>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                backgroundColor: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                borderRadius: "12px",
                padding: "12px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </details>
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
        </ul>
      </section>
    </main>
  );
}










