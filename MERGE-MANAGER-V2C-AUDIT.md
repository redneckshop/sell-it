# Merge Manager V2C Planning Audit

Latest confirmed baseline commit: 6c5f9c7

## Purpose

This audit reviews merge readiness for the remaining review-only record types in Merge Manager:

1. Activities
2. Opportunities
3. Communities
4. Posts

This is a planning audit only. No merge actions are implemented in this change.

## Current V2B status

Merge actions are currently enabled only for:

- Companies
- Contacts
- Notes
- Tasks
- Pain Points

The following remain review-only:

- Activities
- Opportunities
- Communities
- Posts

## Audit summary

| Entity | Recommendation | Reason |
| --- | --- | --- |
| Activities | Needs additional safeguards | Activities are timeline/history records and may represent separate real events even when text is similar. They also connect to attachments and pain point relationship rows. |
| Opportunities | Should remain review-only for now | Opportunities are pipeline records with stage history, tasks, notes, activities, attachments, assistant logic, and business meaning. Accidental merge could corrupt the sales history. |
| Communities | Needs additional safeguards | Community merge is probably safe when URLs are identical, but archive support and post-move preview must be added first. |
| Posts | Needs additional safeguards | Post merge is safe only for exact URL duplicates or exact copied post text. Posts can carry attachments, metrics, AI summaries, pain point links, and future social monitoring state. |

---

# 1. Activities

## Existing relationships

Activities currently contain these direct relationship columns:

- `company_id`
- `contact_id`
- `task_id`
- `opportunity_id`

Activity detail pages also support attachments through:

- `attachments.related_activity_id`

Activities can also be linked to pain points through the join table:

- `pain_point_activities.activity_id`

This means an activity merge cannot only archive or delete one activity. It must also preserve:

- attached files
- pain point links
- company/contact/task/opportunity context
- follow-up flags
- raw notes and summaries
- historical date/time context

## Attachments

Activities use `AttachmentsSection` with:

- `relationColumn="related_activity_id"`

Required merge move:

- move `attachments.related_activity_id` from duplicate activity to survivor activity

## Timeline impact

Activities are timeline records. They are not just normal editable data. They represent historical business events such as calls, texts, meetings, research, Facebook comments, notes, and follow-ups.

Risk:

- Two activities with similar subject text may be two separate real events.
- Same company/contact does not prove duplication.
- Same subject does not prove duplication.
- Similar outcome does not prove duplication.
- A duplicate-looking follow-up activity may still have different timing or context.

Required safeguards before merge:

- Show activity date/time side by side.
- Show company/contact/task/opportunity side by side.
- Show type, outcome, follow-up flag, summary, and raw notes side by side.
- Require exact or near-exact duplication of date/time and content unless user explicitly overrides.
- Preserve duplicate activity content by appending it into the survivor summary/raw notes with a merge divider.
- Keep an audit note in the survivor that identifies the duplicate activity ID and merge time.
- Archive duplicate activity rather than delete when archive fields exist.

## AI Assistant impact

The assistant uses activities heavily for:

- recent activity summaries
- follow-up recommendations
- stale lead detection
- opportunity risk detection
- company/contact comparison
- business memory context
- knowledge highlights
- "what should I do today" recommendations

A wrong activity merge could cause the assistant to believe an account was contacted fewer times than it really was, or that a follow-up signal no longer exists.

Required safeguards:

- Do not merge activities only because subjects are similar.
- Preserve `follow_up_needed` if either record has it.
- Preserve the newest/latest `activity_date` only if the survivor represents the same event.
- If dates differ materially, default to review-only.
- Any assistant-facing text should keep both summaries/raw notes when distinct.

## Relationship Graph impact

Activities connect several graph paths:

- Company -> Activity
- Contact -> Activity
- Task -> Activity
- Opportunity -> Activity
- Pain Point -> Activity
- Activity -> Attachment

Merging activities must keep those graph paths intact.

Required relationship moves:

- `attachments.related_activity_id`: duplicate -> survivor
- `pain_point_activities.activity_id`: duplicate -> survivor, skipping duplicate rows

Potential relationship field fill-ins:

- If survivor has no `company_id` and duplicate has one, fill survivor `company_id`.
- If survivor has no `contact_id` and duplicate has one, fill survivor `contact_id`.
- If survivor has no `task_id` and duplicate has one, fill survivor `task_id`.
- If survivor has no `opportunity_id` and duplicate has one, fill survivor `opportunity_id`.

Conflict rule:

- If survivor and duplicate have different non-empty company/contact/task/opportunity links, do not auto-merge. Require warning and user choice.

## Archive impact

Activity pages currently do not show archive/restore behavior like opportunities do.

Before activity merge actions are built:

- Add archive fields to `activities` if missing:
  - `is_archived`
  - `archived_at`
  - `archived_by`
  - `archive_reason`
- Update list/detail pages to hide archived activities by default or clearly mark them.
- Add restore support if archived activity visibility is needed.

## Delete Manager impact

The activity delete page detaches activity attachments from `related_activity_id`.

Risk:

- Audit output did not show `pain_point_activities` cleanup in the activity delete flow.
- If a deleted activity remains referenced by `pain_point_activities`, pain point relationship graph data can become stale.

Before activity merge or delete expansion:

- Add cleanup or detach behavior for `pain_point_activities.activity_id`.
- Add preview counts for pain point links.

## Safe merge strategy

Activity merge can be built later, but only with strict safeguards.

Recommended merge flow:

1. Choose survivor activity.
2. Show side-by-side review:
   - subject
   - activity type
   - activity date
   - outcome
   - follow-up flag
   - company
   - contact
   - task
   - opportunity
   - summary
   - raw notes
   - attachments
   - pain point links
3. Warn if activity dates differ.
4. Warn if company/contact/task/opportunity links conflict.
5. Move attachments.
6. Move pain point relationships, skipping duplicates.
7. Merge text fields safely.
8. Preserve follow-up flag if either record has it.
9. Archive duplicate.
10. Never permanently delete by default.

## Recommendation

Needs additional safeguards.

Activities should not receive merge actions until archive fields, pain point relationship movement, conflict warnings, and timeline-preservation logic are implemented.

---

# 2. Opportunities

## Existing relationships

Opportunities currently connect to:

- `companies` through `company_id`
- `contacts` through `primary_contact_id`
- `tasks` through `tasks.opportunity_id`
- `activities` through `activities.opportunity_id`
- `notes` through `notes.opportunity_id`
- `attachments` through `attachments.related_opportunity_id`
- `opportunity_stage_history` through `opportunity_stage_history.opportunity_id`
- pain points indirectly through activities linked in `pain_point_activities`

## Attachments

Opportunities use `AttachmentsSection` with:

- `relationColumn="related_opportunity_id"`

Required merge move:

- move `attachments.related_opportunity_id` from duplicate opportunity to survivor opportunity

## Timeline impact

Opportunities have a formal stage history system. This makes opportunity merge much higher risk than notes/tasks/pain points.

A bad opportunity merge can corrupt:

- pipeline stage timeline
- customer/lost history
- current lead temperature
- next step
- projected monthly value
- close date
- opportunity type
- relationship history
- assistant risk scoring

Required stage history handling:

- Move `opportunity_stage_history.opportunity_id` from duplicate to survivor.
- Preserve chronological order.
- Add a merge audit stage-history note or separate merge note.
- Do not overwrite survivor stage with duplicate stage unless user chooses field-level override.
- Display stage history side by side before merge.

## AI Assistant impact

The assistant uses opportunities for:

- hot/active opportunity recommendations
- stale opportunity detection
- alpha candidate analysis
- sales reporting
- company/contact relationship summaries
- opportunity risk logic
- task/activity relationship scoring

A wrong merge could cause the assistant to combine two different sales pursuits and generate bad sales advice.

## Relationship Graph impact

Opportunity graph paths include:

- Opportunity -> Company
- Opportunity -> Primary Contact
- Opportunity -> Tasks
- Opportunity -> Activities
- Opportunity -> Notes
- Opportunity -> Attachments
- Opportunity -> Stage History
- Opportunity -> Pain Points indirectly through linked activities

Required relationship moves:

- `tasks.opportunity_id`: duplicate -> survivor
- `activities.opportunity_id`: duplicate -> survivor
- `notes.opportunity_id`: duplicate -> survivor
- `attachments.related_opportunity_id`: duplicate -> survivor
- `opportunity_stage_history.opportunity_id`: duplicate -> survivor

