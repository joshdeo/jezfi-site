/* JEZFI tax engine: Ontario residents, 2026 tax year.
   Sources: CRA 2026 indexation (2.0%), Ontario 2026 indexation (1.9%), CRA CPP/EI 2026 figures.
   This is an estimator. It does not replace a filed return. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.JezfiTax = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var P = {
    year: 2026,
    fed: {
      brackets: [
        { upTo: 58523, rate: 0.14 },
        { upTo: 117045, rate: 0.205 },
        { upTo: 181440, rate: 0.26 },
        { upTo: 258482, rate: 0.29 },
        { upTo: Infinity, rate: 0.33 }
      ],
      creditRate: 0.14,
      bpaMax: 16452,
      bpaMin: 14829,
      bpaPhaseStart: 181440,
      bpaPhaseEnd: 258482
    },
    on: {
      brackets: [
        { upTo: 53891, rate: 0.0505 },
        { upTo: 107785, rate: 0.0915 },
        { upTo: 150000, rate: 0.1116 },
        { upTo: 220000, rate: 0.1216 },
        { upTo: Infinity, rate: 0.1316 }
      ],
      creditRate: 0.0505,
      bpa: 12989,
      surtax1: { over: 5818, rate: 0.2 },
      surtax2: { over: 7446, rate: 0.36 },
      reductionBase: 300
    },
    cpp: { exemption: 3500, ympe: 74600, yampe: 85000, rate: 0.0595, baseCreditRate: 0.0495, cpp2Rate: 0.04 },
    ei: { mie: 68900, rate: 0.0163 },
    rrspMax: 33810,
    rrspPct: 0.18,
    tfsaLimit: 7000,
    fhsaAnnual: 8000,
    fhsaLifetime: 40000,
    capGainsInclusion: 0.5
  };

  function bracketTax(income, brackets) {
    var tax = 0, prev = 0;
    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      if (income > prev) tax += (Math.min(income, b.upTo) - prev) * b.rate;
      prev = b.upTo;
      if (income <= b.upTo) break;
    }
    return tax;
  }

  function fedBpa(netIncome) {
    var f = P.fed;
    if (netIncome <= f.bpaPhaseStart) return f.bpaMax;
    if (netIncome >= f.bpaPhaseEnd) return f.bpaMin;
    var share = (netIncome - f.bpaPhaseStart) / (f.bpaPhaseEnd - f.bpaPhaseStart);
    return f.bpaMax - (f.bpaMax - f.bpaMin) * share;
  }

  // Ontario Health Premium (not indexed)
  function ohp(ti) {
    if (ti <= 20000) return 0;
    if (ti <= 36000) return Math.min(300, 0.06 * (ti - 20000));
    if (ti <= 38500) return 300 + Math.min(150, 0.06 * (ti - 36000));
    if (ti <= 48000) return 450;
    if (ti <= 48600) return 450 + Math.min(150, 0.25 * (ti - 48000));
    if (ti <= 72000) return 600;
    if (ti <= 72600) return 600 + Math.min(150, 0.25 * (ti - 72000));
    if (ti <= 200000) return 750;
    if (ti <= 200600) return 750 + Math.min(150, 0.25 * (ti - 200000));
    return 900;
  }

  function payroll(employment) {
    var e = Math.max(0, employment || 0);
    var cppBand = Math.min(Math.max(e - P.cpp.exemption, 0), P.cpp.ympe - P.cpp.exemption);
    var cppBase = cppBand * P.cpp.rate;
    var cppBaseCredit = cppBand * P.cpp.baseCreditRate;
    var cppEnhanced = cppBase - cppBaseCredit; // deductible portion (1.00%)
    var cpp2 = Math.min(Math.max(e - P.cpp.ympe, 0), P.cpp.yampe - P.cpp.ympe) * P.cpp.cpp2Rate;
    var ei = Math.min(e, P.ei.mie) * P.ei.rate;
    return { cppBase: cppBase, cppBaseCredit: cppBaseCredit, cppEnhanced: cppEnhanced, cpp2: cpp2, ei: ei, total: cppBase + cpp2 + ei };
  }

  /* opts: employment, other, rrsp, deductions, payroll (bool, default true) */
  function compute(opts) {
    var employment = Math.max(0, +opts.employment || 0);
    var other = Math.max(0, +opts.other || 0);
    var rrsp = Math.max(0, +opts.rrsp || 0);
    var otherDed = Math.max(0, +opts.deductions || 0);
    var usePayroll = opts.payroll !== false;
    var pr = usePayroll ? payroll(employment) : { cppBase: 0, cppBaseCredit: 0, cppEnhanced: 0, cpp2: 0, ei: 0, total: 0 };

    var gross = employment + other;
    var taxable = Math.max(0, gross - pr.cppEnhanced - pr.cpp2 - rrsp - otherDed);

    // federal
    var fedBasic = bracketTax(taxable, P.fed.brackets);
    var fedCredits = (fedBpa(taxable) + pr.cppBaseCredit + pr.ei) * P.fed.creditRate;
    var fedTax = Math.max(0, fedBasic - fedCredits);

    // Ontario
    var onBasic = bracketTax(taxable, P.on.brackets);
    var onCredits = (P.on.bpa + pr.cppBaseCredit + pr.ei) * P.on.creditRate;
    var onAfterCredits = Math.max(0, onBasic - onCredits);
    var reduction = Math.max(0, Math.min(onAfterCredits, 2 * P.on.reductionBase - onAfterCredits));
    var onBeforeSurtax = Math.max(0, onAfterCredits - reduction);
    var surtax = Math.max(0, onBeforeSurtax - P.on.surtax1.over) * P.on.surtax1.rate +
                 Math.max(0, onBeforeSurtax - P.on.surtax2.over) * P.on.surtax2.rate;
    var health = ohp(taxable);
    var onTax = onBeforeSurtax + surtax + health;

    var incomeTax = fedTax + onTax;
    var totalDeductions = incomeTax + pr.total;
    return {
      gross: gross, taxable: taxable, payroll: pr,
      fedBasic: fedBasic, fedCredits: fedCredits, fedTax: fedTax,
      onBasic: onBasic, onCredits: onCredits, onReduction: reduction, onBeforeSurtax: onBeforeSurtax,
      surtax: surtax, health: health, onTax: onTax,
      incomeTax: incomeTax, totalDeductions: totalDeductions,
      afterTax: gross - totalDeductions,
      avgRate: gross > 0 ? incomeTax / gross : 0
    };
  }

  // Marginal combined rate on an extra dollar of other income, health premium excluded (matches published tables)
  function marginalRate(opts, step) {
    step = step || 100;
    var a = compute(opts);
    var o2 = {}; for (var k in opts) o2[k] = opts[k];
    o2.other = (+opts.other || 0) + step;
    var b = compute(o2);
    return ((b.incomeTax - b.health) - (a.incomeTax - a.health)) / step;
  }

  // Tax owing on a capital gain: only the inclusion rate portion is taxable
  function capitalGain(gain, baseOpts) {
    var included = Math.max(0, gain) * P.capGainsInclusion;
    var base = compute(baseOpts);
    var o2 = {}; for (var k in baseOpts) o2[k] = baseOpts[k];
    o2.other = (+baseOpts.other || 0) + included;
    var withGain = compute(o2);
    return { included: included, extraTax: withGain.incomeTax - base.incomeTax, withGain: withGain, base: base };
  }

  function rrspRoom(earnedPriorYear, unused) {
    return Math.min(Math.max(0, earnedPriorYear) * P.rrspPct, P.rrspMax) + Math.max(0, unused || 0);
  }

  var TFSA_HISTORY = { 2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000, 2013: 5500, 2014: 5500, 2015: 10000, 2016: 5500, 2017: 5500, 2018: 5500, 2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000, 2023: 6500, 2024: 7000, 2025: 7000, 2026: 7000 };

  /* First year you could use a TFSA = max(2009, year you turned 18), and you must have been a resident */
  function tfsaRoom(firstYear) {
    var total = 0, rows = [];
    for (var y = Math.max(2009, firstYear); y <= 2026; y++) { total += TFSA_HISTORY[y]; rows.push({ year: y, limit: TFSA_HISTORY[y], running: total }); }
    return { total: total, rows: rows };
  }

  // Canadian mortgages compound semi-annually
  function mortgage(principal, annualRatePct, amortYears, extraMonthly) {
    var n = Math.round(amortYears * 12);
    var r = annualRatePct / 100;
    var i = Math.pow(1 + r / 2, 2 / 12) - 1;
    var pay = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
    function run(extra) {
      var bal = principal, interest = 0, months = 0;
      while (bal > 0.005 && months < n + 600) {
        var int = bal * i; var princ = Math.min(bal, pay + extra - int);
        if (princ <= 0) break;
        bal -= princ; interest += int; months++;
      }
      return { months: months, interest: interest };
    }
    var base = run(0);
    var fast = extraMonthly > 0 ? run(extraMonthly) : base;
    return { payment: pay, totalInterest: base.interest, months: base.months,
             extra: { months: fast.months, interest: fast.interest, saved: base.interest - fast.interest, monthsSaved: base.months - fast.months } };
  }

  var PROVINCES = [
    { code: "ON", name: "Ontario", label: "HST 13%", gst: 0, pst: 0, hst: 13 },
    { code: "AB", name: "Alberta", label: "GST 5%", gst: 5, pst: 0, hst: 0 },
    { code: "BC", name: "British Columbia", label: "GST 5% + PST 7%", gst: 5, pst: 7, hst: 0 },
    { code: "MB", name: "Manitoba", label: "GST 5% + RST 7%", gst: 5, pst: 7, hst: 0 },
    { code: "NB", name: "New Brunswick", label: "HST 15%", gst: 0, pst: 0, hst: 15 },
    { code: "NL", name: "Newfoundland and Labrador", label: "HST 15%", gst: 0, pst: 0, hst: 15 },
    { code: "NS", name: "Nova Scotia", label: "HST 14%", gst: 0, pst: 0, hst: 14 },
    { code: "PE", name: "Prince Edward Island", label: "HST 15%", gst: 0, pst: 0, hst: 15 },
    { code: "QC", name: "Quebec", label: "GST 5% + QST 9.975%", gst: 5, pst: 9.975, hst: 0 },
    { code: "SK", name: "Saskatchewan", label: "GST 5% + PST 6%", gst: 5, pst: 6, hst: 0 },
    { code: "YT", name: "Yukon", label: "GST 5%", gst: 5, pst: 0, hst: 0 },
    { code: "NT", name: "Northwest Territories", label: "GST 5%", gst: 5, pst: 0, hst: 0 },
    { code: "NU", name: "Nunavut", label: "GST 5%", gst: 5, pst: 0, hst: 0 }
  ];
  function provRate(p) { return p.hst ? p.hst : p.gst + p.pst; }

  return { P: P, compute: compute, marginalRate: marginalRate, capitalGain: capitalGain, payroll: payroll, ohp: ohp,
           bracketTax: bracketTax, fedBpa: fedBpa, rrspRoom: rrspRoom, tfsaRoom: tfsaRoom, TFSA_HISTORY: TFSA_HISTORY,
           mortgage: mortgage, PROVINCES: PROVINCES, provRate: provRate };
});
