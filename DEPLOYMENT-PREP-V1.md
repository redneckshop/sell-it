# DEPLOYMENT PREP V1

Status: Prep-only document  
Latest confirmed good commit before this document: `895c8b2`  
Repository: `redneckshop/sell-it`  
Branch: `main`  
Prepared for: Sell It pre-launch deployment planning  
Important rule: Do **not** deploy during this task.

---

## 0. Scope

This document prepares the exact deployment settings and checklist needed before deploying Sell It to Vercel.

This document does **not**:

- Deploy the app
- Connect the live domain
- Change production data
- Add features
- Modify database tables
- Add live email, RingCentral, or social integrations

---

## 1. Recommended deployment target

Recommended hosting target:

```text
Vercel
```

Recommended source:

```text
GitHub repo: redneckshop/sell-it
Branch: main
```

Reason:

- Sell It is a Next.js app.
- Vercel is the cleanest target for a GitHub-backed Next.js deployment.
- The current repo has a normal `package.json` at the repository root.
- The current build script is:

```json
"build": "next build"
```

Recommended Vercel workflow:

1. Import GitHub repo `redneckshop/sell-it`.
2. Select branch `main`.
3. Use the Next.js framework preset.
4. Add environment variables before first production deployment.
5. Deploy to a Vercel preview/production URL first.
6. Smoke test Charles, Trent, and Angel logins.
7. Connect custom domain only after Vercel deployment is confirmed healthy.

---

## 2. Recommended production URL

Options compared:

```text
sales.knottylogistics.com
```

versus

```text
knottylogistics.com/sales
```

### Option A: `sales.knottylogistics.com`

Pros:

- Cleanest fit for a standalone Vercel app.
- Keeps Sell It separate from the existing Knotty Logistics website/WordPress stack.
- Easier DNS setup through a subdomain CNAME.
- Easier rollback because the app is isolated.
- Clear purpose: this is the sales app.
- Avoids reverse-proxy/subpath routing complexity.
- Avoids mixing app cookies/routes with the main website.
- Easier to replace later with a different app without touching the main website.

Cons:

- It is technically a separate subdomain.
- Users must remember `sales.knottylogistics.com` instead of clicking into the main website path.
- DNS must be configured for the subdomain.

### Option B: `knottylogistics.com/sales`

Pros:

- Looks like part of the main website.
- Could be easier to link from the existing website navigation.

Cons:

- More complex with Vercel because Sell It is a standalone Next.js app.
- Usually requires reverse proxying or moving the main domain to Vercel.
- Can conflict with the existing website stack.
- Higher chance of routing, cookie, auth, and password reset complications.
- Harder rollback because it is tied into the main website path.
- More likely to create support issues for a first deployment.

### Recommendation

Use:

```text
sales.knottylogistics.com
```

This is the best production URL for the first remote-use launch.

Primary reason:

```text
Sell It is a standalone app, so it should live on a standalone subdomain.
```

---

## 3. Vercel project settings

Recommended settings when importing the GitHub repo into Vercel:

```text
Framework Preset:
Next.js
```

```text
Root Directory:
Leave blank / repository root
```

Important clarification:

The local Windows path is:

```powershell
C:\Users\User\Desktop\Knotty Parent\Knotty Apps LLC\sell-it\app
```

But in GitHub, the `package.json` is at the repo root. That means the Vercel root directory should be the repository root, not a nested `/app` folder.

Use a nested root only if Vercel shows that `package.json` is inside a subfolder. Current repo state indicates it is not.

```text
Build Command:
npm run build
```

Reason:

`package.json` defines:

```json
"build": "next build"
```

```text
Install Command:
Default / npm install
```

Recommended value:

```text
Leave as Vercel default unless Vercel asks for one.
```

Acceptable explicit value:

```text
npm install
```

```text
Output Directory:
Leave default / no override
```

Reason:

Vercel automatically handles the output directory for detected Next.js projects.

```text
Development Command:
Not needed for production
```

Local development currently uses:

```text
next dev --webpack
```

This matters for local browser/dev stability only. Production Vercel builds use:

```text
next build
```

So the local `next dev --webpack` command should not be treated as a production setting.

### Node/runtime note

Do not change Node/runtime settings unless Vercel build complains. Start with Vercel defaults.

If Vercel asks for a Node version later, use the version Vercel recommends for the detected Next.js version.

---

## 4. Required Vercel environment variables

