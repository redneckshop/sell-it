import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const WORKSPACE_NAME = "Knotty Logistics";

type TeamAccountAction =
  | "list"
  | "create_or_link_account"
  | "link_existing_account"
  | "unlink_account"
  | "create_password_reset_link";

type TeamMemberRow = {
  id: string;
  workspace_id: string | null;
  profile_id: string | null;
  display_name: string;
  email: string | null;
  role_title: string | null;
  status: string | null;
};

type ProfileRow = {
  id: string;
  workspace_id: string | null;
  full_name: string | null;
  email: string | null;
};

type AuthUserLike = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

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
  accountState:
    | "linked_auth_user"
    | "profile_linked_no_auth_found"
    | "auth_user_exists_unlinked"
    | "missing_email"
    | "no_auth_user";
};

class TeamAccountApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "TeamAccountApiError";
    this.status = status;
  }
}

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

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice("bearer ".length).trim();
}

async function requireOwnerRequester(
  request: NextRequest,
  supabaseAdmin: SupabaseClient
) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new TeamAccountApiError("Owner login is required.", 401);
  }

  const authResult = await supabaseAdmin.auth.getUser(accessToken);

  if (authResult.error || !authResult.data.user) {
    throw new TeamAccountApiError(
      authResult.error?.message || "Could not verify logged-in owner.",
      401
    );
  }

  const user = authResult.data.user;

  const { data: teamMember, error } = await supabaseAdmin
    .from("team_members")
    .select("id, display_name, role_title, profile_id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    throw new TeamAccountApiError(error.message, 500);
  }

  const roleTitle =
    teamMember && typeof teamMember.role_title === "string"
      ? teamMember.role_title.toLowerCase()
      : "";

  if (!teamMember || !roleTitle.includes("owner")) {
    throw new TeamAccountApiError(
      "Only an Owner can manage real team login accounts.",
      403
    );
  }

  return user;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  const email = cleanText(value).toLowerCase();
  return email.includes("@") ? email : "";
}

function randomTemporaryPassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let password = "";

  for (let index = 0; index < 20; index += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `${password}Aa1!`;
}

function getBaseUrl(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = request.headers.get("host");
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return "";
}

async function listAuthUsers(supabaseAdmin: SupabaseClient) {
  const result = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data.users ?? []) as AuthUserLike[];
}

function findAuthUserByEmail(authUsers: AuthUserLike[], email: string | null) {
  const normalized = cleanEmail(email);
  if (!normalized) return null;

  return (
    authUsers.find((user) => cleanEmail(user.email) === normalized) ?? null
  );
}

function findAuthUserById(authUsers: AuthUserLike[], id: string | null) {
  if (!id) return null;
  return authUsers.find((user) => user.id === id) ?? null;
}

async function loadMembers(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("id, workspace_id, profile_id, display_name, email, role_title, status")
    .eq("workspace_id", WORKSPACE_ID)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamMemberRow[];
}

async function loadProfiles(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, workspace_id, full_name, email")
    .eq("workspace_id", WORKSPACE_ID)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProfileRow[];
}

async function getTeamMember(
  supabaseAdmin: SupabaseClient,
  teamMemberId: string
) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("id, workspace_id, profile_id, display_name, email, role_title, status")
    .eq("id", teamMemberId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Team member was not found.");
  }

  return data as TeamMemberRow;
}

async function ensureProfileForAuthUser(
  supabaseAdmin: SupabaseClient,
  authUser: AuthUserLike,
  displayName: string,
  email: string,
  roleTitle: string | null
) {
  const profilePayload = {
    id: authUser.id,
    workspace_id: WORKSPACE_ID,
    full_name: displayName || email,
    email,
  };

  const existing = await supabaseAdmin
    .from("profiles")
    .select("id, workspace_id, full_name, email")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        workspace_id: existing.data.workspace_id || WORKSPACE_ID,
        full_name: existing.data.full_name || displayName || email,
        email: existing.data.email || email,
      })
      .eq("id", authUser.id)
      .select("id, workspace_id, full_name, email")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Could not update profile.");
    }

    return data as ProfileRow;
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert(profilePayload)
    .select("id, workspace_id, full_name, email")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create profile.");
  }

  return {
    ...(data as ProfileRow),
    role_title: roleTitle,
  };
}

async function linkTeamMemberToAuthUser(
  supabaseAdmin: SupabaseClient,
  member: TeamMemberRow,
  authUser: AuthUserLike,
  email: string
) {
  const profile = await ensureProfileForAuthUser(
    supabaseAdmin,
    authUser,
    member.display_name,
    email,
    member.role_title
  );

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .update({
      profile_id: profile.id,
      email,
      status: "Active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .select("id, workspace_id, profile_id, display_name, email, role_title, status")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not link team member.");
  }

  return data as TeamMemberRow;
}

function buildStatuses(
  members: TeamMemberRow[],
  profiles: ProfileRow[],
  authUsers: AuthUserLike[]
): TeamAccountStatus[] {
  return members.map((member) => {
    const linkedProfile =
      profiles.find((profile) => profile.id === member.profile_id) ?? null;

    const authByProfile = findAuthUserById(authUsers, member.profile_id);
    const authByEmail = findAuthUserByEmail(
      authUsers,
      member.email || linkedProfile?.email || null
    );
    const authUser = authByProfile || authByEmail;

    let accountState: TeamAccountStatus["accountState"] = "no_auth_user";

    if (!member.email && !linkedProfile?.email) {
      accountState = "missing_email";
    } else if (member.profile_id && authByProfile) {
      accountState = "linked_auth_user";
    } else if (member.profile_id && !authByProfile) {
      accountState = "profile_linked_no_auth_found";
    } else if (!member.profile_id && authByEmail) {
      accountState = "auth_user_exists_unlinked";
    }

    return {
      teamMemberId: member.id,
      displayName: member.display_name,
      teamEmail: member.email,
      roleTitle: member.role_title,
      status: member.status,
      profileId: member.profile_id,
      linkedProfileEmail: linkedProfile?.email ?? null,
      authUserId: authUser?.id ?? null,
      authEmail: authUser?.email ?? null,
      authUserExists: Boolean(authUser),
      authEmailConfirmed: Boolean(authUser?.email_confirmed_at),
      authLastSignInAt: authUser?.last_sign_in_at ?? null,
      accountState,
    };
  });
}

