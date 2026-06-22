"use client";

import { useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentActingUserSnapshot, getDatabaseSafeUserId } from "../lib/actingUser";
import { createWorkLogEntry } from "../lib/workLog";

type ArchiveTable = "companies" | "contacts" | "opportunities";

type ArchiveRestoreButtonProps = {
  tableName: ArchiveTable;
  recordId: string;
  isArchived: boolean;
  returnPath: string;
};

type LabelRecord = {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

const baseButtonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

function reloadToPath(path: string) {
  if (window.location.pathname === path) {
    window.location.reload();
    return;
  }

  window.location.href = path;
}

function entityTypeFromTable(tableName: ArchiveTable) {
  if (tableName === "companies") {
    return "company";
  }

  if (tableName === "contacts") {
    return "contact";
  }

  return "opportunity";
}

function readableEntityType(tableName: ArchiveTable) {
  if (tableName === "companies") {
    return "Company";
  }

  if (tableName === "contacts") {
    return "Contact";
  }

  return "Opportunity";
}

function labelFromRecord(tableName: ArchiveTable, record: LabelRecord | null) {
  if (!record) {
    return readableEntityType(tableName);
  }

  if (tableName === "contacts") {
    const fullName = `${record.first_name || ""} ${record.last_name || ""}`.trim();
    return fullName || "Contact";
  }

  return record.name || readableEntityType(tableName);
}

async function loadEntityLabel(tableName: ArchiveTable, recordId: string) {
  const selectFields =
    tableName === "contacts" ? "first_name, last_name" : "name";

  const { data, error } = await supabase
    .from(tableName)
    .select(selectFields)
    .eq("id", recordId)
    .single();

  if (error) {
    return readableEntityType(tableName);
  }

  return labelFromRecord(tableName, data as LabelRecord);
}

export default function ArchiveRestoreButton({
  tableName,
  recordId,
  isArchived,
  returnPath,
}: ArchiveRestoreButtonProps) {
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleArchiveRestore() {
    setWorking(true);
    setErrorMessage("");

    try {
      const actingUser = getCurrentActingUserSnapshot();
      const databaseSafeUserId = getDatabaseSafeUserId(actingUser);
      const entityType = entityTypeFromTable(tableName);
      const entityLabel = await loadEntityLabel(tableName, recordId);

      if (isArchived) {
        const confirmed = window.confirm(
          "Restore this record? It will return to normal active lists."
        );

        if (!confirmed) {
          setWorking(false);
          return;
        }

        const { error } = await supabase
          .from(tableName)
          .update({
            is_archived: false,
            archived_at: null,
            archived_by: null,
            archive_reason: null,
          })
          .eq("id", recordId);

        if (error) {
          throw new Error(error.message);
        }

        await createWorkLogEntry({
          actingUser,
          actionType: "restore",
          entityType,
          entityId: recordId,
          entityLabel,
          summary: `${actingUser.displayName} restored ${readableEntityType(tableName)} "${entityLabel}".`,
          details: "Record was restored from archived status.",
          metadata: {
            table_name: tableName,
            return_path: returnPath,
            previous_is_archived: true,
            next_is_archived: false,
          },
        });
      } else {
        const reason = window.prompt(
          "Archive reason? Optional, but recommended for recovery history."
        );

        if (reason === null) {
          setWorking(false);
          return;
        }

        const cleanedReason = reason.trim();

        const { error } = await supabase
          .from(tableName)
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
            archived_by: databaseSafeUserId,
            archive_reason: cleanedReason || null,
          })
          .eq("id", recordId);

        if (error) {
          throw new Error(error.message);
        }

        await createWorkLogEntry({
          actingUser,
          actionType: "archive",
          entityType,
          entityId: recordId,
          entityLabel,
          summary: `${actingUser.displayName} archived ${readableEntityType(tableName)} "${entityLabel}".`,
          details: cleanedReason || "No archive reason provided.",
          metadata: {
            table_name: tableName,
            return_path: returnPath,
            archive_reason: cleanedReason || null,
            previous_is_archived: false,
            next_is_archived: true,
          },
        });
      }

      reloadToPath(returnPath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown archive error";
      setErrorMessage(message);
      setWorking(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleArchiveRestore}
        disabled={working}
        style={{
          ...baseButtonStyle,
          backgroundColor: isArchived ? "#d6ffd6" : "#f5d76e",
        }}
      >
        {working ? "Working..." : isArchived ? "Restore" : "Archive"}
      </button>

      {errorMessage && (
        <span style={{ color: "red", marginLeft: "10px", fontWeight: "bold" }}>
          {errorMessage}
        </span>
      )}
    </span>
  );
}
