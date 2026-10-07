import { parseFeed, pickArticle, classify, isTaxStory, torontoHour, clean } from "../netlify/lib/feed.mjs";

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("FAIL", m); } else console.log("ok  ", m); };

const now = Date.parse("2026-10-07T12:30:00Z");

const rss = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[CRA warns of new phishing texts &amp; fake refund emails]]></title><link>https://example.ca/a</link><pubDate>Tue, 06 Oct 2026 14:00:00 GMT</pubDate><description><![CDATA[<p>The Canada Revenue Agency says <b>scammers</b> are impersonating the agency to steal tax refunds.</p>]]></description><source url="https://example.ca">Example News</source></item>
<item><title>Leafs win in overtime</title><link>https://example.ca/sports</link><pubDate>Tue, 06 Oct 2026 13:00:00 GMT</pubDate><description>NHL sports recap</description></item>
<item><title>RRSP and TFSA changes explained</title><link>https://example.ca/b</link><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate><description>What savers should know about registered accounts and tax.</description></item>
<item><title>Old tax story</title><link>https://example.ca/old</link><pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate><description>tax</description></item>
</channel></rss>`;

const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>New GST/HST rules for small business</title><link href="https://canada.ca/x"/><updated>2026-10-06T09:00:00Z</updated><summary>Changes to GST/HST filing.</summary></entry></feed>`;

const a = parseFeed(rss, "Fallback");
ok(a.length === 4, "parses 4 RSS items");
ok(a[0].title === "CRA warns of new phishing texts & fake refund emails", "decodes CDATA and entities");
ok(!/<|>/.test(a[0].summary), "strips html from summary");
ok(a[0].source === "Example News", "uses <source> as publisher");
ok(a[2].source === "Fallback", "falls back to feed name");
const b = parseFeed(atom, "CRA");
ok(b.length === 1 && b[0].url === "https://canada.ca/x" && b[0].date === "2026-10-06", "parses Atom link href and date");

ok(isTaxStory(a[0]) && !isTaxStory(a[1]), "filters sports noise");
ok(classify(a[0]) === "scams", "classifies scams");
ok(classify(a[2]) === "savings", "classifies savings");

const pick = pickArticle([...a, ...b], [], now);
ok(pick && pick.url === "https://example.ca/a", "picks freshest tax story (got " + (pick && pick.url) + ")");
const again = pickArticle([...a, ...b], [pick], now);
ok(again && again.url !== pick.url, "does not repeat a story");
ok(!pickArticle(a, a.map((x) => ({ ...x })), now), "returns null when everything is already stored");
const old = pickArticle([a[3]], [], now);
ok(old === null, "ignores stories older than 14 days");
const sameSource = pickArticle([{ ...a[0], source: "X", ts: now - 1000 }, { ...a[2], source: "Y", ts: now - 5000 }], [{ source: "X", title: "prev", url: "u" }], now);
ok(sameSource.source === "Y", "avoids the same publisher twice in a row");

// Toronto 8 am: 12:00 UTC in summer (EDT), 13:00 UTC in winter (EST)
ok(torontoHour(new Date("2026-10-07T12:00:00Z")) === 8, "12:00 UTC is 8 am in October");
ok(torontoHour(new Date("2026-12-07T13:00:00Z")) === 8, "13:00 UTC is 8 am in December");
ok(torontoHour(new Date("2026-12-07T12:00:00Z")) === 7, "12:00 UTC is 7 am in December (skipped)");
ok(clean("A &amp; B<br>C") === "A & B C", "clean() collapses markup");

console.log(fail ? fail + " FAILED" : "ALL PASSED");
process.exit(fail ? 1 : 0);
