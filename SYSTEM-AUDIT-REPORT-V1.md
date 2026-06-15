# SYSTEM AUDIT REPORT V1 — Sell It CRM

Date: 2026-06-15  
Repo: redneckshop/sell-it  
Scope: Current app after Delete Manager V2.  
Purpose: Audit missing CRUD, field exposure gaps, duplicate/deprecated fields, AI coverage, delete/archive risk, and recommended next build order.

## Ground Rules

This report is documentation only.

No database changes were made.  
No code changes were made.  
No columns were deleted.  
Archive Manager was not built.  
AI Assistant V2 was not built.

This V1 report is based on the current repository code, observed routes, current pages, and recent builder inspections. A future V2 audit should include a live Supabase schema export to prove every database column.

---

# 1. Entity CRUD Matrix

| Entity | Create Page Exists | View Page Exists | Edit Page Exists | Delete Manager Exists | Attachments Supported | Sidebar / Main Navigation | Quick Add |
|---|---:|---:|---:|---:|---:|---:|---:|
| Companies | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Contacts | Yes | Yes | No | Yes | Yes | Yes | Yes |
| Opportunities | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Tasks | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Activities | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Notes | Yes | Yes | No | Yes | Yes | Yes | No |
| Communities | Yes | Yes | No | Yes | No direct attachment section observed | Yes | No |
| Posts | Yes | Yes | No | Yes | Yes | Yes | No |
| Pain Points | Yes | Yes | No | Yes | No direct attachment section observed | Yes | No |
| Attachments | Partial through related records | Partial through related records | No | Partial through parent delete managers | N/A | No standalone nav | No |

## CRUD Gaps

Entities still missing edit pages:

- Contacts
- Notes
- Communities
- Posts
- Pain Points
- Attachments

Attachments are not yet a full standalone entity area. They are supported through related records and several Delete Managers, but there is no full `/attachments`, `/attachments/[id]`, `/attachments/[id]/edit`, or standalone `/attachments/[id]/delete` workflow.

---

# 2. Schema vs UI Field Audit

Important: this is a code-observed audit. A live Supabase schema export is still needed before declaring any database column truly unused.

## companies

Observed columns:

- id
- workspace_id
- name
- website
- phone
- email
- lead_temperature
- operating_regions
- assets_equipment
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | System | Yes | Multi-workspace field |
| name | Yes | Yes | Yes | Yes | Core field |
| website | Yes | Yes | Yes | Yes | Exposed |
| phone | Yes | Yes | Yes | Yes | Exposed |
| email | Yes | Yes | Yes | Yes | Exposed |
| lead_temperature | Yes | Yes | Yes | Yes | Dashboard/AI relevant |
| operating_regions | Yes | Yes | Yes | Partial | Useful business context |
| assets_equipment | Yes | Yes | Yes | Partial | Useful trucking context |
| created_at | System | Yes | No | Yes | Read-only |
| updated_at | System | Yes | No | Partial | Read-only |

Risk: Company is mostly complete. Main risk is permanent delete without archive.

## contacts

Observed columns:

- id
- workspace_id
- company_id
- first_name
- last_name
- title
- email
- phone
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | No edit page | Yes | Multi-workspace field |
| company_id | Yes | Yes | No edit page | Yes | Company relationship |
| first_name | Yes | Yes | No edit page | Yes | Core field |
| last_name | Yes | Yes | No edit page | Yes | Core field |
| title | Yes | Yes | No edit page | Yes | Sales context |
| email | Yes | Yes | No edit page | Yes | Exposed |
| phone | Yes | Yes | No edit page | Yes | Exposed |
| created_at | System | Yes/partial | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Contacts need an edit page, especially for company reassignment and corrected contact info.

## opportunities

Observed active columns:

- id
- workspace_id
- name
- company_id
- primary_contact_id
- opportunity_type
- stage
- lead_temperature
- estimated_driver_count
- estimated_monthly_value
- expected_close_date
- next_step
- notes
- created_at
- updated_at

Known suspect older columns:

- contact_id
- value
- close_date

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | System | Yes | Multi-workspace field |
| name | Yes | Yes | Yes | Yes | Core field |
| company_id | Yes | Yes | Yes | Yes | Company relationship |
| primary_contact_id | Yes | Yes | Yes | Yes | Current contact relationship |
| opportunity_type | Yes | Yes | Yes | Yes | Pipeline classification |
| stage | Yes | Yes | Yes | Yes | Pipeline status |
| lead_temperature | Yes | Yes | Yes | Yes | Sales priority |
| estimated_driver_count | Yes | Yes/partial | Yes | Partial | Trucking-specific value |
| estimated_monthly_value | Yes | Yes | Yes | Yes | Current value field |
| expected_close_date | Yes | Yes | Yes | Yes | Current close-date field |
| next_step | Yes | Yes | Yes | Yes | Important AI/action field |
| notes | Yes | Yes | Yes | Yes/partial | Memory source |
| created_at | System | Yes | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |
| contact_id | Unknown/old | No | No | Risk | Likely deprecated duplicate |
| value | Unknown/old | No | No | Risk | Likely replaced by estimated_monthly_value |
| close_date | Unknown/old | No | No | Risk | Likely replaced by expected_close_date |

