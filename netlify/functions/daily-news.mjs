// Scheduled function: adds one fresh Canadian tax article every morning at 8:00 am Toronto time.
// Netlify cron runs in UTC, so we trigger at both 12:00 and 13:00 UTC and only act when it is 8 in Toronto
// (that covers daylight saving time without a manual change twice a year).
import { getStore } from "@netlify/blobs";
import { fetchAll, pickArticle, torontoHour } from "../lib/feed.mjs";

export default async (req) => {
  let force = false;
  try { force = new URL(req.url).searchParams.get("force") === "1" && !!process.env.NEWS_FORCE_KEY && new URL(req.url).searchParams.get("key") === process.env.NEWS_FORCE_KEY; } catch { /* scheduled call has no query */ }
  if (!force && torontoHour() !== 8) return new Response("Not 8 am in Toronto, skipping.", { status: 200 });

  const store = getStore("jezfi-news");
  const existing = (await store.get("items", { type: "json" })) || [];
  const today = new Date().toISOString().slice(0, 10);
  if (!force && existing[0] && existing[0].addedAt && existing[0].addedAt.slice(0, 10) === today) return new Response("Already added today.", { status: 200 });

  const candidates = await fetchAll();
  const pick = pickArticle(candidates, existing);
  if (!pick) return new Response("No new tax story found today.", { status: 200 });

  existing.unshift(pick);
  await store.setJSON("items", existing.slice(0, 500));
  return new Response(`Added: ${pick.title}`, { status: 200 });
};

export const config = { schedule: "0 12,13 * * *" };
