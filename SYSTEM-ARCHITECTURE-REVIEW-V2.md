# SYSTEM ARCHITECTURE REVIEW V2

Review date: June 22, 2026  
Latest confirmed good commit: `9251b07`  
Scope: Design / review only  
Build impact: No feature build, no database change, no UI change, no app logic change, no integration change

---

## 1. Purpose

This document reviews the current Sell It system after the latest major milestones and recommends the safest next build order.

Recent major milestones considered:

- Command Center V2
- Navigation Manager V2
- Notification Center V1
- Acting User V1
- Email Intelligence V1A stabilization
- Work Log Design V1
- Concurrency Safeguards Design V1

The goal is not to build anything in this file. The goal is to decide what should be built next, what should wait, and what architectural risks need to be respected before Sell It becomes more multi-user, more automated, and more integration-heavy.

---

## 2. Current System Layers

### 2.1 CRM Layer

Current CRM core includes:

- Companies
- Contacts
- Opportunities
- Tasks
- Activities
- Notes
- Attachments
- Communities
- Posts
- Pain Points
- Relationship timeline
- Merge / archive / delete support

The CRM layer is the main business memory layer. Most other systems either write into it, read from it, or help the user act on it.

Current CRM role:

- Stores business relationships.
- Stores sales progress.
- Stores tasks and follow-ups.
- Stores activity history.
- Links related business records.
- Provides the structured source of truth for the Assistant, Planner, Capture, and Command Center.

Current CRM maturity:

- Strong for Charles-only use.
- Useful for small team use.
- Not yet ready for broad multi-user SaaS without deeper permission, audit, and concurrency enforcement.

---

### 2.2 Capture Layer

Current capture systems include:

- AI Capture
- Manual capture
- File/PDF/screenshot-assisted capture
- Existing opportunity update handling
- Duplicate prevention
- Field rescue
- Manual review before save
- Relationship linking

The Capture layer is one of the strongest parts of Sell It because it turns messy business information into structured CRM records.

Current capture role:

- Converts raw information into records.
- Creates or updates companies, contacts, opportunities, tasks, activities, and pain points.
- Helps prevent duplicate tasks, duplicate activities, duplicate pain points, and repeated opportunity notes.
- Preserves raw context when possible.

Current capture risk:

- As more sources become live, Capture will shift from manual/user-reviewed input to semi-automated or automated ingestion.
- Before that happens, Sell It needs stronger audit logging, identity tracking, dedupe rules, and possibly queue/review controls.
- Live integrations should not write directly into the CRM without Work Log and concurrency foundations.

---

### 2.3 Assistant Layer

Current Assistant systems include:

- AI Business Memory
- Proactive insights
- Assistant action recommendations
- Task scheduling action flow
- Capture-related recommendations
- Relationship/timeline awareness
- Opportunity stage history awareness
- Command Center support

The Assistant is increasingly becoming the command brain of Sell It.

Current Assistant role:

- Summarizes business memory.
- Surfaces what needs attention.
- Helps the user decide what to do next.
- Creates safer action flows through review/confirmation pages.
- Bridges raw CRM records into practical daily execution.

Current Assistant risk:

- The Assistant can become dangerous if it recommends actions based on stale, incomplete, or conflicting data.
- It should not be allowed to silently perform destructive or major changes.
- It needs Work Log visibility and concurrency protection before high-trust automation is expanded.
- It should remain review-first until identity, permissions, audit history, and conflict handling are stronger.

---

### 2.4 Planner Layer

Current Planner role:

- Organizes tasks by due date, status, priority, and assignment.
- Gives the user a practical execution view.
- Supports assigned team member filtering.
- Receives tasks from manual entry, Capture, and Assistant flows.

Current Planner maturity:

- Good for daily execution.
- Good for Charles-only and small internal team use.
- Needs stronger assignment history, reassignment audit logging, and concurrency protection before heavier team use.

Current Planner risk:

- Assignment changes can affect multiple people.
- Due date changes can cause missed work if overwritten.
- Task status changes can create confusion without a permanent Work Log.
- The Notification Center helps with attention, but does not replace permanent task history.

---

### 2.5 Team / Assignment Layer

Current team system includes:

- Internal team members
- Task assignment
- Acting User V1
- Assignment notifications
- Team page

Current team role:

- Allows Sell It to simulate and support multiple internal users.
- Supports assigning work to Charles, Trent, and Angel.
- Supports notification behavior around task assignment and reassignment.

Current team maturity:

- Useful as an internal temporary model.
- Not the same as real authenticated multi-user security.
- Good enough for controlled Charles + Trent + Angel use if expectations are clear.
- Not ready for 10+ users or SaaS users without real auth, permissions, and user/session identity.

Current team risk:

- Acting User is a temporary convenience model, not a security model.
- A logged-in person may be able to act as another person depending on current implementation.
- Notifications depend heavily on knowing who caused an event and who needs to know about it.
- Future real auth must replace or wrap Acting User cleanly.

---

### 2.6 Notification Layer

Current Notification Center role:

- Alerts users to things that likely need their attention.
- Should not function as a full history feed.
- Should avoid old historical records becoming noisy notifications.
- Should focus on “things the current user may not know happened.”

Current notification semantics:

- The bell should show attention-worthy changes.
- The bell should not show every activity.
- The bell should not be the permanent audit log.
- Work Log should become the permanent history layer.
- Notification Center should remain a short-term attention layer.

Current notification maturity:

- Stronger after attention-only cleanup.
- Still risky because semantics are subtle.
- Assignment and reassignment are appropriate notification events.
- Old pain points, email activities, and stage history should not regenerate bell notifications.

Current notification risk:

- Notification Center can become noisy if used as history.
- Notification Center can become incomplete if expected to replace history.
- Notification Center behavior depends on reliable actor identity.
- Acting User makes notification correctness harder.
- Future integrations could flood notifications if event rules are not disciplined.

---

### 2.7 Email Intelligence Layer

Current Email Intelligence V1A role:

- Allows manual email capture.
- Supports pasted email/raw email content.
- Supports optional uploads.
- Uses AI analysis and editable review before saving.
- Creates and links CRM records.
- Preserves raw email content in activity notes.
- Preserves source/mailbox/from/to/subject/date when available.
- Preserves uploaded files through existing attachment/storage pattern.

Current email maturity:

- Strong as manual/review-first capture.
- Stabilized for internal use.
- Not yet a live mailbox ingestion system.
- Not yet ready for automatic sync without more foundation.

Current email risk:

- Live email introduces privacy, duplicate, threading, rate-limit, credential, and background job issues.
- Live email can create a high volume of events.
- Live email needs a reliable Work Log.
- Live email needs dedupe rules stronger than manual capture.
- Live email needs clear rules for what creates notifications.
- Live email should not arrive before audit and concurrency foundations.

---

### 2.8 Merge / Archive / Delete Layer

Current merge/archive/delete role:

- Helps clean up duplicate records.
- Supports safer review flows.
- Keeps CRM data organized.
- Reduces duplicate company/contact/task/activity clutter.

Current maturity:

- Strong internal cleanup capability.
- Safer than raw direct destructive actions.
- Still architecturally sensitive.

Current risks:

- Permanent delete is inherently dangerous.
- Merge operations can move relationships and are hard to reverse.
- Archive is safer than delete and should remain preferred.
- Without a real Work Log, the system may not have enough permanent evidence of what changed, who changed it, and why.
- Without concurrency protection, one user could delete/archive/merge while another user is editing a related record.

Architectural preference:

- Archive should remain the default safe removal action.
- Permanent delete should be rare, guarded, and logged.
- Merge should be heavily reviewed, logged, and eventually reversible or at least fully auditable.

---

### 2.9 Relationship Timeline Layer

Current relationship timeline role:

- Shows activity and relationship history across companies, contacts, opportunities, and pain points.
- Gives context to the Assistant.
- Helps users understand the history of a relationship.

Current maturity:

- Valuable and central to Sell It’s business memory.
- Supports better decision-making.
- Not the same as a permanent immutable Work Log.

Current risk:

- Timeline is business context, not audit history.
- Timeline may summarize or display selected business events.
- It should not be expected to prove every system-level change.
- Work Log should become the permanent audit layer beneath or beside it.

---

### 2.10 Work Log Design Layer

Current Work Log status:

- Design exists.
- No actual Work Log build yet.
- No immutable audit table has been implemented yet.
- No universal logging hooks have been implemented yet.

Intended Work Log role:

- Permanent immutable system history.
- Separate from Notification Center.
- Separate from relationship timeline.
- Logs who did what, when, to which record, and why if available.
- Supports actor tracking.
- Supports Acting User compatibility.
- Supports future real-auth compatibility.
- Supports record-level history.
- Supports export, search, retention, and security controls.

Current risk from missing Work Log:

- Important changes may not be permanently traceable.
- Merge/archive/delete events may not have enough audit depth.
- Notifications may be incorrectly treated as history.
- Future integrations may write changes without durable traceability.
- Troubleshooting multi-user conflicts will be harder.

---

### 2.11 Concurrency Design Layer

Current concurrency status:

- Design exists.
- No actual concurrency enforcement yet.
- No optimistic save checks yet.
- No row version checks yet.
- No stale record conflict UI yet.
- No merge/archive/delete conflict enforcement yet.

Intended concurrency role:

- Prevent accidental overwrites.
- Detect stale records.
- Protect against conflicting edits.
- Protect dangerous operations like merge/archive/delete.
- Support future multi-user work.
- Provide a path toward realtime awareness later.

Current risk from missing concurrency:

- Two users can edit the same record and overwrite one another.
- A record can be archived/deleted while another user is editing it.
- Opportunity stage or task assignment changes can conflict.
- Future live integrations can update records while users are editing them.
- Assistant or integration-driven updates can conflict with manual edits.

---

## 3. Current Strengths

### 3.1 Strong CRM Foundation

Sell It has moved past a simple contact manager. It now has meaningful linked business records:

- Companies
- Contacts
- Opportunities
- Tasks
- Activities
- Notes
- Pain points
- Attachments
- Posts
- Communities

The relationship model is already useful for real selling work.

---

### 3.2 Strong AI Capture Direction

AI Capture is one of the most valuable current systems. It supports the core Sell It idea:

> Get messy business information into structured business memory quickly.

The review-before-save pattern is especially important. It keeps AI helpful without making it dangerously autonomous.

---

### 3.3 Assistant Is Becoming a Practical Operating Layer

The Assistant is no longer just a chat surface. It can inspect business memory, surface priorities, and route the user toward useful actions.

This is a major strength because the long-term value of Sell It is not just storing records. The value is helping the user know what to do next.

---

### 3.4 Notification Center Has the Right Conceptual Direction

The Notification Center has been corrected toward attention-only behavior.

That is the right architecture.

Notifications should answer:

> “What do I need to know or act on?”

They should not answer:

> “What has ever happened?”

That second question belongs to the future Work Log and existing relationship timeline depending on context.

---

### 3.5 Acting User V1 Unlocks Internal Testing

Acting User is useful for simulating team behavior before full auth and permissions exist.

It allows the system to test assignment, reassignment, and notification behavior for Charles, Trent, and Angel.

This is valuable, but it must remain clearly understood as temporary.

---

### 3.6 Design Documents Are Ahead of Build

Work Log Design V1 and Concurrency Safeguards Design V1 are important because they define foundations before they are built.

That is safer than building integrations first and trying to retrofit audit and conflict protection later.

---

## 4. Current Risks

### 4.1 Notification Semantics Risk

The biggest conceptual risk is confusing these systems:

- Notification Center
- Relationship Timeline
- Work Log

They should remain separate.

Notification Center:

- Short-term attention
- User-specific
- Often dismissible/read
- Focused on what the user may not know

Relationship Timeline:

- Business relationship context
- Customer/company/contact/opportunity history
- Useful for selling and decision-making

Work Log:

- Permanent audit trail
- System-level and record-level truth
- Not primarily an attention tool
- Not optional once multi-user and integrations grow

Risk:

If Notification Center becomes a history feed, it will become noisy and lose value.

If Notification Center is expected to be an audit log, it will be incomplete and unsafe.

---

### 4.2 Acting User Temporary Model Risk

Acting User is helpful but dangerous if treated as real authentication.

Current risk areas:

- A user could potentially act as another team member.
- The system may show events as caused by the selected acting user rather than the authenticated account.
- Notifications rely on actor identity.
- Future permissions cannot rely on Acting User alone.
- Work Log must eventually distinguish:
  - authenticated account
  - acting user/team member
  - system/integration actor

Recommended principle:

> Acting User can remain for internal convenience, but it should not be the final identity or security model.

---

### 4.3 Permanent Delete Risk

