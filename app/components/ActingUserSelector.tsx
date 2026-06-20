"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import {
  ACTING_USER_CHANGED_EVENT,
  ACTING_USER_OPTIONS,
  buildActingUserSnapshot,
  getCurrentActingUserSnapshot,
  setCurrentActingUserSnapshot,
  type ActingUserKey,
  type ActingUserSnapshot,
} from "../lib/actingUser";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

type TeamMember = {
  id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  role_title: string | null;
  status: string | null;
};

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  height: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(167, 139, 250, 0.28)",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(12, 12, 14, 0.9))",
  padding: "0 10px 0 12px",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  color: "#a78bfa",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const selectStyle: CSSProperties = {
  border: "none",
  outline: "none",
  backgroundColor: "transparent",
  color: "white",
  fontWeight: 900,
  fontSize: "12px",
  maxWidth: "118px",
  cursor: "pointer",
};

const optionStyle: CSSProperties = {
  color: "black",
};

function keyFromName(name: string): ActingUserKey | null {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("charles") || normalized.includes("charley")) {
    return "charles";
  }

  if (normalized.includes("trent")) {
    return "trent";
  }

  if (normalized.includes("angel")) {
    return "angel";
  }

  return null;
}

function memberForKey(members: TeamMember[], key: ActingUserKey) {
  return members.find((member) => keyFromName(member.display_name || "") === key) || null;
}

function snapshotForKey(members: TeamMember[], key: ActingUserKey) {
  const member = memberForKey(members, key);
  const option = ACTING_USER_OPTIONS.find((item) => item.key === key);

  return buildActingUserSnapshot({
    key,
    displayName: option?.displayName || member?.display_name || key,
    teamMemberId: member?.id || null,
    profileId: member?.profile_id || null,
  });
}

export default function ActingUserSelector() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [actingUser, setActingUser] = useState<ActingUserSnapshot>(() =>
    getCurrentActingUserSnapshot()
  );

  useEffect(() => {
    async function loadMembers() {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, profile_id, display_name, email, role_title, status")
        .eq("workspace_id", WORKSPACE_ID)
        .in("status", ["Active", "active"])
        .order("display_name", { ascending: true });

      if (error) {
        console.warn("Acting user selector could not load team members:", error.message);
        return;
      }

      const rows = (data ?? []) as TeamMember[];
      setMembers(rows);

      const stored = getCurrentActingUserSnapshot();
      const refreshed = snapshotForKey(rows, stored.key);
      setCurrentActingUserSnapshot(refreshed);
      setActingUser(refreshed);
    }

    void loadMembers();

    function handleChange() {
      setActingUser(getCurrentActingUserSnapshot());
    }

    window.addEventListener(ACTING_USER_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(ACTING_USER_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const options = useMemo(
    () =>
      ACTING_USER_OPTIONS.map((option) => {
        const snapshot = snapshotForKey(members, option.key);
        const missingMember = !snapshot.teamMemberId && option.key !== "charles";

        return {
          ...option,
          snapshot,
          label: missingMember
            ? `${option.displayName} (needs team row)`
            : option.displayName,
        };
      }),
    [members]
  );

  function handleSelect(key: ActingUserKey) {
    const next = snapshotForKey(members, key);
    setCurrentActingUserSnapshot(next);
    setActingUser(next);
  }

  return (
    <div
      style={wrapperStyle}
      title="Development/testing only. This does not replace real login or permissions."
    >
      <span style={labelStyle}>Acting As</span>
      <select
        value={actingUser.key}
        onChange={(event) => handleSelect(event.target.value as ActingUserKey)}
        style={selectStyle}
        aria-label="Acting user"
      >
        {options.map((option) => (
          <option key={option.key} value={option.key} style={optionStyle}>
            {option.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
