# Concurrency Safeguards Design V1

## Status

Design only.

Do not build database tables yet.
Do not modify existing save behavior yet.
Do not add locking yet.
Do not add realtime updates yet.

## Purpose

Sell It is moving from a mostly single-user workflow into a multi-user sales operating system.

Planned users include:

- Charles
- Trent
- Angel
- Future sales users
- Future admins and managers
- Future assistant-driven workflows
- Future integrations

The purpose of this design is to define how Sell It should safely handle multiple users working at the same time without silently overwriting each other's work.

This document is planning only. It does not implement the safeguards.

## Core Principle

Sell It should protect business data from accidental overwrites.

The app should assume that two people may open the same record at the same time, make different decisions, and attempt to save.

The app should not silently allow one user's older copy to overwrite another user's newer work.

## Relationship To Other Systems

### Notification Center

Notification Center is an attention feed.

It answers:

- What needs my attention?
- What changed that I probably do not know about?
- What should I act on?

Concurrency safeguards should not turn Notification Center into a permanent history system.

### Work Log

Work Log is permanent history.

It answers:

- What happened?
- Who did it?
- When did it happen?
- What changed?
- Was a save rejected because the record was stale?

Concurrency safeguards should eventually feed successful saves and rejected conflicts into Work Log, but Work Log is not being built in this phase.

---

# 1. Concurrent Editing Risks

## Overview

Concurrent editing happens when multiple users view or edit the same record before seeing each other's latest changes.

This will matter more as Charles, Trent, Angel, and future sales users work in Sell It at the same time.

## Two Users Edit Same Company

Scenario:

1. Charles opens company "ABC Trucking."
2. Trent opens the same company.
3. Charles changes lead temperature from Warm to Hot.
4. Trent changes operating regions from Idaho to Idaho/Washington.
5. Trent saves after Charles.
6. Trent's stale form may still contain Warm and accidentally overwrite Hot.

What can go wrong:

- Lead temperature regresses.
- Sales priority becomes wrong.
- Assistant recommendations become wrong.
- Work history becomes confusing.
- Team trust decreases.

## Two Users Edit Same Contact

Scenario:

1. Angel opens a contact.
2. Charles opens the same contact.
3. Angel updates the contact's email.
4. Charles updates the phone number from an old copy.
5. Charles saves after Angel.

What can go wrong:

- Email address reverts to the old value.
- Future Email Intelligence may link to the wrong contact.
- Follow-up can go to the wrong person.
- Contact records become unreliable.

## Two Users Edit Same Opportunity

Scenario:

1. Charles moves an opportunity from Discovery to Demo Scheduled.
2. Trent updates estimated monthly value.
3. Trent saves a stale form that still says Discovery.

What can go wrong:

- Opportunity stage regresses.
- Pipeline reporting becomes inaccurate.
- Stage history becomes confusing.
- Assistant recommends the wrong next step.
- Forecasting becomes unreliable.

## Two Users Edit Same Task

Scenario:

1. Charles assigns a task to Trent.
2. Angel opens the same task before refreshing.
3. Angel assigns the task to herself.
4. Angel saves after Charles.

What can go wrong:

- Task owner becomes unclear.
- Trent may get a notification and then lose the task.
- Angel may think she owns the task.
- Team Workload becomes inaccurate.
- Follow-up responsibility becomes unclear.

## Two Users Edit Same Note

Scenario:

1. Charles opens a note.
2. Trent opens the same note.
3. Charles adds new details from a phone call.
4. Trent edits grammar in a stale copy and saves later.

What can go wrong:

- Charles's new details disappear.
- Notes become unsafe for important business memory.
- Users stop trusting Sell It for long-form notes.

## General Failure Types

Common concurrency failures include:

- Lost updates
- Field regressions
- Incorrect assignments
- Incorrect opportunity stages
- Duplicate tasks
- Wrong contact/company links
- Merge actions based on stale data
- Archive/delete actions against outdated records
- Confusing Notification Center behavior
- Incomplete Work Log history later
- Broken confidence in the CRM

---

# 2. Optimistic Concurrency

