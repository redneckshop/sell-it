"use client";

import { useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type ArchiveTable = "companies" | "contacts" | "opportunities";

type ArchiveRestoreButtonProps = {
  tableName: ArchiveTable;
  recordId: string;
  isArchived: boolean;
  returnPath: string;
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
      } else {
        const reason = window.prompt(
          "Archive reason? Optional, but recommended for recovery history."
        );

        if (reason === null) {
          setWorking(false);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();

        const { error } = await supabase
          .from(tableName)
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
            archived_by: userData.user?.id ?? null,
            archive_reason: reason.trim() || null,
          })
          .eq("id", recordId);

        if (error) {
          throw new Error(error.message);
        }
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
