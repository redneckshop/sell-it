"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  companies: { name: string | null } | null;
};

type Opportunity = {
  id: string;
  name: string;
  opportunity_type: string | null;
  stage: string | null;
  lead_temperature: string | null;
  estimated_driver_count: number | null;
  estimated_monthly_value: number | null;
  expected_close_date: string | null;
  next_step: string | null;
  company_id: string | null;
  primary_contact_id: string | null;
  created_at: string | null;
  companies: { name: string | null } | null;
  primary_contact: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  company_id: string | null;
  contact_id: string | null;
  companies: { name: string | null } | null;
  contacts: { first_name: string | null; last_name: string | null } | null;
};

type Activity = {
  id: string;
  subject: string;
  activity_type: string | null;
  activity_date: string | null;
  summary: string | null;
  outcome: string | null;
  follow_up_needed: boolean | null;
  company_id: string | null;
  contact_id: string | null;
  companies: { name: string | null } | null;
  contacts: { first_name: string | null; last_name: string | null } | null;
};

type Note = {
  id: string;
  title: string;
  body: string | null;
  source: string | null;
  source_url: string | null;
  tags: string | null;
  created_at: string | null;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
};

type PainPoint = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string | null;
};

type Post = {
  id: string;
  title: string;
  platform: string | null;
  post_type: string | null;
  post_url: string | null;
  post_date: string | null;
  original_post_text: string | null;
  comment_count: number | null;
  reaction_count: number | null;
  share_count: number | null;
  ai_summary: string | null;
  pain_points_found: string | null;
  leads_found: string | null;
  follow_up_needed: boolean | null;
  tags: string | null;
  community_id: string | null;
  created_at: string | null;
  communities: { name: string | null; platform: string | null } | null;
};

type Community = {
  id: string;
  name: string;
  platform: string | null;
  url: string | null;
  description: string | null;
  member_count: number | null;
  industry: string | null;
  location_focus: string | null;
  status: string | null;
  relevance_score: number | null;
  tags: string | null;
  created_at: string | null;
};

type Attachment = {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  storage_path: string | null;
  description: string | null;
  created_at: string | null;
  uploaded_by: string | null;
  related_company_id: string | null;
  related_contact_id: string | null;
  related_opportunity_id: string | null;
  related_task_id: string | null;
  related_activity_id: string | null;
  related_note_id: string | null;
  related_post_id: string | null;
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "12px 18px",
  borderRadius: "6px",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  marginBottom: "16px",
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "No value";
  return `$${Number(value).toLocaleString()}`;
}

function fullContactName(contact: {
  first_name: string | null;
  last_name: string | null;
}) {
  return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
}

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(value: string | null | undefined, maxLength = 170) {
  if (!value) return "";

  const cleaned = value.replace(/\s+/g, " ").trim();

  if (cleaned.length <= maxLength) return cleaned;

  return `${cleaned.slice(0, maxLength)}...`;
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();

  for (const row of rows) {
    map.set(row.id, row);
  }

  return Array.from(map.values());
}

function idsFromRows(rows: { id: string }[]) {
  return rows.map((row) => row.id).filter(Boolean);
}

function dedupeStrings(rows: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const row of rows) {
    const key = normalizeText(row);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(row);
  }

  return result;
}

function getNameFromQuestion(question: string) {
  let clean = question.trim();

  const patterns = [
    /tell me everything we know about (.+)\??/i,
    /tell me everything about (.+)\??/i,
    /what do we know about (.+)\??/i,
    /business memory for (.+)\??/i,
    /business memory about (.+)\??/i,
    /company memory for (.+)\??/i,
    /company memory about (.+)\??/i,
    /contact memory for (.+)\??/i,
    /contact memory about (.+)\??/i,
    /pain point memory for (.+)\??/i,
    /pain point memory about (.+)\??/i,
    /opportunity memory for (.+)\??/i,
    /opportunity memory about (.+)\??/i,
    /what happened with (.+)\??/i,
    /what happened at (.+)\??/i,
    /show me (.+)\??/i,
    /look up (.+)\??/i,
    /lookup (.+)\??/i,
    /find (.+)\??/i,
    /about (.+)\??/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);

    if (match?.[1]) {
      clean = match[1];
      break;
    }
  }

  return clean
    .replace(/\?$/g, "")
    .replace(/\bcompany memory\b/gi, "")
    .replace(/\bcontact memory\b/gi, "")
    .replace(/\bpain point memory\b/gi, "")
    .replace(/\bopportunity memory\b/gi, "")
    .replace(/\bbusiness memory\b/gi, "")
    .replace(/\bcompany\b/gi, "")
    .replace(/\bcontact\b/gi, "")
    .replace(/\bopportunity\b/gi, "")
    .replace(/\bpain point\b/gi, "")
    .replace(/\breport\b/gi, "")
    .trim();
}

function section(title: string, body: string) {
  return `\n\n${title}\n${body}`;
}

function isRealPainPoint(painPoint: PainPoint) {
  const name = normalizeText(painPoint.name);
  const description = normalizeText(painPoint.description);
  const text = `${name} ${description}`;

  const alwaysReal = [
    "need trucks",
    "lack of trucks",
    "dispatch confusion",
    "paper tickets",
    "paperwork",
    "billing delays",
    "driver accountability",
    "driver call outs",
    "equipment availability",
    "lost tickets",
    "slow paperwork",
    "hauling capacity",
    "not enough trucks",
    "need drivers",
    "driver shortage",
    "missed loads",
    "missed work",
  ];

  if (alwaysReal.some((phrase) => text.includes(phrase))) {
    return true;
  }

  const falsePainSignals = [
    "broker agreement",
    "hold harmless",
    "liability",
    "automobile liability",
    "insurance",
    "carrier assumes",
    "carrier required",
    "carrier liable",
    "carrier to provide",
    "special job site",
    "twic",
    "court order",
    "payment made directly",
    "own expense",
    "defective work",
    "claims",
    "federal tax id",
    "usdot",
    "mc",
    "permits",
    "additional insured",
    "billing and payment terms",
    "knotty logistics llp and three t trucking",
  ];

  if (falsePainSignals.some((phrase) => text.includes(phrase))) {
    return false;
  }

  if (name === "000" || name.length < 4) {
    return false;
  }

  if (name.includes("fleet upgrade")) {
    return false;
  }

  return true;
}

function taskLine(task: Task) {
  const company = task.companies?.name ? ` - ${task.companies.name}` : "";
  const contact = task.contacts?.first_name
    ? ` - ${fullContactName({
        first_name: task.contacts.first_name,
        last_name: task.contacts.last_name,
      })}`
    : "";

  return `- ${task.title}${company}${contact}
  Status: ${task.status || "Unknown"} | Priority: ${
    task.priority || "Normal"
  } | Due: ${formatDate(task.due_date)}`;
}

function opportunityLine(opportunity: Opportunity) {
  const company = opportunity.companies?.name
    ? ` - ${opportunity.companies.name}`
    : "";

  const primaryContact = opportunity.primary_contact?.first_name
    ? ` | Contact: ${fullContactName({
        first_name: opportunity.primary_contact.first_name,
        last_name: opportunity.primary_contact.last_name,
      })}`
    : "";

  return `- ${opportunity.name}${company}
  Stage: ${opportunity.stage || "Unknown"} | Temperature: ${
    opportunity.lead_temperature || "Unknown"
  } | Value: ${formatMoney(opportunity.estimated_monthly_value)}${primaryContact}
  Next Step: ${opportunity.next_step || "None saved"}`;
}

function activityLine(activity: Activity) {
  return `- ${activity.subject}
  Type: ${activity.activity_type || "Unknown"} | Outcome: ${
    activity.outcome || "None"
  } | Date: ${formatDate(activity.activity_date)}
  ${shortText(activity.summary, 190) || "No summary saved."}`;
}

function noteLine(note: Note) {
  return `- ${note.title}
  ${shortText(note.body, 190) || "No note body saved."}`;
}

function painPointLine(painPoint: PainPoint) {
  return `- ${painPoint.name}
  Category: ${painPoint.category || "None"}${
    painPoint.description ? ` | ${shortText(painPoint.description, 140)}` : ""
  }`;
}

function postLine(post: Post) {
  const community = post.communities?.name
    ? ` | Community: ${post.communities.name}`
    : "";

  return `- ${post.title}${community}
  Platform: ${post.platform || "Unknown"} | Follow-up: ${
    post.follow_up_needed ? "Yes" : "No"
  }
  ${shortText(post.ai_summary || post.original_post_text, 170) || "No summary saved."}`;
}

function attachmentLine(attachment: Attachment) {
  return `- ${attachment.file_name}
  Type: ${attachment.file_type || "Unknown"} | Created: ${formatDate(
    attachment.created_at
  )}${attachment.description ? ` | ${shortText(attachment.description, 90)}` : ""}`;
}

function contactLine(contact: Contact) {
  return `- ${fullContactName(contact)}
  Company: ${contact.companies?.name || "No company"} | Title: ${
    contact.title || "No title"
  } | Phone: ${contact.phone || "No phone"} | Email: ${contact.email || "No email"}`;
}

