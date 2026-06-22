import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MergeType = "company" | "contact" | "note" | "task" | "pain_point";

type UpdateResult = {
  error: { message: string } | null;
};

type DeleteResult = {
  error: { message: string } | null;
};

type SelectRowsResult = {
  data: GenericRow[] | null;
  error: { message: string } | null;
};

type DynamicTableBuilder = {
  update: (values: Record<string, unknown>) => {
    eq: (columnName: string, value: string) => Promise<UpdateResult>;
  };
  delete: () => {
    eq: (columnName: string, value: string) => Promise<DeleteResult>;
  };
  select: (columns: string) => {
    eq: (columnName: string, value: string) => Promise<SelectRowsResult>;
  };
};

type DynamicSupabaseClient = {
  from: (tableName: string) => DynamicTableBuilder;
};

type GenericRow = {
  id: string;
  [key: string]: unknown;
};

type NoteRecord = {
  id: string;
  title: string | null;
  body: string | null;
  source: string | null;
  source_url: string | null;
  tags: unknown;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  is_archived?: boolean | null;
};

type TaskRecord = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  is_archived?: boolean | null;
};

type PainPointRecord = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  is_archived?: boolean | null;
};

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832"; const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isMergeType(value: unknown): value is MergeType {
  return (
    value === "company" ||
    value === "contact" ||
    value === "note" ||
    value === "task" ||
    value === "pain_point"
  );
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function isMissingColumnError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("could not find") ||
    normalized.includes("schema cache") ||
    normalized.includes("column") && normalized.includes("does not exist")
  );
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stringValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function hasValue(value: unknown) {
  return stringValue(value).trim().length > 0;
}

function mergeLongText(
  survivorText: string | null,
  duplicateText: string | null,
  mergeLabel: string
) {
  const survivor = survivorText ?? "";
  const duplicate = duplicateText ?? "";

  if (!duplicate.trim()) {
    return survivorText;
  }

  if (!survivor.trim()) {
    return duplicate;
  }

  const normalizedSurvivor = normalizeText(survivor);
  const normalizedDuplicate = normalizeText(duplicate);

  if (!normalizedDuplicate) {
    return survivorText;
  }

  if (normalizedSurvivor === normalizedDuplicate) {
    return survivorText;
  }

  if (normalizedSurvivor.includes(normalizedDuplicate)) {
    return survivorText;
  }

  if (normalizedDuplicate.includes(normalizedSurvivor)) {
    return duplicate;
  }

  return `${survivor.trim()}\n\n--- ${mergeLabel} ---\n${duplicate.trim()}`;
}

function mergeTags(survivorTags: unknown, duplicateTags: unknown) {
  if (!hasValue(duplicateTags)) {
    return survivorTags;
  }

  if (!hasValue(survivorTags)) {
    return duplicateTags;
  }

  if (Array.isArray(survivorTags) || Array.isArray(duplicateTags)) {
    const survivorArray = Array.isArray(survivorTags)
      ? survivorTags.map(String)
      : stringValue(survivorTags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

    const duplicateArray = Array.isArray(duplicateTags)
      ? duplicateTags.map(String)
      : stringValue(duplicateTags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

    return Array.from(new Set([...survivorArray, ...duplicateArray]));
  }

  const survivorParts = stringValue(survivorTags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const duplicateParts = stringValue(duplicateTags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return Array.from(new Set([...survivorParts, ...duplicateParts])).join(", ");
}

async function moveRows(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  columnName: string,
  fromId: string,
  toId: string
) {
  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;

  const { error } = await dynamicSupabase
    .from(tableName)
    .update({
      [columnName]: toId,
      updated_by: USER_ID,
    })
    .eq(columnName, fromId);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }
}

async function moveRowsNoUpdatedBy(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  columnName: string,
  fromId: string,
  toId: string
) {
  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;

  const { error } = await dynamicSupabase
    .from(tableName)
    .update({
      [columnName]: toId,
    })
    .eq(columnName, fromId);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }
}

async function updateRecord(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  recordId: string,
  values: Record<string, unknown>,
  includeUpdatedBy = true
) {
  if (Object.keys(values).length === 0) {
    return;
  }

  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;

  const updateValues = includeUpdatedBy
    ? {
        ...values,
        updated_by: USER_ID,
      }
    : values;

  const { error } = await dynamicSupabase
    .from(tableName)
    .update(updateValues)
    .eq("id", recordId);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }
}

async function deleteRecord(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  recordId: string
) {
  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;

  const { error } = await dynamicSupabase
    .from(tableName)
    .delete()
    .eq("id", recordId);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }
}

