/* Learn page: tax glossary flip cards */
(function () {
  "use strict";
  var TERMS = [
    ["T4 slip", "The form your employer gives you showing what you earned and what was withheld. Employers must issue it by the end of February."],
    ["Notice of Assessment", "The CRA's summary after processing your return: the tax it assessed, your refund or balance owing, and your RRSP deduction limit for next year."],
    ["Deduction vs credit", "A deduction lowers the income you are taxed on. A credit lowers the tax itself. Both help, in different ways."],
    ["Marginal vs average rate", "Your average rate is total tax divided by income. Your marginal rate is what you pay on your next dollar. Moving into a higher bracket only taxes the dollars above the line."],
    ["RRSP", "A retirement account. Contributions are deductible, growth is tax deferred and withdrawals are taxed. The 2026 limit is the lesser of 18% of last year's earned income or $33,810."],
    ["TFSA", "A savings and investment account where growth and withdrawals are tax free. Contributions are not deductible. The 2026 limit is $7,000 and withdrawals return as room the next year."],
    ["FHSA", "A first home savings account. Contributions are deductible like an RRSP and qualifying home purchase withdrawals are tax free like a TFSA. $8,000 a year, $40,000 for life."],
    ["Basic personal amount", "The slice of income federal tax does not touch. For most people in 2026 it is $16,452, and it shrinks for very high earners."],
    ["Input tax credit", "A business registered for GST/HST can get back the GST/HST it paid on business purchases, by claiming an input tax credit on its return."],
    ["Instalments", "Advance tax payments through the year. They are generally required when you owe more than $3,000 in the current year and in either of the two years before."],
    ["Carry forward", "Unused RRSP room, TFSA room, tuition credits and capital losses do not vanish. Many can be saved and used in later years."],
    ["CRA My Account", "The CRA's secure online portal. See your slips, notices, refunds, benefit payments and contribution room, and send documents, without waiting on the mail."]
  ];
  var host = document.getElementById("gloss"); if (!host) return;
  host.innerHTML = TERMS.map(function (t, i) {
    return '<button type="button" class="flip reveal" aria-pressed="false" aria-label="' + t[0] + '. Activate to read the definition."><span><i class="f"><b>' + t[0] + "</b><small>Tap to flip</small></i><i class=\"k\"><span>" + t[1] + "</span></i></span></button>";
  }).join("");
  host.addEventListener("click", function (e) { var b = e.target.closest(".flip"); if (!b) return; var on = b.classList.toggle("on"); b.setAttribute("aria-pressed", on); });
  // flip text block uses <span> inside .k; make sure it wraps nicely
})();
