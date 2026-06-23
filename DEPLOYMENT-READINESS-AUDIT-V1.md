# DEPLOYMENT READINESS AUDIT V1

**Project:** Sell It
**Repo:** `redneckshop/sell-it`
**Audit Date:** 2026-06-22
**Latest confirmed good commit before this audit:** `c41e825`
**Scope:** Audit/documentation only. No deployment, no production data changes, no feature work, no database schema changes.

---

## Executive Summary

Sell It is close to deployment-ready for controlled internal use by Charles, Trent, and Angel, but the production deployment should not happen until Vercel environment variables and Supabase Auth redirect settings are configured and verified.

**Final recommendation:** **Ready after minor deployment-configuration fixes.**

The application codebase is a standard Next.js application using Supabase for auth/database/storage and server routes for OpenAI, Google Places lead import, profile creation/linking, and merge operations. The main deployment blockers are configuration, not feature gaps.

---

## 1. Vercel Readiness

### Current app compatibility

- Framework: Next.js App Router.
- Current package versions from `package.json`:
  - `next`: `16.2.9`
  - `react`: `19.2.4`
  - `react-dom`: `19.2.4`
  - `@supabase/supabase-js`: `^2.108.1`
- Scripts:
  - `npm run dev` -> `next dev`
  - `npm run build` -> `next build`
  - `npm run start` -> `next start`
  - `npm run lint` -> `eslint`

### Build command

Recommended Vercel build command:

```text
npm run build
```

This maps directly to:

```text
next build
```

### Output expectations

- Do not manually set an output directory unless Vercel asks for one.
- Vercel should auto-detect Next.js and use its Next.js framework preset.
- Normal Next.js build output should be handled by Vercel automatically.

### Webpack / Turbopack notes

- Local development was switched to `next dev --webpack` previously to stabilize Firefox/local development behavior.
- That local dev choice does **not** mean production needs `next dev --webpack`.
- Production should still use `next build` through `npm run build`.
- Vercel production deployment should not use `next dev`.

### Vercel readiness status

**Status:** Ready after environment variables are added and a Vercel preview build succeeds.

---

## 2. Required Environment Variables

These must be added in Vercel Project Settings -> Environment Variables.

### Required for core app

| Variable | Required | Environment | Client exposed? | Purpose | Recommended production value |
|---|---:|---|---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production + Preview | Yes | Supabase project URL used by browser and server code | Existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Production + Preview | Yes | Supabase browser/public client key | Existing anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Production + Preview | **No** | Server-only admin operations for auth/profile ensure and merge API | Existing service role/secret key, marked sensitive |
| `OPENAI_API_KEY` | Yes if AI Capture/Email Intelligence is used | Production + Preview | **No** | Server-only OpenAI Responses API calls in `/api/capture/analyze` | OpenAI project API key, marked sensitive |

### Required for Import Leads Google search

| Variable | Required | Environment | Client exposed? | Purpose | Recommended production value |
|---|---:|---|---:|---|---|
| `GOOGLE_PLACES_API_KEY` | Required if using Import Leads search | Production + Preview | **No** | Google Places Text Search API for `/api/import-leads/search` | Restricted Google Places API key |
| `GOOGLE_MAPS_API_KEY` | Optional fallback | Production + Preview | **No** | Fallback used if `GOOGLE_PLACES_API_KEY` is absent | Prefer `GOOGLE_PLACES_API_KEY` instead |

### Development Acting User flag

| Variable | Required | Environment | Client exposed? | Purpose | Recommended production value |
|---|---:|---|---:|---|---|
| `NEXT_PUBLIC_SHOW_DEV_ACTING_USER` | No | Development only | Yes | Allows Development Acting As UI when explicitly enabled | **Unset or `false` in production** |

### Important environment warnings

- Anything starting with `NEXT_PUBLIC_` can be exposed to the browser bundle. Do not place secret keys in `NEXT_PUBLIC_*` variables.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `GOOGLE_PLACES_API_KEY` must stay server-side only.
- In Vercel, mark secret variables as sensitive where available.

