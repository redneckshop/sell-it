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

type MultiCaptureRecord = {
  selected: boolean;
  record_type: "Company" | "Contact" | "CompanyContact" | "Lead" | "Other";
  company: string | null;
  contact: string | null;
  contacts: string[];
  phone: string | null;
  email: string | null;
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

type SmartCaptureResponse = {
  result: CaptureResult;
  multi_records: MultiCaptureRecord[];
  source_type:
    | "single_lead"
    | "conversation"
    | "screenshot"
    | "csv_or_table"
    | "multi_record_list"
    | "unknown";
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

function emptySmartResponse(summary: string): SmartCaptureResponse {
  return {
    result: emptyResult(summary),
    multi_records: [],
    source_type: "unknown",
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

function cleanConfidence(value: unknown): "Low" | "Medium" | "High" {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
}

function cleanSourceType(value: unknown): SmartCaptureResponse["source_type"] {
  if (
    value === "single_lead" ||
    value === "conversation" ||
    value === "screenshot" ||
    value === "csv_or_table" ||
    value === "multi_record_list" ||
    value === "unknown"
  ) {
    return value;
  }

  return "unknown";
}

function cleanParsedResult(parsed: Partial<CaptureResult>): CaptureResult {
  const contacts = dedupeStrings(
    Array.isArray(parsed.contacts) ? parsed.contacts : []
  );

  const primaryContact =
    typeof parsed.contact === "string" && parsed.contact.trim()
      ? parsed.contact.trim()
      : contacts[0] || null;

  const allContacts = dedupeStrings([primaryContact || "", ...contacts]);

  return {
    company:
      typeof parsed.company === "string" && parsed.company.trim()
        ? parsed.company.trim()
        : null,
    contact: primaryContact,
    contacts: allContacts,
    phone:
      typeof parsed.phone === "string" && parsed.phone.trim()
        ? parsed.phone.trim()
        : null,
    location:
      typeof parsed.location === "string" && parsed.location.trim()
        ? parsed.location.trim()
        : null,
    fleet_size:
      typeof parsed.fleet_size === "string" && parsed.fleet_size.trim()
        ? parsed.fleet_size.trim()
        : null,
    opportunity:
      typeof parsed.opportunity === "string" && parsed.opportunity.trim()
        ? parsed.opportunity.trim()
        : null,
    task:
      typeof parsed.task === "string" && parsed.task.trim()
        ? parsed.task.trim()
        : null,
    activity:
      typeof parsed.activity === "string" && parsed.activity.trim()
        ? parsed.activity.trim()
        : null,
    pain_points: Array.isArray(parsed.pain_points)
      ? dedupeStrings(parsed.pain_points)
      : [],
    notes:
      typeof parsed.notes === "string" && parsed.notes.trim()
        ? parsed.notes.trim()
        : null,
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "No summary returned.",
    confidence: cleanConfidence(parsed.confidence),
  };
}

function cleanMultiRecord(parsed: Partial<MultiCaptureRecord>): MultiCaptureRecord {
  const contacts = dedupeStrings(
    Array.isArray(parsed.contacts) ? parsed.contacts : []
  );

  const primaryContact =
    typeof parsed.contact === "string" && parsed.contact.trim()
      ? parsed.contact.trim()
      : contacts[0] || null;

  const allContacts = dedupeStrings([primaryContact || "", ...contacts]);

  const recordType =
    parsed.record_type === "Company" ||
    parsed.record_type === "Contact" ||
    parsed.record_type === "CompanyContact" ||
    parsed.record_type === "Lead" ||
    parsed.record_type === "Other"
      ? parsed.record_type
      : "Other";

  return {
    selected: parsed.selected !== false,
    record_type: recordType,
    company:
      typeof parsed.company === "string" && parsed.company.trim()
        ? parsed.company.trim()
        : null,
    contact: primaryContact,
    contacts: allContacts,
    phone:
      typeof parsed.phone === "string" && parsed.phone.trim()
        ? parsed.phone.trim()
        : null,
    email:
      typeof parsed.email === "string" && parsed.email.trim()
        ? parsed.email.trim()
        : null,
    location:
      typeof parsed.location === "string" && parsed.location.trim()
        ? parsed.location.trim()
        : null,
    fleet_size:
      typeof parsed.fleet_size === "string" && parsed.fleet_size.trim()
        ? parsed.fleet_size.trim()
        : null,
    opportunity:
      typeof parsed.opportunity === "string" && parsed.opportunity.trim()
        ? parsed.opportunity.trim()
        : null,
    task:
      typeof parsed.task === "string" && parsed.task.trim()
        ? parsed.task.trim()
        : null,
    activity:
      typeof parsed.activity === "string" && parsed.activity.trim()
        ? parsed.activity.trim()
        : null,
    pain_points: Array.isArray(parsed.pain_points)
      ? dedupeStrings(parsed.pain_points)
      : [],
    notes:
      typeof parsed.notes === "string" && parsed.notes.trim()
        ? parsed.notes.trim()
        : null,
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "No record summary returned.",
    confidence: cleanConfidence(parsed.confidence),
  };
}

function cleanSmartResponse(parsed: any): SmartCaptureResponse {
  const rawResult =
    parsed?.result ||
    parsed?.single_result ||
    parsed?.singleResult ||
    parsed ||
    {};

  const result = cleanParsedResult(rawResult);

  const rawMultiRecords = Array.isArray(parsed?.multi_records)
    ? parsed.multi_records
    : Array.isArray(parsed?.multiRecords)
    ? parsed.multiRecords
    : [];

  const multiRecords = rawMultiRecords
    .map((record: Partial<MultiCaptureRecord>) => cleanMultiRecord(record))
    .filter((record: MultiCaptureRecord) => {
      return Boolean(
        record.company ||
          record.contact ||
          record.phone ||
          record.email ||
          record.location ||
          record.notes ||
          record.summary
      );
    })
    .slice(0, 100);

  return {
    result,
    multi_records: multiRecords,
    source_type: cleanSourceType(parsed?.source_type),
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
        { error: "Paste text, upload a readable file, or upload a screenshot before analyzing." },
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

The user may provide:
- pasted notes
- screenshots
- Facebook posts
- Facebook discussions
- meeting notes
- Krisp or Google Meet transcripts
- CSV text
- copied tables
- messy prospect lists
- mixed company/contact files

Your job is to extract structured CRM information.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside JSON.

Use this JSON shape exactly:

{
  "source_type": "single_lead" | "conversation" | "screenshot" | "csv_or_table" | "multi_record_list" | "unknown",
  "result": {
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
  },
  "multi_records": [
    {
      "selected": true,
      "record_type": "Company" | "Contact" | "CompanyContact" | "Lead" | "Other",
      "company": string or null,
      "contact": string or null,
      "contacts": array of strings,
      "phone": string or null,
      "email": string or null,
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
  ]
}

Rules for result:
- result is the best single summary of the whole capture.
- Keep result compatible with the normal AI Capture review screen.
- If the source is one lead, one screenshot, one post, or one conversation, result should hold the main CRM extraction.
- If the source is a CSV/table/list with many rows, result should summarize the whole file.

Rules for multi_records:
- Use multi_records when the source contains multiple possible companies, contacts, or leads.
- For CSV/table/list data, create one multi_record per meaningful row or entry.
- Do not put company names in the contact field unless the source clearly identifies a person.
- If a row appears to be only a company, use record_type "Company".
- If a row has company + person/contact info, use record_type "CompanyContact".
- If a row appears to be a lead/opportunity, use record_type "Lead".
- contacts must include every person clearly associated with that record.
- contact should be the best primary person for that record.
- If multiple contacts are listed in one row, include all of them in contacts.
- phone should be the best phone number associated with that record.
- email should be the best email associated with that record.
- location should be city/state/region if visible.
- fleet_size should capture truck count, driver count, unit count, trailers, equipment count, or similar capacity if visible.
- opportunity should only be filled when a likely sales opportunity is visible or strongly implied.
- task should be a practical next action.
- pain_points should be inferred only when there is evidence.
- notes should preserve useful details from the row/source.
- summary should be short but useful.
- confidence should be Low, Medium, or High.

Important:
- Do not invent facts.
- Do not treat equipment descriptions as people.
- Do not treat company names as people.
- Do not treat random row text as contact names.
- If the file is messy, extract cautiously.
- For very large files, return the best first 100 meaningful records only.
- Prefer clean, useful CRM data over maximum quantity.

Examples of pain point names:
- Need Trucks
- Need Drivers
- Need Work
- Paper Tickets
- Billing Delays
- Dispatch Confusion
- Driver Accountability
- Broker Communication
- Contractor Communication
- Fleet Upgrade
- Equipment Availability
`;

    const userContent: any[] = [
      {
        type: "input_text",
        text: `
Analyze this Sell It capture.

Pasted text or readable file content:
${inputText || "[No pasted text provided]"}

Source image/file name:
${imageFileName || "[No image filename provided]"}
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
        ...emptySmartResponse("AI returned no readable text."),
        raw: apiResponse,
      });
    }

    try {
      const parsed = JSON.parse(outputText);

      return NextResponse.json(cleanSmartResponse(parsed));
    } catch {
      return NextResponse.json({
        ...emptySmartResponse("AI responded, but the result was not valid JSON."),
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