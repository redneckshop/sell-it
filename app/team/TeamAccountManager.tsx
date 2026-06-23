"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

type AccountState =
  | "linked_auth_user"
  | "profile_linked_no_auth_found"
  | "auth_user_exists_unlinked"
  | "missing_email"
  | "no_auth_user";

type TeamAccountStatus = {
  teamMemberId: string;
  displayName: string;
  teamEmail: string | null;
  roleTitle: string | null;
  status: string | null;
  profileId: string | null;
  linkedProfileEmail: string | null;
  authUserId: string | null;
  authEmail: string | null;
  authUserExists: boolean;
  authEmailConfirmed: boolean;
  authLastSignInAt: string | null;
  accountState: AccountState;
};

type TeamAccountsResponse = {
  ok?: boolean;
  errorMessage?: string;
  message?: string;
  accounts?: TeamAccountStatus[];
  temporaryPassword?: string | null;
  actionLink?: string | null;
  email?: string | null;
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.92))",
  boxShadow: "0 18px 40px rgba(2, 6, 23, 0.45)",
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "999px",
  padding: "9px 12px",
  background: "rgba(15, 23, 42, 0.86)",
  color: "#f8fafc",
  cursor: "pointer",
  fontWeight: 800,
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  border: "1px solid rgba(248, 113, 113, 0.45)",
  color: "#fecaca",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "12px",
  padding: "10px",
  background: "rgba(15, 23, 42, 0.78)",
  color: "#f8fafc",
  boxSizing: "border-box",
};

const smallTextStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.9rem",
  lineHeight: 1.5,
};

function accountStateLabel(state: AccountState) {
  if (state === "linked_auth_user") return "Linked login";
  if (state === "profile_linked_no_auth_found") return "Profile linked, auth missing";
  if (state === "auth_user_exists_unlinked") return "Auth exists, not linked";
  if (state === "missing_email") return "Missing email";
  return "No login account";
}

