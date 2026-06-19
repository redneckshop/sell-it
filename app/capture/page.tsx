"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
} from "react";
import { supabase } from "../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type CaptureResult = {
  company: string | null;
  contact: string | null;
  contacts: string[];
  phone: string | null;
  location: string | null;
  fleet_size: string | null;
  opportunity: string | null;
  task: string | null;
  activity: string | null;
  pain_points: string[];
  notes: string | null;
  summary: string;
  confidence: "Low" | "Medium" | "High";
};

type MultiCaptureRecord = {
  selected: boolean;
  record_type: "Company" | "Contact" | "CompanyContact" | "Lead" | "Other";
  company: string | null;
  contact: string | null;
  contacts: string[];
  phone: string | null;
  email: string | null;
  location: string | null;
  fleet_size: string | null;
  opportunity: string | null;
  task: string | null;
  activity: string | null;
  pain_points: string[];
  notes: string | null;
  summary: string;
  confidence: "Low" | "Medium" | "High";
};

type SavedRecordLinks = {
  companyId?: string;
  contactId?: string;
  contactIds?: string[];
  opportunityId?: string;
  taskId?: string;
  activityId?: string;
  painPointIds?: string[];
  sourceFileAttached?: boolean;
};

type MultiSaveSummary = {
  importActivityId?: string;
  selectedCount: number;
  companyIds: string[];
  contactIds: string[];
  sourceFileAttached: boolean;
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  marginBottom: "16px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  color: "white",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  padding: "12px 18px",
  borderRadius: "999px",
  fontWeight: 800,
  border: "1px solid rgba(167, 139, 250, 0.45)",
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.74)",
  padding: "10px 14px",
  borderRadius: "999px",
  fontWeight: 800,
  border: "1px solid rgba(148, 163, 184, 0.25)",
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.74)",
  padding: "10px 14px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
  border: "1px solid rgba(148, 163, 184, 0.25)",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  marginBottom: "18px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const dropZoneStyle: CSSProperties = {
  border: "1px dashed rgba(148, 163, 184, 0.35)",
  borderRadius: "20px",
  padding: "26px",
  backgroundColor: "rgba(15, 23, 42, 0.56)",
  textAlign: "center",
  marginTop: "14px",
  marginBottom: "18px",
};

const imageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function splitContactName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const cleanValue = String(value || "").trim();

    if (!cleanValue) continue;

    const key = cleanValue.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    cleaned.push(cleanValue);
  }

  return cleaned;
}

function parsePainPoints(value: string) {
  return dedupeStrings(
    value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function parseContacts(value: string, primaryContact: string) {
  return dedupeStrings([
    primaryContact,
    ...value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean),
  ]);
}

function parseFleetSize(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function isImageFile(file: File) {
  return imageTypes.includes(file.type);
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || getFileExtension(file.name) === "pdf";
}

function isOfficeFile(file: File) {
  const extension = getFileExtension(file.name);

  return ["doc", "docx", "xls", "xlsx"].includes(extension);
}

function isDirectAiFile(file: File) {
  return isPdfFile(file) || isOfficeFile(file);
}

function isReadableTextFile(file: File) {
  const extension = getFileExtension(file.name);

  if (file.type.startsWith("text/")) return true;

  return [
    "txt",
    "csv",
    "tsv",
    "json",
    "md",
    "log",
    "xml",
    "html",
    "htm",
  ].includes(extension);
}

function getAttachmentFileType(file: File) {
  const extension = getFileExtension(file.name);

  if (isImageFile(file)) return "Screenshot";
  if (extension === "pdf") return "PDF";

  if (
    ["csv", "tsv", "doc", "docx", "txt", "md", "rtf", "xls", "xlsx"].includes(
      extension
    )
  ) {
    return "Document";
  }

  if (["mp3", "wav", "m4a"].includes(extension)) {
    return "Audio";
  }

  return "Other";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function normalizeOpportunityType(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("alpha")) return "Alpha Tester";
  if (lower.includes("beta")) return "Beta Tester";
  if (lower.includes("paid") || lower.includes("customer")) return "Paid Customer";
  if (lower.includes("broker")) return "Broker Adoption";
  if (lower.includes("contractor")) return "Contractor Adoption";
  if (lower.includes("partner")) return "Partnership";

  return "Other";
}

function normalizeOpportunityStage(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("alpha")) return "Alpha Candidate";
  if (lower.includes("beta")) return "Beta Candidate";
  if (lower.includes("demo")) return "Demo Scheduled";
  if (lower.includes("meeting")) return "Meeting Scheduled";
  if (lower.includes("customer")) return "Customer";
  if (lower.includes("lost")) return "Lost";
  if (lower.includes("paused")) return "Paused";
  if (lower.includes("interested")) return "Discovery";
  if (lower.includes("follow")) return "Contact Made";

  return "New Lead";
}

function normalizeActivityType(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("call")) return "Call";
  if (lower.includes("voicemail")) return "Voicemail";
  if (lower.includes("text")) return "Text Message";
  if (lower.includes("email")) return "Email";
  if (lower.includes("meeting")) return "Meeting";
  if (lower.includes("lunch")) return "Lunch";
  if (lower.includes("website")) return "Website Research";
  if (lower.includes("facebook post")) return "Facebook Comment";
  if (lower.includes("facebook comment")) return "Facebook Comment";
  if (lower.includes("facebook message")) return "Facebook Message";
  if (lower.includes("facebook discussion")) return "Facebook Comment";
  if (lower.includes("facebook")) return "Facebook Comment";
  if (lower.includes("screenshot")) return "Website Research";
  if (lower.includes("research")) return "Website Research";
  if (lower.includes("note")) return "Note";
  if (lower.includes("file")) return "Note";
  if (lower.includes("csv")) return "Note";
  if (lower.includes("import")) return "Note";
  if (lower.includes("pdf")) return "Note";
  if (lower.includes("contract")) return "Meeting";
  if (lower.includes("carrier packet")) return "Note";

  return "Other";
}

function normalizeActivityOutcome(opportunityValue: string, taskValue: string) {
  const combined = `${opportunityValue} ${taskValue}`.toLowerCase();

  if (combined.includes("not interested")) return "Not Interested";
  if (combined.includes("bad fit")) return "Bad Fit";
  if (combined.includes("converted")) return "Converted";
  if (combined.includes("meeting")) return "Meeting Booked";
  if (combined.includes("follow") || taskValue.trim()) return "Follow-Up Needed";

  if (
    combined.includes("interested") ||
    combined.includes("alpha") ||
    combined.includes("beta") ||
    combined.includes("demo") ||
    combined.includes("sale") ||
    combined.includes("equipment") ||
    combined.includes("contract") ||
    combined.includes("carrier")
  ) {
    return "Interested";
  }

  return "Spoke";
}

function guessPainPointCategory(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("truck")) return "Trucking Capacity";
  if (lower.includes("driver")) return "Labor";
  if (lower.includes("work")) return "Work Pipeline";
  if (lower.includes("ticket") || lower.includes("paper")) return "Paperwork";
  if (lower.includes("bill") || lower.includes("pay")) return "Billing";
  if (lower.includes("dispatch")) return "Dispatch";
  if (lower.includes("accountability")) return "Accountability";
  if (lower.includes("communication")) return "Communication";
  if (lower.includes("equipment") || lower.includes("unit")) return "Equipment";
  if (lower.includes("fleet")) return "Fleet";
  if (lower.includes("contract")) return "Contract";
  if (lower.includes("carrier")) return "Carrier";

  return "Operations";
}

function getNowForActivity() {
  return new Date().toISOString();
}

function normalizeDuplicateText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ï¿½']/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1")
    .replace(/\bfollow[-\s]*up\b/g, "follow up")
    .replace(/\b(the|a|an|and|for|to|with|about|on|at|of)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function duplicateTextTokens(value: string) {
  return normalizeDuplicateText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function duplicateTextSimilarity(left: string, right: string) {
  const leftTokens = duplicateTextTokens(left);
  const rightTokens = duplicateTextTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let sharedCount = 0;

  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      sharedCount += 1;
    }
  });

  return sharedCount / Math.max(leftSet.size, rightSet.size);
}

