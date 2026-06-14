"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  companies: { name: string | null } | null;
  contacts: { first_name: string | null; last_name: string | null } | null;
};

type Opportunity = {
  id: string;
  name: string;
  stage: string | null;
  lead_temperature: string | null;
  estimated_monthly_value: number | null;
  next_step: string | null;
  companies: { name: string | null } | null;
};

type Activity = {
  id: string;
  subject: string;
  activity_type: string | null;
  activity_date: string | null;
  summary: string | null;
  outcome: string | null;
  companies: { name: string | null } | null;
  contacts: { first_name: string | null; last_name: string | null } | null;
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
  companies: { name: string | null } | null;
};

type PainPoint = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
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
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "No value";
  return `$${Number(value).toLocaleString()}`;
}

function getNameFromQuestion(question: string) {
  const clean = question.trim();

  const patterns = [
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
      return match[1]
        .replace(/\?$/g, "")
        .replace(/company/gi, "")
        .replace(/contact/gi, "")
        .trim();
    }
  }

  return clean.replace(/\?$/g, "").trim();
}

function taskLine(task: Task) {
  const company = task.companies?.name ? ` — ${task.companies.name}` : "";
  const contact = task.contacts?.first_name
    ? ` — ${task.contacts.first_name} ${task.contacts.last_name || ""}`.trim()
    : "";

  return `- ${task.title}${company}${contact}
  Status: ${task.status || "Unknown"} | Priority: ${
    task.priority || "Normal"
  } | Due: ${task.due_date || "No due date"}`;
}

function opportunityLine(opportunity: Opportunity) {
  const company = opportunity.companies?.name
    ? ` — ${opportunity.companies.name}`
    : "";

  return `- ${opportunity.name}${company}
  Stage: ${opportunity.stage || "Unknown"} | Temperature: ${
    opportunity.lead_temperature || "Unknown"
  } | Value: ${formatMoney(opportunity.estimated_monthly_value)}
  Next Step: ${opportunity.next_step || "None saved"}`;
}

