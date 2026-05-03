import { useEffect } from 'react';

/**
 * useSEO — lightweight per-page SEO updater.
 *
 * Sets <title>, meta description, canonical and og:* tags WITHOUT shipping
 * a heavy dependency like react-helmet. The browser/SPA path becomes the
 * canonical so each route gets its own SEO signals when crawled (e.g. via
 * pre-rendering or when search engines execute JS).
 *
 * @param {object} opts
 * @param {string} opts.title          - <title> text. Will be suffixed with the brand.
 * @param {string} opts.description    - meta description (~155 chars max)
 * @param {string} [opts.canonicalPath] - canonical path (defaults to current pathname)
 * @param {string} [opts.image]        - og:image URL
 * @param {string} [opts.type]         - og:type (default 'website')
 * @param {string} [opts.locale]       - og:locale (e.g. 'es_ES')
 */
export function useSEO({
  title,
  description,
  canonicalPath,
  image = 'https://tradingcalculatorpro.com/og-image.jpg',
  type = 'website',
  locale = 'es_ES',
}) {
  useEffect(() => {
    const BRAND = 'Trading Calculator PRO';
    const ORIGIN = 'https://tradingcalculatorpro.com';
    const fullTitle = title ? `${title} | ${BRAND}` : BRAND;
    const path = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const canonical = `${ORIGIN}${path}`;

    document.title = fullTitle;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [, attrName, attrValue] = selector.match(/\[([^=]+)="([^"]+)"\]/) || [];
        if (attrName && attrValue) el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:locale"]', 'content', locale);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[name="twitter:url"]', 'content', canonical);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[name="twitter:image"]', 'content', image);

    // Update canonical link
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }, [title, description, canonicalPath, image, type, locale]);
}
