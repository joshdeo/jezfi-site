# JEZFI Associates website

Static site (HTML, CSS, vanilla JS) plus two Netlify functions for the daily tax news.

## Deploy on Netlify
1. Push this folder to a repo, or drag it into Netlify. Publish directory is the project root (see netlify.toml).
2. Netlify detects the intake form automatically (form name "intake", spam trap field "bot-field"). Turn on email notifications under Forms.
3. Run `npm install` once so the functions get @netlify/blobs.
4. Optional: set NEWS_FORCE_KEY in site settings. Then `/.netlify/functions/daily-news?force=YOUR_KEY` runs the news job on demand.

## Daily news
- `daily-news` runs at 12:00 and 13:00 UTC and only acts when it is 8 am in Toronto, so daylight saving is handled.
- It reads CRA and Finance Canada feeds, Google News (Canada tax) and CBC Business, filters for tax stories, avoids repeats and the same publisher twice in a row, then stores one article in the "jezfi-news" blob store.
- `news` serves the stored items. The site merges them with the seed archive in js/news-seed.js, so it is never empty.
- Not testable offline. Check the first run in the Netlify function logs.

## Editing
- Rebuild pages after changing anything in build/: `python3 -I build/build.py`
- Page content lives in build/src/*.body.html. Resource links live in build/resources.py.
- Tax figures live in js/tax.js. Update every January (brackets, CPP, EI, TFSA limit, RRSP limit), then run `node tests/tax.test.js`.
- Key dates live in js/main.js (JEZFI_DATES).
- Feed logic test: `node tests/feed.test.mjs`.
