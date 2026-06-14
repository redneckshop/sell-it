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

type SavedRecordLinks = {
  companyId?: string;
  contactId?: string;
  contactIds?: string[];
  opportunityId?: string;
  taskId?: string;
  activityId?: string;
  painPointIds?: string[];
  screenshotAttached?: boolean;
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "12px 18px",
  borderRadius: "6px",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  marginBottom: "16px",
};

const dropZoneStyle: CSSProperties = {
  border: "2px dashed #555",
  borderRadius: "10px",
  padding: "24px",
  backgroundColor: "#181818",
  textAlign: "center",
  marginTop: "12px",
  marginBottom: "16px",
};

const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function splitContactName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
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
  if (lower.includes("facebook comment")) return "Facebook Comment";
  if (lower.includes("facebook message")) return "Facebook Message";
  if (lower.includes("facebook discussion")) return "Facebook Comment";
  if (lower.includes("facebook")) return "Facebook Comment";
  if (lower.includes("screenshot")) return "Website Research";
  if (lower.includes("research")) return "Website Research";
  if (lower.includes("note")) return "Note";

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
    combined.includes("demo")
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

  return "Operations";
}

function getNowForActivity() {
  return new Date().toISOString();
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read screenshot file."));
    reader.readAsDataURL(file);
  });
}

