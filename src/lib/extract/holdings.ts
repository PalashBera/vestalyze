import { extractFromHtml, fetchPublicHtml } from "@/lib/extract/url";

export type ScrapedHolding = {
  name: string;
  allocationPercentage: number;
};

export type ScrapedFundHoldings = {
  url: string;
  finalUrl: string;
  title: string;
  holdingDate: string;
  holdings: ScrapedHolding[];
};

const SKIP_NAMES =
  /^(cash|debt|treps|cblo|others?|net receivables?|margin|holdings|weight%?|see all|equity|debt & cash)$/i;

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function sectionById(html: string, id: string): string {
  const open = html.match(new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)[^>]*\\sid=["']${id}["'][^>]*>`, "i"));
  if (!open || open.index == null) {
    return "";
  }
  return html.slice(open.index, open.index + 400_000);
}

function parsePercent(raw: string): number | null {
  const match = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    return null;
  }
  return value;
}

function isUsableName(name: string): boolean {
  if (name.length < 2 || name.length > 120) {
    return false;
  }
  if (SKIP_NAMES.test(name)) {
    return false;
  }
  if (/^-+$/.test(name) || /^\d+(\.\d+)?%?$/.test(name)) {
    return false;
  }
  return true;
}

function cellTexts(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => stripTags(match[1]));
}

function parseTableHoldings(html: string): ScrapedHolding[] {
  const rows: ScrapedHolding[] = [];
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  for (const table of tables) {
    const trs = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    let weightIndex = 1;
    for (const tr of trs) {
      const cells = cellTexts(tr);
      if (cells.length < 2) {
        continue;
      }
      const header = cells.map((cell) => cell.toLowerCase());
      const headerWeight = header.findIndex((cell) => cell.includes("weight") || cell === "%");
      if (headerWeight >= 0 && header.some((cell) => cell.includes("holding") || cell.includes("stock") || cell.includes("company"))) {
        weightIndex = headerWeight;
        continue;
      }
      const name = cells[0];
      const allocation = parsePercent(cells[weightIndex] ?? cells[1] ?? "");
      if (!isUsableName(name) || allocation == null) {
        continue;
      }
      rows.push({ name, allocationPercentage: allocation });
    }
  }
  return rows;
}

function parseMarkdownHoldings(text: string): ScrapedHolding[] {
  const rows: ScrapedHolding[] = [];
  for (const line of text.split("\n")) {
    if (!line.includes("|") || /---/.test(line)) {
      continue;
    }
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length < 2) {
      continue;
    }
    if (/holdings|weight/i.test(cells[0]) && /weight|%/i.test(cells[1])) {
      continue;
    }
    const allocation = parsePercent(cells[1]);
    if (!isUsableName(cells[0]) || allocation == null) {
      continue;
    }
    rows.push({ name: cells[0], allocationPercentage: allocation });
  }
  return rows;
}

function parseNamedPercentPairs(html: string): ScrapedHolding[] {
  const rows: ScrapedHolding[] = [];
  const blocks = html.match(/<(?:li|tr|div)[^>]*>[\s\S]*?<\/(?:li|tr|div)>/gi) ?? [];
  for (const block of blocks) {
    const text = stripTags(block);
    const match = text.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*%$/);
    if (!match) {
      continue;
    }
    const name = match[1].replace(/^[\d.]+\s+/, "").trim();
    const allocation = Number(match[2]);
    if (!isUsableName(name) || !Number.isFinite(allocation) || allocation <= 0 || allocation > 100) {
      continue;
    }
    rows.push({ name, allocationPercentage: allocation });
  }
  return rows;
}

function parseJsonHoldings(html: string): ScrapedHolding[] {
  const rows: ScrapedHolding[] = [];
  const objects = html.matchAll(
    /\{\s*"(?:name|stockName|companyName|holdingName|instrumentName)"\s*:\s*"([^"]{2,120})"[\s\S]{0,240}?"(?:weight|weightage|allocation|percentage|percent|perc)"\s*:\s*"?(\d+(?:\.\d+)?)"?/gi,
  );
  for (const match of objects) {
    const name = decodeHtml(match[1]);
    const allocation = Number(match[2]);
    if (!isUsableName(name) || !Number.isFinite(allocation) || allocation <= 0 || allocation > 100) {
      continue;
    }
    rows.push({ name, allocationPercentage: allocation });
  }
  return rows;
}

function parseHoldingDate(html: string): string {
  const match = html.match(/as on[^\d]{0,24}(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})/i);
  if (!match) {
    return new Date().toISOString().slice(0, 10);
  }
  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const month = months[match[2].slice(0, 3).toLowerCase()];
  if (!month) {
    return new Date().toISOString().slice(0, 10);
  }
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  const day = match[1].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dedupe(rows: ScrapedHolding[]): ScrapedHolding[] {
  const seen = new Map<string, ScrapedHolding>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || row.allocationPercentage > existing.allocationPercentage) {
      seen.set(key, row);
    }
  }
  return [...seen.values()].sort((a, b) => b.allocationPercentage - a.allocationPercentage);
}

export function parseHoldingsHtml(html: string): ScrapedHolding[] {
  const holdingsSection = sectionById(html, "holdings");
  const fromSection = holdingsSection ? parseTableHoldings(holdingsSection) : [];
  if (fromSection.length > 0) {
    return dedupe(fromSection);
  }
  const fromPairs = holdingsSection ? parseNamedPercentPairs(holdingsSection) : [];
  if (fromPairs.length > 0) {
    return dedupe(fromPairs);
  }
  const fromPageTables = parseTableHoldings(html);
  if (fromPageTables.length > 0) {
    return dedupe(fromPageTables);
  }
  const fromJson = parseJsonHoldings(html);
  if (fromJson.length > 0) {
    return dedupe(fromJson);
  }
  return dedupe(parseMarkdownHoldings(html));
}

export async function scrapeFundHoldings(rawUrl: string): Promise<ScrapedFundHoldings> {
  const page = await fetchPublicHtml(rawUrl);
  if (/just a moment|cf-browser-verification|challenge-platform/i.test(page.html)) {
    throw Object.assign(
      new Error("The fund page is protected. Open the URL once in a browser, then try sync again."),
      { status: 400 },
    );
  }
  const holdings = parseHoldingsHtml(page.html);
  if (holdings.length === 0) {
    throw Object.assign(
      new Error("No stock split was found in the holdings section of that page."),
      { status: 400 },
    );
  }
  const meta = extractFromHtml(page.html);
  return {
    url: rawUrl.trim(),
    finalUrl: page.finalUrl,
    title: meta.title,
    holdingDate: parseHoldingDate(page.html),
    holdings,
  };
}
