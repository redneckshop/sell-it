"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import TeamAccountManager from "./TeamAccountManager";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

type TeamMember = {
  id: string;
  workspace_id: string;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  role_title: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

type Profile = {
  id: string;
  workspace_id: string;
  full_name: string | null;
  email: string | null;
};

type TaskAssignment = {
  id: string;
  assigned_team_member_id: string | null;
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
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
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  color: "white",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  borderRadius: "999px",
  padding: "11px 16px",
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

function memberLabel(member: TeamMember) {
  return member.display_name || member.email || member.id;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);

  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customRole, setCustomRole] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadTeam() {
    setLoading(true);
    setErrorMessage("");

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select(
        "id, workspace_id, profile_id, display_name, email, role_title, status, created_at, updated_at"
      )
      .eq("workspace_id", WORKSPACE_ID)
      .order("display_name", { ascending: true });

    if (memberError) {
      setErrorMessage(memberError.message);
      setLoading(false);
      return;
    }

    setMembers((memberRows ?? []) as TeamMember[]);

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, workspace_id, full_name, email")
      .order("full_name", { ascending: true });

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return;
    }

    setProfiles((profileRows ?? []) as Profile[]);

    const { data: taskRows, error: taskError } = await supabase
      .from("tasks")
      .select("id, assigned_team_member_id");

    if (taskError) {
      setErrorMessage(taskError.message);
      setLoading(false);
      return;
    }

    setTasks((taskRows ?? []) as TaskAssignment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadTeam();
  }, []);

  const taskCountsByMember = useMemo(() => {
    const counts = new Map<string, number>();

    tasks.forEach((task) => {
      if (!task.assigned_team_member_id) return;

      counts.set(
        task.assigned_team_member_id,
        (counts.get(task.assigned_team_member_id) ?? 0) + 1
      );
    });

    return counts;
  }, [tasks]);

  async function ensurePlaceholderMember(
    displayName: string,
    roleTitle: string,
    email?: string | null
  ) {
    setSaving(displayName);
    setErrorMessage("");
    setSuccessMessage("");

    const existing = members.find(
      (member) => normalizeName(member.display_name) === normalizeName(displayName)
    );

    if (existing) {
      const { error } = await supabase
        .from("team_members")
        .update({
          role_title: existing.role_title || roleTitle,
          email: existing.email || email || null,
          status: "Active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      setSaving("");

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage(`${displayName} is already on the team and was refreshed.`);
      await loadTeam();
      return;
    }

    const { error } = await supabase.from("team_members").insert({
      workspace_id: WORKSPACE_ID,
      display_name: displayName,
      email: email || null,
      role_title: roleTitle,
      status: "Active",
    });

    setSaving("");

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(`${displayName} was added as an assignable team member.`);
    await loadTeam();
  }

  async function ensureCurrentProfileMembers() {
    setSaving("profiles");
    setErrorMessage("");
    setSuccessMessage("");

    for (const profile of profiles) {
      const displayName = profile.full_name || profile.email || "Unnamed User";
      const existing = members.find((member) => member.profile_id === profile.id);

      if (existing) continue;

      const { error } = await supabase.from("team_members").insert({
        workspace_id: profile.workspace_id || WORKSPACE_ID,
        profile_id: profile.id,
        display_name: displayName,
        email: profile.email,
        role_title: "User",
        status: "Active",
      });

      if (error) {
        setSaving("");
        setErrorMessage(error.message);
        return;
      }
    }

    setSaving("");
    setSuccessMessage("Real login profiles were checked and added if missing.");
    await loadTeam();
  }

  async function createCustomMember() {
    const cleanName = customName.trim();

    if (!cleanName) {
      setErrorMessage("Name is required.");
      return;
    }

    await ensurePlaceholderMember(
      cleanName,
      customRole.trim() || "Team Member",
      customEmail.trim() || null
    );

    setCustomName("");
    setCustomEmail("");
    setCustomRole("");
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
      <header style={headerStyle}>
        <p style={eyebrowStyle}>Management</p>

        <h1 style={titleStyle}>Team</h1>

        <p style={mutedTextStyle}>
          Manage assignable internal team members for Sell It. These records are
          for task assignment and Planner filtering. Placeholder team members do
          not create login accounts yet.
        </p>
      </header>

      {errorMessage && (
        <div
          style={{
            border: "1px solid rgba(248, 113, 113, 0.35)",
            backgroundColor: "rgba(127, 29, 29, 0.22)",
            color: "#fecaca",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            border: "1px solid rgba(34, 197, 94, 0.35)",
            backgroundColor: "rgba(20, 83, 45, 0.22)",
            color: "#bbf7d0",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {successMessage}
        </div>
      )}

      <section style={{ ...cardStyle, marginBottom: "18px" }}>
        <h2 style={{ marginTop: 0 }}>Quick Setup</h2>

        <p style={{ color: "#94a3b8" }}>
          Use these buttons to make sure Charles, Trent, and Angel are available
          for task assignment.
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={ensureCurrentProfileMembers}
            disabled={Boolean(saving)}
            style={buttonStyle}
          >
            {saving === "profiles" ? "Checking..." : "Ensure Login Profiles"}
          </button>

          <button
            type="button"
            onClick={() => ensurePlaceholderMember("Trent", "Partner")}
            disabled={Boolean(saving)}
            style={buttonStyle}
          >
            {saving === "Trent" ? "Saving..." : "Ensure Trent"}
          </button>

          <button
            type="button"
            onClick={() => ensurePlaceholderMember("Angel", "Sales / Support")}
            disabled={Boolean(saving)}
            style={buttonStyle}
          >
            {saving === "Angel" ? "Saving..." : "Ensure Angel"}
          </button>
        </div>
      </section>

      <TeamAccountManager />

      <section style={{ ...cardStyle, marginBottom: "18px" }}>
        <h2 style={{ marginTop: 0 }}>Add Placeholder Team Member</h2>

        <p style={{ color: "#94a3b8" }}>
          Use this for internal assignment only. It does not send an invite or
          create a login.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            Display Name
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Example: Trent"
              style={inputStyle}
            />
          </label>

          <label>
            Email optional
            <input
              value={customEmail}
              onChange={(event) => setCustomEmail(event.target.value)}
              placeholder="Optional"
              style={inputStyle}
            />
          </label>

          <label>
            Role / Title optional
            <input
              value={customRole}
              onChange={(event) => setCustomRole(event.target.value)}
              placeholder="Example: Sales"
              style={inputStyle}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={createCustomMember}
          disabled={Boolean(saving)}
          style={{ ...buttonStyle, marginTop: "12px" }}
        >
          Add Placeholder Member
        </button>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "baseline",
            marginBottom: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Current Team</h2>
            <p style={{ color: "#94a3b8", margin: "6px 0 0 0" }}>
              {members.length} assignable team member(s)
            </p>
          </div>

          {loading && <strong>Loading...</strong>}
        </div>

        {members.length === 0 && !loading ? (
          <p style={{ color: "#94a3b8" }}>No team members found yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {members.map((member) => {
              const taskCount = taskCountsByMember.get(member.id) ?? 0;

              return (
                <article key={member.id} style={cardStyle}>
                  <h3 style={{ marginTop: 0 }}>{memberLabel(member)}</h3>

                  <p style={{ margin: "6px 0" }}>
                    <strong>Role:</strong> {member.role_title || "Not set"}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    <strong>Status:</strong> {member.status || "Active"}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    <strong>Email:</strong> {member.email || "Not set"}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    <strong>Login profile:</strong>{" "}
                    {member.profile_id ? "Linked" : "Placeholder only"}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    <strong>Assigned tasks:</strong> {taskCount}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