---

## 3. Supabase Readiness

### Auth settings

Before production launch, update Supabase Auth URL Configuration.

Recommended production domain:

```text
https://sales.knottylogistics.com
```

Set Supabase Auth **Site URL** to:

```text
https://sales.knottylogistics.com
```

Add redirect URLs:

```text
https://sales.knottylogistics.com
https://sales.knottylogistics.com/login
https://sales.knottylogistics.com/update-password
https://sales.knottylogistics.com/**
```

Keep local development redirects:

```text
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/update-password
http://localhost:3001
http://localhost:3001/login
http://localhost:3001/update-password
```

Optional Vercel preview redirects during testing:

```text
https://*.vercel.app/**
```

If tighter security is preferred, add only the actual Vercel preview URL instead of a wildcard.

### Password reset redirect URLs

The login page sends reset emails using:

```text
${window.location.origin}/update-password
```

That means whichever domain the user is on must be allowed in Supabase Redirect URLs.

For production, this must be allowed:

```text
https://sales.knottylogistics.com/update-password
```

### RLS / policies concerns

- Browser code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` through `app/lib/supabase.ts`.
- Therefore, RLS/policies must protect data properly for normal browser access.
- Service role routes bypass normal user RLS and must remain server-only.
- For the first internal launch, the app is acceptable if all users are trusted internal users and existing policies already allow Charles, Trent, and Angel to use the workspace.
- Longer-term hardening should ensure every table policy scopes access by `workspace_id` and authenticated team membership.

### Storage bucket readiness

Known storage bucket used by Email Intelligence attachments:

```text
sell-it-attachments
```

Confirm in Supabase Storage:

- Bucket exists.
- Uploads work from production domain.
- Signed URL creation works.
- Bucket policies allow authenticated/internal app usage.
- Bucket is private unless there is a specific reason for public files.

### Database migrations/state

Deployment should not modify database tables during this audit.

Before deployment:

- Confirm all migrations already used locally are committed under `supabase/migrations` or otherwise documented.
- Confirm production Supabase database already contains required tables:
  - `workspaces`
  - `profiles`
  - `team_members`
  - `companies`
  - `contacts`
  - `opportunities`
  - `tasks`
  - `activities`
  - `notes`
  - `attachments`
  - `communities`
  - `posts`
  - `pain_points`
  - relationship tables for pain points
  - `notifications`
  - `work_log`
  - `opportunity_stage_history`
- Confirm seed/default workspace exists:

```text
Knotty Logistics
ba491d9b-3b36-426d-b98a-f05b0bf271ed
```

---

## 4. Auth Readiness

### Confirmed login tests

Already confirmed before this audit:

- Charles login tested.
- Trent login tested.
- Angel login tested.

### Protected route behavior

Current protection model:

- `/login` is public.
- `/update-password` is public.
- App pages redirect to `/login` when signed out.
- Root `/` redirects cleanly to `/login` when signed out.
- `next` redirect is preserved for protected pages.

Relevant files:

- `proxy.ts`
- `app/components/AuthRouteGuard.tsx`
- `app/login/page.tsx`
- `app/update-password/page.tsx`
- `app/lib/authSessionCookie.ts`
- `app/lib/userIdentity.ts`

### Sign out behavior

Current behavior:

- Sign Out is inside the top-right avatar/account menu.
- Sign Out calls Supabase sign out.
- Cached real identity is cleared.
- Local auth cookie is cleared.
- Browser redirects to `/login`.

### Password reset behavior

Current behavior:

- Login page has Send Password Reset Link.
- Reset redirects to `/update-password` using the current browser origin.
- `/update-password` is public.
- User sets a new password there.

Production requirement:

- Supabase Redirect URLs must include production `/update-password`.

### Firefox/browser-specific concerns

Prior Firefox/local issues were addressed by:

- Using hard browser redirects after login/signout.
- Making the auth guard hydration-safe.
- Switching local dev to webpack mode.

Production note:

- Production should still be verified in Chrome, Firefox, and Edge after Vercel preview deployment.

---

## 5. Team/User Readiness

### Team members linked

Expected production-ready state:

- Charles has a Supabase Auth user, a `profiles` row, and a linked `team_members` row.
- Trent has a Supabase Auth user, a `profiles` row, and a linked `team_members` row.
- Angel has a Supabase Auth user, a `profiles` row, and a linked `team_members` row.

The `/api/auth/ensure-profile` route can create/repair profile and team-member links when a real authenticated user logs in, but this depends on `SUPABASE_SERVICE_ROLE_KEY` being set server-side.

### Assignments preserved

Task assignment readiness depends on:

- Existing `team_members` rows remaining stable.
- `tasks.assigned_team_member_id` values pointing to valid team members.
- Legacy `assigned_to` values not breaking current pages.

### Work Log attribution

Work Log should preserve actor attribution when actions are done through real login and acting-user-compatible helper logic.

Merge API writes Work Log entries using actor data passed by the caller, with fallback to a system merge actor.

### Notification actor/recipient behavior

Current Notification Center behavior is intentionally attention-only:

- Own actions should not appear as attention items.
- Assigned due/overdue task notifications are generated for the assigned user.
- Task reassignment notifications should notify affected users.
- Notification Center is not a permanent audit history. Work Log is the permanent audit/history layer.

Production readiness:

- Verify Charles, Trent, and Angel each see only their own attention items after production preview login.

---

## 6. AI/OpenAI Readiness

### API key handling

OpenAI key is used server-side in:

```text
/app/api/capture/analyze/route.ts
```

The browser sends content to the local API route. The API route then calls OpenAI with `OPENAI_API_KEY` from `process.env`.

### Server-side only usage

- `OPENAI_API_KEY` must not be prefixed with `NEXT_PUBLIC_`.
- Do not expose the OpenAI key in client components.
- Add it to Vercel as a sensitive environment variable.

### Routes requiring OpenAI

OpenAI is required by:

- AI Capture analysis.
- Email Intelligence analysis, because Email Intelligence calls `/api/capture/analyze`.
- Any upload/PDF/screenshot analysis that routes through `/api/capture/analyze`.

### Cost/rate considerations

- AI Capture can send pasted text, images, PDFs, spreadsheets, and documents.
- Large files can increase token/API costs.
- Before launch, Charles should consider internal rules for file size and usage.
- For three internal users, this is acceptable if usage is controlled.

---

## 7. Supabase Service Role Usage

### Routes requiring `SUPABASE_SERVICE_ROLE_KEY`

Confirmed server routes requiring service role:

```text
/app/api/auth/ensure-profile/route.ts
/app/api/merge/route.ts
```

### Why it must be set in Vercel

If `SUPABASE_SERVICE_ROLE_KEY` is missing in Vercel:

- Real user profile/team-member ensure may fail after login.
- Merge Manager API operations will fail.
- Work Log entries tied to merge operations may fail.

### Security warnings

- Service role bypasses normal RLS protections.
- Never expose service role in browser code.
- Never name it `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- Never paste it into committed files.
- Keep it only in `.env.local` locally and Vercel encrypted/sensitive env vars remotely.

