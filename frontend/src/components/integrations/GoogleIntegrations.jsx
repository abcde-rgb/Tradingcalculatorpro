import { useEffect } from 'react';

/**
 * Loads ALL conditional Google integrations the SPA might need:
 *
 *  - Google Analytics 4 (gtag.js)        → REACT_APP_GA4_MEASUREMENT_ID
 *  - Google Tag Manager                  → REACT_APP_GTM_ID
 *  - Google AdSense (auto-ads)           → REACT_APP_ADSENSE_PUBLISHER_ID
 *  - Search Console verification meta    → REACT_APP_GSC_VERIFICATION
 *  - Bing Webmaster verification meta    → REACT_APP_BING_VERIFICATION
 *
 * Every integration is GUARDED by its env var — if the key is missing the
 * corresponding tag is simply not injected, so the app stays clean until
 * the user fills the keys in `frontend/.env`.
 *
 * Renders nothing visually; mounted once near the App root.
 */
export default function GoogleIntegrations() {
  useEffect(() => {
    const ga    = process.env.REACT_APP_GA4_MEASUREMENT_ID;
    const gtm   = process.env.REACT_APP_GTM_ID;
    const ads   = process.env.REACT_APP_ADSENSE_PUBLISHER_ID;
    const gsc   = process.env.REACT_APP_GSC_VERIFICATION;
    const bing  = process.env.REACT_APP_BING_VERIFICATION;

    // ───────── Google Analytics 4 ─────────
    if (ga && !document.getElementById('ga4-loader')) {
      const s = document.createElement('script');
      s.id = 'ga4-loader';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
      document.head.appendChild(s);
      const init = document.createElement('script');
      init.id = 'ga4-init';
      init.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${ga}', { anonymize_ip: true });
      `;
      document.head.appendChild(init);
    }

    // ───────── Google Tag Manager ─────────
    if (gtm && !document.getElementById('gtm-loader')) {
      const s = document.createElement('script');
      s.id = 'gtm-loader';
      s.text = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');
      `;
      document.head.appendChild(s);
      // GTM noscript fallback (for users with JS disabled / crawlers)
      if (!document.getElementById('gtm-noscript')) {
        const ns = document.createElement('noscript');
        ns.id = 'gtm-noscript';
        ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.prepend(ns);
      }
    }

    // ───────── Google AdSense (auto ads) ─────────
    if (ads && !document.getElementById('adsense-loader')) {
      const s = document.createElement('script');
      s.id = 'adsense-loader';
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads}`;
      document.head.appendChild(s);
    }

    // ───────── Search Console verification meta ─────────
    if (gsc && !document.querySelector('meta[name="google-site-verification"]')) {
      const m = document.createElement('meta');
      m.name = 'google-site-verification';
      m.content = gsc;
      document.head.appendChild(m);
    }

    // ───────── Bing Webmaster verification meta ─────────
    if (bing && !document.querySelector('meta[name="msvalidate.01"]')) {
      const m = document.createElement('meta');
      m.name = 'msvalidate.01';
      m.content = bing;
      document.head.appendChild(m);
    }
  }, []);

  return null;
}

/**
 * Helper: fire a custom GA4 event from anywhere in the app.
 * Safe to call even when GA4 isn't configured — it's a no-op.
 *
 * Usage: trackEvent('subscription_started', { plan: 'monthly' });
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
