import { useEffect } from 'react';
import { SITE_URL } from '../config/site';

interface StructuredDataCountry {
  name: string;
  nameEs: string;
  /** Real local law citation (e.g. "Law 527 of 1999") — replaces the
   * hardcoded ESIGN Act/UETA claim, which is only actually true for the US.
   * Asserting ESIGN Act compliance in JSON-LD on a Colombia/Mexico/etc.
   * page would be a false legal claim in structured data, not just a copy
   * inconsistency. */
  lawBadgeEn: string;
  lawBadgeEs: string;
}

interface StructuredDataProps {
  /** Defaults to 'en' — every existing call site that renders
   * <StructuredData /> with no props keeps the exact previous US/English
   * output. */
  language?: 'en' | 'es';
  /** Pass only for a real single-country LatAm landing page (see
   * CountrySignatureLanding.tsx). Narrows areaServed and swaps the
   * US-specific legal-compliance wording for this country's actual law.
   * Omit for US-wide pages. */
  country?: StructuredDataCountry;
}

export function StructuredData({ language = 'en', country }: StructuredDataProps = {}) {
  useEffect(() => {
    const isEs = language === 'es';
    const countryName = country ? (isEs ? country.nameEs : country.name) : (isEs ? 'Estados Unidos' : 'United States');
    const lawBadge = country ? (isEs ? country.lawBadgeEs : country.lawBadgeEn) : (isEs ? 'Ley E-SIGN (15 U.S.C. § 7001) y UETA' : 'the Federal ESIGN Act and UETA');

    // ── Organization ──────────────────────────────────────────────────────────
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Codec Document',
      url: SITE_URL,
      inLanguage: isEs ? 'es' : 'en',
      description: isEs
        ? `Generador de documentos legales gratis y plataforma de firma electrónica con validez legal en ${countryName}, conforme a ${lawBadge}. Editor inteligente de plantillas para NDA, contratos de arrendamiento, acuerdos de servicio — sin tarjeta de crédito.`
        : `Free legal document generator and e-signature platform for ${countryName}, compliant with ${lawBadge}. Intelligent template editor for NDA, lease agreements, service contracts — no credit card required.`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Spanish'],
      },
      sameAs: ['https://codecstudio.online/'],
    };

    // ── SoftwareApplication (free tier + paid) ────────────────────────────────
    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Codec Document',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      inLanguage: isEs ? 'es' : 'en',
      description: isEs
        ? `Crea, edita y firma documentos legales profesionales en línea. Editor inteligente de plantillas gratis para NDA, contratos de arrendamiento residencial, acuerdos de servicio y más. Conforme a ${lawBadge}.`
        : `Create, edit, and e-sign professional legal documents online. Free intelligent template editor for NDA, residential lease agreements, service contracts, and more. Compliant with ${lawBadge}.`,
      offers: [
        {
          '@type': 'Offer',
          name: isEs ? 'Plan Gratuito' : 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description: isEs
            ? '2 documentos legales gratis y 2 firmas electrónicas gratis cada 72 horas. Acceso completo al editor inteligente de plantillas. Sin tarjeta de crédito.'
            : '2 free legal documents and 2 free e-signatures every 72 hours. Full access to intelligent template editor. No credit card required.',
          eligibleRegion: { '@type': 'Country', name: countryName },
        },
        {
          '@type': 'Offer',
          name: isEs ? 'Plan Mensual' : 'Monthly Plan',
          price: '29.99',
          priceCurrency: 'USD',
          description: isEs
            ? 'Documentos legales ilimitados, firmas electrónicas ilimitadas, espacio de trabajo en la nube, soporte prioritario.'
            : 'Unlimited legal documents, unlimited e-signatures, cloud workspace, priority support.',
          eligibleRegion: { '@type': 'Country', name: countryName },
        },
      ],
      // No aggregateRating here on purpose — there is no real review
      // collection system anywhere in this app to back one. Google's
      // structured-data guidelines treat a fabricated AggregateRating/
      // Review as a policy violation (manual action risk: rich results get
      // suppressed sitewide). Only add this back once genuine, verifiable
      // customer reviews exist to source the numbers from.
    };

    // ── Product Schema ────────────────────────────────────────────────────────
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: isEs ? 'Plantillas de Documentos Legales Profesionales' : 'Professional Legal Document Templates',
      inLanguage: isEs ? 'es' : 'en',
      description: country
        ? (isEs
          ? `Plantillas de documentos legales profesionales, revisadas y adaptadas a ${country.nameEs}. Editor inteligente gratis con vista previa instantánea. Firma electrónica con validez legal conforme a ${lawBadge} incluida.`
          : `Professional, legally-vetted document templates customized for ${country.name}. Free intelligent editor with instant preview. E-signature compliant with ${lawBadge} included.`)
        : (isEs
          ? 'Plantillas de documentos legales profesionales, revisadas y personalizadas para los 50 estados de EE. UU. Editor inteligente gratis con vista previa instantánea. Firma electrónica conforme a la Ley E-SIGN y UETA incluida.'
          : 'Professional, legally-vetted document templates customized for all 50 US states. Free intelligent editor with instant preview. ESIGN Act & UETA compliant e-signature included.'),
      brand: { '@type': 'Brand', name: 'Codec Document' },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '251.99',
        offerCount: '4',
      },
      // See the SoftwareApplication schema above for why aggregateRating
      // is intentionally absent here too.
    };

    // ── WebSite ───────────────────────────────────────────────────────────────
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Codec Document',
      url: SITE_URL,
      inLanguage: isEs ? 'es' : 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    // ── Service ───────────────────────────────────────────────────────────────
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: isEs ? 'Generador de Documentos Legales y Plataforma de Firma Electrónica' : 'Legal Document Generator & Electronic Signature Platform',
      provider: { '@type': 'Organization', name: 'Codec Document' },
      areaServed: { '@type': 'Country', name: countryName },
      inLanguage: isEs ? 'es' : 'en',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: isEs ? 'Documentos Legales y Firmas Electrónicas' : 'Legal Documents & E-Signatures',
        itemListElement: [
          {
            '@type': 'OfferCatalog',
            name: isEs ? 'Plantillas de Documentos Legales Gratis' : 'Free Legal Document Templates',
            itemListElement: [
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: country
                    ? (isEs ? `Plantilla de NDA Gratis — ${country.nameEs}` : `Free NDA Template — ${country.name}`)
                    : 'Free NDA Template — All 50 US States',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: country
                    ? (isEs ? `Contrato de Arrendamiento Residencial Gratis — ${country.nameEs}` : `Free Residential Lease Agreement — ${country.name}`)
                    : 'Free Residential Lease Agreement — California, Texas, Florida, New York',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: isEs ? 'Acuerdo de Contratista Independiente Gratis' : 'Free Independent Contractor Agreement',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: isEs ? 'Plantilla de Acuerdo de Servicio Gratis' : 'Free Service Agreement Template' },
              },
            ],
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isEs ? 'Firmas Electrónicas con Validez Legal' : 'Legally Compliant Electronic Signatures',
              description: isEs
                ? `Firmas electrónicas con plena validez jurídica, con pista de auditoría SHA-256, registro de IP y marca de tiempo. Conforme a ${lawBadge}.`
                : `Legally binding e-signatures with SHA-256 audit trail, IP logging, and timestamp. Compliant with ${lawBadge}.`,
            },
          },
        ],
      },
    };

    const schemas: Record<string, unknown>[] = [
      organizationSchema,
      softwareSchema,
      productSchema,
      websiteSchema,
      serviceSchema,
    ];

    // The generic FAQPage below is written entirely around US law/market
    // specifics ("all 50 US states", ESIGN Act). Schema.org FAQPage content
    // must match what's actually visible on the page — emitting this
    // US-specific block on a LatAm country page would both misstate the
    // applicable law and duplicate/contradict that page's own real FAQ
    // (rendered via FAQAccordion with the country's actual law citation).
    // Only attach it for the default US/English case.
    if (!country && !isEs) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is Codec Document free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Codec Document offers a free plan with 2 structured legal documents and 2 free digital e-signatures every day — no credit card required. Unlike platforms that only let you sign flat PDFs you upload elsewhere, our intelligent editor lets you build NDA, lease agreements, and service contracts from scratch for free.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does Codec Document compare to DocuSign or PandaDoc?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Codec Document provides a free intelligent template editor that dynamically builds professional legal documents (NDA, leases, contracts) — not just a flat PDF uploader. You get free document generation plus ESIGN Act compliant e-signatures, all without a credit card. Premium plans start at $29.99/month for unlimited documents, cloud workspace, and unlimited remote signatures.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are e-signatures on Codec Document legally valid in the USA?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. All electronic signatures on Codec Document are fully compliant with the US Federal ESIGN Act (Electronic Signatures in Global and National Commerce Act) and UETA (Uniform Electronic Transactions Act). Every signature is backed by a SHA-256 cryptographic hash, IP address logging, biometric timestamp, and an immutable audit trail.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are the document templates valid in all 50 US states?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Our templates are structured with state-specific legal requirements for all 50 US states, including California, Texas, Florida, New York, and more. For complex transactions we recommend reviewing with a licensed attorney.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I preview the document before paying?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Absolutely. You can fill out the complete form and preview the entire document (with watermark) before any payment. Free users get 2 clean downloads every day; premium users get unlimited downloads with no watermarks.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is SHA-256 audit trail and why does it matter?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every document generated on Codec Document receives a SHA-256 cryptographic fingerprint — a unique hash that proves the document has not been altered since signing. This creates an immutable, court-admissible audit trail that satisfies ESIGN Act and UETA requirements.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are these legal documents better than AI-generated templates?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Our documents are created by legal professionals with state-specific clauses that comply with local laws. AI-generated templates often contain incomplete or contradictory terms and do not track jurisdiction-specific requirements. Codec Document combines professional legal structure with an intelligent editor that customizes content to your specific situation.',
            },
          },
        ],
      };
      schemas.push(faqSchema);
    }

    schemas.forEach((schema, index) => {
      const scriptId = `structured-data-${index}`;
      let el = document.getElementById(scriptId);
      if (!el) {
        el = document.createElement('script');
        el.id = scriptId;
        el.setAttribute('type', 'application/ld+json');
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(schema);
    });

    // Clean up any leftover script tag from a previous render that had one
    // more schema than this one (e.g. navigating from a US page with the
    // FAQPage block to a country page without it).
    let cleanupIndex = schemas.length;
    while (document.getElementById(`structured-data-${cleanupIndex}`)) {
      document.getElementById(`structured-data-${cleanupIndex}`)?.remove();
      cleanupIndex += 1;
    }

    return () => {
      schemas.forEach((_, index) => {
        document.getElementById(`structured-data-${index}`)?.remove();
      });
    };
  }, [language, country]);

  return null;
}