Risk: Do not delete suspect fields until live schema export and data review confirm they are unused.

## tasks

Observed columns:

- id
- workspace_id
- title
- description
- due_date
- priority
- status
- assigned_to
- company_id
- contact_id
- opportunity_id
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | System | Yes | Multi-workspace field |
| title | Yes | Yes | Yes | Yes | Core field |
| description | Yes | Yes | Yes | Yes | Memory source |
| due_date | Yes | Yes | Yes | Yes | Dashboard/AI important |
| priority | Yes | Yes | Yes | Yes | Dashboard/AI important |
| status | Yes | Yes | Yes | Yes | Dashboard/AI important |
| assigned_to | Partial/system | Partial | Partial | Partial | Team UX not finished |
| company_id | Yes | Yes | Yes | Yes | Company relationship |
| contact_id | Yes | Yes | Yes | Yes | Contact relationship |
| opportunity_id | Partial | Partial | Partial | Yes | Opportunity relationship |
| created_at | System | Yes/partial | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Tasks are CRUD-complete. Team assignment workflow is immature.

## activities

Observed columns:

- id
- workspace_id
- activity_type
- activity_date
- subject
- summary
- outcome
- follow_up_needed
- company_id
- contact_id
- opportunity_id
- task_id
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | System | Yes | Multi-workspace field |
| activity_type | Yes | Yes | Yes | Yes | Call/text/email/meeting/etc. |
| activity_date | Yes | Yes | Yes | Yes | Timeline field |
| subject | Yes | Yes | Yes | Yes | Core field |
| summary | Yes | Yes | Yes | Yes | Major AI memory source |
| outcome | Yes | Yes | Yes | Yes | Sales intelligence |
| follow_up_needed | Yes | Yes | Yes | Yes | Workflow trigger |
| company_id | Yes | Yes | Yes | Yes | Company relationship |
| contact_id | Yes | Yes | Yes | Yes | Contact relationship |
| opportunity_id | Partial | Partial | Partial | Yes | Opportunity relationship |
| task_id | Partial | Partial | Partial | Partial | Task relationship |
| created_at | System | Yes/partial | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Activities are CRUD-complete and should become a primary AI memory source.

## notes

Observed columns:

- id
- workspace_id
- title
- body
- source
- source_url
- tags
- company_id
- contact_id
- opportunity_id
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | No edit page | Yes | Multi-workspace field |
| title | Yes | Yes | No edit page | Yes | Core field |
| body | Yes | Yes | No edit page | Yes | Major AI memory source |
| source | Yes | Yes | No edit page | Yes | Context |
| source_url | Partial | Partial | No edit page | Partial | Reference field |
| tags | Yes | Yes | No edit page | Yes | Search/memory field |
| company_id | Yes | Yes | No edit page | Yes | Company relationship |
| contact_id | Yes | Yes | No edit page | Yes | Contact relationship |
| opportunity_id | Yes | Yes | No edit page | Yes | Opportunity relationship |
| created_at | System | Yes | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Notes need an edit page and should be first-class AI memory.

## communities

Observed columns:

- id
- workspace_id
- name
- platform
- url
- description
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Partial | System identifier |
| workspace_id | System | Hidden/partial | No edit page | Partial | Multi-workspace field |
| name | Yes | Yes | No edit page | Partial | Core field |
| platform | Yes | Yes | No edit page | Partial | Social source |
| url | Yes | Yes | No edit page | Partial | Monitoring reference |
| description | Yes | Yes | No edit page | Partial | Context field |
| created_at | System | Yes/partial | No | Partial | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Communities need edit page before social monitoring gets larger.

## posts

Observed columns:

