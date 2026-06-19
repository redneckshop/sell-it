import { NextRequest, NextResponse } from "next/server";

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  primaryType?: string;
  primaryTypeDisplayName?: {
    text?: string;
  };
};

type GooglePlacesSearchResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
};

function extractSearchText(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(trimmedValue);
    const queryValue =
      url.searchParams.get("q") ||
      url.searchParams.get("query") ||
      url.searchParams.get("textQuery");

    if (queryValue) {
      return queryValue.trim();
    }
  } catch {
    // Not a URL. Treat the value as a raw search phrase.
  }

  return trimmedValue.replace(/\+/g, " ").trim();
}

function normalizeWebsite(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value.trim() || null;
}

function placeName(place: GooglePlace) {
  return place.displayName?.text?.trim() || "";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    searchText?: string;
    maxResults?: number;
    pageToken?: string;
  } | null;

  const searchText = extractSearchText(body?.searchText ?? "");
  const maxResults = Math.min(Math.max(Number(body?.maxResults) || 20, 1), 20);
  const pageToken = (body?.pageToken ?? "").trim();

  if (!searchText) {
    return NextResponse.json(
      { error: "Enter a Google search URL or search phrase." },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing Google Places API key. Add GOOGLE_PLACES_API_KEY to .env.local, then restart npm run dev.",
      },
      { status: 500 }
    );
  }

  const requestBody: {
    textQuery: string;
    pageSize: number;
    languageCode: string;
    pageToken?: string;
  } = {
    textQuery: searchText,
    pageSize: maxResults,
    languageCode: "en",
  };

  if (pageToken) {
    requestBody.pageToken = pageToken;
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.businessStatus,places.primaryType,places.primaryTypeDisplayName,nextPageToken",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        error: `Google Places search failed (${response.status}): ${errorText.slice(
          0,
          500
        )}`,
      },
      { status: response.status }
    );
  }

  const data = (await response.json()) as GooglePlacesSearchResponse;
  const places = Array.isArray(data.places) ? data.places : [];

  const leads = places
    .map((place, index) => {
      const name = placeName(place);

      if (!name) {
        return null;
      }

      return {
        resultKey: place.id || `${pageToken || "first"}-${index}-${name}`,
        placeId: place.id || null,
        name,
        address: place.formattedAddress || null,
        phone:
          place.nationalPhoneNumber ||
          place.internationalPhoneNumber ||
          null,
        website: normalizeWebsite(place.websiteUri),
        googleMapsUri: place.googleMapsUri || null,
        businessStatus: place.businessStatus || null,
        primaryType:
          place.primaryTypeDisplayName?.text || place.primaryType || null,
        sourceQuery: searchText,
      };
    })
    .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead));

  return NextResponse.json({
    searchText,
    leads,
    nextPageToken: data.nextPageToken || null,
  });
}
