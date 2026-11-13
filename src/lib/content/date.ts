const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface ParsedPortfolioDate {
  raw: string;
  isPresent: boolean;
  year: number;
  month?: number;
  day?: number;
  sortKey: number;
}

const YEAR_ONLY_RE = /^(\d{4})$/;
const YEAR_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const FULL_DATE_RE = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

export function isValidPortfolioDate(value: string, allowPresent = false): boolean {
  const trimmed = value.trim();
  if (allowPresent && trimmed === "Present") {
    return true;
  }

  const yearMatch = YEAR_ONLY_RE.exec(trimmed);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return year >= 1900 && year <= 2100;
  }

  const ymMatch = YEAR_MONTH_RE.exec(trimmed);
  if (ymMatch) {
    const year = Number(ymMatch[1]);
    return year >= 1900 && year <= 2100;
  }

  const fullMatch = FULL_DATE_RE.exec(trimmed);
  if (fullMatch) {
    const year = Number(fullMatch[1]);
    const month = Number(fullMatch[2]);
    const day = Number(fullMatch[3]);
    if (year < 1900 || year > 2100) return false;
    return day <= daysInMonth(year, month);
  }

  return false;
}

export function parsePortfolioDate(value: string): ParsedPortfolioDate | null {
  const trimmed = value.trim();
  if (trimmed === "Present") {
    return {
      raw: "Present",
      isPresent: true,
      year: 9999,
      sortKey: 99991231,
    };
  }

  if (!isValidPortfolioDate(trimmed, false)) {
    return null;
  }

  const yearMatch = YEAR_ONLY_RE.exec(trimmed);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return {
      raw: trimmed,
      isPresent: false,
      year,
      sortKey: year * 10000 + 101,
    };
  }

  const ymMatch = YEAR_MONTH_RE.exec(trimmed);
  if (ymMatch) {
    const year = Number(ymMatch[1]);
    const month = Number(ymMatch[2]);
    return {
      raw: trimmed,
      isPresent: false,
      year,
      month,
      sortKey: year * 10000 + month * 100 + 1,
    };
  }

  const fullMatch = FULL_DATE_RE.exec(trimmed);
  if (fullMatch) {
    const year = Number(fullMatch[1]);
    const month = Number(fullMatch[2]);
    const day = Number(fullMatch[3]);
    return {
      raw: trimmed,
      isPresent: false,
      year,
      month,
      day,
      sortKey: year * 10000 + month * 100 + day,
    };
  }

  return null;
}

export function formatPortfolioDate(value?: string): string {
  if (!value) return "";
  const parsed = parsePortfolioDate(value);
  if (!parsed) return value;
  if (parsed.isPresent) return "Present";
  if (parsed.month && parsed.day) {
    return `${MONTH_NAMES[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
  }
  if (parsed.month) {
    return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
  }
  return `${parsed.year}`;
}

export function formatDateRange(startDate: string, endDate?: string): string {
  const startFormatted = formatPortfolioDate(startDate);
  if (!endDate || endDate.trim() === "") {
    return startFormatted;
  }
  const endFormatted = formatPortfolioDate(endDate);
  if (startFormatted === endFormatted) {
    return startFormatted;
  }
  return `${startFormatted} – ${endFormatted}`;
}
