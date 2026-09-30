export type ScrapedHolding = {
  name: string;
  allocationPercentage: number;
};

export type FundPage = {
  title: string;
  holdingDate: string;
  holdings: ScrapedHolding[];
};

const SKIP_NAMES =
  /^(cash|debt|treps|cblo|others?|net receivables?|margin|holdings|companies|weight%?|see all|see more|equity|debt & cash|expense ratio|overall return|exit load|turnover|aum|nav|dividend yield|this fund|category avg|small-cap avg)$/i;

const SKIP_NAME_PARTS = /expense\s*ratio|overall\s*return|exit\s*load|dividend\s*yield/i;

const SKIP_JSON_KEYS =
  /^(peers|ranking|fund_performance|historic_performance|fund_overview|asset_allocation|sector_allocation|benchmarks|analyst_forecast|research|insights_data|about|static_content|meta_info|comparisons|market_cap_break_up|sector_break_up|asset_allocation_break_up)$/i;

const HOLDINGS_HEADING = /companies\s+in\b|holdings\s+details|top\s+holdings|portfolio\s+holdings|stock\s+split/i;
const IGNORE_HEADING = /overall\s+return|expense\s+ratio|fundamentals|stock\s+performance|fund\s+overview|fund\s+performance/i;

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function getPath(root: unknown, path: string[]): unknown {
  let current = root;
  for (const key of path) {
    const record = asRecord(current);
    if (!record || !(key in record)) {
      return undefined;
    }
    current = record[key];
  }
  return current;
}

function roundAllocation(value: number): number {
  return Number(value.toFixed(4));
}

function parsePercent(raw: string): number | null {
  const match = raw.replace(/,/g, "").match(/([-−]\s*)?(\d+(?:\.\d+)?)\s*%/);
  if (!match || match[1]) {
    return null;
  }
  const value = Number(match[2]);
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    return null;
  }
  return value;
}

function parseAllocationNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0 && raw <= 100) {
    return raw;
  }
  if (typeof raw === "string") {
    const fromPercent = parsePercent(raw);
    if (fromPercent != null) {
      return fromPercent;
    }
    const value = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0 && value <= 100) {
      return value;
    }
  }
  return null;
}

function isUsableName(name: string): boolean {
  if (name.length < 2 || name.length > 120) {
    return false;
  }
  if (SKIP_NAMES.test(name) || SKIP_NAME_PARTS.test(name)) {
    return false;
  }
  if (/^-+$/.test(name) || /^\d+(\.\d+)?%?$/.test(name)) {
    return false;
  }
  return true;
}

function toHolding(name: string, allocation: number | null): ScrapedHolding | null {
  const cleaned = name.trim();
  if (!isUsableName(cleaned) || allocation == null) {
    return null;
  }
  return { name: cleaned, allocationPercentage: roundAllocation(allocation) };
}

