/* Multi step intake. Submits to Netlify Forms when hosted there; falls back to a prefilled email. */
(function () {
  "use strict";
  var form = document.getElementById("intakeForm"); if (!form) return;
  var steps = [].slice.call(form.querySelectorAll(".step")), dots = [].slice.call(document.querySelectorAll("#steps li")), cur = 0;
  function go(n) {
    cur = n;
    steps.forEach(function (s, i) { s.classList.toggle("on", i === n); });
    dots.forEach(function (d, i) { d.classList.toggle("on", i <= n); });
    var top = form.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: top, behavior: "smooth" });
    var f = steps[n].querySelector("input,select,textarea"); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 350);
  }
  form.addEventListener("click", function (e) {
    if (e.target.closest("[data-next]")) {
      if (cur === 0 && !form.querySelector("input[name=services]:checked")) { document.getElementById("err1").hidden = false; return; }
      document.getElementById("err1").hidden = true; go(Math.min(cur + 1, steps.length - 1));
    }
    if (e.target.closest("[data-prev]")) go(Math.max(cur - 1, 0));
  });
  // preselect from a link such as contact.html?service=Payroll
  try { var sp = new URLSearchParams(location.search).get("service"); if (sp) { var el = form.querySelector('input[name=services][value="' + sp.replace(/"/g, "") + '"]'); if (el) el.checked = true; } } catch (e) { /* ignore */ }

  function val(n) { return (form.elements[n] && form.elements[n].value || "").trim(); }
  function list(n) { return [].slice.call(form.querySelectorAll("input[name=" + n + "]:checked")).map(function (i) { return i.value; }).join(", "); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("err3"), ok = document.getElementById("ok"); err.hidden = true; ok.hidden = true;
    var email = val("email"), name = val("name");
    if (!name) { err.textContent = "Please add your name."; err.hidden = false; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) { err.textContent = "Please enter a valid email address so we can reply."; err.hidden = false; return; }
    if (!form.elements.consent.checked) { err.textContent = "Please tick the box so we know we may contact you."; err.hidden = false; return; }

    var btn = document.getElementById("send"); btn.disabled = true; btn.textContent = "Sending…";
    var data = new URLSearchParams(new FormData(form));
    function done() { form.hidden = true; document.getElementById("steps").hidden = true; document.getElementById("thanks").hidden = false; window.scrollTo({ top: document.getElementById("intake").offsetTop - 80, behavior: "smooth" }); }
    function fallback() {
      var body = "Hello JEZFI team,\n\nI would like help with: " + list("services") + "\nWho: " + val("client_type") + "\nYear: " + val("tax_year") + "\nSituation: " + (list("situation") || "n/a") + "\n\nName: " + name + "\nPhone: " + val("phone") + "\nEmail: " + email + "\nBest way to reach me: " + val("contact_preference") + " (" + val("best_time") + ")\n\n" + val("message");
      var href = "mailto:info@jezfi.com?subject=" + encodeURIComponent("Intake request from " + name) + "&body=" + encodeURIComponent(body);
      ok.innerHTML = 'We could not send this automatically. <a href="' + href + '"><strong>Click here to send it by email</strong></a> or call <a href="tel:+19052680003">905-268-0003</a>.';
      ok.hidden = false; btn.disabled = false; btn.textContent = "Send my request";
    }
    if (!/^https?:/.test(location.protocol)) { fallback(); return; }
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: data.toString() })
      .then(function (r) { if (r.ok) done(); else fallback(); })
      .catch(fallback);
  });
})();