## Recommended Model

Sell It should use optimistic concurrency.

Optimistic concurrency means:

- Records are not locked when opened.
- Users can open and edit normally.
- On save, the app checks whether the record changed since the user loaded it.
- If the record changed, the save is rejected or routed to conflict resolution.

This fits Sell It better than hard locking because the first team is small and needs speed.

## updated_at Checks

Most Sell It records already have an updated_at style field.

When an edit page loads, the app should remember the record's current updated_at value.

Example:

    loaded_updated_at = 2026-06-22 10:15:00

When the user clicks Save, the update should only succeed if the database row still has that same updated_at.

Conceptual save rule:

    update companies
    set changed fields...
    where id = company_id
      and updated_at = loaded_updated_at

If zero rows are updated, the app knows the record changed while the user was editing.

## Version Checks

A stronger future option is a row version number.

Example:

    row_version = 7

When saving:

    update companies
    set changed fields...,
        row_version = row_version + 1
    where id = company_id
      and row_version = 7

If zero rows are updated, the record is stale.

## updated_at vs row_version

updated_at advantages:

- Likely already exists.
- Easy V1 starting point.
- No database schema change if fields are reliable.
- Simple to explain to users and developers.

updated_at risks:

- Must be updated consistently on every meaningful save.
- Timestamp precision must be reliable.
- Server/database time should be used, not browser time.

row_version advantages:

- Explicit conflict token.
- Easier to reason about.
- Avoids timestamp precision concerns.
- Better long-term collaboration model.

row_version risks:

- Requires database changes.
- Must be incremented on every meaningful save.
- More setup work.

## Recommended Path

V1 should start with updated_at validation where reliable.

Later versions can add row_version if updated_at is not enough.

## Example: User A Opens Company, User B Edits Company, User A Saves Old Copy

Scenario:

1. Charles opens ABC Trucking at 10:00.
2. Record has updated_at = 10:00.
3. Trent opens ABC Trucking at 10:01.
4. Trent changes lead temperature to Hot at 10:05.
5. Database row now has updated_at = 10:05.
6. Charles changes notes at 10:10 and clicks Save.
7. Charles's form still has loaded_updated_at = 10:00.

Expected behavior:

- Charles's save should be rejected.
- The app should show: "This company changed while you were editing."
- Charles should be offered clear options:
  - Reload latest record
  - Compare changes later
  - Copy my unsaved changes
  - Overwrite only if allowed by future role/policy

Default behavior should never silently overwrite Trent's newer work.

## Save Outcomes

### Save Allowed

No one changed the record since the user loaded it.

Action:

- Save normally.
- Update updated_at or row_version.
- Future Work Log records successful save.

### Save Rejected Due To Stale Record

Someone changed the record since the user loaded it.

Action:

- Do not save stale form.
- Show conflict message.
- Future Work Log records rejected stale save.

### Save Needs Compare

The changed fields do not overlap.

Example:

- Trent changed phone.
- Charles changed notes.

Future option:

- Let the app merge non-conflicting fields after a compare screen.

### Save Requires Human Decision

The same field was changed by both users.

Example:

- Trent changed lead temperature to Hot.
- Charles changed lead temperature to Cold from an old copy.

Action:

- Require user decision.
- Show original value, current value, and user's attempted value.

---

# 3. Merge Protection

## Why Merge Needs Extra Protection

Merge Manager is high-risk because it can move relationships and archive/delete duplicates.

A stale merge can damage more data than a normal edit.

Example:

1. Charles opens merge review for two duplicate companies.
2. Trent edits one of those companies.
3. Angel adds a new task to the duplicate company.
4. Charles completes the old merge review.
5. New changes may be moved incorrectly or missed.

## Fresh Record Verification Before Merge

Before final merge confirmation, the app should re-fetch:

- Surviving record
- Duplicate record
- Related contacts
- Related tasks
- Related opportunities
- Related activities
- Related notes
- Related pain points
- Related attachments
- Archive/delete status
- updated_at or row_version values

## Required Merge Checks

Before final merge write:

- Survivor still exists.
- Duplicate still exists.
- Neither record was archived by another user.
- Neither record was deleted by another user.
- updated_at or row_version still matches what the review screen showed.
- Relationship counts have not changed unexpectedly.
- Survivor/duplicate selection was not reversed.
- User still has permission in future permissions system.

## If Merge Review Is Stale

Show:

    This merge review is out of date.

    One or more records changed since you opened this review.
    Reload the merge review before completing the merge.

Options:

- Reload Merge Review
- Cancel
- View changed records

V1 rule:

- Do not complete stale merges.
- No overwrite option for stale merge reviews.

## Archive Action Protection

Before archive:

- Re-fetch the record.
- Verify it still exists.
- Verify it is not already archived.
- Verify updated_at or row_version has not changed since the archive confirmation page loaded.

If stale, show:

    This record changed before it could be archived.
    Reload before archiving.

## Delete Action Protection

Before delete:

- Re-fetch the record.
- Verify it still exists.
- Verify it is not already deleted.
- Verify it is not already archived if archive state matters.
- Verify updated_at or row_version.
- Capture pre-delete snapshot for future Work Log.
- Confirm user still has permission in future permissions system.

If stale, show:

    This record changed before it could be deleted.
    Reload before deleting.

## Destructive Action Rule

For merge, archive, and delete:

- Never trust the review screen alone.
- Always verify fresh database state immediately before final write.
- Block stale destructive actions by default.
- Do not allow casual overwrite.

---

# 4. Opportunity Stage Changes

## Risk

Opportunity stage is business-critical.

Example:

1. Charles moves opportunity from Contact Made to Demo Scheduled.
2. Trent moves same opportunity from Contact Made to Lost.
3. Both actions are based on the old stage.
4. The later save wins.

What can go wrong:

- Wrong final stage.
- Confusing stage history.
- Wrong forecast.
- Wrong follow-up.
- Wrong Assistant recommendations.
- Wrong team understanding of where the deal stands.

## Stage Change Protection

Stage changes should validate:

- Opportunity ID
- Current stage the user saw
- Current updated_at or row_version
- User's intended new stage

Conceptual rule:

    Only change stage from Contact Made to Demo Scheduled
    if current database stage is still Contact Made
    and updated_at or row_version still matches.

## If Stage Changed While User Was Acting

Show:

    This opportunity stage changed while you were working.

    Current stage: Lost
    Your attempted change: Demo Scheduled
    Stage when you opened it: Contact Made

Options:

- Keep current stage
- Reload opportunity
- Compare stage history
- Apply my stage only if future role/policy allows it

## Stage History Interaction

Existing Opportunity Stage History should continue to log successful stage changes.

Future Work Log should also record:

- Successful stage changes
- Rejected stale stage changes
- Actor
- Acting User context
- Previous stage user saw
- Current database stage
- Attempted stage
- Source feature

---

# 5. Task Assignment Conflicts

## Risk

Task assignment affects responsibility and workload.

Example:

1. Charles opens task.
2. Angel opens same task.
3. Charles assigns it to Trent.
4. Angel assigns it to herself from stale copy.
5. Angel saves after Charles.

What can go wrong:

- Trent may get an assignment notification but no longer own the task.
- Angel thinks she owns the task.
- Charles thinks Trent owns it.
- Team Workload becomes misleading.
- Follow-up responsibility becomes unclear.

## Assignment Protection

Task assignment updates should check:

- Task ID
- Previous assignee the user saw
- Current updated_at or row_version
- Current status

Assignment should only save if the database assignee is still what the user saw.

## Assignment Conflict Message

Show:

    This task assignment changed while you were editing.

    Current assignee: Trent
    Your attempted assignee: Angel
    Assignee when you opened it: Unassigned

Options:

- Keep current assignment
- Reload task
- Apply my assignment only if allowed later

## Notification Interaction For Assignment Conflicts

For successful assignment changes:

- Notification Center may show attention alerts to affected users based on existing notification rules.

For rejected assignment changes:

- Do not create assignment notifications.
- Show inline conflict message to the user trying to save.
- Future Work Log can record rejected conflict.