---

## 8. Storage / Attachments Readiness

### Bucket

Known bucket:

```text
sell-it-attachments
```

### Current behavior

Email Intelligence attachment flow:

1. User selects file.
2. File is uploaded to Supabase Storage bucket `sell-it-attachments`.
3. App creates a signed URL valid for 7 days.
4. Attachment row is saved with storage path/file path.
5. Attachment is linked to the Activity record.

### Upload/download checks before launch

In Vercel preview, test:

- Upload image file.
- Upload PDF file.
- Upload text/CSV file.
- Confirm Activity record links the attachment.
- Confirm signed URL opens/downloads.
- Confirm old signed URLs expiring does not break the permanent storage path strategy.

### File size considerations

- Keep internal uploads reasonably small at launch.
- Recommended internal launch limit: under 10 MB unless needed.
- Supabase supports large storage, but large uploads can be slower, less reliable, and more expensive.
- For larger documents later, consider resumable uploads.

---

## 9. Domain Setup Recommendation

### Option A: `sales.knottylogistics.com`

Pros:

- Clean separation from the main Knotty Logistics website.
- Best fit for a standalone Vercel app.
- Easier DNS setup with Vercel.
- Cleaner Supabase Auth redirects.
- Cleaner cookies/session handling.
- Easier to later move, replace, or expand without disturbing the main website.
- Professional internal tool URL.

