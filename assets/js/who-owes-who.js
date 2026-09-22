/* Who Owes Who — free settle-up calculator (MIT licence, see /LICENSE).
   Same arithmetic as the free spreadsheet (products/free-settle-up) and The Couples Budget:
   only SHARED spends count.
   50/50 (the Dashboard's Settle up): settle = (what A paid on shared − what B paid on shared) ÷ 2.
   By income (the Fair Split tab): A's share = A take-home ÷ (A + B take-home);
     A should have paid = share × shared total; settle = what A paid − what A should have paid.
   Nothing you type is stored or sent anywhere. Events go to an in-page log only (window.hdEvents)
   and to window.hdAnalytics(name, data) if a page ever defines one. */
(function () {
  "use strict";
  var EXAMPLE = [
    { what: "Big shop", who: "A", amount: "68.40", kind: "Shared" },
    { what: "Broadband", who: "B", amount: "32.00", kind: "Shared" },
    { what: "Cinema, just me", who: "A", amount: "14.50", kind: "Personal" },
    { what: "Train tickets", who: "B", amount: "21.60", kind: "Shared" }
  ];
  var body = document.getElementById("wow-rows");
  if (!body) return;
  var $ = function (id) { return document.getElementById(id); };
  var nameA = $("wow-name-a"), nameB = $("wow-name-b");
  var out = $("wow-result"), detail = $("wow-detail");
  var incBox = $("wow-income"), incA = $("wow-inc-a"), incB = $("wow-inc-b");
  var incLabA = $("wow-inc-a-label"), incLabB = $("wow-inc-b-label");
  var cta = $("wow-cta");
  var n = 0, started = false, lastResult = "", ctaSeen = false;

  /* ---- events: in-page only. Nothing is sent anywhere. ---- */
  function track(name, data) {
    var ev = { name: name, at: new Date().toISOString(), data: data || {} };
    try { (window.hdEvents = window.hdEvents || []).push(ev); } catch (e) {}
    try { if (typeof window.hdAnalytics === "function") window.hdAnalytics(name, ev.data); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("hd:event", { detail: ev })); } catch (e) {}
  }
  function start() { if (!started) { started = true; track("calculator_started", { mode: mode() }); } }

  /* All sums are done in whole pence, so 0.1 + 0.2 style drift cannot creep in. */
  function pence(x) { return Math.round(x * 100); }
  function halfUp(x) { return Math.sign(x) * Math.round(Math.abs(x)); }
  function gbp(p) {
    var x = p / 100;
    return "£" + x.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pct(x) { return Math.round(x * 100) + "%"; }
  function names() {
    return { A: (nameA.value || "").trim() || "Partner A", B: (nameB.value || "").trim() || "Partner B" };
  }
  function mode() {
    var r = document.querySelector('input[name="wow-mode"]:checked');
    return r && r.value === "income" ? "income" : "half";
  }
  function money(input) {
    if (!input || input.value === "") return null;
    var v = parseFloat(input.value);
    return isFinite(v) && v >= 0 ? v : null;
  }
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]); }
    return e;
  }
  function addRow(r) {
    n += 1;
    var id = "s" + n;
    var tr = document.createElement("tr");
    var tdWhat = el("td", { "class": "what" });
    var lw = el("label", { "for": id + "w", "class": "sr" }); lw.textContent = "What was it (row " + n + ")";
    var iw = el("input", { id: id + "w", type: "text", placeholder: "What was it?", autocomplete: "off" });
    iw.value = r.what || "";
    tdWhat.appendChild(lw); tdWhat.appendChild(iw);

    var tdWho = el("td", {});
    var lp = el("label", { "for": id + "p", "class": "sr" }); lp.textContent = "Who paid (row " + n + ")";
    var sp = el("select", { id: id + "p", "data-who": "1" });
    ["A", "B"].forEach(function (k) { var o = el("option", { value: k }); sp.appendChild(o); });
    sp.value = r.who || "A";
    tdWho.appendChild(lp); tdWho.appendChild(sp);

    var tdAmt = el("td", { "class": "amt" });
    var la = el("label", { "for": id + "a", "class": "sr" }); la.textContent = "Amount in pounds (row " + n + ")";
    var ia = el("input", { id: id + "a", type: "number", inputmode: "decimal", min: "0", step: "0.01", placeholder: "0.00" });
    ia.value = r.amount || "";
    tdAmt.appendChild(la); tdAmt.appendChild(ia);

    var tdKind = el("td", {});
    var lk = el("label", { "for": id + "k", "class": "sr" }); lk.textContent = "Shared or personal (row " + n + ")";
    var sk = el("select", { id: id + "k" });
    ["Shared", "Personal"].forEach(function (k) { var o = el("option", { value: k }); o.textContent = k; sk.appendChild(o); });
    sk.value = r.kind || "Shared";
    tdKind.appendChild(lk); tdKind.appendChild(sk);

    var tdDel = el("td", { "class": "del" });
    var bx = el("button", { type: "button", "class": "x", "aria-label": "Remove row " + n });
    bx.textContent = "×";
    bx.addEventListener("click", function () { tr.parentNode.removeChild(tr); start(); calc(); });
    tdDel.appendChild(bx);

    [tdWhat, tdWho, tdAmt, tdKind, tdDel].forEach(function (td) { tr.appendChild(td); });
    body.appendChild(tr);
    refreshNames();
  }
  function refreshNames() {
    var nm = names();
    var sels = body.querySelectorAll("select[data-who]");
    for (var i = 0; i < sels.length; i++) {
      sels[i].options[0].textContent = nm.A;
      sels[i].options[1].textContent = nm.B;
    }
    if (incLabA) incLabA.textContent = nm.A + " — monthly take-home pay (£)";
    if (incLabB) incLabB.textContent = nm.B + " — monthly take-home pay (£)";
  }
  function showCta(show) {
    if (!cta) return;
    cta.hidden = !show;
    if (show && !ctaSeen) { ctaSeen = true; track("cta_viewed", {}); }
  }
  function calc() {
    var nm = names();
    var rows = body.querySelectorAll("tr");
    var paid = { A: 0, B: 0 }, personal = 0, bad = 0;
    for (var i = 0; i < rows.length; i++) {
      var s = rows[i].querySelectorAll("select, input");
      var who = s[1].value, amt = parseFloat(s[2].value), kind = s[3].value;
      if (s[2].value === "") continue;
      if (!isFinite(amt) || amt < 0) { bad += 1; continue; }
      if (kind === "Shared") paid[who] += pence(amt); else personal += pence(amt);
    }
    var shared = paid.A + paid.B;
    var m = mode();
    var line = "", extra = "";
    if (shared === 0) {
      out.textContent = "Add a shared spend to see who owes who.";
      detail.textContent = bad ? bad + " amount(s) ignored (not a positive number)" : "";
      showCta(false);
      return;
    }
    var diff, owe;
    if (m === "income") {
      var a = money(incA), b = money(incB);
      if (a === null || b === null || a + b <= 0) {
        out.textContent = "Type what you each take home to split by income.";
        detail.textContent = "Shared spending " + gbp(shared) + " · " + nm.A + " paid " + gbp(paid.A) + " · " + nm.B + " paid " + gbp(paid.B);
        showCta(false);
        return;
      }
      var shareA = a / (a + b), shareB = b / (a + b);
      var shouldA = shareA * shared, shouldB = shareB * shared;
      diff = halfUp(paid.A - shouldA);           /* pence; > 0: A overpaid, so B owes A */
      owe = Math.abs(diff);
      extra = " · " + nm.A + "'s share " + pct(shareA) + " (" + gbp(shouldA) + ") · " + nm.B + "'s share " + pct(shareB) + " (" + gbp(shouldB) + ")";
    } else {
      diff = halfUp((paid.A - paid.B) / 2);       /* pence; > 0: B owes A */
      owe = Math.abs(diff);
      extra = " · each person's half " + gbp(shared / 2);
    }
    if (diff === 0) line = "All square — nobody owes anybody.";
    else if (diff > 0) line = nm.B + " owes " + nm.A + " " + gbp(owe);
    else line = nm.A + " owes " + nm.B + " " + gbp(owe);
    out.textContent = line;
    detail.textContent = "Shared spending " + gbp(shared) + extra +
      " · " + nm.A + " paid " + gbp(paid.A) + " · " + nm.B + " paid " + gbp(paid.B) +
      (personal ? " · personal spending left out: " + gbp(personal) : "") +
      (bad ? " · " + bad + " amount(s) ignored (not a positive number)" : "");
    showCta(true);
    if (started && line !== lastResult) {
      track("calculator_completed", { mode: m, rows: rows.length, shared_pence: shared, owe_pence: owe });
    }
    lastResult = line;
  }
  function setMode() {
    var income = mode() === "income";
    if (incBox) incBox.hidden = !income;
    if (income && incA && !incA.value && !incB.value) incA.focus();
  }

  $("wow-add").addEventListener("click", function () { start(); addRow({}); var i = body.querySelectorAll("tr"); i[i.length - 1].querySelector("input").focus(); });
  $("wow-clear").addEventListener("click", function () { start(); body.innerHTML = ""; n = 0; addRow({}); addRow({}); calc(); });
  $("wow-example").addEventListener("click", function () { body.innerHTML = ""; n = 0; EXAMPLE.forEach(addRow); calc(); });
  body.addEventListener("input", function () { start(); calc(); });
  body.addEventListener("change", function () { start(); calc(); });
  [nameA, nameB].forEach(function (e) { e.addEventListener("input", function () { start(); refreshNames(); calc(); }); });
  [incA, incB].forEach(function (e) { if (e) e.addEventListener("input", function () { start(); calc(); }); });
  var radios = document.querySelectorAll('input[name="wow-mode"]');
  for (var r = 0; r < radios.length; r++) radios[r].addEventListener("change", function () { start(); setMode(); calc(); });

  /* outbound clicks to Payhip: logged in-page only. Payhip's own referrer report shows this site as the source. */
  var links = document.querySelectorAll('a[href^="https://payhip.com"]');
  for (var k = 0; k < links.length; k++) {
    links[k].addEventListener("click", function (ev) {
      var a = ev.currentTarget;
      if (cta && cta.contains(a)) track("cta_clicked", { href: a.href });
      track("payhip_outbound_click", { href: a.href, text: (a.textContent || "").trim().slice(0, 60) });
    });
  }

  track("calculator_page_view", { path: location.pathname });
  setMode();
  EXAMPLE.forEach(addRow);
  calc();
})();