Add these in Vercel before first deployment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_SHOW_DEV_ACTING_USER
```

Recommended production values:

| Variable | Production value guidance | Client exposed? | Required? |
|---|---|---:|---:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No | Yes for AI routes |
| `NEXT_PUBLIC_SHOW_DEV_ACTING_USER` | `false` | Yes | Yes, recommended explicit false |

Recommended exact production value:

```text
NEXT_PUBLIC_SHOW_DEV_ACTING_USER=false
```

### Important security rules

Never put these in code:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

Never commit:

```text
.env.local
```

The `NEXT_PUBLIC_*` variables are exposed to the browser by design. That is okay for the Supabase URL and anon key, but not okay for secret keys.

### Optional/conditional environment variable to verify

Previous Sell It work may include Google Places lead import/search functionality.

Before actual deployment, confirm whether this route is still active and whether it requires:

```text
GOOGLE_PLACES_API_KEY
```

Do not add it unless the current app still needs Google Places search in production.

If Import Leads is not part of the first remote-use smoke test, this is not a blocker for Charles, Trent, and Angel using the core CRM.

---

## 5. Supabase settings needed

### 5.1 Site URL

Recommended production Site URL:

```text
https://sales.knottylogistics.com
```

Temporary Vercel testing Site URL option before live domain:

```text
https://<vercel-project-url>
```

Use the Vercel URL first only if testing password reset before the custom domain is connected.

After the custom domain is connected and verified, update Site URL to:

```text
https://sales.knottylogistics.com
```

### 5.2 Redirect URLs

Add these Supabase Auth redirect URLs:

```text
https://sales.knottylogistics.com
https://sales.knottylogistics.com/
https://sales.knottylogistics.com/login
https://sales.knottylogistics.com/update-password
```

Keep local development URLs too:

```text
http://localhost:3000
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/update-password
http://localhost:3001
http://localhost:3001/
http://localhost:3001/login
http://localhost:3001/update-password
```

Reason for port `3001`:

Local dev has sometimes run on port `3001` when port `3000` is already in use.

### 5.3 Password reset redirect URL

The login page sends password reset links to:

```text
${window.location.origin}/update-password
```

That means production password reset requires this URL to be allowed:

```text
https://sales.knottylogistics.com/update-password
```

Before the live domain is connected, password reset testing from a Vercel URL requires that Vercel URL version too:

```text
https://<vercel-project-url>/update-password
```

### 5.4 Auth settings

Check these before deployment:

- Email/password login enabled.
- Charles user exists.
- Trent user exists.
- Angel user exists.
- Each user can reset password.
- Each auth user has or can resolve to a Sell It profile.
- Each profile is linked to the Knotty Logistics workspace.
- Each profile/team member link is correct.
- Confirm Supabase email sending is adequate for the first three users.

### 5.5 Supabase email note

For a three-user internal launch, Supabase default auth email sending may be enough.

But if password resets fail or get rate-limited, configure custom SMTP later.

This is not a feature build. It is only a deployment readiness consideration.

### 5.6 Storage bucket checks

Confirm storage bucket exists:

```text
sell-it-attachments
```

Check:

- Bucket exists in the correct Supabase project.
- Upload works locally.
- Download/view links work locally.
- Vercel deployment can upload files.
- Vercel deployment can read/download files.
- Bucket policies allow the intended authenticated access.
- File size limit is acceptable for screenshots/PDF/email intelligence uploads.
- File names do not use unsupported characters.

Recommended first-launch file size expectation:

```text
Small screenshots, PDFs, and email attachments only.
```

Large file/video uploads should not be part of the first launch.

### 5.7 Database/migration state

Before actual deployment:

- No schema changes during deployment prep.
- Confirm local app is already pointed at the intended Supabase project.
- Confirm migrations/state already exist for:
  - workspaces
  - profiles
  - team_members
  - companies
  - contacts
  - opportunities
  - tasks
  - activities
  - notes
  - attachments
  - notifications
  - work log/audit-related tables if implemented
  - stage history tables if implemented
- Do not run new migrations during first Vercel deployment unless a migration was already designed, reviewed, and backed up.

---

## 6. Domain/DNS prep

Recommended production domain:

```text
sales.knottylogistics.com
```

Expected DNS record type:

```text
CNAME
```

Expected DNS host/name:

```text
sales
```

Expected DNS target/value:

```text
The CNAME value Vercel provides after adding sales.knottylogistics.com to the project.
```

Do not guess the final target value before Vercel shows it.

Vercel may show a target similar to:

```text
cname.vercel-dns.com
```

or a project-specific Vercel DNS target.

Use the exact value Vercel displays.

### Where DNS will likely be configured

This depends on where `knottylogistics.com` DNS is currently managed.

Likely places:

- Domain registrar DNS panel
- Cloudflare, if the domain uses Cloudflare nameservers
- Bluehost, if Bluehost still manages DNS
- GoDaddy/Namecheap/etc., if that is the registrar/DNS host

Before live domain connection, Charles needs to confirm where DNS records for `knottylogistics.com` are managed.

### Do not connect live domain yet

During Deployment Prep V1:

- Do not add DNS records yet unless explicitly moving to deployment.
- Do not point `sales.knottylogistics.com` yet.
- Do not change the main domain.
- Do not move nameservers.

---

## 7. Pre-deploy checklist

Complete this before actual deployment:

### Git/code

- [ ] Git status is clean.
- [ ] Latest commit confirmed:

```text
895c8b2
```

- [ ] Latest deployment prep document committed.
- [ ] `npm run build` passes locally.
- [ ] No accidental debug/test files uncommitted.
- [ ] No `.env.local` committed.
- [ ] No secret keys committed.

### Vercel

- [ ] Vercel account ready.
- [ ] GitHub connected to Vercel.
- [ ] Repo selected:

```text
redneckshop/sell-it
```

- [ ] Branch selected:

```text
main
```

- [ ] Framework preset:

```text
Next.js
```

- [ ] Root directory:

```text
Repository root
```

- [ ] Build command:

```text
npm run build
```

- [ ] Install command:

```text
Default / npm install
```

- [ ] Output directory:

```text
Default / no override
```

### Environment variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` gathered.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gathered.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` gathered.
- [ ] `OPENAI_API_KEY` gathered.
- [ ] `NEXT_PUBLIC_SHOW_DEV_ACTING_USER=false` ready.
- [ ] Optional: confirm whether `GOOGLE_PLACES_API_KEY` is needed for first launch.

### Supabase Auth

- [ ] Site URL prepared.
- [ ] Redirect URLs prepared.
- [ ] Password reset redirect URL prepared.
- [ ] Email/password auth enabled.
- [ ] Charles login ready.
- [ ] Trent login ready.
- [ ] Angel login ready.
- [ ] Password reset flow ready.

### Supabase Storage

- [ ] `sell-it-attachments` bucket exists.
- [ ] Upload policies are ready.
- [ ] Download/read policies are ready.
- [ ] File size limits acceptable.

### Team/users

- [ ] Charles profile linked.
- [ ] Trent profile linked.
- [ ] Angel profile linked.
- [ ] Charles team member linked.
- [ ] Trent team member linked.
- [ ] Angel team member linked.
- [ ] Assignments display correct names.
- [ ] Acting User hidden for production.

---

## 8. Post-deploy test checklist

After deploying to Vercel, but before connecting the live custom domain:

### Basic access

- [ ] Open Vercel production/preview URL.
- [ ] Confirm signed-out users land on `/login`.
- [ ] Confirm `/login` is standalone and clean.
- [ ] Confirm protected pages redirect to `/login`.

### Login tests

- [ ] Login as Charles.
- [ ] Confirm Charles avatar menu.
- [ ] Confirm Charles workspace/role display.
- [ ] Sign out as Charles.
- [ ] Login as Trent.
- [ ] Confirm Trent avatar menu.
- [ ] Confirm Trent workspace/role display.
- [ ] Sign out as Trent.
- [ ] Login as Angel.
- [ ] Confirm Angel avatar menu.
- [ ] Confirm Angel workspace/role display.
- [ ] Sign out as Angel.

### Password reset

- [ ] Send password reset link from production/Vercel URL.
- [ ] Open email.
- [ ] Confirm reset link opens `/update-password`.
- [ ] Set new password.
- [ ] Confirm redirect/login behavior is correct.

### Core CRM test

Use test records clearly named with deployment test labels, for example:

```text
DEPLOY TEST - Do Not Use
```

- [ ] Create test company if needed.
- [ ] Create test contact if needed.
- [ ] Create test task.
- [ ] Assign test task to Trent.
- [ ] Assign test task to Angel.
- [ ] Reassign test task back to Charles.
- [ ] Check Planner.
- [ ] Check task detail page.
- [ ] Check notifications.
- [ ] Check actor/recipient behavior.
- [ ] Complete or archive/delete test task after verification if safe.

### AI tests

- [ ] Check AI Assistant.
- [ ] Ask: “What should I do today?”
- [ ] Confirm response loads.
- [ ] Confirm no API key is visible in browser.
- [ ] Check AI Capture with a small harmless test note.
- [ ] Confirm review-before-save still works.
- [ ] Confirm save behavior works only after review.
- [ ] Check Email Intelligence manual capture with a small pasted test email.
- [ ] Confirm no live email integration was added.

### Attachment/storage tests

- [ ] Upload small screenshot.
- [ ] Upload small PDF if needed.
- [ ] Confirm attachment appears on the related record.
- [ ] Confirm attachment can be opened/downloaded.
- [ ] Confirm no large-file/video testing during first launch.

### Work Log / audit checks

- [ ] Create a harmless test action.
- [ ] Confirm Work Log/audit attribution records the correct user.
- [ ] Confirm Acting User does not appear in normal production UI.
- [ ] Confirm team-member attribution appears correct where implemented.

### Browser tests

- [ ] Chrome login.
- [ ] Firefox login.
- [ ] Firefox protected-route redirect.
- [ ] Firefox sign out.
- [ ] Firefox password reset if practical.
- [ ] Mobile browser quick login test if practical.

---

## 9. Rollback plan

### Code rollback

If deployment breaks:

1. Go to Vercel project.
2. Open Deployments.
3. Select last known good deployment.
4. Use Vercel rollback/promote previous deployment.
5. Confirm app loads.

### Git rollback reference

Current known good baseline before Deployment Prep V1:

```text
895c8b2
```

After committing this document, the new commit will become the latest good documentation commit.

### Supabase caution

Vercel rollback only rolls back app code.

It does **not** roll back:

- Supabase database data
- Supabase schema changes
- Supabase Auth users
- Supabase Storage files
- Supabase RLS policies

Because of that:

- Do not make database migrations during first deployment.
- Do not test with important real customer data first.
- Use obvious test records.
- Confirm backups before any future database migration.
- Treat database changes as a separate controlled task.

---

## 10. Blockers / missing info before actual deployment

Deployment should not start until these are answered or gathered:

### Required values

- [ ] Actual `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Actual `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Actual `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Actual `OPENAI_API_KEY`

