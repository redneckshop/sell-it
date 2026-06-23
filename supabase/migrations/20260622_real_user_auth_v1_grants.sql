-- Real User Auth V1 grants
-- Allows the server-side service-role auth/profile ensure route to read and link
-- profiles and team members without loosening browser/client access.

grant select, insert, update on table public.profiles to service_role;
grant select, insert, update on table public.team_members to service_role;
grant select on table public.workspaces to service_role;

grant select on table public.profiles to authenticated;
grant select on table public.team_members to authenticated;
grant select on table public.workspaces to authenticated;
