import { NextResponse } from "next/server";

type BuilderInput = {
  groupName?: string;
  platform?: string;
  topic?: string;
  painPoint?: string;
  goal?: string;
  tone?: string;
  styleGuidance?: string;
  draftText?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function fallbackOptions(input: BuilderInput) {
  const groupName = clean(input.groupName) || "the group";
  const platform = clean(input.platform) || "Facebook";
  const topic = clean(input.topic) || "trucking";
  const painPoint = clean(input.painPoint) || "Need trucks";
  const goal = clean(input.goal) || "Start a useful conversation";
  const styleGuidance = clean(input.styleGuidance);
  const draftText = clean(input.draftText);

  if (draftText) {
    return [
      `${draftText}

Looking for real-world input from people actually doing the work. What would you add, change, or call out?`,

      `Question for ${groupName}:

${draftText}

I am trying to understand what actually works in the field, not what sounds good on paper. What are you seeing?`,

      `For the ${platform} crew in ${groupName}:

${draftText}

No sales pitch. I am looking for the practical side from people who deal with this every day.`
    ];
  }

  const groundedRule = styleGuidance
    ? `

Style direction:
${styleGuidance}`
    : "";

  return [
    `Question for ${groupName}:

I keep hearing the same problem around ${painPoint.toLowerCase()}.

For the people actually running trucks, dispatching work, or trying to keep jobs moving, what usually causes this first?

Trying to better understand the real-world side of ${topic.toLowerCase()} so we can build around what actually matters.${groundedRule}`,

    `${groupName} — looking for honest input.

When ${painPoint.toLowerCase()} becomes the problem, what is usually behind it?

- Not enough trucks available?
- Timing?
- Rates?
- Communication?
- Something else?

I am not looking for theory. I am looking for what actually happens on the ground.${groundedRule}`,

    `For anyone dealing with ${topic.toLowerCase()}:

If someone wanted to help solve ${painPoint.toLowerCase()} without wasting your time, what would they need to understand first?

Looking for the stuff people only know after doing the work for years.${groundedRule}`
  ];
}

function safeJsonOptions(value: string) {
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace < firstBrace) return null;

  try {
    const parsed = JSON.parse(value.slice(firstBrace, lastBrace + 1)) as {
      postOptions?: unknown;
    };

    if (!Array.isArray(parsed.postOptions)) return null;

    return parsed.postOptions
      .map((item) => clean(item))
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const input = (await request.json().catch(() => ({}))) as BuilderInput;
  const fallback = fallbackOptions(input);

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      source: "template_fallback",
      postOptions: fallback,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.72,
        messages: [
          {
            role: "system",
            content:
              "You write grounded social media post drafts for a trucking/business CRM. Do not automate posting, scraping, monitoring, or platform actions. Avoid cheesy, cutesy, fake, corporate, influencer, or hype language. Write plainspoken posts that respect blue-collar workers, owner operators, drivers, dispatchers, contractors, and people doing hard work. Do not pretend to have personal experience unless the user supplied it. Return strict JSON only.",
          },
          {
            role: "user",
            content: `Create 3 social post options.

Platform: ${clean(input.platform) || "Facebook"}
Group: ${clean(input.groupName) || "Not specified"}
Topic: ${clean(input.topic) || "Not specified"}
Pain point: ${clean(input.painPoint) || "Not specified"}
Goal: ${clean(input.goal) || "Not specified"}
Tone: ${clean(input.tone) || "Friendly"}

User style / reality-check instructions:
${clean(input.styleGuidance) || "No extra style guidance supplied."}

Optional rough draft to polish:
${clean(input.draftText) || "No rough draft supplied."}

Hard rules:
- No “family.”
- No “journey.”
- No “let's chat and share tips.”
- No forced excitement.
- No emojis unless the user specifically asks for them.
- No fake trucker slang.
- No corporate marketing voice.
- No pretending to be a driver, owner operator, or contractor unless the user supplied that first-hand perspective.
- Make the post sound like it came from a real person who respects hard work.
- The post should create conversation, ask for practical input, or invite owner-operator perspective.
- Return only JSON like {"postOptions":["A","B","C"]}.`,
          },
        ],
      }),
    });

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json.choices?.[0]?.message?.content || "";
    const parsedOptions = safeJsonOptions(content);

    return NextResponse.json({
      source: parsedOptions ? "openai" : "template_fallback",
      postOptions: parsedOptions || fallback,
    });
  } catch {
    return NextResponse.json({
      source: "template_fallback",
      postOptions: fallback,
    });
  }
}