Permanent delete should be treated as one of the highest-risk actions in Sell It.

Risk areas:

- Deleted records may remove business history.
- Related records may become orphaned or misleading.
- Deleting during another user’s edit can create conflicts.
- Deleting after external integrations exist can break sync assumptions.
- Without Work Log, deletion may not be sufficiently traceable.

Recommended principle:

> Archive should be preferred. Permanent delete should be rare, guarded, and logged.

---

### 4.4 Lack of Actual Work Log Build

The Work Log has been designed but not built.

Current risk:

- Major events may not have immutable traceability.
- Merge/archive/delete may not be permanently auditable.
- Future live integrations would lack a durable change trail.
- Future user disputes or confusion will be harder to resolve.
- Notification Center may continue being pressured to act like history.

This is the strongest argument for building Work Log V1 next.

---

### 4.5 Lack of Concurrency Enforcement

Concurrency has been designed but not built.

Current risk:

- Two users can overwrite each other’s changes.
- External integrations can eventually overwrite manual edits.
- Assistant-driven updates can conflict with user edits.
- Merge/archive/delete can happen while another user is editing.
- Task assignment and opportunity stage changes can conflict.

This risk grows sharply when Trent and Angel use the app at the same time or when integrations begin writing data.

---

### 4.6 Future Real Multi-User Auth Risk

The current team model is not the final user model.

Future needs:

- Real authenticated users
- Workspace membership
- Role-based permissions
- Record ownership/visibility rules
- User-specific notifications
- User-specific audit identity
- Safe invite/onboarding flow
- Possibly per-workspace billing later

Risk:

If too many features are built on top of temporary Acting User assumptions, future real-auth migration becomes harder.

---

### 4.7 Future Live Integration Risk

Future integrations include:

- Live email
- RingCentral
- Social tracking
- Bitly/link tracking
- Possibly Google Meet/Krisp transcript ingestion

These integrations will create new records and update existing records automatically.

Risks:

- Duplicate records
- Event floods
- Notification spam
- Bad actor identity
- Unclear source of truth
- Background job failures
- Credential/security problems
- Hard-to-debug sync issues
- Conflicts with manual edits

Recommended principle:

> Do not let live integrations write freely before Work Log, concurrency, and identity foundations are stronger.

---

## 5. Architectural Debt

This section identifies cleanup areas for later. Nothing should be fixed as part of this review.

### 5.1 Acting User Debt

Acting User should eventually be replaced or wrapped by real auth.

Future cleanup:

- Separate authenticated user from acting team member.
- Log both identities where relevant.
- Prevent unauthorized acting-as behavior.
- Add role/permission enforcement.
- Decide whether Acting User remains only as an admin/test feature.

---

### 5.2 Notification Rules Debt

Notification rules should eventually be centralized and documented in code.

Future cleanup:

- Define event types that can create notifications.
- Define event types that should only go to Work Log.
- Define who receives each notification.
- Define dedupe/suppression windows.
- Define read/dismiss/archive behavior.
- Define integration-specific notification rules.

---

### 5.3 Delete/Merge/Archive Safety Debt

Future cleanup:

- Prefer archive over delete in most flows.
- Add Work Log entries for all destructive/major actions.
- Add concurrency checks before major actions.
- Add relationship impact previews.
- Add recovery/export options where practical.
- Consider soft-delete for more entities if not already consistent.

---

### 5.4 Integration Boundary Debt

Before live integrations, Sell It needs clearer integration boundaries.

Future cleanup:

- Source identifiers
- External message/call/link IDs
- Import batch IDs
- Idempotency keys
- Retry behavior
- Failed-ingestion review queue
- Integration actor identity
- Integration-level notification rules

---

### 5.5 Background Job Debt

Live email, RingCentral, and social tracking will likely need background jobs.

Future cleanup:

- Decide job runner approach.
- Decide retry and failure logging.
- Decide where job state lives.
- Decide how Vercel limitations affect background processes.
- Decide whether Supabase Edge Functions or another worker service is needed.

---

### 5.6 Environment / Secrets Debt

More integrations mean more secrets.

Future cleanup:

- Separate local, preview, and production env values.
- Audit which keys are client-safe and which are server-only.
- Rotate keys before production if exposed during development.
- Document required Vercel env variables.
- Protect Supabase service role key.
- Avoid logging secrets.

