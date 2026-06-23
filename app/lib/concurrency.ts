import { supabase } from "./supabase";

type GuardedUpdateInput = {
  tableName: string;
  recordId: string;
  loadedUpdatedAt: string | null;
  values: Record<string, unknown>;
  entityLabel: string;
  selectColumns?: string;
};

type GuardedUpdateResult = {
  ok: boolean;
  conflict: boolean;
  errorMessage: string;
  updatedAt: string | null;
};

export function buildConcurrencyConflictMessage(entityLabel: string) {
  const label = entityLabel.trim() || "this record";

  return [
    `${label} was changed by someone else after you opened this edit page.`,
    "To prevent overwriting their newer changes, your save was blocked.",
    "Open the record in a new tab or refresh this page, review the latest version, then make your changes again.",
  ].join(" ");
}

export async function updateRecordWithConcurrencyGuard(
  input: GuardedUpdateInput
): Promise<GuardedUpdateResult> {
  let updateQuery = supabase
    .from(input.tableName)
    .update(input.values)
    .eq("id", input.recordId);

  if (input.loadedUpdatedAt) {
    updateQuery = updateQuery.eq("updated_at", input.loadedUpdatedAt);
  } else {
    updateQuery = updateQuery.is("updated_at", null);
  }

  const { data, error } = await updateQuery
    .select(input.selectColumns || "id, updated_at")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      conflict: false,
      errorMessage: error.message,
      updatedAt: null,
    };
  }

  if (!data) {
    return {
      ok: false,
      conflict: true,
      errorMessage: buildConcurrencyConflictMessage(input.entityLabel),
      updatedAt: null,
    };
  }

  const updatedRow = data as { updated_at?: string | null };

  return {
    ok: true,
    conflict: false,
    errorMessage: "",
    updatedAt: updatedRow.updated_at ?? null,
  };
}
