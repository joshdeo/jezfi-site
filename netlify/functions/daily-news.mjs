// Scheduled function: adds one fresh Canadian tax article every morning at 8:00 am Toronto time.
// Netlify cron runs in UTC, so it triggers at 12:00 and 13:00 UTC and only acts when it is 8 in Toronto
// (that covers daylight saving time without a manual change twice a year).
import { torontoHour } from "../lib/feed.mjs";
import { refresh } from "../lib/refresh.mjs";

export default async () => {
  if (torontoHour() !== 8) return new Response("Not 8 am in Toronto, skipping.", { status: 200 });
  return new Response(await refresh(), { status: 200 });
};

export const config = { schedule: "0 12,13 * * *" };
