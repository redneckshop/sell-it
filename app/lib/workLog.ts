import { getCurrentActingUserSnapshot, type ActingUserSnapshot } from "./actingUser";
import { supabase } from "./supabase";

export const WORK_LOG_DEFAULT_WORKSPACE_ID =
  "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

export type WorkLogActorType = "user" | "team_member" | "system";

export type CreateWorkLogEntryInput = {
  workspaceId?: string | null;
  actorType?: WorkLogActorType;
  actingUser?: ActingUserSnapshot | null;
  actorProfileId?: string | null;
  actorTeamMemberId?: string | null;
  actorDisplayName?: string | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  summary: string;
  details?: string | null;
  metadata?: Record<string, unknown> | null;
};

function getActorValues(input: CreateWorkLogEntryInput) {
  if (input.actorType === "system") {
    return {
      actor_type: "system" as WorkLogActorType,
      actor_profile_id: input.actorProfileId ?? null,
      actor_team_member_id: input.actorTeamMemberId ?? null,
      actor_display_name: input.actorDisplayName || "System",
    };
  }

  const actingUser = input.actingUser ?? getCurrentActingUserSnapshot();

  return {
    actor_type: actingUser.teamMemberId
      ? ("team_member" as WorkLogActorType)
      : ("user" as WorkLogActorType),
    actor_profile_id: input.actorProfileId ?? actingUser.profileId ?? null,
    actor_team_member_id:
      input.actorTeamMemberId ?? actingUser.teamMemberId ?? null,
    actor_display_name:
      input.actorDisplayName ?? actingUser.displayName ?? "Unknown",
  };
}

export async function createWorkLogEntry(input: CreateWorkLogEntryInput) {
  const actorValues = getActorValues(input);

  const { error } = await supabase.from("work_log").insert({
    workspace_id: input.workspaceId ?? WORK_LOG_DEFAULT_WORKSPACE_ID,
    ...actorValues,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_label: input.entityLabel ?? null,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    summary: input.summary,
    details: input.details ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.warn("Work Log entry was not saved:", error.message);
  }

  return { error };
}

export function formatWorkLogAction(actionType: string) {
  return actionType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getWorkLogEntityHref(
  entityType: string | null | undefined,
  entityId: string | null | undefined
) {
  if (!entityType || !entityId) {
    return null;
  }

  const normalized = entityType.toLowerCase();

  if (normalized === "company" || normalized === "companies") {
    return `/companies/${entityId}`;
  }

  if (normalized === "contact" || normalized === "contacts") {
    return `/contacts/${entityId}`;
  }

  if (normalized === "opportunity" || normalized === "opportunities") {
    return `/opportunities/${entityId}`;
  }

  if (normalized === "task" || normalized === "tasks") {
    return `/tasks/${entityId}`;
  }

  if (normalized === "activity" || normalized === "activities") {
    return `/activities/${entityId}`;
  }

  if (normalized === "note" || normalized === "notes") {
    return `/notes/${entityId}`;
  }

  if (normalized === "pain_point" || normalized === "pain_points") {
    return `/pain-points/${entityId}`;
  }

  if (normalized === "post" || normalized === "posts") {
    return `/posts/${entityId}`;
  }

  if (normalized === "community" || normalized === "communities") {
    return `/communities/${entityId}`;
  }

  return null;
}