function communityLine(community: Community) {
  return `- ${community.name}
  Platform: ${community.platform || "Unknown"} | Industry: ${
    community.industry || "Unknown"
  } | Location: ${community.location_focus || "Unknown"} | Relevance: ${
    community.relevance_score ?? "Not scored"
  }`;
}

function dataGapLine(label: string, isMissing: boolean) {
  return isMissing ? `- ${label}` : "";
}

async function findCompanyByName(searchName: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email")
    .ilike("name", `%${searchName}%`)
    .limit(1);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Company[])[0] ?? null;
}

async function findPainPointByName(searchName: string) {
  const { data, error } = await supabase
    .from("pain_points")
    .select("id, name, category, description, created_at")
    .ilike("name", `%${searchName}%`)
    .limit(10);

  if (error) throw new Error(error.message);

  const painPoints = ((data ?? []) as unknown as PainPoint[]).filter(isRealPainPoint);

  return painPoints[0] ?? null;
}

async function findOpportunityByName(searchName: string) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .ilike("name", `%${searchName}%`)
    .limit(1);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Opportunity[])[0] ?? null;
}

async function findContactByName(searchName: string) {
  const terms = searchName.toLowerCase().split(/\s+/).filter(Boolean);

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, title, email, phone, company_id, companies(name)"
    )
    .limit(250);

  if (error) throw new Error(error.message);

  const contacts = ((data ?? []) as unknown as Contact[]).filter((contact) => {
    const fullName = `${contact.first_name} ${
      contact.last_name || ""
    }`.toLowerCase();

    return terms.every((term) => fullName.includes(term));
  });

  return contacts[0] ?? null;
}

async function loadContactsForCompany(companyId: string) {
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, title, email, phone, company_id, companies(name)"
    )
    .eq("company_id", companyId)
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Contact[];
}

async function loadCompaniesByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email")
    .in("id", ids)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Company[];
}

async function loadContactsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, title, email, phone, company_id, companies(name)"
    )
    .in("id", ids)
    .order("first_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Contact[];
}

async function loadOpportunitiesForCompany(companyId: string) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Opportunity[];
}

async function loadOpportunitiesForCompanyOrContact(
  companyIds: string[],
  contactIds: string[]
) {
  const rows: Opportunity[] = [];

  if (companyIds.length > 0) {
    const { data, error } = await supabase
      .from("opportunities")
      .select(
        `
        id,
        name,
        opportunity_type,
        stage,
        lead_temperature,
        estimated_driver_count,
        estimated_monthly_value,
        expected_close_date,
        next_step,
        company_id,
        primary_contact_id,
        created_at,
        companies(name),
        primary_contact:contacts!opportunities_primary_contact_id_fkey (
          first_name,
          last_name
        )
      `
      )
      .in("company_id", companyIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Opportunity[]));
  }

  if (contactIds.length > 0) {
    const { data, error } = await supabase
      .from("opportunities")
      .select(
        `
        id,
        name,
        opportunity_type,
        stage,
        lead_temperature,
        estimated_driver_count,
        estimated_monthly_value,
        expected_close_date,
        next_step,
        company_id,
        primary_contact_id,
        created_at,
        companies(name),
        primary_contact:contacts!opportunities_primary_contact_id_fkey (
          first_name,
          last_name
        )
      `
      )
      .in("primary_contact_id", contactIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Opportunity[]));
  }

  return uniqueById(rows);
}

async function loadTasksForCompanyOrContact(
  companyIds: string[],
  contactIds: string[]
) {
  const rows: Task[] = [];

  if (companyIds.length > 0) {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, due_date, priority, status, company_id, contact_id, companies(name), contacts(first_name, last_name)"
      )
      .in("company_id", companyIds)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Task[]));
  }

  if (contactIds.length > 0) {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, due_date, priority, status, company_id, contact_id, companies(name), contacts(first_name, last_name)"
      )
      .in("contact_id", contactIds)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Task[]));
  }

  return uniqueById(rows);
}

async function loadActivitiesForCompanyOrContact(
  companyIds: string[],
  contactIds: string[]
) {
  const rows: Activity[] = [];

  if (companyIds.length > 0) {
    const { data, error } = await supabase
      .from("activities")
      .select(
        "id, subject, activity_type, activity_date, summary, outcome, follow_up_needed, company_id, contact_id, companies(name), contacts(first_name, last_name)"
      )
      .in("company_id", companyIds)
      .order("activity_date", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Activity[]));
  }

  if (contactIds.length > 0) {
    const { data, error } = await supabase
      .from("activities")
      .select(
        "id, subject, activity_type, activity_date, summary, outcome, follow_up_needed, company_id, contact_id, companies(name), contacts(first_name, last_name)"
      )
      .in("contact_id", contactIds)
      .order("activity_date", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Activity[]));
  }

  return uniqueById(rows);
}

async function loadNotesForCompanyContactOpportunity(
  companyIds: string[],
  contactIds: string[],
  opportunityIds: string[]
) {
  const rows: Note[] = [];

  if (companyIds.length > 0) {
    const { data, error } = await supabase
      .from("notes")
      .select(
        "id, title, body, source, source_url, tags, created_at, company_id, contact_id, opportunity_id"
      )
      .in("company_id", companyIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Note[]));
  }

  if (contactIds.length > 0) {
    const { data, error } = await supabase
      .from("notes")
      .select(
        "id, title, body, source, source_url, tags, created_at, company_id, contact_id, opportunity_id"
      )
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Note[]));
  }

  if (opportunityIds.length > 0) {
    const { data, error } = await supabase
      .from("notes")
      .select(
        "id, title, body, source, source_url, tags, created_at, company_id, contact_id, opportunity_id"
      )
      .in("opportunity_id", opportunityIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Note[]));
  }

  return uniqueById(rows);
}

async function loadPainPointsForRecord(
  linkTable: string,
  recordColumn: string,
  recordId: string
) {
  const { data: linkRows, error: linkError } = await supabase
    .from(linkTable)
    .select("pain_point_id")
    .eq(recordColumn, recordId);

  if (linkError) throw new Error(linkError.message);

  const painPointIds = ((linkRows ?? []) as { pain_point_id: string }[]).map(
    (row) => row.pain_point_id
  );

  if (painPointIds.length === 0) return [];

  const { data: painPointRows, error: painPointError } = await supabase
    .from("pain_points")
    .select("id, name, category, description, created_at")
    .in("id", painPointIds)
    .order("name", { ascending: true });

  if (painPointError) throw new Error(painPointError.message);

  return ((painPointRows ?? []) as unknown as PainPoint[]).filter(isRealPainPoint);
}

async function loadPainPointLinkedIds(painPointId: string) {
  const [companyLinks, contactLinks, activityLinks, postLinks] =
    await Promise.all([
      supabase
        .from("pain_point_companies")
        .select("company_id")
        .eq("pain_point_id", painPointId),
      supabase
        .from("pain_point_contacts")
        .select("contact_id")
        .eq("pain_point_id", painPointId),
      supabase
        .from("pain_point_activities")
        .select("activity_id")
        .eq("pain_point_id", painPointId),
      supabase
        .from("pain_point_posts")
        .select("post_id")
        .eq("pain_point_id", painPointId),
    ]);

  if (companyLinks.error) throw new Error(companyLinks.error.message);
  if (contactLinks.error) throw new Error(contactLinks.error.message);
  if (activityLinks.error) throw new Error(activityLinks.error.message);
  if (postLinks.error) throw new Error(postLinks.error.message);

  return {
    companyIds: ((companyLinks.data ?? []) as { company_id: string }[]).map(
      (row) => row.company_id
    ),
    contactIds: ((contactLinks.data ?? []) as { contact_id: string }[]).map(
      (row) => row.contact_id
    ),
    activityIds: ((activityLinks.data ?? []) as { activity_id: string }[]).map(
      (row) => row.activity_id
    ),
    postIds: ((postLinks.data ?? []) as { post_id: string }[]).map(
      (row) => row.post_id
    ),
  };
}

async function loadActivitiesByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("activities")
    .select(
      "id, subject, activity_type, activity_date, summary, outcome, follow_up_needed, company_id, contact_id, companies(name), contacts(first_name, last_name)"
    )
    .in("id", ids)
    .order("activity_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Activity[];
}

async function loadPostsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, platform, post_type, post_url, post_date, original_post_text, comment_count, reaction_count, share_count, ai_summary, pain_points_found, leads_found, follow_up_needed, tags, community_id, created_at, communities(name, platform)"
    )
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Post[];
}

async function loadPostsFromPainPoints(painPointIds: string[]) {
  if (painPointIds.length === 0) return [];

  const { data: linkRows, error: linkError } = await supabase
    .from("pain_point_posts")
    .select("post_id")
    .in("pain_point_id", painPointIds);

  if (linkError) throw new Error(linkError.message);

  const postIds = ((linkRows ?? []) as { post_id: string }[]).map(
    (row) => row.post_id
  );

  return loadPostsByIds(postIds);
}