Potential relationship conflicts:

- Different company IDs
- Different primary contact IDs
- Different stage
- Different lead temperature
- Different opportunity type
- Different expected close date
- Different estimated value

These should not be auto-resolved.

## Archive impact

Opportunities already support archive fields and `ArchiveRestoreButton`.

Opportunity merge should archive the duplicate opportunity, not delete it.

## Delete Manager impact

The opportunity delete page already previews linked tasks, activities, notes, and attachments and can detach related records.

Merge needs stronger behavior than delete:

- Delete can detach.
- Merge must move relationships to the survivor.
- Stage history must move and remain readable.
- Notes/tasks/activities must not be orphaned.

## Safe merge strategy

Opportunity merge should be delayed until field-level merge controls exist.

Minimum requirements:

1. Choose survivor opportunity.
2. Show side-by-side fields.
3. Show all related tasks, activities, notes, attachments, and stage history.
4. Move relationships to survivor.
5. Merge notes/next steps only by appending, not overwriting.
6. Preserve stage history.
7. Require slide-to-confirm.
8. Archive duplicate.
9. Add merge audit trail.

## Recommendation

Should remain review-only for now.

Opportunities are too central to pipeline history to merge safely without a dedicated field-level merge review and stage-history merge plan.

---

# 3. Communities

## Existing relationships

Communities currently connect to posts through:

- `posts.community_id`

Community detail pages list posts where:

- `posts.community_id = community.id`

## Attachments

There is no direct attachment relation for communities in the current `AttachmentsSection` relation type list.

Post attachments exist through:

- `attachments.related_post_id`

So community merge does not move direct community attachments, but it can affect posts and post attachments indirectly.

## Timeline impact

Communities are not currently first-class timeline records like activities or opportunities.

Timeline risk is lower than activities/opportunities.

## AI Assistant impact

The assistant uses communities as context through posts and community signals.

A bad community merge can cause:

- posts to appear under the wrong community
- social/source context to become inaccurate
- community signal summaries to blend unrelated groups

## Relationship Graph impact

Community graph path:

- Community -> Posts
- Posts -> Attachments
- Posts -> Pain Points through `pain_point_posts`

Required relationship moves:

- `posts.community_id`: duplicate community -> survivor community

Indirectly preserved:

- Post attachments stay with posts.
- Pain point post links stay with posts.

## Archive impact

Community pages do not currently show archive/restore behavior.

Before community merge actions are built:

- Confirm/add archive fields:
  - `is_archived`
  - `archived_at`
  - `archived_by`
  - `archive_reason`
- Hide archived communities by default or clearly mark them.
- Add restore support if needed.

## Delete Manager impact

Community delete currently handles related posts and post attachments. Merge should not delete posts or detach post attachments. It should move posts from the duplicate community to the survivor community.

## Safe merge strategy

Community merge is probably safe only when identity is strong.

Safe identity rules:

- Exact normalized URL match should be considered safest.
- Same platform plus same normalized name may be acceptable with user confirmation.
- Similar description alone is not enough.

Required merge behavior:

1. Choose survivor community.
2. Move `posts.community_id` from duplicate to survivor.
3. Merge blank survivor fields from duplicate only when safe:
   - platform
   - URL
   - description
   - member count
   - industry
   - location focus
   - status
   - tags
4. Archive duplicate community.
5. Do not move or detach post attachments directly.

## Recommendation

Needs additional safeguards.

Community merge is likely safe after archive fields and strict URL-based duplicate prevention are added.

---

# 4. Posts

## Existing relationships

Posts currently connect to:

- `communities` through `community_id`
- attachments through `attachments.related_post_id`
- pain points through `pain_point_posts.post_id`

Posts also store business signal fields:

- `post_url`
- `post_date`
- `original_post_text`
- `screenshot_url`
- `comment_count`
- `reaction_count`
- `share_count`
- `last_checked_date`
- `ai_summary`
- `pain_points_found`
- `leads_found`
- `follow_up_needed`
- `tags`

## Attachments

Posts use `AttachmentsSection` with:

- `relationColumn="related_post_id"`

Required merge move:

- move `attachments.related_post_id` from duplicate post to survivor post

## Timeline impact

