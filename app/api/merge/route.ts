import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MergeType = "company" | "contact";

type UpdateResult = {
  error: { message: string } | null;
};

type DynamicUpdateBuilder = {
  update: (values: Record<string, unknown>) => {
    eq: (columnName: string, value: string) => Promise<UpdateResult>;
  };
};

type DynamicSupabaseClient = {
  from: (tableName: string) => DynamicUpdateBuilder;
};

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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
  return value === "company" || value === "contact";
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value;
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

async function archiveRecord(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tableName: string,
  duplicateId: string,
  survivorId: string,
  survivorName: string
) {
  const dynamicSupabase = supabase as unknown as DynamicSupabaseClient;

  const { error } = await dynamicSupabase
    .from(tableName)
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: USER_ID,
      archive_reason: `Merged into: ${survivorName} (${survivorId}) on ${new Date().toLocaleString()}`,
      updated_by: USER_ID,
    })
    .eq("id", duplicateId);

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }
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

  await archiveRecord(
    supabase,
    "companies",
    duplicateId,
    survivorId,
    survivor.name
  );

  return {
    survivorName: survivor.name,
    duplicateName: duplicate.name,
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

  await archiveRecord(
    supabase,
    "contacts",
    duplicateId,
    survivorId,
    survivorName || survivor.id
  );

  return {
    survivorName,
    duplicateName,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const type = body.type;

    if (!isMergeType(type)) {
      throw new Error("Merge type must be company or contact.");
    }

    const survivorId = requireString(body.survivorId, "survivorId");
    const duplicateId = requireString(body.duplicateId, "duplicateId");

    if (survivorId === duplicateId) {
      throw new Error("Survivor and duplicate cannot be the same record.");
    }

    const result =
      type === "company"
        ? await mergeCompany(survivorId, duplicateId)
        : await mergeContact(survivorId, duplicateId);

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
