import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';

const STATES = [
  { slug: 'california', en: 'California', es: 'California' },
  { slug: 'texas', en: 'Texas', es: 'Texas' },
  { slug: 'florida', en: 'Florida', es: 'Florida' },
  { slug: 'new-york', en: 'New York', es: 'Nueva York' },
  { slug: 'illinois', en: 'Illinois', es: 'Illinois' },
  { slug: 'pennsylvania', en: 'Pennsylvania', es: 'Pensilvania' },
];

/** Links a document-type landing page (nda-generator.tsx,
 * online-lease-agreement.tsx) down into its 6 state-specific variants —
 * completes the hub-and-spoke: document-type page ↔ state hub page ↔
 * document-type-in-state page, all cross-linked. */
export function StateQuickLinks({ docType, labelEn, labelEs }: {
  docType: 'nda' | 'lease-agreement'; labelEn: string; labelEs: string;
}) {
  const { language } = useLanguage();
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">
            {language === 'en' ? `${labelEn} by state` : `${labelEs} por estado`}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {STATES.map((s) => (
              <a
                key={s.slug}
                href={`/${docType}-${s.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {language === 'en' ? s.en : s.es}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