## Acting User Compatibility

If Charles is logged in but acting as Trent:

- Real logged-in user: Charles
- Acting user: Trent
- Effective actor: Trent
- Assignment target: selected assignee

Future Work Log should preserve all of this.

---

# 6. Realtime Awareness

## Status

Future idea only.

Do not build realtime in this phase.

## Goals

Realtime awareness should help users avoid conflicts before save.

Examples:

- Record changed while viewing.
- Someone else is editing.
- Live read-only updates.
- Reload prompt when another user saves.

## Record Changed While Viewing

If another user updates a record while Charles is viewing it, the UI could show:

    This record was updated by Trent at 10:42 AM.
    Reload to view latest changes.

This should not force refresh automatically if the user is typing.

## Someone Else Is Editing

Future edit sessions could show:

    Angel is editing this opportunity.

This should be awareness, not hard blocking at first.

## Live Updates

Future live updates could update read-only detail pages automatically.

For edit forms:

- Do not overwrite text fields while user is typing.
- Show banner instead.
- Let user reload or compare.

## Possible Future Technical Approaches

Future ideas only:

- Supabase Realtime subscriptions
- Presence channels
- edit_sessions table
- record-specific subscriptions
- updated_at polling fallback
- live detail page refresh
- conflict banner component

No implementation now.

---

# 7. Notification Interaction

## Core Rule

Notification Center remains an attention feed.

Concurrency safeguards should not expand Notification Center into a Work Log.

## Record Changes While Open

If a user is viewing a record and another user changes it:

V1:

- Show inline page banner only.
- No Notification Center item by default.

Future:

- Notification only if the change requires attention.
- Example: task reassigned to the logged-in user.

## Save Rejected Due To Conflict

If save is rejected:

- Show inline conflict message immediately.
- Do not rely on Notification Center.
- Do not create self-conflict notification spam.

Message:

    Save blocked. This record changed while you were editing.
    Reload or compare changes.

## Conflict Between Two Other Users

Usually no Notification Center item.

Exception:

- The final successful change affects the logged-in user.
- Example: task assigned to Charles.

## Merge/Archive/Delete Conflicts

If destructive action is rejected:

- Show inline page message.
- No Notification Center item unless another user's successful action affects the logged-in user.

---

# 8. Work Log Interaction

## Status

Work Log is design-only right now.

Do not build Work Log in this phase.

## Successful Saves

Future Work Log should record:

- Successful company update
- Successful contact update
- Successful opportunity update
- Successful task update
- Successful note update
- Successful assignment change
- Successful stage change
- Successful merge
- Successful archive/delete
- Successful Email Intelligence save

Each entry should include:

- Actor
- Acting User context
- Record type
- Record ID
- Changed fields
- Old values
- New values
- Source feature
- Timestamp

## Rejected Saves

Rejected stale saves may also be logged later.

Possible future event names:

- company.update_rejected_stale
- contact.update_rejected_stale
- opportunity.update_rejected_stale
- opportunity.stage_change_rejected_stale
- task.update_rejected_stale
- task.assignment_rejected_stale
- note.update_rejected_stale
- merge.rejected_stale
- archive.rejected_stale
- delete.rejected_stale

## Why Log Rejections

Benefits:

- Debugging
- User support
- Understanding collaboration friction
- Security review
- Proving why a save did not happen
- Improving future UX

## Future Rejected Conflict Data

Future Work Log conflict entries should include:

- Actor
- Acting User context
- Record type
- Record ID
- Record display name
- loaded_updated_at or loaded_version
- current_updated_at or current_version
- attempted changed fields
- current database values for conflicting fields
- source page/action
- rejection reason

## Avoid Raw Payload Exposure

Work Log should not expose full raw form payloads to normal users.

Admin-only technical details can be considered later.

---

# 9. Database Proposal

## Status

Design only.

Do not create tables or columns yet.

## Option A: Use updated_at Validation

Use existing updated_at fields as concurrency tokens.

Requirements:

- Every meaningful update must change updated_at.
- Database or server should control timestamp.
- Update queries must include previous updated_at.
- If affected row count is zero, treat it as conflict.