Posts are not direct activity timeline records, but they can represent source evidence for leads, pain points, and future social monitoring.

Risk:

- Similar post text may be a repost or separate discussion, not a duplicate.
- Comment/reaction/share counts can differ by scrape time.
- Last checked date matters for future monitoring.
- Screenshot and source URL should not be lost.

## AI Assistant impact

The assistant uses posts for:

- community signals
- pain point context
- outreach ideas
- lead language
- trending pain points
- company/contact/opportunity context through pain point relationships

A bad post merge could remove evidence that a pain point came from a specific source post.

## Relationship Graph impact

Post graph paths include:

- Community -> Post
- Post -> Attachment
- Pain Point -> Post

Required relationship moves:

- `attachments.related_post_id`: duplicate -> survivor
- `pain_point_posts.post_id`: duplicate -> survivor, skipping duplicates

Potential field merge behavior:

- Keep exact `post_url` if survivor has one.
- Fill blank `post_url` from duplicate.
- Merge/append `ai_summary`, `pain_points_found`, `leads_found`, and tags.
- Preserve max known counts for comment/reaction/share count when safe.
- Preserve newest `last_checked_date`.
- Preserve screenshot URL if survivor is blank.

## Archive impact

Post pages do not currently show archive/restore behavior.

Before post merge actions are built:

- Confirm/add archive fields:
  - `is_archived`
  - `archived_at`
  - `archived_by`
  - `archive_reason`
- Hide archived posts by default or clearly mark them.
- Add restore support if needed.

## Delete Manager impact

Post delete currently detaches attachments from `related_post_id`.

Risk:

- Audit output did not show `pain_point_posts` cleanup in the post delete flow.
- If a deleted post remains referenced by `pain_point_posts`, pain point relationship graph data can become stale.

Before post merge or delete expansion:

- Add cleanup or detach behavior for `pain_point_posts.post_id`.
- Add preview counts for pain point links.

## Safe merge strategy

Post merge should require very strong identity.

Safe identity rules:

- Exact normalized `post_url` match is safest.
- Exact or near-exact `original_post_text` with same platform and same community may be acceptable.
- Similar title alone is not enough.

Required merge behavior:

1. Choose survivor post.
2. Show source URL, platform, community, original text, dates, metrics, AI summary, pain points, leads, attachments, and pain point links.
3. Move attachments.
4. Move pain point post relationships, skipping duplicates.
5. Merge text and tags by appending/deduping.
6. Keep max count values and newest last checked date.
7. Archive duplicate post.
8. Never permanently delete by default.

## Recommendation

Needs additional safeguards.

Posts can become safe to merge after archive fields, pain point relationship movement, URL-first duplicate prevention, and social-monitoring-safe metric handling are implemented.

---

# Overall V2C recommendation

Do not implement all remaining merge actions together.

Recommended order:

1. Communities
   - Lowest risk if exact URL match.
   - Move only `posts.community_id`.
   - Add archive fields first.

2. Posts
   - Moderate risk.
   - Requires moving attachments and `pain_point_posts`.
   - Must preserve metrics, source URL, screenshots, summaries, and tags.

3. Activities
   - Higher risk.
   - Timeline and historical context must be protected.
   - Requires moving attachments and `pain_point_activities`.
   - Must preserve summary/raw notes and follow-up state.

4. Opportunities
   - Highest risk.
   - Should remain review-only until a dedicated field-level merge workflow and stage-history merge plan are designed.

## Required cross-cutting safeguards before V2C implementation

- Add archive fields to activities, communities, and posts if missing.
- Add archive/restore UI support or clearly hide archived rows by default.
- Add relationship move previews for each mergeable entity.
- Add duplicate relationship prevention for join tables.
- Add conflict warnings for non-empty disagreeing relationship fields.
- Add merge audit text to survivor records.
- Keep slide-to-confirm.
- Never permanently delete by default.
- Add SQL verification queries for each implemented merge type.
- Update Delete Manager for any relationship tables currently not cleaned up:
  - `pain_point_activities.activity_id`
  - `pain_point_posts.post_id`

## Final recommendation by entity

| Entity | Final recommendation |
| --- | --- |
| Activities | Needs additional safeguards |
| Opportunities | Should remain review-only |
| Communities | Needs additional safeguards |
| Posts | Needs additional safeguards |