async function listTeamAccountStatuses(supabaseAdmin: SupabaseClient) {
  const [members, profiles, authUsers] = await Promise.all([
    loadMembers(supabaseAdmin),
    loadProfiles(supabaseAdmin),
    listAuthUsers(supabaseAdmin),
  ]);

  return buildStatuses(members, profiles, authUsers);
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    await requireOwnerRequester(request, supabaseAdmin);

    const accounts = await listTeamAccountStatuses(supabaseAdmin);

    return NextResponse.json({
      ok: true,
      workspaceId: WORKSPACE_ID,
      workspaceName: WORKSPACE_NAME,
      accounts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load team accounts.";
    const status = error instanceof TeamAccountApiError ? error.status : 500;

    return NextResponse.json({ ok: false, errorMessage: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action) as TeamAccountAction;
    const teamMemberId = cleanText(body.teamMemberId);
    const supabaseAdmin = getAdminClient();
    await requireOwnerRequester(request, supabaseAdmin);

    if (action === "list") {
      const accounts = await listTeamAccountStatuses(supabaseAdmin);

      return NextResponse.json({
        ok: true,
        workspaceId: WORKSPACE_ID,
        workspaceName: WORKSPACE_NAME,
        accounts,
      });
    }

    if (!teamMemberId) {
      return NextResponse.json(
        { ok: false, errorMessage: "Team member ID is required." },
        { status: 400 }
      );
    }

    const member = await getTeamMember(supabaseAdmin, teamMemberId);
    const email = cleanEmail(body.email) || cleanEmail(member.email);

    if (
      action === "create_or_link_account" ||
      action === "link_existing_account" ||
      action === "create_password_reset_link"
    ) {
      if (!email) {
        return NextResponse.json(
          { ok: false, errorMessage: "A valid email address is required." },
          { status: 400 }
        );
      }
    }

    if (action === "unlink_account") {
      const { error } = await supabaseAdmin
        .from("team_members")
        .update({
          profile_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", member.id);

      if (error) {
        throw new Error(error.message);
      }

      const accounts = await listTeamAccountStatuses(supabaseAdmin);

      return NextResponse.json({
        ok: true,
        action,
        message:
          "Team member was unlinked from the login profile. Assignments remain attached to the team member record.",
        accounts,
      });
    }

    const authUsers = await listAuthUsers(supabaseAdmin);
    let authUser = findAuthUserByEmail(authUsers, email);
    let temporaryPassword: string | null = null;
    let createdAuthUser = false;

    if (action === "link_existing_account" && !authUser) {
      return NextResponse.json(
        {
          ok: false,
          errorMessage:
            "No existing auth user was found for that email. Use Create / Link Login Account first.",
        },
        { status: 404 }
      );
    }

    if (action === "create_or_link_account" && !authUser) {
      temporaryPassword = randomTemporaryPassword();

      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: member.display_name,
          display_name: member.display_name,
          workspace_id: WORKSPACE_ID,
          workspace_name: WORKSPACE_NAME,
          role_title: member.role_title || "User",
        },
      });

      if (created.error || !created.data.user) {
        throw new Error(created.error?.message || "Could not create auth user.");
      }

      authUser = created.data.user as AuthUserLike;
      createdAuthUser = true;
    }

    if (
      action === "create_or_link_account" ||
      action === "link_existing_account"
    ) {
      if (!authUser) {
        throw new Error("Auth user was not found or created.");
      }

      const linkedMember = await linkTeamMemberToAuthUser(
        supabaseAdmin,
        member,
        authUser,
        email
      );

      const accounts = await listTeamAccountStatuses(supabaseAdmin);

      return NextResponse.json({
        ok: true,
        action,
        createdAuthUser,
        temporaryPassword,
        teamMember: linkedMember,
        authUser: {
          id: authUser.id,
          email: authUser.email,
          emailConfirmed: Boolean(authUser.email_confirmed_at),
        },
        message: createdAuthUser
          ? "Login account was created and linked to this team member."
          : "Existing login account was linked to this team member.",
        accounts,
      });
    }

    if (action === "create_password_reset_link") {
      if (!authUser) {
        return NextResponse.json(
          {
            ok: false,
            errorMessage:
              "No auth user exists for this email yet. Create/link the login account first.",
          },
          { status: 404 }
        );
      }

      const baseUrl = getBaseUrl(request);
      const redirectTo = baseUrl ? `${baseUrl}/update-password` : undefined;

      const linkResult = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

      if (linkResult.error) {
        throw new Error(linkResult.error.message);
      }

      const actionLink = linkResult.data.properties?.action_link || null;

      const accounts = await listTeamAccountStatuses(supabaseAdmin);

      return NextResponse.json({
        ok: true,
        action,
        email,
        actionLink,
        message:
          "Password reset link was created. Send this link to the team member or use the Login page reset button.",
        accounts,
      });
    }

    return NextResponse.json(
      { ok: false, errorMessage: "Unknown team account action." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Team account action failed.";
    const status = error instanceof TeamAccountApiError ? error.status : 500;

    return NextResponse.json({ ok: false, errorMessage: message }, { status });
  }
}


