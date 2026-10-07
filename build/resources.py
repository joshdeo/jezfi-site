"""Curated resource library. Every URL here was confirmed to load or returned by a search of canada.ca / ontario.ca."""
C = "https://www.canada.ca/en/"
R = C + "revenue-agency/"
TXI = R + "services/tax/individuals/topics/"
GROUPS = [
 ("Get started with your taxes", "file", [
  ("CRA My Account", "Your secure portal for slips, notices, refunds, benefits and RRSP and TFSA room.", R + "services/e-services/e-services-individuals/account-individuals.html", "id", "filing"),
  ("Due dates and payment dates", "Filing and payment deadlines for individuals and the self employed.", TXI + "important-dates-individuals.html", "clock", "filing"),
  ("Get ready to file a tax return", "What to gather, how to file online and what to expect afterward.", C + "services/taxes/income-tax/personal-income-tax/get-ready-taxes.html", "file", "filing"),
  ("Free tax clinics", "Volunteers prepare returns for people with modest income and simple tax situations.", R + "services/tax/individuals/community-volunteer-income-tax-program.html", "person", "benefits"),
  ("Pay the CRA online", "Ways to pay your tax bill, including through your bank and My Payment.", R + "services/e-services/payment-save-time-pay-online.html", "wallet", "policy"),
  ("Direct deposit", "Get refunds and benefit payments faster, straight into your bank account.", R + "services/about-canada-revenue-agency-cra/direct-deposit.html", "wallet", "savings"),
  ("Newcomers to Canada and the CRA", "Taxes, benefits and filing steps when you are new to the country.", R + "services/tax/international-non-residents/individuals-leaving-entering-canada-non-residents/newcomers-canada-immigrants.html", "globe", "housing"),
 ]),
 ("Savings and registered plans", "piggy", [
  ("Tax Free Savings Account (TFSA)", "How a TFSA works, who can open one and how withdrawals are treated.", TXI + "tax-free-savings-account.html", "leaf", "savings"),
  ("Calculate your TFSA room", "The CRA's own method for working out your contribution room.", TXI + "tax-free-savings-account/contributing/calculate-room.html", "calc", "savings"),
  ("How contributions affect your RRSP limit", "Understand your deduction limit and what happens if you go over.", TXI + "rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html", "piggy", "savings"),
  ("Participating in your FHSA", "Annual limits, carry forward room and avoiding over contributions.", TXI + "first-home-savings-account/contributing-your-fhsa.html", "home", "housing"),
  ("FHSA tax deductions", "How FHSA contributions reduce your tax, and how to claim them.", TXI + "first-home-savings-account/tax-deductions-fhsa-contributions.html", "receipt", "housing"),
  ("Registered plan limits at a glance", "RRSP, TFSA and CPP earnings limits in one reference page.", R + "services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html", "chart", "business"),
 ]),
 ("Benefits and credits", "baby", [
  ("Canada Child Benefit", "A tax free monthly payment to help with the cost of raising children.", R + "services/child-family-benefits/canada-child-benefit.html", "baby", "benefits"),
  ("Canada Workers Benefit", "A refundable credit for people earning a modest income from work.", R + "services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45300-canada-workers-benefit-cwb/who-is-eligible.html", "briefcase", "benefits"),
  ("Accessing your benefits and credits", "Make sure you are getting every payment you qualify for.", R + "services/tax/individuals/educational-programs/accessing-benefits-credits.html", "check", "benefits"),
  ("Ontario Trillium Benefit", "Ontario's combined energy, property tax and sales tax credit payment.", "https://www.ontario.ca/page/ontario-trillium-benefit", "home", "policy"),
  ("Employment Insurance benefits", "Regular, sickness, maternity, parental and other EI benefits.", C + "services/benefits/ei.html", "shield", "scams"),
  ("Public pensions", "Canada Pension Plan, Old Age Security and related benefits.", C + "services/benefits/publicpensions.html", "person", "savings"),
 ]),
 ("For business owners", "briefcase", [
  ("Register your business", "Get your business number and the program accounts you need.", R + "services/tax/businesses/topics/registering-your-business/register.html", "building", "business"),
  ("Register for a GST/HST account", "When registration is required and how to do it.", R + "services/tax/businesses/topics/gst-hst-businesses/gst-hst-account/register-account.html", "receipt", "business"),
  ("Charge and collect the GST/HST", "Which rate applies and when to collect it from customers.", R + "services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html", "calc", "business"),
  ("Calculating payroll deductions", "How to work out CPP, EI and income tax deductions for employees.", R + "services/tax/businesses/topics/payroll/calculating-deductions/how-to-calculate.html", "wallet", "business"),
  ("Payroll deductions tables", "The CRA's published tables for withholding on employee pay.", R + "services/tax/businesses/topics/payroll/t4032-payroll-deductions-tables.html", "file", "business"),
  ("Employment standards in Ontario", "A plain language guide to the Employment Standards Act for employers and workers.", "https://www.ontario.ca/document/your-guide-employment-standards-act-0", "scale", "policy"),
 ]),
 ("Stay safe from scams", "shield", [
  ("Recognize a scam", "How to spot fake CRA calls, texts and emails, and what the CRA will never ask.", R + "corporate/scams-fraud/recognize-scam.html", "alert", "scams"),
  ("How the CRA protects your account", "Multi factor sign in, phishing site takedowns and safe habits for tax season.", R + "news/newsroom/tax-tips/tax-tips-2025/how-cra-is-keeping-information-safe.html", "shield", "scams"),
 ]),
]