---

### 5.7 Migration Discipline Debt

As Sell It grows, schema changes need stronger discipline.

Future cleanup:

- Keep SQL migrations versioned.
- Avoid manual undocumented Supabase changes.
- Confirm backup strategy before destructive migrations.
- Test migrations on a copy before production.
- Maintain a schema change log.

---

## 6. Next Build Candidates

### 6.1 Work Log V1

Summary:

Build the permanent immutable audit/history layer.

Expected value:

- Creates system-of-record change history.
- Separates history from notifications.
- Improves trust.
- Supports future debugging.
- Supports merge/archive/delete accountability.
- Supports future integrations.
- Supports future real-auth migration.

Risks if delayed:

- More features will be built without audit history.
- Notifications may be overloaded.
- Integrations may become harder to troubleshoot.
- Multi-user actions may become harder to explain.

Build complexity:

- Medium.
- Requires database table(s).
- Requires logging hooks.
- Requires careful event naming.
- Should start with high-value events, not every tiny field immediately.

Recommended V1 scope:

- Record created
- Record updated
- Record archived
- Record deleted
- Record merged
- Task assigned/reassigned
- Opportunity stage changed
- Email Intelligence save
- Acting User actor context
- System/integration actor placeholder
- Record-level Work Log display
- Basic global Work Log page/search can wait if needed

Assessment:

Work Log V1 is the safest next foundation.

---

### 6.2 Concurrency Protection V1

Summary:

Build optimistic concurrency protections to prevent stale overwrites and dangerous conflicting actions.

Expected value:

- Protects multi-user editing.
- Reduces accidental overwrites.
- Protects task assignment and opportunity stage changes.
- Protects archive/delete/merge actions.
- Prepares for live integrations.

Risks if delayed:

- Charles + Trent + Angel may overwrite each other.
- Integration writes may conflict with manual edits.
- Merge/archive/delete may happen while another user is editing.
- Stale data may silently win.

Build complexity:

- Medium to high.
- Requires consistent save patterns.
- May require database fields such as `row_version` if not already available.
- Requires UI conflict messaging.
- Requires testing many edit flows.

Recommended V1 scope:

- Start with high-risk records:
  - Companies
  - Contacts
  - Opportunities
  - Tasks
- Add stale `updated_at` check first if feasible.
- Add stronger `row_version` later if needed.
- Protect archive/delete/merge flows.
- Add clear conflict review page/message.
- Do not attempt realtime collaboration yet.

Assessment:

Concurrency Protection V1 is the second safest foundation, very close behind Work Log V1.

---

### 6.3 Live Email Integration V1

Summary:

Connect live mailbox ingestion/sync.

Expected value:

- Major practical value.
- Reduces manual copy/paste.
- Makes Sell It much more automatic.
- Increases activity history completeness.
- Can create tasks/follow-ups from real messages.

Risks if built too soon:

- High duplicate risk.
- High notification noise risk.
- Credential/security risk.
- Threading risk.
- Sync/retry risk.
- Privacy risk.
- Conflict risk.
- Hard to debug without Work Log.

Build complexity:

- High.
- Requires provider choice.
- Requires OAuth or mailbox credentials.
- Requires background sync.
- Requires dedupe and idempotency.
- Requires review queue decisions.
- Requires source tracking.

Assessment:

High value, but should wait until Work Log and basic concurrency are built.

---

### 6.4 RingCentral Integration V1

Summary:

Connect calls, missed calls, voicemails, recordings, transcripts, and possibly SMS.

Expected value:

- Very high for sales workflow.
- Captures real customer communication.
- Enables call follow-up automation.
- Supports activity timeline and Assistant insights.

Risks if built too soon:

- Call volume could create noisy records.
- Missed call notifications could become noisy.
- Recording/transcript storage has privacy implications.
- Identity mapping matters.
- Integration failures need logging.
- Conflict and dedupe rules are needed.

Build complexity:

- High.
- Requires API credentials.
- Requires webhook or polling strategy.
- Requires phone number/user mapping.
- Requires transcript/recording storage decisions.
- Requires notification rules.

Assessment:

Very valuable but should wait until after Work Log, concurrency, and probably real user/permission foundations.

---

### 6.5 Social / Bitly Tracking V1

Summary:

Track social posts, link clicks, and engagement signals.