async function loadCommunitiesFromPosts(posts: Post[]) {
  const communityIds = posts
    .map((post) => post.community_id)
    .filter((id): id is string => Boolean(id));

  if (communityIds.length === 0) return [];

  const { data, error } = await supabase
    .from("communities")
    .select(
      "id, name, platform, url, description, member_count, industry, location_focus, status, relevance_score, tags, created_at"
    )
    .in("id", communityIds)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return uniqueById((data ?? []) as unknown as Community[]);
}

async function loadAttachmentsByRelation(column: string, ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("attachments")
    .select(
      "id, file_name, file_type, file_url, storage_path, description, created_at, uploaded_by, related_company_id, related_contact_id, related_opportunity_id, related_task_id, related_activity_id, related_note_id, related_post_id"
    )
    .in(column, ids)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Attachment[];
}

async function loadAttachmentsForMemory(input: {
  companyIds?: string[];
  contactIds?: string[];
  opportunityIds?: string[];
  taskIds?: string[];
  activityIds?: string[];
  noteIds?: string[];
  postIds?: string[];
}) {
  const attachments = [
    ...(await loadAttachmentsByRelation(
      "related_company_id",
      input.companyIds ?? []
    )),
    ...(await loadAttachmentsByRelation(
      "related_contact_id",
      input.contactIds ?? []
    )),
    ...(await loadAttachmentsByRelation(
      "related_opportunity_id",
      input.opportunityIds ?? []
    )),
    ...(await loadAttachmentsByRelation("related_task_id", input.taskIds ?? [])),
    ...(await loadAttachmentsByRelation(
      "related_activity_id",
      input.activityIds ?? []
    )),
    ...(await loadAttachmentsByRelation("related_note_id", input.noteIds ?? [])),
    ...(await loadAttachmentsByRelation("related_post_id", input.postIds ?? [])),
  ];

  return uniqueById(attachments);
}

function buildKnowledgeHighlights(activities: Activity[], notes: Note[]) {
  const activityLines = activities
    .slice(0, 8)
    .map((activity) => shortText(activity.summary || activity.subject, 160))
    .filter(Boolean);

  const noteLines = notes
    .slice(0, 8)
    .map((note) => shortText(note.body || note.title, 160))
    .filter(Boolean);

  return dedupeStrings([...activityLines, ...noteLines]).slice(0, 6);
}

function limitedList<T>(
  rows: T[],
  formatter: (row: T) => string,
  emptyText: string,
  limit = 5
) {
  if (rows.length === 0) return emptyText;

  const shown = rows.slice(0, limit).map(formatter).join("\n\n");
  const remaining = rows.length - limit;

  if (remaining > 0) {
    return `${shown}\n\n- ${remaining} more not shown in summary mode.`;
  }

  return shown;
}

async function answerCompanyMemory(userQuestion: string) {
  const searchName = getNameFromQuestion(userQuestion);
  const company = await findCompanyByName(searchName);

  if (!company) {
    return `I could not find a company matching "${searchName}".`;
  }

  const companyIds = [company.id];
  const contacts = await loadContactsForCompany(company.id);
  const contactIds = idsFromRows(contacts);
  const opportunities = await loadOpportunitiesForCompany(company.id);
  const opportunityIds = idsFromRows(opportunities);
  const tasks = await loadTasksForCompanyOrContact(companyIds, []);
  const activities = await loadActivitiesForCompanyOrContact(companyIds, []);
  const notes = await loadNotesForCompanyContactOpportunity(
    companyIds,
    [],
    opportunityIds
  );

  const painPoints = await loadPainPointsForRecord(
    "pain_point_companies",
    "company_id",
    company.id
  );

  const posts = await loadPostsFromPainPoints(idsFromRows(painPoints));
  const communities = await loadCommunitiesFromPosts(posts);

  const attachments = await loadAttachmentsForMemory({
    companyIds,
    contactIds,
    opportunityIds,
    taskIds: idsFromRows(tasks),
    activityIds: idsFromRows(activities),
    noteIds: idsFromRows(notes),
    postIds: idsFromRows(posts),
  });

  const openTasks = tasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const followUpActivities = activities.filter(
    (activity) => activity.follow_up_needed
  );

  const hotOpportunities = opportunities.filter(
    (opportunity) =>
      opportunity.lead_temperature === "Hot" ||
      opportunity.lead_temperature === "Active"
  );

  const knowledgeHighlights = buildKnowledgeHighlights(activities, notes);

  let answer = `BUSINESS MEMORY REPORT\nSubject: ${company.name}\nRecord Type: Company\nMode: Summary first. Long/repetitive records are capped.`;

  answer += section(
    "Executive Snapshot",
    [
      `- Contacts: ${contacts.length}`,
      `- Opportunities: ${opportunities.length}`,
      `- Hot / Active Opportunities: ${hotOpportunities.length}`,
      `- Open Tasks: ${openTasks.length}`,
      `- Follow-up Activities: ${followUpActivities.length}`,
      `- Real Pain Points: ${painPoints.length}`,
      `- Notes / Activities: ${notes.length + activities.length}`,
      `- Attachments: ${attachments.length}`,
    ].join("\n")
  );

  answer += section(
    "Company Profile",
    `- Website: ${company.website || "Not saved"}
- Phone: ${company.phone || "Not saved"}
- Email: ${company.email || "Not saved"}`
  );

  answer += section(
    "What Matters Most",
    [
      hotOpportunities[0]
        ? `- Strongest opportunity: ${hotOpportunities[0].name} (${hotOpportunities[0].lead_temperature})`
        : "",
      openTasks[0] ? `- Next task: ${openTasks[0].title}` : "",
      followUpActivities[0]
        ? `- Recent follow-up signal: ${followUpActivities[0].subject}`
        : "",
      painPoints[0] ? `- Main pain point: ${painPoints[0].name}` : "",
      contacts[0] ? `- Main known contact: ${fullContactName(contacts[0])}` : "",
    ]
      .filter(Boolean)
      .join("\n") || "- No strong business signal found yet."
  );

  answer += section(
    "People",
    limitedList(contacts, contactLine, "- No contacts linked yet.", 5)
  );

  answer += section(
    "Pipeline",
    limitedList(
      opportunities,
      opportunityLine,
      "- No opportunities linked yet.",
      5
    )
  );

  answer += section(
    "Follow-up",
    limitedList(openTasks, taskLine, "- No open tasks linked yet.", 5)
  );

  answer += section(
    "Real Pain Points",
    limitedList(
      painPoints,
      painPointLine,
      "- No real operational/business pain points linked yet.",
      6
    )
  );

  answer += section(
    "Knowledge Highlights",
    knowledgeHighlights.length > 0
      ? knowledgeHighlights.map((item) => `- ${item}`).join("\n")
      : "- No useful notes or activity summaries found yet."
  );

  answer += section(
    "Posts / Community Signals",
    posts.length > 0
      ? `${limitedList(posts, postLine, "", 3)}${
          communities.length > 0
            ? `\n\nCommunities:\n${limitedList(communities, communityLine, "", 3)}`
            : ""
        }`
      : "- No related posts found through real pain points."
  );

  answer += section(
    "Attachments",
    limitedList(attachments, attachmentLine, "- No attachments found.", 5)
  );

  answer += section(
    "Recommended Next Actions",
    [
      openTasks[0] ? `- Work next task: ${openTasks[0].title}` : "",
      followUpActivities[0]
        ? `- Follow up from activity: ${followUpActivities[0].subject}`
        : "",
      hotOpportunities[0]?.next_step
        ? `- Opportunity next step: ${hotOpportunities[0].next_step}`
        : "",
      contacts.length === 0
        ? "- Add a decision-maker or point of contact."
        : "",
      openTasks.length === 0 && opportunities.length > 0
        ? "- Create a follow-up task for the active opportunity."
        : "",
    ]
      .filter(Boolean)
      .join("\n") || "- No obvious next action found."
  );

  answer += section(
    "Data Gaps",
    [
      dataGapLine("Company website is missing.", !company.website),
      dataGapLine("Company email is missing.", !company.email),
      dataGapLine("No contacts are linked.", contacts.length === 0),
      dataGapLine("No open tasks are linked.", openTasks.length === 0),
      dataGapLine("No real pain points are linked.", painPoints.length === 0),
    ]
      .filter(Boolean)
      .join("\n") || "- No major gaps detected."
  );

  return answer;
}

