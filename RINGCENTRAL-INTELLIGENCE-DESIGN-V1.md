# RINGCENTRAL INTELLIGENCE DESIGN V1

## Purpose

This document designs how Sell It will eventually handle RingCentral-based phone intelligence.

This is a planning document only.

Do not connect RingCentral yet.
Do not install SDKs yet.
Do not create API keys yet.
Do not create database tables yet.
Do not build call logging yet.

Latest confirmed clean commit before this document: `ff5b65a Add manual email intelligence capture v1`.

---

## 1. Goals

RingCentral Intelligence should eventually help Sell It capture and understand phone activity the same way Email Intelligence captures and understands email activity.

The future system should support:

- Incoming calls.
- Outgoing calls.
- Missed calls.
- Voicemails.
- Call recordings.
- Call transcripts.
- AI summaries.
- AI pain point detection.
- AI task suggestions.
- AI opportunity updates.
- Team assignment.
- Shared business phone numbers.
- Business memory enrichment.

The goal is not just call logging. The goal is to turn phone activity into organized CRM intelligence.

---

## 2. Non-Goals For This Task

Do not build:

- RingCentral integration.
- RingCentral OAuth.
- RingCentral SDK installation.
- RingCentral API keys.
- Phone calls.
- Call logging automation.
- SMS integration.
- Email integration.
- Social monitoring.
- Mobile apps.
- New database tables.
- Background jobs.
- Automated polling.
- Webhooks.

This document only designs the future RingCentral Intelligence system.

---

## 3. Expected Users

Initial users:

- Charles.
- Trent.
- Angel.

Potential future users:

- Sales reps.
- Office staff.
- Support staff.
- Dispatch or onboarding team members.

Each user may eventually have:

- Their own RingCentral user account.
- Their own direct phone number.
- Access to shared company numbers.
- Permission to view, review, and save call intelligence.

---

## 4. Phone Number Model

Sell It should support both individual phone numbers and shared business numbers.

### Individual Numbers

Examples:

- Charles direct line.
- Trent direct line.
- Angel direct line.
- Future sales rep direct lines.

Individual numbers should usually belong to one user or team member.

Possible ownership fields:

- Workspace.
- Phone account.
- RingCentral user.
- Sell It team member.
- Display name.
- Direct phone number.
- Extension.
- Active or inactive status.

### Shared Numbers

Examples:

- Main sales line.
- Office line.
- Support line.
- Future lead intake line.

Shared numbers should belong to the workspace, not one private user.

Shared numbers should support assignment to:

- Charles.
- Trent.
- Angel.
- Future team members.

Shared number permissions should answer:

- Who can see calls to this number?
- Who can listen to recordings?
- Who can read transcripts?
- Who can assign missed calls?
- Who can mark calls handled?
- Who can create tasks from shared calls?
- Who can see private direct-line calls?

Suggested phone number status values:

- active.
- inactive.
- paused.
- disconnected.
- error.

Suggested number type values:

- individual.
- shared.
- main_line.
- sales_line.
- office_line.
- support_line.

---

## 5. Incoming Call Workflow

Future incoming call flow:

1. RingCentral receives incoming call.
2. Sell It identifies the called number.
3. Sell It identifies whether the number is individual or shared.
4. Sell It captures caller number.
5. Sell It attempts to match caller number to an existing contact.
6. If contact is found, Sell It links the call to the contact.
7. If contact has company, Sell It links the call to the company.
8. If contact/company has active opportunities, Sell It suggests related opportunity links.
9. Sell It creates or stages an Activity of type Call.
10. If recording exists, Sell It links recording.
11. If transcript exists, Sell It links transcript.
12. AI analyzes transcript or notes.
13. AI suggests follow-up tasks.
14. AI suggests opportunity updates.
15. AI detects pain points.
16. User reviews suggestions.
17. User saves approved records.

Matching order:

1. Exact phone number match to contact.
2. Normalized phone number match.
3. Company main phone match.
4. Previous call history match.
5. Opportunity participant match.
6. Manual user selection.

If the caller is unknown, AI or the review page may suggest:

- Create contact.
- Create company.
- Link to existing company.
- Create opportunity.
- Create task.
- Ignore as spam.
- Mark as personal or not business-related.

---

## 6. Outgoing Call Workflow

Future outgoing call flow:

1. User places outgoing RingCentral call.
2. Sell It identifies the RingCentral user.
3. Sell It maps RingCentral user to Sell It team member.
4. Sell It captures dialed number.
5. Sell It matches dialed number to contact/company.
6. Sell It creates or stages Activity of type Call.
7. If recording exists, Sell It links recording.
8. If transcript exists, Sell It links transcript.
9. AI summarizes call.
10. AI identifies follow-up needs.
11. AI suggests task creation.
12. AI suggests opportunity stage update.
13. User reviews before saving important changes.

