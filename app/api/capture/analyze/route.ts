import { NextResponse } from "next/server";

type CaptureResult = {
  company: string | null;
  contact: string | null;
  opportunity: string | null;
  task: string | null;
  activity: string | null;
  pain_points: string[];
  summary: string;
  confidence: "Low" | "Medium" | "High";
};

function emptyResult(summary: string): CaptureResult {
  return {
    company: null,
    contact: null,
    opportunity: null,
    task: null,
    activity: null,
    pain_points: [],
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

    if (!inputText) {
      return NextResponse.json(
        { error: "Paste some text before analyzing." },
        { status: 400 }
      );
    }

    const prompt = `
You are analyzing raw sales notes for Sell It, an AI-first CRM/business operating system.

Extract structured CRM information from the user's pasted text.

Return ONLY valid JSON. Do not include markdown. Do not include explanations outside JSON.

Use this JSON shape exactly:
{
  "company": string or null,
  "contact": string or null,
  "opportunity": string or null,
  "task": string or null,
  "activity": string or null,
  "pain_points": array of strings,
  "summary": string,
  "confidence": "Low" | "Medium" | "High"
}

Rules:
- Company means a business name.
- Contact means a person's name.
- Opportunity means sales stage or likely sales opportunity, such as Alpha Candidate, Beta Candidate, Paid Customer, Demo Needed, Follow Up.
- Task means the next action the user should take.
- Activity means what already happened, such as call, text, meeting, voicemail, email, research, or note.
- Pain points should be normalized into short business problem names.
- Examples of pain point names: Need Trucks, Need Drivers, Need Work, Paper Tickets, Billing Delays, Dispatch Confusion, Driver Accountability, Broker Communication, Contractor Communication.
- Do not invent facts not supported by the pasted text.
- If something is unclear, use null or an empty array.
`;

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: inputText,
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
      const parsed = JSON.parse(outputText) as CaptureResult;

      return NextResponse.json({
        result: {
          company: parsed.company ?? null,
          contact: parsed.contact ?? null,
          opportunity: parsed.opportunity ?? null,
          task: parsed.task ?? null,
          activity: parsed.activity ?? null,
          pain_points: Array.isArray(parsed.pain_points)
            ? parsed.pain_points
            : [],
          summary: parsed.summary || "No summary returned.",
          confidence: parsed.confidence || "Medium",
        },
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