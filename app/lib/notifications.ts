import { supabase } from "./supabase";

export const NOTIFICATION_WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
export const NOTIFICATION_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

export type NotificationType =
  | "Task Due Today"
  | "Task Overdue"
  | "Task Assigned"
  | "Opportunity Stage Changed"
  | "New Email Intelligence Saved"
  | "New Pain Point Created"
  | "Merge Completed";

export type NotificationRecordType =
  | "tasks"
  | "opportunities"
  | "activities"
  | "pain_points"
  | "companies"
  | "contacts"
  | "notes"
  | "communities"
  | "posts"
  | "merge"
  | "email_intelligence";

export type NotificationRow = {
  id: string;
  workspace_id: string;
  recipient_user_id: string | null;
  notification_type: NotificationType;
  message: string;
  related_record_type: string | null;
  related_record_id: string | null;
  related_url: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CreateNotificationInput = {
  type: NotificationType;
  message: string;
  relatedRecordType?: NotificationRecordType;
  relatedRecordId?: string | null;
  relatedUrl?: string | null;
  recipientUserId?: string | null;
  metadata?: Record<string, unknown>;
};

type CreateNotificationOnceInput = CreateNotificationInput & {
  dedupeKey: string;
};

export function notificationLabel(type: string) {
  return type || "Notification";
}

export async function createNotification(input: CreateNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    workspace_id: NOTIFICATION_WORKSPACE_ID,
    recipient_user_id: input.recipientUserId ?? null,
    notification_type: input.type,
    message: input.message,
    related_record_type: input.relatedRecordType ?? null,
    related_record_id: input.relatedRecordId ?? null,
    related_url: input.relatedUrl ?? null,
    metadata: input.metadata ?? {},
    created_by: NOTIFICATION_USER_ID,
  });

  if (error) {
    console.warn("Notification was not saved:", error.message);
  }
}

export async function createNotificationOnce(input: CreateNotificationOnceInput) {
  const metadata = {
    ...(input.metadata ?? {}),
    dedupe_key: input.dedupeKey,
  };

  let existingQuery = supabase
    .from("notifications")
    .select("id")
    .eq("workspace_id", NOTIFICATION_WORKSPACE_ID)
    .eq("notification_type", input.type)
    .contains("metadata", { dedupe_key: input.dedupeKey })
    .limit(1);

  if (input.relatedRecordType) {
    existingQuery = existingQuery.eq("related_record_type", input.relatedRecordType);
  }

  if (input.relatedRecordId) {
    existingQuery = existingQuery.eq("related_record_id", input.relatedRecordId);
  }

  const existing = await existingQuery;

  if (!existing.error && existing.data && existing.data.length > 0) {
    return;
  }

  await createNotification({
    ...input,
    metadata,
  });
}
