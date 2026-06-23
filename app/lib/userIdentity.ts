import { supabase } from "./supabase";

export const REAL_USER_IDENTITY_STORAGE_KEY = "sell-it-real-user-identity-v1";
export const REAL_USER_IDENTITY_CHANGED_EVENT =
  "sell-it-real-user-identity-changed";

export const DEFAULT_WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
export const DEFAULT_WORKSPACE_NAME = "Knotty Logistics";

export type RealUserIdentitySnapshot = {
  isAuthenticated: boolean;
  authUserId: string | null;
  profileId: string | null;
  teamMemberId: string | null;
  displayName: string;
  email: string | null;
  workspaceId: string | null;
  workspaceName: string;
  roleTitle: string | null;
  source: "real_auth" | "no_auth" | "profile_missing";
  errorMessage?: string | null;
};

type EnsureProfileResponse = {
  identity?: RealUserIdentitySnapshot;
  errorMessage?: string;
};

function fallbackIdentity(
  source: RealUserIdentitySnapshot["source"],
  errorMessage?: string | null
): RealUserIdentitySnapshot {
  return {
    isAuthenticated: false,
    authUserId: null,
    profileId: null,
    teamMemberId: null,
    displayName: "Not logged in",
    email: null,
    workspaceId: DEFAULT_WORKSPACE_ID,
    workspaceName: DEFAULT_WORKSPACE_NAME,
    roleTitle: null,
    source,
    errorMessage: errorMessage ?? null,
  };
}

export function getCachedRealUserIdentity(): RealUserIdentitySnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(REAL_USER_IDENTITY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RealUserIdentitySnapshot>;

    if (!parsed.isAuthenticated || !parsed.profileId) {
      return null;
    }

    return {
      isAuthenticated: true,
      authUserId: parsed.authUserId ?? null,
      profileId: parsed.profileId ?? null,
      teamMemberId: parsed.teamMemberId ?? null,
      displayName: parsed.displayName || "Logged-in User",
      email: parsed.email ?? null,
      workspaceId: parsed.workspaceId ?? DEFAULT_WORKSPACE_ID,
      workspaceName: parsed.workspaceName || DEFAULT_WORKSPACE_NAME,
      roleTitle: parsed.roleTitle ?? null,
      source: "real_auth",
      errorMessage: parsed.errorMessage ?? null,
    };
  } catch {
    return null;
  }
}

export function setCachedRealUserIdentity(identity: RealUserIdentitySnapshot) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    REAL_USER_IDENTITY_STORAGE_KEY,
    JSON.stringify(identity)
  );

  window.dispatchEvent(
    new CustomEvent(REAL_USER_IDENTITY_CHANGED_EVENT, { detail: identity })
  );
}

export function clearCachedRealUserIdentity() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(REAL_USER_IDENTITY_STORAGE_KEY);

  window.dispatchEvent(new CustomEvent(REAL_USER_IDENTITY_CHANGED_EVENT));
}

async function ensureServerSideProfile(accessToken: string) {
  const response = await fetch("/api/auth/ensure-profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let payload: EnsureProfileResponse = {};

  try {
    payload = (await response.json()) as EnsureProfileResponse;
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.identity) {
    throw new Error(
      payload.errorMessage ||
        `Profile ensure request failed with status ${response.status}.`
    );
  }

  return payload.identity;
}

export async function resolveRealUserIdentity() {
  if (typeof window === "undefined") {
    return fallbackIdentity("no_auth", null);
  }

  const authResult = await supabase.auth.getUser();

  if (authResult.error) {
    const fallback = fallbackIdentity("no_auth", authResult.error.message);
    clearCachedRealUserIdentity();
    return fallback;
  }

  const authUser = authResult.data.user;

  if (!authUser) {
    const fallback = fallbackIdentity("no_auth", null);
    clearCachedRealUserIdentity();
    return fallback;
  }

  const sessionResult = await supabase.auth.getSession();
  const accessToken = sessionResult.data.session?.access_token;

  if (!accessToken) {
    const fallback = fallbackIdentity(
      "profile_missing",
      "Logged in, but no active session token was available."
    );

    clearCachedRealUserIdentity();

    return {
      ...fallback,
      isAuthenticated: true,
      authUserId: authUser.id,
      displayName: authUser.email || "Logged-in User",
      email: authUser.email || null,
    };
  }

  try {
    const identity = await ensureServerSideProfile(accessToken);
    setCachedRealUserIdentity(identity);
    return identity;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Logged-in user does not have a matching profile yet.";

    const fallback = fallbackIdentity("profile_missing", message);
    clearCachedRealUserIdentity();

    return {
      ...fallback,
      isAuthenticated: true,
      authUserId: authUser.id,
      displayName: authUser.email || "Logged-in User",
      email: authUser.email || null,
    };
  }
}
