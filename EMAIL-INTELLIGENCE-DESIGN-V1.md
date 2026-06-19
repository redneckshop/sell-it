# EMAIL INTELLIGENCE DESIGN V1

## Purpose

Design how Sell It will eventually handle email intelligence for individual user email accounts and shared business mailboxes.

This is a planning document only. Do not build email integration yet, do not connect to Bluehost yet, do not add IMAP/SMTP credentials, and do not create new database tables yet.

Latest confirmed clean commit before this document: `f22ab21 Add assistant conversation layout v1`.

## Expected Email Accounts

Individual mailboxes:
- charles@knottylogistics.com
- trent@knottylogistics.com
- angel@knottylogistics.com

Shared mailboxes:
- info@knottylogistics.com
- office@knottylogistics.com
- sales@knottylogistics.com
- support@knottylogistics.com

Likely provider: Bluehost email using IMAP/SMTP. Provider settings must be verified before implementation.

## 1. Email Account Model

Sell It should support individual user inboxes and shared team inboxes. Each email account should belong to a workspace and include workspace_id, email_address, display_name, account_type, provider_type, owner_team_member_id, owner_profile_id, visibility, can_read, can_send, status, last_checked_at, last_success_at, and last_error_at.

Account types:
- individual
- shared

Status values:
- active
- inactive
- paused
- error

Provider types:
- bluehost_imap_smtp
- custom_imap_smtp
- gmail
- microsoft_365
- manual_import

Individual inbox rules:
- Charles, Trent, and Angel can each have their own mailbox.
- Private mailbox content should not be visible to other users unless permission allows it.
- Admin access needs to be decided before build.

Shared inbox rules:
- Shared mailboxes belong to the workspace.
- Approved team members can triage shared mailbox messages.
- Shared messages can be assigned to Charles, Trent, or Angel.
- Shared messages need processing status so the same email is not handled twice.

Secure credential storage plan:
- Never commit email passwords, SMTP credentials, IMAP credentials, OAuth secrets, or app passwords.
- Never place credentials in markdown, screenshots, logs, or frontend code.
- Use environment variables for early development and Vercel environment variables for deployment.
- Consider encrypted secret storage later if users manage multiple mailboxes.
- Prefer app passwords if Bluehost supports them.
- Store credential references only, not raw passwords.

## 2. Incoming Email Workflow

Proposed workflow:
1. Fetch incoming email from the mailbox.
2. Identify source mailbox and workspace.
3. Check duplicate status before processing.
4. Parse sender, recipients, subject, body, date, attachments, and thread headers.
5. Match sender to an existing contact.
6. Match sender domain or signature to an existing company.
7. Match content to an existing opportunity when possible.
8. Save email message and thread records.
9. Create or suggest an Email activity.
10. Suggest tasks when follow-up is needed.
11. Detect opportunity updates.
12. Detect pain points.
13. Attach email to contact, company, opportunity, task, and pain point timelines where applicable.
14. Mark processing status as new, needs_review, processed, duplicate, ignored, or failed.

Matching priority:
1. Exact contact email match.
2. Known company domain match.
3. Company name in body or signature.
4. Contact name in body or signature.
5. Existing opportunity by company/contact/topic.
6. Manual user selection.

Incoming activity suggestion:
- type: Email
- direction: Incoming
- outcome: Received
- subject
- summary
- source mailbox
- related contact
- related company
- related opportunity
- related task
- email thread
- email message

AI should suggest a task when the email includes follow-up, demo request, pricing request, customer question, customer problem, meeting request, lead interest, time-sensitive request, or a clear next step. Task suggestions should include title, description, due date, priority, assigned team member, related contact, related company, related opportunity, source email, and reason.

AI should detect opportunity updates such as demo interest, pricing questions, alpha/beta interest, not-interested replies, timing changes, decision maker introductions, driver count, truck count, region, brokerage need, contractor need, dispatch problems, paperwork problems, or onboarding language.

AI should detect pain points such as need trucks, paper tickets, billing delays, dispatch confusion, driver shortage, missed loads, lack of visibility, manual paperwork, scheduling problems, and broker communication problems.

## 3. Outgoing Email Workflow

Outgoing email from Sell It should allow a logged-in user to send from an approved mailbox only.

Sender rules:
- Charles may send from charles@knottylogistics.com.
- Trent may send from trent@knottylogistics.com.
- Angel may send from angel@knottylogistics.com.
- Approved users may send from shared mailboxes if permission allows.

Outgoing emails should be logged as Email activities with type, direction, outcome, from, to, cc, bcc, subject, body summary, sent by, sent date, related contact, related company, related opportunity, related task, provider message id, and thread id.

Before sending, Sell It should encourage the user to link the email to contact, company, opportunity, task, and existing email thread. Thread tracking should use provider message id, provider thread id, In-Reply-To header, References header, normalized subject, participants, and existing Sell It thread records. No AI should send email silently. Sending must require user confirmation.

