import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Camera, FileCheck, Download, MapPin, Scale,
  FileText, PenLine, ChevronDown, Users, Check,
} from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';

// ── Benefit cards (same 6 concepts on every landing — visual, not bullet list) ──
const DEFAULT_BENEFITS = [
  { icon: PenLine, en: 'Secure Signatures', es: 'Firmas Seguras' },
  { icon: Camera, en: 'Identity Verification', es: 'Verificación de Identidad' },
  { icon: FileCheck, en: 'Audit Trail', es: 'Pista de Auditoría' },
  { icon: Download, en: 'Instant PDF', es: 'PDF Instantáneo' },
  { icon: MapPin, en: 'Geolocation Evidence', es: 'Evidencia de Geolocalización' },
  { icon: Scale, en: 'Legal Compliance', es: 'Cumplimiento Legal' },
];

export function BenefitCards({ items }: { items?: Array<{ icon: typeof ShieldCheck; en: string; es: string }> }) {
  const { language } = useLanguage();
  const list = items ?? DEFAULT_BENEFITS;

  return (
    <section className="relative bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {list.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.en}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5 text-white" />
                  </div>
                  <p className="text-base font-black text-slate-900">
                    {language === 'en' ? item.en : item.es}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── "What's included" — reuses each page's own existing paragraph + bullet
// list (no new copy), just presented as cards instead of a plain <ul>. ──
export function IncludedCards({
  headingEn, headingEs, bodyEn, bodyEs, items, color,
}: {
  headingEn: string; headingEs: string; bodyEn: string; bodyEs: string;
  items: Array<{ en: string; es: string }>;
  color: string;
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
            <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
              {language === 'en' ? headingEn : headingEs}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500">
              {language === 'en' ? bodyEn : bodyEs}
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, idx) => (
              <motion.div
                key={item.en}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}1a` }}>
                  <Check className="size-3.5" style={{ color }} />
                </span>
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  {language === 'en' ? item.en : item.es}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works — same 4-step timeline copy already used on the Home page ──
const STEPS = [
  {
    icon: FileText, colorClass: 'from-blue-500 to-indigo-600', bgClass: 'bg-blue-50', borderClass: 'border-blue-100',
    titleEn: 'Fill the Form', titleEs: 'Llena el Formulario',
    descEn: "Select your template and fill in the parties' details. Get a real-time preview of your legal document.",
    descEs: 'Selecciona la plantilla y completa los datos de las partes. Previsualización en tiempo real.',
  },
  {
    icon: PenLine, colorClass: 'from-indigo-500 to-violet-600', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-100',
    titleEn: 'Sign Digitally', titleEs: 'Firma Digitalmente',
    descEn: 'Draw your e-signature or send a unique QR link to co-signers. Sign from any device, anywhere.',
    descEs: 'Dibuja tu firma electrónica o envía un enlace QR único a co-firmantes. Desde cualquier dispositivo.',
  },
  {
    icon: Camera, colorClass: 'from-violet-500 to-purple-600', bgClass: 'bg-violet-50', borderClass: 'border-violet-100',
    titleEn: 'Verify Identity', titleEs: 'Verifica Identidad',
    descEn: 'Capture a live selfie + ID photo. Biometric proof is embedded directly inside your signed PDF.',
    descEs: 'Captura selfie + foto de ID. La prueba biométrica queda embebida dentro del PDF firmado.',
  },
  {
    icon: Download, colorClass: 'from-emerald-500 to-teal-600', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100',
    titleEn: 'Download PDF', titleEs: 'Descarga el PDF',
    descEn: 'Receive a clean, watermark-free PDF with SHA-256 audit trail — court-admissible in all 50 states.',
    descEs: 'Recibe un PDF limpio con pista de auditoría SHA-256 — admisible en tribunales de los 50 estados.',
  },
];

export function HowItWorksTimeline({ lastStepDescEn, lastStepDescEs, headingEn, headingEs }: {
  /** Overrides just the last step's description — the default claims
   * "court-admissible in all 50 states", which is only accurate for the
   * US pages. LatAm pages pass their own jurisdiction-appropriate line. */
  lastStepDescEn?: string;
  lastStepDescEs?: string;
  headingEn?: string;
  headingEs?: string;
} = {}) {
  const { language } = useLanguage();
  const steps = lastStepDescEn || lastStepDescEs
    ? STEPS.map((s, i) => i === STEPS.length - 1
      ? { ...s, descEn: lastStepDescEn ?? s.descEn, descEs: lastStepDescEs ?? s.descEs }
      : s)
    : STEPS;
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              {language === 'en' ? 'Simple Process' : 'Proceso Simple'}
            </span>
            <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
              {language === 'en' ? (headingEn ?? 'Ready in 4 Steps') : (headingEs ?? 'Listo en 4 Pasos')}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <motion.div
                  key={s.titleEn}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={['relative border-2 rounded-2xl p-5 pt-9 md:rounded-3xl md:p-7 md:pt-10 transition-all hover:-translate-y-1 hover:shadow-xl', s.bgClass, s.borderClass].join(' ')}
                >
                  <div className={['absolute -top-5 left-6 flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-black text-white shadow-lg', s.colorClass].join(' ')}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  {idx < 3 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 border-t-2 border-dashed border-slate-300 lg:block" />
                  )}
                  <StepIcon className="mb-4 size-7 text-slate-700" />
                  <h3 className="mb-2 text-lg font-black text-slate-900">
                    {language === 'en' ? s.titleEn : s.titleEs}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {language === 'en' ? s.descEn : s.descEs}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Social proof — no invented numbers or client names, per instruction ──
export function SocialProofBand({ complianceItems, taglineEn, taglineEs }: {
  /** Defaults to the US-specific ESIGN/UETA chips — override for pages
   * targeting a different jurisdiction (e.g. the LatAm country pages). */
  complianceItems?: string[];
  taglineEn?: string;
  taglineEs?: string;
} = {}) {
  const { language } = useLanguage();
  const compliance = complianceItems ?? [
    'ESIGN Act Compliant', 'UETA Compliant', 'SHA-256 Audit Trail', 'SSL / TLS Encrypted',
  ];
  return (
    <section className="relative overflow-hidden bg-slate-950 py-14 text-white md:py-20">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.14), transparent)' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-5 inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-1.5 text-xs font-bold text-white/60 backdrop-blur-sm">
            <Users className="size-3.5" />
            {language === 'en' ? 'Trusted Nationwide' : 'Confianza a Nivel Nacional'}
          </div>
          <p className="text-lg font-semibold leading-relaxed text-white/80 sm:text-xl">
            {language === 'en'
              ? (taglineEn ?? 'Used by freelancers, landlords, agencies and small businesses across the United States.')
              : (taglineEs ?? 'Usado por freelancers, propietarios, agencias y pequeños negocios en todo Estados Unidos.')}
          </p>
        </motion.div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-3 border-t border-white/8 pt-8">
          {compliance.map((c) => (
            <span key={c} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white/60 backdrop-blur-sm">
              <ShieldCheck className="mr-1.5 inline size-3 text-emerald-400" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ accordion (content passed in — reuse existing copy, no new writing) ──
export interface FaqItem { qEn: string; qEs: string; aEn: string; aEs: string }

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const { language } = useLanguage();
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-bold text-slate-900 sm:text-base">
          {language === 'en' ? item.qEn : item.qEs}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
              {language === 'en' ? item.aEn : item.aEs}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQAccordion({ items, heading }: { items: FaqItem[]; heading?: ReactNode }) {
  const { language } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="relative bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            {heading ?? (
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
                {language === 'en' ? 'Frequently Asked Questions' : 'Preguntas Frecuentes'}
              </h2>
            )}
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <AccordionItem
                key={item.qEn}
                item={item}
                isOpen={openIdx === idx}
                onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Shared FAQ content — same copy already in structured-data.tsx's
// FAQPage schema (kept in sync there for JSON-LD), now also rendered
// visibly here instead of only existing invisibly for search engines. ──
export const DEFAULT_FAQ: FaqItem[] = [
  {
    qEn: 'Is Codec Document free to use?',
    qEs: '¿Es gratis usar Codec Document?',
    aEn: 'Yes. Codec Document offers a free plan with 2 structured legal documents and 2 free digital e-signatures every day — no credit card required. Unlike platforms that only let you sign flat PDFs you upload elsewhere, our intelligent editor lets you build NDA, lease agreements, and service contracts from scratch for free.',
    aEs: 'Sí. Codec Document ofrece un plan gratuito con 2 documentos legales estructurados y 2 firmas electrónicas gratis cada día — sin tarjeta de crédito. A diferencia de plataformas que solo permiten firmar PDFs planos que subes desde otro lado, nuestro editor inteligente te deja construir NDA, contratos de arrendamiento y de servicios desde cero, gratis.',
  },
  {
    qEn: 'Are e-signatures on Codec Document legally valid in the USA?',
    qEs: '¿Las firmas electrónicas de Codec Document son legalmente válidas en EE. UU.?',
    aEn: 'Yes. All electronic signatures on Codec Document are fully compliant with the US Federal ESIGN Act (Electronic Signatures in Global and National Commerce Act) and UETA (Uniform Electronic Transactions Act). Every signature is backed by a SHA-256 cryptographic hash, IP address logging, biometric timestamp, and an immutable audit trail.',
    aEs: 'Sí. Todas las firmas electrónicas en Codec Document cumplen totalmente con la Ley Federal ESIGN de EE. UU. (Electronic Signatures in Global and National Commerce Act) y con UETA (Uniform Electronic Transactions Act). Cada firma está respaldada por un hash criptográfico SHA-256, registro de dirección IP, marca de tiempo biométrica y una pista de auditoría inmutable.',
  },
  {
    qEn: 'Are the document templates valid in all 50 US states?',
    qEs: '¿Las plantillas de documentos son válidas en los 50 estados de EE. UU.?',
    aEn: 'Our templates are structured with state-specific legal requirements for all 50 US states, including California, Texas, Florida, New York, and more. For complex transactions we recommend reviewing with a licensed attorney.',
    aEs: 'Nuestras plantillas están estructuradas con requisitos legales específicos por estado para los 50 estados de EE. UU., incluyendo California, Texas, Florida, Nueva York y más. Para transacciones complejas recomendamos revisión con un abogado licenciado.',
  },
  {
    qEn: 'Can I preview the document before paying?',
    qEs: '¿Puedo ver el documento antes de pagar?',
    aEn: 'Absolutely. You can fill out the complete form and preview the entire document (with watermark) before any payment. Free users get 2 clean downloads every day; premium users get unlimited downloads with no watermarks.',
    aEs: 'Claro que sí. Puedes llenar el formulario completo y previsualizar todo el documento (con marca de agua) antes de cualquier pago. Los usuarios gratuitos obtienen 2 descargas limpias cada día; los usuarios premium obtienen descargas ilimitadas sin marcas de agua.',
  },
  {
    qEn: 'What is SHA-256 audit trail and why does it matter?',
    qEs: '¿Qué es la pista de auditoría SHA-256 y por qué importa?',
    aEn: 'Every document generated on Codec Document receives a SHA-256 cryptographic fingerprint — a unique hash that proves the document has not been altered since signing. This creates an immutable, court-admissible audit trail that satisfies ESIGN Act and UETA requirements.',
    aEs: 'Cada documento generado en Codec Document recibe una huella criptográfica SHA-256 — un hash único que prueba que el documento no ha sido alterado desde su firma. Esto crea una pista de auditoría inmutable y admisible en tribunales que cumple con los requisitos de ESIGN Act y UETA.',
  },
  {
    qEn: 'How does Codec Document compare to DocuSign or PandaDoc?',
    qEs: '¿Cómo se compara Codec Document con DocuSign o PandaDoc?',
    aEn: 'Codec Document provides a free intelligent template editor that dynamically builds professional legal documents (NDA, leases, contracts) — not just a flat PDF uploader. You get free document generation plus ESIGN Act compliant e-signatures, all without a credit card. Premium plans start at $29.99/month for unlimited documents, cloud workspace, and unlimited remote signatures.',
    aEs: 'Codec Document ofrece un editor inteligente de plantillas gratuito que construye dinámicamente documentos legales profesionales (NDA, arrendamientos, contratos) — no solo un cargador de PDFs planos. Obtienes generación de documentos gratis más firmas electrónicas conformes a ESIGN, todo sin tarjeta de crédito. Los planes premium comienzan en $29.99/mes para documentos ilimitados, espacio en la nube y firmas remotas ilimitadas.',
  },
];