Conceptual update:

    update companies
    set name = new_name,
        updated_at = now()
    where id = company_id
      and updated_at = loaded_updated_at

## Option B: Add row_version Columns

Add integer row_version columns to important tables.

Possible column:

    row_version integer not null default 1

On every update:

    row_version = row_version + 1

Save only if loaded version matches.

Recommended future tables:

- companies
- contacts
- opportunities
- tasks
- activities
- notes
- pain_points
- communities
- posts

## Option C: Conflict Table

Possible future table:

    concurrency_conflicts

Possible columns:

- id
- workspace_id
- record_type
- record_id
- actor_user_id
- acting_user_id
- source_feature
- loaded_updated_at
- current_updated_at
- loaded_version
- current_version
- attempted_changes_json
- current_values_json
- status
- created_at
- resolved_at
- resolved_by

This is not required for V1.

Work Log may eventually make a separate conflict table unnecessary.

## Option D: Edit Sessions

Possible future table:

    edit_sessions

Purpose:

- Track who is currently editing a record.
- Show "Angel is editing this task."
- Expire stale sessions automatically.

Possible columns:

- id
- workspace_id
- record_type
- record_id
- user_id
- acting_user_id
- display_name
- started_at
- last_seen_at
- expires_at

This is awareness, not locking.

## Option E: Hard Locks

Hard locks prevent other users from editing while someone has a record open.

Not recommended for early Sell It.

Reasons:

- Too much friction.
- Browser tabs get abandoned.
- Locks can get stuck.
- Small team workflows need flexibility.

Use optimistic concurrency first.

---

# 10. UI Proposal

## Conflict Banner

When a stale save is detected:

    This record changed while you were editing.

    Your changes were not saved because another user updated this record first.

Buttons:

- Reload latest
- Compare changes
- Copy my changes
- Cancel

## Simple V1 Conflict Screen

V1 should be simple.

Example:

    This company changed while you were editing.

    Latest update: Trent at 10:42 AM

    Your changes were not saved.

    Please reload the latest version, review it, and apply your changes again.

Buttons:

- Reload Company
- Back to Companies

## V2 User Conflict Warning

If realtime or polling detects a change before save:

    This record was updated by Angel while you were viewing it.
    Reload before saving to avoid overwriting changes.

Buttons:

- Reload
- Keep editing

## V3 Compare Changes

Compare screen should show:

- Field
- When you opened
- Current database value
- Your attempted value

Example:

    Field: Lead Temperature
    When You Opened: Warm
    Current Value: Hot
    Your Change: Cold

Options:

- Keep current database value
- Use my value
- Cancel
- Save selected changes

## Overwrite Option

Overwrite should not be default.

If allowed later, it should require elevated permission or clear confirmation.

Better label:

    Apply my changes over the current record

Avoid casual "Overwrite" buttons.

## Merge Conflict UI

For stale merge review:

    This merge review is out of date.

    The survivor or duplicate record changed after this review was loaded.
    Reload the merge review before completing the merge.

Buttons:

- Reload Merge Review
- Cancel Merge

No overwrite option for stale merge V1.

## Archive/Delete Conflict UI

    This record changed before it could be archived.

    Reload the record before continuing.

Buttons:

- Reload
- Cancel

No overwrite option for destructive actions V1.

## Task Assignment Conflict UI

    This task assignment changed while you were editing.

    Current assignee: Trent
    Your attempted assignee: Angel

Buttons:

- Keep Current Assignment
- Reload Task
- Apply My Assignment if allowed later

## Opportunity Stage Conflict UI

    This opportunity stage changed while you were working.

    Current stage: Lost
    Your attempted stage: Demo Scheduled
    Stage when opened: Contact Made

Buttons:

- Keep Current Stage
- Reload Opportunity
- Apply My Stage if allowed later

---

# 11. Implementation Phases

## V1: updated_at Validation

Goal:

Prevent silent stale overwrites.

Scope:

- Companies
- Contacts
- Opportunities
- Tasks
- Notes
- High-risk actions first