### Vercel/GitHub access

- [ ] Confirm Charles can access Vercel.
- [ ] Confirm Vercel can access GitHub repo `redneckshop/sell-it`.
- [ ] Confirm repo import works.

### Supabase access

- [ ] Confirm Charles can access the correct Supabase project.
- [ ] Confirm the project is the same one used locally.
- [ ] Confirm Supabase Auth users exist for Charles, Trent, and Angel.
- [ ] Confirm Supabase Storage bucket exists.

### DNS access

- [ ] Confirm where `knottylogistics.com` DNS is managed.
- [ ] Confirm Charles has login access to that DNS provider.
- [ ] Confirm no existing `sales` CNAME conflicts.

### Email/password reset

- [ ] Confirm Supabase password reset emails are deliverable.
- [ ] Confirm whether default Supabase auth email sending is enough for the first launch.
- [ ] If not, prepare SMTP settings later.

### Optional/conditional

- [ ] Confirm whether Google Places lead import is part of first launch.
- [ ] If yes, gather `GOOGLE_PLACES_API_KEY`.
- [ ] If no, leave Google Places out of first deployment smoke test.

---

## 11. Exact deployment-prep settings summary

Use this table when creating the Vercel project.

| Setting | Recommended value |
|---|---|
| Hosting | Vercel |
| Git provider | GitHub |
| Repo | `redneckshop/sell-it` |
| Branch | `main` |
| Framework preset | `Next.js` |
| Root directory | Repo root / blank |
| Install command | Default / `npm install` |
| Build command | `npm run build` |
| Output directory | Default / no override |
| Production URL | `sales.knottylogistics.com` |
| Domain record type | CNAME |
| Domain record name | `sales` |
| Domain target | Exact value Vercel provides |
| Acting User env | `NEXT_PUBLIC_SHOW_DEV_ACTING_USER=false` |