## 4. Shared Mailbox Workflow

Shared mailboxes include info@, office@, sales@, and support@.

Suggested shared message statuses:
- new
- needs_review
- assigned
- task_created
- linked
- ignored
- processed
- failed
- duplicate

Shared inbox actions should support assigning to Charles, Trent, or Angel; creating a task; adding due date and priority; linking contact, company, and opportunity; creating activity; adding pain point; marking handled; or leaving open for review.

For shared inbox leads, AI may suggest creating a contact, company, opportunity, follow-up task, activity, and pain point. Duplicate prevention should check provider message id, provider thread id, mailbox id, sender, subject, sent date, existing email message, existing activity, and existing task created from the same message.

## 5. Email Thread Model

Thread-level proposal:
- id
- workspace_id
- email_account_id
- provider_thread_id
- subject
- normalized_subject
- participants_json
- primary_contact_id
- company_id
- opportunity_id
- assigned_team_member_id
- status
- ai_summary
- last_message_at
- last_incoming_at
- last_outgoing_at
- created_by
- updated_by
- created_at
- updated_at

Message-level proposal:
- id
- workspace_id
- email_account_id
- email_thread_id
- provider_message_id
- provider_thread_id
- direction
- from_address
- from_name
- to_addresses_json
- cc_addresses_json
- bcc_addresses_json
- subject
- body_text
- body_html
- body_preview
- sent_at
- received_at
- has_attachments
- activity_id
- task_id
- company_id
- contact_id
- opportunity_id
- ai_summary
- ai_detected_json
- ai_processing_status
- processing_error
- created_at
- updated_at

Thread AI summary should explain what the conversation is about, current status, who is waiting on whom, last meaningful update, open commitments, and suggested next action.

## 6. AI Processing Rules

AI should identify company, contact, opportunity, task, activity, pain point, urgency, follow-up needed, summary, and suggested next action.

AI output should include detected_company, detected_contact, detected_opportunity, suggested_activity, suggested_tasks, detected_pain_points, urgency, follow_up_needed, summary, suggested_next_action, confidence, and reasons.

Urgency should consider deadlines, demo requests, pricing requests, customer frustration, support issues, repeated unanswered messages, high-value opportunities, and active alpha/beta candidates.

Suggested next actions may include reply to email, call contact, schedule demo, send pricing, ask qualifying question, assign task, update opportunity stage, link to existing company, or create contact.

## 7. Review-Before-Save Rules

No silent writes for important AI email decisions.

AI may suggest creating company, contact, opportunity, task, and activity records; updating an opportunity; linking a pain point; assigning an owner; linking an email thread; or marking a shared inbox item handled.

User confirmation should be required for creating records, assigning tasks, updating opportunity stages, linking pain points, changing owners, sending email, ignoring leads, and bulk actions.

Safe automatic actions may eventually include saving raw email messages, saving processing logs, detecting duplicates, updating last checked timestamps, marking processing errors, and generating draft-only AI summaries. These should still be logged.

Future review pages may include:
- /assistant/actions/email/review
- /email/inbox
- /email/threads/[id]
- /email/messages/[id]

## 8. Security Concerns

Security rules:
- Never commit credentials.
- Never expose credentials to the browser.
- Never log credentials.
- Use environment variables or encrypted storage.
- Rotate credentials if exposed.
- Prefer app passwords if available.
- Use mailbox permissions.

Permission questions:
- Can Trent see Charles's mailbox?
- Can Angel see Trent's mailbox?
- Can everyone see shared mailboxes?
- Can everyone send from shared mailboxes?
- Who can connect or disconnect mailboxes?
- Who can view full bodies versus summaries?

Default rule: private user mailboxes are visible only to the owner and admins unless explicitly allowed. Shared mailboxes are visible only to authorized team members. Attachments need file size limits, file type limits, private storage, non-public URLs, and rules about whether attachment content may be sent to AI.

## 9. Database Proposal

This is a proposal only. Do not create these tables yet.

Proposed tables:
- email_accounts
- email_threads
- email_messages
- email_attachments
- email_processing_logs

email_accounts possible fields:
- id
- workspace_id
- account_type
- display_name
- email_address
- provider_type
- imap_host
- imap_port
- smtp_host
- smtp_port
- credential_storage_type
- credential_reference
- owner_team_member_id
- owner_profile_id
- visibility
- can_read
- can_send
- status
- last_checked_at
- last_success_at
- last_error_at
- last_error_message
- created_by
- updated_by
- created_at
- updated_at

email_threads possible fields:
- id
- workspace_id
- email_account_id
- provider_thread_id
- subject
- normalized_subject
- participants_json
- primary_contact_id
- company_id
- opportunity_id
- assigned_team_member_id
- status
- ai_summary
- last_message_at
- last_incoming_at
- last_outgoing_at
- created_by
- updated_by
- created_at
- updated_at

