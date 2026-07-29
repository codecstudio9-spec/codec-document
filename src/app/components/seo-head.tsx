import { useEffect } from 'react';
import { useLanguage } from '../contexts/language-context';
import { SITE_URL } from '../config/site';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonicalUrl?: string;
  image?: string;
  /** ONLY for pages that are a genuine translation of the SAME content
   * (e.g. a generic /electronic-signature (en) <-> /firma-electronica (es)
   * pair). Do NOT use this to link a US-state page to a LatAm-country page
   * or vice versa — those are different documents citing different local
   * law, not translations of each other, and hreflang-linking them would
   * incorrectly tell Google they're interchangeable. Leave unset for any
   * page without a real translated counterpart; SEOHead then emits a
   * correct self-referencing hreflang instead, which is what Google
   * recommends for single-language content. */
  alternateLanguages?: Array<{ hreflang: string; url: string }>;
}

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function SEOHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogType = 'website',
  canonicalUrl,
  image,
  alternateLanguages,
}: SEOHeadProps) {
  const { language } = useLanguage();

  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

    // Set page language for SEO
    document.documentElement.lang = language === 'es' ? 'es' : 'en';

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      updateMetaTag('description', description);
    }
    
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Language
    updateMetaTag('language', language === 'es' ? 'Spanish' : 'English');
    
    // Open Graph tags
    if (ogTitle || title) {
      updateMetaTag('og:title', ogTitle || title || '', true);
    }
    
    if (ogDescription || description) {
      updateMetaTag('og:description', ogDescription || description || '', true);
    }
    
    if (canonicalUrl) {
      updateMetaTag('og:url', canonicalUrl, true);
      updateMetaTag('twitter:url', canonicalUrl);
    }

    const imageUrl = image || DEFAULT_OG_IMAGE;
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:image:alt', title || 'Codec Document — Legal Document Generator', true);
    updateMetaTag('twitter:image', imageUrl);
    updateMetaTag('twitter:site', '@codecdocument');
    updateMetaTag('twitter:creator', '@codecdocument');
    updateMetaTag('og:site_name', 'Codec Document', true);

    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:locale', language === 'es' ? 'es_US' : 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    if (title) {
      updateMetaTag('twitter:title', title);
    }
    if (description) {
      updateMetaTag('twitter:description', description);
    }

    // Canonical URL
    if (canonicalUrl) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.href = canonicalUrl;
    }

    // Language alternates
    const updateLangAlternate = (hreflang: string, href: string) => {
      let linkElement = document.querySelector(`link[hreflang="${hreflang}"]`) as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'alternate');
        linkElement.setAttribute('hreflang', hreflang);
        document.head.appendChild(linkElement);
      }
      linkElement.href = href;
    };

    // Clear any alternate hreflang tags left over from a previous route
    // (client-side navigation reuses the same document — a stale tag from
    // the last page would otherwise linger) before writing this page's own.
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());

    const selfUrl = canonicalUrl || (window.location.origin + window.location.pathname);
    if (alternateLanguages?.length) {
      // Genuine translation cluster: link every real counterpart, plus this
      // page itself so the cluster is complete and self-referencing (both
      // required by Google's hreflang spec).
      alternateLanguages.forEach(({ hreflang, url }) => updateLangAlternate(hreflang, url));
      updateLangAlternate(language === 'en' ? 'en' : 'es', selfUrl);
      const defaultUrl = alternateLanguages.find((a) => a.hreflang === 'en')?.url ?? selfUrl;
      updateLangAlternate('x-default', defaultUrl);
    } else {
      // No real translation of this specific page exists — self-referencing
      // hreflang is the correct thing to emit (Google explicitly recommends
      // this for single-language pages), not a fake alternate pointing at
      // an unrelated page in another market.
      updateLangAlternate(language === 'en' ? 'en' : 'es', selfUrl);
      updateLangAlternate('x-default', selfUrl);
    }

  }, [title, description, keywords, ogTitle, ogDescription, ogType, canonicalUrl, image, language, alternateLanguages]);

  return null;
}