Outgoing calls should preserve:

- Calling user.
- From number.
- To number.
- Contact.
- Company.
- Opportunity.
- Call start time.
- Call end time.
- Duration.
- Direction.
- Recording status.
- Transcript status.
- AI summary.
- Next action.

No important CRM changes should be made silently.

---

## 7. Missed Call Workflow

Missed calls should be handled as business follow-up opportunities.

Future missed call flow:

1. RingCentral logs missed call.
2. Sell It identifies called number.
3. Sell It identifies caller number.
4. Sell It matches caller to contact/company if possible.
5. Sell It creates Activity of type Missed Call or Call with outcome Missed.
6. Sell It suggests follow-up task.
7. If shared number, Sell It suggests team assignment.
8. User reviews and saves task.

Missed call task suggestion fields:

- Title.
- Description.
- Due date.
- Priority.
- Assigned team member.
- Related contact.
- Related company.
- Related opportunity.
- Source call.

Example task:

`Call back Sarah Miller from Rock Creek Contracting about gravel haul request.`

---

## 8. Voicemail Workflow

Voicemails should become searchable, reviewable business records.

Future voicemail flow:

1. Voicemail is received.
2. Recording is captured or linked.
3. Transcript is captured or generated if available.
4. Sell It matches caller to contact/company.
5. AI analyzes voicemail transcript.
6. AI creates summary.
7. AI detects pain points.
8. AI suggests task.
9. AI suggests opportunity update if relevant.
10. User reviews.
11. User saves approved records.

Voicemail Activity should include:

- Activity Type: Voicemail.
- Direction: Incoming.
- Caller number.
- Called number.
- Mailbox or user.
- Recording link.
- Transcript.
- AI summary.
- Follow-up needed.
- Related contact.
- Related company.
- Related opportunity.
- Related task.

---

## 9. Call Recording Model

Call recordings may be sensitive and should be handled carefully.

Future recording storage should support:

- Recording provider ID.
- Recording URL or storage path.
- Recording duration.
- Recording format.
- Linked call log.
- Linked activity.
- Linked transcript.
- Access permissions.
- Retention date.
- Deleted or archived status.

Recording metadata should be stored even if the actual audio is not copied into Sell It.

Potential storage approaches:

1. Store only RingCentral recording reference.
2. Store recording in Supabase Storage.
3. Store no audio, only transcript and summary.
4. Hybrid approach by workspace setting.

Recommended first approach:

- Do not copy recordings at first.
- Store provider reference and metadata only.
- Add transcript and summary review workflow first.

---

## 10. Transcript Model

Call transcripts should eventually be separate from raw call logs.

Transcript records should support:

- Call log ID.
- Recording ID.
- Provider transcript ID.
- Transcript text.
- Speaker labels if available.
- Transcript source.
- Transcript confidence if available.
- AI cleaned transcript.
- AI summary.
- AI extracted fields.
- Processing status.

Possible transcript statuses:

- unavailable.
- pending.
- available.
- processing.
- processed.
- failed.
- ignored.

---

## 11. AI Processing Rules

AI should identify:

- Company.
- Contact.
- Opportunity.
- Task.
- Activity.
- Pain point.
- Urgency.
- Follow-up needed.
- Next action.
- Sentiment or risk level if useful.
- Commitments made by either side.
- Dates, times, and deadlines.
- Buying signals.
- Objections.
- Decision makers.

AI output should include:

- Summary.
- Detected company.
- Detected contact.
- Detected opportunity.
- Suggested task.
- Suggested activity.
- Detected pain points.
- Urgency.
- Follow-up needed.
- Suggested next action.
- Suggested opportunity stage change.
- Confidence.
- Reasons.

Examples of detected pain points:

- Need trucks.
- Dispatch confusion.
- Paper tickets.
- Billing delays.
- Driver shortage.
- Manual calling.
- Poor availability visibility.
- Missed calls.
- Customer support issue.
- Scheduling confusion.

AI should not silently update important CRM records.

AI may suggest:

- Create company.
- Create contact.
- Create task.
- Create opportunity.
- Update opportunity stage.
- Link pain point.
- Assign call follow-up.
- Mark call handled.

User should confirm important changes.

---

## 12. Review-Before-Save Rules

No silent writes for important call intelligence decisions.

Safe automatic actions may eventually include:

- Store raw call log.
- Store provider call ID.
- Store processing log.
- Store recording metadata.
- Store transcript metadata.

Review required for:

- Creating a company.
- Creating a contact.
- Creating an opportunity.
- Creating a task.
- Updating opportunity stage.
- Assigning work to a team member.
- Linking pain points.
- Marking a lead as ignored.
- Deleting or hiding call data.
- Sharing a private recording or transcript.

Review page should show:

- Call details.
- Caller/called numbers.
- Matched contact/company.
- Recording availability.
- Transcript.
- AI summary.
- Suggested task.
- Suggested opportunity update.
- Suggested pain points.
- Confidence.
- Approve/edit/ignore controls.

---

## 13. Business Memory Integration

Calls should eventually contribute to Sell It business memory.

Call intelligence should improve:

- Company Memory.
- Contact Memory.
- Opportunity Memory.
- Assistant Recommendations.
- Planner.
- Pain Points.
- Relationship Timeline.
- Workload visibility.

Examples:

- Company page shows recent call summary.
- Contact page shows last call outcome.
- Opportunity page shows call-driven stage changes.
- Assistant can answer: `Who do I need to call back?`
- Planner can surface missed-call follow-ups.
- Pain Points can show call-driven trends.

---

## 14. Team Assignment Rules

Calls from shared numbers should be assignable.

Assignment targets:

- Charles.
- Trent.
- Angel.
- Future sales reps.

Assignment rules may use:

- Called number.
- Existing company owner.
- Existing opportunity owner.
- Existing task owner.
- Round-robin later.
- Manual assignment first.

Recommended first version:

- Manual assignment only.
- AI may suggest assignee.
- User confirms assignment.

Do not auto-assign calls silently in early versions.

---

## 15. Database Proposal

This is a proposal only. Do not create these tables yet.

### phone_accounts

Purpose: configured RingCentral or phone-provider accounts.

Possible fields:

- id.
- workspace_id.
- provider_type.
- display_name.
- provider_account_id.
- provider_user_id.
- owner_team_member_id.
- owner_profile_id.
- status.
- permissions_json.
- last_sync_at.
- last_success_at.
- last_error_at.
- last_error_message.
- created_by.
- updated_by.
- created_at.
- updated_at.

### phone_numbers

Purpose: direct and shared phone numbers.

Possible fields:

- id.
- workspace_id.
- phone_account_id.
- number_type.
- display_name.
- phone_number.
- extension.
- provider_number_id.
- owner_team_member_id.
- assigned_team_member_id.
- visibility.
- can_receive_calls.
- can_make_calls.
- can_record.
- status.
- created_by.
- updated_by.
- created_at.
- updated_at.

### call_logs

Purpose: raw and normalized call events.

Possible fields:

- id.
- workspace_id.
- phone_account_id.
- phone_number_id.
- provider_call_id.
- provider_session_id.
- direction.
- call_status.
- from_number.
- to_number.
- caller_name.
- start_time.
- end_time.
- duration_seconds.
- missed_call.
- voicemail_left.
- recording_available.
- transcript_available.
- assigned_team_member_id.
- company_id.
- contact_id.
- opportunity_id.
- task_id.
- activity_id.
- raw_provider_json.
- processing_status.
- created_at.
- updated_at.

### call_recordings

Purpose: recording metadata and optional storage links.

Possible fields:

- id.
- workspace_id.
- call_log_id.
- provider_recording_id.
- recording_url.
- storage_path.
- duration_seconds.
- file_type.
- file_size.
- access_level.
- retention_until.
- deleted_at.
- created_at.
- updated_at.

### call_transcripts

Purpose: transcript text and transcript processing status.

Possible fields:

- id.
- workspace_id.
- call_log_id.
- call_recording_id.
- provider_transcript_id.
- transcript_text.
- speaker_json.
- transcript_source.
- confidence_score.
- processing_status.
- error_message.
- created_at.
- updated_at.

### voicemail_records

Purpose: voicemail-specific metadata.

Possible fields:

- id.
- workspace_id.
- call_log_id.
- phone_number_id.
- provider_voicemail_id.
- from_number.
- to_number.
- voicemail_time.
- duration_seconds.
- recording_id.
- transcript_id.
- activity_id.
- assigned_team_member_id.
- status.
- created_at.
- updated_at.

### call_ai_reviews

Purpose: AI extraction and review-before-save workflow.

Possible fields:

- id.
- workspace_id.
- call_log_id.
- transcript_id.
- review_status.
- detected_company_json.
- detected_contact_json.
- detected_opportunity_json.
- suggested_tasks_json.
- detected_pain_points_json.
- urgency.
- follow_up_needed.
- summary.
- suggested_next_action.
- confidence.
- approved_by.
- approved_at.
- created_records_json.
- created_at.
- updated_at.

---

## 16. Security and Compliance

Call recordings and transcripts can contain sensitive information.