function activityLine(activity: Activity) {
  const company = activity.companies?.name ? ` — ${activity.companies.name}` : "";
  const contact = activity.contacts?.first_name
    ? ` — ${activity.contacts.first_name} ${activity.contacts.last_name || ""}`.trim()
    : "";

  return `- ${activity.subject}${company}${contact}
  Type: ${activity.activity_type || "Unknown"} | Outcome: ${
    activity.outcome || "None"
  } | Date: ${formatDate(activity.activity_date)}
  ${activity.summary || "No summary saved."}`;
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "Ask me about Sell It data. Try: What should I do today? Who needs follow-up? Show me overdue tasks. Show me hot opportunities. What happened with ABC Trucking? What pain points are most common?",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function getOverdueTasks() {
    const today = todayIsoDate();

    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, due_date, priority, status, companies(name), contacts(first_name, last_name)"
      )
      .lt("due_date", today)
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []) as Task[];
  }

  async function getTasksDueToday() {
    const today = todayIsoDate();

    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, due_date, priority, status, companies(name), contacts(first_name, last_name)"
      )
      .eq("due_date", today)
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .order("priority", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []) as Task[];
  }

  async function answerToday() {
    const overdueTasks = await getOverdueTasks();
    const todayTasks = await getTasksDueToday();

    let answer = "Here is what needs attention today:\n\n";

    answer += `Overdue Tasks: ${overdueTasks.length}\n`;

    if (overdueTasks.length > 0) {
      answer += overdueTasks.map(taskLine).join("\n\n");
    } else {
      answer += "- No overdue tasks.";
    }

    answer += `\n\nTasks Due Today: ${todayTasks.length}\n`;

    if (todayTasks.length > 0) {
      answer += todayTasks.map(taskLine).join("\n\n");
    } else {
      answer += "- No tasks due today.";
    }

    return answer;
  }

  async function answerOverdueTasks() {
    const overdueTasks = await getOverdueTasks();

    if (overdueTasks.length === 0) {
      return "You have no overdue tasks.";
    }

    return `You have ${overdueTasks.length} overdue task(s):\n\n${overdueTasks
      .map(taskLine)
      .join("\n\n")}`;
  }

  async function answerFollowUps() {
    const { data: taskRows, error: taskError } = await supabase
      .from("tasks")
      .select(
        "id, title, due_date, priority, status, companies(name), contacts(first_name, last_name)"
      )
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10);

    if (taskError) throw new Error(taskError.message);

    const tasks = (taskRows ?? []) as Task[];

    const { data: activityRows, error: activityError } = await supabase
      .from("activities")
      .select(
        "id, subject, activity_type, activity_date, summary, outcome, companies(name), contacts(first_name, last_name)"
      )
      .eq("follow_up_needed", true)
      .order("activity_date", { ascending: false })
      .limit(10);

    if (activityError) throw new Error(activityError.message);

    const activities = (activityRows ?? []) as Activity[];

    let answer = "Follow-up items I found:\n\n";

    answer += `Open Tasks: ${tasks.length}\n`;

    if (tasks.length > 0) {
      answer += tasks.map(taskLine).join("\n\n");
    } else {
      answer += "- No open tasks found.";
    }

    answer += `\n\nActivities Flagged for Follow-up: ${activities.length}\n`;

    if (activities.length > 0) {
      answer += activities.map(activityLine).join("\n\n");
    } else {
      answer += "- No follow-up activities found.";
    }

    return answer;
  }

  async function answerHotOpportunities() {
    const { data, error } = await supabase
      .from("opportunities")
      .select(
        "id, name, stage, lead_temperature, estimated_monthly_value, next_step, companies(name)"
      )
      .or("lead_temperature.eq.Hot,lead_temperature.eq.Active")
      .order("estimated_monthly_value", { ascending: false, nullsFirst: false })
      .limit(10);

    if (error) throw new Error(error.message);

    const opportunities = (data ?? []) as Opportunity[];

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
        "id, subject, activity_type, activity_date, summary, outcome, companies(name), contacts(first_name, last_name)"
      )
      .order("activity_date", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);

    const activities = (data ?? []) as Activity[];

    if (activities.length === 0) {
      return "No recent activities found.";
    }

    return `Recent Activities:\n\n${activities.map(activityLine).join("\n\n")}`;
  }

  async function answerCompanyLookup(userQuestion: string) {
    const searchName = getNameFromQuestion(userQuestion);

    const { data: companyRows, error: companyError } = await supabase
      .from("companies")
      .select("id, name, website, phone, email")
      .ilike("name", `%${searchName}%`)
      .limit(1);

    if (companyError) throw new Error(companyError.message);

    const company = (companyRows?.[0] ?? null) as Company | null;

    if (!company) {
      return `I could not find a company matching "${searchName}".`;
    }

    const { data: activitiesRows, error: activitiesError } = await supabase
      .from("activities")
      .select(
        "id, subject, activity_type, activity_date, summary, outcome, companies(name), contacts(first_name, last_name)"
      )
      .eq("company_id", company.id)
      .order("activity_date", { ascending: false })
      .limit(8);

    if (activitiesError) throw new Error(activitiesError.message);

    const activities = (activitiesRows ?? []) as Activity[];

    const { data: opportunitiesRows, error: opportunitiesError } = await supabase
      .from("opportunities")
      .select(
        "id, name, stage, lead_temperature, estimated_monthly_value, next_step, companies(name)"
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (opportunitiesError) throw new Error(opportunitiesError.message);

    const opportunities = (opportunitiesRows ?? []) as Opportunity[];

    const { data: taskRows, error: taskError } = await supabase
      .from("tasks")
      .select(
        "id, title, due_date, priority, status, companies(name), contacts(first_name, last_name)"
      )
      .eq("company_id", company.id)
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8);

    if (taskError) throw new Error(taskError.message);

    const tasks = (taskRows ?? []) as Task[];

    let answer = `Company: ${company.name}\n`;
    answer += `Website: ${company.website || "Not saved"}\n`;
    answer += `Phone: ${company.phone || "Not saved"}\n`;
    answer += `Email: ${company.email || "Not saved"}\n`;

    answer += `\nOpen Tasks: ${tasks.length}\n`;
    answer += tasks.length > 0 ? tasks.map(taskLine).join("\n\n") : "- None";

    answer += `\n\nOpportunities: ${opportunities.length}\n`;
    answer +=
      opportunities.length > 0
        ? opportunities.map(opportunityLine).join("\n\n")
        : "- None";

    answer += `\n\nRecent Activities: ${activities.length}\n`;
    answer +=
      activities.length > 0
        ? activities.map(activityLine).join("\n\n")
        : "- None";

    return answer;
  }

  async function answerContactLookup(userQuestion: string) {
    const searchName = getNameFromQuestion(userQuestion);
    const terms = searchName.split(/\s+/).filter(Boolean);

    const { data, error } = await supabase
      .from("contacts")
      .select(
        "id, first_name, last_name, title, email, phone, companies(name)"
      )
      .limit(50);

    if (error) throw new Error(error.message);

    const contacts = ((data ?? []) as Contact[]).filter((contact) => {
      const fullName = `${contact.first_name} ${contact.last_name || ""}`.toLowerCase();
      return terms.every((term) => fullName.includes(term.toLowerCase()));
    });

    if (contacts.length === 0) {
      return `I could not find a contact matching "${searchName}".`;
    }

    return `Matching contact(s):\n\n${contacts
      .slice(0, 10)
      .map((contact) => {
        return `- ${contact.first_name} ${contact.last_name || ""}
  Company: ${contact.companies?.name || "No company"}
  Title: ${contact.title || "No title"}
  Phone: ${contact.phone || "No phone"}
  Email: ${contact.email || "No email"}`;
      })
      .join("\n\n")}`;
  }

  async function answerPainPointCounts() {
    const { data: painPointRows, error: painPointError } = await supabase
      .from("pain_points")
      .select("id, name, category, description")
      .order("name", { ascending: true });

    if (painPointError) throw new Error(painPointError.message);

    const painPoints = (painPointRows ?? []) as PainPoint[];

    if (painPoints.length === 0) {
      return "No pain points found yet.";
    }

    const [
      companyLinks,
      contactLinks,
      activityLinks,
      postLinks,
    ] = await Promise.all([
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

    for (const row of companyLinks.data ?? []) counts[row.pain_point_id] += 1;
    for (const row of contactLinks.data ?? []) counts[row.pain_point_id] += 1;
    for (const row of activityLinks.data ?? []) counts[row.pain_point_id] += 1;
    for (const row of postLinks.data ?? []) counts[row.pain_point_id] += 1;

    const ranked = painPoints
      .map((painPoint) => ({
        ...painPoint,
        count: counts[painPoint.id] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    return `Most Common Pain Points:\n\n${ranked
      .map((painPoint) => {
        return `- ${painPoint.name}
  Category: ${painPoint.category || "None"}
  Linked Records: ${painPoint.count}`;
      })
      .join("\n\n")}`;
  }

  async function routeQuestion(userQuestion: string) {
    const lower = userQuestion.toLowerCase();

    if (
      lower.includes("what should i do today") ||
      lower.includes("today") ||
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
      return answerPainPointCounts();
    }

    if (
      lower.includes("contact") ||
      lower.includes("person") ||
      lower.includes("who is")
    ) {
      return answerContactLookup(userQuestion);
    }

    if (
      lower.includes("company") ||
      lower.includes("what happened with") ||
      lower.includes("what happened at") ||
      lower.includes("about")
    ) {
      return answerCompanyLookup(userQuestion);
    }

    return `I can answer these Sell It questions in V1:

- What should I do today?
- Who needs follow-up?
- Show me overdue tasks.
- Show me hot opportunities.
- Show me recent activities.
- What happened with ABC Trucking?
- Look up contact Joe Smith.
- What pain points are most common?

Try one of those.`;
  }

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
    }

    setThinking(false);
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

      <p style={{ color: "#aaa", marginBottom: "32px", maxWidth: "900px" }}>
        Ask natural language questions about your Sell It data. V1 uses simple
        routing and database lookups. It is not a generic chatbot.
      </p>

      <section style={{ maxWidth: "950px" }}>
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
              placeholder="Example: What should I do today?"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={thinking}
            style={{ ...buttonStyle, marginTop: "16px" }}
          >
            {thinking ? "Thinking..." : "Ask Assistant"}
          </button>
        </form>
      </section>
    </main>
  );
}