async function archiveOrDeleteRecord(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  duplicateId: string,
  survivorId: string,
  survivorName: string,
  allowPermanentDelete: boolean
) {
  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;
  const archiveReason = `Merged into: ${survivorName} (${survivorId}) on ${new Date().toISOString()}`;

  const fullArchiveResult = await dynamicSupabase
    .from(tableName)
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: USER_ID,
      archive_reason: archiveReason,
      updated_by: USER_ID,
    })
    .eq("id", duplicateId);

  if (!fullArchiveResult.error) {
    return "archived";
  }

  if (!isMissingColumnError(fullArchiveResult.error.message)) {
    throw new Error(`${tableName}: ${fullArchiveResult.error.message}`);
  }

  const minimalArchiveResult = await dynamicSupabase
    .from(tableName)
    .update({
      is_archived: true,
      updated_by: USER_ID,
    })
    .eq("id", duplicateId);

  if (!minimalArchiveResult.error) {
    return "archived";
  }

  if (!isMissingColumnError(minimalArchiveResult.error.message)) {
    throw new Error(`${tableName}: ${minimalArchiveResult.error.message}`);
  }

  const simplestArchiveResult = await dynamicSupabase
    .from(tableName)
    .update({
      is_archived: true,
    })
    .eq("id", duplicateId);

  if (!simplestArchiveResult.error) {
    return "archived";
  }

  if (!isMissingColumnError(simplestArchiveResult.error.message)) {
    throw new Error(`${tableName}: ${simplestArchiveResult.error.message}`);
  }

  if (!allowPermanentDelete) {
    throw new Error(
      `${tableName}: Duplicate could not be archived because archive fields are missing. Permanent delete was not allowed.`
    );
  }

  await deleteRecord(supabase, tableName, duplicateId);

  return "permanently_deleted_after_confirmation";
}

async function selectRows(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  columns: string,
  columnName: string,
  value: string
) {
  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;

  const { data, error } = await dynamicSupabase
    .from(tableName)
    .select(columns)
    .eq(columnName, value);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }

  return data ?? [];
}

async function moveUniquePainPointRelationships(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  relationColumn: string,
  duplicatePainPointId: string,
  survivorPainPointId: string
) {
  const duplicateRows = await selectRows(
    supabase,
    tableName,
    `id, ${relationColumn}`,
    "pain_point_id",
    duplicatePainPointId
  );

  const survivorRows = await selectRows(
    supabase,
    tableName,
    `id, ${relationColumn}`,
    "pain_point_id",
    survivorPainPointId
  );

  const survivorRelationIds = new Set(
    survivorRows.map((row) => stringValue(row[relationColumn])).filter(Boolean)
  );

  let movedCount = 0;
  let skippedDuplicateCount = 0;

  for (const row of duplicateRows) {
    const relationId = stringValue(row[relationColumn]);

    if (!relationId) {
      continue;
    }

    if (survivorRelationIds.has(relationId)) {
      await deleteRecord(supabase, tableName, row.id);
      skippedDuplicateCount += 1;
      continue;
    }

    await updateRecord(
      supabase,
      tableName,
      row.id,
      {
        pain_point_id: survivorPainPointId,
      },
      false
    );

    survivorRelationIds.add(relationId);
    movedCount += 1;
  }

  return {
    tableName,
    movedCount,
    skippedDuplicateCount,
  };
}

