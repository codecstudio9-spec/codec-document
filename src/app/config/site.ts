/**
 * Single source of truth for the production domain and support email.
 * Every SEO tag (canonical URLs, Open Graph, structured data / JSON-LD,
 * sitemap-adjacent links) and the PDF footer read from here instead of
 * hardcoding the domain — change SITE_URL once (or set VITE_SITE_URL in
 * the environment) and every one of those updates together.
 */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://codecdocument.com';

export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'support@codecdocument.com';

export const SITE_HOSTNAME = SITE_URL.replace(/^https?:\/\//, '');
