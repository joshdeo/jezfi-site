/* JEZFI shared behaviour */
window.JEZFI_DATES = [
  { date: "2026-12-15", title: "Fourth personal tax instalment", desc: "Quarterly instalment due for taxpayers who pay their tax in advance. Corporations have their own instalment dates." },
  { date: "2026-12-31", title: "Year end planning deadline", desc: "Last day for 2026 charitable donations and FHSA contributions to count for 2026. TFSA room for 2027 arrives on January 1." },
  { date: "2027-03-01", title: "RRSP deadline and T4 slips", desc: "Last day to contribute to an RRSP and deduct it on your 2026 return. Employers must also issue T4 slips by this date." },
  { date: "2027-03-15", title: "First 2027 instalment", desc: "First quarterly instalment of the 2027 tax year, for those who pay by instalments." },
  { date: "2027-04-30", title: "Personal tax filing and payment deadline", desc: "File your 2026 return and pay any balance owing. Filing late can bring penalties and interest." },
  { date: "2027-06-15", title: "Self employed filing deadline", desc: "Self employed individuals and their spouses can file by this date. Any balance owing is still due April 30. Second instalment also due." },
  { date: "2027-09-15", title: "Third 2027 instalment", desc: "Third quarterly instalment of the 2027 tax year, for those who pay by instalments." }
];