async function answerContactMemory(userQuestion: string) {
  const searchName = getNameFromQuestion(userQuestion);
  const contact = await findContactByName(searchName);

  if (!contact) {
    return `I could not find a contact matching "${searchName}".`;
  }

  const companyIds = contact.company_id ? [contact.company_id] : [];
  const contactIds = [contact.id];

  const companies = await loadCompaniesByIds(companyIds);
  const opportunities = await loadOpportunitiesForCompanyOrContact([], contactIds);
  const tasks = await loadTasksForCompanyOrContact([], contactIds);
  const activities = await loadActivitiesForCompanyOrContact([], contactIds);
  const notes = await loadNotesForCompanyContactOpportunity([], contactIds, idsFromRows(opportunities));

  const painPoints = await loadPainPointsForRecord(
    "pain_point_contacts",
    "contact_id",
    contact.id
  );

  const posts = await loadPostsFromPainPoints(idsFromRows(painPoints));
  const communities = await loadCommunitiesFromPosts(posts);

  const attachments = await loadAttachmentsForMemory({
    companyIds,
    contactIds,
    opportunityIds: idsFromRows(opportunities),
    taskIds: idsFromRows(tasks),
    activityIds: idsFromRows(activities),
    noteIds: idsFromRows(notes),
    postIds: idsFromRows(posts),
  });

  const openTasks = tasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const followUpActivities = activities.filter(
    (activity) => activity.follow_up_needed
  );

  const knowledgeHighlights = buildKnowledgeHighlights(activities, notes);

  let answer = `BUSINESS MEMORY REPORT\nSubject: ${fullContactName(contact)}\nRecord Type: Contact\nMode: Summary first. Long/repetitive records are capped.`;

  answer += section(
    "Executive Snapshot",
    [
      `- Company: ${contact.companies?.name || "No company linked"}`,
      `- Title: ${contact.title || "No title saved"}`,
      `- Opportunities: ${opportunities.length}`,
      `- Open Tasks: ${openTasks.length}`,
      `- Follow-up Activities: ${followUpActivities.length}`,
      `- Real Pain Points: ${painPoints.length}`,
      `- Attachments: ${attachments.length}`,
    ].join("\n")
  );

  answer += section(
    "Contact Profile",
    `- Phone: ${contact.phone || "Not saved"}
- Email: ${contact.email || "Not saved"}
- Company: ${contact.companies?.name || "Not linked"}`
  );

  answer += section(
    "Company Context",
    companies.length > 0
      ? companies
          .map(
            (company) => `- ${company.name}
  Website: ${company.website || "Not saved"} | Phone: ${
              company.phone || "Not saved"
            } | Email: ${company.email || "Not saved"}`
          )
          .join("\n\n")
      : "- No company context found."
  );

  answer += section(
    "Pipeline",
    limitedList(opportunities, opportunityLine, "- No opportunities linked.", 5)
  );

  answer += section(
    "Follow-up",
    limitedList(openTasks, taskLine, "- No open tasks linked.", 5)
  );

  answer += section(
    "Real Pain Points",
    limitedList(
      painPoints,
      painPointLine,
      "- No real pain points linked.",
      5
    )
  );

  answer += section(
    "Knowledge Highlights",
    knowledgeHighlights.length > 0
      ? knowledgeHighlights.map((item) => `- ${item}`).join("\n")
      : "- No useful notes or activity summaries found yet."
  );

  answer += section(
    "Posts / Community Signals",
    posts.length > 0
      ? `${limitedList(posts, postLine, "", 3)}${
          communities.length > 0
            ? `\n\nCommunities:\n${limitedList(communities, communityLine, "", 3)}`
            : ""
        }`
      : "- No related posts found through real pain points."
  );

  answer += section(
    "Attachments",
    limitedList(attachments, attachmentLine, "- No attachments found.", 5)
  );

  answer += section(
    "Recommended Next Actions",
    [
      openTasks[0] ? `- Work next task: ${openTasks[0].title}` : "",
      followUpActivities[0]
        ? `- Follow up from activity: ${followUpActivities[0].subject}`
        : "",
      opportunities[0]?.next_step
        ? `- Opportunity next step: ${opportunities[0].next_step}`
        : "",
      !contact.phone && !contact.email
        ? "- Add direct contact information before future follow-up."
        : "",
    ]
      .filter(Boolean)
      .join("\n") || "- No obvious next action found."
  );

  return answer;
}

async function answerPainPointMemory(userQuestion: string) {
  const searchName = getNameFromQuestion(userQuestion);
  const painPoint = await findPainPointByName(searchName);

  if (!painPoint) {
    return `I could not find a real pain point matching "${searchName}". Contract clauses, insurance terms, and broker agreement language are intentionally ignored.`;
  }

  const linkedIds = await loadPainPointLinkedIds(painPoint.id);

  const companies = await loadCompaniesByIds(linkedIds.companyIds);
  const contacts = await loadContactsByIds(linkedIds.contactIds);
  const activities = await loadActivitiesByIds(linkedIds.activityIds);
  const posts = await loadPostsByIds(linkedIds.postIds);
  const communities = await loadCommunitiesFromPosts(posts);

  const companyIds = idsFromRows(companies);
  const contactIds = idsFromRows(contacts);

  const opportunities = await loadOpportunitiesForCompanyOrContact(
    companyIds,
    contactIds
  );
  const tasks = await loadTasksForCompanyOrContact(companyIds, contactIds);
  const notes = await loadNotesForCompanyContactOpportunity(
    companyIds,
    contactIds,
    idsFromRows(opportunities)
  );

  const attachments = await loadAttachmentsForMemory({
    companyIds,
    contactIds,
    opportunityIds: idsFromRows(opportunities),
    taskIds: idsFromRows(tasks),
    activityIds: idsFromRows(activities),
    noteIds: idsFromRows(notes),
    postIds: idsFromRows(posts),
  });

  const openTasks = tasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const knowledgeHighlights = buildKnowledgeHighlights(activities, notes);

  let answer = `BUSINESS MEMORY REPORT\nSubject: ${painPoint.name}\nRecord Type: Real Pain Point\nMode: Summary first. Long/repetitive records are capped.`;

  answer += section(
    "Definition",
    `- Category: ${painPoint.category || "None"}
- Meaning: ${
      painPoint.description ||
      "A negative problem, need, obstacle, or frustration affecting a person or business."
    }`
  );

  answer += section(
    "Executive Snapshot",
    [
      `- Linked Companies: ${companies.length}`,
      `- Linked Contacts: ${contacts.length}`,
      `- Related Opportunities: ${opportunities.length}`,
      `- Open Tasks: ${openTasks.length}`,
      `- Related Posts: ${posts.length}`,
      `- Attachments: ${attachments.length}`,
    ].join("\n")
  );

  answer += section(
    "Companies With This Pain",
    limitedList(
      companies,
      (company) => `- ${company.name}
  Phone: ${company.phone || "No phone"} | Email: ${company.email || "No email"}`,
      "- No companies linked.",
      5
    )
  );

  answer += section(
    "Contacts With This Pain",
    limitedList(contacts, contactLine, "- No contacts linked.", 5)
  );

  answer += section(
    "Related Pipeline",
    limitedList(
      opportunities,
      opportunityLine,
      "- No related opportunities found.",
      5
    )
  );

  answer += section(
    "Follow-up",
    limitedList(openTasks, taskLine, "- No open follow-up tasks found.", 5)
  );

  answer += section(
    "Knowledge Highlights",
    knowledgeHighlights.length > 0
      ? knowledgeHighlights.map((item) => `- ${item}`).join("\n")
      : "- No useful notes or activity summaries found yet."
  );

  answer += section(
    "Posts / Community Signals",
    posts.length > 0
      ? `${limitedList(posts, postLine, "", 3)}${
          communities.length > 0
            ? `\n\nCommunities:\n${limitedList(communities, communityLine, "", 3)}`
            : ""
        }`
      : "- No posts linked."
  );

  answer += section(
    "Attachments",
    limitedList(attachments, attachmentLine, "- No attachments found.", 5)
  );

  answer += section(
    "Recommended Next Actions",
    [
      companies.length > 0
        ? "- Review linked companies and decide which are the strongest prospects."
        : "",
      contacts.length > 0
        ? "- Follow up with the best contact tied to this problem."
        : "",
      posts.length > 0
        ? "- Review related posts for lead language and urgency."
        : "",
      openTasks[0] ? `- Work next task: ${openTasks[0].title}` : "",
      companies.length === 0 && contacts.length === 0
        ? "- Link this pain point to companies, contacts, posts, or activities."
        : "",
    ]
      .filter(Boolean)
      .join("\n") || "- No obvious next action found."
  );

  return answer;
}