Expected value:

- Useful for marketing and lead tracking.
- Could connect external interest to CRM records.
- Could alert on Facebook comments or link activity.

Risks if built too soon:

- External engagement can create noisy data.
- Hard to match clicks/comments to real contacts.
- Notification spam risk.
- API limitations and platform policy issues.
- Less core than email/calls.

Build complexity:

- Medium to high depending on source.
- Requires API decisions.
- Requires link identity rules.
- Requires event dedupe.
- Requires notification rules.

Assessment:

Should wait. It is useful, but not foundational enough to build before Work Log, concurrency, auth, email, or RingCentral.

---

### 6.6 Permissions / Real User Auth V1

Summary:

Move from temporary Acting User model toward real authenticated users and permissions.

Expected value:

- Required for 10 users.
- Required for SaaS.
- Required for security.
- Required for user-specific notifications.
- Required for trustworthy actor identity.
- Required before inviting outside users.

Risks if delayed:

- Acting User assumptions may spread.
- Security model may become harder to retrofit.
- User-specific notifications may be incorrect.
- Audit history may need migration.

Build complexity:

- High.
- Requires careful schema review.
- Requires workspace membership model.
- Requires roles/permissions.
- Requires invite/onboarding decisions.
- Requires UI and access-control testing.

Assessment:

Important, but Work Log should likely come first so the transition to real auth can be logged and reasoned about. Permissions/Auth should come before broad multi-user or SaaS use.

---

## 7. Recommended Build Order

### Rank 1: Work Log V1

Reasoning:

Work Log V1 is the safest next real build because it creates the permanent truth layer that every other risky feature will need.

It should come before live integrations because integrations will create and update many records.

It should come before heavy permissions work because the identity model transition itself should be auditable.

It should come before full concurrency if only one foundation can be built first, because Work Log helps explain and debug all later changes.

Recommended initial scope:

- Add immutable work log table.
- Log major entity events.
- Log task assignment/reassignment.
- Log opportunity stage changes.
- Log merge/archive/delete events.
- Log Email Intelligence saves.
- Store authenticated user if available.
- Store Acting User if available.
- Store system actor placeholder for future integrations.
- Display record-level history in a simple read-only view.

Do not overbuild:

- No advanced analytics.
- No export system yet.
- No retention automation yet.
- No complex global search unless simple.
- No realtime log stream.

---

### Rank 2: Concurrency Protection V1

Reasoning:

After Work Log, concurrency protection should be the next foundation.

This protects Charles + Trent + Angel from accidental overwrites and prepares the system for live integrations.

Recommended initial scope:

- Start with `updated_at` stale checks where possible.
- Protect Companies, Contacts, Opportunities, and Tasks first.
- Add stale-save warning.
- Protect archive/delete/merge actions.
- Protect task assignment and opportunity stage changes.
- Keep conflict resolution simple in V1.

Do not overbuild:

- No Google-doc-style realtime editing.
- No complex field-by-field merge UI in V1.
- No websocket presence required yet.
- No broad collaboration engine.

---

### Rank 3: Permissions / Real User Auth V1

Reasoning:

Once Work Log and basic concurrency exist, Sell It should move toward real identity and permissions.

This is necessary before 10 users or SaaS use.

Recommended initial scope:

- Real workspace membership.
- Roles such as owner/admin/member.
- User-specific notification identity.
- Actor tracking connected to authenticated user.
- Preserve Acting User only if still needed for internal/admin simulation.
- Prevent unauthorized access to other workspaces.

Do not overbuild:

- No complex enterprise permissions yet.
- No customer-facing SaaS billing yet.
- No public signup until internal model is proven.

---

### Rank 4: Live Email Integration V1

Reasoning:

Email is probably the highest-value integration, but it should not come before audit, concurrency, and identity foundations.

Recommended initial scope:

- Start read-only or review-first.
- Import selected messages.
- Create activities only after review.
- Preserve external message ID.
- Add idempotency/dedupe.
- Log every import/save to Work Log.
- Use careful notification rules.

Do not overbuild:

- No fully automatic CRM mutation at first.
- No bulk background sync without review.
- No auto-send email.
- No broad mailbox-wide automation until dedupe is proven.

---

### Rank 5: RingCentral Integration V1

Reasoning:

RingCentral is very valuable for sales memory, but it has more moving parts than manual email capture.

