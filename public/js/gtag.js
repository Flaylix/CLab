(async function () {
  let id = window.GTAG_ID;
  if (!id) {
    try {
      const cfg = await fetch('/api/public-config').then((r) => r.json());
      id = cfg.gtagId;
    } catch (_) {}
  }
  if (!id) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id);
  window.clabTrack = function (event, params) {
    gtag('event', event, params || {});
  };
  document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
    a.addEventListener('click', () => clabTrack('click_call', {}));
  });
})();