async function answerOpportunityMemory(userQuestion: string) {
  const searchName = getNameFromQuestion(userQuestion);
  const opportunity = await findOpportunityByName(searchName);

  if (!opportunity) {
    return `I could not find an opportunity matching "${searchName}".`;
  }

  const companyIds = opportunity.company_id ? [opportunity.company_id] : [];
  const contactIds = opportunity.primary_contact_id
    ? [opportunity.primary_contact_id]
    : [];

  const companies = await loadCompaniesByIds(companyIds);
  const contacts = await loadContactsByIds(contactIds);
  const tasks = await loadTasksForCompanyOrContact(companyIds, contactIds);
  const activities = await loadActivitiesForCompanyOrContact(
    companyIds,
    contactIds
  );
  const notes = await loadNotesForCompanyContactOpportunity(
    companyIds,
    contactIds,
    [opportunity.id]
  );

  const companyPainPoints =
    companyIds.length > 0
      ? await loadPainPointsForRecord(
          "pain_point_companies",
          "company_id",
          companyIds[0]
        )
      : [];

  const contactPainPoints =
    contactIds.length > 0
      ? await loadPainPointsForRecord(
          "pain_point_contacts",
          "contact_id",
          contactIds[0]
        )
      : [];

  const painPoints = uniqueById([...companyPainPoints, ...contactPainPoints]);
  const posts = await loadPostsFromPainPoints(idsFromRows(painPoints));
  const communities = await loadCommunitiesFromPosts(posts);

  const attachments = await loadAttachmentsForMemory({
    companyIds,
    contactIds,
    opportunityIds: [opportunity.id],
    taskIds: idsFromRows(tasks),
    activityIds: idsFromRows(activities),
    noteIds: idsFromRows(notes),
    postIds: idsFromRows(posts),
  });

  const openTasks = tasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  const knowledgeHighlights = buildKnowledgeHighlights(activities, notes);

  let answer = `BUSINESS MEMORY REPORT\nSubject: ${opportunity.name}\nRecord Type: Opportunity\nMode: Summary first. Long/repetitive records are capped.`;

  answer += section(
    "Executive Snapshot",
    [
      `- Stage: ${opportunity.stage || "Unknown"}`,
      `- Type: ${opportunity.opportunity_type || "Unknown"}`,
      `- Temperature: ${opportunity.lead_temperature || "Unknown"}`,
      `- Estimated Drivers: ${opportunity.estimated_driver_count ?? "Unknown"}`,
      `- Estimated Monthly Value: ${formatMoney(
        opportunity.estimated_monthly_value
      )}`,
      `- Expected Close Date: ${
        opportunity.expected_close_date || "No date saved"
      }`,
      `- Next Step: ${opportunity.next_step || "None saved"}`,
      `- Real Pain Points: ${painPoints.length}`,
      `- Open Tasks: ${openTasks.length}`,
      `- Attachments: ${attachments.length}`,
    ].join("\n")
  );

  answer += section(
    "Company",
    companies.length > 0
      ? companies
          .map(
            (company) => `- ${company.name}
  Phone: ${company.phone || "No phone"} | Email: ${company.email || "No email"}`
          )
          .join("\n")
      : "- No company linked."
  );

  answer += section(
    "Primary Contact",
    limitedList(contacts, contactLine, "- No primary contact linked.", 3)
  );

  answer += section(
    "Follow-up",
    limitedList(openTasks, taskLine, "- No open follow-up tasks found.", 5)
  );

  answer += section(
    "Real Pain Points",
    limitedList(
      painPoints,
      painPointLine,
      "- No real pain points found through linked company/contact.",
      5
    )
  );

  answer += section(
    "Knowledge Highlights",
    knowledgeHighlights.length > 0
      ? knowledgeHighlights.map((item) => `- ${item}`).join("\n")
      : "- No useful notes or activity summaries found yet."
  );

  answer += section(
    "Posts / Community Signals",
    posts.length > 0
      ? `${limitedList(posts, postLine, "", 3)}${
          communities.length > 0
            ? `\n\nCommunities:\n${limitedList(communities, communityLine, "", 3)}`
            : ""
        }`
      : "- No related posts found through real pain points."
  );

  answer += section(
    "Attachments",
    limitedList(attachments, attachmentLine, "- No attachments found.", 5)
  );

  answer += section(
    "Recommended Next Actions",
    [
      opportunity.next_step ? `- Do next step: ${opportunity.next_step}` : "",
      openTasks[0] ? `- Work next task: ${openTasks[0].title}` : "",
      !opportunity.primary_contact_id
        ? "- Add a primary contact for this opportunity."
        : "",
      !opportunity.expected_close_date
        ? "- Add an expected close date if this is a real pipeline item."
        : "",
    ]
      .filter(Boolean)
      .join("\n") || "- No obvious next action found."
  );

  return answer;
}

async function answerBestMemory(userQuestion: string) {
  const searchName = getNameFromQuestion(userQuestion);
  const lower = userQuestion.toLowerCase();

  if (isExecutiveReportQuestion(lower)) {
    return answerExecutiveReport(userQuestion);
  }

  if (isComparisonQuestion(lower)) {
    return answerComparisonQuestion(userQuestion);
  }

  if (lower.includes("company memory")) {
    return answerCompanyMemory(userQuestion);
  }

  if (lower.includes("contact memory")) {
    return answerContactMemory(userQuestion);
  }

  if (lower.includes("pain point memory") || lower.includes("need trucks")) {
    return answerPainPointMemory(userQuestion);
  }

  if (lower.includes("opportunity memory")) {
    return answerOpportunityMemory(userQuestion);
  }

  const company = await findCompanyByName(searchName);

  if (company) {
    return answerCompanyMemory(`company memory for ${company.name}`);
  }

  const contact = await findContactByName(searchName);

  if (contact) {
    return answerContactMemory(`contact memory for ${fullContactName(contact)}`);
  }

  const painPoint = await findPainPointByName(searchName);

  if (painPoint) {
    return answerPainPointMemory(`pain point memory for ${painPoint.name}`);
  }

  const opportunity = await findOpportunityByName(searchName);

  if (opportunity) {
    return answerOpportunityMemory(`opportunity memory for ${opportunity.name}`);
  }

  return `I could not find a company, contact, real pain point, or opportunity matching "${searchName}".`;
}

async function getOverdueTasks() {
  const today = todayIsoDate();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, due_date, priority, status, company_id, contact_id, companies(name), contacts(first_name, last_name)"
    )
    .lt("due_date", today)
    .neq("status", "Completed")
    .neq("status", "Cancelled")
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Task[];
}

async function getTasksDueToday() {
  const today = todayIsoDate();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, due_date, priority, status, company_id, contact_id, companies(name), contacts(first_name, last_name)"
    )
    .eq("due_date", today)
    .neq("status", "Completed")
    .neq("status", "Cancelled")
    .order("priority", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Task[];
}

async function answerToday() {
  const overdueTasks = await getOverdueTasks();
  const todayTasks = await getTasksDueToday();

  let answer = "Here is what needs attention today:\n\n";

  answer += `Overdue Tasks: ${overdueTasks.length}\n`;
  answer +=
    overdueTasks.length > 0
      ? overdueTasks.slice(0, 8).map(taskLine).join("\n\n")
      : "- No overdue tasks.";

  answer += `\n\nTasks Due Today: ${todayTasks.length}\n`;
  answer +=
    todayTasks.length > 0
      ? todayTasks.slice(0, 8).map(taskLine).join("\n\n")
      : "- No tasks due today.";

  return answer;
}

async function answerOverdueTasks() {
  const overdueTasks = await getOverdueTasks();

  if (overdueTasks.length === 0) {
    return "You have no overdue tasks.";
  }

  return `You have ${overdueTasks.length} overdue task(s):\n\n${overdueTasks
    .slice(0, 10)
    .map(taskLine)
    .join("\n\n")}`;
}

async function answerFollowUps() {
  const { data: taskRows, error: taskError } = await supabase
    .from("tasks")
    .select(
      "id, title, due_date, priority, status, company_id, contact_id, companies(name), contacts(first_name, last_name)"
    )
    .neq("status", "Completed")
    .neq("status", "Cancelled")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);

  if (taskError) throw new Error(taskError.message);

  const tasks = (taskRows ?? []) as unknown as Task[];

  const { data: activityRows, error: activityError } = await supabase
    .from("activities")
    .select(
      "id, subject, activity_type, activity_date, summary, outcome, follow_up_needed, company_id, contact_id, companies(name), contacts(first_name, last_name)"
    )
    .eq("follow_up_needed", true)
    .order("activity_date", { ascending: false })
    .limit(10);

  if (activityError) throw new Error(activityError.message);

  const activities = (activityRows ?? []) as unknown as Activity[];

  let answer = "Follow-up items I found:\n\n";

  answer += `Open Tasks: ${tasks.length}\n`;
  answer +=
    tasks.length > 0 ? tasks.map(taskLine).join("\n\n") : "- No open tasks found.";

  answer += `\n\nActivities Flagged for Follow-up: ${activities.length}\n`;
  answer +=
    activities.length > 0
      ? activities.map(activityLine).join("\n\n")
      : "- No follow-up activities found.";

  return answer;
}

async function answerHotOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .or("lead_temperature.eq.Hot,lead_temperature.eq.Active")
    .order("estimated_monthly_value", { ascending: false, nullsFirst: false })
    .limit(10);

  if (error) throw new Error(error.message);

  const opportunities = (data ?? []) as unknown as Opportunity[];

  if (opportunities.length === 0) {
    return "I did not find any hot or active opportunities.";
  }

  return `Hot / Active Opportunities: ${
    opportunities.length
  }\n\n${opportunities.map(opportunityLine).join("\n\n")}`;
}