(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var qa = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  var yr = $("yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* menu */
  var burger = $("burger"), menu = $("menu");
  if (burger) burger.addEventListener("click", function () { var o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  qa("#menu a").forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("open"); burger.setAttribute("aria-expanded", false); }); });

  /* scroll: header shadow, progress, parallax */
  var header = document.querySelector("header.site"), bar = $("progress");
  var layers = qa("[data-speed]");
  function frame() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (bar) bar.style.width = (h > 0 ? y / h * 100 : 0) + "%";
    if (!reduce) {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var host = el.closest("section") || el.parentElement, r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var off = (r.top + r.height / 2 - vh / 2) * -1;
        var sp = parseFloat(el.dataset.speed) || 0;
        el.style.translate = "0 " + (off * sp).toFixed(1) + "px";
        if (el.dataset.rotate) el.style.rotate = (off * parseFloat(el.dataset.rotate)).toFixed(1) + "deg";
      });
    }
    ticking = false;
  }
  var ticking = false;
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); frame();

  /* reveal + counters */
  function animateCount(el) {
    var target = el.dataset.countYears ? new Date().getFullYear() - parseInt(el.dataset.countYears, 10) : parseFloat(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    var start = performance.now(), dur = 1400;
    (function step(t) { var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(target * e); if (p < 1) requestAnimationFrame(step); })(start);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        qa("[data-count],[data-count-years]", e.target).forEach(animateCount);
        if (e.target.matches("[data-count],[data-count-years]")) animateCount(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    qa(".reveal").forEach(function (el) { io.observe(el); });
    /* cards injected later by page scripts (news, glossary) must be revealed too */
    if ("MutationObserver" in window) {
      new MutationObserver(function (ms) {
        ms.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.classList.contains("reveal") && !n.classList.contains("in")) io.observe(n);
            qa(".reveal:not(.in)", n).forEach(function (el) { io.observe(el); });
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
    qa(".reveal:not(.in)").forEach(function (el) { io.observe(el); });
    setTimeout(function () { qa(".reveal:not(.in)").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("in"); }); }, 2500);
  } else { qa(".reveal").forEach(function (el) { el.classList.add("in"); }); qa("[data-count],[data-count-years]").forEach(animateCount); }

  /* marquee: duplicate for seamless loop */
  var mq = $("marquee"); if (mq) mq.innerHTML += mq.innerHTML;

  /* card tilt */
  if (!reduce && window.matchMedia("(hover:hover)").matches) {
    qa(".tilt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 6).toFixed(2) + "deg) translateY(-6px)"; });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }

  /* testimonials */
  var qw = $("quotes");
  if (qw) {
    var qs = qa(".quote", qw), dots = $("qdots"), i = 0, timer;
    qs.forEach(function (_, n) { var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Testimonial " + (n + 1)); b.addEventListener("click", function () { go(n); restart(); }); dots.appendChild(b); });
    function go(n) { i = (n + qs.length) % qs.length; qs.forEach(function (q, k) { q.classList.toggle("active", k === i); }); qa("button", dots).forEach(function (b, k) { b.classList.toggle("on", k === i); }); }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(i + 1); }, 8000); }
    qw.addEventListener("mouseenter", function () { clearInterval(timer); }); qw.addEventListener("mouseleave", restart);
    go(0); restart();
  }

  /* open now (Toronto time) */
  function torontoParts() {
    var f = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()), o = {};
    f.forEach(function (p) { o[p.type] = p.value; }); return { wd: o.weekday, h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10) };
  }
  var dot = $("openDot"), txt = $("openText");
  if (dot && txt) {
    var t = torontoParts(), weekend = t.wd === "Sat" || t.wd === "Sun", openH = weekend ? 10 : 9;
    var isOpen = t.h >= openH && t.h < 18;
    dot.classList.toggle("open", isOpen);
    txt.textContent = isOpen ? (weekend ? "Weekend appointments available now" : "Open now, until 6:00 pm") : "Closed now. Leave a message or book online";
  }

  /* next key date countdown */
  if ($("dlTitle")) {
    var next = null, nowMs = Date.now();
    for (var k = 0; k < window.JEZFI_DATES.length; k++) { var d = window.JEZFI_DATES[k]; if (new Date(d.date + "T23:59:59").getTime() >= nowMs) { next = d; break; } }
    if (next) {
      $("dlTitle").textContent = next.title + ", " + new Date(next.date + "T12:00:00").toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
      $("dlDesc").textContent = next.desc;
      var end = new Date(next.date + "T23:59:59").getTime();
      (function tick() {
        var ms = Math.max(0, end - Date.now()), s = Math.floor(ms / 1000);
        $("dlD").textContent = Math.floor(s / 86400); $("dlH").textContent = Math.floor(s % 86400 / 3600); $("dlM").textContent = Math.floor(s % 3600 / 60); $("dlS").textContent = s % 60;
        setTimeout(tick, 1000);
      })();
    } else { $("deadline").style.display = "none"; }
  }

  /* hero estimator */
  var hi = $("heroIncome");
  if (hi && window.JezfiTax) {
    var T = window.JezfiTax, sl = $("heroSlider"), cur = { take: 0 };
    var CAD = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
    function render(v, instant) {
      var r = T.compute({ employment: v, payroll: true }), g = Math.max(1, r.gross);
      $("heroTax").textContent = CAD.format(Math.round(r.incomeTax));
      $("heroRate").textContent = (r.avgRate * 100).toFixed(1) + "%";
      $("bTake").style.width = (r.afterTax / g * 100) + "%"; $("bTax").style.width = (r.incomeTax / g * 100) + "%"; $("bPay").style.width = (r.payroll.total / g * 100) + "%";
      var from = cur.take, to = r.afterTax;
      if (reduce || instant) { $("heroTake").textContent = CAD.format(Math.round(to)); cur.take = to; return; }
      var st = performance.now();
      (function step(t) { var p = Math.min(1, (t - st) / 450), e = 1 - Math.pow(1 - p, 3); cur.take = from + (to - from) * e; $("heroTake").textContent = CAD.format(Math.round(cur.take)); if (p < 1) requestAnimationFrame(step); })(st);
    }
    function read() { var v = parseFloat(hi.value); return isFinite(v) && v >= 0 ? v : 0; }
    hi.addEventListener("input", function () { var v = read(); sl.value = Math.min(300000, Math.max(15000, v)); render(v); });
    sl.addEventListener("input", function () { hi.value = sl.value; render(+sl.value); });
    render(read(), true);
  }
})();