email_messages possible fields:
- id
- workspace_id
- email_account_id
- email_thread_id
- provider_message_id
- provider_thread_id
- direction
- from_address
- from_name
- to_addresses_json
- cc_addresses_json
- bcc_addresses_json
- subject
- body_text
- body_html
- body_preview
- sent_at
- received_at
- has_attachments
- activity_id
- task_id
- company_id
- contact_id
- opportunity_id
- ai_summary
- ai_detected_json
- ai_processing_status
- processing_error
- created_at
- updated_at

email_attachments possible fields:
- id
- workspace_id
- email_account_id
- email_thread_id
- email_message_id
- storage_path
- file_name
- mime_type
- file_size
- content_disposition
- attachment_hash
- created_at
- updated_at

email_processing_logs possible fields:
- id
- workspace_id
- email_account_id
- email_thread_id
- email_message_id
- processing_type
- status
- started_at
- finished_at
- error_message
- ai_model
- input_summary
- output_summary
- created_records_json
- suggested_actions_json
- created_at

## 10. Implementation Phases

V1: Manual email capture/import. No mailbox connection. User pastes sender, subject, date, and body. AI extracts suggestions. User reviews before save.

V2: Connect one shared mailbox. Start with one shared mailbox, likely sales@knottylogistics.com. Read-only IMAP first. Fetch recent messages, detect duplicates, and create review queue items.

V3: Connect individual mailboxes. Add Charles, Trent, and Angel mailboxes. Enforce private mailbox permissions.

V4: AI email review/save. Build review queue. Confirm, edit, ignore, assign, or manually link suggestions.

V5: Outgoing email from Sell It. Send from approved mailboxes, log sent email as activity, track threads, and require confirmation before sending.

V6: Automated polling or webhooks. Add scheduled polling or provider webhooks if available. Automation should create review items, not silently create important CRM records.

## 11. Risks and Open Questions

Provider questions:
- What are the exact Bluehost IMAP settings?
- What are the exact Bluehost SMTP settings?
- Does Bluehost support app passwords?
- Does Bluehost support OAuth?
- Does Bluehost support webhooks?
- What are Bluehost sending limits?
- What are Bluehost connection limits?
- Are all expected mailboxes already created?

Mailbox questions:
- Which mailbox should connect first?
- How many mailboxes will Sell It connect?
- Should shared inboxes come before individual inboxes?
- Who owns each mailbox?

Permission questions:
- Who can see shared mailboxes?
- Who can see private user mailboxes?
- Can Charles see all user inboxes?
- Can Trent see only his inbox plus shared inboxes?
- Can Angel see only her inbox plus shared inboxes?
- Who can send from shared mailboxes?
- Who can assign shared inbox emails?

Retention questions:
- How long should email bodies be stored?
- Should Sell It store full email bodies or summaries only?
- Should attachments be stored?
- Should deleted provider emails remain in Sell It?
- Should mailbox owners be able to delete private mailbox data?
- Should audit logs be permanent?

AI questions:
- Should every email be sent to AI?
- Should only lead-like emails be sent to AI?
- Should attachments be sent to AI?
- Should private mailboxes have different AI rules?
- What confidence threshold requires review?
- Are any AI suggestions safe to auto-create later?

Operational risks:
- duplicate tasks
- duplicate activities
- mis-linked contacts
- private mailbox leakage
- sending from wrong mailbox
- provider rate limits
- expired credentials
- attachment risks
- AI hallucinated matches
- spam treated as leads
- too many low-quality tasks

## 12. Non-Goals For This Task

Do not build email integration, Bluehost connection, IMAP credentials, SMTP credentials, new database tables, RingCentral integration, social monitoring, mobile apps, automation jobs, automated polling, email sending, OAuth flow, attachment processing, or AI auto-write behavior.

## 13. Recommended Next Build

Recommended next build: Email Intelligence V1A Manual Email Capture Review.

Reason:
- No credentials needed.
- No Bluehost dependency.
- Safest first step.
- Lets Sell It understand pasted email content.
- Fits the existing AI Capture and review-before-save pattern.

Possible V1A flow:
1. User opens Email Capture.
2. User pastes sender, subject, date, and body.
3. AI extracts company, contact, opportunity, task, and pain point suggestions.
4. User reviews suggestions.
5. User confirms what to save.
6. Sell It creates selected records.
7. Email content appears in timeline.

## 14. Design Decision Summary

Recommended build order:
1. Manual email capture first.
2. One shared mailbox second.
3. Individual mailboxes third.
4. AI review queue fourth.
5. Outgoing email fifth.
6. Automation last.

Core rules:
- No credentials in GitHub.
- No silent important writes.
- No private mailbox leakage.
- No duplicate processing.
- No AI-sent email without user confirmation.