async function answerRecentActivities() {
  const { data, error } = await supabase
    .from("activities")
    .select(
      "id, subject, activity_type, activity_date, summary, outcome, follow_up_needed, company_id, contact_id, companies(name), contacts(first_name, last_name)"
    )
    .order("activity_date", { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);

  const activities = (data ?? []) as unknown as Activity[];

  if (activities.length === 0) {
    return "No recent activities found.";
  }

  return `Recent Activities:\n\n${activities.map(activityLine).join("\n\n")}`;
}

async function answerPainPointCounts() {
  const { data: painPointRows, error: painPointError } = await supabase
    .from("pain_points")
    .select("id, name, category, description, created_at")
    .order("name", { ascending: true });

  if (painPointError) throw new Error(painPointError.message);

  const painPoints = ((painPointRows ?? []) as unknown as PainPoint[]).filter(isRealPainPoint);

  if (painPoints.length === 0) {
    return "No real pain points found yet. Contract clauses and broker agreement language are ignored.";
  }

  const [companyLinks, contactLinks, activityLinks, postLinks] =
    await Promise.all([
      supabase.from("pain_point_companies").select("pain_point_id"),
      supabase.from("pain_point_contacts").select("pain_point_id"),
      supabase.from("pain_point_activities").select("pain_point_id"),
      supabase.from("pain_point_posts").select("pain_point_id"),
    ]);

  if (companyLinks.error) throw new Error(companyLinks.error.message);
  if (contactLinks.error) throw new Error(contactLinks.error.message);
  if (activityLinks.error) throw new Error(activityLinks.error.message);
  if (postLinks.error) throw new Error(postLinks.error.message);

  const counts: Record<string, number> = {};

  for (const painPoint of painPoints) {
    counts[painPoint.id] = 0;
  }

  for (const row of (companyLinks.data ?? []) as { pain_point_id: string }[]) {
    if (counts[row.pain_point_id] !== undefined) counts[row.pain_point_id] += 1;
  }

  for (const row of (contactLinks.data ?? []) as { pain_point_id: string }[]) {
    if (counts[row.pain_point_id] !== undefined) counts[row.pain_point_id] += 1;
  }

  for (const row of (activityLinks.data ?? []) as { pain_point_id: string }[]) {
    if (counts[row.pain_point_id] !== undefined) counts[row.pain_point_id] += 1;
  }

  for (const row of (postLinks.data ?? []) as { pain_point_id: string }[]) {
    if (counts[row.pain_point_id] !== undefined) counts[row.pain_point_id] += 1;
  }

  const ranked = painPoints
    .map((painPoint) => ({
      ...painPoint,
      count: counts[painPoint.id] || 0,
    }))
    .sort((a, b) => b.count - a.count);

  return `Most Common Real Pain Points

Filtered out: broker agreements, insurance clauses, liability clauses, contract terms, DOT paperwork, and legal/admin language.

${ranked
  .slice(0, 10)
  .map((painPoint) => {
    return `- ${painPoint.name}
  Category: ${painPoint.category || "None"} | Linked Records: ${painPoint.count}`;
  })
  .join("\n\n")}`;
}

type ReportDateRange = {
  label: string;
  start: string;
  end: string;
};

type ReportCompany = Company & {
  created_at: string | null;
  lead_temperature: string | null;
};

type ReportContact = Contact & {
  created_at: string | null;
};

type ReportPainPoint = PainPoint & {
  created_at: string | null;
};

function isExecutiveReportQuestion(lowerQuestion: string) {
  return (
    lowerQuestion.includes("weekly summary") ||
    lowerQuestion.includes("week summary") ||
    lowerQuestion.includes("monthly summary") ||
    lowerQuestion.includes("month summary") ||
    lowerQuestion.includes("sales summary") ||
    lowerQuestion.includes("executive report") ||
    lowerQuestion.includes("business report") ||
    lowerQuestion.includes("pipeline report") ||
    lowerQuestion.includes("what happened this month") ||
    lowerQuestion.includes("what happened this week") ||
    lowerQuestion.includes("what happened last week") ||
    lowerQuestion.includes("what happened recently")
  );
}

function getReportDateRange(question: string): ReportDateRange {
  const lower = question.toLowerCase();
  const now = new Date();
  const end = now.toISOString();

  if (lower.includes("this month") || lower.includes("monthly") || lower.includes("month summary")) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      label: "This Month",
      start: startOfMonth.toISOString(),
      end,
    };
  }

  if (lower.includes("this week") || lower.includes("weekly") || lower.includes("week summary")) {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);

    return {
      label: "Last 7 Days",
      start: start.toISOString(),
      end,
    };
  }

  if (lower.includes("sales")) {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    return {
      label: "Last 30 Days Sales Window",
      start: start.toISOString(),
      end,
    };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 30);

  return {
    label: "Last 30 Days",
    start: start.toISOString(),
    end,
  };
}

function reportCompanyLine(company: ReportCompany) {
  return `- ${company.name}
  Phone: ${company.phone || "No phone"} | Email: ${company.email || "No email"} | Temp: ${company.lead_temperature || "No temp"}`;
}

function reportContactLine(contact: ReportContact) {
  return `- ${fullContactName(contact)}
  Company: ${contact.companies?.name || "No company"} | Title: ${contact.title || "No title"} | Phone: ${contact.phone || "No phone"} | Email: ${contact.email || "No email"}`;
}

function reportPainPointLine(painPoint: ReportPainPoint) {
  return `- ${painPoint.name}
  Category: ${painPoint.category || "None"}${painPoint.description ? ` | ${shortText(painPoint.description, 130)}` : ""}`;
}

function reportLimit<T>(
  rows: T[],
  formatter: (row: T) => string,
  emptyText: string,
  limit = 8
) {
  if (rows.length === 0) {
    return emptyText;
  }

  const shown = rows.slice(0, limit).map(formatter).join("\n\n");
  const remaining = rows.length - limit;

  if (remaining > 0) {
    return `${shown}\n\n- ${remaining} more not shown.`;
  }

  return shown;
}

async function loadReportCompanies(range: ReportDateRange) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, website, phone, email, lead_temperature, created_at")
    .gte("created_at", range.start)
    .lte("created_at", range.end)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as ReportCompany[];
}

async function loadReportContacts(range: ReportDateRange) {
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, title, email, phone, company_id, created_at, companies(name)"
    )
    .gte("created_at", range.start)
    .lte("created_at", range.end)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as ReportContact[];
}

async function loadReportOpportunities(range: ReportDateRange) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .gte("created_at", range.start)
    .lte("created_at", range.end)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Opportunity[];
}

async function loadReportPainPoints(range: ReportDateRange) {
  const { data, error } = await supabase
    .from("pain_points")
    .select("id, name, category, description, created_at")
    .gte("created_at", range.start)
    .lte("created_at", range.end)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as ReportPainPoint[]).filter(isRealPainPoint);
}

async function loadReportClosedOpportunities(range: ReportDateRange) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .in("stage", ["Customer", "Lost"])
    .gte("created_at", range.start)
    .lte("created_at", range.end)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Opportunity[];
}

async function loadReportHotOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .or("lead_temperature.eq.Hot,lead_temperature.eq.Active")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as Opportunity[];
}

function executiveAssessment(input: {
  newCompanies: ReportCompany[];
  newContacts: ReportContact[];
  newOpportunities: Opportunity[];
  newPainPoints: ReportPainPoint[];
  closedOpportunities: Opportunity[];
  overdueTasks: Task[];
  hotOpportunities: Opportunity[];
}) {
  const signals: string[] = [];

  if (input.hotOpportunities.length > 0) {
    signals.push(`- ${input.hotOpportunities.length} hot/active opportunities need attention.`);
  }

  if (input.overdueTasks.length > 0) {
    signals.push(`- ${input.overdueTasks.length} overdue tasks are creating follow-up risk.`);
  }

  if (input.newOpportunities.length > 0) {
    signals.push(`- ${input.newOpportunities.length} new opportunities were created in this report window.`);
  }

  if (input.newPainPoints.length > 0) {
    signals.push(`- ${input.newPainPoints.length} real pain points were captured, which may reveal buying triggers.`);
  }

  if (input.newCompanies.length === 0 && input.newContacts.length === 0 && input.newOpportunities.length === 0) {
    signals.push("- No new company/contact/opportunity growth was found in this report window.");
  }

  if (input.closedOpportunities.length > 0) {
    signals.push(`- ${input.closedOpportunities.length} opportunities are currently marked Customer or Lost in this window.`);
  }

  return signals.join("\n") || "- No strong executive signal found yet.";
}

