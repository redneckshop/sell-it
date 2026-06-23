export const SELL_IT_BUSINESS_TIME_ZONE = "America/Los_Angeles";

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function keyFromParts(year: number, month: number, day: number) {
  if (!year || !month || !day) return "";
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

export function businessTodayKey(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SELL_IT_BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return keyFromParts(year, month, day);
}

export function dateOnlyKey(value: string | null | undefined) {
  if (!value) return "";

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return businessTodayKey(parsed);
}

export function addDaysToDateKey(startKey: string, days: number) {
  const key = dateOnlyKey(startKey);

  if (!key) return "";

  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  date.setUTCDate(date.getUTCDate() + days);

  return keyFromParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

export function dateKeyToLocalDate(value: string | null | undefined) {
  const key = dateOnlyKey(value);

  if (!key) return null;

  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function dateKeyToNoonUtc(value: string | null | undefined) {
  const key = dateOnlyKey(value);

  if (!key) return null;

  return new Date(`${key}T12:00:00Z`);
}

export function formatDateOnly(value: string | null | undefined) {
  const date = dateKeyToNoonUtc(value);

  if (!date) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatLongDate(value: string | null | undefined) {
  const date = dateKeyToNoonUtc(value);

  if (!date) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) return "No date";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "No date";
  }

  return parsed.toLocaleString();
}

export function daysBetweenDateKeys(startValue: string | null | undefined, endValue: string | null | undefined) {
  const startKey = dateOnlyKey(startValue);
  const endKey = dateOnlyKey(endValue);

  if (!startKey || !endKey) return null;

  const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endKey.split("-").map(Number);

  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.floor((end - start) / 86400000);
}
