#!/usr/bin/env python3
"""Assemble the static pages: shared head, header, footer and inline icons around each src/*.body.html."""
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "build", "src")

def ic(paths, extra=""):
    return f'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {extra}>{paths}</svg>'

ICONS = {
 "person": ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
 "building": ic('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>'),
 "scale": ic('<path d="M12 3v18M5 21h14M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>'),
 "receipt": ic('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>'),
 "books": ic('<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h12M9 7h6M9 11h4"/>'),
 "wallet": ic('<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/>'),
 "rocket": ic('<path d="M14 4c3 0 6 1 6 1s1 3 1 6c-2 3-5 5-8 6l-4-4c1-3 3-6 5-9z"/><circle cx="15" cy="9" r="1.5"/><path d="M9 15l-4 1 1-4M8 18l-3 3"/>'),
 "shield": ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>'),
 "globe": ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
 "calc": ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h0M16 15v3"/>'),
 "piggy": ic('<path d="M19 12c0-3-3-5-7-5S5 9 5 12c0 2 1 3 2 4v3h3v-1h4v1h3v-3c1-1 2-2 2-4z"/><path d="M19 11h2v3h-2M9 11h0"/>'),
 "home": ic('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>'),
 "chart": ic('<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>'),
 "book": ic('<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4z"/><path d="M5 16a4 4 0 0 1 4-4h10"/>'),
 "search": ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
 "phone": ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
 "mail": ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
 "pin": ic('<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
 "check": ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
 "arrow": ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
 "clock": ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 "alert": ic('<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h0"/>'),
 "baby": ic('<circle cx="12" cy="9" r="5"/><path d="M9.5 9h0M14.5 9h0M10 11.5c1 1 3 1 4 0M6 21c0-3 2.5-5 6-5s6 2 6 5"/>'),
 "leaf": ic('<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15z"/><path d="M5 19c3-5 6-8 11-11"/>'),
 "briefcase": ic('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
 "file": ic('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
 "news": ic('<path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z"/><path d="M17 8h3v9a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4"/>'),
 "print": ic('<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>'),
 "facebook": ic('<path d="M14 9h3V5h-3a4 4 0 0 0-4 4v3H7v4h3v5h4v-5h3l1-4h-4V9z"/>'),
 "x": ic('<path d="M4 4l16 16M20 4L4 20"/>'),
 "linkedin": ic('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7h0M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>'),
 "id": ic('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5M15 10h3M15 13h3"/>'),
 "chev": ic('<path d="M9 6l6 6-6 6"/>'),
}

NAV = [
 ("Services", "index.html#services"),
 ("Tools", "tools.html"),
 ("Learn", "learn.html"),
 ("About", "index.html#about"),
 ("Contact", "contact.html"),
]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600..800;1,9..144,500..800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">')

def head(title, desc, page):
    return f'''<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0a1f52">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="assets/logo-mark.svg">
{FONTS}
<link rel="stylesheet" href="css/style.css">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"AccountingService","name":"JEZFI Associates","url":"https://www.jezfi.com/","telephone":"+1-905-268-0003","email":"info@jezfi.com","foundingDate":"1995","address":{{"@type":"PostalAddress","streetAddress":"1235 Queensway East, Suite 17","addressLocality":"Mississauga","addressRegion":"ON","postalCode":"L4Y 0G4","addressCountry":"CA"}},"openingHoursSpecification":[{{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"09:00","closes":"18:00"}}]}}</script>
</head>
<body data-page="{page}">
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"><i id="progress"></i></div>
'''

def header(page):
    links = "".join(
        f'<li><a href="{href}"' + (' aria-current="page"' if href.split("#")[0].startswith(page) and "#" not in href else "") + f'>{label}</a></li>'
        for label, href in NAV)
    return f'''<div class="topbar"><div class="container">
  <span><span class="dot" id="openDot"></span><span id="openText">Mississauga, Ontario</span></span>
  <span><a href="tel:+19052680003">905-268-0003</a><span class="hide-sm"> &nbsp;·&nbsp; <a href="mailto:info@jezfi.com">info@jezfi.com</a></span></span>
</div></div>
<header class="site" id="top"><div class="container nav">
  <a class="brand" href="index.html" aria-label="JEZFI Associates home"><img src="assets/logo-lockup.svg" alt="JEZFI Associates" width="190" height="50"></a>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  <ul class="menu" id="menu">{links}<li><a class="btn btn-primary btn-sm" href="contact.html#intake" style="color:#fff">Book a consult</a></li></ul>
</div></header>
<main id="main">
'''

FOOTER = '''</main>
<footer class="site"><div class="container">
  <div class="f-grid">
    <div>
      <img src="assets/logo-lockup.svg" alt="JEZFI Associates">
      <p>Accounting, tax and financial planning from Mississauga, serving clients across Canada since 1995.</p>
      <div class="soc">
        <a href="https://www.facebook.com/JEZFI" aria-label="JEZFI on Facebook" rel="noopener" target="_blank">{facebook}</a>
        <a href="https://twitter.com/JEZFIinc" aria-label="JEZFI on X" rel="noopener" target="_blank">{x}</a>
        <a href="https://ca.linkedin.com/in/jamal-hyder-9ba1912b" aria-label="Jamal Hyder on LinkedIn" rel="noopener" target="_blank">{linkedin}</a>
      </div>
    </div>
    <div><h4>Firm</h4><ul>
      <li><a href="index.html#services">Services</a></li><li><a href="index.html#about">About</a></li><li><a href="index.html#recognition">Recognition</a></li><li><a href="contact.html">Contact</a></li></ul></div>
    <div><h4>Free tools</h4><ul>
      <li><a href="tools.html#estimator">2026 tax estimator</a></li><li><a href="tools.html#rrsp">RRSP savings</a></li><li><a href="tools.html#tfsa">TFSA room</a></li><li><a href="tools.html#hst">HST calculator</a></li><li><a href="tools.html#invoice">Invoice builder</a></li></ul></div>
    <div><h4>Learn</h4><ul>
      <li><a href="learn.html#news">Daily tax news</a></li><li><a href="learn.html#resources">Resource library</a></li><li><a href="learn.html#glossary">Tax terms, explained</a></li>
      <li><a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html" rel="noopener" target="_blank">CRA My Account</a></li></ul></div>
  </div>
  <div class="legal">
    <span>&copy; <span id="yr">2026</span> JEZFI Associates. All rights reserved.</span>
    <span style="max-width:62ch">JEZFI Associates is committed to respecting the privacy of individuals and recognizes the need for appropriate management and protection of any personal information you provide. We will not share your information with any third party outside our organization other than as necessary to fulfill your request.</span>
  </div>
</div></footer>
<script src="js/main.js" defer></script>
'''

PAGES = {
 "index": ("JEZFI Associates | Accounting and Tax Services in Mississauga", "Personal and corporate tax, HST/GST, bookkeeping, payroll and planning from a Mississauga accounting firm serving clients across Canada since 1995.", ["js/tax.js", "js/news-seed.js", "js/news.js"]),
 "tools": ("Free Canadian Tax Calculators 2026 | JEZFI Associates", "Ontario 2026 tax estimator, RRSP, TFSA, HST, capital gains, mortgage calculators, invoice builder and tax document checklist.", ["js/tax.js", "js/tools.js"]),
 "learn": ("Daily Tax News and Resources | JEZFI Associates", "A fresh Canadian tax article every morning, plus a curated CRA resource library and plain language tax glossary.", ["js/news-seed.js", "js/news.js", "js/learn.js"]),
 "contact": ("Contact and Client Intake | JEZFI Associates", "Tell us what you need. Start a secure intake with JEZFI Associates in Mississauga and hear back within one business day.", ["js/contact.js"]),
}

def resources_html():
    sys.path.insert(0, os.path.join(ROOT, "build"))
    from resources import GROUPS
    from urllib.parse import urlparse
    out = []
    for name, icon, cards in GROUPS:
        out.append(f'<div class="res-group reveal"><h3><i>{{{{icon:{icon}}}}}</i>{name}</h3><div class="grid g3" style="margin-top:18px">')
        for title, desc, url, ico, topic in cards:
            host = urlparse(url).netloc.replace("www.", "")
            out.append(f'<a class="r-card" href="{url}" target="_blank" rel="noopener"><div class="n-art t-{topic}">{{{{icon:{ico}}}}}</div>'
                       f'<div class="b"><h4>{title}</h4><p>{desc}</p><span class="host">{host} &#8599;</span></div></a>')
        out.append("</div></div>")
    return "\n".join(out)

def render_icons(html):
    return re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: ICONS[m.group(1)], html)

def main():
    for name, (title, desc, scripts) in PAGES.items():
        body = open(os.path.join(SRC, f"{name}.body.html"), encoding="utf-8").read()
        if "{{resources}}" in body:
            body = body.replace("{{resources}}", resources_html())
        foot = FOOTER
        for k in ("facebook", "x", "linkedin"):
            foot = foot.replace("{" + k + "}", ICONS[k])
        # tax engine must load before main.js (the hero estimator uses it); page scripts load after main.js
        pre = "".join(f'<script src="{s}" defer></script>\n' for s in scripts if s == "js/tax.js")
        extra = "".join(f'<script src="{s}" defer></script>\n' for s in scripts if s != "js/tax.js")
        html = head(title, desc, name) + header(name + ".html") + render_icons(body) + foot.replace('<script src="js/main.js" defer></script>\n', pre + '<script src="js/main.js" defer></script>\n') + extra + "</body>\n</html>\n"
        open(os.path.join(ROOT, f"{name}.html"), "w", encoding="utf-8").write(html)
        print("built", name + ".html", len(html) // 1024, "KB")

if __name__ == "__main__":
    main()
