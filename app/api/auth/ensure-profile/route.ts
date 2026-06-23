import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const DEFAULT_WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const DEFAULT_WORKSPACE_NAME = "Knotty Logistics";

type ProfileRow = {
  id: string;
  workspace_id: string | null;
  full_name: string | null;
  email: string | null;
};

type TeamMemberRow = {
  id: string;
  workspace_id: string | null;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  role_title: string | null;
  status: string | null;
};

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function userMetadataName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";

  const data = metadata as Record<string, unknown>;

  return (
    cleanText(data.full_name) ||
    cleanText(data.name) ||
    cleanText(data.display_name)
  );
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function defaultRoleForIdentity(displayName: string, email: string | null) {
  const combined = `${displayName} ${email || ""}`.toLowerCase();

  if (combined.includes("charles") || combined.includes("charlebois")) {
    return "Owner";
  }

  return "User";
}

async function findExistingProfile(
  supabaseAdmin: SupabaseClient,
  user: User
): Promise<ProfileRow | null> {
  const byId = await supabaseAdmin
    .from("profiles")
    .select("id, workspace_id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (byId.data) {
    return byId.data as ProfileRow;
  }

  const email = user.email || null;

  if (!email) {
    return null;
  }

  const byEmail = await supabaseAdmin
    .from("profiles")
    .select("id, workspace_id, full_name, email")
    .ilike("email", email)
    .limit(1);

  return ((byEmail.data ?? [])[0] as ProfileRow | undefined) ?? null;
}

async function ensureProfile(
  supabaseAdmin: SupabaseClient,
  user: User
): Promise<ProfileRow> {
  const existingProfile = await findExistingProfile(supabaseAdmin, user);

  if (existingProfile) {
    return existingProfile;
  }

  const email = user.email || null;
  const displayName =
    userMetadataName(user.user_metadata) ||
    email ||
    "Logged-in User";

  const createdProfile = await supabaseAdmin
    .from("profiles")
    .insert({
      id: user.id,
      workspace_id: DEFAULT_WORKSPACE_ID,
      full_name: displayName,
      email,
    })
    .select("id, workspace_id, full_name, email")
    .single();

  if (createdProfile.error || !createdProfile.data) {
    throw new Error(
      createdProfile.error?.message || "Could not create profile."
    );
  }

  return createdProfile.data as ProfileRow;
}

async function findExistingTeamMember(
  supabaseAdmin: SupabaseClient,
  profile: ProfileRow,
  displayName: string
): Promise<TeamMemberRow | null> {
  const workspaceId = profile.workspace_id || DEFAULT_WORKSPACE_ID;

  const byProfile = await supabaseAdmin
    .from("team_members")
    .select("id, workspace_id, profile_id, display_name, email, role_title, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (byProfile.data) {
    return byProfile.data as TeamMemberRow;
  }

  if (profile.email) {
    const byEmail = await supabaseAdmin
      .from("team_members")
      .select("id, workspace_id, profile_id, display_name, email, role_title, status")
      .eq("workspace_id", workspaceId)
      .ilike("email", profile.email)
      .limit(1);

    if (byEmail.data?.[0]) {
      return byEmail.data[0] as TeamMemberRow;
    }
  }

  const byName = await supabaseAdmin
    .from("team_members")
    .select("id, workspace_id, profile_id, display_name, email, role_title, status")
    .eq("workspace_id", workspaceId)
    .ilike("display_name", displayName)
    .limit(1);

  return ((byName.data ?? [])[0] as TeamMemberRow | undefined) ?? null;
}

async function ensureTeamMember(
  supabaseAdmin: SupabaseClient,
  profile: ProfileRow,
  displayName: string
): Promise<TeamMemberRow | null> {
  const workspaceId = profile.workspace_id || DEFAULT_WORKSPACE_ID;
  const existing = await findExistingTeamMember(
    supabaseAdmin,
    profile,
    displayName
  );

  if (existing) {
    const shouldUpdateProfileLink = existing.profile_id !== profile.id;
    const shouldUpdateEmail = !existing.email && Boolean(profile.email);
    const shouldUpdateStatus = existing.status !== "Active";
    const shouldUpdateRole = !existing.role_title;

    if (
      shouldUpdateProfileLink ||
      shouldUpdateEmail ||
      shouldUpdateStatus ||
      shouldUpdateRole
    ) {
      const updated = await supabaseAdmin
        .from("team_members")
        .update({
          profile_id: profile.id,
          email: existing.email || profile.email || null,
          role_title:
            existing.role_title ||
            defaultRoleForIdentity(displayName, profile.email),
          status: "Active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, workspace_id, profile_id, display_name, email, role_title, status")
        .single();

      if (!updated.error && updated.data) {
        return updated.data as TeamMemberRow;
      }
    }

    return existing;
  }

  const created = await supabaseAdmin
    .from("team_members")
    .insert({
      workspace_id: workspaceId,
      profile_id: profile.id,
      display_name: displayName,
      email: profile.email || null,
      role_title: defaultRoleForIdentity(displayName, profile.email),
      status: "Active",
    })
    .select("id, workspace_id, profile_id, display_name, email, role_title, status")
    .single();

  if (created.error || !created.data) {
    return null;
  }

  return created.data as TeamMemberRow;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { errorMessage: "Missing authenticated session token." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getAdminClient();

    const authResult = await supabaseAdmin.auth.getUser(accessToken);

    if (authResult.error || !authResult.data.user) {
      return NextResponse.json(
        {
          errorMessage:
            authResult.error?.message || "Could not verify logged-in user.",
        },
        { status: 401 }
      );
    }

    const user = authResult.data.user;
    const profile = await ensureProfile(supabaseAdmin, user);

    const displayName =
      profile.full_name ||
      userMetadataName(user.user_metadata) ||
      profile.email ||
      user.email ||
      "Logged-in User";

    const teamMember = await ensureTeamMember(
      supabaseAdmin,
      profile,
      displayName
    );

    return NextResponse.json({
      identity: {
        isAuthenticated: true,
        authUserId: user.id,
        profileId: profile.id,
        teamMemberId: teamMember?.id ?? null,
        displayName: teamMember?.display_name || displayName,
        email: profile.email || user.email || null,
        workspaceId: profile.workspace_id || DEFAULT_WORKSPACE_ID,
        workspaceName: DEFAULT_WORKSPACE_NAME,
        roleTitle:
          teamMember?.role_title ||
          defaultRoleForIdentity(displayName, profile.email || user.email || null),
        source: "real_auth",
        errorMessage: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not ensure profile.";

    return NextResponse.json({ errorMessage: message }, { status: 500 });
  }
}
