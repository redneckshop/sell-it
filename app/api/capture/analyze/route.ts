import { NextResponse } from "next/server";

type CaptureResult = {
  company: string | null;
  contact: string | null;
  contacts: string[];
  phone: string | null;
  location: string | null;
  fleet_size: string | null;
  opportunity: string | null;
  task: string | null;
  activity: string | null;
  pain_points: string[];
  notes: string | null;
  summary: string;
  confidence: "Low" | "Medium" | "High";
};

function emptyResult(summary: string): CaptureResult {
  return {
    company: null,
    contact: null,
    contacts: [],
    phone: null,
    location: null,
    fleet_size: null,
    opportunity: null,
    task: null,
    activity: null,
    pain_points: [],
    notes: null,
    summary,
    confidence: "Low",
  };
}

function extractOutputText(apiResponse: any): string {
  if (typeof apiResponse.output_text === "string") {
    return apiResponse.output_text;
  }

  const output = apiResponse.output;

  if (Array.isArray(output)) {
    const textParts: string[] = [];

    for (const item of output) {
      if (Array.isArray(item.content)) {
        for (const contentItem of item.content) {
          if (typeof contentItem.text === "string") {
            textParts.push(contentItem.text);
          }
        }
      }
    }

    return textParts.join("\n").trim();
  }

  return "";
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const cleanValue = String(value || "").trim();

    if (!cleanValue) continue;

    const key = cleanValue.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    cleaned.push(cleanValue);
  }

  return cleaned;
}

function cleanParsedResult(parsed: Partial<CaptureResult>): CaptureResult {
  const contacts = dedupeStrings(
    Array.isArray(parsed.contacts) ? parsed.contacts : []
  );

  const primaryContact = parsed.contact || contacts[0] || null;

  const allContacts = dedupeStrings([
    primaryContact || "",
    ...contacts,
  ]);

  const confidence =
    parsed.confidence === "Low" ||
    parsed.confidence === "Medium" ||
    parsed.confidence === "High"
      ? parsed.confidence
      : "Medium";

  return {
    company: parsed.company ?? null,
    contact: primaryContact,
    contacts: allContacts,
    phone: parsed.phone ?? null,
    location: parsed.location ?? null,
    fleet_size: parsed.fleet_size ?? null,
    opportunity: parsed.opportunity ?? null,
    task: parsed.task ?? null,
    activity: parsed.activity ?? null,
    pain_points: Array.isArray(parsed.pain_points)
      ? dedupeStrings(parsed.pain_points)
      : [],
    notes: parsed.notes ?? null,
    summary: parsed.summary || "No summary returned.",
    confidence,
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is missing. Add it to .env.local and restart the dev server.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const inputText = String(body.text || "").trim();
    const imageDataUrl = String(body.imageDataUrl || "").trim();
    const imageFileName = String(body.imageFileName || "").trim();

    if (!inputText && !imageDataUrl) {
      return NextResponse.json(
        { error: "Paste text or upload a screenshot before analyzing." },
        { status: 400 }
      );
    }

    if (imageDataUrl && !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        {
          error:
            "Screenshot must be a PNG, JPG, JPEG, or WEBP image data URL.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are analyzing sales intelligence for Sell It, an AI-first CRM/business operating system.

The user may provide pasted text, a screenshot image, meeting notes, a transcript, a Facebook thread, or both text and image.

Extract structured CRM information from the user's content.

Return ONLY valid JSON. Do not include markdown. Do not include explanations outside JSON.

Use this JSON shape exactly:
{
  "company": string or null,
  "contact": string or null,
  "contacts": array of strings,
  "phone": string or null,
  "location": string or null,
  "fleet_size": string or null,
  "opportunity": string or null,
  "task": string or null,
  "activity": string or null,
  "pain_points": array of strings,
  "notes": string or null,
  "summary": string,
  "confidence": "Low" | "Medium" | "High"
}

Rules:
- Company means a business name, group name, community name, contractor name, trucking company name, or organization name.
- Contact means the most important person found, if there is one.
- Contacts must include every person clearly mentioned in the content.
- In a discussion thread, include commenters or speakers as contacts if their names are visible.
- In a meeting transcript, include attendees or speakers as contacts if their names are visible.
- If multiple contacts appear, put the best primary person in "contact" and put all people in "contacts".
- Phone means a phone number found in the text or screenshot.
- Location means city/state/region if visible or strongly implied.
- Fleet size means trucks, drivers, trailers, or similar capacity count if visible.
- Opportunity means sales stage or likely sales opportunity, such as Alpha Candidate, Beta Candidate, Paid Customer, Demo Needed, Follow Up, Research Lead, or Community Intelligence.
- Task means the next action the user should take.
- Activity means what already happened, such as call, text, meeting, voicemail, email, Facebook discussion, screenshot review, website research, or note.
- Pain points should be inferred from the conversation, even if the phrase "pain point" is not used.
- Normalize pain points into short business problem names.
- Examples of pain point names: Need Trucks, Need Drivers, Need Work, Paper Tickets, Billing Delays, Dispatch Confusion, Driver Accountability, Broker Communication, Contractor Communication.
- Notes should include useful details that do not fit the other fields, including names of multiple contacts and what each person said.
- Do not invent facts not supported by the pasted text or screenshot.
- If something is unclear, use null or an empty array.
`;

    const userContent: any[] = [
      {
        type: "input_text",
        text: `
Analyze this Sell It capture.

Pasted text:
${inputText || "[No pasted text provided]"}

Screenshot filename:
${imageFileName || "[No screenshot provided]"}
`,
      },
    ];

    if (imageDataUrl) {
      userContent.push({
        type: "input_image",
        image_url: imageDataUrl,
      });
    }

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    const apiResponse = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return NextResponse.json(
        {
          error:
            apiResponse?.error?.message ||
            "OpenAI request failed. Check your API key and billing.",
        },
        { status: 500 }
      );
    }

    const outputText = extractOutputText(apiResponse);

    if (!outputText) {
      return NextResponse.json({
        result: emptyResult("AI returned no readable text."),
        raw: apiResponse,
      });
    }

    try {
      const parsed = JSON.parse(outputText) as Partial<CaptureResult>;

      return NextResponse.json({
        result: cleanParsedResult(parsed),
      });
    } catch {
      return NextResponse.json({
        result: emptyResult("AI responded, but the result was not valid JSON."),
        raw_text: outputText,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Capture analysis failed: ${message}` },
      { status: 500 }
    );
  }
}