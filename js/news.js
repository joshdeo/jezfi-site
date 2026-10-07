/* Daily news: newest article leads, three rows stay on the page, the rest move to a searchable archive. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var seed = (window.JEZFI_NEWS_SEED || []).slice();
  var grids = [$("newsGrid"), $("newsHome")].filter(Boolean);
  if (!grids.length) return;

  var TOPICS = {
    benefits: { label: "Benefits", icon: '<circle cx="12" cy="9" r="5"/><path d="M9.5 9h0M14.5 9h0M10 11.5c1 1 3 1 4 0M6 21c0-3 2.5-5 6-5s6 2 6 5"/>' },
    business: { label: "Business", icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>' },
    savings: { label: "Savings", icon: '<path d="M19 12c0-3-3-5-7-5S5 9 5 12c0 2 1 3 2 4v3h3v-1h4v1h3v-3c1-1 2-2 2-4z"/><path d="M19 11h2v3h-2"/>' },
    filing: { label: "Filing", icon: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>' },
    scams: { label: "Scams and safety", icon: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>' },
    policy: { label: "Policy", icon: '<path d="M12 3v18M5 21h14M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>' },
    housing: { label: "Housing", icon: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>' }
  };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fdate(d) { return new Date(d + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }); }
  function svg(topic) { var t = TOPICS[topic] || TOPICS.policy; return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t.icon + "</svg>"; }

  function merge(extra) {
    var seen = {}, all = [];
    extra.concat(seed).forEach(function (n) { if (!n || !n.url || seen[n.url]) return; seen[n.url] = 1; all.push(n); });
    all.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    return all;
  }

  var items = merge([]);

  function card(n, i, feature, isNew) {
    var t = TOPICS[n.topic] || TOPICS.policy;
    return '<a class="n-card' + (feature ? " feature" : "") + '" style="animation-delay:' + (i * 0.07).toFixed(2) + 's" href="' + esc(n.url) + '" target="_blank" rel="noopener">' +
      '<div class="n-art t-' + esc(n.topic) + '">' + svg(n.topic) + '<span class="badge' + (isNew ? " new" : "") + '">' + (isNew ? "Today's article" : t.label) + "</span></div>" +
      '<div class="n-body"><div class="n-meta"><span>' + esc(n.source) + "</span><span>" + fdate(n.date) + (isNew ? "" : "") + "</span></div>" +
      "<h3>" + esc(n.title) + "</h3><p>" + esc(n.summary) + '</p><span class="n-go">Read at ' + esc(n.source) + " &#8599;</span></div></a>";
  }

  var archiveItems = [], filter = "all", q = "", shown = 8;

  function renderGrids() {
    var today = new Date().toISOString().slice(0, 10);
    grids.forEach(function (g) {
      var limit = parseInt(g.dataset.limit, 10) || 6, compact = g.dataset.compact === "1";
      var list = items.slice(0, limit), html = "";
      list.forEach(function (n, i) {
        var recent = i === 0 && (new Date(today) - new Date(n.date)) / 86400000 <= 2;
        html += card(n, i, !compact && i === 0, !compact && recent && i === 0);
      });
      g.innerHTML = html;
    });
    var main = $("newsGrid");
    archiveItems = main ? items.slice(parseInt(main.dataset.limit, 10) || 6) : [];
    var tgl = $("archiveToggle");
    if (tgl && !archiveItems.length) { tgl.style.display = "none"; }
    renderArchive();
  }

  function renderArchive() {
    var list = $("archiveList"); if (!list) return;
    var s = q.trim().toLowerCase();
    var pool = (s || filter !== "all" ? items : archiveItems).filter(function (n) {
      return (filter === "all" || n.topic === filter) && (!s || (n.title + " " + n.summary + " " + n.source).toLowerCase().indexOf(s) > -1);
    });
    var slice = pool.slice(0, shown), html = "", month = "";
    slice.forEach(function (n) {
      var m = new Date(n.date + "T12:00:00").toLocaleDateString("en-CA", { month: "long", year: "numeric" });
      if (m !== month) { month = m; html += '<li class="a-month">' + m + "</li>"; }
      html += '<li><a class="a-item" href="' + esc(n.url) + '" target="_blank" rel="noopener"><span class="a-date">' + fdate(n.date) + '</span><span><h4>' + esc(n.title) + "</h4><small>" + esc(n.source) + " &middot; " + esc(n.summary.slice(0, 130)) + (n.summary.length > 130 ? "…" : "") + '</small></span><span class="tag">' + esc((TOPICS[n.topic] || TOPICS.policy).label) + "</span></a></li>";
    });
    list.innerHTML = html || '<li class="empty">No articles match that search. Try a different word or topic.</li>';
    $("archiveCount").textContent = "Showing " + slice.length + " of " + pool.length;
    $("archiveMore").style.display = pool.length > shown ? "" : "none";
  }

  /* archive controls */
  var tgl = $("archiveToggle"), arch = $("archive");
  if (tgl && arch) {
    var f = $("archiveFilters");
    f.innerHTML = '<button type="button" class="pill on" data-t="all">All topics</button>' + Object.keys(TOPICS).map(function (k) { return '<button type="button" class="pill" data-t="' + k + '">' + TOPICS[k].label + "</button>"; }).join("");
    f.addEventListener("click", function (e) { var b = e.target.closest("[data-t]"); if (!b) return; filter = b.dataset.t; shown = 8; [].forEach.call(f.children, function (c) { c.classList.toggle("on", c === b); }); renderArchive(); });
    $("archiveSearch").addEventListener("input", function (e) { q = e.target.value; shown = 8; renderArchive(); });
    $("archiveMore").addEventListener("click", function () { shown += 8; renderArchive(); });
    tgl.addEventListener("click", function () {
      var open = arch.hasAttribute("hidden");
      if (open) arch.removeAttribute("hidden"); else arch.setAttribute("hidden", "");
      tgl.setAttribute("aria-expanded", open); tgl.textContent = open ? "Hide the archive" : "Read more from the archive";
      if (open) arch.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* countdown to the next 8:00 am Toronto article */
  var nu = $("nextUpdate");
  if (nu) {
    (function tick() {
      var p = {}; new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", minute: "numeric", second: "numeric", hour12: false }).formatToParts(new Date()).forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
      var secs = (p.hour % 24) * 3600 + p.minute * 60 + p.second, target = 8 * 3600, left = target - secs; if (left <= 0) left += 86400;
      nu.textContent = "Next article in " + Math.floor(left / 3600) + "h " + Math.floor(left % 3600 / 60) + "m (8:00 am ET daily)";
      setTimeout(tick, 30000);
    })();
  }

  renderGrids();

  /* pull in articles added by the scheduled function, when the site is hosted with it */
  if (window.fetch && /^https?:/.test(location.protocol)) {
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 3500);
    fetch("/.netlify/functions/news", { signal: ctl ? ctl.signal : undefined, headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) { clearTimeout(to); if (Array.isArray(data.items) && data.items.length) { items = merge(data.items.filter(function (n) { return n.title && n.url && n.date; })); renderGrids(); } })
      .catch(function () { /* offline or not hosted with functions: the seed archive stays */ });
  }
})();