Cons:

- Requires adding a DNS record for the subdomain.
- Users must remember a separate subdomain.

### Option B: `knottylogistics.com/sales`

Pros:

- Looks like part of the existing main site.
- One main domain.

Cons:

- Harder if the main site is WordPress/Bluehost and Sell It is Vercel.
- Requires reverse proxy/path routing to send only `/sales` to Vercel.
- More fragile for Next.js routes, auth callbacks, assets, cookies, and redirects.
- More likely to cause confusion with Bluehost/WordPress hosting.

### Recommended choice

Use:

```text
sales.knottylogistics.com
```

Reason:

Sell It is a standalone app, not a WordPress page. A subdomain is cleaner, safer, easier to deploy, easier to troubleshoot, and better for Supabase Auth redirects.

---

## 10. Security Checklist

Before deployment:

- [ ] Confirm `.env.local` is not committed.
- [ ] Confirm `.gitignore` includes `.env*`.
- [ ] Confirm no secret keys are hardcoded in source files.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is only used in server routes.
- [ ] Confirm `OPENAI_API_KEY` is only used server-side.
- [ ] Confirm `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY` are only used server-side.
- [ ] Confirm `NEXT_PUBLIC_SHOW_DEV_ACTING_USER` is unset or false in production.
- [ ] Confirm Development Acting As UI is hidden in normal production UI.
- [ ] Confirm Charles, Trent, and Angel use real Supabase Auth login.
- [ ] Confirm Supabase Redirect URLs do not accidentally allow unsafe domains.
- [ ] Confirm RLS policies are acceptable for internal launch.
- [ ] Confirm Vercel production env vars are marked sensitive where appropriate.

Known current protection level:

- The app has basic login protection through Supabase Auth, a local auth cookie gate, a proxy redirect, and client session verification.
- This is acceptable for a controlled internal launch.
- Long-term security should move toward stronger server-verified auth/authorization on sensitive server routes.

---

## 11. Backup / Rollback Checklist

### GitHub

- Current known good commit before audit:

```text
c41e825
```

- Deployment audit commit should be recorded after this file is committed.
- If deployment causes problems, roll code back to the previous Vercel deployment or Git commit.

### Supabase

Before launch:

- [ ] Confirm Supabase project backup status.
- [ ] Export schema or confirm migrations are complete.
- [ ] Consider manual backup/export before first real remote use.
- [ ] Avoid schema changes during deployment unless separately reviewed.

### Vercel rollback

Vercel supports reverting to prior deployments from the deployment history.

Rollback expectation:

- If a new deployment fails, use Vercel dashboard to promote/revert to the last known good deployment.
- Rollback code first.
- Be careful rolling back code after database schema changes. Do not run schema changes during first deployment unless separately audited.

### Database migration caution

- Code rollback is easy.
- Database rollback is not always easy.
- For first deployment, avoid migrations unless required.

---

## 12. Launch Checklist

Do this only after this audit is accepted.

### Phase 1: Pre-deployment verification

1. Confirm local repo is clean.
2. Confirm latest commit is pushed to GitHub.
3. Run local build:

```text
npm.cmd run build
```

