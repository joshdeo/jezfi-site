// Feed helpers for the daily tax news function. Pure functions, no network except fetchAll.

export const SOURCES = [
  { name: "Canada Revenue Agency", url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentrevenueagency&sort=publishedDate&orderBy=desc&pick=15&format=atom", official: true },
  { name: "Department of Finance Canada", url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentfinance&sort=publishedDate&orderBy=desc&pick=15&format=atom", official: true },
  { name: "Canada tax news", url: "https://news.google.com/rss/search?q=Canada+tax+CRA+when:7d&hl=en-CA&gl=CA&ceid=CA:en" },
  { name: "CBC Business", url: "https://www.cbc.ca/webfeed/rss/rss-business" }
];

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };

export function clean(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTITIES[m] || m)
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTITIES[m] || m)
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

export function parseFeed(xml, sourceName) {
  const items = [];
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  for (const b of blocks) {
    const title = clean(tag(b, "title"));
    let link = clean(tag(b, "link"));
    if (!link) { const m = b.match(/<link[^>]*href=["']([^"']+)["']/i); link = m ? m[1] : ""; }
    const dateRaw = clean(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    const d = new Date(dateRaw);
    const publisher = clean(tag(b, "source"));
    const summary = clean(tag(b, "description") || tag(b, "summary") || tag(b, "content"));
    if (!title || !link || isNaN(d)) continue;
    items.push({ title, url: link, date: d.toISOString().slice(0, 10), ts: d.getTime(), source: publisher || sourceName, summary });
  }
  return items;
}

const TAX = /\b(tax(es|ation|payers?)?|CRA|Canada Revenue|GST|HST|RRSP|TFSA|FHSA|RESP|T4|capital gains?|payroll|audit|refund|deduction|tax credit|benefit payment|Canada Child Benefit|carbon rebate|small business)\b/i;
const NOISE = /\b(horoscope|sports?|nhl|nfl|nba|celebrity|recipe|weather)\b/i;

export function isTaxStory(it) {
  const text = `${it.title} ${it.summary}`;
  return TAX.test(text) && !NOISE.test(it.title);
}

export function classify(it) {
  const t = `${it.title} ${it.summary}`.toLowerCase();
  if (/scam|fraud|phishing|impersonat/.test(t)) return "scams";
  if (/rrsp|tfsa|fhsa|resp|savings|retirement|pension/.test(t)) return "savings";
  if (/mortgage|housing|home buyer|first home|real estate|rent/.test(t)) return "housing";
  if (/child benefit|benefit|credit|payment|oas|ei\b|disability/.test(t)) return "benefits";
  if (/small business|gst|hst|payroll|corporat|incorporat|employer/.test(t)) return "business";
  if (/file|filing|return|deadline|t1|t4|refund/.test(t)) return "filing";
  return "policy";
}

export function torontoHour(date = new Date()) {
  const h = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", hour12: false }).format(date);
  return parseInt(h, 10) % 24;
}

/* Choose the freshest unseen tax story from the last 14 days, avoiding the same publisher twice in a row when possible. */
export function pickArticle(candidates, existing, now = Date.now()) {
  const seen = new Set(existing.map((x) => x.url));
  const titles = new Set(existing.map((x) => x.title.toLowerCase()));
  const pool = candidates
    .filter((c) => isTaxStory(c) && !seen.has(c.url) && !titles.has(c.title.toLowerCase()) && now - c.ts < 14 * 86400000 && c.ts <= now + 86400000)
    .sort((a, b) => b.ts - a.ts);
  if (!pool.length) return null;
  const last = existing[0] && existing[0].source;
  const choice = pool.find((c) => c.source !== last) || pool[0];
  const snippet = choice.summary && choice.summary.toLowerCase() !== choice.title.toLowerCase() ? choice.summary.slice(0, 170).replace(/\s+\S*$/, "") + (choice.summary.length > 170 ? "…" : "") : `Read the full story at ${choice.source}.`;
  return { date: choice.date, topic: classify(choice), source: choice.source, title: choice.title, url: choice.url, summary: snippet, addedAt: new Date(now).toISOString() };
}

export async function fetchAll(fetchImpl = fetch) {
  const out = [];
  await Promise.all(SOURCES.map(async (s) => {
    try {
      const r = await fetchImpl(s.url, { headers: { "User-Agent": "JEZFI-news/1.0 (+https://www.jezfi.com)" }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) return;
      out.push(...parseFeed(await r.text(), s.name));
    } catch { /* a source being down must never break the daily run */ }
  }));
  return out;
}
