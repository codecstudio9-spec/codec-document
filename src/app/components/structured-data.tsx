import { useEffect } from 'react';
import { SITE_URL } from '../config/site';

export function StructuredData() {
  useEffect(() => {
    // ── Organization ──────────────────────────────────────────────────────────
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Codec Document',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'Free legal document generator and ESIGN Act compliant e-signature platform for the United States. Intelligent template editor for NDA, lease agreements, service contracts — no credit card required.',
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
      description:
        'Create, edit, and e-sign professional legal documents online. Free intelligent template editor for NDA, residential lease agreements, service contracts, and more. ESIGN Act & UETA compliant.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description:
            '2 free legal documents and 2 free e-signatures per day. Full access to intelligent template editor. No credit card required.',
          eligibleRegion: { '@type': 'Country', name: 'United States' },
        },
        {
          '@type': 'Offer',
          name: 'Monthly Plan',
          price: '79.99',
          priceCurrency: 'USD',
          description:
            'Unlimited legal documents, unlimited e-signatures, cloud workspace, priority support.',
          eligibleRegion: { '@type': 'Country', name: 'United States' },
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '214',
        bestRating: '5',
        worstRating: '1',
      },
    };

    // ── Product Schema ────────────────────────────────────────────────────────
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Professional Legal Document Templates',
      description:
        'Professional, legally-vetted document templates customized for all 50 US states. Free intelligent editor with instant preview. ESIGN Act & UETA compliant e-signature included.',
      brand: { '@type': 'Brand', name: 'Codec Document' },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '519.99',
        offerCount: '4',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '189',
      },
    };

    // ── WebSite ───────────────────────────────────────────────────────────────
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Codec Document',
      url: SITE_URL,
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
      serviceType: 'Legal Document Generator & Electronic Signature Platform',
      provider: { '@type': 'Organization', name: 'Codec Document' },
      areaServed: { '@type': 'Country', name: 'United States' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Legal Documents & E-Signatures',
        itemListElement: [
          {
            '@type': 'OfferCatalog',
            name: 'Free Legal Document Templates',
            itemListElement: [
              {
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: 'Free NDA Template — All 50 US States' },
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Free Residential Lease Agreement — California, Texas, Florida, New York',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: 'Free Independent Contractor Agreement',
                },
              },
              {
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: 'Free Service Agreement Template' },
              },
            ],
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'ESIGN Act Compliant Electronic Signatures',
              description:
                'Legally binding e-signatures with SHA-256 audit trail, IP logging, and biometric timestamp. Compliant with US Federal ESIGN Act and UETA.',
            },
          },
        ],
      },
    };

    // ── FAQPage ───────────────────────────────────────────────────────────────
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
            text: 'Codec Document provides a free intelligent template editor that dynamically builds professional legal documents (NDA, leases, contracts) — not just a flat PDF uploader. You get free document generation plus ESIGN Act compliant e-signatures, all without a credit card. Premium plans start at $79.99/month for unlimited documents, cloud workspace, and unlimited remote signatures.',
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

    const schemas = [
      organizationSchema,
      softwareSchema,
      productSchema,
      websiteSchema,
      serviceSchema,
      faqSchema,
    ];

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

    return () => {
      schemas.forEach((_, index) => {
        document.getElementById(`structured-data-${index}`)?.remove();
      });
    };
  }, []);

  return null;
}
