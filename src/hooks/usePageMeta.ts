import { useEffect } from 'react';

// PROJ-102 (SEO/AEO) Phase 2: per-route <head> metadata for the app's public
// routes. Hand-rolled rather than react-helmet-async — only 4 routes ever
// need this, so a dependency wasn't justified. Values are upserted on mount;
// since exactly one public route is ever mounted at a time, the next route's
// mount effect simply overwrites these tags rather than needing to restore
// "previous" values on unmount.

const SITE_NAME = 'My Recovery Toolkit';
export const SITE_ORIGIN = 'https://www.myrecoverytoolkit.ca';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

export interface PageMetaOptions {
  /** Page title, e.g. "Sign In". Rendered as "Sign In | My Recovery Toolkit" unless it already equals the site name. */
  title: string;
  description: string;
  /** Route path, e.g. "/", "/login". Used to build the canonical and og:url. */
  path: string;
  image?: string;
  /** Optional JSON-LD object(s) to inject as a <script type="application/ld+json">, homepage only today. */
  jsonLd?: object | object[];
}

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(jsonLd: object | object[] | undefined) {
  const existing = document.head.querySelector('script[data-page-jsonld]');
  if (existing) existing.remove();
  if (!jsonLd) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-page-jsonld', 'true');
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

export function usePageMeta({ title, description, path, image = DEFAULT_OG_IMAGE, jsonLd }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_ORIGIN}${path}`;

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:url', url);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    upsertJsonLd(jsonLd);
  }, [title, description, path, image, jsonLd]);
}
