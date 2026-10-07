// Shared news refresh used by the scheduled job and the manual trigger.
import { getStore } from "@netlify/blobs";
import { fetchAll, pickArticle } from "./feed.mjs";

export async function refresh({ force = false } = {}) {
  const store = getStore("jezfi-news");
  const existing = (await store.get("items", { type: "json" })) || [];
  const today = new Date().toISOString().slice(0, 10);
  if (!force && existing[0] && existing[0].addedAt && existing[0].addedAt.slice(0, 10) === today) return "Already added today.";
  const candidates = await fetchAll();
  const pick = pickArticle(candidates, existing);
  if (!pick) return `No new tax story found. Checked ${candidates.length} feed items.`;
  existing.unshift(pick);
  await store.setJSON("items", existing.slice(0, 500));
  return `Added: ${pick.title}`;
}
