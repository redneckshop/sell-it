export type ActingUserKey = "charles" | "trent" | "angel";

export type ActingUserSnapshot = {
  key: ActingUserKey;
  displayName: string;
  teamMemberId: string | null;
  profileId: string | null;
  actorUserId: string;
};

export const ACTING_USER_STORAGE_KEY = "sell-it-acting-user-v1";
export const ACTING_USER_CHANGED_EVENT = "sell-it-acting-user-changed";

export const DEFAULT_CHARLES_PROFILE_ID =
  "a840f813-aba5-44f7-bf20-5f1e5a91e832";

const FALLBACK_ACTOR_IDS: Record<ActingUserKey, string> = {
  charles: DEFAULT_CHARLES_PROFILE_ID,
  trent: "11111111-1111-4111-8111-111111111111",
  angel: "22222222-2222-4222-8222-222222222222",
};

export const ACTING_USER_OPTIONS: Array<{
  key: ActingUserKey;
  displayName: string;
}> = [
  { key: "charles", displayName: "Charles" },
  { key: "trent", displayName: "Trent" },
  { key: "angel", displayName: "Angel" },
];

export const DEFAULT_ACTING_USER: ActingUserSnapshot = {
  key: "charles",
  displayName: "Charles",
  teamMemberId: null,
  profileId: DEFAULT_CHARLES_PROFILE_ID,
  actorUserId: DEFAULT_CHARLES_PROFILE_ID,
};

function isValidKey(value: unknown): value is ActingUserKey {
  return value === "charles" || value === "trent" || value === "angel";
}

function optionLabel(key: ActingUserKey) {
  return (
    ACTING_USER_OPTIONS.find((option) => option.key === key)?.displayName ||
    DEFAULT_ACTING_USER.displayName
  );
}

export function buildActingUserSnapshot(input: {
  key: ActingUserKey;
  displayName?: string | null;
  teamMemberId?: string | null;
  profileId?: string | null;
}): ActingUserSnapshot {
  const profileId = input.profileId || null;
  const teamMemberId = input.teamMemberId || null;
  const actorUserId =
    profileId || teamMemberId || FALLBACK_ACTOR_IDS[input.key];

  return {
    key: input.key,
    displayName: input.displayName || optionLabel(input.key),
    teamMemberId,
    profileId,
    actorUserId,
  };
}

export function getCurrentActingUserSnapshot(): ActingUserSnapshot {
  if (typeof window === "undefined") {
    return DEFAULT_ACTING_USER;
  }

  try {
    const raw = window.localStorage.getItem(ACTING_USER_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ACTING_USER;
    }

    const parsed = JSON.parse(raw) as Partial<ActingUserSnapshot>;
    if (!isValidKey(parsed.key)) {
      return DEFAULT_ACTING_USER;
    }

    return buildActingUserSnapshot({
      key: parsed.key,
      displayName: parsed.displayName || optionLabel(parsed.key),
      teamMemberId: parsed.teamMemberId || null,
      profileId: parsed.profileId || null,
    });
  } catch {
    return DEFAULT_ACTING_USER;
  }
}

export function setCurrentActingUserSnapshot(user: ActingUserSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTING_USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(ACTING_USER_CHANGED_EVENT, { detail: user }));
}

export function getActingIdentityIds(user: ActingUserSnapshot) {
  return Array.from(
    new Set(
      [user.actorUserId, user.profileId, user.teamMemberId].filter(
        (value): value is string => Boolean(value)
      )
    )
  );
}

export function isActingUserId(
  user: ActingUserSnapshot,
  value: string | null | undefined
) {
  if (!value) return false;
  return getActingIdentityIds(user).includes(value);
}

export function getDatabaseSafeUserId(
  user: ActingUserSnapshot = getCurrentActingUserSnapshot()
) {
  return user.profileId || DEFAULT_CHARLES_PROFILE_ID;
}
