const T = require("../js/tax.js");
let fail = 0;
const near = (a, b, tol, msg) => { const ok = Math.abs(a - b) <= tol; if (!ok) { fail++; console.log("FAIL", msg, "got", a, "want", b); } else console.log("ok  ", msg, a.toFixed ? a.toFixed(4) : a); };

// Published combined federal + Ontario marginal rates for 2026 (TaxTips.ca, confirmed to CRA data); health premium excluded.
const marg = [[40000, 0.1905], [56000, 0.2315], [80000, 0.2965], [100000, 0.3148], [110000, 0.3389], [114000, 0.3791],
              [130000, 0.4341], [160000, 0.4497], [200000, 0.4826], [240000, 0.4982], [300000, 0.5353]];
for (const [inc, want] of marg) near(T.marginalRate({ employment: 0, other: inc, payroll: false }, 100), want, 0.0006, "marginal @" + inc);

// Gross federal tax on $100,000 taxable income before credits: 58,523*14% + 41,477*20.5% = 16,696.0
near(T.bracketTax(100000, T.P.fed.brackets), 16696.0, 0.5, "federal basic tax @100k");

// CPP maxima 2026
const pr = T.payroll(200000);
near(pr.cppBase, 4230.45, 0.01, "CPP max");
near(pr.cpp2, 416, 0.01, "CPP2 max");
near(pr.ei, 1123.07, 0.01, "EI max");

// Ontario: no tax up to $18,930 taxable (low income reduction)
near(T.compute({ employment: 0, other: 18930, payroll: false }).onBeforeSurtax, 0, 0.5, "ON tax nil at 18,930");
// Ontario Health Premium plateaus
near(T.ohp(30000), 300 > 0.06*10000 ? 600 : 300, 0.01, "OHP @30k");
near(T.ohp(60000), 600, 0.01, "OHP @60k");
near(T.ohp(100000), 750, 0.01, "OHP @100k");
near(T.ohp(250000), 900, 0.01, "OHP @250k");

// Sanity: $60k employee
const r = T.compute({ employment: 60000 });
console.log("60k employee:", JSON.stringify({ taxable: Math.round(r.taxable), fed: Math.round(r.fedTax), on: Math.round(r.onTax), payroll: Math.round(r.payroll.total), net: Math.round(r.afterTax) }));
if (!(r.afterTax > 44000 && r.afterTax < 50000)) { fail++; console.log("FAIL take-home sanity"); }

// Mortgage: $500k, 5%, 25y Canadian semi-annual compounding -> about $2,908.
const m = T.mortgage(500000, 5, 25, 0);
near(m.payment, 2908.0, 5, "mortgage payment 500k/5%/25y");
// TFSA: eligible since 2009 -> $109,000 by 2026
near(T.tfsaRoom(2009).total, 109000, 0, "TFSA lifetime 2026");
near(T.tfsaRoom(2026).total, 7000, 0, "TFSA first year 2026");
console.log(fail ? fail + " FAILED" : "ALL PASSED");
process.exit(fail ? 1 : 0);
