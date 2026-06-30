import { useEffect } from 'react';
import { useLanguage } from '../contexts/language-context';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonicalUrl?: string;
  image?: string;
}

const DEFAULT_OG_IMAGE = 'https://codecdocument.com/og-image.png';

export function SEOHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogType = 'website',
  canonicalUrl,
  image,
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

    const currentUrl = window.location.origin + window.location.pathname;
    updateLangAlternate('en', currentUrl);
    updateLangAlternate('es', currentUrl);
    updateLangAlternate('x-default', currentUrl);

  }, [title, description, keywords, ogTitle, ogDescription, ogType, canonicalUrl, image, language]);

  return null;
}
