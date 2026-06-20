"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import {
  ACTING_USER_CHANGED_EVENT,
  getActingIdentityIds,
  getCurrentActingUserSnapshot,
  isActingUserId,
  type ActingUserSnapshot,
} from "../lib/actingUser";
import {
  NOTIFICATION_WORKSPACE_ID,
  createNotificationOnce,
  notificationLabel,
  type NotificationRow,
} from "../lib/notifications";

type TaskDueRow = {
  id: string;
  title: string;
  due_date: string | null;
  status: string | null;
  assigned_team_member_id: string | null;
  assigned_to: string | null;
};

const wrapperStyle: CSSProperties = {
  position: "relative",
};

const bellButtonStyle: CSSProperties = {
  minWidth: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.1)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  color: "#e5e7eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "15px",
  padding: "0 9px",
  boxSizing: "border-box",
  cursor: "pointer",
  position: "relative",
};

const badgeStyle: CSSProperties = {
  position: "absolute",
  top: "-5px",
  right: "-5px",
  minWidth: "18px",
  height: "18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #ef4444, #f97316)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.28)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  fontWeight: 950,
  padding: "0 5px",
  boxSizing: "border-box",
};

const panelStyle: CSSProperties = {
  position: "absolute",
  top: "46px",
  right: 0,
  width: "390px",
  maxWidth: "calc(100vw - 24px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(23,23,23,0.98), rgba(12,12,14,0.98))",
  boxShadow: "0 24px 70px rgba(0,0,0,0.62)",
  zIndex: 120,
  overflow: "hidden",
};

const panelHeaderStyle: CSSProperties = {
  padding: "15px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 5px",
  color: "#c4b5fd",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  fontWeight: 950,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "white",
  fontSize: "16px",
  fontWeight: 950,
};

const mutedStyle: CSSProperties = {
  color: "#a3a3a3",
  fontSize: "12px",
  lineHeight: 1.45,
};

const actionButtonStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.28)",
  borderRadius: "999px",
  padding: "7px 10px",
  backgroundColor: "rgba(124, 58, 237, 0.16)",
  color: "#ddd6fe",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 850,
  whiteSpace: "nowrap",
};

const listStyle: CSSProperties = {
  maxHeight: "520px",
  overflowY: "auto",
  padding: "10px",
};

const itemStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.13)",
  borderRadius: "15px",
  padding: "12px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(12, 12, 14, 0.88))",
  marginBottom: "9px",
};

const readItemStyle: CSSProperties = {
  ...itemStyle,
  opacity: 0.67,
};

const itemTopRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "7px",
};

const typePillStyle: CSSProperties = {
  borderRadius: "999px",
  padding: "4px 8px",
  backgroundColor: "rgba(124, 58, 237, 0.20)",
  color: "#ddd6fe",
  border: "1px solid rgba(167, 139, 250, 0.24)",
  fontSize: "11px",
  fontWeight: 950,
};

const messageStyle: CSSProperties = {
  margin: "0 0 9px",
  color: "white",
  lineHeight: 1.45,
  fontSize: "13px",
  fontWeight: 750,
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
};

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date not saved";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function isClosedTask(status: string | null) {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "completed" || normalized === "cancelled";
}

