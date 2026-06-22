# Work Log Design V1

## Status

Design only.

Do not build database tables yet.

## Purpose

The Work Log is Sell It's permanent immutable audit and history system.

It is separate from the Notification Center.

Notification Center is an attention feed. It should only show items the logged-in user likely needs to notice.

Work Log is permanent history. It should record what happened, who did it, when it happened, what record was affected, and enough before/after detail to reconstruct the business timeline later.

## Core Distinction

### Notification Center

Purpose:

- Bring attention to something the user may not know.
- Short-lived.
- User-facing attention model.
- Can be dismissed, read, ignored, or filtered.
- Should not become a full history table.

Examples:

- Trent assigns Charles a task.
- A task assigned to Charles is overdue.
- A major item needs Charles's attention.

### Work Log

Purpose:

- Permanent business history.
- Immutable audit trail.
- Record-level timeline.
- Compliance/debugging/source-of-truth history.
- Searchable and exportable.

Examples:

- Charles created a company.
- Trent edited a task.
- Angel archived a contact.
- AI Capture created an activity.
- Email Intelligence created a task from a pasted email.
- Two duplicate companies were merged.
- A contact was reassigned from one company to another.

## Design Principles

1. Work Log is append-only.
2. Work Log entries should never be edited by normal app flows.
3. Work Log entries should never be deleted by normal app flows.
4. Work Log is not an attention system.
5. Notification Center can use Work Log as a future source, but should not be the same thing.
6. Every meaningful business change should be traceable.
7. Actor tracking must support the real logged-in user and the current Acting User model.
8. AI-created actions must be labeled clearly as AI-assisted or AI-originated.
9. Manual user edits must remain distinguishable from automated or assistant-created edits.
10. Work Log should be readable by humans without needing to inspect raw JSON.

## Events That Should Be Logged

### Record Creation

Log when a user, assistant, import, or intelligence feature creates:

- Company
- Contact
- Opportunity
- Task
- Activity
- Note
- Pain Point
- Community
- Post
- Attachment
- Team Member
- Future RingCentral call record
- Future voicemail record
- Future transcript record
- Future email sync record

Example event names:

- company.created
- contact.created
- opportunity.created
- task.created
- activity.created
- note.created
- pain_point.created
- attachment.created

### Record Updates

Log meaningful field changes.

Examples:

- Company name changed.
- Company lead temperature changed.
- Company operating region changed.
- Contact email changed.
- Contact company link changed.
- Opportunity stage changed.
- Opportunity estimated value changed.
- Task status changed.
- Task due date changed.
- Task priority changed.
- Activity summary changed.
- Note content changed.
- Attachment description changed.

Example event names:

- company.updated
- contact.updated
- opportunity.updated
- task.updated
- activity.updated
- note.updated

### Record Relationships

Log relationship changes.

Examples:

- Contact linked to company.
- Contact removed from company.
- Task linked to opportunity.
- Activity linked to task.
- Pain point linked to company.
- Pain point linked to contact.
- Attachment linked to activity.

Example event names:

- relationship.linked
- relationship.unlinked
- pain_point.linked
- attachment.linked

### Assignment History

Log all assignment changes.

Examples:

- Task assigned to Charles.
- Task reassigned from Charles to Trent.
- Task unassigned.
- Opportunity owner assigned.
- Future lead owner assigned.
- Acting User created assignment while logged in as another real user.

Example event names:

- task.assigned
- task.reassigned
- task.unassigned
- opportunity.assigned
- opportunity.reassigned

### Status and Stage History

Log every meaningful status/stage transition.

Examples:

- Opportunity stage moved from New Lead to Contact Made.
- Task moved from Open to Completed.
- Task moved from Completed back to Open.
- Lead temperature moved from Warm to Hot.
- Opportunity paused.
- Opportunity lost.

Example event names:

- opportunity.stage_changed
- opportunity.lead_temperature_changed
- task.status_changed
- task.priority_changed

### Archive and Delete History

Log archive/delete events before the record is hidden, archived, or removed.

Examples:

- Company archived.
- Contact archived.
- Task cancelled.
- Note deleted.
- Duplicate company deleted after merge.
- Activity deleted.

Example event names:

- company.archived
- contact.archived
- task.archived
- note.deleted
- activity.deleted

Important:

If hard delete is ever allowed, the Work Log must preserve enough identifying information to understand what was deleted.

### Merge History

Log merge operations as first-class events.

Examples:

- Duplicate company merged into surviving company.
- Duplicate contact merged into surviving contact.
- Tasks moved from duplicate record to survivor.
- Activities moved from duplicate record to survivor.
- Notes moved from duplicate record to survivor.
- Duplicate archived or deleted after merge.

Example event names:

- company.merge_started
- company.merge_completed
- contact.merge_started
- contact.merge_completed
- merge.relationships_moved
- merge.duplicate_archived
- merge.duplicate_deleted

Merge log should include:

- Surviving record ID
- Duplicate record ID
- Surviving record display name
- Duplicate record display name
- Counts of moved tasks, activities, notes, opportunities, attachments, and pain points
- Actor
- Timestamp
- Whether merge was manual, assistant-suggested, or automated

### Email Intelligence History

Log every save action from Email Intelligence.

Examples:

- Manual email analyzed.
- Reviewed email saved.
- Contact created from email.
- Activity created from email.
- Task created from email.
- Company skipped because unknown.
- Opportunity skipped because company was missing.
- Attachment preserved from upload.
- Raw email preserved in activity raw notes.

Example event names:

- email_intelligence.analyzed
- email_intelligence.saved
- email_intelligence.contact_created
- email_intelligence.activity_created
- email_intelligence.task_created
- email_intelligence.company_skipped
- email_intelligence.opportunity_skipped
- email_intelligence.attachment_saved

Do not store full raw email body in Work Log by default if the Activity already preserves it.

Instead store:

- Source type
- Mailbox
- From
- To
- Subject
- Activity ID
- Contact ID
- Company ID if available
- Opportunity ID if available
- Task ID if available
- Attachment count
- Human-readable summary

### Future RingCentral History

When RingCentral is added later, Work Log should record call lifecycle events.

Examples:

- Incoming call received.
- Outgoing call placed.
- Missed call.
- Voicemail received.
- Call recording attached.
- Transcript attached.
- AI summary created.
- Follow-up task created from call.
- Activity created from call.

Example event names:

- ringcentral.call_incoming
- ringcentral.call_outgoing
- ringcentral.call_missed
- ringcentral.voicemail_received
- ringcentral.recording_saved
- ringcentral.transcript_saved
- ringcentral.summary_created
- ringcentral.task_created
- ringcentral.activity_created

## Actor User Tracking

Every Work Log entry should identify who caused the action.

Required actor fields:

- actor_user_id
- actor_display_name
- actor_email if available
- actor_type
- acting_user_id
- acting_user_display_name
- effective_actor_display_name

Actor type examples:

- real_user
- acting_user
- assistant
- ai_capture
- email_intelligence
- import
- system
- future_integration

## Acting User Compatibility

Sell It currently supports Acting User V1.

The Work Log must preserve both:

1. The real authenticated/logged-in user.
2. The selected acting user/effective user.

Example:

Charles is logged in but Acting As Trent. Charles creates a task assigned to Angel.

Work Log should store:

- real_actor_user_id: Charles profile ID
- real_actor_display_name: Charles
- acting_user_id: Trent team member/profile ID
- acting_user_display_name: Trent
- effective_actor_display_name: Trent
- actor_context_note: "Charles acting as Trent"

This allows future permissions and audit review to answer:

- Who was actually logged in?
- Who was the user acting as?
- Who should the business history show as the actor?
- Was this manual, assistant-driven, or automated?

## Record-Level History

Every major record detail page should eventually have a History or Work Log tab/card.

Record-level history should show:

- Created events
- Edited fields
- Assignment changes
- Relationship changes
- Attachments added
- Notes added
- Activities added
- Archive/delete events
- Merge events
- AI/intelligence events

Display format:

- Timestamp
- Actor
- Event label
- Human-readable summary
- Before/after values when applicable
- Source feature

Example:

Charles changed task status from Open to Completed.
June 21, 2026, 4:15 PM
Source: Task Detail

## Company History

Company history should include:

- Company created
- Company edited
- Lead temperature changed
- Operating regions changed
- Assets/equipment changed
- Contacts linked/unlinked
- Opportunities created/linked
- Tasks linked
- Activities linked
- Notes linked
- Pain points linked
- Attachments linked
- Merge events
- Archive/delete events
- Email Intelligence events related to the company
- Future RingCentral events related to the company

## Contact History

Contact history should include:

- Contact created
- Contact edited
- Email/phone/title changed
- Company link changed
- Tasks assigned/linked
- Activities linked
- Notes linked
- Pain points linked
- Attachments linked
- Merge events
- Archive/delete events
- Email Intelligence events related to the contact
- Future RingCentral events related to the contact

## Opportunity History

Opportunity history should include:

- Opportunity created
- Stage changed
- Lead temperature changed
- Estimated value changed
- Expected close date changed
- Primary contact changed
- Company changed if ever allowed
- Next step changed
- Tasks linked
- Activities linked
- Notes linked
- Attachments linked
- Pain points linked
- Opportunity paused/lost/customer transitions
- Merge-related relationship moves
- Archive/delete events

Existing Opportunity Stage History V1 can remain, but Work Log should eventually become the broader permanent history layer.

## Task History

Task history should include:

- Task created
- Title changed
- Description changed
- Status changed
- Priority changed
- Due date changed
- Assignment changed
- Company/contact/opportunity link changed
- Task completed
- Task reopened
- Task archived/deleted/cancelled
- Assistant-created task events
- Email Intelligence-created task events
- Future RingCentral-created task events

## Assignment History

Assignment history should be especially clear.

Each assignment event should include:

- Previous assignee
- New assignee
- Actor
- Acting user context
- Record type
- Record ID
- Record display name
- Timestamp
- Source feature

Examples:

- Charles assigned task "Call Joe" to Trent.
- Trent reassigned task "Call Joe" from Trent to Angel.
- Assistant scheduled task "Follow up" and assigned it to Charles.
- Email Intelligence created task "Call back Joe" and assigned it to Charles.

## Merge History

Merge history must be preserved permanently.

A merge should not only say "merged."

It should show:

- Duplicate record
- Surviving record
- Actor
- Time
- Merge reason if available
- Records moved
- Relationships moved
- Conflicting fields
- Which values were kept
- Which values were discarded
- Whether duplicate was archived or deleted

## Archive/Delete History

Archive/delete history must be available even after a record disappears from normal lists.

For archive events:

- Record type
- Record ID
- Record display name
- Actor
- Timestamp
- Reason if entered
- Related records that remain

For delete events:

- Same as archive
- Plus pre-delete snapshot of key fields
- Whether delete was soft or hard
- Whether record can be restored

## Search and Filter Requirements

Work Log should eventually support filtering by:

- Date range
- Actor
- Acting user
- Real logged-in user
- Event type
- Record type
- Record ID
- Company
- Contact
- Opportunity
- Task
- Source feature
- AI-generated vs manual
- Assignment changes only
- Merge events only
- Archive/delete events only
- Email Intelligence events only
- RingCentral events only

Search should support:

- Record name
- Company name
- Contact name
- Email address
- Phone number
- Task title
- Opportunity name
- Activity subject
- Actor name
- Event summary text

## Retention Requirements

Default retention:

- Keep Work Log permanently.

Reason:

Sell It is a business-memory system. Historical context is part of the product value.

Future options:

- Workspace-level export
- Workspace-level archive
- Legal hold
- Admin-only purge tool if absolutely necessary
- Retention policy by paid plan if Sell It becomes SaaS

Normal users should not be able to delete Work Log entries.

## Export Requirements

Work Log should eventually export to:

- CSV
- PDF
- JSON

Export filters should match the UI filters.

Export examples:

- Export all history for one company.
- Export all task assignment changes for last month.
- Export all Email Intelligence saves.
- Export all archive/delete actions.
- Export all actions by Trent.
- Export full workspace audit log.

CSV should be practical for spreadsheets.

PDF should be human-readable for business review.

JSON should preserve structure for backup, migration, and future API use.

## Security Requirements

Access to Work Log should be permission-aware.

Potential roles:

- Owner/Admin: full workspace Work Log.
- Manager: broad team Work Log, maybe no security/admin events.
- User: records they can access.
- Read-only user: view only.
- External/client user: no Work Log unless explicitly allowed.

Security rules:

- Work Log should not expose records a user cannot otherwise access.
- Sensitive raw payloads should not be displayed by default.
- Raw AI payloads should not be displayed to normal users.
- PII should be minimized in global Work Log views.
- Full export should require admin permission.
- Delete/archive/merge history should require elevated permission.
- Integration tokens, secrets, API keys, and credentials should never be written to Work Log.

## Immutable History Requirements

Work Log should be immutable by normal app behavior.

Rules:

- Insert only.
- No update from normal UI.
- No delete from normal UI.
- Corrections should be new log entries, not edits to old entries.
- Admin repair tools, if ever built, should create a meta-log entry explaining the repair.
- Database policies should prevent normal client updates/deletes.
- Server-side service role may insert entries.
- Future background jobs may insert entries.
- Every entry should have created_at set by database default.

Recommended future fields:

- id
- workspace_id
- event_type
- event_category
- source_feature
- actor_type
- actor_user_id
- actor_display_name
- real_actor_user_id
- real_actor_display_name
- acting_user_id
- acting_user_display_name
- effective_actor_display_name
- record_type
- record_id
- record_display_name
- parent_record_type
- parent_record_id
- company_id
- contact_id
- opportunity_id
- task_id
- activity_id
- note_id
- attachment_id
- old_values_json
- new_values_json
- changed_fields_json
- summary
- metadata_json
- created_at

## Database Proposal

Design only. Do not create these tables yet.

### Primary Table: work_log_entries

Proposed columns:

- id uuid primary key default gen_random_uuid()
- workspace_id uuid not null
- event_type text not null
- event_category text not null
- source_feature text not null
- actor_type text not null
- actor_user_id uuid null
- actor_display_name text null
- real_actor_user_id uuid null
- real_actor_display_name text null
- acting_user_id uuid null
- acting_user_display_name text null
- effective_actor_display_name text null
- record_type text not null
- record_id uuid null
- record_display_name text null
- parent_record_type text null
- parent_record_id uuid null
- company_id uuid null
- contact_id uuid null
- opportunity_id uuid null
- task_id uuid null
- activity_id uuid null
- note_id uuid null
- attachment_id uuid null
- old_values_json jsonb null
- new_values_json jsonb null
- changed_fields_json jsonb null
- metadata_json jsonb null
- summary text not null
- created_at timestamptz not null default now()

### Optional Future Table: work_log_exports

Tracks export jobs.

Possible columns:

- id
- workspace_id
- requested_by
- export_type
- filters_json
- file_url
- status
- created_at
- completed_at

### Optional Future Table: work_log_retention_policies

Only needed if Sell It becomes multi-tenant SaaS with plan-based retention.

Possible columns:

- id
- workspace_id
- retention_mode
- retention_days
- legal_hold_enabled
- created_at
- updated_at

## UI Proposal

### Global Work Log Page

Route idea:

- /work-log

Top-level filters:

- Date range
- Actor
- Event type
- Record type
- Source feature
- Search box

Main list columns:

- Time
- Actor
- Event
- Record
- Summary
- Source

Clicking a row opens detail panel.

### Work Log Detail Panel

Show:

- Human summary
- Actor details
- Acting user details
- Record links
- Before/after values
- Source feature
- Related records
- Metadata when admin is allowed

Normal users should not see raw JSON by default.

Admin can have a "View technical details" expandable area later.

### Record Detail Pages

Add a History card/tab to:

- Company detail
- Contact detail
- Opportunity detail
- Task detail
- Activity detail
- Note detail
- Pain Point detail

Record history should show only entries related to that record.

### Merge Review History UI

Merge Manager should eventually show:

- Previous merges
- What was merged
- Who performed merge
- What relationships moved
- Surviving record link
- Archived/deleted duplicate link if still available

### Email Intelligence History UI

Email Intelligence could eventually show:

- Recent manual email saves
- Who saved them
- What was created
- What was skipped
- Links to activity/contact/task/company/opportunity

## Implementation Phases

### Phase 1: Design Document

Create this design document only.

No database tables.

### Phase 2: Database Foundation

Create work_log_entries table.

Add RLS policy.

Create insert-only client/server helper.

Do not wire every app page yet.

### Phase 3: Manual Logging Helper

Create a central helper function:

- createWorkLogEntry()

It should accept:

- workspace
- event type
- source feature
- actor snapshot
- record info
- summary
- before/after values
- related IDs

### Phase 4: High-Value Events First

Start with:

- Task assignment/reassignment
- Task status changes
- Opportunity stage changes
- Archive/delete
- Merge Manager actions
- Email Intelligence save actions

### Phase 5: Record Detail History Cards

Add history cards to:

- Companies
- Contacts
- Opportunities
- Tasks
- Activities

### Phase 6: Global Work Log Page

Build /work-log with filters and search.

### Phase 7: Export

Add CSV export first.

Then PDF.

Then JSON.

### Phase 8: Future Integrations

Add RingCentral and future live email sync events after those systems exist.

## Non-Goals For V1

Do not build now:

- Notification Center changes
- Push notifications
- Browser notifications
- Email notifications
- SMS notifications
- Automation engine
- Live email sync
- RingCentral integration
- Database tables
- RLS policies
- UI routes
- Export system

## Open Questions

1. Should Work Log be visible to all team members or only admins at first?
2. Should record-level history appear before the global Work Log page?
3. Should old Opportunity Stage History be migrated later or left as a specialized history table?
4. Should Email Intelligence raw email content ever be duplicated into Work Log, or only linked through Activity raw notes?
5. Should Work Log include read/view events, or only write/change events?
6. Should deletes be soft-only forever for business records?
7. Should Work Log be part of backup/export tools from the beginning?

## Recommended V1 Build Order

When building later, the best first implementation order is:

1. work_log_entries database table.
2. createWorkLogEntry helper.
3. Actor snapshot helper with Acting User compatibility.
4. Log task assignment/reassignment.
5. Log opportunity stage changes.
6. Log Email Intelligence save.
7. Log archive/delete.
8. Add record-level History card.
9. Add global Work Log page.
10. Add export.

## Final Summary

The Work Log should become Sell It's permanent business memory ledger.

It should not compete with Notification Center.

Notification Center answers:

"What needs my attention?"

Work Log answers:

"What happened?"
"Who did it?"
"When did it happen?"
"What changed?"
"Where did this record come from?"
"Can I prove or reconstruct the business timeline later?"