Recommended initial scope:

- Missed call capture
- Call activity creation
- Voicemail metadata
- Manual review before CRM writes if possible
- Clear phone number to team member mapping
- Work Log entries for imports

Do not overbuild:

- No automatic call coaching yet.
- No full transcript intelligence until storage/privacy rules are clear.
- No noisy call notifications.

---

### Rank 6: Social / Bitly Tracking V1

Reasoning:

Useful, but less foundational and more likely to create noisy signals.

Recommended initial scope when ready:

- Track known campaign links.
- Store click/engagement events separately.
- Only notify on meaningful thresholds.
- Avoid trying to identify anonymous visitors too aggressively.
- Link to CRM records only when confidence is high.

Do not build before:

- Work Log
- Concurrency
- Real user/auth direction
- Email/RingCentral basics

---

## 8. Do Not Build Yet List

These should wait:

### 8.1 Full Live Email Automation

Do not build full mailbox automation yet.

Reason:

- Needs Work Log.
- Needs dedupe.
- Needs credential strategy.
- Needs conflict protection.
- Needs notification rules.

---

### 8.2 RingCentral Full Automation

Do not build full RingCentral automation yet.

Reason:

- Needs user/phone mapping.
- Needs Work Log.
- Needs privacy/storage decisions.
- Needs notification discipline.

---

### 8.3 Social Tracking Automation

Do not build social/Bitly automation yet.

Reason:

- Lower foundation value.
- Higher noise risk.
- Identity matching is weaker.
- Better after email/calls.

---

### 8.4 SaaS/Public Multi-Tenant Launch

Do not launch as SaaS yet.

Reason:

- Auth/permissions are not mature enough.
- Billing is not designed.
- Tenant isolation must be proven.
- Audit and concurrency are not built.

---

### 8.5 Advanced Assistant Autonomy

Do not let the Assistant make major changes automatically yet.

Reason:

- Needs Work Log.
- Needs conflict checks.
- Needs permissions.
- Needs stronger approval rules.

Safe Assistant direction for now:

- Recommend.
- Summarize.
- Draft.
- Route to review pages.
- Require confirmation before writes.

---

### 8.6 Realtime Collaboration

Do not build realtime presence or collaborative editing yet.

Reason:

- Concurrency protection should come first.
- Realtime adds complexity without solving the basic stale-save problem.
- V1 only needs safe conflict detection.

---

### 8.7 Complex Permission Matrix

Do not build enterprise-grade permissions yet.

Reason:

- Internal team needs are simple.
- Owner/admin/member is enough for early real-auth work.
- Complex permissions can wait until actual usage proves the need.

---

## 9. Deployment Readiness Notes

### 9.1 Vercel Environment Variables

Before deployment, confirm production Vercel env variables are complete and separated from local development values.

Likely required categories:

- Supabase URL
- Supabase anon/public key
- Supabase service role key for server-only operations
- OpenAI API key
- App base URL
- Any storage/bucket configuration if needed
- Future email integration credentials
- Future RingCentral credentials
- Future social/Bitly credentials

Important:

- Client-safe keys and server-only secrets must remain separated.
- Service role key must never be exposed to browser/client code.
- OpenAI key must remain server-only.
- Future email/RingCentral credentials must remain server-only.

---

### 9.2 Supabase Service Role Key

The Supabase service role key is powerful.

Rules:

- Use only server-side.
- Never expose in client components.
- Never print in logs.
- Never commit to GitHub.
- Rotate if accidentally exposed.
- Use least privilege patterns where possible.
- Confirm Vercel env var scoping.

---

### 9.3 OpenAI Key

The OpenAI key should be treated as a production secret.

Rules:

- Server-side only.
- Do not log raw prompts containing sensitive customer info unless intentionally preserved.
- Avoid sending unnecessary private data.
- Consider future retention/privacy rules.
- Consider cost controls before high-volume automation.

---

### 9.4 Email Credentials Later

Live email integration will require careful credential handling.

Future decisions:

- OAuth vs app password vs provider-specific token.
- Per-user mailbox vs shared mailbox.
- Read-only vs send permission.
- Sync frequency.
- Token refresh.
- Revocation handling.
- Failed sync logging.
- Import review queue.

Recommendation:

Start with the least powerful permission that accomplishes the V1 goal.

