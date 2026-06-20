"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { supabase } from "../lib/supabase";

type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const OPEN_STORAGE_KEY = "sell-it-page-assistant-open";
const MAX_LINKS = 8;

type PageKind =
  | "home"
  | "companies"
  | "company"
  | "contacts"
  | "contact"
  | "opportunities"
  | "opportunity"
  | "tasks"
  | "task"
  | "activities"
  | "activity"
  | "notes"
  | "note"
  | "communities"
  | "community"
  | "posts"
  | "post"
  | "pain_points"
  | "pain_point"
  | "capture"
  | "import"
  | "import_leads"
  | "merge"
  | "assistant"
  | "unknown";

type LinkItem = {
  label: string;
  href: string;
};

type GenericRecord = {
  id: string;
  [key: string]: unknown;
};

type PageContext = {
  loading: boolean;
  error: string;
  kind: PageKind;
  route: string;
  recordId: string;
  title: string;
  summary: string;
  record: GenericRecord | null;
  counts: Record<string, number>;
  links: LinkItem[];
};

type AssistantMessage = {
  role: "assistant" | "user";
  content: string;
  links?: LinkItem[];
};

const panelStyle: CSSProperties = {
  width: "100%",
  marginTop: "22px",
  fontFamily: "Arial, sans-serif",
};

const collapsedButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(167, 139, 250, 0.28)",
  borderRadius: "10px",
  backgroundColor: "rgba(17, 24, 39, 0.86)",
  color: "white",
  padding: "10px 11px",
  fontWeight: 850,
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
};

const expandedStyle: CSSProperties = {
  border: "1px solid #333",
  borderRadius: "8px",
  backgroundColor: "#0d0d0d",
  color: "white",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "8px 10px",
  borderBottom: "1px solid #222",
  backgroundColor: "transparent",
};

const bodyStyle: CSSProperties = {
  padding: "8px",
};

const answerAreaStyle: CSSProperties = {
  maxHeight: "230px",
  overflowY: "auto",
  paddingRight: "4px",
  marginBottom: "8px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "6px",
  border: "1px solid #555",
  padding: "8px",
  fontSize: "13px",
  color: "black",
  backgroundColor: "white",
};

const buttonStyle: CSSProperties = {
  border: "none",
  borderRadius: "6px",
  padding: "8px",
  fontWeight: "bold",
  cursor: "pointer",
  backgroundColor: "#f5d76e",
  color: "black",
};

const smallButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "4px",
  padding: "3px 4px",
  backgroundColor: "transparent",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "12px",
};

const messageStyle: CSSProperties = {
  border: "none",
  borderRadius: 0,
  padding: "0 0 9px",
  marginBottom: "9px",
  backgroundColor: "transparent",
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",
};

function textValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function cleanSearchTerm(value: string) {
  return value
    .replace(/[?!.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getName(record: GenericRecord | null, keys: string[]) {
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = textValue(record[key]).trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function getContactName(record: GenericRecord | null) {
  if (!record) {
    return "";
  }

  const first = textValue(record.first_name).trim();
  const last = textValue(record.last_name).trim();

  return `${first} ${last}`.trim();
}

function routeParts(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

function routeRecordId(value: string) {
  if (!value || value === "new") {
    return "";
  }

  return value;
}

function inferPageKind(pathname: string): { kind: PageKind; recordId: string } {
  const parts = routeParts(pathname);
  const first = parts[0] ?? "";
  const second = routeRecordId(parts[1] ?? "");

  if (!first) return { kind: "home", recordId: "" };

  if (first === "companies") {
    return { kind: second ? "company" : "companies", recordId: second };
  }

  if (first === "contacts") {
    return { kind: second ? "contact" : "contacts", recordId: second };
  }

  if (first === "opportunities") {
    return { kind: second ? "opportunity" : "opportunities", recordId: second };
  }

  if (first === "tasks") {
    return { kind: second ? "task" : "tasks", recordId: second };
  }

  if (first === "activities") {
    return { kind: second ? "activity" : "activities", recordId: second };
  }

  if (first === "notes") {
    return { kind: second ? "note" : "notes", recordId: second };
  }

  if (first === "communities") {
    return { kind: second ? "community" : "communities", recordId: second };
  }

  if (first === "posts") {
    return { kind: second ? "post" : "posts", recordId: second };
  }

  if (first === "pain-points") {
    return { kind: second ? "pain_point" : "pain_points", recordId: second };
  }

  if (first === "capture") return { kind: "capture", recordId: "" };
  if (first === "import") return { kind: "import", recordId: "" };
  if (first === "import-leads") return { kind: "import_leads", recordId: "" };
  if (first === "merge") return { kind: "merge", recordId: "" };
  if (first === "assistant") return { kind: "assistant", recordId: "" };

  return { kind: "unknown", recordId: "" };
}

function titleForListPage(kind: PageKind) {
  const titles: Record<string, string> = {
    home: "Command Center", company: "Company",
    companies: "Companies",
    contact: "Contact",
    contacts: "Contacts",
    opportunity: "Opportunity",
    opportunities: "Opportunities",
    task: "Task",
    tasks: "Tasks",
    activity: "Activity",
    activities: "Activities",
    note: "Note",
    notes: "Notes",
    community: "Community",
    communities: "Communities",
    post: "Post",
    posts: "Posts",
    pain_point: "Pain Point",
    pain_points: "Pain Points",
    capture: "AI Capture",
    import: "Import",
    import_leads: "Import Leads",
    merge: "Merge Manager",
    assistant: "Assistant",
  };

  return titles[kind] ?? "Sell It";
}

async function countRows(tableName: string, columnName: string, value: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .eq(columnName, value);

  if (error) {
    return 0;
  }

  return (data ?? []).length;
}

async function loadCompanyContext(recordId: string): Promise<Partial<PageContext>> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", recordId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const record = data as GenericRecord;
  const [contacts, opportunities, tasks, activities, notes, attachments, painLinks] =
    await Promise.all([
      countRows("contacts", "company_id", recordId),
      countRows("opportunities", "company_id", recordId),
      countRows("tasks", "company_id", recordId),
      countRows("activities", "company_id", recordId),
      countRows("notes", "company_id", recordId),
      countRows("attachments", "related_company_id", recordId),
      countRows("pain_point_companies", "company_id", recordId),
    ]);

  const name = getName(record, ["name"]) || "this company";

  return {
    record,
    title: name,
    summary: `${name} is a company record. It connects sales work to contacts, opportunities, tasks, activities, notes, pain points, attachments, and timeline history.`,
    counts: {
      contacts,
      opportunities,
      tasks,
      activities,
      notes,
      attachments,
      painPoints: painLinks,
    },
    links: [
      { label: "open this company", href: `/companies/${recordId}` },
      { label: "contacts", href: "/contacts" },
      { label: "opportunities", href: "/opportunities" },
      { label: "tasks", href: "/tasks" },
      { label: "activities", href: "/activities" },
      { label: "pain points", href: "/pain-points" },
    ],
  };
}

async function loadContactContext(recordId: string): Promise<Partial<PageContext>> {
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, title, email, phone, company_id, notes, created_at, companies(name)"
    )
    .eq("id", recordId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const record = data as GenericRecord;
  const [opportunities, tasks, activities, notes, attachments, painLinks] =
    await Promise.all([
      countRows("opportunities", "primary_contact_id", recordId),
      countRows("tasks", "contact_id", recordId),
      countRows("activities", "contact_id", recordId),
      countRows("notes", "contact_id", recordId),
      countRows("attachments", "related_contact_id", recordId),
      countRows("pain_point_contacts", "contact_id", recordId),
    ]);

  const name = getContactName(record) || "this contact";
  const companyId = textValue(record.company_id);

  return {
    record,
    title: name,
    summary: `${name} is a contact record. Use this page to understand who they are, what company they belong to, and what sales activity has happened with them.`,
    counts: {
      opportunities,
      tasks,
      activities,
      notes,
      attachments,
      painPoints: painLinks,
    },
    links: [
      { label: "open this contact", href: `/contacts/${recordId}` },
      companyId ? { label: "company", href: `/companies/${companyId}` } : null,
      { label: "opportunities", href: "/opportunities" },
      { label: "tasks", href: "/tasks" },
      { label: "activities", href: "/activities" },
      { label: "pain points", href: "/pain-points" },
    ].filter(Boolean) as LinkItem[],
  };
}

async function loadOpportunityContext(
  recordId: string
): Promise<Partial<PageContext>> {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, name, company_id, primary_contact_id, opportunity_type, stage, lead_temperature, estimated_driver_count, estimated_monthly_value, expected_close_date, next_step, notes, created_at, companies(name), primary_contact:contacts!opportunities_primary_contact_id_fkey(first_name, last_name)"
    )
    .eq("id", recordId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const record = data as GenericRecord;
  const [tasks, activities, notes, attachments, stageHistory] = await Promise.all([
    countRows("tasks", "opportunity_id", recordId),
    countRows("activities", "opportunity_id", recordId),
    countRows("notes", "opportunity_id", recordId),
    countRows("attachments", "related_opportunity_id", recordId),
    countRows("opportunity_stage_history", "opportunity_id", recordId),
  ]);

  const name = getName(record, ["name"]) || "this opportunity";
  const companyId = textValue(record.company_id);
  const contactId = textValue(record.primary_contact_id);

  return {
    record,
    title: name,
    summary: `${name} is an opportunity record. It tracks the sales stage, lead temperature, next step, related tasks, activities, notes, attachments, and stage history.`,
    counts: {
      tasks,
      activities,
      notes,
      attachments,
      stageHistory,
    },
    links: [
      { label: "open this opportunity", href: `/opportunities/${recordId}` },
      companyId ? { label: "company", href: `/companies/${companyId}` } : null,
      contactId ? { label: "primary contact", href: `/contacts/${contactId}` } : null,
      { label: "tasks", href: "/tasks" },
      { label: "activities", href: "/activities" },
      { label: "notes", href: "/notes" },
    ].filter(Boolean) as LinkItem[],
  };
}

async function loadPainPointContext(
  recordId: string
): Promise<Partial<PageContext>> {
  const { data, error } = await supabase
    .from("pain_points")
    .select("id, name, description, category, created_at")
    .eq("id", recordId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const record = data as GenericRecord;
  const [companies, contacts, activities, posts] = await Promise.all([
    countRows("pain_point_companies", "pain_point_id", recordId),
    countRows("pain_point_contacts", "pain_point_id", recordId),
    countRows("pain_point_activities", "pain_point_id", recordId),
    countRows("pain_point_posts", "pain_point_id", recordId),
  ]);

  const name = getName(record, ["name"]) || "this pain point";

  return {
    record,
    title: name,
    summary: `${name} is a pain point. It is a recurring problem or need that can be connected to companies, contacts, activities, and posts so Sell It can find patterns.`,
    counts: {
      companies,
      contacts,
      activities,
      posts,
    },
    links: [
      { label: "open this pain point", href: `/pain-points/${recordId}` },
      { label: "companies", href: "/companies" },
      { label: "contacts", href: "/contacts" },
      { label: "activities", href: "/activities" },
      { label: "posts", href: "/posts" },
    ],
  };
}

async function loadSimpleRecordContext(
  kind: PageKind,
  recordId: string
): Promise<Partial<PageContext>> {
  if (kind === "task") {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, due_date, company_id, contact_id, opportunity_id, created_at")
      .eq("id", recordId)
      .single();

    if (error) throw new Error(error.message);

    const record = data as GenericRecord;
    const title = getName(record, ["title"]) || "this task";

    return {
      record,
      title,
      summary: `${title} is a task. Use it to track what needs to be done, who it relates to, priority, status, and due date.`,
      counts: {},
      links: [{ label: "open this task", href: `/tasks/${recordId}` }],
    };
  }

  if (kind === "activity") {
    const { data, error } = await supabase
      .from("activities")
      .select("id, subject, activity_type, activity_date, summary, outcome, follow_up_needed, company_id, contact_id, task_id, opportunity_id, created_at")
      .eq("id", recordId)
      .single();

    if (error) throw new Error(error.message);

    const record = data as GenericRecord;
    const title = getName(record, ["subject"]) || "this activity";

    return {
      record,
      title,
      summary: `${title} is an activity. It records something that happened, like a call, text, meeting, email, note, research, or follow-up signal.`,
      counts: {
        attachments: await countRows("attachments", "related_activity_id", recordId),
        painPoints: await countRows("pain_point_activities", "activity_id", recordId),
      },
      links: [{ label: "open this activity", href: `/activities/${recordId}` }],
    };
  }

  if (kind === "note") {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, body, source, source_url, company_id, contact_id, opportunity_id, created_at")
      .eq("id", recordId)
      .single();

    if (error) throw new Error(error.message);

    const record = data as GenericRecord;
    const title = getName(record, ["title", "body"]) || "this note";

    return {
      record,
      title,
      summary: `${title} is a note. Use notes to preserve important sales context, research, screenshots, source links, or memory that does not fit as a task or activity.`,
      counts: {
        attachments: await countRows("attachments", "related_note_id", recordId),
      },
      links: [{ label: "open this note", href: `/notes/${recordId}` }],
    };
  }

  if (kind === "community") {
    const { data, error } = await supabase
      .from("communities")
      .select("id, name, platform, url, description, member_count, industry, location_focus, status, created_at")
      .eq("id", recordId)
      .single();

    if (error) throw new Error(error.message);

    const record = data as GenericRecord;
    const title = getName(record, ["name"]) || "this community";

    return {
      record,
      title,
      summary: `${title} is a community. Use communities to track Facebook groups, online groups, or other places where trucking or sales signals may appear.`,
      counts: {
        posts: await countRows("posts", "community_id", recordId),
      },
      links: [
        { label: "open this community", href: `/communities/${recordId}` },
        { label: "posts", href: "/posts" },
      ],
    };
  }

  if (kind === "post") {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, community_id, platform, post_type, post_url, post_date, original_post_text, ai_summary, pain_points_found, leads_found, follow_up_needed, created_at")
      .eq("id", recordId)
      .single();

    if (error) throw new Error(error.message);

    const record = data as GenericRecord;
    const title = getName(record, ["title", "original_post_text"]) || "this post";
    const communityId = textValue(record.community_id);

    return {
      record,
      title,
      summary: `${title} is a post. Use posts to track source material, leads, pain points, comments, and social/community signals.`,
      counts: {
        attachments: await countRows("attachments", "related_post_id", recordId),
        painPoints: await countRows("pain_point_posts", "post_id", recordId),
      },
      links: [
        { label: "open this post", href: `/posts/${recordId}` },
        communityId ? { label: "community", href: `/communities/${communityId}` } : null,
      ].filter(Boolean) as LinkItem[],
    };
  }

  return {};
}

function contextIntro(context: PageContext) {
  if (context.loading) {
    return "I am loading this page context. Try again in a second.";
  }

  if (context.error) {
    return `I can see the route, but I could not load the record details: ${context.error}`;
  }

  if (context.record) {
    return `You are looking at ${context.title}.\n\n${context.summary}`;
  }

  if (context.kind === "companies") {
    return "You are on the Companies page.\n\nThis page lists company records. Each company card gives you a quick look at basic company information like name, website, phone, and email when that information exists. Click a company to open the full company record.";
  }

  return `You are on the ${titleForListPage(context.kind)} page.\n\nThis page is part of Sell It. Use it to review records, add information, and move sales work forward.`;
}

function countsText(context: PageContext) {
  const entries = Object.entries(context.counts).filter(([, value]) => value > 0);

  if (entries.length === 0) {
    return "";
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
}

function wantsNavigation(question: string) {
  const q = question.toLowerCase();

  return (
    q.includes("show me") ||
    q.includes("take me") ||
    q.includes("open ") ||
    q.includes("go to") ||
    q.includes("link") ||
    q.includes("related ") ||
    q.includes("navigate") ||
    q.includes("where do i click")
  );
}

function conceptAnswer(question: string) {
  const q = question.toLowerCase();

  if (q.includes("pain point")) {
    return "A Pain Point is a recurring problem, need, frustration, or buying trigger. In Sell It, pain points help connect companies, contacts, activities, and posts around the same business problem.";
  }

  if (q.includes("community")) {
    return "A Community is a source group, such as a Facebook group, trucking group, local business group, or online place where leads and pain points may appear. Communities contain posts.";
  }

  if (q.includes("post")) {
    return "A Post is saved source material from a community or social source. It can preserve text, links, screenshots, comments, reactions, AI summaries, leads found, and pain points found.";
  }

  if (q.includes("ai capture") || q === "capture" || q.includes("what is capture")) {
    return "AI Capture is the fast intake tool. Paste messy notes, calls, emails, texts, screenshots, CSV lead lists, or rough sales information there. Sell It can turn that into organized records.";
  }

  if (q.includes("what is an opportunity") || q.includes("what are opportunities") || q === "opportunity") {
    return "An Opportunity is a possible sale or business deal. It tracks stage, lead temperature, next step, related company, primary contact, tasks, activities, notes, attachments, and stage history.";
  }

  if (q.includes("what is an activity") || q.includes("what are activities") || q === "activity") {
    return "An Activity is something that happened, such as a call, text, email, meeting, research note, Facebook comment, or follow-up signal. Activities create the sales timeline.";
  }

  if (q.includes("what is a task") || q.includes("what are tasks") || q === "task") {
    return "A Task is something that needs to be done. Tasks help track follow-ups, demos, calls, research, cleanup work, and next actions.";
  }

  return "";
}

function companyListPageAnswer(question: string) {
  const q = question.toLowerCase();

  if (
    q.includes("company card") ||
    q.includes("company cards") ||
    q.includes("what do cards") ||
    q.includes("what do company") ||
    q.includes("how does it work") ||
    q.includes("how do these work")
  ) {
    return "The company cards are quick previews. They show the company name and any basic contact details saved on that company, like website, phone, and email.\n\nUse the list to find a company fast. Click a company card when you want the full record with contacts, opportunities, tasks, activities, notes, pain points, attachments, and timeline history.";
  }

  return "";
}

function extractCompanyMentionTerm(question: string) {
  const q = cleanSearchTerm(question);

  const patterns = [
    /how many companies mention (.+)$/i,
    /how many companies have (.+)$/i,
    /companies mention (.+)$/i,
    /companies have (.+)$/i,
    /companies in (.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);

    if (match?.[1]) {
      return cleanSearchTerm(match[1]);
    }
  }

  return "";
}

async function answerCompaniesMentionQuestion(
  question: string,
  context: PageContext
): Promise<AssistantMessage | null> {
  if (context.kind !== "companies") {
    return null;
  }

  const term = extractCompanyMentionTerm(question);

  if (!term) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, website, phone, email, city, state, operating_regions, assets_equipment, notes"
    )
    .limit(1000);

  if (error) {
    return {
      role: "assistant",
      content:
        "I could not count that from the Page Assistant. For deeper database questions, use the main Assistant page.",
    };
  }

  const lowerTerm = term.toLowerCase();

  const matches = ((data ?? []) as GenericRecord[]).filter((row) => {
    const searchable = [
      row.name,
      row.website,
      row.phone,
      row.email,
      row.city,
      row.state,
      row.operating_regions,
      row.assets_equipment,
      row.notes,
    ]
      .map((value) => textValue(value).toLowerCase())
      .join(" ");

    return searchable.includes(lowerTerm);
  });

  if (matches.length === 0) {
    return {
      role: "assistant",
      content: `I did not find any company records that mention "${term}" in the company fields I can currently search.`,
    };
  }

  const names = matches
    .map((row) => textValue(row.name).trim())
    .filter(Boolean)
    .slice(0, 8)
    .join("\n- ");

  return {
    role: "assistant",
    content: `I found ${matches.length} company record(s) that mention "${term}".${
      names ? `\n\nTop matches:\n- ${names}` : ""
    }`,
  };
}

function recordImportanceAnswer(context: PageContext) {
  if (context.error) {
    return contextIntro(context);
  }

  const counts = context.counts;
  const record = context.record;

  if (context.kind === "companies") {
    return "You are on the Companies page.\n\nThis page is your company list. Each card is a quick preview showing the company name and any saved contact details like website, phone, and email.\n\nUse this page to find a company, open the full record, add missing details, or spot duplicate-looking company records.";
  }

  if (context.kind === "company") {
    return [
      `You are looking at ${context.title}.`,
      "",
      `Lead temperature: ${textValue(record?.lead_temperature) || "Not set"}.`,
      counts.contacts ? `Contacts linked: ${counts.contacts}.` : "No contacts are linked yet.",
      counts.opportunities ? `Opportunities linked: ${counts.opportunities}.` : "No opportunities are linked yet.",
      counts.tasks ? `Tasks linked: ${counts.tasks}.` : "No tasks are linked yet.",
      counts.activities ? `Activities logged: ${counts.activities}.` : "No activities are logged yet.",
      counts.notes ? `Notes saved: ${counts.notes}.` : "No notes are saved yet.",
      counts.painPoints ? `Pain points linked: ${counts.painPoints}.` : "No pain points are linked yet.",
      "",
      "What to do next: make sure the right contact is linked, create an opportunity if there is a real sales path, and add a task if there is no next action.",
    ].join("\n");
  }

  if (context.kind === "contact") {
    return [
      `You are looking at ${context.title}.`,
      "",
      "This is a person connected to your sales work.",
      counts.opportunities ? `Opportunities linked: ${counts.opportunities}.` : "No opportunities are linked yet.",
      counts.tasks ? `Tasks linked: ${counts.tasks}.` : "No tasks are linked yet.",
      counts.activities ? `Activities logged: ${counts.activities}.` : "No activities are logged yet.",
      counts.notes ? `Notes saved: ${counts.notes}.` : "No notes are saved yet.",
      counts.painPoints ? `Pain points linked: ${counts.painPoints}.` : "No pain points are linked yet.",
      "",
      "What to do next: confirm who they are, what company they belong to, whether they influence the sale, and whether a follow-up task exists.",
    ].join("\n");
  }

  if (context.kind === "opportunity") {
    return [
      `You are looking at ${context.title}.`,
      "",
      "This opportunity matters because it represents a possible sale or business deal.",
      `Stage: ${textValue(record?.stage) || "Not set"}.`,
      `Lead temperature: ${textValue(record?.lead_temperature) || "Not set"}.`,
      `Next step: ${textValue(record?.next_step) || "No next step saved."}`,
      counts.stageHistory ? `Stage changes: ${counts.stageHistory}.` : "No stage changes are recorded yet.",
      counts.tasks ? `Tasks linked: ${counts.tasks}.` : "No tasks are linked yet.",
      counts.activities ? `Activities logged: ${counts.activities}.` : "No activities are logged yet.",
      counts.notes ? `Notes saved: ${counts.notes}.` : "No notes are saved yet.",
      "",
      "What to do next: make sure the next step is clear, the stage is accurate, and there is a task or activity keeping this from going cold.",
    ].join("\n");
  }

  if (context.kind === "pain_point") {
    return [
      `You are looking at ${context.title}.`,
      "",
      "This pain point helps you keep the same problem organized across different records.",
      counts.companies ? `Companies linked: ${counts.companies}.` : "No companies are linked yet.",
      counts.contacts ? `Contacts linked: ${counts.contacts}.` : "No contacts are linked yet.",
      counts.activities ? `Activities linked: ${counts.activities}.` : "No activities are linked yet.",
      counts.posts ? `Posts linked: ${counts.posts}.` : "No posts are linked yet.",
      "",
      "The more places this pain point shows up, the more important it becomes as a sales signal.",
    ].join("\n");
  }

  const countLines = countsText(context);

  return `${contextIntro(context)}${countLines ? `\n\nRelated counts:\n${countLines}` : ""}`;
}

function nextStepAnswer(context: PageContext) {
  const counts = context.counts;
  const record = context.record;

  if (context.kind === "companies") {
    return "From here, pick the company you want to work on. Open its full record, then check whether it has contacts, opportunities, tasks, activities, notes, pain points, and a clear next step.";
  }

  if (context.kind === "company") {
    const temperature = textValue(record?.lead_temperature);

    return [
      "Review this company before outreach.",
      temperature ? `Lead temperature: ${temperature}.` : "",
      counts.contacts ? `${counts.contacts} contact(s) are linked.` : "Add or link the right contact.",
      counts.opportunities ? `${counts.opportunities} opportunity/opportunities are linked.` : "Create an opportunity if there is a real sales path.",
      counts.tasks ? `${counts.tasks} task(s) are linked.` : "Create a follow-up task if there is no next action.",
      counts.activities ? `${counts.activities} activity record(s) exist.` : "Log the next call, text, email, meeting, or research activity.",
      counts.painPoints ? `${counts.painPoints} pain point link(s) exist.` : "Link pain points if this company has a known problem Sell It can solve.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (context.kind === "contact") {
    return [
      "Figure out who this person is, what company they belong to, and whether they can influence the sale.",
      counts.activities ? `${counts.activities} activity record(s) are linked.` : "Log an activity after every meaningful interaction.",
      counts.tasks ? `${counts.tasks} task(s) are linked.` : "Create a task for the next follow-up.",
      counts.opportunities ? `${counts.opportunities} opportunity/opportunities are linked.` : "Link or create an opportunity if this person is part of a deal.",
    ].join("\n");
  }

  if (context.kind === "opportunity") {
    return [
      `Stage: ${textValue(record?.stage) || "Not set"}.`,
      `Lead temperature: ${textValue(record?.lead_temperature) || "Not set"}.`,
      `Next step: ${textValue(record?.next_step) || "No next step saved."}`,
      counts.stageHistory ? `${counts.stageHistory} stage change(s) are recorded.` : "No stage history found yet.",
      counts.tasks ? `${counts.tasks} task(s) are linked.` : "Create a task for the next action.",
      counts.activities ? `${counts.activities} activity record(s) are linked.` : "Log activity so this opportunity does not go cold.",
    ].join("\n");
  }

  if (context.kind === "pain_point") {
    return [
      "Use this pain point to keep similar problems organized across companies, contacts, activities, and posts.",
      counts.companies ? `${counts.companies} company link(s) exist.` : "Link companies that have this issue.",
      counts.contacts ? `${counts.contacts} contact link(s) exist.` : "Link contacts who mentioned or own this issue.",
      counts.activities ? `${counts.activities} activity link(s) exist.` : "Link activities where this problem came up.",
      counts.posts ? `${counts.posts} post link(s) exist.` : "Link posts where this issue appears.",
    ].join("\n");
  }

  return "Look for the main next action on this page: open the record, add missing information, create a task, log an activity, or review related records.";
}

function attentionAnswer(context: PageContext) {
  const record = context.record;

  if (context.kind === "companies") {
    return "On the Companies page, pay attention to missing phone numbers, missing websites, duplicate-looking companies, and companies that should have contacts or opportunities but do not yet.";
  }

  if (context.kind === "opportunity") {
    return [
      "Pay attention to stage, lead temperature, next step, stage history, open tasks, and recent activities.",
      textValue(record?.next_step)
        ? `Current next step: ${textValue(record?.next_step)}`
        : "This opportunity has no saved next step. That is usually the first thing to fix.",
    ].join("\n");
  }

  if (context.kind === "company") {
    return [
      "Pay attention to lead temperature, contacts, open opportunities, overdue tasks, recent activities, notes, pain points, and attachments.",
      textValue(record?.notes) ? "This company has notes saved." : "No company notes are visible in the loaded context.",
    ].join("\n");
  }

  if (context.kind === "contact") {
    return "Pay attention to their company, role/title, phone/email, related opportunities, recent activities, notes, and whether a follow-up task exists.";
  }

  if (context.kind === "pain_point") {
    return "Pay attention to how many companies, contacts, activities, and posts are connected. A pain point becomes more important when it shows up repeatedly across different records.";
  }

  return "Pay attention to related records, blank important fields, open tasks, recent activity, attachments, and whether the record has a clear next step.";
}

function navigationAnswer(question: string, context: PageContext) {
  const q = question.toLowerCase();

  if (!wantsNavigation(q)) {
    return null;
  }

  if (q.includes("contact") || q.includes("person") || q.includes("people")) {
    return {
      content: "Here are the best contact-related links from this page.",
      links: context.links
        .filter((link) => link.label.toLowerCase().includes("contact"))
        .slice(0, MAX_LINKS),
    };
  }

  if (q.includes("opportunit")) {
    return {
      content: "Here are the best opportunity-related links from this page.",
      links: context.links
        .filter((link) => link.label.toLowerCase().includes("opportunit"))
        .slice(0, MAX_LINKS),
    };
  }

  if (q.includes("activit")) {
    return {
      content: "Here are the best activity-related links from this page.",
      links: context.links
        .filter((link) => link.label.toLowerCase().includes("activit"))
        .slice(0, MAX_LINKS),
    };
  }

  if (q.includes("compan")) {
    return {
      content: "Here are the best company-related links from this page.",
      links: context.links
        .filter((link) => link.label.toLowerCase().includes("compan"))
        .slice(0, MAX_LINKS),
    };
  }

  if (q.includes("pain point")) {
    return {
      content: "Here are the best pain-point-related links from this page.",
      links: context.links
        .filter((link) => link.label.toLowerCase().includes("pain"))
        .slice(0, MAX_LINKS),
    };
  }

  return {
    content: "Here are the best navigation links from this page.",
    links: context.links.slice(0, MAX_LINKS),
  };
}

async function answerQuestion(
  question: string,
  context: PageContext
): Promise<AssistantMessage> {
  const q = question.trim().toLowerCase();

  const companyMentionAnswer = await answerCompaniesMentionQuestion(question, context);

  if (companyMentionAnswer) {
    return companyMentionAnswer;
  }

  if (context.kind === "companies") {
    const companyAnswer = companyListPageAnswer(question);

    if (companyAnswer) {
      return {
        role: "assistant",
        content: companyAnswer,
      };
    }
  }

  const nav = navigationAnswer(q, context);

  if (nav) {
    return {
      role: "assistant",
      content: nav.content,
      links: nav.links.length > 0 ? nav.links : context.links.slice(0, MAX_LINKS),
    };
  }

  if (
    q.includes("what am i looking at") ||
    q.includes("what page") ||
    q.includes("where am i") ||
    q.includes("summarize") ||
    q.includes("who is this") ||
    q.includes("who is this person") ||
    q.includes("what should i know") ||
    q.includes("why is") ||
    q.includes("important")
  ) {
    return {
      role: "assistant",
      content: recordImportanceAnswer(context),
    };
  }

  if (
    q.includes("what should i do") ||
    q.includes("what should happen next") ||
    q.includes("next") ||
    q.includes("blocking") ||
    q.includes("blocker")
  ) {
    return {
      role: "assistant",
      content: nextStepAnswer(context),
    };
  }

  if (
    q.includes("how do i use") ||
    q.includes("what can i do") ||
    q.includes("pay attention") ||
    q.includes("keep these straight") ||
    q.includes("getting worse") ||
    q.includes("coming from") ||
    q.includes("how does this work") ||
    q.includes("how does it work")
  ) {
    return {
      role: "assistant",
      content:
        context.kind === "pain_point"
          ? recordImportanceAnswer(context)
          : attentionAnswer(context),
    };
  }

  const concept = conceptAnswer(q);

  if (concept) {
    return {
      role: "assistant",
      content: concept,
    };
  }

  return {
    role: "assistant",
    content: `${contextIntro(context)}\n\nI can answer page-help questions like:\n- What am I looking at?\n- How do I use this page?\n- What should I do next?\n- What should I pay attention to?\n- What is a Pain Point?\n\nFor deeper analysis, use the main Assistant page.`,
  };
}

function defaultGreeting(context: PageContext): AssistantMessage {
  return {
    role: "assistant",
    content:
      context.record && context.title
        ? `I can help with this page. You are viewing ${context.title}.`
        : `I can help with this ${titleForListPage(context.kind)} page.`,
  };
}

function LinkList({ links }: { links: LinkItem[] | undefined }) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>
      {links.slice(0, MAX_LINKS).map((link, index) => (
        <span key={`${link.href}-${link.label}`}>
          {index > 0 ? " Ãƒâ€šÃ‚Â· " : ""}
          <Link
            href={link.href}
            style={{
              color: "#6bb6ff",
              textDecoration: "underline",
              fontWeight: "normal",
            }}
          >
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

export default function PageAssistant() {
  const pathname = usePathname();
  const [{ kind, recordId }, setRouteInfo] = useState(() => inferPageKind(pathname));
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<PageContext>({
    loading: true,
    error: "",
    kind,
    route: pathname,
    recordId,
    title: titleForListPage(kind),
    summary: "",
    record: null,
    counts: {},
    links: [],
  });
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    const saved = window.localStorage.getItem(OPEN_STORAGE_KEY);
    setIsOpen(saved === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(OPEN_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    const next = inferPageKind(pathname);
    setRouteInfo(next);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    async function loadContext() {
      const baseContext: PageContext = {
        loading: true,
        error: "",
        kind,
        route: pathname,
        recordId,
        title: titleForListPage(kind),
        summary: "",
        record: null,
        counts: {},
        links: [{ label: "current page", href: pathname }],
      };

      setContext(baseContext);

      try {
        let loaded: Partial<PageContext> = {};

        if (kind === "company" && recordId) {
          loaded = await loadCompanyContext(recordId);
        } else if (kind === "contact" && recordId) {
          loaded = await loadContactContext(recordId);
        } else if (kind === "opportunity" && recordId) {
          loaded = await loadOpportunityContext(recordId);
        } else if (kind === "pain_point" && recordId) {
          loaded = await loadPainPointContext(recordId);
        } else if (recordId) {
          loaded = await loadSimpleRecordContext(kind, recordId);
        } else {
          loaded = {
            title: titleForListPage(kind),
            summary: `This is the ${titleForListPage(kind)} page.`,
            links: [
              { label: "dashboard", href: "/" },
              { label: "companies", href: "/companies" },
              { label: "contacts", href: "/contacts" },
              { label: "opportunities", href: "/opportunities" },
              { label: "tasks", href: "/tasks" },
              { label: "activities", href: "/activities" },
              { label: "pain points", href: "/pain-points" },
            ],
          };
        }

        if (!isMounted) {
          return;
        }

        const nextContext: PageContext = {
          ...baseContext,
          ...loaded,
          loading: false,
          error: "",
          kind,
          route: pathname,
          recordId,
          links:
            loaded.links && loaded.links.length > 0
              ? loaded.links
              : baseContext.links,
        };

        setContext(nextContext);
        setMessages([defaultGreeting(nextContext)]);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextContext = {
          ...baseContext,
          loading: false,
          error: error instanceof Error ? error.message : "Could not load context.",
        };

        setContext(nextContext);
        setMessages([defaultGreeting(nextContext)]);
      }
    }

    void loadContext();

    return () => {
      isMounted = false;
    };
  }, [kind, pathname, recordId]);

  const contextLabel = useMemo(() => {
    if (context.loading) {
      return "Loading...";
    }

    if (context.record && context.title) {
      return context.title;
    }

    return titleForListPage(context.kind);
  }, [context]);

  function handleVoiceInput() {
    if (typeof window === "undefined") {
      return;
    }

    const speechWindow = window as WindowWithSpeechRecognition;
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? "";

      if (transcript) {
        setQuestion((current) =>
          current.trim() ? `${current.trim()} ${transcript}` : transcript
        );
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isAnswering) {
      return;
    }

    const userMessage: AssistantMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsAnswering(true);

    try {
      const assistantMessage = await answerQuestion(trimmedQuestion, context);
      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsAnswering(false);
    }
  }

  if (pathname === "/") {
    return null;
  }

  if (!isOpen) {
    return (
      <div style={panelStyle}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={collapsedButtonStyle}
        >
          Page Assistant
        </button>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <section style={expandedStyle} aria-label="Page Assistant">
        <div style={headerStyle}>
          <div>
            <strong>Page Assistant</strong>
            <p style={{ color: "#aaa", margin: "3px 0 0", fontSize: "12px" }}>
              {contextLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={smallButtonStyle}
          >
            Minimize
          </button>
        </div>

        <div style={bodyStyle}>
          <div style={answerAreaStyle}>
            {messages.map((message, index) => (
              <div style={messageStyle} key={`${message.role}-${index}`}>
                <p
                  style={{
                    color: message.role === "user" ? "#f5d76e" : "white",
                    margin: 0,
                    fontWeight: message.role === "user" ? "bold" : "normal",
                    fontSize: "13px",
                  }}
                >
                  {message.role === "user" ? "You: " : ""}
                  {message.content}
                </p>

                <LinkList links={message.links} />
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about this page..."
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />

              {speechSupported && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title={isListening ? "Stop listening" : "Ask by voice"}
                  style={{
                    border: "1px solid #333",
                    borderRadius: "6px",
                    padding: "0 8px",
                    backgroundColor: isListening ? "#f5d76e" : "#151515",
                    color: isListening ? "black" : "#6bb6ff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Mic
                </button>
              )}
            </div>

            <button type="submit" style={buttonStyle} disabled={isAnswering}>
              {isAnswering ? "Thinking..." : "Ask"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