- id
- workspace_id
- community_id
- title
- platform
- post_type
- post_url
- post_date
- original_post_text
- comment_count
- reaction_count
- share_count
- ai_summary
- pain_points_found
- leads_found
- follow_up_needed
- tags
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | No edit page | Yes | Multi-workspace field |
| community_id | Yes | Yes | No edit page | Yes | Community relationship |
| title | Yes | Yes | No edit page | Yes | Core field |
| platform | Yes | Yes | No edit page | Yes | Social source |
| post_type | Yes | Yes | No edit page | Yes | Context |
| post_url | Yes | Yes | No edit page | Yes | Monitoring/reference |
| post_date | Yes | Yes | No edit page | Yes | Timeline |
| original_post_text | Yes | Yes | No edit page | Yes | Major AI source |
| comment_count | Partial | Yes | No edit page | Partial | Social signal |
| reaction_count | Partial | Yes | No edit page | Partial | Social signal |
| share_count | Partial | Yes | No edit page | Partial | Social signal |
| ai_summary | Partial | Yes | No edit page | Yes | AI output |
| pain_points_found | Partial | Yes | No edit page | Yes | AI output |
| leads_found | Partial | Yes | No edit page | Yes | AI output |
| follow_up_needed | Yes | Yes | No edit page | Yes | Workflow trigger |
| tags | Yes | Yes | No edit page | Yes | Search/memory |
| created_at | System | Yes/partial | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Posts need edit page. Posts are important for future Social Monitoring and AI lead discovery.

## pain_points

Observed columns:

- id
- workspace_id
- name
- description
- category
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Yes | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | No edit page | Yes | Multi-workspace field |
| name | Yes | Yes | No edit page | Yes | Core field |
| description | Yes | Yes | No edit page | Yes | Major memory field |
| category | Yes | Yes | No edit page | Yes | Grouping field |
| created_at | System | Yes | No | Yes | Read-only |
| updated_at | System | Yes | No | Partial | Read-only |

Risk: Pain Points need edit page and are very important to conversational memory.

## attachments

Observed columns:

- id
- workspace_id
- file_name
- file_type
- file_url
- storage_path
- description
- uploaded_by
- related_company_id
- related_contact_id
- related_opportunity_id
- related_task_id
- related_activity_id
- related_note_id
- related_post_id
- created_at
- updated_at

| Column | Add Form | Detail Page | Edit Page | Assistant / Memory | Notes |
|---|---:|---:|---:|---:|---|
| id | System | Partial | System | Yes | System identifier |
| workspace_id | System | Hidden/partial | No edit page | Yes | Multi-workspace field |
| file_name | Yes | Yes | No edit page | Yes | Metadata searchable |
| file_type | Yes | Yes | No edit page | Yes | Metadata searchable |
| file_url | System | Partial | No edit page | Partial | Storage reference |
| storage_path | System | Hidden/partial | No edit page | Partial | Storage reference |
| description | Yes | Yes | No edit page | Partial | Useful memory text |
| uploaded_by | System | Partial | No edit page | Partial | User relationship |
| related_company_id | Yes | Partial | No edit page | Yes | Relationship |
| related_contact_id | Yes | Partial | No edit page | Yes | Relationship |
| related_opportunity_id | Yes | Partial | No edit page | Yes | Relationship |
| related_task_id | Yes | Partial | No edit page | Yes | Relationship |
| related_activity_id | Yes | Partial | No edit page | Yes | Relationship |
| related_note_id | Yes | Partial | No edit page | Yes | Relationship |
| related_post_id | Yes | Partial | No edit page | Yes | Relationship |
| created_at | System | Yes | No | Yes | Read-only |
| updated_at | System | Partial | No | Partial | Read-only |

Risk: Attachments do not have a standalone manager. Attachment file contents are not guaranteed searchable unless extracted and stored.

## relationship tables

Observed relationship tables:

- pain_point_companies
- pain_point_contacts
- pain_point_activities
- pain_point_posts

Observed common columns:

- id
- workspace_id
- pain_point_id
- company_id / contact_id / activity_id / post_id
- created_by
- created_at

Risk: These are link records. Deleting a link should usually not delete the linked company/contact/activity/post.

---

# 3. Deprecated / Duplicate Field Report

Do not delete anything yet.

| Table | Field | Risk / Reason |
|---|---|---|
| opportunities | contact_id | Likely older duplicate of primary_contact_id |
| opportunities | value | Likely older duplicate of estimated_monthly_value |
| opportunities | close_date | Likely older duplicate of expected_close_date |
| attachments | older relationship fields, if any | Need live schema export to verify no old relation columns remain |

Current opportunity model appears to use:

- primary_contact_id
- estimated_monthly_value
- expected_close_date

Known suspects appear to be:

- contact_id
- value
- close_date

Required before deleting:

1. Export live Supabase schema.
2. Search all app code for references.
3. Check whether historical data exists in suspect columns.
4. Back up the database.
5. Only then create a cleanup migration.

---

# 4. AI Coverage Matrix