---

### 9.5 RingCentral Credentials Later

RingCentral will require:

- API app credentials
- User/extension mapping
- Webhook or polling strategy
- Token refresh strategy
- Recording/transcript permission review
- Storage/privacy rules

Recommendation:

Do not connect RingCentral until Work Log, concurrency, and identity direction are stronger.

---

### 9.6 Security Concerns

Current security concerns to respect:

- Acting User is not real authorization.
- Service role key must stay server-only.
- Production data should not be exposed in logs.
- Uploaded files may contain sensitive business information.
- Live email/call data will increase privacy risk.
- Public deployment should not expose internal tools to unauthorized users.
- Future SaaS will require much stronger tenant isolation.

---

### 9.7 Backups and Migrations

Before more risky builds:

- Confirm Supabase backups are enabled.
- Keep SQL migrations versioned.
- Save migration files in repo.
- Test schema changes on a copy when possible.
- Avoid manual undocumented production schema edits.
- Back up before destructive changes.
- Keep a human-readable migration/change log.

For Work Log V1:

- Migration should be explicit and committed.
- Table should be append-only by design.
- Consider RLS and write restrictions carefully.
- Avoid allowing normal users to edit/delete Work Log rows.

---

## 10. Multi-User Readiness Assessment

### 10.1 Charles Only

Readiness: High

Sell It is currently strongest for Charles-only use.

Why:

- One main user reduces concurrency risk.
- Acting User risk is lower.
- Notification confusion is easier to manage.
- Manual review flows are sufficient.
- Current CRM and Assistant features are useful now.

Main remaining risk:

- Permanent history is still incomplete without Work Log.

Assessment:

Charles-only usage is safe enough for continued internal development and real use.

---

### 10.2 Charles + Trent + Angel

Readiness: Medium

Sell It can support this group for controlled internal use, but expectations must be clear.

Strengths:

- Team members exist.
- Task assignment exists.
- Notifications exist.
- Acting User supports internal simulation.
- Planner can filter assignments.

Risks:

- Acting User is temporary.
- Real auth/permissions are not finished.
- Concurrency is not enforced.
- Work Log is not built.
- Multiple users can create conflicting edits.
- Assignment and notification semantics need careful handling.

Assessment:

Usable for careful internal team use, but Work Log and concurrency should be built before relying on it heavily every day.

---

### 10.3 10 Users

Readiness: Low

Sell It is not ready for 10 active users yet.

Reasons:

- Real auth and permissions are not mature enough.
- Acting User does not scale safely.
- Concurrency enforcement is missing.
- Work Log is missing.
- Notification volume and semantics may become harder to control.
- Merge/archive/delete risk increases.

Assessment:

Do not expand to 10 users until Work Log, concurrency protection, and real user/permission foundations are in place.

---

### 10.4 Future SaaS Users

Readiness: Not Ready

Sell It is not ready for SaaS users yet.

Missing foundations:

- Production-grade auth/permissions.
- Tenant isolation verification.
- Audit logging.
- Concurrency protection.
- Billing/subscription model.
- Onboarding/invite model.
- Support/admin model.
- Privacy/security policies.
- Integration credential isolation.
- Backup/restore process.
- Abuse/rate-limit controls.

Assessment:

The product direction is promising, but SaaS should wait until the internal version is stable with real multi-user foundations.

---

## 11. Final Recommendation

The next real build should be:

# Work Log V1

Reason:

Work Log V1 is the safest and most foundational next build.

It reduces risk across almost every future direction:

- Multi-user use
- Notifications
- Merge/archive/delete
- Acting User transition
- Real auth/permissions
- Live email
- RingCentral
- Social tracking
- Assistant actions
- Deployment confidence
- Debugging and support

The recommended next build sequence is:

1. Work Log V1
2. Concurrency Protection V1
3. Permissions / Real User Auth V1
4. Live Email Integration V1
5. RingCentral Integration V1
6. Social / Bitly Tracking V1

The key architectural principle is:

> Build the truth layer before building more automation.

Sell It is becoming more powerful. The next safest step is not another integration. The next safest step is permanent, trustworthy, immutable system memory.

---

## 12. Review-Only Confirmation

This document is review/design only.

No features were built.

No database tables were modified.

No app logic was changed.

No UI was changed.

No integrations were added.

No production behavior was changed.