async function answerExecutiveReport(userQuestion: string) {
  const range = getReportDateRange(userQuestion);

  const [
    newCompanies,
    newContacts,
    newOpportunities,
    newPainPoints,
    closedOpportunities,
    overdueTasks,
    hotOpportunities,
  ] = await Promise.all([
    loadReportCompanies(range),
    loadReportContacts(range),
    loadReportOpportunities(range),
    loadReportPainPoints(range),
    loadReportClosedOpportunities(range),
    getOverdueTasks(),
    loadReportHotOpportunities(),
  ]);

  let answer = `AI BUSINESS MEMORY V2 EXECUTIVE REPORT\nWindow: ${range.label}\nFrom: ${formatDate(range.start)}\nTo: ${formatDate(range.end)}`;

  answer += section(
    "Executive Summary",
    executiveAssessment({
      newCompanies,
      newContacts,
      newOpportunities,
      newPainPoints,
      closedOpportunities,
      overdueTasks,
      hotOpportunities,
    })
  );

  answer += section(
    "Scoreboard",
    [
      `- New Companies: ${newCompanies.length}`,
      `- New Contacts: ${newContacts.length}`,
      `- New Opportunities: ${newOpportunities.length}`,
      `- New Real Pain Points: ${newPainPoints.length}`,
      `- Closed / Lost Opportunities Created In Window: ${closedOpportunities.length}`,
      `- Current Overdue Tasks: ${overdueTasks.length}`,
      `- Current Hot / Active Opportunities: ${hotOpportunities.length}`,
    ].join("\n")
  );

  answer += section(
    "New Companies",
    reportLimit(newCompanies, reportCompanyLine, "- No new companies found in this window.", 8)
  );

  answer += section(
    "New Contacts",
    reportLimit(newContacts, reportContactLine, "- No new contacts found in this window.", 8)
  );

  answer += section(
    "New Opportunities",
    reportLimit(newOpportunities, opportunityLine, "- No new opportunities found in this window.", 8)
  );

  answer += section(
    "Current Hot / Active Opportunities",
    reportLimit(hotOpportunities, opportunityLine, "- No hot or active opportunities found.", 8)
  );

  answer += section(
    "Closed / Lost Opportunities",
    reportLimit(closedOpportunities, opportunityLine, "- No Customer or Lost opportunities found in this window.", 8)
  );

  answer += section(
    "Current Overdue Tasks",
    reportLimit(overdueTasks, taskLine, "- No overdue tasks.", 8)
  );

  answer += section(
    "New Real Pain Points",
    reportLimit(newPainPoints, reportPainPointLine, "- No new real pain points found in this window.", 8)
  );

  answer += section(
    "Recommended Management Actions",
    [
      overdueTasks[0] ? `- Clear the oldest overdue task first: ${overdueTasks[0].title}` : "",
      hotOpportunities[0]?.next_step ? `- Work top hot opportunity next step: ${hotOpportunities[0].next_step}` : "",
      hotOpportunities.length > 0 && !hotOpportunities[0]?.next_step ? `- Add a next step to the top hot opportunity: ${hotOpportunities[0].name}` : "",
      newPainPoints.length > 0 ? "- Review new pain points and link them to companies, contacts, posts, or activities." : "",
      newCompanies.length > 0 && newContacts.length === 0 ? "- Add contacts for the new companies so they are actionable." : "",
    ]
      .filter(Boolean)
      .join("\n") || "- No urgent management action found."
  );

  return answer;
}

type CompanyComparisonMemory = {
  company: Company;
  contacts: Contact[];
  opportunities: Opportunity[];
  openTasks: Task[];
  activities: Activity[];
  notes: Note[];
  painPoints: PainPoint[];
  attachments: Attachment[];
};

function isComparisonQuestion(lowerQuestion: string) {
  return (
    lowerQuestion.startsWith("compare ") ||
    lowerQuestion.includes(" compare ") ||
    lowerQuestion.includes(" vs ") ||
    lowerQuestion.includes(" versus ") ||
    lowerQuestion.includes("side by side") ||
    lowerQuestion.includes("alpha candidates")
  );
}

function cleanComparisonName(value: string) {
  return value
    .replace(/\?/g, "")
    .replace(/\bcompanies\b/gi, "")
    .replace(/\bcompany\b/gi, "")
    .replace(/\bcompare\b/gi, "")
    .replace(/\bside by side\b/gi, "")
    .replace(/\bversus\b/gi, "")
    .replace(/\bvs\b/gi, "")
    .trim();
}

function parseCompanyComparisonNames(question: string) {
  const cleaned = question
    .replace(/\?/g, "")
    .replace(/^compare\s+/i, "")
    .replace(/\bside by side\b/gi, "")
    .trim();

  const splitPatterns = [
    /\s+and\s+/i,
    /\s+vs\.?\s+/i,
    /\s+versus\s+/i,
    /\s*,\s*/,
  ];

  for (const pattern of splitPatterns) {
    const parts = cleaned.split(pattern).map(cleanComparisonName).filter(Boolean);

    if (parts.length >= 2) {
      return [parts[0], parts[1]];
    }
  }

  return [];
}

function comparisonMetricLine(label: string, left: string | number, right: string | number) {
  return `- ${label}: ${left} | ${right}`;
}

function firstOrNone(value: string | null | undefined) {
  return value && value.trim() ? value : "None saved";
}

function topOpportunityName(opportunities: Opportunity[]) {
  if (opportunities.length === 0) {
    return "None";
  }

  const hot = opportunities.find(
    (opportunity) =>
      opportunity.lead_temperature === "Hot" ||
      opportunity.lead_temperature === "Active"
  );

  return hot?.name || opportunities[0].name;
}

function topTaskName(tasks: Task[]) {
  return tasks[0]?.title || "None";
}

function topPainPointName(painPoints: PainPoint[]) {
  return painPoints[0]?.name || "None";
}

function recentActivityName(activities: Activity[]) {
  return activities[0]?.subject || "None";
}

async function buildCompanyComparisonMemory(company: Company): Promise<CompanyComparisonMemory> {
  const companyIds = [company.id];
  const contacts = await loadContactsForCompany(company.id);
  const opportunities = await loadOpportunitiesForCompany(company.id);
  const tasks = await loadTasksForCompanyOrContact(companyIds, []);
  const activities = await loadActivitiesForCompanyOrContact(companyIds, []);
  const notes = await loadNotesForCompanyContactOpportunity(
    companyIds,
    [],
    idsFromRows(opportunities)
  );

  const painPoints = await loadPainPointsForRecord(
    "pain_point_companies",
    "company_id",
    company.id
  );

  const attachments = await loadAttachmentsForMemory({
    companyIds,
    contactIds: idsFromRows(contacts),
    opportunityIds: idsFromRows(opportunities),
    taskIds: idsFromRows(tasks),
    activityIds: idsFromRows(activities),
    noteIds: idsFromRows(notes),
  });

  const openTasks = tasks.filter(
    (task) => task.status !== "Completed" && task.status !== "Cancelled"
  );

  return {
    company,
    contacts,
    opportunities,
    openTasks,
    activities,
    notes,
    painPoints,
    attachments,
  };
}

function companyComparisonRecommendation(left: CompanyComparisonMemory, right: CompanyComparisonMemory) {
  const leftHot = left.opportunities.filter(
    (opportunity) =>
      opportunity.lead_temperature === "Hot" ||
      opportunity.lead_temperature === "Active"
  );

  const rightHot = right.opportunities.filter(
    (opportunity) =>
      opportunity.lead_temperature === "Hot" ||
      opportunity.lead_temperature === "Active"
  );

  if (leftHot.length > rightHot.length) {
    return `- ${left.company.name} appears more urgent because it has more hot/active opportunity signal.`;
  }

  if (rightHot.length > leftHot.length) {
    return `- ${right.company.name} appears more urgent because it has more hot/active opportunity signal.`;
  }

  if (left.openTasks.length > right.openTasks.length) {
    return `- ${left.company.name} needs more task cleanup because it has more open tasks.`;
  }

  if (right.openTasks.length > left.openTasks.length) {
    return `- ${right.company.name} needs more task cleanup because it has more open tasks.`;
  }

  if (left.painPoints.length > right.painPoints.length) {
    return `- ${left.company.name} has more documented pain-point signal.`;
  }

  if (right.painPoints.length > left.painPoints.length) {
    return `- ${right.company.name} has more documented pain-point signal.`;
  }

  return "- Both companies have similar urgency based on the currently saved CRM data.";
}

async function answerCompanyComparison(userQuestion: string) {
  const names = parseCompanyComparisonNames(userQuestion);

  if (names.length < 2) {
    return "I need two company names to compare. Example: Compare ABC Trucking and Three T Trucking.";
  }

  const leftCompany = await findCompanyByName(names[0]);
  const rightCompany = await findCompanyByName(names[1]);

  if (!leftCompany || !rightCompany) {
    return `I could not find both companies. Found: ${leftCompany?.name || "not found"} and ${rightCompany?.name || "not found"}.`;
  }

  const [left, right] = await Promise.all([
    buildCompanyComparisonMemory(leftCompany),
    buildCompanyComparisonMemory(rightCompany),
  ]);

  let answer = `AI BUSINESS MEMORY V2 COMPARISON REPORT\nCompare: ${left.company.name} | ${right.company.name}`;

  answer += section(
    "Side-by-Side Scoreboard",
    [
      comparisonMetricLine("Contacts", left.contacts.length, right.contacts.length),
      comparisonMetricLine("Opportunities", left.opportunities.length, right.opportunities.length),
      comparisonMetricLine("Open Tasks", left.openTasks.length, right.openTasks.length),
      comparisonMetricLine("Activities", left.activities.length, right.activities.length),
      comparisonMetricLine("Notes", left.notes.length, right.notes.length),
      comparisonMetricLine("Real Pain Points", left.painPoints.length, right.painPoints.length),
      comparisonMetricLine("Attachments", left.attachments.length, right.attachments.length),
    ].join("\n")
  );

  answer += section(
    "Company Profiles",
    `${left.company.name}
- Phone: ${left.company.phone || "Not saved"}
- Email: ${left.company.email || "Not saved"}
- Website: ${left.company.website || "Not saved"}

${right.company.name}
- Phone: ${right.company.phone || "Not saved"}
- Email: ${right.company.email || "Not saved"}
- Website: ${right.company.website || "Not saved"}`
  );

  answer += section(
    "Best Current Signal",
    [
      comparisonMetricLine("Top Opportunity", topOpportunityName(left.opportunities), topOpportunityName(right.opportunities)),
      comparisonMetricLine("Next Open Task", topTaskName(left.openTasks), topTaskName(right.openTasks)),
      comparisonMetricLine("Top Pain Point", topPainPointName(left.painPoints), topPainPointName(right.painPoints)),
      comparisonMetricLine("Recent Activity", recentActivityName(left.activities), recentActivityName(right.activities)),
    ].join("\n")
  );

  answer += section(
    "Contacts",
    `${left.company.name}
${limitedList(left.contacts, contactLine, "- No contacts linked.", 4)}

${right.company.name}
${limitedList(right.contacts, contactLine, "- No contacts linked.", 4)}`
  );

  answer += section(
    "Pipeline",
    `${left.company.name}
${limitedList(left.opportunities, opportunityLine, "- No opportunities linked.", 4)}

${right.company.name}
${limitedList(right.opportunities, opportunityLine, "- No opportunities linked.", 4)}`
  );

  answer += section(
    "Executive Recommendation",
    companyComparisonRecommendation(left, right)
  );

  return answer;
}