| Entity | Capture / Import | Save | Lookup | Summarize | Compare | Include in Reports |
|---|---:|---:|---:|---:|---:|---:|
| Companies | Yes | Yes | Yes | Yes | Limited | Yes |
| Contacts | Yes | Yes | Yes | Yes | Limited | Yes |
| Opportunities | Yes | Yes | Yes | Yes | Limited/Yes | Yes |
| Tasks | Yes | Yes | Yes | Yes | Limited | Yes |
| Activities | Yes | Yes | Yes | Yes | Limited | Yes |
| Notes | Partial | Yes | Partial/Yes | Yes | Limited | Yes |
| Communities | Partial/No | Yes | Limited | Partial | Limited | Partial |
| Posts | Partial | Yes | Yes | Yes | Limited | Yes |
| Pain Points | Yes | Yes | Yes | Yes | Yes | Yes |
| Attachments | Partial | Yes | Metadata only | Metadata only | Limited | Metadata only |

## AI Coverage Notes

Current AI Assistant is best described as structured business lookup and reporting.

It is not yet true conversational memory.

It can work with structured records such as:

- companies
- contacts
- opportunities
- tasks
- activities
- notes
- posts
- pain points
- attachment metadata

It cannot yet reliably resolve vague memory prompts like:

- "I remember talking to Becky..."
- "That trucking company from North Dakota..."
- "The guy who complained about paper tickets..."

Missing architecture for AI Assistant V2:

- memory index table
- entity aliases
- fuzzy matching
- embeddings or scored keyword search
- conversation session memory
- clarification questions
- confidence scoring
- entity disambiguation
- relationship graph search

---

# 5. Delete / Archive Risk Report

## Permanent Delete Status

| Entity | Delete Manager | Delete Type | Archive Exists |
|---|---:|---:|---:|
| Companies | Yes | Permanent delete / safe unlink | No |
| Contacts | Yes | Permanent delete / safe unlink | No |
| Opportunities | Yes | Permanent delete / safe unlink | No |
| Tasks | Yes | Permanent delete / safe unlink | No |
| Activities | Yes | Permanent delete / safe unlink | No |
| Notes | Yes | Permanent delete / safe unlink | No |
| Communities | Yes | Permanent delete / safe unlink | No |
| Posts | Yes | Permanent delete / safe unlink | No |
| Pain Points | Yes | Permanent delete / safe unlink | No |
| Attachments | Partial through parent managers | Permanent delete | No |

Current delete behavior is destructive. Recovery would require Supabase backups or manual database restore.

## Archive Manager Requirements

Add archive fields to major tables:

- archived_at
- archived_by
- archive_reason
- archive_status or is_archived

Pages that must change:

- list pages
- detail pages
- dashboard widgets
- assistant queries
- search results
- reports
- delete manager screens

Recommended default behavior:

- Hide archived records by default.
- Add Show Archived toggle.
- Add Restore button.
- AI Assistant excludes archived records by default unless user asks to include archived.
- Keep Permanent Delete as advanced/destructive.

---

# 6. Recommendations

Recommended next build order:

## 1. Archive Manager V1

Reason: Delete Manager is now powerful but permanent. Before real business use, Archive/Restore should exist.

Minimum scope:

- Add archive fields.
- Archive button on detail pages.
- Restore button for archived records.
- Hide archived records from normal lists.
- Add Show Archived toggle.
- Assistant excludes archived records by default.

## 2. Edit Manager Completion

Finish edit pages for:

- Contacts
- Notes
- Communities
- Posts
- Pain Points
- Attachments

Reason: These records can be created and deleted, but not cleanly corrected.

## 3. Attachment Manager V1

Build standalone attachment management:

- /attachments
- /attachments/[id]
- /attachments/[id]/edit
- /attachments/[id]/delete

Reason: Attachments are already important but are not first-class yet.

## 4. Live Supabase Schema Export Audit V2

Verify:

- all columns
- unused columns
- deprecated fields
- orphaned relationships
- foreign key behavior
- archive migration impact

## 5. AI Assistant V2 — Conversational Memory

Build after Archive/Edit cleanup.

Required components:

- memory_index table
- entity_aliases table
- conversation_sessions table
- conversation_messages table
- fuzzy search
- confidence scoring
- clarification prompts
- entity relationship graph

---

# Builder Conclusion

Sell It is past basic CRUD and now has a serious Delete Manager system.

Main current risks:

- Permanent delete without archive
- Missing edit pages for several entities
- No standalone attachment manager
- Possible deprecated opportunity columns
- AI Assistant is structured lookup, not true conversational memory yet

Recommended next feature:

Archive Manager V1

Recommended next audit:

Live Supabase Schema Export Audit V2