async function seedAssignedDueNotifications(user: ActingUserSnapshot) {
  const today = todayKey();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, status, assigned_team_member_id, assigned_to")
    .eq("workspace_id", NOTIFICATION_WORKSPACE_ID)
    .lte("due_date", today)
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const tasks = (data ?? []) as TaskDueRow[];

  for (const task of tasks) {
    if (!task.due_date || isClosedTask(task.status)) {
      continue;
    }

    const assignedToActingUser =
      isActingUserId(user, task.assigned_team_member_id) ||
      isActingUserId(user, task.assigned_to);

    if (!assignedToActingUser) {
      continue;
    }

    const dueDate = task.due_date.slice(0, 10);
    const overdue = dueDate < today;
    const type = overdue ? "Task Overdue" : "Task Due Today";
    const message = overdue
      ? `Task overdue: ${task.title}`
      : `Task due today: ${task.title}`;

    await createNotificationOnce({
      type,
      message,
      relatedRecordType: "tasks",
      relatedRecordId: task.id,
      relatedUrl: `/tasks/${task.id}`,
      recipientUserId: user.actorUserId,
      actorUserId: "system",
      system: true,
      dedupeKey: `${type}:${user.actorUserId}:${task.id}:${dueDate}`,
      metadata: {
        task_id: task.id,
        due_date: dueDate,
        status: task.status,
        source: "Notification Center assigned due task scan",
      },
    });
  }
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [actingUser, setActingUser] = useState<ActingUserSnapshot>(() =>
    getCurrentActingUserSnapshot()
  );
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  async function loadNotifications(user = getCurrentActingUserSnapshot()) {
    setLoading(true);
    setErrorMessage("");

    try {
      await seedAssignedDueNotifications(user);

      const identityIds = getActingIdentityIds(user);

      if (identityIds.length === 0) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, workspace_id, recipient_user_id, notification_type, message, related_record_type, related_record_id, related_url, is_read, read_at, metadata, created_by, created_at, updated_at"
        )
        .eq("workspace_id", NOTIFICATION_WORKSPACE_ID)
        .in("recipient_user_id", identityIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      setNotifications((data ?? []) as NotificationRow[]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load notifications.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const currentUser = getCurrentActingUserSnapshot();
    setActingUser(currentUser);
    void loadNotifications(currentUser);

    function handleActingUserChanged() {
      const nextUser = getCurrentActingUserSnapshot();
      setActingUser(nextUser);
      void loadNotifications(nextUser);
    }

    window.addEventListener(ACTING_USER_CHANGED_EVENT, handleActingUserChanged);
    window.addEventListener("storage", handleActingUserChanged);

    return () => {
      window.removeEventListener(ACTING_USER_CHANGED_EVENT, handleActingUserChanged);
      window.removeEventListener("storage", handleActingUserChanged);
    };
  }, []);

  async function togglePanel() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      const currentUser = getCurrentActingUserSnapshot();
      setActingUser(currentUser);
      await loadNotifications(currentUser);
    }
  }

  async function markRead(id: string) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true, read_at: now, updated_at: now }
          : notification
      )
    );
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    const identityIds = getActingIdentityIds(actingUser);

    if (identityIds.length === 0) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq("workspace_id", NOTIFICATION_WORKSPACE_ID)
      .in("recipient_user_id", identityIds)
      .eq("is_read", false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at ?? now,
        updated_at: now,
      }))
    );
  }

  return (
    <div style={wrapperStyle}>
      <button
        type="button"
        onClick={togglePanel}
        style={bellButtonStyle}
        aria-label={`Open notifications for ${actingUser.displayName}`}
        title={`Notifications for ${actingUser.displayName}`}
      >
        <span aria-hidden="true">{"\uD83D\uDD14"}</span>
        {unreadCount > 0 && (
          <span style={badgeStyle}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>Notification Center</p>
              <h2 style={titleStyle}>For {actingUser.displayName}</h2>
              <div style={mutedStyle}>
                {unreadCount} unread. Bell notifications are attention items, not a work log.
              </div>
            </div>

            <button type="button" onClick={markAllRead} style={actionButtonStyle}>
              Mark All Read
            </button>
          </div>

          <div style={listStyle}>
            {loading && <div style={mutedStyle}>Loading notifications...</div>}

            {errorMessage && (
              <div style={{ ...itemStyle, color: "#fecaca" }}>
                Notification Center could not load.
                <br />
                Error: {errorMessage}
              </div>
            )}

            {!loading && !errorMessage && notifications.length === 0 && (
              <div style={{ ...itemStyle, color: "#cbd5e1" }}>
                No attention items for {actingUser.displayName}. Your own actions should not appear here.
              </div>
            )}

            {!loading &&
              !errorMessage &&
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={notification.is_read ? readItemStyle : itemStyle}
                >
                  <div style={itemTopRowStyle}>
                    <span style={typePillStyle}>
                      {notificationLabel(notification.notification_type)}
                    </span>
                    <span style={mutedStyle}>
                      {formatDateTime(notification.created_at)}
                    </span>
                  </div>

                  <p style={messageStyle}>{notification.message}</p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    {notification.related_url ? (
                      <Link
                        href={notification.related_url}
                        onClick={() => {
                          setOpen(false);
                          void markRead(notification.id);
                        }}
                        style={linkStyle}
                      >
                        Open related record
                      </Link>
                    ) : (
                      <span style={mutedStyle}>No related record link</span>
                    )}

                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => void markRead(notification.id)}
                        style={actionButtonStyle}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
