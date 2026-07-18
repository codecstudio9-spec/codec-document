// City-level SEO landing pages — first city added: San Jose, California
// (real, meaningful visitor traffic from there, per admin analytics).
//
// Deliberately reuses California's real legal content as-is (STATE_SEO_CONFIGS
// / DOCTYPE_STATE_CONFIGS) rather than inventing San Jose-specific facts —
// these documents follow California STATE law, not city ordinances, so
// fabricating a "San Jose legal difference" would be both inaccurate and
// thin/duplicate content. The city name earns its keep in the page
// <title>/meta description (real local search intent, "documents San Jose"),
// while the visible hero/body honestly says "California law" throughout —
// per explicit instruction: no "SAN JOSE CALIFORNIA" shouted in the hero.

import { STATE_SEO_CONFIGS, type StateSeoConfig } from './state-seo-content';
import { DOCTYPE_STATE_CONFIGS, type DocTypeState, type DocType } from './doctype-state-seo-content';

export interface CitySeoConfig {
  slug: string;           // used in the URL: /san-jose-california, /nda-san-jose-california, ...
  cityName: string;
  cityNameEs: string;
  state: StateSeoConfig;  // California's real content, reused verbatim
}

export const CITY_SEO_CONFIGS: CitySeoConfig[] = [
  {
    slug: 'san-jose-california',
    cityName: 'San Jose',
    cityNameEs: 'San José',
    state: STATE_SEO_CONFIGS.find((s) => s.slug === 'california')!,
  },
];

export function getCityDocTypeConfigs(citySlug: string): Array<{ city: CitySeoConfig; docState: DocTypeState }> {
  const city = CITY_SEO_CONFIGS.find((c) => c.slug === citySlug);
  if (!city) return [];
  return DOCTYPE_STATE_CONFIGS
    .filter((d) => d.stateSlug === city.state.slug)
    .map((docState) => ({ city, docState }));
}

export function getCityDocTypeConfig(citySlug: string, docType: DocType) {
  return getCityDocTypeConfigs(citySlug).find((c) => c.docState.docType === docType) ?? null;
}