4. Confirm build passes.
5. Confirm `.env.local` is not tracked.
6. Confirm Supabase project has current database schema.
7. Confirm Charles, Trent, and Angel auth users exist.
8. Confirm team member rows exist and are active.
9. Confirm attachment bucket exists.

### Phase 2: Create Vercel project

1. Log into Vercel.
2. Import GitHub repo `redneckshop/sell-it`.
3. Select Next.js framework preset.
4. Build command: `npm run build`.
5. Do not override output directory.
6. Add required environment variables.
7. Deploy to Vercel preview first.

### Phase 3: Supabase Auth production URLs

1. Choose final domain, recommended `sales.knottylogistics.com`.
2. Add Site URL in Supabase Auth URL Configuration.
3. Add redirect URLs for production domain.
4. Add localhost URLs for continued local development.
5. Add Vercel preview URL temporarily if needed.

### Phase 4: Vercel preview smoke test

Test from the Vercel preview URL:

1. Signed-out visit to `/` redirects to `/login`.
2. Charles can log in.
3. Trent can log in.
4. Angel can log in.
5. Avatar menu shows correct user/workspace/role.
6. Sign Out returns to `/login`.
7. Password reset sends email.
8. Password reset opens `/update-password`.
9. Dashboard loads.
10. Companies page loads.
11. Contacts page loads.
12. Tasks page loads.
13. Planner loads.
14. Team page loads.
15. Notification Center loads per user.
16. AI Capture works if OpenAI key is set.
17. Email Intelligence analyze works if OpenAI key is set.
18. Attachment upload works.
19. Merge Manager loads and merge API does not fail.
20. Import Leads search works if Google Places key is set.

### Phase 5: Domain connection

1. In Vercel, add `sales.knottylogistics.com` as project domain.
2. Add required DNS record wherever `knottylogistics.com` DNS is managed.
3. Wait for DNS/SSL verification.
4. Re-test login, sign out, password reset, AI, storage, and merge on final domain.

### Phase 6: Internal launch

1. Give Charles, Trent, and Angel final URL.
2. Have each user sign in.
3. Have each user create one safe test task/activity.
4. Confirm attribution and notifications.
5. Confirm Work Log entry behavior.
6. Start using for real sales work.

---

## 13. Risks / Blockers

### Must fix/configure before deployment

1. **Vercel environment variables are not yet confirmed.**
   - Add all required env vars before deploy.

2. **Supabase Auth production URLs are not yet configured.**
   - Production login/password reset will be unreliable until this is done.

3. **Storage bucket/policies need production-domain test.**
   - Confirm `sell-it-attachments` works from Vercel.

4. **Service role must be present server-side.**
   - `/api/auth/ensure-profile` and `/api/merge` depend on it.

5. **OpenAI key must be present for AI routes.**
   - AI Capture and Email Intelligence analysis depend on it.

6. **Google Places key needed if Import Leads search is used.**
   - Not required for core CRM, but required for that feature.

### Not blockers for controlled internal launch

- No live email integration.
- No RingCentral integration.
- No social integration.
- Development Acting As is hidden from normal UI.
- Domain is not connected yet.
- Local dev using webpack does not block production build.

### Future hardening after launch

- Stronger server-side auth verification on sensitive API routes.
- More formal role/permission model.
- Per-workspace RLS hardening for future multi-project/multi-customer SaaS use.
- Rate/cost guardrails for AI file analysis.
- Better permanent attachment URL handling if signed URLs expire in visible records.

---

## 14. Final Recommendation

**Status:** Ready after minor deployment-configuration fixes.

Sell It is ready to move to Vercel preview after the environment variables are added. It should not be connected to the final production domain until the Vercel preview smoke test passes.

Recommended next step:

1. Commit this audit.
2. Add Vercel environment variables.
3. Deploy to Vercel preview only.
4. Configure Supabase Auth URLs.
5. Smoke test Charles, Trent, and Angel logins.
6. Connect `sales.knottylogistics.com` only after preview passes.

Recommended launch domain:

```text
sales.knottylogistics.com
```