export default function CapturePage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [rawText, setRawText] = useState("");

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState("");
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

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
      }
    };
  }, [screenshotPreviewUrl]);

  async function handleScreenshotFile(file: File | null) {
    setErrorMessage("");
    setSaveMessage("");
    setSavedLinks(null);

    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreviewUrl("");
      setScreenshotDataUrl("");
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setErrorMessage("Screenshot must be a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrorMessage("Screenshot is too large. Use an image under 8 MB.");
      return;
    }

    if (screenshotPreviewUrl) {
      URL.revokeObjectURL(screenshotPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const dataUrl = await fileToDataUrl(file);

    setScreenshotFile(file);
    setScreenshotPreviewUrl(previewUrl);
    setScreenshotDataUrl(dataUrl);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    await handleScreenshotFile(file);
  }

  function clearScreenshot() {
    if (screenshotPreviewUrl) {
      URL.revokeObjectURL(screenshotPreviewUrl);
    }

    setScreenshotFile(null);
    setScreenshotPreviewUrl("");
    setScreenshotDataUrl("");
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAnalyzing(true);
    setResult(null);
    setRawText("");
    setErrorMessage("");
    setSaveMessage("");
    setSavedLinks(null);

    try {
      const response = await fetch("/api/capture/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          imageDataUrl: screenshotDataUrl,
          imageFileName: screenshotFile?.name || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Capture analysis failed.");
        setAnalyzing(false);
        return;
      }

      const aiResult = data.result as CaptureResult;

      setResult(aiResult || null);
      setRawText(data.raw_text || "");

      if (aiResult) {
        const allContacts = dedupeStrings([
          aiResult.contact || "",
          ...(aiResult.contacts || []),
        ]);

        setReviewCompany(aiResult.company || "");
        setReviewContact(aiResult.contact || allContacts[0] || "");
        setReviewContacts(allContacts.join("\n"));
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

  async function findOrCreateCompany(companyName: string) {
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
      if (reviewPhone && !existingCompany.phone) {
        await supabase
          .from("companies")
          .update({
            phone: reviewPhone,
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
        phone: reviewPhone || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Company save failed: ${insertError.message}`);

    return newCompany.id as string;
  }

  async function findOrCreateContact(
    contactName: string,
    companyId: string | null,
    phoneForThisContact: string
  ) {
    const cleanName = contactName.trim();

    if (!cleanName) return null;

    const { firstName, lastName } = splitContactName(cleanName);

    if (!firstName) return null;

    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, company_id, phone")
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

      if (phoneForThisContact && !matchingContact.phone) {
        updatePayload.phone = phoneForThisContact;
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
        phone: phoneForThisContact || null,
        notes:
          `Created from AI Capture.\n\n${reviewNotes || ""}\n\n${
            reviewSummary || ""
          }\n\nLocation: ${reviewLocation || "Not found"}\nFleet Size: ${
            reviewFleetSize || "Not found"
          }\nAll Contacts Mentioned:\n${parseContacts(
            reviewContacts,
            reviewContact
          ).join("\n")}`.trim() || null,
        created_by: USER_ID,
        updated_by: USER_ID,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(`Contact save failed: ${insertError.message}`);

    return newContact.id as string;
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

    const { data: existingPainPoint, error: findError } = await supabase
      .from("pain_points")
      .select("id, name")
      .ilike("name", cleanName)
      .limit(1)
      .maybeSingle();

    if (findError) {
      throw new Error(`Pain point lookup failed: ${findError.message}`);
    }

    if (existingPainPoint?.id) {
      return existingPainPoint.id as string;
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
    const cleanOpportunity = opportunityValue.trim();

    if (!cleanOpportunity || !companyId) return null;

    const opportunityName = reviewCompany
      ? `${reviewCompany} - ${cleanOpportunity}`
      : cleanOpportunity;

    const { data: existingOpportunity, error: findError } = await supabase
      .from("opportunities")
      .select("id, name, company_id")
      .eq("company_id", companyId)
      .ilike("name", opportunityName)
      .limit(1)
      .maybeSingle();

    if (findError) {
      throw new Error(`Opportunity lookup failed: ${findError.message}`);
    }

    if (existingOpportunity?.id) {
      return existingOpportunity.id as string;
    }

    const opportunityType = normalizeOpportunityType(cleanOpportunity);

    const { data: newOpportunity, error: insertError } = await supabase
      .from("opportunities")
      .insert({
        workspace_id: WORKSPACE_ID,
        name: opportunityName,
        company_id: companyId,
        primary_contact_id: primaryContactId,
        opportunity_type: opportunityType,
        opportunity_type_other_description:
          opportunityType === "Other" ? cleanOpportunity : null,
        stage: normalizeOpportunityStage(cleanOpportunity),
        lead_temperature: "Warm",
        estimated_driver_count: reviewFleetSize
          ? parseFleetSize(reviewFleetSize)
          : null,
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
    const cleanTask = taskValue.trim();

    if (!cleanTask) return null;

    let query = supabase
      .from("tasks")
      .select("id, title, company_id, contact_id, opportunity_id")
      .ilike("title", cleanTask)
      .limit(10);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: existingTasks, error: findError } = await query;

    if (findError) {
      throw new Error(`Task lookup failed: ${findError.message}`);
    }

    const matchingTask = (existingTasks || []).find((task) => {
      const contactMatches = !primaryContactId || task.contact_id === primaryContactId;
      const opportunityMatches =
        !opportunityId || task.opportunity_id === opportunityId;

      return contactMatches && opportunityMatches;
    });

    if (matchingTask?.id) {
      return matchingTask.id as string;
    }

    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        workspace_id: WORKSPACE_ID,
        title: cleanTask,
        description: `Created from AI Capture.\n\n${
          reviewSummary || ""
        }\n\nNotes:\n${reviewNotes || ""}\n\nContacts Mentioned:\n${parseContacts(
          reviewContacts,
          reviewContact
        ).join("\n")}\n\nOriginal text:\n${
          inputText || "[Screenshot capture only]"
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
    const cleanActivity = activityValue.trim() || "AI Capture Screenshot Review";

    const subjectParts = [];

    if (cleanActivity) subjectParts.push(cleanActivity);
    if (reviewCompany) subjectParts.push(reviewCompany);
    if (reviewContact) subjectParts.push(reviewContact);

    const subject = subjectParts.join(" - ") || "AI Capture Activity";

    const { data: newActivity, error: insertError } = await supabase
      .from("activities")
      .insert({
        workspace_id: WORKSPACE_ID,
        activity_type: normalizeActivityType(cleanActivity),
        activity_date: getNowForActivity(),
        subject,
        summary:
          `${reviewSummary || ""}\n\nNotes:\n${reviewNotes || ""}\n\nContacts Mentioned:\n${parseContacts(
            reviewContacts,
            reviewContact
          ).join("\n")}\n\nLocation: ${
            reviewLocation || "Not found"
          }\nFleet Size: ${reviewFleetSize || "Not found"}\nPhone: ${
            reviewPhone || "Not found"
          }`.trim() || null,
        raw_notes: inputText || null,
        outcome: normalizeActivityOutcome(reviewOpportunity, reviewTask),
        follow_up_needed: Boolean(reviewTask),
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
      throw new Error(`Activity save failed: ${insertError.message}`);
    }

    return newActivity.id as string;
  }

  async function uploadScreenshotAttachment(activityId: string) {
    if (!screenshotFile) return false;

    const safeFileName = screenshotFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const storagePath = `${WORKSPACE_ID}/related_activity_id/${activityId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sell-it-attachments")
      .upload(storagePath, screenshotFile);

    if (uploadError) {
      throw new Error(`Screenshot upload failed: ${uploadError.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("sell-it-attachments")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signedUrlError) {
      throw new Error(
        `Screenshot uploaded, but signed link failed: ${signedUrlError.message}`
      );
    }

    const { error: insertError } = await supabase.from("attachments").insert({
      workspace_id: WORKSPACE_ID,
      related_activity_id: activityId,
      file_name: screenshotFile.name,
      file_type: "Screenshot",
      file_url: signedUrlData.signedUrl,
      storage_path: storagePath,
      file_path: storagePath,
      description: `Original screenshot used for AI Capture.\n\n${
        reviewSummary || ""
      }`,
      uploaded_by: null,
    });

    if (insertError) {
      throw new Error(
        `Screenshot uploaded, but attachment record failed: ${insertError.message}`
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

      let screenshotAttached = false;

      if (activityId) {
        screenshotAttached = await uploadScreenshotAttachment(activityId);
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
        screenshotAttached,
      });

      setSaveMessage("Reviewed AI Capture result saved to Sell It.");
      setSaving(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed.";
      setErrorMessage(message);
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
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={linkButtonStyle}>
          Home
        </Link>
      </div>

      <h1>AI Capture</h1>

      <p style={{ color: "#aaa", marginBottom: "32px", maxWidth: "900px" }}>
        Paste text, upload a screenshot, or do both. Sell It will analyze the
        information and return editable CRM fields. Nothing is saved until you
        review and click Save Reviewed Result.
      </p>

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
          <h2 style={{ marginTop: 0 }}>Upload Screenshot</h2>

          <p style={{ color: "#aaa" }}>
            Drag and drop a PNG, JPG, JPEG, or WEBP screenshot here, or use the
            file picker below.
          </p>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(event) =>
              handleScreenshotFile(event.target.files?.[0] ?? null)
            }
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "white",
              color: "black",
              borderRadius: "6px",
            }}
          />
        </div>

        {screenshotPreviewUrl && (
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Screenshot Preview</h3>

            <p>
              <strong>File:</strong> {screenshotFile?.name}
            </p>

            <img
              src={screenshotPreviewUrl}
              alt="Screenshot preview"
              style={{
                maxWidth: "100%",
                maxHeight: "450px",
                borderRadius: "8px",
                border: "1px solid #333",
                display: "block",
                marginBottom: "12px",
              }}
            />

            <button type="button" onClick={clearScreenshot} style={buttonStyle}>
              Remove Screenshot
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

      {result && (
        <section style={{ maxWidth: "950px" }}>
          <h2>Review Before Saving</h2>

          <p style={{ color: "#aaa" }}>
            Edit anything below before saving. Nothing is saved until you click
            Save Reviewed Result.
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
                placeholder="Extra details from the screenshot"
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
              {saving ? "Saving..." : "Save Reviewed Result"}
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
              Screenshot Attached:{" "}
              {savedLinks?.screenshotAttached ? "Yes" : "No screenshot attached"}
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