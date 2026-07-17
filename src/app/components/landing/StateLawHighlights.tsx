import { motion } from 'motion/react';
import { Scale } from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';
import type { StateHighlight } from '../../data/state-seo-content';

/** Real, state-specific legal facts (deposit limits, notice periods, e-signature
 * statutes) — not generic filler — so each state page is genuinely
 * differentiated content, not a find-and-replace of the state name. */
export function StateLawHighlights({ stateName, stateNameEs, highlights }: {
  stateName: string;
  stateNameEs: string;
  highlights: StateHighlight[];
}) {
  const { language } = useLanguage();
  return (
    <section className="relative bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              <Scale className="size-3.5" />
              {language === 'en' ? 'State Law Highlights' : 'Aspectos Legales del Estado'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
              {language === 'en' ? `What ${stateName} law says` : `Lo que dice la ley de ${stateNameEs}`}
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((h, idx) => (
              <motion.div
                key={h.titleEn}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="mb-2 text-sm font-black uppercase tracking-wide text-indigo-600">
                  {language === 'en' ? h.titleEn : h.titleEs}
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  {language === 'en' ? h.factEn : h.factEs}
                </p>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            {language === 'en'
              ? 'Laws change frequently — always consult a licensed local attorney before executing a legal document.'
              : 'Las leyes cambian con frecuencia — consulta siempre con un abogado local antes de ejecutar un documento legal.'}
          </p>
        </div>
      </div>
    </section>
  );
}