function boundedSectionById(html: string, id: string): string {
  const open = html.match(new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)[^>]*\\sid=["']${id}["'][^>]*>`, "i"));
  if (!open || open.index == null) {
    return "";
  }
  const start = open.index + open[0].length;
  const rest = html.slice(start);
  const next = rest.search(/<(?:section|div)[^>]*\sid=["'](?!holdings)[a-z0-9-]+["']/i);
  const end = next >= 0 ? start + next : start + Math.min(rest.length, 120_000);
  return html.slice(open.index, end);
}

function boundedHeadingSection(html: string, heading: RegExp): string {
  const headings = html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  for (const match of headings) {
    if (match.index == null || !heading.test(stripTags(match[1]))) {
      continue;
    }
    const from = match.index;
    const rest = html.slice(from);
    const boundary = rest.search(/<\/section>|<section\b|<div[^>]*\sid=["'][a-z0-9-]+["']/i);
    const end = boundary >= 0 ? from + boundary : from + Math.min(rest.length, 80_000);
    return html.slice(from, end);
  }
  return "";
}

function stripIgnoredSections(html: string): string {
  return html
    .replace(/<(?:section|div)[^>]*\sid=["'](?:performance|fund-overview|fundamentals|peers)["'][^>]*>[\s\S]*?(?=<section\b|<div[^>]*\sid=["'][a-z0-9-]+["']|$)/gi, " ")
    .replace(/<h[1-3][^>]*>[\s\S]*?(?:overall\s+return|expense\s+ratio)[\s\S]*?<\/h[1-3]>[\s\S]*?(?=<h[1-3]\b|<section\b|$)/gi, " ");
}

function holdingsRegion(html: string): string {
  const byHoldingsId = boundedSectionById(html, "holdings");
  if (byHoldingsId) {
    return byHoldingsId;
  }
  const byCompanies = boundedHeadingSection(html, /companies\s+in\b/i);
  if (byCompanies) {
    return byCompanies;
  }
  return boundedHeadingSection(html, HOLDINGS_HEADING);
}

function cellTexts(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => stripTags(match[1]));
}

function isHoldingsTable(tableHtml: string): boolean {
  const heading = stripTags((tableHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).slice(0, 4).join(" "));
  if (IGNORE_HEADING.test(heading) || /expense\s*ratio|overall\s*return/i.test(heading)) {
    return false;
  }
  return /holding|weight|compan|stock|allocation/i.test(heading);
}

function parseTableHoldings(html: string, requireHoldingsHeader = false): ScrapedHolding[] {
  const rows: ScrapedHolding[] = [];
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  for (const table of tables) {
    if (requireHoldingsHeader && !isHoldingsTable(table)) {
      continue;
    }
    const trs = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    let weightIndex = 1;
    let sawHoldingsHeader = false;
    for (const tr of trs) {
      const cells = cellTexts(tr);
      if (cells.length < 2) {
        continue;
      }
      const header = cells.map((cell) => cell.toLowerCase());
      if (IGNORE_HEADING.test(header.join(" ")) || header.some((cell) => SKIP_NAME_PARTS.test(cell))) {
        break;
      }
      const headerWeight = header.findIndex((cell) => cell.includes("weight") || cell.includes("holding %") || cell === "%");
      if (headerWeight >= 0 && header.some((cell) => /holding|stock|company/.test(cell))) {
        weightIndex = headerWeight;
        sawHoldingsHeader = true;
        continue;
      }
      if (requireHoldingsHeader && !sawHoldingsHeader && !isHoldingsTable(table)) {
        continue;
      }
      const holding = toHolding(cells[0], parsePercent(cells[weightIndex] ?? cells[1] ?? ""));
      if (holding) {
        rows.push(holding);
      }
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
    if (/holdings|weight|compan/i.test(cells[0]) && /weight|%|holding/i.test(cells[1])) {
      continue;
    }
    const holding = toHolding(cells[0], parsePercent(cells[1]));
    if (holding) {
      rows.push(holding);
    }
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
    const holding = toHolding(match[1].replace(/^[\d.]+\s+/, ""), Number(match[2]));
    if (holding) {
      rows.push(holding);
    }
  }
  return rows;
}

function parseJsonHoldings(html: string): ScrapedHolding[] {
  const rows: ScrapedHolding[] = [];
  const objects = html.matchAll(
    /\{\s*"(?:name|stockName|stock_name|companyName|holdingName|instrumentName)"\s*:\s*"([^"]{2,120})"[\s\S]{0,240}?"(?:weight|weightage|allocation|percentage|percent|perc|percentage_composition)"\s*:\s*"?(\d+(?:\.\d+)?)"?/gi,
  );
  for (const match of objects) {
    const holding = toHolding(decodeHtml(match[1]), Number(match[2]));
    if (holding) {
      rows.push(holding);
    }
  }
  return rows;
}

function parseNextData(html: string): unknown | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[1]) as unknown;
  } catch {
    return null;
  }
}

function parseStockComposition(value: unknown): ScrapedHolding[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: ScrapedHolding[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }
    const name = String(record.stock_name ?? record.stockName ?? record.name ?? "");
    const allocation = parseAllocationNumber(
      record.percentage_composition ?? record.percentageComposition ?? record.weight ?? record.perc ?? record.allocation,
    );
    const holding = toHolding(name, allocation);
    if (holding) {
      rows.push(holding);
    }
  }
  return rows;
}

function parseMfHoldingsBlock(value: unknown): ScrapedHolding[] {
  const root = asRecord(value);
  const groups = root?.holdings;
  if (!Array.isArray(groups)) {
    return [];
  }
  const rows: ScrapedHolding[] = [];
  for (const group of groups) {
    const table = asRecord(asRecord(group)?.table);
    if (!table || !Array.isArray(table.rows)) {
      continue;
    }
    const headers = Array.isArray(table.columnHeader) ? table.columnHeader : [];
    const weightHeader = headers
      .map((header) => asRecord(header))
      .find((header) => header && /weight|holding\s*%/i.test(String(header.title ?? "")));
    const weightHeaderId = typeof weightHeader?.id === "number" ? weightHeader.id : null;
    for (const row of table.rows) {
      const item = asRecord(row);
      if (!item) {
        continue;
      }
      const columns = Array.isArray(item.columns) ? item.columns : [];
      let allocation = parseAllocationNumber(item.perc);
      if (allocation == null && weightHeaderId != null) {
        const weightCol = columns
          .map((column) => asRecord(column))
          .find((column) => column && column.headerId === weightHeaderId);
        allocation = parseAllocationNumber(weightCol?.title);
      }
      // With a weight column, a 0% weight means skip the row. Other columns are
      // trends like "1M Change" and must never stand in for the weight.
      if (allocation == null && weightHeaderId == null) {
        for (const column of columns) {
          const record = asRecord(column);
          if (!record || record.trait === "graph") {
            continue;
          }
          allocation = parseAllocationNumber(record.title);
          if (allocation != null) {
            break;
          }
        }
      }
      const holding = toHolding(String(item.name ?? ""), allocation);
      if (holding) {
        rows.push(holding);
      }
    }
  }
  return rows;
}

function walkEmbeddedHoldings(value: unknown, out: ScrapedHolding[]): void {
  if (Array.isArray(value)) {
    const composition = parseStockComposition(value);
    if (composition.length >= 3) {
      out.push(...composition);
      return;
    }
    for (const item of value) {
      walkEmbeddedHoldings(item, out);
    }
    return;
  }
  const record = asRecord(value);
  if (!record) {
    return;
  }
  const mfHoldings = parseMfHoldingsBlock(record);
  if (mfHoldings.length >= 3) {
    out.push(...mfHoldings);
    return;
  }
  for (const [key, child] of Object.entries(record)) {
    if (SKIP_JSON_KEYS.test(key)) {
      continue;
    }
    walkEmbeddedHoldings(child, out);
  }
}

function parseEmbeddedHoldings(html: string): ScrapedHolding[] {
  const data = parseNextData(html);
  if (!data) {
    return [];
  }
  const etf = parseStockComposition(
    getPath(data, ["props", "pageProps", "entityAPIDataFromAPI", "catalog", "etf_details", "stock_composition"]),
  );
  if (etf.length > 0) {
    return etf;
  }
  const mf = parseMfHoldingsBlock(getPath(data, ["props", "pageProps", "mutualFundsDetailData", "data", "holdings"]));
  if (mf.length > 0) {
    return mf;
  }
  const walked: ScrapedHolding[] = [];
  walkEmbeddedHoldings(data, walked);
  return walked;
}

function parseEmbeddedHoldingDate(html: string): string | null {
  const data = parseNextData(html);
  const asOn = getPath(data, ["props", "pageProps", "mutualFundsDetailData", "data", "holdings", "as_on"]);
  if (typeof asOn === "string" && /\d{1,2}[-/\s][A-Za-z]{3}/.test(asOn)) {
    return parseHoldingDate(`as on ${asOn}`);
  }
  return null;
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

export function findSeeMoreUrl(html: string, baseUrl: string): string {
  const scoped = holdingsRegion(html) || html;
  const match = scoped.match(
    /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]{0,120}?see\s+(?:more|all)|see\s+(?:more|all)[\s\S]{0,80}?<a[^>]+href=["']([^"']+)["']/i,
  );
  const href = match?.[1] || match?.[2];
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
    return "";
  }
  try {
    const resolved = new URL(href, baseUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return "";
    }
    if (resolved.origin !== new URL(baseUrl).origin) {
      return "";
    }
    return resolved.toString();
  } catch {
    return "";
  }
}

export function parseHoldingsHtml(html: string): ScrapedHolding[] {
  const fromEmbedded = parseEmbeddedHoldings(html);
  if (fromEmbedded.length > 0) {
    return dedupe(fromEmbedded);
  }
  const region = holdingsRegion(html);
  const scoped = region ? stripIgnoredSections(region) : "";
  const fromSection = scoped ? parseTableHoldings(scoped) : [];
  if (fromSection.length > 0) {
    return dedupe(fromSection);
  }
  const fromPairs = scoped ? parseNamedPercentPairs(scoped) : [];
  if (fromPairs.length > 0) {
    return dedupe(fromPairs);
  }
  const fromPageTables = parseTableHoldings(stripIgnoredSections(html), true);
  if (fromPageTables.length > 0) {
    return dedupe(fromPageTables);
  }
  const fromJson = parseJsonHoldings(html);
  if (fromJson.length > 0) {
    return dedupe(fromJson);
  }
  return dedupe(parseMarkdownHoldings(html));
}

/**
 * Cloudflare's interstitial, not a real page. Normal pages can still load
 * `/cdn-cgi/challenge-platform/scripts/jsd`, so that path alone is not a signal.
 */
export function isBotChallengePage(html: string): boolean {
  return /<title>\s*just a moment|_cf_chl_opt|cf-browser-verification/i.test(html);
}

/** Applies the same name and weight rules as scraping, for rows from any source. */
export function normalizeHoldings(rows: unknown[]): ScrapedHolding[] {
  const cleaned: ScrapedHolding[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    const holding = toHolding(
      typeof record?.name === "string" ? record.name : "",
      parseAllocationNumber(record?.allocationPercentage),
    );
    if (holding) {
      cleaned.push(holding);
    }
  }
  return dedupe(cleaned);
}

function pageTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtml((match?.[1] ?? "").replace(/\s+/g, " ").trim()).slice(0, 300);
}

export function parseFundPage(html: string): FundPage {
  return {
    title: pageTitle(html),
    holdingDate: parseEmbeddedHoldingDate(html) ?? parseHoldingDate(html),
    holdings: parseHoldingsHtml(html),
  };
}
