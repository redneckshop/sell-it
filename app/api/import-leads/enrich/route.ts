import { NextRequest, NextResponse } from "next/server";

type EnrichmentResult = {
  title: string | null;
  description: string | null;
  emails: string[];
  phones: string[];
  keywords: string[];
  notes: string[];
  fetchedUrl: string;
};

const SERVICE_KEYWORDS = [
  "trucking",
  "truck",
  "hauling",
  "hauler",
  "dirt",
  "gravel",
  "aggregate",
  "excavation",
  "excavating",
  "belly dump",
  "side dump",
  "end dump",
  "dump truck",
  "lowboy",
  "flatbed",
  "sand",
  "rock",
  "ready mix",
  "concrete",
  "construction",
  "sitework",
  "demolition",
  "septic",
  "transportation",
  "logistics",
];

function normalizeUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueValues(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? cleanText(match[1]).slice(0, 160) : null;
}

function extractDescription(html: string) {
  const metaMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);

  return metaMatch ? cleanText(metaMatch[1]).slice(0, 300) : null;
}

function extractEmails(text: string) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];

  return uniqueValues(
    matches
      .map((email) => email.toLowerCase())
      .filter((email) => !email.includes(".png") && !email.includes(".jpg"))
  ).slice(0, 8);
}

function extractPhones(text: string) {
  const matches =
    text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) ?? [];

  return uniqueValues(matches).slice(0, 8);
}

function extractKeywords(text: string) {
  const lowerText = text.toLowerCase();

  return SERVICE_KEYWORDS.filter((keyword) => lowerText.includes(keyword)).slice(
    0,
    20
  );
}

function summarizeNotes(result: EnrichmentResult) {
  const notes: string[] = [];

  if (result.title) notes.push(`Website title: ${result.title}`);
  if (result.description) notes.push(`Website description: ${result.description}`);
  if (result.emails.length > 0) notes.push(`Emails found: ${result.emails.join(", ")}`);
  if (result.phones.length > 0) notes.push(`Phones found: ${result.phones.join(", ")}`);
  if (result.keywords.length > 0) notes.push(`Service keywords found: ${result.keywords.join(", ")}`);

  if (notes.length === 0) {
    notes.push("Website loaded, but no obvious phone, email, or service keywords were found on the homepage.");
  }

  return notes;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    website?: string;
  } | null;

  const website = normalizeUrl(body?.website ?? "");

  if (!website) {
    return NextResponse.json(
      { error: "No website was provided for enrichment." },
      { status: 400 }
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(website);
  } catch {
    return NextResponse.json(
      { error: "The website URL is not valid." },
      { status: 400 }
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { error: "Only public http/https websites can be enriched." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "SellItLeadEnrichment/1.0 (+https://localhost; homepage-only lead enrichment)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Website enrichment failed (${response.status}). The site may block automated requests.`,
        },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("text/html")) {
      return NextResponse.json(
        { error: "Website did not return an HTML homepage." },
        { status: 400 }
      );
    }

    const html = await response.text();
    const text = cleanText(html).slice(0, 50000);

    const result: EnrichmentResult = {
      title: extractTitle(html),
      description: extractDescription(html),
      emails: extractEmails(text),
      phones: extractPhones(text),
      keywords: extractKeywords(text),
      notes: [],
      fetchedUrl: parsedUrl.toString(),
    };

    result.notes = summarizeNotes(result);

    return NextResponse.json({ enrichment: result });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Website enrichment timed out."
        : error instanceof Error
          ? error.message
          : "Website enrichment failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}