function accountStateTone(state: AccountState) {
  if (state === "linked_auth_user") return "#bbf7d0";
  if (state === "auth_user_exists_unlinked") return "#fde68a";
  if (state === "profile_linked_no_auth_found") return "#fecaca";
  if (state === "missing_email") return "#fed7aa";
  return "#cbd5e1";
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function TeamAccountManager() {
  const [accounts, setAccounts] = useState<TeamAccountStatus[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetLink, setResetLink] = useState("");

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [accounts]);

  async function getAccessToken() {
    const sessionResult = await supabase.auth.getSession();
    return sessionResult.data.session?.access_token || "";
  }

  async function callTeamAccountsApi(input: {
    action: string;
    teamMemberId?: string;
    email?: string;
  }) {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("You must be logged in as Owner to manage team accounts.");
    }

    const response = await fetch("/api/team/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });

    const payload = (await response.json()) as TeamAccountsResponse;

    if (!response.ok || payload.ok === false) {
      throw new Error(payload.errorMessage || "Team account action failed.");
    }

    return payload;
  }

  async function loadAccounts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = await callTeamAccountsApi({ action: "list" });
      setAccounts(payload.accounts ?? []);

      const nextDrafts: Record<string, string> = {};
      for (const account of payload.accounts ?? []) {
        nextDrafts[account.teamMemberId] =
          account.teamEmail || account.authEmail || account.linkedProfileEmail || "";
      }
      setEmailDrafts(nextDrafts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load team account status."
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    action: "create_or_link_account" | "link_existing_account" | "unlink_account" | "create_password_reset_link",
    account: TeamAccountStatus
  ) {
    setWorkingId(`${action}:${account.teamMemberId}`);
    setErrorMessage("");
    setSuccessMessage("");
    setTemporaryPassword("");
    setResetLink("");

    try {
      const payload = await callTeamAccountsApi({
        action,
        teamMemberId: account.teamMemberId,
        email: emailDrafts[account.teamMemberId] || account.teamEmail || "",
      });

      setAccounts(payload.accounts ?? accounts);
      setSuccessMessage(payload.message || "Team account action completed.");

      if (payload.temporaryPassword) {
        setTemporaryPassword(payload.temporaryPassword);
      }

      if (payload.actionLink) {
        setResetLink(payload.actionLink);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Team account action failed."
      );
    } finally {
      setWorkingId("");
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccessMessage(`${label} copied to clipboard.`);
    } catch {
      setErrorMessage(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  return (
    <section style={{ ...cardStyle, marginBottom: "18px", padding: "18px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Real Team Login Accounts</h2>
          <p style={{ ...smallTextStyle, marginBottom: 0 }}>
            Owner-only account management for linking real Supabase login users
            to existing team members. Assignments, Work Log history, and
            notifications stay attached to the existing team member records.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAccounts}
          disabled={loading || Boolean(workingId)}
          style={buttonStyle}
        >
          {loading ? "Refreshing..." : "Refresh Account Status"}
        </button>
      </div>

      {errorMessage ? (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid rgba(248, 113, 113, 0.45)",
            borderRadius: "14px",
            padding: "12px",
            color: "#fecaca",
            background: "rgba(127, 29, 29, 0.22)",
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid rgba(74, 222, 128, 0.35)",
            borderRadius: "14px",
            padding: "12px",
            color: "#bbf7d0",
            background: "rgba(20, 83, 45, 0.2)",
          }}
        >
          {successMessage}
        </div>
      ) : null}

      {temporaryPassword ? (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid rgba(250, 204, 21, 0.35)",
            borderRadius: "14px",
            padding: "12px",
            color: "#fef3c7",
            background: "rgba(113, 63, 18, 0.18)",
          }}
        >
          <strong>Temporary password:</strong>
          <div
            style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(2, 6, 23, 0.55)",
              wordBreak: "break-all",
              fontFamily: "monospace",
            }}
          >
            {temporaryPassword}
          </div>
          <button
            type="button"
            onClick={() => copyText(temporaryPassword, "Temporary password")}
            style={{ ...buttonStyle, marginTop: "10px" }}
          >
            Copy Temporary Password
          </button>
        </div>
      ) : null}

      {resetLink ? (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid rgba(96, 165, 250, 0.35)",
            borderRadius: "14px",
            padding: "12px",
            color: "#bfdbfe",
            background: "rgba(30, 64, 175, 0.18)",
          }}
        >
          <strong>Password reset link:</strong>
          <div
            style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(2, 6, 23, 0.55)",
              wordBreak: "break-all",
              fontFamily: "monospace",
            }}
          >
            {resetLink}
          </div>
          <button
            type="button"
            onClick={() => copyText(resetLink, "Password reset link")}
            style={{ ...buttonStyle, marginTop: "10px" }}
          >
            Copy Reset Link
          </button>
        </div>
      ) : null}

      {loading ? (
        <p style={smallTextStyle}>Loading team login account status...</p>
      ) : sortedAccounts.length === 0 ? (
        <p style={smallTextStyle}>No team members found yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "14px",
            marginTop: "16px",
          }}
        >
          {sortedAccounts.map((account) => {
            const emailDraft = emailDrafts[account.teamMemberId] || "";
            const isWorking = workingId.endsWith(account.teamMemberId);

            return (
              <article
                key={account.teamMemberId}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.14)",
                  borderRadius: "16px",
                  padding: "14px",
                  background: "rgba(15, 23, 42, 0.58)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 4px" }}>
                      {account.displayName}
                    </h3>
                    <p style={{ ...smallTextStyle, margin: 0 }}>
                      {account.roleTitle || "Team Member"} ·{" "}
                      {account.status || "Active"}
                    </p>
                  </div>

                  <span
                    style={{
                      border: `1px solid ${accountStateTone(
                        account.accountState
                      )}`,
                      color: accountStateTone(account.accountState),
                      borderRadius: "999px",
                      padding: "5px 8px",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {accountStateLabel(account.accountState)}
                  </span>
                </div>

                <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                  <label style={{ color: "#cbd5e1", fontWeight: 800 }}>
                    Login Email
                    <input
                      value={emailDraft}
                      onChange={(event) =>
                        setEmailDrafts((current) => ({
                          ...current,
                          [account.teamMemberId]: event.target.value,
                        }))
                      }
                      placeholder="name@example.com"
                      style={{ ...inputStyle, marginTop: "6px" }}
                    />
                  </label>

                  <p style={{ ...smallTextStyle, margin: 0 }}>
                    <strong>Team email:</strong>{" "}
                    {account.teamEmail || "Not set"}
                  </p>

                  <p style={{ ...smallTextStyle, margin: 0 }}>
                    <strong>Linked profile:</strong>{" "}
                    {account.profileId ? account.profileId : "Not linked"}
                  </p>

                  <p style={{ ...smallTextStyle, margin: 0 }}>
                    <strong>Auth user:</strong>{" "}
                    {account.authUserExists
                      ? `${account.authEmail || account.authUserId}`
                      : "Not found"}
                  </p>

                  <p style={{ ...smallTextStyle, margin: 0 }}>
                    <strong>Email confirmed:</strong>{" "}
                    {account.authEmailConfirmed ? "Yes" : "No / not applicable"}
                  </p>

                  <p style={{ ...smallTextStyle, margin: 0 }}>
                    <strong>Last login:</strong>{" "}
                    {formatDateTime(account.authLastSignInAt)}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => runAction("create_or_link_account", account)}
                    disabled={isWorking || !emailDraft}
                    style={buttonStyle}
                  >
                    {workingId ===
                    `create_or_link_account:${account.teamMemberId}`
                      ? "Working..."
                      : "Create / Link Login"}
                  </button>

                  <button
                    type="button"
                    onClick={() => runAction("link_existing_account", account)}
                    disabled={isWorking || !emailDraft}
                    style={buttonStyle}
                  >
                    {workingId ===
                    `link_existing_account:${account.teamMemberId}`
                      ? "Working..."
                      : "Link Existing"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      runAction("create_password_reset_link", account)
                    }
                    disabled={isWorking || !emailDraft}
                    style={buttonStyle}
                  >
                    {workingId ===
                    `create_password_reset_link:${account.teamMemberId}`
                      ? "Working..."
                      : "Reset Link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => runAction("unlink_account", account)}
                    disabled={isWorking || !account.profileId}
                    style={dangerButtonStyle}
                  >
                    {workingId === `unlink_account:${account.teamMemberId}`
                      ? "Working..."
                      : "Unlink"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