async function mergeCompany(survivorId: string, duplicateId: string) {
  const supabase = getSupabaseAdmin();

  const { data: survivor, error: survivorError } = await supabase
    .from("companies")
    .select("id, name, is_archived")
    .eq("id", survivorId)
    .single();

  if (survivorError) {
    throw new Error(`survivor company: ${survivorError.message}`);
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("companies")
    .select("id, name, is_archived")
    .eq("id", duplicateId)
    .single();

  if (duplicateError) {
    throw new Error(`duplicate company: ${duplicateError.message}`);
  }

  if (survivor.is_archived) {
    throw new Error("The survivor company is archived.");
  }

  if (duplicate.is_archived) {
    throw new Error("The duplicate company is already archived.");
  }

  await moveRows(supabase, "contacts", "company_id", duplicateId, survivorId);
  await moveRows(supabase, "opportunities", "company_id", duplicateId, survivorId);
  await moveRows(supabase, "tasks", "company_id", duplicateId, survivorId);
  await moveRows(supabase, "activities", "company_id", duplicateId, survivorId);
  await moveRows(supabase, "notes", "company_id", duplicateId, survivorId);

  await moveRowsNoUpdatedBy(
    supabase,
    "attachments",
    "related_company_id",
    duplicateId,
    survivorId
  );

  await moveRowsNoUpdatedBy(
    supabase,
    "pain_point_companies",
    "company_id",
    duplicateId,
    survivorId
  );

  const duplicateDisposition = await archiveOrDeleteRecord(
    supabase,
    "companies",
    duplicateId,
    survivorId,
    survivor.name,
    false
  );

  return {
    survivorName: survivor.name,
    duplicateName: duplicate.name,
    duplicateDisposition,
  };
}

async function mergeContact(survivorId: string, duplicateId: string) {
  const supabase = getSupabaseAdmin();

  const { data: survivor, error: survivorError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, is_archived")
    .eq("id", survivorId)
    .single();

  if (survivorError) {
    throw new Error(`survivor contact: ${survivorError.message}`);
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, is_archived")
    .eq("id", duplicateId)
    .single();

  if (duplicateError) {
    throw new Error(`duplicate contact: ${duplicateError.message}`);
  }

  if (survivor.is_archived) {
    throw new Error("The survivor contact is archived.");
  }

  if (duplicate.is_archived) {
    throw new Error("The duplicate contact is already archived.");
  }

  const survivorName = `${survivor.first_name ?? ""} ${
    survivor.last_name ?? ""
  }`.trim();

  const duplicateName = `${duplicate.first_name ?? ""} ${
    duplicate.last_name ?? ""
  }`.trim();

  await moveRows(
    supabase,
    "opportunities",
    "primary_contact_id",
    duplicateId,
    survivorId
  );

  await moveRows(supabase, "tasks", "contact_id", duplicateId, survivorId);
  await moveRows(supabase, "activities", "contact_id", duplicateId, survivorId);
  await moveRows(supabase, "notes", "contact_id", duplicateId, survivorId);

  await moveRowsNoUpdatedBy(
    supabase,
    "attachments",
    "related_contact_id",
    duplicateId,
    survivorId
  );

  await moveRowsNoUpdatedBy(
    supabase,
    "pain_point_contacts",
    "contact_id",
    duplicateId,
    survivorId
  );

  const duplicateDisposition = await archiveOrDeleteRecord(
    supabase,
    "contacts",
    duplicateId,
    survivorId,
    survivorName || survivor.id,
    false
  );

  return {
    survivorName,
    duplicateName,
    duplicateDisposition,
  };
}

async function readNote(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  noteId: string,
  label: string
) {
  let result = await supabase
    .from("notes")
    .select(
      "id, title, body, source, source_url, tags, company_id, contact_id, opportunity_id, is_archived"
    )
    .eq("id", noteId)
    .single();

  if (result.error && isMissingColumnError(result.error.message)) {
    result = await supabase
      .from("notes")
      .select(
        "id, title, body, source, source_url, tags, company_id, contact_id, opportunity_id"
      )
      .eq("id", noteId)
      .single();
  }

  if (result.error) {
    throw new Error(`${label} note: ${result.error.message}`);
  }

  return result.data as NoteRecord;
}

async function mergeNote(
  survivorId: string,
  duplicateId: string,
  allowPermanentDelete: boolean
) {
  const supabase = getSupabaseAdmin();

  const survivor = await readNote(supabase, survivorId, "survivor");
  const duplicate = await readNote(supabase, duplicateId, "duplicate");

  if (survivor.is_archived) {
    throw new Error("The survivor note is archived.");
  }

  if (duplicate.is_archived) {
    throw new Error("The duplicate note is already archived.");
  }

  const mergedBody = mergeLongText(
    survivor.body,
    duplicate.body,
    `Merged duplicate note ${duplicate.id} on ${new Date().toISOString()}`
  );

  const updateValues: Record<string, unknown> = {};

  if (!hasValue(survivor.title) && hasValue(duplicate.title)) {
    updateValues.title = duplicate.title;
  }

  if (mergedBody !== survivor.body) {
    updateValues.body = mergedBody;
  }

  if (!hasValue(survivor.source) && hasValue(duplicate.source)) {
    updateValues.source = duplicate.source;
  }

  if (!hasValue(survivor.source_url) && hasValue(duplicate.source_url)) {
    updateValues.source_url = duplicate.source_url;
  }

  const mergedTags = mergeTags(survivor.tags, duplicate.tags);

  if (JSON.stringify(mergedTags) !== JSON.stringify(survivor.tags)) {
    updateValues.tags = mergedTags;
  }

  if (!hasValue(survivor.company_id) && hasValue(duplicate.company_id)) {
    updateValues.company_id = duplicate.company_id;
  }

  if (!hasValue(survivor.contact_id) && hasValue(duplicate.contact_id)) {
    updateValues.contact_id = duplicate.contact_id;
  }

  if (!hasValue(survivor.opportunity_id) && hasValue(duplicate.opportunity_id)) {
    updateValues.opportunity_id = duplicate.opportunity_id;
  }

  await updateRecord(supabase, "notes", survivorId, updateValues);

  await moveRowsNoUpdatedBy(
    supabase,
    "attachments",
    "related_note_id",
    duplicateId,
    survivorId
  );

  const duplicateDisposition = await archiveOrDeleteRecord(
    supabase,
    "notes",
    duplicateId,
    survivorId,
    survivor.title || survivor.body || survivor.id,
    allowPermanentDelete
  );

  return {
    survivorName: survivor.title || survivor.body || survivor.id,
    duplicateName: duplicate.title || duplicate.body || duplicate.id,
    duplicateDisposition,
    updatedFields: Object.keys(updateValues),
    movedRelationships: [
      {
        tableName: "attachments",
        columnName: "related_note_id",
      },
    ],
  };
}

async function readTask(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  taskId: string,
  label: string
) {
  let result = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, due_date, company_id, contact_id, opportunity_id, is_archived"
    )
    .eq("id", taskId)
    .single();

  if (result.error && isMissingColumnError(result.error.message)) {
    result = await supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority, due_date, company_id, contact_id, opportunity_id"
      )
      .eq("id", taskId)
      .single();
  }

  if (result.error) {
    throw new Error(`${label} task: ${result.error.message}`);
  }

  return result.data as TaskRecord;
}

async function mergeTask(
  survivorId: string,
  duplicateId: string,
  allowPermanentDelete: boolean
) {
  const supabase = getSupabaseAdmin();

  const survivor = await readTask(supabase, survivorId, "survivor");
  const duplicate = await readTask(supabase, duplicateId, "duplicate");

  if (survivor.is_archived) {
    throw new Error("The survivor task is archived.");
  }

  if (duplicate.is_archived) {
    throw new Error("The duplicate task is already archived.");
  }

  const mergedDescription = mergeLongText(
    survivor.description,
    duplicate.description,
    `Merged duplicate task ${duplicate.id} on ${new Date().toISOString()}`
  );

  const updateValues: Record<string, unknown> = {};

  if (!hasValue(survivor.title) && hasValue(duplicate.title)) {
    updateValues.title = duplicate.title;
  }

  if (mergedDescription !== survivor.description) {
    updateValues.description = mergedDescription;
  }

  if (!hasValue(survivor.status) && hasValue(duplicate.status)) {
    updateValues.status = duplicate.status;
  }

  if (!hasValue(survivor.priority) && hasValue(duplicate.priority)) {
    updateValues.priority = duplicate.priority;
  }

  if (!hasValue(survivor.due_date) && hasValue(duplicate.due_date)) {
    updateValues.due_date = duplicate.due_date;
  }

  if (!hasValue(survivor.company_id) && hasValue(duplicate.company_id)) {
    updateValues.company_id = duplicate.company_id;
  }

  if (!hasValue(survivor.contact_id) && hasValue(duplicate.contact_id)) {
    updateValues.contact_id = duplicate.contact_id;
  }

  if (!hasValue(survivor.opportunity_id) && hasValue(duplicate.opportunity_id)) {
    updateValues.opportunity_id = duplicate.opportunity_id;
  }

  await updateRecord(supabase, "tasks", survivorId, updateValues);

  await moveRows(supabase, "activities", "task_id", duplicateId, survivorId);

  await moveRowsNoUpdatedBy(
    supabase,
    "attachments",
    "related_task_id",
    duplicateId,
    survivorId
  );

  const duplicateDisposition = await archiveOrDeleteRecord(
    supabase,
    "tasks",
    duplicateId,
    survivorId,
    survivor.title || survivor.id,
    allowPermanentDelete
  );

  return {
    survivorName: survivor.title || survivor.id,
    duplicateName: duplicate.title || duplicate.id,
    duplicateDisposition,
    updatedFields: Object.keys(updateValues),
    movedRelationships: [
      {
        tableName: "attachments",
        columnName: "related_task_id",
      },
    ],
  };
}

async function readPainPoint(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  painPointId: string,
  label: string
) {
  let result = await supabase
    .from("pain_points")
    .select("id, name, description, category, is_archived")
    .eq("id", painPointId)
    .single();

  if (result.error && isMissingColumnError(result.error.message)) {
    result = await supabase
      .from("pain_points")
      .select("id, name, description, category")
      .eq("id", painPointId)
      .single();
  }

  if (result.error) {
    throw new Error(`${label} pain point: ${result.error.message}`);
  }

  return result.data as PainPointRecord;
}

async function mergePainPoint(
  survivorId: string,
  duplicateId: string,
  allowPermanentDelete: boolean
) {
  const supabase = getSupabaseAdmin();

  const survivor = await readPainPoint(supabase, survivorId, "survivor");
  const duplicate = await readPainPoint(supabase, duplicateId, "duplicate");

  if (survivor.is_archived) {
    throw new Error("The survivor pain point is archived.");
  }

  if (duplicate.is_archived) {
    throw new Error("The duplicate pain point is already archived.");
  }

  const mergedDescription = mergeLongText(
    survivor.description,
    duplicate.description,
    `Merged duplicate pain point ${duplicate.id} on ${new Date().toISOString()}`
  );

  const updateValues: Record<string, unknown> = {};

  if (!hasValue(survivor.name) && hasValue(duplicate.name)) {
    updateValues.name = duplicate.name;
  }

  if (mergedDescription !== survivor.description) {
    updateValues.description = mergedDescription;
  }

  if (!hasValue(survivor.category) && hasValue(duplicate.category)) {
    updateValues.category = duplicate.category;
  }

  await updateRecord(supabase, "pain_points", survivorId, updateValues);

  const movedRelationships = await Promise.all([
    moveUniquePainPointRelationships(
      supabase,
      "pain_point_companies",
      "company_id",
      duplicateId,
      survivorId
    ),
    moveUniquePainPointRelationships(
      supabase,
      "pain_point_contacts",
      "contact_id",
      duplicateId,
      survivorId
    ),
    moveUniquePainPointRelationships(
      supabase,
      "pain_point_activities",
      "activity_id",
      duplicateId,
      survivorId
    ),
    moveUniquePainPointRelationships(
      supabase,
      "pain_point_posts",
      "post_id",
      duplicateId,
      survivorId
    ),
  ]);

  const duplicateDisposition = await archiveOrDeleteRecord(
    supabase,
    "pain_points",
    duplicateId,
    survivorId,
    survivor.name || survivor.id,
    allowPermanentDelete
  );

  return {
    survivorName: survivor.name || survivor.id,
    duplicateName: duplicate.name || duplicate.id,
    duplicateDisposition,
    updatedFields: Object.keys(updateValues),
    movedRelationships,
  };
}

async function createMergeCompletedNotification(
  type: MergeType,
  survivorId: string,
  duplicateId: string,
  result: Record<string, unknown>
) {
  const supabase = getSupabaseAdmin();
  const survivorName =
    typeof result.survivorName === "string" && result.survivorName.trim()
      ? result.survivorName
      : survivorId;
  const relatedRecordType =
    type === "pain_point" ? "pain_points" : `${type}s`;
  const relatedUrl =
    type === "pain_point"
      ? `/pain-points/${survivorId}`
      : `/${type}s/${survivorId}`;

  const { error } = await supabase.from("notifications").insert({
    workspace_id: WORKSPACE_ID,
    recipient_user_id: null,
    notification_type: "Merge Completed",
    message: `Merge completed: ${type} duplicate merged into ${survivorName}`,
    related_record_type: relatedRecordType,
    related_record_id: survivorId,
    related_url: relatedUrl,
    metadata: {
      merge_type: type,
      survivor_id: survivorId,
      duplicate_id: duplicateId,
      source: "Merge API",
    },
    created_by: USER_ID,
  });

  if (error) {
    console.warn("Merge completed notification was not saved:", error.message);
  }
}
function getMergeWorkLogEntityType(type: MergeType) {
  return type === "pain_point" ? "pain_point" : type;
}

function getMergeResultLabel(
  result: Record<string, unknown>,
  primaryKeys: string[],
  fallback: string
) {
  for (const key of primaryKeys) {
    const value = result[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

async function createMergeWorkLogEntry(
  type: MergeType,
  survivorId: string,
  duplicateId: string,
  result: Record<string, unknown>,
  allowPermanentDelete: boolean
) {
  const supabase = getSupabaseAdmin();
  const entityType = getMergeWorkLogEntityType(type);
  const readableType = type.replace("_", " ");
  const survivorLabel = getMergeResultLabel(
    result,
    ["survivorName", "survivorTitle", "survivorLabel"],
    survivorId
  );
  const duplicateLabel = getMergeResultLabel(
    result,
    ["duplicateName", "duplicateTitle", "duplicateLabel"],
    duplicateId
  );
  const duplicateDisposition =
    typeof result.duplicateDisposition === "string" &&
    result.duplicateDisposition.trim()
      ? result.duplicateDisposition.trim()
      : "archived";

  const { error } = await supabase.from("work_log").insert({
    workspace_id: WORKSPACE_ID,
    actor_type: "system",
    actor_profile_id: null,
    actor_team_member_id: null,
    actor_display_name: "Sell It Merge API",
    action_type: "merge",
    entity_type: entityType,
    entity_id: survivorId,
    entity_label: survivorLabel,
    related_entity_type: entityType,
    related_entity_id: duplicateId,
    summary: `Sell It Merge API merged ${readableType} duplicate "${duplicateLabel}" into "${survivorLabel}".`,
    details: `Duplicate record disposition: ${duplicateDisposition}.`,
    metadata: {
      source: "Merge Action Work Log V1",
      merge_type: type,
      survivor_id: survivorId,
      duplicate_id: duplicateId,
      survivor_label: survivorLabel,
      duplicate_label: duplicateLabel,
      duplicate_disposition: duplicateDisposition,
      allow_permanent_delete: allowPermanentDelete,
      result,
    },
  });

  if (error) {
    console.warn("Merge Work Log entry was not saved:", error.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const type = body.type;

    if (!isMergeType(type)) {
      throw new Error(
        "Merge type must be company, contact, note, task, or pain_point."
      );
    }

    const survivorId = requireString(body.survivorId, "survivorId");
    const duplicateId = requireString(body.duplicateId, "duplicateId");
    const allowPermanentDelete = body.allowPermanentDelete === true;

    if (survivorId === duplicateId) {
      throw new Error("Survivor and duplicate cannot be the same record.");
    }

    let result: Record<string, unknown>;

    if (type === "company") {
      result = await mergeCompany(survivorId, duplicateId);
    } else if (type === "contact") {
      result = await mergeContact(survivorId, duplicateId);
    } else if (type === "note") {
      result = await mergeNote(survivorId, duplicateId, allowPermanentDelete);
    } else if (type === "task") {
      result = await mergeTask(survivorId, duplicateId, allowPermanentDelete);
    } else {
      result = await mergePainPoint(
        survivorId,
        duplicateId,
        allowPermanentDelete
      );
    }

    await createMergeWorkLogEntry(
      type,
      survivorId,
      duplicateId,
      result,
      allowPermanentDelete
    );

    return NextResponse.json({
      ok: true,
      type,
      survivorId,
      duplicateId,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown merge error.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 400 }
    );
  }
}


