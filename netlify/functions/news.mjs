// Public read endpoint used by the Learn page: returns the articles added by the daily function.
import { getStore } from "@netlify/blobs";

export default async () => {
  let items = [];
  try { items = (await getStore("jezfi-news").get("items", { type: "json" })) || []; } catch { /* store not created yet */ }
  return new Response(JSON.stringify({ items }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" }
  });
};
