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
}

export function SEOHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogType = 'website',
  canonicalUrl,
}: SEOHeadProps) {
  const { language } = useLanguage();

  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

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

  }, [title, description, keywords, ogTitle, ogDescription, ogType, canonicalUrl, language]);

  return null;
}
