# Sell It UI Redesign Proposal V1

## Approved Direction

Approved design direction:

Option B1 — Compact Top Navigation + Context Sidebar

This is the preferred direction for the Sell It GUI redesign.

The design keeps Sell It powerful while making the interface cleaner, more consistent, and easier to understand.

---

## Why B1 Was Chosen

B1 is the best fit because it:

- Makes the homepage and inner pages feel like the same app.
- Reduces sidebar clutter.
- Keeps major app sections visible at the top.
- Keeps page-specific navigation in a context sidebar.
- Works better in narrower browser windows.
- Transfers well to Android and iPhone later.
- Keeps Assistant easy to access.
- Preserves all existing features.
- Avoids a full command-center rebuild too early.

---

## Core Desktop Layout

Desktop B1 uses:

Top Navigation
+
Context Sidebar
+
Main Page Content

---

## Top Navigation

The top navigation is for major app areas.

Recommended top nav:

- Dashboard
- Sales
- Intelligence
- Capture
- Management
- Assistant

Top-right utilities:

- Search
- Notifications
- User / Account
- + New

The top navigation should be consistent on every page.

---

## Context Sidebar

The context sidebar changes depending on the selected top-level section.

### Dashboard Context

The Dashboard may show a simple default sidebar:

- Dashboard
- Companies
- Contacts
- Opportunities
- Tasks
- Planner
- Team
- Activities
- Notes

This keeps the homepage useful without overwhelming the user.

### Sales Context

When the user is in Sales, the sidebar should show:

- Companies
- Contacts
- Opportunities
- Tasks
- Activities
- Notes

### Intelligence Context

When the user is in Intelligence, the sidebar should show:

- Communities
- Posts
- Pain Points
- Import Leads

### Capture Context

When the user is in Capture, the sidebar should show:

- Capture
- Email Intelligence
- Import

### Management Context

When the user is in Management, the sidebar should show:

- Team
- Merge Manager

---

## Quick Add Direction

Quick Add should no longer be a long stack of always-visible buttons.

Approved direction:

+ New

The + New button opens a compact dropdown.

Dropdown actions:

- Company
- Contact
- Opportunity
- Task
- Activity
- Note
- Community
- Post
- Pain Point

This keeps quick actions available without cluttering the sidebar.

---

## Assistant Direction

Sell It should keep two assistant concepts.

### Assistant

The full Assistant page.

Use for:

- What should I do today?
- Who needs follow-up?
- Show hot opportunities.
- Summarize my sales activity.
- Find neglected leads.

### Page Assistant

A contextual helper for the current page.

Use for:

- Summarize this page.
- What should I do next here?
- Find issues on this record.
- Draft a follow-up.
- Explain this company/contact/opportunity.

Page Assistant should stay easy to access, preferably as a small floating or docked control.

---

## Desktop Dashboard B1

The dashboard should feel like a command center but remain simple.

Recommended dashboard sections:

- Greeting
- Connected Workspace
- Logged In As
- Snapshot Cards
- Today's Tasks
- Hot Opportunities
- Recent Activity
- Global Search

Snapshot cards:

- Companies
- Contacts
- Opportunities
- Open Tasks
- Planner Today

---

## Desktop Companies Page B1

The Companies page should use:

- Top Navigation
- Sales Context Sidebar
- Page Header
- Primary Action Button
- Compact Filters
- Company List
- Pagination
- Page Assistant

The page should not need a separate Home button because Dashboard is always available in the top navigation.

---

## Mobile Translation

B1 translates well to Android and iPhone.

Desktop:

Top nav + context sidebar

Tablet:

Top nav + collapsible context sidebar

Phone:

Bottom tab navigation + focused screens

---

## Recommended Mobile Bottom Tabs

For Android and iPhone:

- Dashboard
- Sales
- Capture
- Planner
- Assistant

These are the most important daily-use areas.

---

## Mobile Sales Screen

The Sales tab should contain:

- Companies
- Contacts
- Opportunities
- Tasks
- Activities
- Notes

On mobile, these should appear as clean rows, cards, or segmented navigation instead of a desktop sidebar.

---

## Mobile Companies Screen

The mobile Companies page should include:

- Companies title
- + Add Company
- Search
- Filter chips
- Company cards
- Bottom navigation

Company rows should be thumb-friendly and show only the most important information:

- Company Name
- Lead Temperature
- Location
- Phone

Full details belong on the company detail page.

---

## Implementation Strategy

Do not rebuild the entire app at once.

Recommended order:

### Phase 1 — Planning

Create this proposal file and commit it.

### Phase 2 — Shared Shell

Create a shared app shell that can be used across pages.

The shared shell should control:

- Top navigation
- Context sidebar
- Page Assistant placement
- User/account area
- + New dropdown

### Phase 3 — Homepage + Companies First

Apply the new B1 shell only to:

- Dashboard
- Companies

This lets us test the design before touching every page.

### Phase 4 — Sales Pages

Apply the same shell to:

- Contacts
- Opportunities
- Tasks
- Activities
- Notes

### Phase 5 — Other Sections

Apply the same pattern to:

- Communities
- Posts
- Pain Points
- Capture
- Email Intelligence
- Import
- Import Leads
- Team
- Merge Manager
- Assistant

### Phase 6 — Mobile Later

Do not build mobile yet.

For now, the web app should be responsive enough that it does not break on narrow browser windows.

Android and iPhone app design should use the B1 mobile translation later.

---

## Rules For Implementation

Do not:

- Remove existing features
- Rename routes yet
- Change database schema
- Change AI logic
- Change import behavior
- Change capture behavior
- Change assistant behavior
- Rebuild every page at once

Do:

- Create one shared navigation system
- Make homepage and inner pages consistent
- Reduce quick-add clutter
- Keep Assistant visible
- Keep Page Assistant available
- Preserve all existing routes
- Improve narrow-window usability
- Test after each phase

---

## Final Approved Design Direction

Sell It GUI Redesign V1 = B1
Compact Top Navigation + Context Sidebar

The first implementation target should be:

Dashboard + Companies only

After that works, the same shell can be rolled out page by page.
