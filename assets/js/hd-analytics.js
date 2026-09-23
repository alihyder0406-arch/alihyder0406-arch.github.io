/* HyderDigitals site analytics hook.
   Nothing here runs until a GA4 Measurement ID is set below. With the ID empty (the default) this file
   defines nothing that sends data, and the calculator's events stay in window.hdEvents only.
   To switch on: paste the GA4 Measurement ID (looks like G-XXXXXXXXXX) between the quotes, rebuild, deploy.
   BEFORE switching on: /support/ currently states the site sets no cookies and runs no analytics. GA4 sets
   cookies, so that paragraph must change in the SAME build (say: Google Analytics 4, what is sent, how to opt
   out). Never deploy a non-empty ID without that copy change. (Flagged by the Product/Store session, 23 Sept.)
   What is sent when on: page_view (GA4 default) and the six calculator events by name
   (calculator_page_view, calculator_started, calculator_completed, cta_viewed, cta_clicked, payhip_outbound_click)
   with their small data objects (mode, row count). No amounts, no names, no personal data are ever included. */
(function () {
  var GA4_ID = "";
  if (!GA4_ID) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
  document.head.appendChild(s);
  gtag("js", new Date());
  gtag("config", GA4_ID, { anonymize_ip: true });
  window.hdAnalytics = function (name, data) {
    try { gtag("event", name, data || {}); } catch (e) {}
  };
  // replay anything the calculator logged before this file ran
  try {
    (window.hdEvents || []).forEach(function (ev) { if (ev && ev.name) gtag("event", ev.name, ev.data || {}); });
  } catch (e) {}
})();
