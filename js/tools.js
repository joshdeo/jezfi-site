/* JEZFI tools page: all calculations run in the browser. */
(function () {
  "use strict";
  var T = window.JezfiTax;
  var $ = function (id) { return document.getElementById(id); };
  var CAD0 = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
  var CAD2 = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function m0(n) { return CAD0.format(Math.round(n)); }
  function m2(n) { return CAD2.format(n); }
  function pc(n, d) { return (n * 100).toFixed(d == null ? 1 : d) + "%"; }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function line(label, value, cls) { return '<div class="ln ' + (cls || "") + '"><span>' + label + "</span><span>" + value + "</span></div>"; }
  function on(ids, fn) { ids.forEach(function (id) { var el = $(id); if (el) { el.addEventListener("input", fn); el.addEventListener("change", fn); } }); }

  /* ---------- tabs ---------- */
  var tabs = [].slice.call(document.querySelectorAll(".tab"));
  var panels = [].slice.call(document.querySelectorAll(".panel"));
  function show(name, push) {
    if (!$(name)) name = "estimator";
    tabs.forEach(function (t) { var on = t.dataset.tab === name; t.classList.toggle("on", on); t.setAttribute("aria-selected", on); });
    panels.forEach(function (p) { p.classList.toggle("on", p.id === name); });
    if (push) history.replaceState(null, "", "#" + name);
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { show(t.dataset.tab, true); }); });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
  show(location.hash.slice(1) || "estimator");

  /* ---------- estimator ---------- */
  function estimator() {
    var o = { employment: num("e_emp"), other: num("e_oth"), rrsp: num("e_rrsp"), deductions: num("e_ded"), payroll: $("e_pay").checked };
    var r = T.compute(o), mr = T.marginalRate(o, 100);
    var h = "";
    h += line("Gross income", m0(r.gross));
    if (r.payroll.total > 0) {
      h += line("CPP (incl. CPP2)", "−" + m0(r.payroll.cppBase + r.payroll.cpp2), "sub");
      h += line("EI", "−" + m0(r.payroll.ei), "sub");
    }
    h += line("Taxable income", m0(r.taxable));
    h += line("Federal tax", m0(r.fedTax));
    h += line("Ontario tax", m0(r.onBeforeSurtax), "sub");
    h += line("Ontario surtax", m0(r.surtax), "sub");
    h += line("Ontario Health Premium", m0(r.health), "sub");
    h += line("Total income tax", m0(r.incomeTax), "");
    h += line("CPP and EI", m0(r.payroll.total), "");
    h += line("TAKE HOME", '<span class="good">' + m0(r.afterTax) + "</span>", "total");
    h += '<div class="note">Estimate for the 2026 tax year, Ontario resident, basic personal amount plus CPP and EI credits.</div>';
    $("e_receipt").innerHTML = h;

    var segs = [
      { n: "Take home", v: r.afterTax, c: "#17a673" }, { n: "Federal tax", v: r.fedTax, c: "#1f4fc4" },
      { n: "Ontario tax", v: r.onTax, c: "#c99a3d" }, { n: "CPP", v: r.payroll.cppBase + r.payroll.cpp2, c: "#6a45e0" }, { n: "EI", v: r.payroll.ei, c: "#d9485f" }
    ];
    var g = Math.max(1, r.gross);
    $("e_stack").innerHTML = segs.map(function (s) { return '<i style="width:' + Math.max(0, s.v / g * 100).toFixed(2) + "%;background:" + s.c + '"></i>'; }).join("");
    $("e_legend").innerHTML = segs.map(function (s) { return '<span><b style="background:' + s.c + '"></b>' + s.n + " " + m0(s.v) + "</span>"; }).join("");
    $("e_kpis").innerHTML =
      '<div class="kpi"><span>Monthly take home</span><strong>' + m0(r.afterTax / 12) + "</strong></div>" +
      '<div class="kpi"><span>Bi weekly take home</span><strong>' + m0(r.afterTax / 26) + "</strong></div>" +
      '<div class="kpi"><span>Average tax rate</span><strong>' + pc(r.avgRate) + "</strong></div>" +
      '<div class="kpi"><span>Tax on your next dollar</span><strong>' + pc(mr) + "</strong></div>";

    function rows(label, brackets) {
      var out = '<tr><th colspan="4" style="text-align:left;color:var(--navy)">' + label + "</th></tr><tr><th>Bracket</th><th>Rate</th><th>Income here</th><th>Tax</th></tr>";
      var prev = 0;
      brackets.forEach(function (b) {
        var inB = Math.max(0, Math.min(r.taxable, b.upTo) - prev);
        var range = b.upTo === Infinity ? m0(prev) + "+" : m0(prev) + " to " + m0(b.upTo);
        out += "<tr><td>" + range + "</td><td>" + (b.rate * 100).toFixed(2).replace(/\.?0+$/, "") + "%</td><td>" + m0(inB) + "</td><td>" + m0(inB * b.rate) + "</td></tr>";
        prev = b.upTo;
      });
      return out;
    }
    $("e_brackets").innerHTML = rows("Federal", T.P.fed.brackets) + rows("Ontario (before credits and surtax)", T.P.on.brackets);
  }
  on(["e_emp", "e_oth", "e_rrsp", "e_ded", "e_pay"], estimator); estimator();

  /* ---------- RRSP / FHSA ---------- */
  function rrsp() {
    var type = $("r_type").value, inc = num("r_inc"), con = num("r_con");
    var base = { employment: 0, other: inc, payroll: false };
    var a = T.compute(base), b = T.compute({ employment: 0, other: inc, payroll: false, rrsp: con });
    var saved = a.incomeTax - b.incomeTax, mr = T.marginalRate(base, 100);
    var h = line("Income before deduction", m0(inc)) + line("Contribution", m0(con)) + line("Tax before", m0(a.incomeTax), "sub") + line("Tax after", m0(b.incomeTax), "sub");
    h += line("ESTIMATED TAX SAVED", '<span class="good">' + m0(saved) + "</span>", "total");
    var note, title;
    if (type === "rrsp") {
      title = "RRSP summary";
      $("r_roomwrap").style.display = "";
      var room = T.rrspRoom(num("r_earn"), num("r_unused"));
      h += line("2026 RRSP room (est.)", m0(room));
      h += line("Room after contribution", '<span class="' + (room - con < -2000 ? "bad" : "good") + '">' + m0(room - con) + "</span>");
      note = "Contribute in 2026 or within 60 days after year end (by March 1, 2027) to deduct it on your 2026 return. Room is the lesser of 18% of last year's earned income or $" + T.P.rrspMax.toLocaleString("en-CA") + ", plus unused room. Your official room is on your CRA Notice of Assessment. Over contributing by more than $2,000 triggers a 1% monthly tax.";
    } else {
      title = "FHSA summary";
      $("r_roomwrap").style.display = "none";
      var over = con > T.P.fhsaAnnual;
      h += line("Annual participation limit", m0(T.P.fhsaAnnual));
      h += line("Lifetime limit", m0(T.P.fhsaLifetime));
      note = "The FHSA allows $" + T.P.fhsaAnnual.toLocaleString("en-CA") + " a year and $" + T.P.fhsaLifetime.toLocaleString("en-CA") + " for life, and up to $" + T.P.fhsaAnnual.toLocaleString("en-CA") + " of unused room can carry forward once your account is open. Contributions must be made by December 31 to be deducted for 2026. Qualifying withdrawals for a first home are tax free." + (over ? " Your planned contribution is above one year's limit, so confirm any carried forward room first." : "");
    }
    $("r_title").textContent = title;
    $("r_receipt").innerHTML = h;
    $("r_note").textContent = note;
    $("r_kpis").innerHTML = '<div class="kpi"><span>Your tax rate on the next dollar</span><strong>' + pc(mr) + '</strong></div><div class="kpi"><span>Refund as % of contribution</span><strong>' + (con ? pc(saved / con) : "0.0%") + "</strong></div>";
  }
  on(["r_type", "r_inc", "r_con", "r_earn", "r_unused"], rrsp); rrsp();

  /* ---------- TFSA ---------- */
  (function () {
    var s = $("t_year"), o = "";
    for (var y = 2009; y <= 2026; y++) o += '<option value="' + y + '">' + (y === 2009 ? "2009 or earlier (resident and 18 by 2009)" : y) + "</option>";
    s.innerHTML = o;
  })();
  function tfsa() {
    var info = T.tfsaRoom(parseInt($("t_year").value, 10) || 2009);
    var con = num("t_con"), wd = num("t_wd");
    var room = info.total - con + wd;
    var h = line("Total room since you were eligible", m0(info.total)) + line("Contributions made", "−" + m0(con), "sub") + line("Prior year withdrawals added back", "+" + m0(wd), "sub");
    h += line("ESTIMATED ROOM TODAY", '<span class="' + (room < 0 ? "bad" : "good") + '">' + m0(room) + "</span>", "total");
    h += '<div class="note">' + (room < 0 ? "This suggests an over contribution. Withdraw the excess soon and check the CRA My Account." : "Annual limit for 2026: $" + T.P.tfsaLimit.toLocaleString("en-CA") + ". Always confirm in CRA My Account before a large deposit.") + "</div>";
    $("t_receipt").innerHTML = h;
    $("t_table").innerHTML = "<tr><th>Year</th><th>Annual limit</th><th>Running total</th></tr>" + info.rows.map(function (r) { return "<tr><td>" + r.year + "</td><td>" + m0(r.limit) + "</td><td>" + m0(r.running) + "</td></tr>"; }).join("");
  }
  on(["t_year", "t_con", "t_wd"], tfsa); tfsa();

  /* ---------- capital gains ---------- */
  function capgains() {
    var gain = num("c_gain"), inc = num("c_inc");
    var res = T.capitalGain(gain, { employment: inc, other: 0, payroll: true });
    var h = line("Capital gain", m0(gain)) + line("Taxable portion (50%)", m0(res.included)) + line("Income tax before the gain", m0(res.base.incomeTax), "sub") + line("Income tax with the gain", m0(res.withGain.incomeTax), "sub");
    h += line("EXTRA TAX ON THE GAIN", '<span class="bad">' + m0(res.extraTax) + "</span>", "total");
    h += line("You keep", '<span class="good">' + m0(gain - res.extraTax) + "</span>");
    $("c_receipt").innerHTML = h;
    $("c_kpis").innerHTML = '<div class="kpi"><span>Tax as % of the gain</span><strong>' + (gain ? pc(res.extraTax / gain) : "0.0%") + '</strong></div><div class="kpi"><span>Taxable amount added</span><strong>' + m0(res.included) + "</strong></div>";
  }
  on(["c_gain", "c_inc"], capgains); capgains();

  /* ---------- HST ---------- */
  function fillProv(id) { $(id).innerHTML = T.PROVINCES.map(function (p) { return '<option value="' + p.code + '">' + p.name + " (" + p.label + ")</option>"; }).join(""); }
  fillProv("h_prov"); fillProv("i_prov");
  function prov(code) { return T.PROVINCES.filter(function (p) { return p.code === code; })[0]; }
  function hst() {
    var p = prov($("h_prov").value), amt = num("h_amt"), mode = document.querySelector("input[name=h_mode]:checked").value;
    var rate = T.provRate(p) / 100;
    var base = mode === "add" ? amt : amt / (1 + rate);
    var tax = base * rate, total = base + tax;
    $("h_title").textContent = p.name + " " + p.label;
    var h = line("Price before tax", m2(base));
    if (p.hst) h += line("HST " + p.hst + "%", m2(tax), "sub");
    else { h += line("GST " + p.gst + "%", m2(base * p.gst / 100), "sub"); if (p.pst) h += line((p.code === "QC" ? "QST " : p.code === "MB" ? "RST " : "PST ") + p.pst + "%", m2(base * p.pst / 100), "sub"); }
    h += line("TOTAL", m2(total), "total") + '<div class="note">Combined rate ' + (rate * 100).toFixed(3).replace(/\.?0+$/, "") + "%.</div>";
    $("h_receipt").innerHTML = h;
  }
  on(["h_prov", "h_amt"], hst); [].forEach.call(document.querySelectorAll("input[name=h_mode]"), function (r) { r.addEventListener("change", hst); }); hst();

  /* ---------- mortgage ---------- */
  function mortgage() {
    var amt = num("m_amt"), rate = num("m_rate"), am = parseInt($("m_am").value, 10), extra = num("m_extra");
    if (!amt) { $("m_receipt").innerHTML = line("Enter a mortgage amount", ""); $("m_kpis").innerHTML = ""; return; }
    var r = T.mortgage(amt, rate, am, extra);
    var h = line("Monthly payment", m2(r.payment)) + line("Accelerated bi weekly", m2(r.payment / 2), "sub") + line("Total interest over " + am + " years", m0(r.totalInterest)) + line("Total cost", m0(amt + r.totalInterest));
    if (extra > 0) {
      h += line("With " + m0(extra) + " extra each month", "", "sub") + line("Interest saved", '<span class="good">' + m0(r.extra.saved) + "</span>") + line("Paid off sooner by", Math.floor(r.extra.monthsSaved / 12) + " yrs " + (r.extra.monthsSaved % 12) + " mo");
    }
    $("m_receipt").innerHTML = h;
    $("m_kpis").innerHTML = '<div class="kpi"><span>Interest as % of loan</span><strong>' + pc(r.totalInterest / amt, 0) + '</strong></div><div class="kpi"><span>Payments</span><strong>' + r.months + "</strong></div>";
  }
  on(["m_amt", "m_rate", "m_am", "m_extra"], mortgage); mortgage();

  /* ---------- invoice ---------- */
  var items = [{ d: "Consulting services", q: 1, p: 1500 }];
  $("i_date").value = new Date().toISOString().slice(0, 10);
  function renderItems() {
    $("i_items").innerHTML = items.map(function (it, i) {
      return '<div class="item-row"><input class="input" data-i="' + i + '" data-k="d" value="' + esc(it.d) + '" placeholder="Description" aria-label="Description"><input class="input" data-i="' + i + '" data-k="q" type="number" min="0" value="' + it.q + '" aria-label="Quantity"><input class="input" data-i="' + i + '" data-k="p" type="number" min="0" step="0.01" value="' + it.p + '" aria-label="Unit price"><button type="button" class="x" data-del="' + i + '" aria-label="Remove line">×</button></div>';
    }).join("");
  }
  function invoice() {
    var p = prov($("i_prov").value), rate = T.provRate(p) / 100;
    var sub = 0, rows = items.map(function (it) { var t = (+it.q || 0) * (+it.p || 0); sub += t; return "<tr><td>" + esc(it.d || "") + '</td><td class="r">' + (+it.q || 0) + '</td><td class="r">' + m2(+it.p || 0) + '</td><td class="r">' + m2(t) + "</td></tr>"; }).join("");
    var tax = sub * rate, bn = $("i_bn").value.trim();
    var d = $("i_date").value; var ds = d ? new Date(d + "T12:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "";
    $("i_preview").innerHTML = "<header><div><h3 style=\"margin:0;font-size:1.6rem\">INVOICE</h3><div>No. " + esc($("i_no").value) + "<br>" + esc(ds) + "</div></div><div style=\"text-align:right\"><strong>" + esc($("i_from").value || "Your business") + "</strong>" + (bn ? "<br>GST/HST " + esc(bn) : "") + "</div></header>" +
      "<p><strong>Bill to:</strong> " + esc($("i_to").value || "Client name") + "</p>" +
      "<table><thead><tr><th>Description</th><th class=\"r\">Qty</th><th class=\"r\">Unit price</th><th class=\"r\">Amount</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      "<table style=\"margin-top:14px;width:50%;margin-left:auto\"><tr><td>Subtotal</td><td class=\"r\">" + m2(sub) + "</td></tr><tr><td>" + esc(p.label) + "</td><td class=\"r\">" + m2(tax) + "</td></tr><tr><td><strong>Total (CAD)</strong></td><td class=\"r\"><strong>" + m2(sub + tax) + "</strong></td></tr></table>" +
      ($("i_notes").value ? "<p style=\"margin-top:20px;color:#555\">" + esc($("i_notes").value) + "</p>" : "");
  }
  $("i_items").addEventListener("input", function (e) { var t = e.target; if (t.dataset.i != null) { items[+t.dataset.i][t.dataset.k] = t.dataset.k === "d" ? t.value : parseFloat(t.value) || 0; invoice(); } });
  $("i_items").addEventListener("click", function (e) { var b = e.target.closest("[data-del]"); if (b && items.length > 1) { items.splice(+b.dataset.del, 1); renderItems(); invoice(); } });
  $("i_add").addEventListener("click", function () { items.push({ d: "", q: 1, p: 0 }); renderItems(); invoice(); });
  on(["i_from", "i_to", "i_no", "i_date", "i_bn", "i_prov", "i_notes"], invoice);
  $("i_print").addEventListener("click", function () { show("invoice"); window.print(); });
  renderItems(); invoice();

  /* ---------- checklist ---------- */
  var GROUPS = [
    { id: "core", name: "Everyone", always: true, items: [["Last year's Notice of Assessment", "Shows your RRSP room and carry forward amounts"], ["Social Insurance Number for you, your spouse and dependants", "Bring in person. Please do not email it"], ["Bank details for direct deposit", "Void cheque or the account details"], ["Access to your CRA My Account", "Lets us see slips and your room"]] },
    { id: "emp", name: "Employed", items: [["T4 slips from every employer", "Due to you by the end of February"], ["Union or professional dues receipts", ""], ["Form T2200 if you claim home office costs", "Signed by your employer"]] },
    { id: "self", name: "Self employed", items: [["Income and expense records for the year", "Invoices, receipts, a spreadsheet or bookkeeping export"], ["Business bank and credit card statements", ""], ["GST/HST returns filed", "If you are registered"], ["Vehicle kilometre log", "Business and total kilometres"], ["Home office details", "Area, utilities, rent or mortgage interest"]] },
    { id: "rent", name: "Rental income", items: [["Rent received and expenses paid", "By property"], ["Mortgage interest and property tax statements", ""], ["Details of major repairs or purchases", "For capital cost allowance"]] },
    { id: "inv", name: "Investments", items: [["T5, T3 and T5008 slips", "Interest, dividends, trades"], ["Purchase and sale records", "To work out cost and gains"], ["Crypto transaction history", "Every disposal is reportable"]] },
    { id: "sav", name: "RRSP, TFSA, FHSA", items: [["RRSP contribution receipts", "Including the first 60 days of 2027"], ["FHSA statement and any T4FHSA slip", ""], ["TFSA contribution and withdrawal totals", "No slip is issued"]] },
    { id: "fam", name: "Family", items: [["Childcare receipts", "Name and SIN of the provider"], ["Children's birth dates", "For the Canada Child Benefit"], ["Spouse or partner's net income", ""]] },
    { id: "stu", name: "Student", items: [["T2202 tuition slip", ""], ["Student loan interest statements", ""]] },
    { id: "med", name: "Medical and donations", items: [["Medical receipts and premiums", "Any 12 month period ending in the year"], ["Disability tax credit approval (T2201)", "If applicable"], ["Official donation receipts", ""]] },
    { id: "new", name: "New to Canada or foreign income", items: [["Date you arrived in Canada", ""], ["Foreign income and foreign tax paid", "With currency and dates"], ["Foreign property over $100,000 CAD", "May require form T1135"]] },
    { id: "own", name: "Business owner", items: [["Corporate financial statements", ""], ["Prior year T2 and Notice of Assessment", ""], ["Shareholder loan and dividend records", ""], ["Payroll remittance records", "T4 summary, PD7A"]] },
    { id: "cra", name: "CRA letter received", items: [["Every CRA letter or notice you received", "Note the response deadline"], ["Any replies you already sent", ""]] }
  ];
  var sel = { core: true }, done = {};
  try { done = JSON.parse(localStorage.getItem("jezfi_check") || "{}"); } catch (e) { done = {}; }
  function save() { try { localStorage.setItem("jezfi_check", JSON.stringify(done)); } catch (e) { /* storage may be unavailable */ } }
  $("k_filters").innerHTML = GROUPS.filter(function (g) { return !g.always; }).map(function (g) { return '<button type="button" class="pill" data-g="' + g.id + '" aria-pressed="false">' + g.name + "</button>"; }).join("");
  $("k_filters").addEventListener("click", function (e) { var b = e.target.closest("[data-g]"); if (!b) return; var id = b.dataset.g; sel[id] = !sel[id]; b.classList.toggle("on", !!sel[id]); b.setAttribute("aria-pressed", !!sel[id]); checklist(); });
  function checklist() {
    var html = "", total = 0, ok = 0;
    GROUPS.forEach(function (g) {
      if (!sel[g.id]) return;
      g.items.forEach(function (it, i) {
        var key = g.id + i; total++; if (done[key]) ok++;
        html += '<li><label><input type="checkbox" data-k="' + key + '"' + (done[key] ? " checked" : "") + '><span><strong>' + esc(it[0]) + "</strong>" + (it[1] ? "<small>" + esc(it[1]) + "</small>" : "") + "</span></label></li>";
      });
    });
    $("k_list").innerHTML = html; $("k_count").textContent = ok + " of " + total;
    $("k_bar").style.width = (total ? ok / total * 100 : 0) + "%";
  }
  $("k_list").addEventListener("change", function (e) { var k = e.target.dataset.k; if (!k) return; done[k] = e.target.checked; save(); checklist(); });
  $("k_print").addEventListener("click", function () { show("checklist"); window.print(); });
  checklist();

  /* ---------- key dates + calendar files ---------- */
  function ics(title, date, desc) {
    var d = date.replace(/-/g, "");
    var nxt = new Date(date + "T12:00:00"); nxt.setDate(nxt.getDate() + 1);
    var d2 = nxt.toISOString().slice(0, 10).replace(/-/g, "");
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JEZFI Associates//Key Dates//EN", "BEGIN:VEVENT", "UID:" + d + "-" + title.replace(/\W+/g, "") + "@jezfi.com", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d{3}/g, ""), "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + d2, "SUMMARY:" + title, "DESCRIPTION:" + desc.replace(/,/g, "\\,"), "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", "DESCRIPTION:" + title, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  }
  var dates = window.JEZFI_DATES || [];
  var now = Date.now();
  $("d_list").innerHTML = dates.map(function (x, i) {
    var t = new Date(x.date + "T23:59:59").getTime(), days = Math.ceil((t - now) / 86400000);
    var label = days < 0 ? "Passed" : days === 0 ? "Today" : "In " + days + " day" + (days === 1 ? "" : "s");
    var pretty = new Date(x.date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    return '<article class="card" style="padding:22px"><span class="tag">' + label + "</span><h3 style=\"margin-top:12px\">" + esc(x.title) + "</h3><p style=\"color:var(--muted);margin-bottom:6px\"><strong>" + pretty + "</strong></p><p style=\"color:var(--muted);font-size:.93rem\">" + esc(x.desc) + '</p><button class="btn btn-ghost btn-sm" style="color:var(--blue)" type="button" data-ics="' + i + '">Add to calendar</button></article>';
  }).join("");
  $("d_list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ics]"); if (!b) return;
    var x = dates[+b.dataset.ics], blob = new Blob([ics(x.title, x.date, x.desc)], { type: "text/calendar" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jezfi-" + x.date + ".ics"; document.body.appendChild(a); a.click(); a.remove();
  });
})();