Behavior:

- Store loaded updated_at on edit pages.
- On save, update only if updated_at matches.
- If update fails due to stale data, show simple conflict message.

Do not add compare UI yet.

## V2: User Conflict Warnings

Goal:

Warn users earlier.

Possible features:

- "Record changed since you opened it."
- Lightweight polling on edit pages.
- Last updated by display if available.
- Save disabled until reload for destructive actions.

No realtime required yet.

## V3: Compare Changes

Goal:

Let users safely resolve conflicts.

Features:

- Field-by-field comparison.
- Show original value, current value, user's attempted value.
- Allow selected field merge.
- Preserve unsaved text.

## V4: Realtime Awareness

Goal:

Improve collaboration.

Features:

- Supabase Realtime record change banners.
- Presence indicators.
- "Trent is viewing/editing this record."
- Live updates on read-only pages.
- No automatic overwrite of edit forms.

## V5: Advanced Collaboration

Goal:

Support larger teams.

Features:

- Edit sessions
- Optional soft locks for sensitive records
- Admin conflict dashboards
- Work Log conflict analytics
- Advanced permission-aware overwrite rules
- Export conflict reports

---

# 12. Risks And Open Questions

## Risks

### Too Much Friction

If conflict checks are too strict, users may get annoyed.

Mitigation:

- Start with high-risk pages/actions.
- Use clear messages.
- Keep reload flow simple.

### False Conflicts

updated_at may change because of harmless background updates.

Mitigation:

- Only update updated_at on meaningful changes.
- Later use field-level compare.

### Incomplete Coverage

If only some pages use concurrency checks, stale overwrites can still happen elsewhere.

Mitigation:

- Centralize save helpers later.
- Roll out by record type.

### Merge Complexity

Merge actions touch many related records.

Mitigation:

- Require fresh verification before final merge.
- Avoid stale merge completion entirely.

### Notification Confusion

Rejected saves should not flood Notification Center.

Mitigation:

- Inline conflict messages.
- Work Log for permanent history later.

### Acting User Ambiguity

If real user and acting user are not tracked clearly, conflict audit can become confusing.

Mitigation:

- Future Work Log should store both real actor and acting user.

## Open Questions

1. Should V1 protect all edit pages or only high-risk pages first?
2. Should updated_at validation be enough, or should row_version be added early?
3. Should users ever be allowed to overwrite a newer record?
4. Which roles should be allowed to overwrite conflicts?
5. Should task assignment conflicts have a faster resolution flow than other conflicts?
6. Should opportunity stage changes require stricter protection than normal opportunity edits?
7. Should notes use special protection because long text is easy to lose?
8. Should edit sessions be added before realtime?
9. Should conflict events be written to Work Log once Work Log exists?
10. Should stale destructive actions always be blocked with no override?
11. Should future Assistant actions use the same concurrency checks as humans?
12. Should imports and Email Intelligence saves use concurrency protection when linking to existing records?

---

# Recommended Future Build Order

1. Approve this design document.
2. Audit existing edit/save pages for updated_at availability.
3. Add loaded_updated_at hidden state to high-risk edit pages.
4. Add updated_at validation to company edits.
5. Add updated_at validation to contact edits.
6. Add updated_at validation to task edits.
7. Add specific task assignment conflict message.
8. Add updated_at/stage validation to opportunity stage changes.
9. Add merge fresh verification before final merge.
10. Add archive/delete fresh verification.
11. Add simple conflict UI component.
12. Later add compare changes.
13. Later add realtime awareness.
14. Later connect successful/rejected conflict events to Work Log.

# Final Summary

Sell It should use optimistic concurrency.

The first goal is simple:

    Do not silently overwrite another user's newer work.

The recommended first implementation is updated_at validation with simple stale-record rejection.

Later versions can add:

- row version numbers
- compare changes
- realtime awareness
- edit sessions
- Work Log conflict history
- advanced collaboration controls

Notification Center should remain an attention feed.

Work Log should eventually become the permanent history system.

Concurrency Safeguards should sit underneath both, protecting the integrity of the data before notifications or history are created.