async function loadAlphaCandidateOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      opportunity_type,
      stage,
      lead_temperature,
      estimated_driver_count,
      estimated_monthly_value,
      expected_close_date,
      next_step,
      company_id,
      primary_contact_id,
      created_at,
      companies(name),
      primary_contact:contacts!opportunities_primary_contact_id_fkey (
        first_name,
        last_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) throw new Error(error.message);

  const opportunities = (data ?? []) as unknown as Opportunity[];

  return opportunities.filter((opportunity) => {
    const text = normalizeText(
      `${opportunity.name} ${opportunity.opportunity_type || ""} ${opportunity.stage || ""}`
    );

    return text.includes("alpha");
  });
}

async function answerAlphaCandidateComparison() {
  const opportunities = await loadAlphaCandidateOpportunities();

  const hotOrActive = opportunities.filter(
    (opportunity) =>
      opportunity.lead_temperature === "Hot" ||
      opportunity.lead_temperature === "Active"
  );

  let answer = "AI BUSINESS MEMORY V2 COMPARISON REPORT\nCompare: Alpha Candidates";

  answer += section(
    "Alpha Candidate Scoreboard",
    [
      `- Alpha Candidates Found: ${opportunities.length}`,
      `- Hot / Active Alpha Candidates: ${hotOrActive.length}`,
      `- Candidates With Next Steps: ${opportunities.filter((opportunity) => Boolean(opportunity.next_step)).length}`,
      `- Estimated Monthly Pipeline Value: ${formatMoney(
        opportunities.reduce(
          (total, opportunity) =>
            total + Number(opportunity.estimated_monthly_value || 0),
          0
        )
      )}`,
    ].join("\n")
  );

  answer += section(
    "Candidate Comparison",
    reportLimit(
      opportunities,
      opportunityLine,
      "- No alpha candidates found.",
      12
    )
  );

  answer += section(
    "Best Candidates To Work First",
    hotOrActive.length > 0
      ? hotOrActive
          .slice(0, 5)
          .map(
            (opportunity) =>
              `- ${opportunity.name} - ${opportunity.lead_temperature} - Next Step: ${firstOrNone(opportunity.next_step)}`
          )
          .join("\n")
      : "- No hot or active alpha candidates found."
  );

  answer += section(
    "Executive Recommendation",
    hotOrActive[0]
      ? `- Work ${hotOrActive[0].name} first because it has the strongest temperature signal.`
      : "- Add lead temperature and next steps to alpha candidates so the assistant can rank them better."
  );

  return answer;
}

async function answerComparisonQuestion(userQuestion: string) {
  const lower = userQuestion.toLowerCase();

  if (lower.includes("alpha candidate") || lower.includes("alpha candidates")) {
    return answerAlphaCandidateComparison();
  }

  return answerCompanyComparison(userQuestion);
}

async function routeQuestion(userQuestion: string) {
  const lower = userQuestion.toLowerCase();

  if (isExecutiveReportQuestion(lower)) {
    return answerExecutiveReport(userQuestion);
  }

  if (isComparisonQuestion(lower)) {
    return answerComparisonQuestion(userQuestion);
  }

  if (
    lower.includes("business memory") ||
    lower.includes("company memory") ||
    lower.includes("contact memory") ||
    lower.includes("pain point memory") ||
    lower.includes("opportunity memory") ||
    lower.includes("tell me everything we know") ||
    lower.includes("tell me everything about") ||
    lower.includes("what do we know about")
  ) {
    return answerBestMemory(userQuestion);
  }

  if (
    lower.includes("what should i do today") ||
    lower.includes("do today")
  ) {
    return answerToday();
  }

  if (lower.includes("overdue")) {
    return answerOverdueTasks();
  }

  if (lower.includes("follow up") || lower.includes("follow-up")) {
    return answerFollowUps();
  }

  if (
    lower.includes("hot opportunit") ||
    lower.includes("active opportunit") ||
    lower.includes("hot lead")
  ) {
    return answerHotOpportunities();
  }

  if (
    lower.includes("recent activit") ||
    lower.includes("latest activit") ||
    lower.includes("what happened recently")
  ) {
    return answerRecentActivities();
  }

  if (
    lower.includes("pain point") ||
    lower.includes("most common problem") ||
    lower.includes("common problems")
  ) {
    if (lower.includes("about") || lower.includes("know") || lower.includes("memory")) {
      return answerPainPointMemory(userQuestion);
    }

    return answerPainPointCounts();
  }

  if (
    lower.includes("contact") ||
    lower.includes("person") ||
    lower.includes("who is")
  ) {
    return answerContactMemory(userQuestion);
  }

  if (
    lower.includes("company") ||
    lower.includes("what happened with") ||
    lower.includes("what happened at") ||
    lower.includes("about")
  ) {
    return answerCompanyMemory(userQuestion);
  }

  return `I can answer these Sell It questions in AI Business Memory V2:

- What should I do today?
- Who needs follow-up?
- Show me overdue tasks.
- Show me hot opportunities.
- Show me recent activities.
- Tell me everything we know about ABC Trucking.
- Company memory for ABC Trucking.
- Contact memory for Joe Smith.
- Pain point memory for Need Trucks.
- Opportunity memory for Alpha Tester.
- What pain points are most common?

V2 filters out fake pain points like broker agreements, liability clauses, insurance requirements, and contract language.`;
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "Ask me about Sell It data. AI Business Memory V2 builds short structured reports for companies, contacts, real pain points, and opportunities. It filters out contract/legal/admin language so broker agreements do not show as pain points.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    setThinking(true);
    setErrorMessage("");

    const userMessage: ChatMessage = {
      role: "user",
      text: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");

    try {
      const answer = await routeQuestion(trimmedQuestion);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: answer,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Assistant lookup failed.";

      setErrorMessage(message);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          text: `I ran into an error while checking Sell It data: ${message}`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={linkButtonStyle}>
          Home
        </Link>
      </div>

      <h1>AI Assistant</h1>

      <p style={{ color: "#aaa", marginBottom: "32px", maxWidth: "950px" }}>
        Ask natural language questions about your Sell It data. AI Business
        Memory V2 creates concise structured reports from CRM records, tasks,
        activities, notes, real pain points, posts, communities, and attachment
        metadata.
      </p>

      <section style={{ maxWidth: "1000px" }}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Conversation</h2>

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "12px",
                backgroundColor: message.role === "user" ? "#222" : "#151515",
              }}
            >
              <p
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  color: message.role === "user" ? "#fff" : "#ffcc66",
                  fontWeight: "bold",
                }}
              >
                {message.role === "user" ? "You" : "Assistant"}
              </p>

              <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                {message.text}
              </p>
            </div>
          ))}

          {thinking && <p style={{ color: "#aaa" }}>Checking Sell It data...</p>}

          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <label>
            Ask Sell It
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Tell me everything we know about ABC Trucking"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={thinking}
            style={{
              ...buttonStyle,
              marginTop: "14px",
              opacity: thinking ? 0.7 : 1,
            }}
          >
            {thinking ? "Checking..." : "Ask"}
          </button>
        </form>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>AI Business Memory V2 Examples</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              "Give me a weekly summary",
              "Give me a sales summary",
              "What happened this month?",
              "Compare ABC Trucking and Three T Trucking",
              "Compare Alpha Candidates",
              "Tell me everything we know about ABC Trucking",
              "Company memory for Three T Trucking",
              "Contact memory for Joe Smith",
              "Pain point memory for Need Trucks",
              "Opportunity memory for Alpha Tester",
              "Who needs follow-up?",
              "Show me hot opportunities",
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuestion(example)}
                style={{
                  ...buttonStyle,
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}