function duplicateTextContainmentSimilarity(left: string, right: string) {
  const leftTokens = duplicateTextTokens(left);
  const rightTokens = duplicateTextTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let sharedCount = 0;

  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      sharedCount += 1;
    }
  });

  return sharedCount / Math.min(leftSet.size, rightSet.size);
}

function areLikelyDuplicateTexts(left: string, right: string) {
  const normalizedLeft = normalizeDuplicateText(left);
  const normalizedRight = normalizeDuplicateText(right);

  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (normalizedLeft.includes(normalizedRight)) return true;
  if (normalizedRight.includes(normalizedLeft)) return true;

  return (
    duplicateTextSimilarity(left, right) >= 0.72 ||
    duplicateTextContainmentSimilarity(left, right) >= 0.72
  );
}

function recentDuplicateCutoff(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read source file."));
    reader.readAsDataURL(file);
  });
}

function buildMultiRecordNotes(record: MultiCaptureRecord) {
  return [
    "Created from AI Capture V5 smart document/file extraction.",
    "",
    record.summary ? `Summary: ${record.summary}` : "",
    record.notes ? `Notes: ${record.notes}` : "",
    record.location ? `Location: ${record.location}` : "",
    record.fleet_size ? `Fleet Size: ${record.fleet_size}` : "",
    record.phone ? `Phone: ${record.phone}` : "",
    record.email ? `Email: ${record.email}` : "",
    record.opportunity ? `Opportunity: ${record.opportunity}` : "",
    record.task ? `Task: ${record.task}` : "",
    record.pain_points.length > 0
      ? `Pain Points: ${record.pain_points.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function CapturePage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [multiRecords, setMultiRecords] = useState<MultiCaptureRecord[]>([]);
  const [sourceType, setSourceType] = useState("");
  const [rawText, setRawText] = useState("");

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceFilePreviewUrl, setSourceFilePreviewUrl] = useState("");
  const [sourceFileImageDataUrl, setSourceFileImageDataUrl] = useState("");
  const [sourceFileDataUrl, setSourceFileDataUrl] = useState("");
  const [sourceFileText, setSourceFileText] = useState("");
  const [sourceFileReadMessage, setSourceFileReadMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [reviewCompany, setReviewCompany] = useState("");
  const [reviewContact, setReviewContact] = useState("");
  const [reviewContacts, setReviewContacts] = useState("");
  const [reviewPhone, setReviewPhone] = useState("");
  const [reviewLocation, setReviewLocation] = useState("");
  const [reviewFleetSize, setReviewFleetSize] = useState("");
  const [reviewOpportunity, setReviewOpportunity] = useState("");
  const [reviewTask, setReviewTask] = useState("");
  const [reviewActivity, setReviewActivity] = useState("");
  const [reviewPainPoints, setReviewPainPoints] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSummary, setReviewSummary] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedLinks, setSavedLinks] = useState<SavedRecordLinks | null>(null);
  const [multiSaveMessage, setMultiSaveMessage] = useState("");
  const [multiSaveSummary, setMultiSaveSummary] =
    useState<MultiSaveSummary | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMulti, setSavingMulti] = useState(false);

  useEffect(() => {
    return () => {
      if (sourceFilePreviewUrl) {
        URL.revokeObjectURL(sourceFilePreviewUrl);
      }
    };
  }, [sourceFilePreviewUrl]);

  useEffect(() => {
    async function handleClipboardPaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;

      if (!items || items.length === 0) return;

      for (const item of Array.from(items)) {
        if (item.kind !== "file") continue;

        const file = item.getAsFile();

        if (!file || !isImageFile(file)) continue;

        event.preventDefault();

        const extension =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
            ? "webp"
            : "jpg";

        const pastedFile = new File(
          [file],
          `pasted-screenshot-${Date.now()}.${extension}`,
          { type: file.type }
        );

        await handleSourceFile(pastedFile);
        break;
      }
    }

    window.addEventListener("paste", handleClipboardPaste);

    return () => {
      window.removeEventListener("paste", handleClipboardPaste);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function isFileDrag(event: globalThis.DragEvent) {
      return Array.from(event.dataTransfer?.types || []).includes("Files");
    }

    function handleWindowDragOver(event: globalThis.DragEvent) {
      if (!isFileDrag(event)) return;

      event.preventDefault();
      setIsDragging(true);

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }

    function handleWindowDragLeave(event: globalThis.DragEvent) {
      if (event.clientX <= 0 || event.clientY <= 0) {
        setIsDragging(false);
      }
    }

    async function handleWindowDrop(event: globalThis.DragEvent) {
      if (!isFileDrag(event)) return;

      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer?.files?.[0] ?? null;

      if (!file) return;

      await handleSourceFile(file);
    }

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSourceFile(file: File | null) {
    setErrorMessage("");
    setSaveMessage("");
    setSavedLinks(null);
    setMultiSaveMessage("");
    setMultiSaveSummary(null);
    setSourceFileReadMessage("");
    setSourceFileText("");
    setSourceFileImageDataUrl("");
    setSourceFileDataUrl("");

    if (!file) {
      setSourceFile(null);
      setSourceFilePreviewUrl("");
      setSourceFileImageDataUrl("");
      setSourceFileDataUrl("");
      setSourceFileText("");
      setSourceFileReadMessage("");
      return;
    }

    const maxSizeBytes = 20 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrorMessage("File is too large. Use a file under 20 MB.");
      return;
    }

    if (sourceFilePreviewUrl) {
      URL.revokeObjectURL(sourceFilePreviewUrl);
    }

    setSourceFile(file);

    if (isImageFile(file)) {
      const previewUrl = URL.createObjectURL(file);
      const dataUrl = await fileToDataUrl(file);

      setSourceFilePreviewUrl(previewUrl);
      setSourceFileImageDataUrl(dataUrl);
      setSourceFileReadMessage("Image ready for AI vision analysis.");
      return;
    }

    setSourceFilePreviewUrl("");
    setSourceFileImageDataUrl("");

    if (isDirectAiFile(file)) {
      try {
        const dataUrl = await fileToDataUrl(file);

        setSourceFileDataUrl(dataUrl);
        setSourceFileReadMessage(
          isPdfFile(file)
            ? "PDF ready for AI document analysis. Scanned pages may be read by vision."
            : "Document ready for AI file analysis."
        );
      } catch {
        setSourceFileDataUrl("");
        setSourceFileReadMessage(
          "File selected, but it could not be prepared for AI analysis."
        );
      }

      return;
    }

    if (isReadableTextFile(file)) {
      try {
        const text = await file.text();
        const maxTextCharacters = 30000;
        const trimmedText =
          text.length > maxTextCharacters
            ? `${text.slice(
                0,
                maxTextCharacters
              )}\n\n[File text was longer than ${maxTextCharacters} characters and was trimmed for AI analysis.]`
            : text;

        setSourceFileText(trimmedText);
        setSourceFileReadMessage("Text/CSV file content ready for AI analysis.");
      } catch {
        setSourceFileText("");
        setSourceFileReadMessage(
          "File uploaded for attachment, but text could not be read."
        );
      }

      return;
    }

    setSourceFileReadMessage(
      "File ready to attach. AI reading for this file type will be added later."
    );
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    await handleSourceFile(file);
  }

  function clearSourceFile() {
    if (sourceFilePreviewUrl) {
      URL.revokeObjectURL(sourceFilePreviewUrl);
    }

    setSourceFile(null);
    setSourceFilePreviewUrl("");
    setSourceFileImageDataUrl("");
    setSourceFileDataUrl("");
    setSourceFileText("");
    setSourceFileReadMessage("");
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAnalyzing(true);
    setResult(null);
    setMultiRecords([]);
    setSourceType("");
    setRawText("");
    setErrorMessage("");
    setSaveMessage("");
    setSavedLinks(null);
    setMultiSaveMessage("");
    setMultiSaveSummary(null);

    const combinedText = [
      inputText.trim(),
      sourceFileText
        ? `Source file content from ${sourceFile?.name || "uploaded file"}:\n${sourceFileText}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!combinedText && !sourceFileImageDataUrl && !sourceFileDataUrl) {
      setErrorMessage(
        "Paste text, upload an image/screenshot, upload a PDF/document, or upload a readable text/CSV file before analyzing. Other file types can still be attached after you add notes or a summary."
      );
      setAnalyzing(false);
      return;
    }

    try {
      const response = await fetch("/api/capture/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: combinedText,
          imageDataUrl: sourceFileImageDataUrl,
          fileDataUrl: sourceFileDataUrl,
          fileName: sourceFile?.name || "",
          fileMimeType: sourceFile?.type || getFileExtension(sourceFile?.name || ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Capture analysis failed.");
        setAnalyzing(false);
        return;
      }

      const aiResult = data.result as CaptureResult;
      const aiMultiRecords = Array.isArray(data.multi_records)
        ? (data.multi_records as MultiCaptureRecord[])
        : [];

      setResult(aiResult || null);
      setMultiRecords(aiMultiRecords);
      setSourceType(data.source_type || "");
      setRawText(data.raw_text || "");

      if (aiResult) {
        const allContacts = dedupeStrings([
          aiResult.contact || "",
          ...(aiResult.contacts || []),
        ]);

        let nextReviewCompany = aiResult.company || "";
        let nextReviewContact = aiResult.contact || allContacts[0] || "";
        let nextReviewContacts = allContacts;

        if (!nextReviewCompany && aiResult.opportunity && allContacts.length > 0) {
          const existingCompanyFromCapture =
            await findExistingCompanyFromCaptureNames(allContacts);

          if (existingCompanyFromCapture?.id) {
            const matchedCompanyName =
              existingCompanyFromCapture.name ||
              existingCompanyFromCapture.matchedName;

            nextReviewCompany = matchedCompanyName;
            nextReviewContacts = allContacts.filter((contactName) => {
              const lowerContactName = contactName.trim().toLowerCase();
              const lowerMatchedName =
                existingCompanyFromCapture.matchedName.trim().toLowerCase();
              const lowerCompanyName = matchedCompanyName.trim().toLowerCase();

              return (
                lowerContactName !== lowerMatchedName &&
                lowerContactName !== lowerCompanyName
              );
            });
            nextReviewContact = nextReviewContacts[0] || "";
          }
        }

        setReviewCompany(nextReviewCompany);
        setReviewContact(nextReviewContact);
        setReviewContacts(nextReviewContacts.join("\n"));
        setReviewPhone(aiResult.phone || "");
        setReviewLocation(aiResult.location || "");
        setReviewFleetSize(aiResult.fleet_size || "");
        setReviewOpportunity(aiResult.opportunity || "");
        setReviewTask(aiResult.task || "");
        setReviewActivity(aiResult.activity || "");
        setReviewPainPoints((aiResult.pain_points || []).join(", "));
        setReviewNotes(aiResult.notes || "");
        setReviewSummary(aiResult.summary || "");
      }

      setAnalyzing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown capture error.";

      setErrorMessage(message);
      setAnalyzing(false);
    }
  }

  function updateMultiRecord(
    index: number,
    field: keyof MultiCaptureRecord,
    value: string | boolean | string[]
  ) {
    setMultiRecords((records) =>
      records.map((record, recordIndex) => {
        if (recordIndex !== index) return record;

        return {
          ...record,
          [field]: value,
        };
      })
    );
  }

  function toggleAllMultiRecords(selected: boolean) {
    setMultiRecords((records) =>
      records.map((record) => ({
        ...record,
        selected,
      }))
    );
  }

  async function findOrCreateCompanyFromValues(companyName: string, phone = "") {
    const cleanName = companyName.trim();

    if (!cleanName) return null;

    const { data: existingCompany, error: findError } = await supabase
      .from("companies")
      .select("id, name, phone")
      .ilike("name", cleanName)
      .limit(1)
      .maybeSingle();

    if (findError) throw new Error(`Company lookup failed: ${findError.message}`);

    if (existingCompany?.id) {
      if (phone && !existingCompany.phone) {
        await supabase
          .from("companies")
          .update({
            phone,
            updated_by: USER_ID,
          })
          .eq("id", existingCompany.id);
      }

      return existingCompany.id as string;
    }

    const { data: newCompany, error: insertError } = await supabase
      .from("companies")
      .insert({
        workspace_id: WORKSPACE_ID,
        name: cleanName,
        phone: phone || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Company save failed: ${insertError.message}`);

    return newCompany.id as string;
  }

  async function findOrCreateCompany(companyName: string) {
    return findOrCreateCompanyFromValues(companyName, reviewPhone);
  }

  async function findExistingCompanyByExactName(companyName: string) {
    const cleanName = companyName.trim();

    if (!cleanName) return null;

    const { data: existingCompany, error: findError } = await supabase
      .from("companies")
      .select("id, name")
      .ilike("name", cleanName)
      .limit(1)
      .maybeSingle();

    if (findError) {
      throw new Error(`Company lookup failed: ${findError.message}`);
    }

    return existingCompany as { id: string; name: string | null } | null;
  }

  async function findExistingCompanyFromCaptureNames(names: string[]) {
    for (const name of names) {
      const existingCompany = await findExistingCompanyByExactName(name);

      if (existingCompany?.id) {
        return {
          ...existingCompany,
          matchedName: name,
        };
      }
    }

    return null;
  }

  async function findOrCreateContactFromValues({
    contactName,
    companyId,
    phone,
    email,
    notes,
  }: {
    contactName: string;
    companyId: string | null;
    phone: string;
    email: string;
    notes: string;
  }) {
    const cleanName = contactName.trim();

    if (!cleanName) return null;

    const { firstName, lastName } = splitContactName(cleanName);

    if (!firstName) return null;

    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id, phone, email")
      .ilike("first_name", firstName)
      .limit(10);

    if (lastName) {
      query = query.ilike("last_name", lastName);
    }

    const { data: existingContacts, error: findError } = await query;

    if (findError) throw new Error(`Contact lookup failed: ${findError.message}`);

    const matchingContact = (existingContacts || []).find((contact) => {
      if (!companyId) return true;
      return contact.company_id === companyId || contact.company_id === null;
    });

    if (matchingContact?.id) {
      const updatePayload: Record<string, string> = {
        updated_by: USER_ID,
      };

      if (phone && !matchingContact.phone) {
        updatePayload.phone = phone;
      }

      if (email && !matchingContact.email) {
        updatePayload.email = email;
      }

      if (companyId && !matchingContact.company_id) {
        updatePayload.company_id = companyId;
      }

      await supabase
        .from("contacts")
        .update(updatePayload)
        .eq("id", matchingContact.id);

      return matchingContact.id as string;
    }

    const { data: newContact, error: insertError } = await supabase
      .from("contacts")
      .insert({
        workspace_id: WORKSPACE_ID,
        first_name: firstName,
        last_name: lastName || null,
        company_id: companyId,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Contact save failed: ${insertError.message}`);

    return newContact.id as string;
  }

  async function findOrCreateContact(
    contactName: string,
    companyId: string | null,
    phoneForThisContact: string
  ) {
    return findOrCreateContactFromValues({
      contactName,
      companyId,
      phone: phoneForThisContact,
      email: "",
      notes:
        `Created from AI Capture.\n\n${reviewNotes || ""}\n\n${
          reviewSummary || ""
        }\n\nLocation: ${reviewLocation || "Not found"}\nFleet Size: ${
          reviewFleetSize || "Not found"
        }\nAll Contacts Mentioned:\n${parseContacts(
          reviewContacts,
          reviewContact
        ).join("\n")}`.trim() || "",
    });
  }

  async function saveAllContacts(companyId: string | null) {
    const contactNames = parseContacts(reviewContacts, reviewContact);
    const contactIds: string[] = [];

    for (let index = 0; index < contactNames.length; index += 1) {
      const contactName = contactNames[index];
      const phoneForThisContact =
        contactName.toLowerCase() === reviewContact.trim().toLowerCase()
          ? reviewPhone
          : "";

      const contactId = await findOrCreateContact(
        contactName,
        companyId,
        phoneForThisContact
      );

      if (contactId) {
        contactIds.push(contactId);
      }
    }

    return contactIds;
  }

  async function findOrCreatePainPoint(painPointName: string) {
    const cleanName = painPointName.trim();

    if (!cleanName) return null;

    const { data: exactPainPoint, error: exactFindError } = await supabase
      .from("pain_points")
      .select("id, name")
      .eq("workspace_id", WORKSPACE_ID)
      .ilike("name", cleanName)
      .limit(1)
      .maybeSingle();

    if (exactFindError) {
      throw new Error(`Pain point lookup failed: ${exactFindError.message}`);
    }

    if (exactPainPoint?.id) {
      return exactPainPoint.id as string;
    }

    const { data: existingPainPoints, error: similarFindError } = await supabase
      .from("pain_points")
      .select("id, name")
      .eq("workspace_id", WORKSPACE_ID)
      .limit(500);

    if (similarFindError) {
      throw new Error(`Pain point lookup failed: ${similarFindError.message}`);
    }

    const matchingPainPoint = (existingPainPoints || []).find((painPoint) =>
      areLikelyDuplicateTexts(cleanName, painPoint.name || "")
    );

    if (matchingPainPoint?.id) {
      return matchingPainPoint.id as string;
    }

    const { data: newPainPoint, error: insertError } = await supabase
      .from("pain_points")
      .insert({
        workspace_id: WORKSPACE_ID,
        name: cleanName,
        category: guessPainPointCategory(cleanName),
        description: `Discovered through AI Capture.\n\n${reviewSummary || inputText}`,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Pain point save failed: ${insertError.message}`);
    }

    return newPainPoint.id as string;
  }

  async function findOrCreateOpportunity(
    opportunityValue: string,
    companyId: string | null,
    primaryContactId: string | null
  ) {
    type ExistingOpportunityForCapture = {
      id: string;
      name: string | null;
      company_id: string | null;
      primary_contact_id: string | null;
      opportunity_type: string | null;
      opportunity_type_other_description: string | null;
      stage: string | null;
      lead_temperature: string | null;
      estimated_driver_count: number | null;
      next_step: string | null;
      notes: string | null;
    };

    const cleanOpportunity = opportunityValue.trim();

    if (!cleanOpportunity || !companyId) return null;

    const companyNameForOpportunity = reviewCompany.trim();
    const opportunityName = companyNameForOpportunity
      ? `${companyNameForOpportunity} - ${cleanOpportunity}`
      : cleanOpportunity;

    const capturedStage = normalizeOpportunityStage(cleanOpportunity);
    const capturedType = normalizeOpportunityType(cleanOpportunity);
    const capturedFleetSize = reviewFleetSize
      ? parseFleetSize(reviewFleetSize)
      : null;

    const opportunitySelect =
      "id, name, company_id, primary_contact_id, opportunity_type, opportunity_type_other_description, stage, lead_temperature, estimated_driver_count, next_step, notes";

    function shouldApplyCapturedStage(currentStage: string | null) {
      if (capturedStage === "New Lead") {
        return !currentStage;
      }

      return capturedStage !== currentStage;
    }

    function buildCaptureOpportunityNoteBlock(changedAt: string) {
      const contactsMentioned = parseContacts(reviewContacts, reviewContact);
      const parts: string[] = [];

      if (reviewNotes.trim()) {
        parts.push(`Notes: ${reviewNotes.trim()}`);
      }

      if (reviewSummary.trim()) {
        parts.push(`Summary: ${reviewSummary.trim()}`);
      }

      if (reviewLocation.trim()) {
        parts.push(`Location: ${reviewLocation.trim()}`);
      }

      if (reviewFleetSize.trim()) {
        parts.push(`Fleet Size: ${reviewFleetSize.trim()}`);
      }

      if (contactsMentioned.length > 0) {
        parts.push(`Contacts Mentioned:\n${contactsMentioned.join("\n")}`);
      }

      if (parts.length === 0) return "";

      return `[AI Capture Update ${new Date(changedAt).toLocaleString()}]\n${parts.join(
        "\n"
      )}`;
    }

    async function updateExistingOpportunityFromCapture(
      existingOpportunity: ExistingOpportunityForCapture
    ) {
      const changedAt = new Date().toISOString();
      const shouldUpdateStage = shouldApplyCapturedStage(existingOpportunity.stage);
      const noteBlock = buildCaptureOpportunityNoteBlock(changedAt);
      const existingNotes = existingOpportunity.notes || "";
      const shouldAppendNoteBlock =
        Boolean(noteBlock) &&
        !areLikelyDuplicateTexts(noteBlock, existingNotes) &&
        !areLikelyDuplicateTexts(reviewNotes, existingNotes) &&
        !areLikelyDuplicateTexts(reviewSummary, existingNotes);

      const nextNotes = shouldAppendNoteBlock
        ? [existingNotes, noteBlock].filter(Boolean).join("\n\n")
        : existingOpportunity.notes;

      const nextOpportunityType =
        capturedType !== "Other"
          ? capturedType
          : existingOpportunity.opportunity_type || capturedType;

      const nextOtherDescription =
        nextOpportunityType === "Other"
          ? existingOpportunity.opportunity_type_other_description ||
            cleanOpportunity
          : null;

      const nextPrimaryContactId =
        primaryContactId || existingOpportunity.primary_contact_id || null;
      const nextLeadTemperature = existingOpportunity.lead_temperature || "Warm";
      const nextEstimatedDriverCount =
        capturedFleetSize ?? existingOpportunity.estimated_driver_count ?? null;
      const nextNextStep = reviewTask.trim()
        ? reviewTask.trim()
        : existingOpportunity.next_step || null;

      const shouldUpdateOpportunity =
        shouldUpdateStage ||
        nextPrimaryContactId !==
          (existingOpportunity.primary_contact_id || null) ||
        nextOpportunityType !== (existingOpportunity.opportunity_type || null) ||
        nextOtherDescription !==
          (existingOpportunity.opportunity_type_other_description || null) ||
        nextLeadTemperature !== (existingOpportunity.lead_temperature || null) ||
        nextEstimatedDriverCount !==
          (existingOpportunity.estimated_driver_count ?? null) ||
        nextNextStep !== (existingOpportunity.next_step || null) ||
        (nextNotes || null) !== (existingOpportunity.notes || null);

      if (!shouldUpdateOpportunity) {
        return existingOpportunity.id;
      }

      const updatePayload: Record<string, string | number | null> = {
        primary_contact_id: nextPrimaryContactId,
        opportunity_type: nextOpportunityType,
        opportunity_type_other_description: nextOtherDescription,
        lead_temperature: nextLeadTemperature,
        estimated_driver_count: nextEstimatedDriverCount,
        next_step: nextNextStep,
        notes: nextNotes || null,
        updated_by: USER_ID,
        updated_at: changedAt,
      };

      if (shouldUpdateStage) {
        updatePayload.stage = capturedStage;
      }

      const { error: updateError } = await supabase
        .from("opportunities")
        .update(updatePayload)
        .eq("id", existingOpportunity.id);

      if (updateError) {
        throw new Error(`Opportunity update failed: ${updateError.message}`);
      }

      if (shouldUpdateStage) {
        const { error: stageHistoryError } = await supabase
          .from("opportunity_stage_history")
          .insert({
            workspace_id: WORKSPACE_ID,
            opportunity_id: existingOpportunity.id,
            old_stage: existingOpportunity.stage || null,
            new_stage: capturedStage,
            changed_by: USER_ID,
            changed_at: changedAt,
            notes: "Stage changed by AI Capture.",
          });

        if (stageHistoryError) {
          throw new Error(
            `Opportunity updated, but stage history failed: ${stageHistoryError.message}`
          );
        }
      }

      return existingOpportunity.id;
    }

    const { data: exactOpportunity, error: exactFindError } = await supabase
      .from("opportunities")
      .select(opportunitySelect)
      .eq("company_id", companyId)
      .eq("is_archived", false)
      .ilike("name", opportunityName)
      .limit(1)
      .maybeSingle();

    if (exactFindError) {
      throw new Error(`Opportunity lookup failed: ${exactFindError.message}`);
    }

    if (exactOpportunity?.id) {
      return updateExistingOpportunityFromCapture(
        exactOpportunity as unknown as ExistingOpportunityForCapture
      );
    }

    const { data: existingOpportunities, error: activeFindError } = await supabase
      .from("opportunities")
      .select(opportunitySelect)
      .eq("company_id", companyId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(25);

    if (activeFindError) {
      throw new Error(`Opportunity lookup failed: ${activeFindError.message}`);
    }

    const activeOpportunities = (
      (existingOpportunities ?? []) as unknown as ExistingOpportunityForCapture[]
    ).filter((opportunity) => {
      const stage = opportunity.stage || "";

      return stage !== "Lost" && stage !== "Paused" && stage !== "Customer";
    });

    const sameTypeOpportunities =
      capturedType === "Other"
        ? []
        : activeOpportunities.filter(
            (opportunity) => opportunity.opportunity_type === capturedType
          );

    const reusableOpportunity =
      sameTypeOpportunities.length === 1
        ? sameTypeOpportunities[0]
        : activeOpportunities.length === 1
        ? activeOpportunities[0]
        : null;

    if (reusableOpportunity) {
      return updateExistingOpportunityFromCapture(reusableOpportunity);
    }

    const { data: newOpportunity, error: insertError } = await supabase
      .from("opportunities")
      .insert({
        workspace_id: WORKSPACE_ID,
        name: opportunityName,
        company_id: companyId,
        primary_contact_id: primaryContactId,
        opportunity_type: capturedType,
        opportunity_type_other_description:
          capturedType === "Other" ? cleanOpportunity : null,
        stage: capturedStage,
        lead_temperature: "Warm",
        estimated_driver_count: capturedFleetSize,
        next_step: reviewTask || null,
        notes:
          `${reviewNotes || ""}\n\n${reviewSummary || ""}\n\nLocation: ${
            reviewLocation || "Not found"
          }\nFleet Size: ${reviewFleetSize || "Not found"}\nContacts Mentioned:\n${parseContacts(
            reviewContacts,
            reviewContact
          ).join("\n")}`.trim() || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Opportunity save failed: ${insertError.message}`);
    }

    return newOpportunity.id as string;
  }

  async function findOrCreateTask(
    taskValue: string,
    companyId: string | null,
    primaryContactId: string | null,
    opportunityId: string | null
  ) {
    type ExistingTaskForCapture = {
      id: string;
      title: string | null;
      company_id: string | null;
      contact_id: string | null;
      opportunity_id: string | null;
      status: string | null;
    };

    const cleanTask = taskValue.trim();

    if (!cleanTask) return null;

    let query = supabase
      .from("tasks")
      .select("id, title, company_id, contact_id, opportunity_id, status")
      .limit(100);

    if (opportunityId) {
      query = query.eq("opportunity_id", opportunityId);
    } else if (companyId) {
      query = query.eq("company_id", companyId);
    } else if (primaryContactId) {
      query = query.eq("contact_id", primaryContactId);
    } else {
      query = query.ilike("title", cleanTask);
    }

    const { data: existingTasks, error: findError } = await query;

    if (findError) {
      throw new Error(`Task lookup failed: ${findError.message}`);
    }

    const matchingTask = (
      (existingTasks || []) as unknown as ExistingTaskForCapture[]
    ).find((task) => {
      const status = task.status || "";
      const isOpen = status !== "Completed" && status !== "Cancelled";
      const contactMatches =
        !primaryContactId || !task.contact_id || task.contact_id === primaryContactId;
      const opportunityMatches =
        !opportunityId || !task.opportunity_id || task.opportunity_id === opportunityId;

      return (
        isOpen &&
        contactMatches &&
        opportunityMatches &&
        areLikelyDuplicateTexts(cleanTask, task.title || "")
      );
    });

    if (matchingTask?.id) {
      const updatePayload: Record<string, string> = {
        updated_by: USER_ID,
      };

      if (companyId && !matchingTask.company_id) {
        updatePayload.company_id = companyId;
      }

      if (primaryContactId && !matchingTask.contact_id) {
        updatePayload.contact_id = primaryContactId;
      }

      if (opportunityId && !matchingTask.opportunity_id) {
        updatePayload.opportunity_id = opportunityId;
      }

      const { error: updateError } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", matchingTask.id);

      if (updateError) {
        throw new Error(`Task update failed: ${updateError.message}`);
      }

      return matchingTask.id as string;
    }

    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        workspace_id: WORKSPACE_ID,
        title: cleanTask,
        description:
          `Created from AI Capture.\n\n${
            reviewSummary || ""
          }\n\nNotes:\n${reviewNotes || ""}\n\nContacts Mentioned:\n${parseContacts(
            reviewContacts,
            reviewContact
          ).join("\n")}\n\nOriginal text:\n${
            inputText || sourceFileText || "[Uploaded file capture]"
          }`,
        due_date: null,
        priority: "Normal",
        status: "Open",
        assigned_to: USER_ID,
        company_id: companyId,
        contact_id: primaryContactId,
        opportunity_id: opportunityId,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Task save failed: ${insertError.message}`);
    }

    return newTask.id as string;
  }

  async function createActivity(
    activityValue: string,
    companyId: string | null,
    primaryContactId: string | null,
    taskId: string | null,
    opportunityId: string | null
  ) {
    type ExistingActivityForCapture = {
      id: string;
      subject: string | null;
      company_id: string | null;
      contact_id: string | null;
      task_id: string | null;
      opportunity_id: string | null;
      activity_type: string | null;
      outcome: string | null;
    };

    const cleanActivity = activityValue.trim() || "AI Capture File Review";
    const activityType = normalizeActivityType(cleanActivity);
    const outcome = normalizeActivityOutcome(reviewOpportunity, reviewTask);

    const subjectParts = [];

    if (cleanActivity) subjectParts.push(cleanActivity);
    if (reviewCompany) subjectParts.push(reviewCompany);
    if (reviewContact) subjectParts.push(reviewContact);

    const subject = subjectParts.join(" - ") || "AI Capture Activity";

    let duplicateQuery = supabase
      .from("activities")
      .select(
        "id, subject, company_id, contact_id, task_id, opportunity_id, activity_type, outcome"
      )
      .gte("activity_date", recentDuplicateCutoff(48))
      .order("activity_date", { ascending: false })
      .limit(100);

    if (opportunityId) {
      duplicateQuery = duplicateQuery.eq("opportunity_id", opportunityId);
    } else if (companyId) {
      duplicateQuery = duplicateQuery.eq("company_id", companyId);
    } else if (primaryContactId) {
      duplicateQuery = duplicateQuery.eq("contact_id", primaryContactId);
    }

    const { data: existingActivities, error: findError } = await duplicateQuery;

    if (findError) {
      throw new Error("Activity lookup failed: " + findError.message);
    }

    const matchingActivity = (
      (existingActivities || []) as unknown as ExistingActivityForCapture[]
    ).find((activity) => {
      const sameType = !activity.activity_type || activity.activity_type === activityType;
      const sameOutcome = !activity.outcome || activity.outcome === outcome;

      return (
        sameType &&
        sameOutcome &&
        (areLikelyDuplicateTexts(subject, activity.subject || "") ||
          areLikelyDuplicateTexts(cleanActivity, activity.subject || ""))
      );
    });

    if (matchingActivity?.id) {
      const updatePayload: Record<string, string> = {
        updated_by: USER_ID,
      };

      if (companyId && !matchingActivity.company_id) {
        updatePayload.company_id = companyId;
      }

      if (primaryContactId && !matchingActivity.contact_id) {
        updatePayload.contact_id = primaryContactId;
      }

      if (taskId && !matchingActivity.task_id) {
        updatePayload.task_id = taskId;
      }

      if (opportunityId && !matchingActivity.opportunity_id) {
        updatePayload.opportunity_id = opportunityId;
      }

      const { error: updateError } = await supabase
        .from("activities")
        .update(updatePayload)
        .eq("id", matchingActivity.id);

      if (updateError) {
        throw new Error("Activity update failed: " + updateError.message);
      }

      return matchingActivity.id as string;
    }

    const { data: newActivity, error: insertError } = await supabase
      .from("activities")
      .insert({
        workspace_id: WORKSPACE_ID,
        activity_type: activityType,
        activity_date: getNowForActivity(),
        subject,
        summary:
          (reviewSummary || "") +
          "\n\nNotes:\n" +
          (reviewNotes || "") +
          "\n\nContacts Mentioned:\n" +
          parseContacts(reviewContacts, reviewContact).join("\n") +
          "\n\nLocation: " +
          (reviewLocation || "Not found") +
          "\nFleet Size: " +
          (reviewFleetSize || "Not found") +
          "\n\nOriginal text:\n" +
          (inputText || sourceFileText || "[Uploaded file capture]"),
        outcome,
        follow_up_needed: Boolean(reviewTask.trim()),
        company_id: companyId,
        contact_id: primaryContactId,
        task_id: taskId,
        opportunity_id: opportunityId,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error("Activity save failed: " + insertError.message);
    }

    return newActivity.id as string;
  }

  async function createMultiRecordImportActivity(records: MultiCaptureRecord[]) {
    const summaries = records
      .slice(0, 50)
      .map((record, index) => {
        return `${index + 1}. ${record.company || "No company"}${
          record.contact ? ` â€” ${record.contact}` : ""
        }${record.phone ? ` â€” ${record.phone}` : ""}${
          record.email ? ` â€” ${record.email}` : ""
        }\n${record.summary || record.notes || ""}`;
      })
      .join("\n\n");

    const { data: newActivity, error: insertError } = await supabase
      .from("activities")
      .insert({
        workspace_id: WORKSPACE_ID,
        activity_type: "Note",
        activity_date: getNowForActivity(),
        subject: `AI Capture Multi-Record Import - ${
          sourceFile?.name || "Source File"
        }`,
        summary:
          `Imported ${records.length} selected records from AI Capture V5.\n\nSource Type: ${
            sourceType || "Unknown"
          }\nSource File: ${
            sourceFile?.name || "No source file"
          }\n\nRecords:\n${summaries}`.trim(),
        raw_notes: inputText || sourceFileText || null,
        outcome: "Follow-Up Needed",
        follow_up_needed: true,
        company_id: null,
        contact_id: null,
        task_id: null,
        opportunity_id: null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Import activity save failed: ${insertError.message}`);
    }

    return newActivity.id as string;
  }

  async function uploadSourceFileAttachment(activityId: string) {
    if (!sourceFile) return false;

    const safeFileName = sourceFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const storagePath = `${WORKSPACE_ID}/related_activity_id/${activityId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sell-it-attachments")
      .upload(storagePath, sourceFile);

    if (uploadError) {
      throw new Error(`Source file upload failed: ${uploadError.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("sell-it-attachments")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signedUrlError) {
      throw new Error(
        `Source file uploaded, but signed link failed: ${signedUrlError.message}`
      );
    }

    const { error: insertError } = await supabase.from("attachments").insert({
      workspace_id: WORKSPACE_ID,
      related_activity_id: activityId,
      file_name: sourceFile.name,
      file_type: getAttachmentFileType(sourceFile),
      file_url: signedUrlData.signedUrl,
      storage_path: storagePath,
      file_path: storagePath,
      description: `Original source file used for AI Capture.\n\n${
        reviewSummary || multiSaveMessage || ""
      }`,
      uploaded_by: null,
    });

    if (insertError) {
      throw new Error(
        `Source file uploaded, but attachment record failed: ${insertError.message}`
      );
    }

    return true;
  }

  async function linkPainPointRelations(
    painPointId: string,
    companyId: string | null,
    contactIds: string[],
    activityId: string | null
  ) {
    if (companyId) {
      await supabase.from("pain_point_companies").upsert(
        {
          workspace_id: WORKSPACE_ID,
          pain_point_id: painPointId,
          company_id: companyId,
          created_by: USER_ID,
        },
        { onConflict: "pain_point_id,company_id" }
      );
    }

    for (const contactId of contactIds) {
      await supabase.from("pain_point_contacts").upsert(
        {
          workspace_id: WORKSPACE_ID,
          pain_point_id: painPointId,
          contact_id: contactId,
          created_by: USER_ID,
        },
        { onConflict: "pain_point_id,contact_id" }
      );
    }

    if (activityId) {
      await supabase.from("pain_point_activities").upsert(
        {
          workspace_id: WORKSPACE_ID,
          pain_point_id: painPointId,
          activity_id: activityId,
          created_by: USER_ID,
        },
        { onConflict: "pain_point_id,activity_id" }
      );
    }
  }

  async function handleSaveReviewedResult() {
    setSaving(true);
    setErrorMessage("");
    setSaveMessage("");
    setSavedLinks(null);

    try {
      const companyId = await findOrCreateCompany(reviewCompany);
      const contactIds = await saveAllContacts(companyId);
      const primaryContactId = contactIds[0] || null;

      const opportunityId = await findOrCreateOpportunity(
        reviewOpportunity,
        companyId,
        primaryContactId
      );

      const taskId = await findOrCreateTask(
        reviewTask,
        companyId,
        primaryContactId,
        opportunityId
      );

      const activityId = await createActivity(
        reviewActivity,
        companyId,
        primaryContactId,
        taskId,
        opportunityId
      );

      let sourceFileAttached = false;

      if (activityId) {
        sourceFileAttached = await uploadSourceFileAttachment(activityId);
      }

      const painPointNames = parsePainPoints(reviewPainPoints);
      const painPointIds: string[] = [];

      for (const painPointName of painPointNames) {
        const painPointId = await findOrCreatePainPoint(painPointName);

        if (painPointId) {
          painPointIds.push(painPointId);
          await linkPainPointRelations(
            painPointId,
            companyId,
            contactIds,
            activityId
          );
        }
      }

      setSavedLinks({
        companyId: companyId || undefined,
        contactId: primaryContactId || undefined,
        contactIds,
        opportunityId: opportunityId || undefined,
        taskId: taskId || undefined,
        activityId: activityId || undefined,
        painPointIds,
        sourceFileAttached,
      });

      setSaveMessage("Reviewed AI Capture result saved to Sell It.");
      setSaving(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      setErrorMessage(message);
      setSaving(false);
    }
  }

  async function handleSaveSelectedMultiRecords() {
    setSavingMulti(true);
    setErrorMessage("");
    setMultiSaveMessage("");
    setMultiSaveSummary(null);

    try {
      const selectedRecords = multiRecords.filter((record) => record.selected);

      if (selectedRecords.length === 0) {
        setErrorMessage("Select at least one extracted record before saving.");
        setSavingMulti(false);
        return;
      }

      const importActivityId = await createMultiRecordImportActivity(
        selectedRecords
      );

      let sourceFileAttached = false;

      if (importActivityId) {
        sourceFileAttached = await uploadSourceFileAttachment(importActivityId);
      }

      const companyIds: string[] = [];
      const contactIds: string[] = [];

      for (const record of selectedRecords) {
        const companyId = await findOrCreateCompanyFromValues(
          record.company || "",
          record.contact ? "" : record.phone || ""
        );

        if (companyId) {
          companyIds.push(companyId);
        }

        const contactNames = parseContacts(
          (record.contacts || []).join("\n"),
          record.contact || ""
        );

        for (let index = 0; index < contactNames.length; index += 1) {
          const contactName = contactNames[index];
          const isPrimary =
            contactName.toLowerCase() ===
            String(record.contact || "").trim().toLowerCase();

          const contactId = await findOrCreateContactFromValues({
            contactName,
            companyId,
            phone: isPrimary ? record.phone || "" : "",
            email: isPrimary ? record.email || "" : "",
            notes: buildMultiRecordNotes(record),
          });

          if (contactId) {
            contactIds.push(contactId);
          }
        }
      }

      const uniqueCompanyIds = dedupeStrings(companyIds);
      const uniqueContactIds = dedupeStrings(contactIds);

      setMultiSaveSummary({
        importActivityId,
        selectedCount: selectedRecords.length,
        companyIds: uniqueCompanyIds,
        contactIds: uniqueContactIds,
        sourceFileAttached,
      });

      setMultiSaveMessage(
        "Selected AI Capture records saved to Sell It. Companies and contacts were created or reused, and the source file was attached to an import activity."
      );

      setSavingMulti(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Multi-record save failed.";

      setErrorMessage(message);
      setSavingMulti(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#f8fafc",
        padding: "28px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          maxWidth: "1120px",
          marginBottom: "24px",
          border: "1px solid rgba(148, 163, 184, 0.16)",
          borderRadius: "24px",
          padding: "24px",
          background:
            "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 32%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
          boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#a78bfa",
            fontSize: "13px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Capture
        </p>

        <h1
          style={{
            margin: "0 0 10px",
            fontSize: "34px",
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
          }}
        >
          AI Capture
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            margin: 0,
            maxWidth: "860px",
            lineHeight: 1.65,
          }}
        >
          Paste text, upload source files, drag and drop documents, or paste a
          screenshot. AI Capture can extract one lead, multiple records, or
          carrier/contact information from scanned documents.
        </p>
      </header>

      <form
        onSubmit={handleAnalyze}
        style={{
          maxWidth: "950px",
          marginBottom: "36px",
        }}
      >
        <label>
          Capture Text
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            rows={8}
            placeholder={`Example:\nCalled ABC Trucking.\nTalked to Joe Smith.\n35 trucks.\nNeed more trucks.\nInterested in alpha testing.\nCall him next Friday.`}
            style={inputStyle}
          />
        </label>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            ...dropZoneStyle,
            borderColor: isDragging ? "white" : "#555",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Upload Source File</h2>

          <p style={{ color: "#aaa" }}>
            Drag and drop any source file anywhere on this page, use the file
            picker below, or press Ctrl + V to paste a copied screenshot.
          </p>

          <p style={{ color: "#aaa" }}>
            V5 supports screenshots, CSV/text, PDF, DOC/DOCX, and XLS/XLSX for
            AI analysis. Unsupported files can still be attached as source
            evidence.
          </p>

          <input
            type="file"
            onChange={(event) =>
              handleSourceFile(event.target.files?.[0] ?? null)
            }
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.28)",
              borderRadius: "12px",
            }}
          />
        </div>

        {sourceFile && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Source File Ready</h3>

            <p>
              <strong>File:</strong> {sourceFile.name}
            </p>

            <p>
              <strong>Type:</strong>{" "}
              {sourceFile.type || getFileExtension(sourceFile.name) || "Unknown"}
            </p>

            <p>
              <strong>Size:</strong> {formatFileSize(sourceFile.size)}
            </p>

            {sourceFileReadMessage && <p>{sourceFileReadMessage}</p>}

            {sourceFilePreviewUrl && (
              <img
                src={sourceFilePreviewUrl}
                alt="Source file preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "450px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  display: "block",
                  marginBottom: "12px",
                }}
              />
            )}

            {isPdfFile(sourceFile) && (
              <div
                style={{
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#111",
                  marginBottom: "12px",
                }}
              >
                <p style={{ marginTop: 0 }}>
                  <strong>PDF Document:</strong> ready for scanned document /
                  carrier packet extraction.
                </p>

                <p style={{ color: "#aaa" }}>
                  After analysis, review the extracted company/contact fields
                  before saving.
                </p>
              </div>
            )}

            {sourceFileText && (
              <div
                style={{
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#111",
                  maxHeight: "220px",
                  overflow: "auto",
                  marginBottom: "12px",
                }}
              >
                <p style={{ marginTop: 0 }}>
                  <strong>Readable file preview:</strong>
                </p>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "Arial, sans-serif",
                    margin: 0,
                  }}
                >
                  {sourceFileText.slice(0, 3000)}
                </pre>
              </div>
            )}

            <button type="button" onClick={clearSourceFile} style={buttonStyle}>
              Remove Source File
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={analyzing}
          style={{ ...buttonStyle, marginTop: "16px" }}
        >
          {analyzing ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {errorMessage && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#7a2222",
            color: "#ff8a8a",
            maxWidth: "950px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Error</h2>
          <p>{errorMessage}</p>
        </div>
      )}

      {multiRecords.length > 0 && (
        <section style={{ maxWidth: "1100px", marginBottom: "40px" }}>
          <h2>AI Capture V5 â€” Multi-Record Review</h2>

          <p style={{ color: "#aaa" }}>
            Source Type: {sourceType || "Unknown"} | Records Found:{" "}
            {multiRecords.length}
          </p>

          <p style={{ color: "#aaa" }}>
            Use this section for CSV files, tables, messy contact lists,
            carrier packets, PDFs, scanned documents, and multi-company files.
            Select only the records you want to save.
          </p>

          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => toggleAllMultiRecords(true)}
              style={secondaryButtonStyle}
            >
              Select All
            </button>

            <button
              type="button"
              onClick={() => toggleAllMultiRecords(false)}
              style={secondaryButtonStyle}
            >
              Unselect All
            </button>

            <button
              type="button"
              disabled={savingMulti}
              onClick={handleSaveSelectedMultiRecords}
              style={buttonStyle}
            >
              {savingMulti ? "Saving..." : "Save Selected Multi Records"}
            </button>
          </div>

          {multiRecords.map((record, index) => (
            <div key={`${record.company}-${record.contact}-${index}`} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ margin: 0 }}>Record {index + 1}</h3>

                <label>
                  <input
                    type="checkbox"
                    checked={record.selected}
                    onChange={(event) =>
                      updateMultiRecord(index, "selected", event.target.checked)
                    }
                    style={{ marginRight: "8px" }}
                  />
                  Save this record
                </label>
              </div>

              <label>
                Record Type
                <select
                  value={record.record_type}
                  onChange={(event) =>
                    updateMultiRecord(
                      index,
                      "record_type",
                      event.target.value as MultiCaptureRecord["record_type"]
                    )
                  }
                  style={inputStyle}
                >
                  <option value="Company">Company</option>
                  <option value="Contact">Contact</option>
                  <option value="CompanyContact">Company + Contact</option>
                  <option value="Lead">Lead</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Company
                <input
                  value={record.company || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "company", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Primary Contact
                <input
                  value={record.contact || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "contact", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                All Contacts
                <textarea
                  value={(record.contacts || []).join("\n")}
                  onChange={(event) =>
                    updateMultiRecord(
                      index,
                      "contacts",
                      parseContacts(event.target.value, record.contact || "")
                    )
                  }
                  rows={3}
                  style={inputStyle}
                />
              </label>

              <label>
                Phone
                <input
                  value={record.phone || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "phone", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Email
                <input
                  value={record.email || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "email", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Location
                <input
                  value={record.location || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "location", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Fleet Size / Capacity
                <input
                  value={record.fleet_size || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "fleet_size", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Opportunity
                <input
                  value={record.opportunity || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "opportunity", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Task
                <input
                  value={record.task || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "task", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Pain Points
                <textarea
                  value={(record.pain_points || []).join(", ")}
                  onChange={(event) =>
                    updateMultiRecord(
                      index,
                      "pain_points",
                      parsePainPoints(event.target.value)
                    )
                  }
                  rows={2}
                  style={inputStyle}
                />
              </label>

              <label>
                Notes
                <textarea
                  value={record.notes || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "notes", event.target.value)
                  }
                  rows={3}
                  style={inputStyle}
                />
              </label>

              <label>
                Summary
                <textarea
                  value={record.summary || ""}
                  onChange={(event) =>
                    updateMultiRecord(index, "summary", event.target.value)
                  }
                  rows={3}
                  style={inputStyle}
                />
              </label>

              <p>
                <strong>Confidence:</strong> {record.confidence}
              </p>
            </div>
          ))}

          <button
            type="button"
            disabled={savingMulti}
            onClick={handleSaveSelectedMultiRecords}
            style={buttonStyle}
          >
            {savingMulti ? "Saving..." : "Save Selected Multi Records"}
          </button>
        </section>
      )}

      {multiSaveMessage && (
        <section style={{ maxWidth: "950px" }}>
          <div
            style={{
              ...cardStyle,
              borderColor: "#2f7a3e",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Multi-Record Save Complete</h2>
            <p>{multiSaveMessage}</p>

            {multiSaveSummary && (
              <>
                <p>Selected Records Saved: {multiSaveSummary.selectedCount}</p>
                <p>Companies Saved/Linked: {multiSaveSummary.companyIds.length}</p>
                <p>Contacts Saved/Linked: {multiSaveSummary.contactIds.length}</p>
                <p>
                  Source File Attached:{" "}
                  {multiSaveSummary.sourceFileAttached ? "Yes" : "No"}
                </p>

                {multiSaveSummary.importActivityId && (
                  <p>
                    Import Activity:{" "}
                    <Link
                      href={`/activities/${multiSaveSummary.importActivityId}`}
                      style={{ color: "#8ab4ff" }}
                    >
                      Open import activity
                    </Link>
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {result && (
        <section style={{ maxWidth: "950px" }}>
          <h2>Single-Record Review</h2>

          <p style={{ color: "#aaa" }}>
            Use this section when the source is one lead, one conversation, one
            screenshot, or one scanned document. For CSV/list imports, use the
            multi-record review section above.
          </p>

          <div style={cardStyle}>
            <label>
              Company / Community
              <input
                value={reviewCompany}
                onChange={(event) => setReviewCompany(event.target.value)}
                placeholder="Company, group, community, or organization name"
                style={inputStyle}
              />
            </label>

            <label>
              Primary Contact
              <input
                value={reviewContact}
                onChange={(event) => setReviewContact(event.target.value)}
                placeholder="Primary contact name"
                style={inputStyle}
              />
            </label>

            <label>
              All Contacts Found
              <textarea
                value={reviewContacts}
                onChange={(event) => setReviewContacts(event.target.value)}
                rows={5}
                placeholder={`One contact per line.\nExample:\nMike Johnson\nSarah Miller\nTom Reed`}
                style={inputStyle}
              />
            </label>

            <label>
              Phone
              <input
                value={reviewPhone}
                onChange={(event) => setReviewPhone(event.target.value)}
                placeholder="Phone number for primary contact if known"
                style={inputStyle}
              />
            </label>

            <label>
              Location
              <input
                value={reviewLocation}
                onChange={(event) => setReviewLocation(event.target.value)}
                placeholder="City, state, region"
                style={inputStyle}
              />
            </label>

            <label>
              Fleet Size
              <input
                value={reviewFleetSize}
                onChange={(event) => setReviewFleetSize(event.target.value)}
                placeholder="Example: 45 trucks"
                style={inputStyle}
              />
            </label>

            <label>
              Opportunity
              <input
                value={reviewOpportunity}
                onChange={(event) => setReviewOpportunity(event.target.value)}
                placeholder="Opportunity or sales stage"
                style={inputStyle}
              />
            </label>

            <label>
              Task
              <input
                value={reviewTask}
                onChange={(event) => setReviewTask(event.target.value)}
                placeholder="Next action"
                style={inputStyle}
              />
            </label>

            <label>
              Activity
              <input
                value={reviewActivity}
                onChange={(event) => setReviewActivity(event.target.value)}
                placeholder="What happened"
                style={inputStyle}
              />
            </label>

            <label>
              Pain Points
              <textarea
                value={reviewPainPoints}
                onChange={(event) => setReviewPainPoints(event.target.value)}
                rows={3}
                placeholder="Comma-separated pain points"
                style={inputStyle}
              />
            </label>

            <label>
              Notes
              <textarea
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                rows={4}
                placeholder="Extra details from the source"
                style={inputStyle}
              />
            </label>

            <label>
              Summary
              <textarea
                value={reviewSummary}
                onChange={(event) => setReviewSummary(event.target.value)}
                rows={5}
                placeholder="Summary"
                style={inputStyle}
              />
            </label>

            <p>
              <strong>AI Confidence:</strong> {result.confidence}
            </p>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveReviewedResult}
              style={buttonStyle}
            >
              {saving ? "Saving..." : "Save Single Reviewed Result"}
            </button>
          </div>
        </section>
      )}

      {saveMessage && (
        <section style={{ maxWidth: "950px" }}>
          <div
            style={{
              ...cardStyle,
              borderColor: "#2f7a3e",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Saved</h2>
            <p>{saveMessage}</p>

            {savedLinks?.companyId && (
              <p>
                Company / Community:{" "}
                <Link
                  href={`/companies/${savedLinks.companyId}`}
                  style={{ color: "#8ab4ff" }}
                >
                  Open company/community
                </Link>
              </p>
            )}

            {savedLinks?.contactId && (
              <p>
                Primary Contact:{" "}
                <Link
                  href={`/contacts/${savedLinks.contactId}`}
                  style={{ color: "#8ab4ff" }}
                >
                  Open primary contact
                </Link>
              </p>
            )}

            {savedLinks?.contactIds && savedLinks.contactIds.length > 0 && (
              <p>Contacts Saved/Linked: {savedLinks.contactIds.length}</p>
            )}

            {savedLinks?.opportunityId && (
              <p>
                Opportunity:{" "}
                <Link
                  href={`/opportunities/${savedLinks.opportunityId}`}
                  style={{ color: "#8ab4ff" }}
                >
                  Open opportunity
                </Link>
              </p>
            )}

            {savedLinks?.taskId && (
              <p>
                Task:{" "}
                <Link
                  href={`/tasks/${savedLinks.taskId}`}
                  style={{ color: "#8ab4ff" }}
                >
                  Open task
                </Link>
              </p>
            )}

            {savedLinks?.activityId && (
              <p>
                Activity:{" "}
                <Link
                  href={`/activities/${savedLinks.activityId}`}
                  style={{ color: "#8ab4ff" }}
                >
                  Open activity
                </Link>
              </p>
            )}

            {savedLinks?.painPointIds && savedLinks.painPointIds.length > 0 && (
              <p>Pain Points Saved/Linked: {savedLinks.painPointIds.length}</p>
            )}

            <p>
              Source File Attached:{" "}
              {savedLinks?.sourceFileAttached ? "Yes" : "No source file attached"}
            </p>
          </div>
        </section>
      )}

      {rawText && (
        <section style={{ maxWidth: "950px" }}>
          <h2>Raw AI Text</h2>

          <div style={cardStyle}>
            <p style={{ whiteSpace: "pre-wrap" }}>{rawText}</p>
          </div>
        </section>
      )}
    </main>
  );
}