---

## 12. Recommended next task

Next logical task after this document:

```text
VERCEL DEPLOYMENT V1
```

That task should include:

1. Import repo into Vercel.
2. Add environment variables.
3. Deploy to Vercel URL only.
4. Do not connect custom domain yet.
5. Smoke test Vercel URL.
6. Fix any deployment-only errors.
7. Commit any required deployment fixes.
8. Only after successful Vercel URL testing, prepare `sales.knottylogistics.com`.

---

## 13. Final recommendation

Sell It is ready for deployment preparation.

Actual deployment should wait until:

```text
Required Vercel env vars are gathered
Supabase Auth URLs are prepared
DNS provider is identified
Charles/Trent/Angel accounts are confirmed in the target Supabase project
```

Deployment status:

```text
Ready for Vercel deployment after required settings are gathered.
```

Recommended first live URL:

```text
sales.knottylogistics.com
```

Do not use:

```text
knottylogistics.com/sales
```

for the first deployment unless there is a strong business reason to accept extra routing/proxy complexity.

---

## 14. Reference notes

- Current repo build script: `npm run build` -> `next build`.
- Current repo client Supabase variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Current password reset behavior redirects to `${window.location.origin}/update-password`.
- Current protected-route gate allows `/login` and `/update-password` publicly and redirects other app pages to `/login` when signed out.
- Vercel automatically uses framework/build defaults for detected frameworks.
- Vercel subdomains use CNAME records.
- Supabase Auth requires redirect URLs to be allowed when using `redirectTo`.
- Supabase password reset requires the change-password page URL to be configured in redirect URLs.
- Supabase Storage file-size limits should be checked before production upload testing.
