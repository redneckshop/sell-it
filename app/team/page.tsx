"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

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
  border: "1px solid #333",
  borderRadius: "12px",
  padding: "18px",
  backgroundColor: "#151515",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "11px",
  marginTop: "6px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  backgroundColor: "#f5d76e",
  color: "black",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
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
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Home
        </Link>

        <Link
          href="/tasks/new"
          style={{
            color: "black",
            backgroundColor: "#f5d76e",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Add Task
        </Link>

        <Link
          href="/planner"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Planner
        </Link>
      </div>

      <h1>Team / Users</h1>

      <p style={{ color: "#aaa", maxWidth: "900px" }}>
        Manage assignable internal team members for Sell It. These records are
        for task assignment and Planner filtering. Placeholder team members do
        not create login accounts yet.
      </p>

      {errorMessage && (
        <div
          style={{
            border: "1px solid #ff6b6b",
            backgroundColor: "#2a1111",
            color: "#ff9999",
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
            border: "1px solid #46d369",
            backgroundColor: "#102414",
            color: "#8ff0a4",
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

        <p style={{ color: "#aaa" }}>
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

      <section style={{ ...cardStyle, marginBottom: "18px" }}>
        <h2 style={{ marginTop: 0 }}>Add Placeholder Team Member</h2>

        <p style={{ color: "#aaa" }}>
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
            <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>
              {members.length} assignable team member(s)
            </p>
          </div>

          {loading && <strong>Loading...</strong>}
        </div>

        {members.length === 0 && !loading ? (
          <p style={{ color: "#aaa" }}>No team members found yet.</p>
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