Security concerns:

- Recording consent.
- State recording laws.
- User access controls.
- Private direct-line call visibility.
- Shared number visibility.
- Retention policies.
- Deletion policies.
- Export controls.
- Audit logs.
- Sensitive personal information in transcripts.
- Customer confidential information.

Important compliance note:

Sell It should not assume all calls can legally be recorded. Recording consent rules vary by location. Before building live recording support, legal requirements should be reviewed for the states and customers involved.

Access rules should answer:

- Can Charles see all calls?
- Can Trent see only his own calls plus shared calls?
- Can Angel see only her own calls plus shared calls?
- Can admins listen to recordings?
- Can users delete recordings?
- Can users download recordings?
- Can AI process all calls or only selected calls?

Recommended early safety rule:

- Store manual call notes first.
- Do not store recordings until permissions and retention rules are clear.
- Do not expose private call recordings broadly.

---

## 17. Retention Policy Considerations

Retention questions:

- How long should raw call logs be stored?
- How long should recordings be stored?
- How long should transcripts be stored?
- Should recordings be deleted after transcript creation?
- Should users be able to permanently delete recordings?
- Should shared number records be kept longer than private direct-line records?
- Should AI summaries remain if recordings are deleted?

Possible retention options:

- Keep call logs indefinitely.
- Keep transcripts indefinitely.
- Keep recordings for 30, 90, or 365 days.
- Keep only summaries after retention window.
- Let workspace admin configure retention.

---

## 18. Implementation Phases

### V1: Manual Call Note Capture

No RingCentral connection.

User manually enters call notes, caller, contact, company, subject, outcome, and follow-up need.

AI analyzes manual call notes and suggests records.

This mirrors Email Intelligence V1.

### V2: Call Log Import

Import exported RingCentral call logs manually.

No live connection yet.

Map calls to contacts and companies.

### V3: RingCentral Connection

Connect one RingCentral account or one shared number.

Read-only first.

Fetch recent call logs.

No automatic important writes.

### V4: Transcript Processing

Add transcript ingestion if available.

Analyze transcripts with AI.

Create review queue.

### V5: AI Review/Save Workflow

User reviews AI suggestions and confirms saves.

Create activities, tasks, pain points, contacts, companies, or opportunity updates after approval.

### V6: Automated Recommendations

Assistant and Planner use call intelligence to recommend work.

Examples:

- Missed calls needing callbacks.
- Voicemails needing review.
- Hot opportunities based on recent calls.
- Pain points trending from calls.

---

## 19. Open Questions Before Build

RingCentral questions:

- What RingCentral plan is required?
- Are call logs available through the current plan?
- Are recordings available through the current plan?
- Are transcripts available through the current plan?
- Are voicemails available through the current plan?
- Are webhooks available?
- What are API rate limits?
- What are storage limits?
- Are recordings downloadable?
- Are transcripts included or extra cost?
- Are SMS messages in scope later?

Business questions:

- Which number should connect first?
- Are there shared business numbers already?
- Does each user have a direct line?
- Should Charles see every call?
- Should Trent and Angel see only their calls plus shared calls?
- Who handles missed calls from the main line?
- Who can listen to recordings?
- How long should recordings be kept?
- Should transcripts be saved if recordings are deleted?

Technical questions:

- Should Sell It use OAuth?
- Should Sell It use webhook events or scheduled polling?
- Should recordings be copied to Supabase Storage?
- Should only metadata be stored at first?
- Should AI process every transcript or only reviewed calls?
- How should duplicate call logs be detected?

---

## 20. Recommended Next Build

Recommended next build:

`RingCentral Intelligence V1A: Manual Call Note Capture`

Reason:

- No RingCentral credentials needed.
- No API dependency.
- No legal risk from recordings.
- Safe review-before-save pattern.
- Reuses existing Activity, Task, Company, Contact, Opportunity, and Pain Point workflows.
- Mirrors Email Intelligence V1.

Possible V1A flow:

1. User opens Call Intelligence.
2. User enters call direction, caller, number, subject, notes, and outcome.
3. AI analyzes call notes.
4. User reviews suggestions.
5. User confirms what to save.
6. Sell It creates Activity and selected related records.
7. Call note appears in timeline.

---

## 21. Design Decision Summary

Recommended build order:

- Manual call note capture first.
- Manual call log import second.
- RingCentral read-only connection third.
- Transcript processing fourth.
- AI review/save workflow fifth.
- Automated recommendations last.

Core rules:

- No RingCentral credentials in GitHub.
- No automatic important writes.
- No broad access to private call recordings.
- No recording storage until consent and retention rules are clear.
- No call recording assumptions without legal review.
- Review before save.

