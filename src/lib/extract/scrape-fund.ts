import {
  findSeeMoreUrl,
  isBotChallengePage,
  normalizeHoldings,
  parseFundPage,
  parseHoldingsHtml,
  type FundPage,
} from "@/lib/extract/holdings";
import { SYNC_BLOCKED_MESSAGE, fetchPublicHtml } from "@/lib/extract/url";

export type ScrapedFundHoldings = FundPage & {
  url: string;
  finalUrl: string;
};

export async function scrapeFundHoldings(rawUrl: string): Promise<ScrapedFundHoldings> {
  const page = await fetchPublicHtml(rawUrl);
  if (isBotChallengePage(page.html)) {
    throw Object.assign(new Error(SYNC_BLOCKED_MESSAGE), { status: 400 });
  }
  const parsed = parseFundPage(page.html);
  let holdings = parsed.holdings;
  const seeMoreUrl = findSeeMoreUrl(page.html, page.finalUrl);
  if (seeMoreUrl && seeMoreUrl !== page.finalUrl) {
    const extra = await fetchPublicHtml(seeMoreUrl);
    holdings = normalizeHoldings([...holdings, ...parseHoldingsHtml(extra.html)]);
  }
  if (holdings.length === 0) {
    throw Object.assign(
      new Error("No stock split was found in the holdings section of that page."),
      { status: 400 },
    );
  }
  return {
    ...parsed,
    holdings,
    url: rawUrl.trim(),
    finalUrl: page.finalUrl,
  };
}
