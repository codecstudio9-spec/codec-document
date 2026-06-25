import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  FileText,
  Home,
  Briefcase,
  Car,
  FileCheck,
  DollarSign,
  Shield,
  ArrowRight,
  Star,
  Clock,
} from 'lucide-react';
import { DocumentTemplate } from '../types/document';
import { useLanguage } from '../contexts/language-context';
import { getDocumentTranslation } from '../data/document-translations';

interface DocumentBentoGridProps {
  documents: DocumentTemplate[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'residential-lease': Home,
  'nda': Shield,
  'independent-contractor': Briefcase,
  'bill-of-sale-vehicle': Car,
  'service-agreement': FileCheck,
  'promissory-note': DollarSign,
};

export function DocumentBentoGrid({ documents }: DocumentBentoGridProps) {
  const { language } = useLanguage();

  const getIcon = (docId: string) => ICON_MAP[docId] || FileText;

  return (
    <section id="documents-section" className="py-14 bg-slate-50 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">

          {/* Section Header */}
          <div className="text-center mb-10 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium mb-6"
            >
              <Star className="size-4 text-yellow-500 fill-yellow-500" />
              {language === 'en' ? 'Professional Legal Templates' : 'Plantillas Legales Profesionales'}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-3 md:mb-4"
            >
              {language === 'en' ? 'Choose Your Document' : 'Elige Tu Documento'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-slate-600 max-w-3xl mx-auto md:text-xl"
            >
              {language === 'en'
                ? 'Generate, sign and verify for free — download your professional PDF when ready.'
                : 'Genera, firma y verifica gratis — descarga tu PDF profesional cuando estes listo.'}
            </motion.p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.slice(0, 6).map((doc, idx) => {
              const Icon = getIcon(doc.id);
              const translatedName = getDocumentTranslation(doc.id, 'name', language);
              const translatedDesc = getDocumentTranslation(doc.id, 'desc', language);

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  /* 3-D depth: lift on hover, no rotation */
                  whileHover={{ y: -10, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
                  className="cursor-pointer"
                  style={{
                    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.11))',
                  }}
                >
                  <Link to={`/generator/${doc.id}`} className="block h-full">
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-indigo-200 hover:shadow-[0_20px_60px_rgba(99,102,241,0.18),0_4px_16px_rgba(0,0,0,0.06)]"
                      style={{ boxShadow: '0 6px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)' }}
                    >
                      {/* Top gradient accent on hover */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-indigo-500/60 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {/* Hover background tint */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl" />

                      <div className="relative flex flex-1 flex-col p-6">
                        {/* Icon & Free Badge */}
                        <div className="mb-4 flex items-start justify-between">
                          <div
                            className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 transition-all duration-300 group-hover:shadow-[0_8px_24px_rgba(99,102,241,0.45)]"
                            style={{ boxShadow: '0 4px 14px rgba(99,102,241,0.32)' }}
                          >
                            <Icon className="size-6 text-white" />
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                            {language === 'en' ? 'Free to Start' : 'Comienza Gratis'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors duration-200 group-hover:text-indigo-700">
                          {translatedName || doc.name}
                        </h3>

                        {/* Description */}
                        <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">
                          {translatedDesc || doc.description}
                        </p>

                        {/* Features */}
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="size-4 shrink-0 text-emerald-500" />
                            <span>{language === 'en' ? 'Instant preview' : 'Vista previa instantánea'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <FileCheck className="size-4 shrink-0 text-blue-500" />
                            <span>
                              {doc.fields.length}{' '}
                              {language === 'en' ? 'customizable fields' : 'campos personalizables'}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-sm font-semibold text-indigo-600 transition-colors group-hover:text-indigo-700">
                            {language === 'en' ? 'Generate Free' : 'Generar Gratis'}
                          </span>
                          <div className="flex size-7 items-center justify-center rounded-full bg-indigo-50 transition-all duration-200 group-hover:bg-indigo-100">
                            <ArrowRight className="size-3.5 text-indigo-600 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Popular badge */}
                      {idx === 0 && (
                        <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-bold text-white shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                          {language === 'en' ? 'POPULAR' : 'POPULAR'}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {documents.length > 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 text-center"
            >
              <p className="text-slate-500">
                {language === 'en'
                  ? `+ ${documents.length - 6} more documents available`
                  : `+ ${documents.length - 6} documentos más disponibles`}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
