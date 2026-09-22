/* What did that job really pay? — free calculator (MIT licence, see /LICENSE).
   Same definition as The Quote Builder's Job Log ("What you really earned per hour"):
     earned per hour = (price charged − materials actually spent) ÷ hours actually taken
   Optional: compare with a target hourly rate, and the price that would have hit it
   at the hours it really took ( target × hours + materials ).
   Nothing you type is stored or sent anywhere. */
(function () {
  "use strict";
  var f = document.getElementById("jp-form");
  if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var out = $("jp-result"), detail = $("jp-detail");
  function num(id) { var v = $(id).value; return v === "" ? null : parseFloat(v); }
  function gbp(x) { return "£" + x.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function calc() {
    var price = num("jp-price"), mat = num("jp-materials") || 0, hours = num("jp-hours"),
        quoted = num("jp-quoted-hours"), target = num("jp-target");
    if (price === null || hours === null) { out.textContent = "Enter the price and the hours it actually took."; detail.textContent = ""; return; }
    if (!(hours > 0) || price < 0 || mat < 0) { out.textContent = "Hours must be more than 0, and amounts can't be negative."; detail.textContent = ""; return; }
    var perHour = (price - mat) / hours;
    out.textContent = perHour >= 0 ? "You really earned " + gbp(perHour) + " an hour on this job."
      : "This job lost you " + gbp(-perHour) + " an hour — materials cost more than the price.";
    var bits = ["(" + gbp(price) + " − " + gbp(mat) + " materials) ÷ " + hours + " h"];
    if (quoted !== null && quoted > 0) {
      var off = hours - quoted;
      bits.push(off > 0 ? "it took " + off.toFixed(2).replace(/\.?0+$/, "") + " h longer than quoted"
        : off < 0 ? "it took " + (-off).toFixed(2).replace(/\.?0+$/, "") + " h less than quoted" : "it took exactly the hours quoted");
      bits.push("at the quoted hours it would have been " + gbp((price - mat) / quoted) + "/h");
    }
    if (target !== null && target > 0) {
      var gap = perHour - target;
      bits.push(gap >= 0 ? "at or above your " + gbp(target) + "/h target" : gbp(-gap) + "/h below your " + gbp(target) + "/h target");
      bits.push("to hit the target at " + hours + " h you'd have charged " + gbp(target * hours + mat));
    }
    detail.textContent = bits.join(" · ");
  }
  f.addEventListener("input", calc);
  f.addEventListener("submit", function (e) { e.preventDefault(); calc(); });
  $("jp-example").addEventListener("click", function () {
    $("jp-price").value = "72.00"; $("jp-materials").value = "7.00"; $("jp-hours").value = "4.5";
    $("jp-quoted-hours").value = "4"; $("jp-target").value = "32"; calc();
  });
  calc();
})();
