// Manual trigger: open /.netlify/functions/news-refresh?key=YOUR_NEWS_FORCE_KEY to add an article now.
import { refresh } from "../lib/refresh.mjs";

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.NEWS_FORCE_KEY || key !== process.env.NEWS_FORCE_KEY) return new Response("Forbidden", { status: 403 });
  try {
    return new Response(await refresh({ force: true }), { status: 200, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (e) {
    return new Response("Error: " + (e && e.message ? e.message : e), { status: 500 });
  }
};
