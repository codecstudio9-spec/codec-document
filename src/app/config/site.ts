/**
 * Single source of truth for the production domain and support email.
 * Every SEO tag (canonical URLs, Open Graph, structured data / JSON-LD,
 * sitemap-adjacent links) and the PDF footer read from here instead of
 * hardcoding the domain — change SITE_URL once (or set VITE_SITE_URL in
 * the environment) and every one of those updates together.
 */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') || 'https://www.codecdocument.com';

/** General inquiries — footer/contact-us surfaces. Also backs SUPPORT_EMAIL
 * below: there is no separate support@ mailbox actually set up, only this
 * one and BUSINESS_EMAIL, so "support" surfaces (Settings, refund policy,
 * the home FAQ) point here too rather than to a real-looking but
 * non-existent address. */
export const INFO_EMAIL =
  (import.meta.env.VITE_INFO_EMAIL as string | undefined) || 'info@codecdocument.com';

export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || INFO_EMAIL;

/** Business/enterprise sales inquiries. */
export const BUSINESS_EMAIL =
  (import.meta.env.VITE_BUSINESS_EMAIL as string | undefined) || 'business@codecdocument.com';

/** LATAM-only for now — no US number yet, so any UI using this must gate
 * on the visitor being in a Spanish/LatAm context (language === 'es'),
 * never render it unconditionally site-wide. */
export const WHATSAPP_LINK =
  (import.meta.env.VITE_WHATSAPP_LINK as string | undefined) || 'https://wa.link/5yku3k';

/** Book a call (Google Calendar/Meet) — paired with BUSINESS_EMAIL for
 * sales/enterprise conversations. */
export const MEETING_LINK =
  (import.meta.env.VITE_MEETING_LINK as string | undefined) || 'https://calendar.app.google/aUo8a4CJxduFDuNz9';

export const SITE_HOSTNAME = SITE_URL.replace(/^https?:\/\//, '');
